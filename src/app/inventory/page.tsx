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
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Stock Balances & Visibility
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time on-hand, reserved commitments, and sellable availability per warehouse.
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

      {/* Filter and Search Bar */}
      <div className="card-surface p-4 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
      <div className="card-surface bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU & Item Details</th>
                <th className="py-3 px-4 font-semibold">Warehouse</th>
                <th className="py-3 px-4 font-semibold text-right">Physical On-Hand</th>
                <th className="py-3 px-4 font-semibold text-right">Reserved (Committed)</th>
                <th className="py-3 px-4 font-semibold text-right">Damaged / Quarantined</th>
                <th className="py-3 px-4 font-semibold text-right">Available (Sellable)</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
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
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-stone-800">
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No stock balances found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
