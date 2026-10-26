'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Plus, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [skus, setSkus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    warehouseId: '',
    reasonCode: 'CYCLE_COUNT_DISCREPANCY',
    notes: 'Audit variance reconciliation after quarterly cycle count',
    lines: [{ skuId: '', targetBucket: 'onHand', deltaQuantity: -5 }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/inventory/adjustments');
      const json = await res.json();
      if (json.data) setAdjustments(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
    fetch('/api/v1/warehouses')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setWarehouses(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({ ...prev, warehouseId: res.data[0]._id }));
          }
        }
      });
    fetch('/api/v1/products?pageSize=100')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          const allVariants = res.data.flatMap((p: any) => p.variants || []);
          setSkus(allVariants);
          if (allVariants.length > 0) {
            setFormData((prev) => ({
              ...prev,
              lines: [{ skuId: allVariants[0]._id, targetBucket: 'onHand', deltaQuantity: -5 }],
            }));
          }
        }
      });
  }, []);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await fetch('/api/v1/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create adjustment');
      setModalOpen(false);
      fetchAdjustments();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostAdjustment = async (id: string) => {
    try {
      setPostingId(id);
      const res = await fetch(`/api/v1/inventory/adjustments/${id}/post`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to post adjustment');
      fetchAdjustments();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setPostingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Stock Adjustments & Damage
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Audited manual corrections, physical inventory cycle counts, and damaged stock write-offs.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Stock Adjustment</span>
        </button>
      </div>

      {/* Adjustments Table */}
      <div className="card-surface bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Adjustment #</th>
                <th className="py-3 px-4 font-semibold">Warehouse</th>
                <th className="py-3 px-4 font-semibold">Reason Code</th>
                <th className="py-3 px-4 font-semibold">SKU & Delta</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Loading adjustments...
                  </td>
                </tr>
              ) : adjustments.length > 0 ? (
                adjustments.map((a) => {
                  const line = a.lines[0];
                  const delta = line?.deltaQuantity || 0;
                  return (
                    <tr key={a._id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {a.adjustmentNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-800">
                        {a.warehouseId?.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-800 block">
                          {a.reasonCode.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-stone-500 block truncate max-w-xs">
                          {a.notes}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-stone-900 block">
                          {line?.skuId?.sku || 'SKU'}
                        </span>
                        <span className="font-mono text-xs font-bold text-rose-600 block">
                          {delta > 0 ? `+${delta}` : delta} units ({line?.targetBucket})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3.5 px-4 text-stone-500">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {a.status === 'DRAFT' ? (
                          <button
                            onClick={() => handlePostAdjustment(a._id)}
                            disabled={postingId === a._id}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{postingId === a._id ? 'Posting...' : 'Post Adjustment'}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-medium font-mono">
                            Posted by {a.postedBy}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No adjustments recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Adjustment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Create Stock Adjustment</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateAdjustment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Warehouse</label>
                  <select
                    required
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
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
                  <label className="font-medium text-stone-700 block mb-1">Reason Code</label>
                  <select
                    required
                    value={formData.reasonCode}
                    onChange={(e) => setFormData({ ...formData, reasonCode: e.target.value })}
                    className="input-field cursor-pointer font-medium"
                  >
                    <option value="CYCLE_COUNT_DISCREPANCY">Cycle Count Discrepancy</option>
                    <option value="DAMAGED_IN_WAREHOUSE">Damaged in Warehouse</option>
                    <option value="EXPIRED_DEFECTIVE">Defective / Stained Fabric</option>
                    <option value="FOUND_STOCK">Found Unrecorded Stock</option>
                    <option value="OTHER">Other Reason</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <span className="font-bold text-stone-900 block mb-2">Item Adjustment</span>
                <div className="space-y-3">
                  <div>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-stone-600 block mb-1">Target Bucket</label>
                      <select
                        value={formData.lines[0].targetBucket}
                        onChange={(e) => {
                          const copy = [...formData.lines];
                          copy[0].targetBucket = e.target.value;
                          setFormData({ ...formData, lines: copy });
                        }}
                        className="input-field cursor-pointer"
                      >
                        <option value="onHand">Sellable On-Hand</option>
                        <option value="damaged">Damaged Inventory</option>
                        <option value="quarantined">Quarantine Bucket</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-stone-600 block mb-1">Delta Quantity (Signed)</label>
                      <input
                        type="number"
                        required
                        value={formData.lines[0].deltaQuantity}
                        onChange={(e) => {
                          const copy = [...formData.lines];
                          copy[0].deltaQuantity = Number(e.target.value);
                          setFormData({ ...formData, lines: copy });
                        }}
                        className="input-field font-mono font-bold"
                        placeholder="e.g. -5 to deduct, +10 to add"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Mandatory Audit Note</label>
                <textarea
                  rows={2}
                  required
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  placeholder="Detail the root cause or count reconciliation..."
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
                  {submitting ? 'Creating...' : 'Create Draft Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
