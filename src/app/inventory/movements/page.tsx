'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Filter,
  Download,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { StatusBadge } from '@/components/StatusBadge';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedWarehouse) params.set('warehouseId', selectedWarehouse);
      if (selectedType) params.set('type', selectedType);
      const res = await fetch(`/api/v1/inventory/movements?${params.toString()}`);
      const json = await res.json();
      if (json.data) setMovements(json.data);
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
    fetchMovements();
  }, [selectedWarehouse, selectedType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Stock Movement Ledger
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Immutable, append-only audit trail of every unit received, reserved, dispatched, transferred, or adjusted.
          </p>
        </div>

        <a
          href="/api/v1/reports/movements/export"
          download
          className="btn-secondary text-xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-stone-500" />
          <span>Export Ledger CSV</span>
        </a>
      </div>

      {/* Filter Bar */}
      <div className="card-surface p-4 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Warehouse filter */}
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

          {/* Movement type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#F3F5F4] px-3 py-1.5 rounded-xl text-xs font-medium text-stone-700 outline-none cursor-pointer"
          >
            <option value="">All Movement Types</option>
            <option value="RECEIPT">Inward Receipts</option>
            <option value="RESERVATION">Order Reservations</option>
            <option value="DISPATCH">Shipment Dispatches</option>
            <option value="TRANSFER_OUT">Transfer Out</option>
            <option value="TRANSFER_IN">Transfer In</option>
            <option value="CUSTOMER_RETURN_RESTOCK">Customer Return (Restocked)</option>
            <option value="DAMAGE">Warehouse Damage</option>
          </select>

          <button
            onClick={fetchMovements}
            className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <span className="text-xs text-stone-400 font-mono">
          Showing {movements.length} ledger events
        </span>
      </div>

      {/* Movements Table */}
      <div className="card-surface bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Movement #</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">SKU / Item</th>
                <th className="py-3 px-4 font-semibold">Warehouse</th>
                <th className="py-3 px-4 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold text-right">Physical Delta</th>
                <th className="py-3 px-4 font-semibold text-right">Reserved Delta</th>
                <th className="py-3 px-4 font-semibold">Actor</th>
                <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-400">
                    Loading ledger movements...
                  </td>
                </tr>
              ) : movements.length > 0 ? (
                movements.map((m) => {
                  const isPositive = m.quantityDelta > 0;
                  const isNegative = m.quantityDelta < 0;
                  return (
                    <tr key={m._id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-stone-900">
                        {m.movementNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={m.type} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-stone-900 block">
                          {m.skuId?.sku || 'SKU'}
                        </span>
                        <span className="text-stone-500 text-[11px] block truncate max-w-xs">
                          {m.skuId?.variantName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        {m.warehouseId?.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        <span className="text-[10px] text-stone-400 block uppercase">
                          {m.referenceType}
                        </span>
                        <span>{m.referenceId}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={clsx(
                            isPositive && 'text-emerald-600',
                            isNegative && 'text-stone-900',
                            !isPositive && !isNegative && 'text-stone-300'
                          )}
                        >
                          {isPositive ? `+${m.quantityDelta}` : m.quantityDelta !== 0 ? m.quantityDelta : '0'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-amber-700">
                        {m.reservedDelta !== 0 ? (m.reservedDelta > 0 ? `+${m.reservedDelta}` : m.reservedDelta) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {m.actorName || 'System'}
                      </td>
                      <td className="py-3.5 px-4 text-right text-stone-500 font-mono text-[11px]">
                        {new Date(m.occurredAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-400">
                    No movements found for the selected filters.
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
