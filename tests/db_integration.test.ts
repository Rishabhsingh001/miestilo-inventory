import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/connection';
import { ProductVariant } from '../src/models/ProductVariant';
import { Warehouse } from '../src/models/Warehouse';
import { Customer } from '../src/models/Customer';
import { StockBalance, calculateAvailable } from '../src/models/StockBalance';
import { StockMovement } from '../src/models/StockMovement';
import { SalesOrder } from '../src/models/SalesOrder';
import { StockReceipt } from '../src/models/StockReceipt';
import { postReceipt, reconcileBalances } from '../src/services/inventory.service';
import { confirmOrder, cancelOrder, dispatchShipment } from '../src/services/order.service';
import { SessionUser } from '../src/lib/auth/session';

describe('Database Integration Tests', () => {
  let warehouseId: string;
  let variantId: string;
  let customer: any;

  const mockUser: SessionUser = {
    id: 'user-test-01',
    email: 'admin@misteriolifestyle.com',
    name: 'Aakash Verma',
    role: 'SUPER_ADMIN',
  };

  beforeAll(async () => {
    await connectToDatabase();
    const wh = await Warehouse.findOne({ code: 'WH-DEL-01' });
    const pv = await ProductVariant.findOne({ sku: 'ML-BS-400-WHT-K' });
    const cust = await Customer.findOne();

    expect(wh).toBeDefined();
    expect(pv).toBeDefined();
    expect(cust).toBeDefined();

    warehouseId = wh!._id.toString();
    variantId = pv!._id.toString();
    customer = cust!;
  });

  it('verifies initial seeded stock balance for luxury king sheet', async () => {
    const balance = await StockBalance.findOne({ skuId: variantId, warehouseId });
    expect(balance).toBeDefined();
    expect(balance!.onHand).toBeGreaterThanOrEqual(50);
    const available = calculateAvailable(balance!);
    expect(available).toBeGreaterThanOrEqual(0);
  });

  it('posts an inward receipt and records immutable ledger movement', async () => {
    const initialBalance = await StockBalance.findOne({ skuId: variantId, warehouseId });
    const prevOnHand = initialBalance?.onHand || 0;

    const receipt = await StockReceipt.create({
      receiptNumber: `ML-RCP-TEST-${Date.now()}`,
      warehouseId,
      status: 'DRAFT',
      supplierName: 'Trident Mills Ltd',
      createdBy: mockUser.name,
      lines: [
        {
          skuId: variantId,
          quantity: 25,
          unitCostMinor: 115000,
        },
      ],
    });

    const result = await postReceipt(receipt._id.toString(), mockUser);
    expect(result.receipt.status).toBe('POSTED');

    const updatedBalance = await StockBalance.findOne({ skuId: variantId, warehouseId });
    expect(updatedBalance!.onHand).toBe(prevOnHand + 25);

    const movement = await StockMovement.findOne({
      referenceId: result.receipt.receiptNumber,
      skuId: variantId,
    });
    expect(movement).toBeDefined();
    expect(movement!.quantityDelta).toBe(25);
    expect(movement!.type).toBe('RECEIPT');
  });

  it('confirms order, reserves stock atomically, and dispatches shipment', async () => {
    const initialBalance = await StockBalance.findOne({ skuId: variantId, warehouseId });
    const initialReserved = initialBalance?.reserved || 0;
    const initialOnHand = initialBalance?.onHand || 0;

    // Create Draft Order directly with valid snapshots
    const order = await SalesOrder.create({
      orderNumber: `ML-ORD-TEST-${Date.now()}`,
      customerId: customer._id,
      customerSnapshot: {
        customerCode: customer.customerCode,
        companyName: customer.companyName,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
      },
      shipToSnapshot: {
        street: 'Taj Lands End Main Store, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050',
      },
      warehouseId,
      status: 'DRAFT',
      orderDate: new Date(),
      lines: [
        {
          skuId: variantId,
          skuSnapshot: {
            sku: 'ML-BS-400-WHT-K',
            name: 'Misterio Luxury 400TC Hotel Bedsheet',
            variantName: 'King - Optical White (108x108")',
            unit: 'PIECE',
          },
          orderedQty: 10,
          reservedQty: 0,
          dispatchedQty: 0,
          returnedQty: 0,
          unitPriceMinor: 249900,
          discountMinor: 0,
          taxRatePercent: 12,
          taxAmountMinor: 29988,
          lineTotalMinor: 279888,
        },
      ],
      subtotalMinor: 2499000,
      discountTotalMinor: 0,
      taxTotalMinor: 299880,
      grandTotalMinor: 2798880,
      createdBy: mockUser.name,
    });

    expect(order.status).toBe('DRAFT');

    // 1. Confirm Order -> Atomically reserves 10 units
    const confirmed = await confirmOrder(order._id.toString(), mockUser);
    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.lines[0].reservedQty).toBe(10);

    const reservedBalance = await StockBalance.findOne({ skuId: variantId, warehouseId });
    expect(reservedBalance!.reserved).toBe(initialReserved + 10);

    // 2. Dispatch Shipment -> Consumes reservation, deducts on-hand, records DISPATCH movement
    const { shipment } = await dispatchShipment(
      order._id.toString(),
      {
        carrier: 'BlueDart Express',
        trackingNumber: 'BD-TEST-0099',
        lines: [{ skuId: variantId, qty: 10 }],
      },
      mockUser
    );

    expect(shipment.status).toBe('DISPATCHED');
    expect(shipment.lines[0].qty).toBe(10);

    const dispatchedBalance = await StockBalance.findOne({ skuId: variantId, warehouseId });
    expect(dispatchedBalance!.reserved).toBe(initialReserved);
    expect(dispatchedBalance!.onHand).toBe(initialOnHand - 10);

    // 3. Verify Order updated to FULFILLED
    const refreshed = await SalesOrder.findById(order._id);
    expect(refreshed!.status).toBe('FULFILLED');
    expect(refreshed!.lines[0].dispatchedQty).toBe(10);
  });

  it('confirms and cancels an order, properly releasing reservations', async () => {
    const initialBalance = await StockBalance.findOne({ skuId: variantId, warehouseId });
    const initialReserved = initialBalance?.reserved || 0;

    const order = await SalesOrder.create({
      orderNumber: `ML-ORD-CNCL-${Date.now()}`,
      customerId: customer._id,
      customerSnapshot: {
        customerCode: customer.customerCode,
        companyName: customer.companyName,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
      },
      shipToSnapshot: {
        street: 'Taj Lands End Main Store, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050',
      },
      warehouseId,
      status: 'DRAFT',
      orderDate: new Date(),
      lines: [
        {
          skuId: variantId,
          skuSnapshot: {
            sku: 'ML-BS-400-WHT-K',
            name: 'Misterio Luxury 400TC Hotel Bedsheet',
            variantName: 'King - Optical White (108x108")',
            unit: 'PIECE',
          },
          orderedQty: 5,
          reservedQty: 0,
          dispatchedQty: 0,
          returnedQty: 0,
          unitPriceMinor: 249900,
          discountMinor: 0,
          taxRatePercent: 12,
          taxAmountMinor: 14994,
          lineTotalMinor: 139944,
        },
      ],
      subtotalMinor: 1249500,
      discountTotalMinor: 0,
      taxTotalMinor: 149940,
      grandTotalMinor: 1399440,
      createdBy: mockUser.name,
    });

    await confirmOrder(order._id.toString(), mockUser);

    const confirmedBalance = await StockBalance.findOne({ skuId: variantId, warehouseId });
    expect(confirmedBalance!.reserved).toBe(initialReserved + 5);

    // Cancel order
    const cancelled = await cancelOrder(
      order._id.toString(),
      'Hotel client requested project delay',
      mockUser
    );
    expect(cancelled.status).toBe('CANCELLED');

    const releasedBalance = await StockBalance.findOne({ skuId: variantId, warehouseId });
    expect(releasedBalance!.reserved).toBe(initialReserved);
  });

  it('runs reconciliation check across warehouses and validates ledger sum equality', async () => {
    const report = await reconcileBalances(warehouseId);
    expect(report.totalChecked).toBeGreaterThanOrEqual(1);
    expect(report.discrepanciesCount).toBe(0);
  });
});
