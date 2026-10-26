import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/connection';
import { User } from '../src/models/User';
import { Category } from '../src/models/Category';
import { Warehouse } from '../src/models/Warehouse';
import { Product } from '../src/models/Product';
import { ProductVariant } from '../src/models/ProductVariant';
import { Customer } from '../src/models/Customer';
import { StockBalance } from '../src/models/StockBalance';
import { StockMovement } from '../src/models/StockMovement';
import { SalesOrder } from '../src/models/SalesOrder';
import { Shipment } from '../src/models/Shipment';
import { getNextSequence } from '../src/models/Counter';

export async function runSeed() {
  console.log('[Seed] Connecting to database...');
  await connectToDatabase();

  console.log('[Seed] Clearing existing collections for clean seed...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Warehouse.deleteMany({}),
    Product.deleteMany({}),
    ProductVariant.deleteMany({}),
    Customer.deleteMany({}),
    StockBalance.deleteMany({}),
    StockMovement.deleteMany({}),
    SalesOrder.deleteMany({}),
    Shipment.deleteMany({}),
  ]);

  console.log('[Seed] Creating demo users...');
  const passwordHash = await bcrypt.hash('Misterio@2026', 10);
  const users = await User.create([
    {
      name: 'Rishabh Singh (Owner)',
      email: 'owner@miestilo.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    {
      name: 'Aakash Verma (Operations)',
      email: 'admin@miestilo.com',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    {
      name: 'Sunil Sharma (Inventory)',
      email: 'inventory@miestilo.com',
      passwordHash,
      role: 'INVENTORY_MANAGER',
      isActive: true,
    },
    {
      name: 'Pooja Iyer (Sales)',
      email: 'sales@miestilo.com',
      passwordHash,
      role: 'SALES_MANAGER',
      isActive: true,
    },
    {
      name: 'Ramesh Patel (Warehouse)',
      email: 'warehouse@miestilo.com',
      passwordHash,
      role: 'WAREHOUSE_STAFF',
      isActive: true,
    },
  ]);

  console.log('[Seed] Creating categories...');
  const categories = await Category.create([
    { name: 'Bedsheets', slug: 'bedsheets', description: 'Hotel-grade high thread-count bedsheets' },
    { name: 'Towels', slug: 'towels', description: 'Plush combed cotton bath and hand towels' },
    { name: 'Pillow Covers', slug: 'pillow-covers', description: 'Satin stripe and percale pillowcases' },
    { name: 'Duvets', slug: 'duvets', description: 'Hypoallergenic microfiber and down duvets' },
    { name: 'Duvet Covers', slug: 'duvet-covers', description: 'Durable crisp hotel duvet enclosures' },
    { name: 'Bed Runners', slug: 'bed-runners', description: 'Decorative bed runners and accents' },
    { name: 'Bath Mats', slug: 'bath-mats', description: 'High-absorbency ribbed hotel bath mats' },
    { name: 'Other Hotel Linen', slug: 'other-hotel-linen', description: 'Napkins, pool towels, and robes' },
  ]);

  console.log('[Seed] Creating warehouses...');
  const warehouses = await Warehouse.create([
    {
      code: 'WH-BOM-01',
      name: 'Mumbai Central Distribution Hub',
      address: 'Plot 42, Marol Industrial Area, Andheri East',
      city: 'Mumbai',
      contactName: 'Ramesh Patel',
      contactPhone: '+91 98200 12345',
      isActive: true,
      locations: [
        { code: 'A1-01', zone: 'A', aisle: '1', shelf: '01' },
        { code: 'A1-02', zone: 'A', aisle: '1', shelf: '02' },
        { code: 'B2-01', zone: 'B', aisle: '2', shelf: '01' },
      ],
    },
    {
      code: 'WH-DEL-01',
      name: 'Delhi Northern Regional Depot',
      address: 'Phase III, Okhla Industrial Area',
      city: 'New Delhi',
      contactName: 'Vikram Mehta',
      contactPhone: '+91 98110 54321',
      isActive: true,
      locations: [
        { code: 'D1-01', zone: 'D', aisle: '1', shelf: '01' },
        { code: 'D1-02', zone: 'D', aisle: '1', shelf: '02' },
      ],
    },
  ]);

  console.log('[Seed] Creating products and variants (SKUs)...');
  // 1. 400TC Bedsheet
  const bedsheetCat = categories.find((c: any) => c.slug === 'bedsheets')!;
  const pBedsheet = await Product.create({
    name: 'miestilo Luxury 400TC Hotel Bedsheet',
    slug: 'miestilo-luxury-400tc-bedsheet',
    categoryId: bedsheetCat._id,
    description: '100% Egyptian Cotton Sateen weave, 400 Thread Count, silky smooth finish',
    brand: 'miestilo Lifestyle',
    unit: 'PIECE',
    reorderLevel: 25,
    defaultSellingPriceMinor: 219900, // Rs 2,199.00
    defaultCostMinor: 115000, // Rs 1,150.00
  });

  const skusBedsheet = await ProductVariant.create([
    {
      productId: pBedsheet._id,
      sku: 'ML-BS-400-WHT-Q',
      variantName: 'Queen - Optical White (90x100")',
      attributes: { size: 'Queen', color: 'Optical White', fabric: '100% Cotton', threadCount: 400, weave: 'Sateen' },
      sellingPriceMinor: 219900,
      costMinor: 115000,
      reorderLevel: 30,
    },
    {
      productId: pBedsheet._id,
      sku: 'ML-BS-400-WHT-K',
      variantName: 'King - Optical White (108x108")',
      attributes: { size: 'King', color: 'Optical White', fabric: '100% Cotton', threadCount: 400, weave: 'Sateen' },
      sellingPriceMinor: 249900,
      costMinor: 130000,
      reorderLevel: 25,
    },
    {
      productId: pBedsheet._id,
      sku: 'ML-BS-400-IVR-K',
      variantName: 'King - Warm Ivory (108x108")',
      attributes: { size: 'King', color: 'Warm Ivory', fabric: '100% Cotton', threadCount: 400, weave: 'Sateen' },
      sellingPriceMinor: 249900,
      costMinor: 130000,
      reorderLevel: 15,
    },
  ]);

  // 2. 600 GSM Towels
  const towelCat = categories.find((c: any) => c.slug === 'towels')!;
  const pTowel = await Product.create({
    name: 'miestilo Royal 600 GSM Plush Bath Towel',
    slug: 'miestilo-royal-600-gsm-towel',
    categoryId: towelCat._id,
    description: 'Zero-twist Turkish cotton 600 GSM bath towel designed for 5-star hospitality laundering cycles',
    brand: 'miestilo Lifestyle',
    unit: 'PIECE',
    reorderLevel: 40,
    defaultSellingPriceMinor: 89900,
    defaultCostMinor: 42000,
  });

  const skusTowel = await ProductVariant.create([
    {
      productId: pTowel._id,
      sku: 'ML-TW-600-WHT-BT',
      variantName: 'Bath Towel 75x150cm - Pure White',
      attributes: { size: '75x150cm', color: 'Pure White', fabric: '100% Combed Cotton', gsm: 600, weave: 'Terry' },
      sellingPriceMinor: 89900,
      costMinor: 42000,
      reorderLevel: 50,
    },
    {
      productId: pTowel._id,
      sku: 'ML-TW-600-GRY-BT',
      variantName: 'Bath Towel 75x150cm - Slate Grey',
      attributes: { size: '75x150cm', color: 'Slate Grey', fabric: '100% Combed Cotton', gsm: 600, weave: 'Terry' },
      sellingPriceMinor: 94900,
      costMinor: 45000,
      reorderLevel: 30,
    },
    {
      productId: pTowel._id,
      sku: 'ML-TW-600-WHT-HT',
      variantName: 'Hand Towel 40x70cm - Pure White',
      attributes: { size: '40x70cm', color: 'Pure White', fabric: '100% Combed Cotton', gsm: 600, weave: 'Terry' },
      sellingPriceMinor: 39900,
      costMinor: 18000,
      reorderLevel: 40,
    },
  ]);

  // 3. Duvet Inserts
  const duvetCat = categories.find((c: any) => c.slug === 'duvets')!;
  const pDuvet = await Product.create({
    name: 'miestilo Cloud Microfiber Duvet Insert 350 GSM',
    slug: 'miestilo-cloud-microfiber-duvet',
    categoryId: duvetCat._id,
    description: 'Hypoallergenic hollow-fiber fill with boxed baffle-stitch construction',
    brand: 'miestilo Lifestyle',
    unit: 'PIECE',
    reorderLevel: 15,
    defaultSellingPriceMinor: 329900,
    defaultCostMinor: 175000,
  });

  const skusDuvet = await ProductVariant.create([
    {
      productId: pDuvet._id,
      sku: 'ML-DV-350-WHT-K',
      variantName: 'King Size (100x108") - 350 GSM White',
      attributes: { size: 'King', color: 'White', fabric: 'Microfiber Shell', gsm: 350 },
      sellingPriceMinor: 349900,
      costMinor: 185000,
      reorderLevel: 20,
    },
    {
      productId: pDuvet._id,
      sku: 'ML-DV-350-WHT-Q',
      variantName: 'Queen Size (90x100") - 350 GSM White',
      attributes: { size: 'Queen', color: 'White', fabric: 'Microfiber Shell', gsm: 350 },
      sellingPriceMinor: 309900,
      costMinor: 165000,
      reorderLevel: 15,
    },
  ]);

  const allVariants = [...skusBedsheet, ...skusTowel, ...skusDuvet];

  console.log('[Seed] Populating initial stock balances and ledger movements...');
  const bomWarehouse = warehouses[0];
  const delWarehouse = warehouses[1];

  for (const v of allVariants) {
    const bomQty = 120 + Math.floor(Math.random() * 80);
    const delQty = 60 + Math.floor(Math.random() * 40);

    // BOM Stock Balance
    await StockBalance.create({
      skuId: v._id,
      warehouseId: bomWarehouse._id,
      onHand: bomQty,
      reserved: 0,
      damaged: 0,
      quarantined: 0,
    });

    const mov1 = await getNextSequence('stock_movement', 'ML-MOV');
    await StockMovement.create({
      movementNumber: mov1,
      type: 'RECEIPT',
      skuId: v._id,
      warehouseId: bomWarehouse._id,
      quantityDelta: bomQty,
      reservedDelta: 0,
      referenceType: 'RECEIPT',
      referenceId: 'ML-REC-INITIAL',
      reasonCode: 'OPENING_BALANCE',
      notes: 'Initial warehouse opening stock receipt',
      actorUserId: users[0]._id.toString(),
      actorName: users[0].name,
      occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    // DEL Stock Balance
    await StockBalance.create({
      skuId: v._id,
      warehouseId: delWarehouse._id,
      onHand: delQty,
      reserved: 0,
      damaged: 0,
      quarantined: 0,
    });

    const mov2 = await getNextSequence('stock_movement', 'ML-MOV');
    await StockMovement.create({
      movementNumber: mov2,
      type: 'RECEIPT',
      skuId: v._id,
      warehouseId: delWarehouse._id,
      quantityDelta: delQty,
      reservedDelta: 0,
      referenceType: 'RECEIPT',
      referenceId: 'ML-REC-INITIAL',
      reasonCode: 'OPENING_BALANCE',
      notes: 'Initial northern warehouse opening stock receipt',
      actorUserId: users[0]._id.toString(),
      actorName: users[0].name,
      occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });
  }

  console.log('[Seed] Creating hospitality customers...');
  const customers = await Customer.create([
    {
      customerCode: 'CUST-0001',
      companyName: 'Taj Lands End Hotel',
      contactName: 'Rohit Kulkarni (Procurement Dir)',
      email: 'procurement@tajlandsend.local',
      phone: '+91 22 6668 1234',
      billingAddress: 'BJ Road, Bandstand, Bandra West, Mumbai 400050',
      shippingAddresses: [
        {
          label: 'Taj Lands End Main Store',
          street: 'BJ Road, Bandstand, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400050',
          isDefault: true,
        },
      ],
      taxId: '27AABCT3518Q1ZV',
      notes: 'Prefers 400TC White Sateen and 600 GSM bath towels. Weekly deliveries.',
      isActive: true,
    },
    {
      customerCode: 'CUST-0002',
      companyName: 'The Oberoi New Delhi',
      contactName: 'Kavita Menon (Head of Housekeeping)',
      email: 'housekeeping@oberoidelhi.local',
      phone: '+91 11 2436 3030',
      billingAddress: 'Dr. Zakir Hussain Marg, New Delhi 110003',
      shippingAddresses: [
        {
          label: 'The Oberoi Linen Receiving Dock',
          street: 'Dr. Zakir Hussain Marg',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110003',
          isDefault: true,
        },
      ],
      taxId: '07AABCE2209L1Z5',
      notes: 'Zero defect tolerance. Deliveries accepted Mon-Wed mornings.',
      isActive: true,
    },
    {
      customerCode: 'CUST-0003',
      companyName: 'JW Marriott Hotel Mumbai Juhu',
      contactName: 'Arjun Singhania (Supply Chain)',
      email: 'supply@jwmarriottjuhu.local',
      phone: '+91 22 6693 3000',
      billingAddress: 'Juhu Tara Road, Juhu, Mumbai 400049',
      shippingAddresses: [
        {
          label: 'JW Marriott Juhu Receiving Gate 2',
          street: 'Juhu Tara Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400049',
          isDefault: true,
        },
      ],
      taxId: '27AABCI4819M1ZY',
      notes: 'High volume partner.',
      isActive: true,
    },
  ]);

  console.log('[Seed] Creating demo sales orders with shipments...');
  // 1. Confirmed Order for Taj Lands End
  const taj = customers[0];
  const orderNumber1 = await getNextSequence('sales_order', 'ML-ORD');
  const variant1 = skusBedsheet[0];
  const variant2 = skusTowel[0];

  const line1Qty = 25;
  const line2Qty = 40;

  const order1 = await SalesOrder.create({
    orderNumber: orderNumber1,
    customerId: taj._id,
    customerSnapshot: {
      customerCode: taj.customerCode,
      companyName: taj.companyName,
      contactName: taj.contactName,
      email: taj.email,
      phone: taj.phone,
    },
    shipToSnapshot: {
      street: taj.shippingAddresses[0].street,
      city: taj.shippingAddresses[0].city,
      state: taj.shippingAddresses[0].state,
      postalCode: taj.shippingAddresses[0].postalCode,
    },
    warehouseId: bomWarehouse._id,
    orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'CONFIRMED',
    lines: [
      {
        skuId: variant1._id,
        skuSnapshot: {
          sku: variant1.sku,
          name: pBedsheet.name,
          variantName: variant1.variantName,
          unit: 'PIECE',
          size: 'Queen',
          color: 'Optical White',
          fabric: '100% Cotton',
          threadCount: 400,
        },
        orderedQty: line1Qty,
        reservedQty: line1Qty,
        dispatchedQty: 0,
        returnedQty: 0,
        unitPriceMinor: variant1.sellingPriceMinor,
        discountMinor: 0,
        taxRatePercent: 12,
        taxAmountMinor: Math.round((line1Qty * variant1.sellingPriceMinor * 12) / 100),
        lineTotalMinor: Math.round(line1Qty * variant1.sellingPriceMinor * 1.12),
      },
      {
        skuId: variant2._id,
        skuSnapshot: {
          sku: variant2.sku,
          name: pTowel.name,
          variantName: variant2.variantName,
          unit: 'PIECE',
          size: '75x150cm',
          color: 'Pure White',
          fabric: '100% Cotton',
          gsm: 600,
        },
        orderedQty: line2Qty,
        reservedQty: line2Qty,
        dispatchedQty: 0,
        returnedQty: 0,
        unitPriceMinor: variant2.sellingPriceMinor,
        discountMinor: 0,
        taxRatePercent: 12,
        taxAmountMinor: Math.round((line2Qty * variant2.sellingPriceMinor * 12) / 100),
        lineTotalMinor: Math.round(line2Qty * variant2.sellingPriceMinor * 1.12),
      },
    ],
    currency: 'INR',
    subtotalMinor: line1Qty * variant1.sellingPriceMinor + line2Qty * variant2.sellingPriceMinor,
    discountTotalMinor: 0,
    taxTotalMinor: Math.round(
      ((line1Qty * variant1.sellingPriceMinor + line2Qty * variant2.sellingPriceMinor) * 12) / 100
    ),
    grandTotalMinor: Math.round(
      (line1Qty * variant1.sellingPriceMinor + line2Qty * variant2.sellingPriceMinor) * 1.12
    ),
    notes: 'Urgent restocking for weekend guest arrivals.',
    createdBy: users[3].name,
    confirmedBy: users[3].name,
    confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });

  // Update reservations in balance
  await StockBalance.findOneAndUpdate(
    { skuId: variant1._id, warehouseId: bomWarehouse._id },
    { $inc: { reserved: line1Qty } }
  );
  await StockBalance.findOneAndUpdate(
    { skuId: variant2._id, warehouseId: bomWarehouse._id },
    { $inc: { reserved: line2Qty } }
  );

  console.log('[Seed] Database seeding completed successfully.');
  return {
    usersCount: users.length,
    categoriesCount: categories.length,
    warehousesCount: warehouses.length,
    productsCount: 3,
    variantsCount: allVariants.length,
    customersCount: customers.length,
    ordersCount: 1,
  };
}

// Run directly if called as a script
if (require.main === module) {
  runSeed()
    .then((res) => {
      console.log('[Seed Done]', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
