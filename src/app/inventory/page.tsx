'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Boxes,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  AlertTriangle,
  Building2,
  Package,
  Edit2,
  CheckCircle2,
  X,
  ShieldCheck,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

function InventoryBalancesContent() {
  const searchParams = useSearchParams();
  const initialLowStock = searchParams.get('lowStock') === 'true';

  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStock);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Super Admin Edit Stock Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    onHand: 0,
    damaged: 0,
    quarantined: 0,
    reason: '',
  });
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedWarehouse) params.set('warehouseId', selectedWarehouse);
      if (lowStockOnly) params.set('lowStock', 'true');
      const res = await fetch(`/api/v1/inventory/balances?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setBalances(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setCurrentUser(res.data);
      })
      .catch(() => {});

    fetch('/api/v1/warehouses')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setWarehouses(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBalances();
  }, [selectedWarehouse, lowStockOnly]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const handleOpenEdit = (balance: any) => {
    setEditingBalance(balance);
    setEditForm({
      onHand: balance.onHand || 0,
      damaged: balance.damaged || 0,
      quarantined: balance.quarantined || 0,
      reason: 'Physical stock reconciliation audit count',
    });
    setErrorToast(null);
    setEditModalOpen(true);
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBalance) return;
    try {
      setEditingSubmitting(true);
      setErrorToast(null);
      const res = await fetch(`/api/v1/inventory/balances/${editingBalance._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onHand: Number(editForm.onHand),
          damaged: Number(editForm.damaged),
          quarantined: Number(editForm.quarantined),
          reason: editForm.reason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update stock balance');
      }
      setSuccessToast(`Stock balance for ${editingBalance.skuId?.sku} updated successfully.`);
      setEditModalOpen(false);
      fetchBalances();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setErrorToast(err.message || 'Error updating stock balance');
    } finally {
      setEditingSubmitting(false);
    }
  };

  const filteredBalances = balances.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const sku = b.skuId?.sku?.toLowerCase() || '';
    const name = b.skuId?.variantName?.toLowerCase() || '';
    const wh = b.warehouseId?.name?.toLowerCase() || '';
    return sku.includes(q) || name.includes(q) || wh.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#171B18] bg-[#A7F432] px-2 py-0.5 rounded-md">
              Real-Time Ledger
            </span>
            {isSuperAdmin && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                Super Admin Edit Enabled
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Stock Balances & Visibility
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time on-hand, reserved commitments, damaged quarantine, and sellable availability per warehouse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/api/v1/reports/inventory/export"
            className="btn-secondary text-xs"
            download
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export CSV</span>
          </a>
          <Link href="/inventory/receipts" className="btn-primary text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Receive Inward</span>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-surface p-4 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by SKU, variant name, or warehouse..."
            className="w-full bg-[#F3F5F4] border-0 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:ring-2 focus:ring-[#A7F432] outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Warehouse dropdown */}
          <div className="flex items-center gap-2 bg-[#F3F5F4] px-3 py-1.5 rounded-xl text-xs text-stone-700">
            <Building2 className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent font-medium outline-none cursor-pointer"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Low stock toggle */}
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              lowStockOnly
                ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock Only</span>
          </button>

          <button
            onClick={fetchBalances}
            className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stock Balances Table */}
      <div className="card-surface bg-white overflow-hidden shadow-xs border border-[#E7EBE7]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU & Item Details</th>
                <th className="py-3 px-4 font-semibold">Warehouse</th>
                <th className="py-3 px-4 font-semibold text-right">Physical On-Hand</th>
                <th className="py-3 px-4 font-semibold text-right">Reserved (Committed)</th>
                <th className="py-3 px-4 font-semibold text-right">Damaged / Quarantine</th>
                <th className="py-3 px-4 font-semibold text-right">Available (Sellable)</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                {isSuperAdmin && (
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="py-8 text-center text-stone-400">
                    Loading stock balances...
                  </td>
                </tr>
              ) : filteredBalances.length > 0 ? (
                filteredBalances.map((b) => (
                  <tr key={b._id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-stone-900 block">
                        {b.skuId?.sku || 'UNKNOWN'}
                      </span>
                      <span className="text-stone-600 block text-[11px]">
                        {b.skuId?.variantName}
                      </span>
                      {b.skuId?.attributes && (
                        <span className="text-stone-400 text-[10px] block">
                          {[
                            b.skuId.attributes.size,
                            b.skuId.attributes.color,
                            b.skuId.attributes.threadCount
                              ? `${b.skuId.attributes.threadCount} TC`
                              : null,
                            b.skuId.attributes.gsm ? `${b.skuId.attributes.gsm} GSM` : null,
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-stone-900 block">
                        {b.warehouseId?.name}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {b.warehouseId?.code} ({b.warehouseId?.city})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900">
                      {b.onHand}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-700">
                      {b.reserved > 0 ? b.reserved : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-stone-500">
                      {b.damaged + b.quarantined > 0 ? b.damaged + b.quarantined : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          b.available <= (b.skuId?.reorderLevel || 20)
                            ? 'text-rose-600'
                            : 'text-stone-900'
                        }`}
                      >
                        {b.available}
                      </span>
                      <span className="text-[10px] text-stone-400 block font-normal">
                        reorder at {b.skuId?.reorderLevel || 20}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={b.isLowStock ? 'LOW_STOCK' : 'FULFILLED'} />
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-[#171B18] text-stone-700 hover:text-[#A7F432] transition-colors border border-stone-200 shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
                          title="Super Admin Edit Stock Balance"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Stock</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="py-8 text-center text-stone-400">
                    No stock balances found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Super Admin Edit Stock Balance Modal */}
      {editModalOpen && editingBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                    {editingBalance.skuId?.sku}
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-700" />
                    Super Admin Edit
                  </span>
                </div>
                <h3 className="font-bold text-sm text-stone-900 mt-1">
                  {editingBalance.skuId?.variantName}
                </h3>
                <p className="text-xs text-stone-500">
                  Facility: <span className="font-semibold text-stone-800">{editingBalance.warehouseId?.name}</span> ({editingBalance.warehouseId?.city})
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorToast && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorToast}</span>
              </div>
            )}

            <form onSubmit={handleSaveBalance} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Physical On-Hand Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.onHand}
                    onChange={(e) => setEditForm({ ...editForm, onHand: Number(e.target.value) })}
                    className="input-field font-mono font-bold text-sm"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Actual physical stock units in warehouse
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Committed Reserved Qty
                  </label>
                  <div className="input-field bg-stone-100 text-stone-500 font-mono font-bold cursor-not-allowed">
                    {editingBalance.reserved || 0}
                  </div>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Reserved for confirmed sales orders (read-only)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Damaged Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.damaged}
                    onChange={(e) => setEditForm({ ...editForm, damaged: Number(e.target.value) })}
                    className="input-field font-mono"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Stained, torn, or rejected linen
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Quarantined / QA Hold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.quarantined}
                    onChange={(e) => setEditForm({ ...editForm, quarantined: Number(e.target.value) })}
                    className="input-field font-mono"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Awaiting laundry audit or inspection
                  </span>
                </div>
              </div>

              {/* Live Availability Calculation Preview */}
              <div className="p-3.5 rounded-xl bg-[#F0FBD9] border border-[#A7F432]/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#162402] block">
                    Calculated Available (Sellable) Stock
                  </span>
                  <span className="text-[11px] text-[#366804] font-medium">
                    = {editForm.onHand} On-Hand - {editingBalance.reserved || 0} Reserved - {editForm.damaged} Damaged - {editForm.quarantined} Quarantined
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-2xl text-[#162402] block leading-none">
                    {Math.max(0, editForm.onHand - (editingBalance.reserved || 0) - editForm.damaged - editForm.quarantined)}
                  </span>
                  <span className="text-[10px] text-[#366804] uppercase font-semibold">Sellable</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Mandatory Stock Adjustment Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  placeholder="e.g. Physical inventory cycle count audit, discrepancy reconciliation, damaged write-off"
                  className="input-field text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingSubmitting}
                  className="btn-primary text-xs font-bold shadow-sm"
                >
                  {editingSubmitting ? 'Updating Stock...' : 'Save Stock Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryBalancesPage() {
  return (
    <Suspense fallback={<div className="card-surface p-12 text-center text-xs text-stone-400 bg-white">Loading stock balances...</div>}>
      <InventoryBalancesContent />
    </Suspense>
  );
}
