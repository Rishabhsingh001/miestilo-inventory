'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Check, RefreshCw, X, PackagePlus, Building2 } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [skus, setSkus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    warehouseId: '',
    supplierName: 'Raymond Luxury Linen Mills',
    reference: 'PO-2026-INW-01',
    notes: 'Direct mill shipment of bulk hotel bedsheets and terry towels',
    lines: [{ skuId: '', quantity: 50 }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/inventory/receipts');
      const json = await res.json();
      if (json.data) setReceipts(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
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
              lines: [{ skuId: allVariants[0]._id, quantity: 50 }],
            }));
          }
        }
      });
  }, []);

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await fetch('/api/v1/inventory/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create receipt');
      setModalOpen(false);
      fetchReceipts();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReceipt = async (id: string) => {
    try {
      setPostingId(id);
      const res = await fetch(`/api/v1/inventory/receipts/${id}/post`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to post receipt');
      fetchReceipts();
    } catch (err: any) {
      alert('Error posting receipt: ' + err.message);
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
            Stock Inward Receipts
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Receive and verify supplier shipments into physical warehouse locations.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Inward Receipt</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="card-surface bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Receipt #</th>
                <th className="py-3 px-4 font-semibold">Destination Warehouse</th>
                <th className="py-3 px-4 font-semibold">Supplier / Source</th>
                <th className="py-3 px-4 font-semibold">Items & Qty</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Loading receipts...
                  </td>
                </tr>
              ) : receipts.length > 0 ? (
                receipts.map((r) => {
                  const totalUnits = r.lines.reduce((s: number, l: any) => s + l.quantity, 0);
                  const isDraft = r.status === 'DRAFT';
                  return (
                    <tr key={r._id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {r.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-800">
                        {r.warehouseId?.name}
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        <span className="font-medium block">{r.supplierName || 'Internal'}</span>
                        {r.reference && (
                          <span className="font-mono text-[10px] text-stone-400 block">
                            Ref: {r.reference}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-900 font-mono">
                          {totalUnits} units
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          across {r.lines.length} SKU lines
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-stone-500">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isDraft ? (
                          <button
                            onClick={() => handlePostReceipt(r._id)}
                            disabled={postingId === r._id}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{postingId === r._id ? 'Posting...' : 'Post to Stock'}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-medium font-mono">
                            Posted by {r.postedBy}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No inward receipts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Receipt Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Create Inward Stock Receipt</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateReceipt} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-stone-700 block mb-1">Target Warehouse</label>
                <select
                  required
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                  className="input-field cursor-pointer"
                >
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Supplier Invoice / PO #</label>
                  <input
                    type="text"
                    required
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <span className="font-bold text-stone-900 block mb-2">Item to Receive</span>
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
                <label className="font-medium text-stone-700 block mb-1">Notes / Condition</label>
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
                  {submitting ? 'Creating...' : 'Create Draft Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
