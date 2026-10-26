'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  Boxes,
  Package,
  FileText,
  AlertTriangle,
  Truck,
  Plus,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  RefreshCw,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge } from '@/components/StatusBadge';

interface DashboardData {
  kpis: {
    totalSkus: number;
    totalAvailableUnits: number;
    lowStockCount: number;
    openOrdersCount: number;
    dispatchedToday: number;
  };
  chartData: Array<{ date: string; inbound: number; outbound: number }>;
  recentMovements: any[];
  attentionItems: {
    lowStock: any[];
    ordersAwaitingDispatch: any[];
    pendingReturns: any[];
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  const fetchDashboard = async (whId = selectedWarehouse) => {
    try {
      setLoading(true);
      const url = whId
        ? `/api/v1/dashboard/summary?warehouseId=${whId}`
        : '/api/v1/dashboard/summary';
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
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
    fetchDashboard();
  }, []);

  const handleWarehouseChange = (whId: string) => {
    setSelectedWarehouse(whId);
    fetchDashboard(whId);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Operational Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Operations Overview
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time hotel linen stock balances, fulfillment commitments, and warehouse movements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Warehouse Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs">
            <Building2 className="w-4 h-4 text-stone-400" />
            <select
              value={selectedWarehouse}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              className="text-xs font-medium text-stone-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchDashboard()}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-colors shadow-xs"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Available Units"
          value={loading ? '...' : (data?.kpis.totalAvailableUnits ?? 0).toLocaleString()}
          subtext="Sellable, unreserved stock"
          icon={Boxes}
          badgeText="In Stock"
          badgeType="brand"
          href="/inventory"
        />
        <KpiCard
          label="Active SKUs"
          value={loading ? '...' : (data?.kpis.totalSkus ?? 0)}
          subtext="Linen catalog configurations"
          icon={Package}
          badgeText="Active"
          badgeType="neutral"
          href="/inventory/products"
        />
        <KpiCard
          label="Low Stock Items"
          value={loading ? '...' : (data?.kpis.lowStockCount ?? 0)}
          subtext="Below reorder threshold"
          icon={AlertTriangle}
          badgeText="Alert"
          badgeType={data?.kpis.lowStockCount ? 'warning' : 'neutral'}
          href="/inventory?lowStock=true"
        />
        <KpiCard
          label="Open Orders"
          value={loading ? '...' : (data?.kpis.openOrdersCount ?? 0)}
          subtext="Awaiting picking / dispatch"
          icon={FileText}
          badgeText="Pending"
          badgeType="neutral"
          href="/orders"
        />
        <KpiCard
          label="Dispatched Today"
          value={loading ? '...' : (data?.kpis.dispatchedToday ?? 0)}
          subtext="Outbound linen pieces"
          icon={Truck}
          badgeText="Shipped"
          badgeType="brand"
          href="/orders/dispatches"
        />
      </div>

      {/* Quick Action Dock */}
      <div className="card-surface p-4 flex flex-wrap items-center justify-between gap-3 bg-white">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 pl-2">
          Quick Actions
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/inventory/receipts" className="btn-primary text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Receive Stock</span>
          </Link>
          <Link href="/orders/new" className="btn-secondary text-xs">
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            <span>Create Sales Order</span>
          </Link>
          <Link href="/inventory/transfers" className="btn-secondary text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-stone-500" />
            <span>Transfer Inventory</span>
          </Link>
          <Link href="/inventory/adjustments" className="btn-secondary text-xs">
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Adjust / Damage</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Chart & Attention Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Chart (2 Columns) */}
        <div className="lg:col-span-2 card-surface p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                Daily Stock Movement Flow (7 Days)
              </h2>
              <p className="text-xs text-stone-500">
                Inbound receipts vs Outbound order dispatches (units)
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Flow
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                Loading analytics...
              </div>
            ) : data?.chartData && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8F9992' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8F9992' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E7EBE7',
                      fontSize: '12px',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="inbound" name="Inbound (Receipts)" fill="#A7F432" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outbound" name="Outbound (Dispatches)" fill="#171B18" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                No movements recorded in this period.
              </div>
            )}
          </div>
        </div>

        {/* Attention Required Panel (1 Column) */}
        <div className="card-surface p-6 bg-white space-y-4">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">
              Action Required
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Immediate
            </span>
          </div>

          <div className="space-y-4">
            {/* Low stock alerts */}
            <div>
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                Critical Low Stock ({data?.attentionItems.lowStock.length ?? 0})
              </span>
              {data?.attentionItems.lowStock && data.attentionItems.lowStock.length > 0 ? (
                <div className="space-y-2">
                  {data.attentionItems.lowStock.slice(0, 3).map((item: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-mono text-xs font-bold text-stone-900 block truncate">
                          {item.sku}
                        </span>
                        <span className="text-[11px] text-stone-600 block truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-amber-800 font-mono block">
                          {item.available} avail
                        </span>
                        <span className="text-[10px] text-stone-500">
                          Min: {item.reorderLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">No low-stock items.</p>
              )}
            </div>

            {/* Pending dispatch orders */}
            <div className="pt-2 border-t border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                Orders Awaiting Fulfillment
              </span>
              {data?.attentionItems.ordersAwaitingDispatch &&
              data.attentionItems.ordersAwaitingDispatch.length > 0 ? (
                <div className="space-y-2">
                  {data.attentionItems.ordersAwaitingDispatch.slice(0, 3).map((ord: any) => (
                    <Link
                      key={ord._id}
                      href={`/orders/${ord._id}`}
                      className="p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 flex items-center justify-between transition-colors block"
                    >
                      <div>
                        <span className="font-mono text-xs font-semibold text-stone-900 block">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[11px] text-stone-600 block truncate">
                          {ord.customerSnapshot?.companyName}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">No pending orders.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Stock Movements Table */}
      <div className="card-surface p-6 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">
              Recent Inventory Ledger Movements
            </h2>
            <p className="text-xs text-stone-500">
              Every physical change is backed by an immutable ledger event and reference.
            </p>
          </div>
          <Link
            href="/inventory/movements"
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 font-semibold">Movement #</th>
                <th className="py-2.5 font-semibold">Type</th>
                <th className="py-2.5 font-semibold">SKU & Item</th>
                <th className="py-2.5 font-semibold">Reference</th>
                <th className="py-2.5 font-semibold text-right">Delta</th>
                <th className="py-2.5 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-400">
                    Loading movements...
                  </td>
                </tr>
              ) : data?.recentMovements && data.recentMovements.length > 0 ? (
                data.recentMovements.map((mov: any) => {
                  const isPositive = mov.quantityDelta > 0;
                  const isNegative = mov.quantityDelta < 0;
                  return (
                    <tr key={mov._id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 font-mono font-medium text-stone-900">
                        {mov.movementNumber}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={mov.type} />
                      </td>
                      <td className="py-3">
                        <span className="font-mono font-semibold text-stone-900 block">
                          {mov.skuId?.sku || 'SKU'}
                        </span>
                        <span className="text-[11px] text-stone-500 block truncate">
                          {mov.skuId?.variantName}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-stone-600">
                        {mov.referenceType}: {mov.referenceId}
                      </td>
                      <td className="py-3 text-right font-mono font-bold">
                        <span
                          className={clsx(
                            isPositive && 'text-emerald-600',
                            isNegative && 'text-stone-900',
                            !isPositive && !isNegative && 'text-stone-400'
                          )}
                        >
                          {isPositive ? `+${mov.quantityDelta}` : mov.quantityDelta}
                        </span>
                      </td>
                      <td className="py-3 text-right text-stone-500">
                        {new Date(mov.occurredAt).toLocaleDateString('en-IN', {
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
                  <td colSpan={6} className="py-6 text-center text-stone-400">
                    No movements recorded yet. Click &quot;Reset Demo Inventory&quot; to seed initial data.
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
