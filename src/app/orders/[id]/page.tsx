'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileText,
  CheckCircle2,
  Truck,
  RotateCcw,
  XCircle,
  ArrowLeft,
  Building2,
  Calendar,
  AlertTriangle,
  Package,
  Layers,
  X,
  Plus,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Action states
  const [confirming, setConfirming] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    carrier: 'BlueDart Express',
    trackingNumber: 'BD-2026-98124',
    packageCount: 2,
    dispatchNotes: 'Fragile white hospitality linen boxes',
    lines: [] as Array<{ skuId: string; qty: number; maxQty: number; sku: string }>,
  });

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer modified banquet requirements');
  const [cancelling, setCancelling] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/v1/orders/${orderId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to load order');

      setOrder(json.data.order);
      setShipments(json.data.shipments || []);
      setReturns(json.data.returns || []);
      setMovements(json.data.movements || []);

      // Initialize dispatch form lines
      if (json.data.order?.lines) {
        setDispatchForm((prev) => ({
          ...prev,
          lines: json.data.order.lines.map((l: any) => ({
            skuId: l.skuId,
            qty: Math.max(0, l.orderedQty - l.dispatchedQty),
            maxQty: Math.max(0, l.orderedQty - l.dispatchedQty),
            sku: l.skuSnapshot?.sku || 'SKU',
          })),
        }));
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrderDetail();
  }, [orderId]);

  const handleConfirmOrder = async () => {
    try {
      setConfirming(true);
      setErrorMsg(null);
      const res = await fetch(`/api/v1/orders/${orderId}/confirm`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to confirm order');
      }
      fetchOrderDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDispatching(true);
      setErrorMsg(null);

      const itemsToShip = dispatchForm.lines
        .filter((l) => l.qty > 0)
        .map((l) => ({ skuId: l.skuId, qty: Number(l.qty) }));

      if (itemsToShip.length === 0) {
        throw new Error('Please specify at least 1 unit to dispatch.');
      }

      const res = await fetch(`/api/v1/orders/${orderId}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier: dispatchForm.carrier,
          trackingNumber: dispatchForm.trackingNumber,
          packageCount: Number(dispatchForm.packageCount),
          dispatchNotes: dispatchForm.dispatchNotes,
          lines: itemsToShip,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to dispatch shipment');
      }

      setDispatchModalOpen(false);
      fetchOrderDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDispatching(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      setErrorMsg(null);
      const res = await fetch(`/api/v1/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to cancel order');
      }
      setCancelModalOpen(false);
      fetchOrderDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="card-surface p-16 text-center text-xs text-stone-400 bg-white">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card-surface p-12 text-center text-xs text-rose-600 bg-white space-y-2">
        <p>Order not found.</p>
        <Link href="/orders" className="btn-secondary text-xs">
          Return to Orders List
        </Link>
      </div>
    );
  }

  const isDraft = order.status === 'DRAFT';
  const isConfirmed = order.status === 'CONFIRMED' || order.status === 'PICKING';
  const isPartiallyFulfilled = order.status === 'PARTIALLY_FULFILLED';
  const isFulfilled = order.status === 'FULFILLED';
  const isCancelled = order.status === 'CANCELLED';

  const canDispatch = isConfirmed || isPartiallyFulfilled;
  const canCancel = isDraft || isConfirmed || isPartiallyFulfilled;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-mono">
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Ordered on {new Date(order.orderDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} • Created by {order.createdBy}
            </p>
          </div>
        </div>

        {/* Operational Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isDraft && (
            <button
              onClick={handleConfirmOrder}
              disabled={confirming}
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{confirming ? 'Checking Stock & Reserving...' : 'Confirm Order & Reserve Stock'}</span>
            </button>
          )}

          {canDispatch && (
            <button
              onClick={() => setDispatchModalOpen(true)}
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              <Truck className="w-4 h-4" />
              <span>Record Dispatch Shipment</span>
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="btn-secondary text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-300 py-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Lifecycle Progress Bar */}
      <div className="card-surface p-4 bg-white">
        <div className="grid grid-cols-4 text-center text-xs font-semibold">
          <div className={`p-2 rounded-lg ${isDraft ? 'bg-stone-100 text-stone-900 font-bold' : 'text-stone-400'}`}>
            1. Draft Order
          </div>
          <div className={`p-2 rounded-lg ${isConfirmed ? 'bg-blue-50 text-blue-800 font-bold' : isPartiallyFulfilled || isFulfilled ? 'text-stone-500' : 'text-stone-300'}`}>
            2. Confirmed (Stock Reserved)
          </div>
          <div className={`p-2 rounded-lg ${isPartiallyFulfilled ? 'bg-amber-50 text-amber-800 font-bold' : isFulfilled ? 'text-stone-500' : 'text-stone-300'}`}>
            3. Partially Dispatched
          </div>
          <div className={`p-2 rounded-lg ${isFulfilled ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-stone-300'}`}>
            4. Fulfilled (100% Shipped)
          </div>
        </div>
      </div>

      {/* Order Context Cards (Customer & Warehouse) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Box */}
        <div className="card-surface p-5 bg-white space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Customer & Delivery Details
          </span>
          <h3 className="font-bold text-sm text-stone-900">
            {order.customerSnapshot?.companyName}
          </h3>
          <p className="text-xs text-stone-600">
            Attn: {order.customerSnapshot?.contactName} • {order.customerSnapshot?.phone}
          </p>
          <div className="pt-2 text-xs text-stone-500 border-t border-stone-100">
            <span className="font-medium text-stone-700 block">Destination Address:</span>
            <span>{order.shipToSnapshot?.street}, {order.shipToSnapshot?.city}, {order.shipToSnapshot?.state} - {order.shipToSnapshot?.postalCode}</span>
          </div>
        </div>

        {/* Warehouse & Fulfillment Box */}
        <div className="card-surface p-5 bg-white space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Fulfillment Center
          </span>
          <h3 className="font-bold text-sm text-stone-900">
            {order.warehouseId?.name}
          </h3>
          <p className="text-xs text-stone-600">
            Code: <span className="font-mono">{order.warehouseId?.code}</span> • City: {order.warehouseId?.city}
          </p>
          <div className="pt-2 text-xs text-stone-500 border-t border-stone-100 flex items-center justify-between">
            <span>Payment / Total Amount:</span>
            <span className="font-mono font-bold text-base text-stone-900">
              ₹{(order.grandTotalMinor / 100).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Ordered Line Items Table */}
      <div className="card-surface bg-white overflow-hidden space-y-2 p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Ordered Linen Items & Quantities
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">SKU & Item Snapshot</th>
                <th className="py-2.5 px-3 font-semibold text-right">Ordered</th>
                <th className="py-2.5 px-3 font-semibold text-right">Reserved</th>
                <th className="py-2.5 px-3 font-semibold text-right">Dispatched</th>
                <th className="py-2.5 px-3 font-semibold text-right">Returned</th>
                <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                <th className="py-2.5 px-3 font-semibold text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {order.lines?.map((line: any) => (
                <tr key={line._id} className="hover:bg-stone-50/70">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-stone-900 block">
                      {line.skuSnapshot?.sku}
                    </span>
                    <span className="text-stone-700 block font-medium">
                      {line.skuSnapshot?.name}
                    </span>
                    <span className="text-[10px] text-stone-400 block">
                      {line.skuSnapshot?.variantName}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                    {line.orderedQty}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-blue-700">
                    {line.reservedQty}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                    {line.dispatchedQty}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-stone-400">
                    {line.returnedQty || '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-stone-700">
                    ₹{(line.unitPriceMinor / 100).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-stone-950">
                    ₹{(line.lineTotalMinor / 100).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipments History */}
      <div className="card-surface p-5 bg-white space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Shipments & Dispatch History ({shipments.length})
        </h2>
        {shipments.length > 0 ? (
          <div className="space-y-3">
            {shipments.map((s) => (
              <div
                key={s._id}
                className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {s.shipmentNumber}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <span className="text-stone-500 block mt-1">
                    Carrier: <span className="font-medium text-stone-800">{s.carrier}</span> • Tracking #: <span className="font-mono text-stone-800 font-semibold">{s.trackingNumber}</span> • {s.packageCount} Boxes
                  </span>
                  {s.dispatchNotes && (
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      Note: {s.dispatchNotes}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-medium text-stone-700 block">
                    Dispatched by {s.dispatchedBy}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {new Date(s.dispatchDate).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">No shipments dispatched yet.</p>
        )}
      </div>

      {/* Linked Stock Movements Timeline */}
      <div className="card-surface p-5 bg-white space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Linked Ledger Audit Events ({movements.length})
        </h2>
        {movements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2 font-semibold">Movement #</th>
                  <th className="py-2 font-semibold">Type</th>
                  <th className="py-2 font-semibold">Reference</th>
                  <th className="py-2 font-semibold text-right">Physical Delta</th>
                  <th className="py-2 font-semibold text-right">Reserved Delta</th>
                  <th className="py-2 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {movements.map((m) => (
                  <tr key={m._id} className="hover:bg-stone-50">
                    <td className="py-2 font-mono font-medium text-stone-900">{m.movementNumber}</td>
                    <td className="py-2"><StatusBadge status={m.type} /></td>
                    <td className="py-2 font-mono text-stone-500">{m.referenceType}: {m.referenceId}</td>
                    <td className="py-2 text-right font-mono font-bold text-stone-900">{m.quantityDelta}</td>
                    <td className="py-2 text-right font-mono font-medium text-amber-700">{m.reservedDelta}</td>
                    <td className="py-2 text-right text-stone-500 font-mono text-[11px]">
                      {new Date(m.occurredAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">No ledger events recorded yet.</p>
        )}
      </div>

      {/* Record Dispatch Modal */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Record Shipment Dispatch</h3>
              <button onClick={() => setDispatchModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Courier / Logistics</label>
                  <input
                    type="text"
                    required
                    value={dispatchForm.carrier}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, carrier: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Waybill / Tracking #</label>
                  <input
                    type="text"
                    required
                    value={dispatchForm.trackingNumber}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, trackingNumber: e.target.value })}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Package Count</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={dispatchForm.packageCount}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, packageCount: Number(e.target.value) })}
                  className="input-field"
                />
              </div>

              {/* Quantities to ship per line */}
              <div className="pt-2 border-t border-stone-100">
                <span className="font-bold text-stone-900 block mb-2">Quantities to Dispatch Now</span>
                <div className="space-y-2">
                  {dispatchForm.lines.map((line, idx) => (
                    <div
                      key={line.skuId}
                      className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-stone-900 block">{line.sku}</span>
                        <span className="text-[11px] text-stone-500">Max available to dispatch: {line.maxQty}</span>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          max={line.maxQty}
                          value={line.qty}
                          onChange={(e) => {
                            const copy = [...dispatchForm.lines];
                            copy[idx].qty = Number(e.target.value);
                            setDispatchForm({ ...dispatchForm, lines: copy });
                          }}
                          className="input-field font-mono font-bold text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Dispatch Notes</label>
                <input
                  type="text"
                  value={dispatchForm.dispatchNotes}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, dispatchNotes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatching}
                  className="btn-primary text-xs"
                >
                  {dispatching ? 'Dispatching...' : 'Confirm & Dispatch Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-stone-900">Cancel Sales Order</h3>
            <p className="text-xs text-stone-600">
              Cancelling this order will release all undispatched reserved quantities back into sellable available inventory.
            </p>

            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">Mandatory Cancellation Reason</label>
              <textarea
                rows={2}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="btn-primary bg-rose-600 hover:bg-rose-700 text-white text-xs"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
