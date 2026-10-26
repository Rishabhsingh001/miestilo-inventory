'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Check, X, Building2, Package } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function CustomerReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [reason, setReason] = useState('Excess stock from completed conference banquet');
  const [disposition, setDisposition] = useState<'RESTOCK' | 'QUARANTINE' | 'SCRAP'>('RESTOCK');
  const [returnQty, setReturnQty] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/returns');
      const json = await res.json();
      if (json.data) setReturns(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
    fetch('/api/v1/orders')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          // Orders that have at least some units dispatched
          const eligible = res.data.filter(
            (o: any) =>
              o.lines?.some((l: any) => l.dispatchedQty > (l.returnedQty || 0))
          );
          setOrders(eligible);
          if (eligible.length > 0) {
            setSelectedOrderId(eligible[0]._id);
          }
        }
      });
  }, []);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const targetOrder = orders.find((o) => o._id === selectedOrderId);
      if (!targetOrder) throw new Error('Selected order not found.');

      const eligibleLine = targetOrder.lines.find(
        (l: any) => l.dispatchedQty > (l.returnedQty || 0)
      );
      if (!eligibleLine) throw new Error('No eligible dispatched lines on this order.');

      const payload = {
        orderId: targetOrder._id,
        reason,
        items: [
          {
            skuId: eligibleLine.skuId,
            qty: Number(returnQty),
            condition: 'Clean, unwashed hotel packaging intact',
            disposition,
          },
        ],
      };

      const res = await fetch('/api/v1/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to process return');

      setModalOpen(false);
      fetchReturns();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Customer Linen Returns & Inspection
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Accept returned goods, classify physical condition, and direct to Restock, Quarantine, or Scrap.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Customer Return</span>
        </button>
      </div>

      {/* Returns Table */}
      <div className="card-surface bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Return #</th>
                <th className="py-3 px-4 font-semibold">Order Reference</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Return Reason</th>
                <th className="py-3 px-4 font-semibold">Items & Disposition</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Received Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Loading customer returns...
                  </td>
                </tr>
              ) : returns.length > 0 ? (
                returns.map((r) => {
                  const line = r.lines[0];
                  return (
                    <tr key={r._id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {r.returnNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-stone-800">
                        {r.orderId?.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-900">
                        {r.customerId?.companyName}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate">
                        {r.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-stone-900 block">
                          {line?.qty} units ({line?.disposition})
                        </span>
                        <span className="text-[10px] text-stone-400 block font-mono">
                          {line?.skuId?.sku || 'SKU'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right text-stone-500 font-mono text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No returns recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Return Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Record Customer Return</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-stone-700 block mb-1">Eligible Dispatched Order</label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="input-field cursor-pointer font-mono"
                >
                  {orders.length > 0 ? (
                    orders.map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.orderNumber} — {o.customerSnapshot?.companyName}
                      </option>
                    ))
                  ) : (
                    <option value="">No dispatched orders available</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Return Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={returnQty}
                    onChange={(e) => setReturnQty(Number(e.target.value))}
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Stock Disposition</label>
                  <select
                    value={disposition}
                    onChange={(e: any) => setDisposition(e.target.value)}
                    className="input-field cursor-pointer font-medium"
                  >
                    <option value="RESTOCK">Restock (Add to Available)</option>
                    <option value="QUARANTINE">Quarantine (Inspection)</option>
                    <option value="SCRAP">Scrap / Write-off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Reason for Return</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || orders.length === 0}
                  className="btn-primary text-xs"
                >
                  {submitting ? 'Processing...' : 'Accept & Post Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
