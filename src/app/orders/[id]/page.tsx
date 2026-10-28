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
  Box,
  Edit2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Operational Action states
  const [confirming, setConfirming] = useState(false);

  // Pack Order states
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [packing, setPacking] = useState(false);
  const [packForm, setPackForm] = useState({
    packageCount: 2,
    grossWeightKg: 14.5,
    sealNumbers: 'SEAL-MIE-8841, SEAL-MIE-8842',
    packingNotes: 'Inspected 400 TC luxury linens; packed with moisture-resistant interior wrap.',
  });

  // Dispatch states
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    carrier: 'BlueDart Express',
    trackingNumber: 'BD-2026-98124',
    packageCount: 2,
    dispatchNotes: 'Fragile white hospitality linen boxes',
    lines: [] as Array<{ skuId: string; qty: number; maxQty: number; sku: string }>,
  });

  // Super Admin Edit Order states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    notes: '',
    requiredDispatchDate: '',
    expectedDeliveryDate: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });

  // Cancel state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer modified banquet requirements');
  const [cancelling, setCancelling] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [orderRes, meRes] = await Promise.all([
        fetch(`/api/v1/orders/${orderId}`),
        fetch('/api/v1/auth/me'),
      ]);

      const json = await orderRes.json();
      if (!orderRes.ok) throw new Error(json.error?.message || 'Failed to load order');

      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.data || null);
      }

      const ord = json.data.order;
      setOrder(ord);
      setShipments(json.data.shipments || []);
      setReturns(json.data.returns || []);
      setMovements(json.data.movements || []);

      // Pre-fill pack form if exists
      if (ord.packingDetails) {
        setPackForm({
          packageCount: ord.packingDetails.packageCount || 1,
          grossWeightKg: ord.packingDetails.grossWeightKg || 10,
          sealNumbers: ord.packingDetails.sealNumbers || '',
          packingNotes: ord.packingDetails.packingNotes || '',
        });
      }

      // Pre-fill edit form
      setEditForm({
        notes: ord.notes || '',
        requiredDispatchDate: ord.requiredDispatchDate ? new Date(ord.requiredDispatchDate).toISOString().split('T')[0] : '',
        expectedDeliveryDate: ord.expectedDeliveryDate ? new Date(ord.expectedDeliveryDate).toISOString().split('T')[0] : '',
        street: ord.shipToSnapshot?.street || '',
        city: ord.shipToSnapshot?.city || '',
        state: ord.shipToSnapshot?.state || '',
        postalCode: ord.shipToSnapshot?.postalCode || '',
      });

      // Initialize dispatch form lines
      if (ord.lines) {
        setDispatchForm((prev) => ({
          ...prev,
          packageCount: ord.packingDetails?.packageCount || prev.packageCount,
          lines: ord.lines.map((l: any) => ({
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

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

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
      setSuccessMsg('Order confirmed and stock successfully reserved!');
      fetchOrderDetail();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handlePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPacking(true);
      setErrorMsg(null);
      const res = await fetch(`/api/v1/orders/${orderId}/pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageCount: Number(packForm.packageCount),
          grossWeightKg: Number(packForm.grossWeightKg),
          sealNumbers: packForm.sealNumbers,
          packingNotes: packForm.packingNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to pack order');
      }
      setSuccessMsg(`Order packed successfully (${packForm.packageCount} cartons). Ready for dispatch!`);
      setPackModalOpen(false);
      fetchOrderDetail();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setPacking(false);
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

      setSuccessMsg('Dispatch shipment recorded successfully!');
      setDispatchModalOpen(false);
      fetchOrderDetail();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDispatching(false);
    }
  };

  const handleEditOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEditing(true);
      setErrorMsg(null);
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: editForm.notes,
          requiredDispatchDate: editForm.requiredDispatchDate || undefined,
          expectedDeliveryDate: editForm.expectedDeliveryDate || undefined,
          shipToSnapshot: {
            street: editForm.street,
            city: editForm.city,
            state: editForm.state,
            postalCode: editForm.postalCode,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update order');
      }
      setSuccessMsg('Order details updated by Super Admin!');
      setEditModalOpen(false);
      fetchOrderDetail();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setEditing(false);
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
      setSuccessMsg('Order cancelled and reserved stock restored.');
      setCancelModalOpen(false);
      fetchOrderDetail();
      setTimeout(() => setSuccessMsg(null), 4000);
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
  const isPacked = order.status === 'PACKED';
  const isPartiallyFulfilled = order.status === 'PARTIALLY_FULFILLED';
  const isFulfilled = order.status === 'FULFILLED';
  const isCancelled = order.status === 'CANCELLED';

  const canPack = isConfirmed || isPacked;
  const canDispatch = isPacked || isConfirmed || isPartiallyFulfilled;
  const canCancel = isDraft || isConfirmed || isPacked || isPartiallyFulfilled;

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
          {/* Step 1 Action: Confirm */}
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

          {/* Step 2 Action: Pack Order */}
          {canPack && (
            <button
              onClick={() => setPackModalOpen(true)}
              className="btn-primary bg-[#171B18] text-[#A7F432] hover:bg-stone-800 text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
            >
              <Box className="w-4 h-4 text-[#A7F432]" />
              <span>{isPacked ? 'Update Packing Details' : 'Pack Order & Inspect'}</span>
            </button>
          )}

          {/* Step 3 Action: Dispatch */}
          {canDispatch && (
            <button
              onClick={() => setDispatchModalOpen(true)}
              className="btn-secondary text-xs py-2 px-4 shadow-sm hover:border-lime-500 flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4 text-stone-600" />
              <span>Record Dispatch Shipment</span>
            </button>
          )}

          {/* Super Admin Edit Action */}
          {isSuperAdmin && (
            <button
              onClick={() => setEditModalOpen(true)}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 hover:bg-stone-50 text-stone-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Edit Order</span>
            </button>
          )}

          {/* Cancel */}
          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="btn-secondary text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-300 py-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4-Stage Operational Lifecycle Bar */}
      <div className="card-surface p-4 bg-white border border-[#E7EBE7]">
        <div className="grid grid-cols-2 sm:grid-cols-4 text-center text-xs font-semibold gap-2">
          <div className={`p-2 rounded-lg ${isDraft ? 'bg-stone-100 text-stone-900 font-bold ring-1 ring-stone-300' : 'text-stone-400'}`}>
            1. Draft Order
          </div>
          <div className={`p-2 rounded-lg ${isConfirmed ? 'bg-blue-50 text-blue-800 font-bold ring-1 ring-blue-300' : isPacked || isPartiallyFulfilled || isFulfilled ? 'text-stone-500' : 'text-stone-300'}`}>
            2. Confirmed & Reserved
          </div>
          <div className={`p-2 rounded-lg ${isPacked ? 'bg-cyan-50 text-cyan-800 font-bold ring-1 ring-cyan-300' : isPartiallyFulfilled || isFulfilled ? 'text-stone-500' : 'text-stone-300'}`}>
            3. Packed & Sealed
          </div>
          <div className={`p-2 rounded-lg ${isPartiallyFulfilled || isFulfilled ? 'bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-300' : 'text-stone-300'}`}>
            4. Dispatched / Fulfilled
          </div>
        </div>
      </div>

      {/* Packaging & Quality Check Record Card (Appears once packed) */}
      {order.packingDetails && (
        <div className="card-surface p-5 bg-gradient-to-r from-cyan-50/70 to-emerald-50/40 border border-cyan-200/80 rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-100">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-700" />
              <h3 className="font-bold text-xs text-cyan-950 uppercase tracking-wider">
                Packaging & Carton Verification Record
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-cyan-800 bg-white/80 px-2 py-0.5 rounded-full border border-cyan-200">
              Verified & Packed
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs">
            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-medium">Cartons / Boxes</span>
              <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                {order.packingDetails.packageCount || 1} Box{order.packingDetails.packageCount === 1 ? '' : 'es'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-medium">Gross Weight</span>
              <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                {order.packingDetails.grossWeightKg ? `${order.packingDetails.grossWeightKg} kg` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-medium">QA / Seal Numbers</span>
              <span className="font-mono font-bold text-stone-900 mt-0.5 block truncate">
                {order.packingDetails.sealNumbers || 'Standard Quality Seal'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-medium">Packed By</span>
              <span className="font-medium text-stone-800 mt-0.5 block">
                {order.packingDetails.packedBy || 'Warehouse Team'}
              </span>
            </div>
          </div>
          {order.packingDetails.packingNotes && (
            <p className="mt-3 text-[11px] text-stone-600 bg-white/60 p-2.5 rounded-xl border border-cyan-100">
              <strong className="font-semibold text-stone-800">Inspection Note:</strong> {order.packingDetails.packingNotes}
            </p>
          )}
        </div>
      )}

      {/* Order Context Cards (Customer & Warehouse) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Box */}
        <div className="card-surface p-5 bg-white space-y-2 border border-[#E7EBE7]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Customer & Delivery Details
          </span>
          <h3 className="font-bold text-sm text-stone-900">
            {order.customerSnapshot?.companyName}
          </h3>
          <p className="text-xs text-stone-600">
            Attn: {order.customerSnapshot?.contactName} • {order.customerSnapshot?.phone}
          </p>
          <div className="text-xs text-stone-500 pt-2 border-t border-stone-100">
            <span className="font-semibold text-stone-700 block mb-0.5">Delivery Address:</span>
            <span>
              {order.shipToSnapshot?.street}, {order.shipToSnapshot?.city}, {order.shipToSnapshot?.state} - {order.shipToSnapshot?.postalCode}
            </span>
          </div>
        </div>

        {/* Fulfillment Center Box */}
        <div className="card-surface p-5 bg-white space-y-2 border border-[#E7EBE7]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Fulfillment Facility & Schedule
          </span>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-stone-500" />
            <h3 className="font-bold text-sm text-stone-900">
              {order.warehouseId?.name} ({order.warehouseId?.code})
            </h3>
          </div>
          <p className="text-xs text-stone-600">
            {order.warehouseId?.address}, {order.warehouseId?.city}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-stone-500 pt-2 border-t border-stone-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Target Dispatch:</span>
              <span className="font-medium text-stone-800">
                {order.requiredDispatchDate ? new Date(order.requiredDispatchDate).toLocaleDateString('en-IN') : 'Standard'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Expected Arrival:</span>
              <span className="font-medium text-stone-800">
                {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN') : 'Standard'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Line Items Table */}
      <div className="card-surface bg-white overflow-hidden border border-[#E7EBE7]">
        <div className="p-4 border-b border-[#E7EBE7] flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700">
            Allocated Order Items ({order.lines?.length || 0})
          </h3>
          <span className="text-xs text-stone-400 font-mono">Currency: {order.currency}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] text-stone-500 border-b border-[#E7EBE7] uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 font-bold">Product / SKU</th>
                <th className="py-3 px-4 font-bold">Specifications</th>
                <th className="py-3 px-4 font-bold text-right">Ordered</th>
                <th className="py-3 px-4 font-bold text-right">Reserved</th>
                <th className="py-3 px-4 font-bold text-right">Dispatched</th>
                <th className="py-3 px-4 font-bold text-right">Unit Price</th>
                <th className="py-3 px-4 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EBE7]">
              {order.lines?.map((line: any) => (
                <tr key={line.skuId} className="hover:bg-stone-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-stone-900 block">{line.skuSnapshot?.name}</span>
                    <span className="font-mono text-[11px] text-stone-500">{line.skuSnapshot?.sku}</span>
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    <span>{line.skuSnapshot?.variantName || '-'}</span>
                    {line.skuSnapshot?.threadCount && (
                      <span className="block text-[11px] text-stone-400">{line.skuSnapshot.threadCount} TC</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-stone-900">
                    {line.orderedQty}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-blue-700">
                    {line.reservedQty}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                    {line.dispatchedQty}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-stone-700">
                    ₹{(line.unitPriceMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                    ₹{(line.lineTotalMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="p-4 bg-stone-50/50 border-t border-[#E7EBE7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <div className="text-stone-500">
            {order.notes && (
              <p>
                <strong className="text-stone-700">Order Notes:</strong> {order.notes}
              </p>
            )}
          </div>
          <div className="w-full sm:w-64 space-y-1.5 text-right font-mono">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span>₹{(order.subtotalMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>GST / Tax:</span>
              <span>₹{(order.taxTotalMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-stone-900 pt-1.5 border-t border-stone-200">
              <span>Grand Total:</span>
              <span>₹{(order.grandTotalMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched Shipments History */}
      {shipments.length > 0 && (
        <div className="card-surface bg-white p-5 space-y-3 border border-[#E7EBE7]">
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-2">
            <Truck className="w-4 h-4 text-stone-500" />
            <span>Dispatched Shipments ({shipments.length})</span>
          </h3>
          <div className="space-y-2">
            {shipments.map((s: any) => (
              <div key={s._id} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900">{s.shipmentNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      {s.carrier}
                    </span>
                  </div>
                  <span className="text-stone-500 text-[11px]">
                    Tracking: <strong>{s.trackingNumber}</strong> • {s.packageCount} carton(s) • Dispatched {new Date(s.dispatchedAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">By {s.dispatchedBy}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PACK ORDER MODAL */}
      {packModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#171B18] text-[#A7F432] font-black text-xs flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Step 3: Pack & Quality Check</h3>
                  <span className="text-[10px] text-stone-400">Order {order.orderNumber}</span>
                </div>
              </div>
              <button onClick={() => setPackModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePackSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Cartons / Boxes Count</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={packForm.packageCount}
                    onChange={(e) => setPackForm({ ...packForm, packageCount: Number(e.target.value) })}
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Gross Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={packForm.grossWeightKg}
                    onChange={(e) => setPackForm({ ...packForm, grossWeightKg: Number(e.target.value) })}
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Security Seal Numbers</label>
                <input
                  type="text"
                  placeholder="e.g. SEAL-MIE-8841, SEAL-MIE-8842"
                  value={packForm.sealNumbers}
                  onChange={(e) => setPackForm({ ...packForm, sealNumbers: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Quality Inspection & Packing Notes</label>
                <textarea
                  rows={2}
                  value={packForm.packingNotes}
                  onChange={(e) => setPackForm({ ...packForm, packingNotes: e.target.value })}
                  className="input-field text-xs"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setPackModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={packing}
                  className="btn-primary text-xs font-bold shadow-sm"
                >
                  {packing ? 'Packing Order...' : 'Confirm Packing & Ready for Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH SHIPMENT MODAL */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-stone-700" />
                <span>Step 4: Dispatch Shipment</span>
              </h3>
              <button onClick={() => setDispatchModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Logistics Partner / Carrier</label>
                  <input
                    type="text"
                    required
                    value={dispatchForm.carrier}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, carrier: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Waybill / LR Tracking No.</label>
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
                <label className="font-medium text-stone-700 block mb-1">Number of Cartons</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={dispatchForm.packageCount}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, packageCount: Number(e.target.value) })}
                  className="input-field font-mono"
                />
              </div>

              {/* Items Allocation */}
              <div>
                <label className="font-medium text-stone-700 block mb-2">Quantities to Ship Now</label>
                <div className="space-y-2 border border-stone-200 rounded-xl p-3 bg-stone-50/50">
                  {dispatchForm.lines.map((line, idx) => (
                    <div key={line.skuId} className="flex items-center justify-between gap-3 text-xs">
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

      {/* SUPER ADMIN EDIT ORDER MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#171B18] text-[#A7F432] font-black text-xs flex items-center justify-center">
                  <Edit2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Edit Order Parameters</h3>
                  <span className="text-[10px] text-stone-400">Super Admin Privilege</span>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditOrderSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Order Notes / Banquet Instructions</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Required Dispatch Date</label>
                  <input
                    type="date"
                    value={editForm.requiredDispatchDate}
                    onChange={(e) => setEditForm({ ...editForm, requiredDispatchDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={editForm.expectedDeliveryDate}
                    onChange={(e) => setEditForm({ ...editForm, expectedDeliveryDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Delivery Destination Address
                </span>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={editForm.street}
                    onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      value={editForm.postalCode}
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="btn-primary text-xs font-bold shadow-sm"
                >
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
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
