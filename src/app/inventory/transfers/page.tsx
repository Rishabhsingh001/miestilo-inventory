'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Check, Truck, X, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [skus, setSkus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    notes: 'Replenishing northern regional depot',
    lines: [{ skuId: '', quantity: 20 }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/inventory/transfers');
      const json = await res.json();
      if (json.data) setTransfers(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetch('/api/v1/warehouses')
      .then((r) => r.json())
      .then((res) => {
        if (res.data && res.data.length >= 2) {
          setWarehouses(res.data);
          setFormData((prev) => ({
            ...prev,
            sourceWarehouseId: res.data[0]._id,
            destinationWarehouseId: res.data[1]._id,
          }));
        }
      });
    fetch('/api/v1/products')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          const allVariants = res.data.flatMap((p: any) => p.variants || []);
          setSkus(allVariants);
          if (allVariants.length > 0) {
            setFormData((prev) => ({
              ...prev,
              lines: [{ skuId: allVariants[0]._id, quantity: 20 }],
            }));
          }
        }
      });
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await fetch('/api/v1/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create transfer');
      setModalOpen(false);
      fetchTransfers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/v1/inventory/transfers/${id}/dispatch`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to dispatch transfer');
      fetchTransfers();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReceive = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/v1/inventory/transfers/${id}/receive`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to receive transfer');
      fetchTransfers();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Inter-Warehouse Transfers
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Relocate hotel linen stock between distribution centers with in-transit tracking.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="card-surface bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Transfer #</th>
                <th className="py-3 px-4 font-semibold">Origin & Destination</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Timeline</th>
                <th className="py-3 px-4 font-semibold text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Loading transfers...
                  </td>
                </tr>
              ) : transfers.length > 0 ? (
                transfers.map((t) => {
                  const totalUnits = t.lines.reduce((s: number, l: any) => s + l.quantity, 0);
                  return (
                    <tr key={t._id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {t.transferNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-stone-800">
                          <span>{t.sourceWarehouseId?.name}</span>
                          <ArrowLeftRight className="w-3 h-3 text-stone-400" />
                          <span>{t.destinationWarehouseId?.name}</span>
                        </div>
                        {t.notes && <span className="text-[10px] text-stone-500 block">{t.notes}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-900 font-mono">
                          {totalUnits} units
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          across {t.lines.length} SKU lines
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                        {t.status === 'RECEIVED' ? (
                          <span>Received by {t.receivedBy}</span>
                        ) : t.status === 'IN_TRANSIT' ? (
                          <span>Dispatched by {t.dispatchedBy}</span>
                        ) : (
                          <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {t.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDispatch(t._id)}
                            disabled={actionLoadingId === t._id}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{actionLoadingId === t._id ? 'Dispatching...' : 'Dispatch'}</span>
                          </button>
                        )}
                        {t.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => handleReceive(t._id)}
                            disabled={actionLoadingId === t._id}
                            className="btn-primary text-xs py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{actionLoadingId === t._id ? 'Receiving...' : 'Mark Received'}</span>
                          </button>
                        )}
                        {t.status === 'RECEIVED' && (
                          <span className="text-xs text-emerald-700 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No transfers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Create Warehouse Transfer</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Source Warehouse (Origin)</label>
                  <select
                    required
                    value={formData.sourceWarehouseId}
                    onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
                    className="input-field cursor-pointer"
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Destination Warehouse</label>
                  <select
                    required
                    value={formData.destinationWarehouseId}
                    onChange={(e) => setFormData({ ...formData, destinationWarehouseId: e.target.value })}
                    className="input-field cursor-pointer"
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <span className="font-bold text-stone-900 block mb-2">Item to Transfer</span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="text-[11px] text-stone-600 block mb-1">SKU</label>
                    <select
                      required
                      value={formData.lines[0].skuId}
                      onChange={(e) => {
                        const copy = [...formData.lines];
                        copy[0].skuId = e.target.value;
                        setFormData({ ...formData, lines: copy });
                      }}
                      className="input-field cursor-pointer font-mono"
                    >
                      {skus.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.sku} — {s.variantName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-600 block mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.lines[0].quantity}
                      onChange={(e) => {
                        const copy = [...formData.lines];
                        copy[0].quantity = Number(e.target.value);
                        setFormData({ ...formData, lines: copy });
                      }}
                      className="input-field font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Transfer Notes / Waybill</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? 'Creating...' : 'Create Draft Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
