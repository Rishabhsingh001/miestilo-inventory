'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Building2,
  Calendar,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus) params.set('status', selectedStatus);
      if (search) params.set('q', search);
      const res = await fetch(`/api/v1/orders?${params.toString()}`);
      const json = await res.json();
      if (json.data) setOrders(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Sales Orders & Fulfillment
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track customer demand, stock reservations, pick/pack progress, and multi-shipment dispatches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/api/v1/reports/orders/export"
            download
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export Orders CSV</span>
          </a>
          <Link href="/orders/new" className="btn-primary text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Sales Order</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-surface p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order # or Customer Name..."
            className="w-full bg-[#F3F5F4] border-0 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:ring-2 focus:ring-[#A7F432] outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#F3F5F4] px-3 py-2 rounded-xl text-xs font-medium text-stone-700 outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed (Reserved)</option>
            <option value="PICKING">Picking</option>
            <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card-surface bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Order #</th>
                <th className="py-3 px-4 font-semibold">Customer / Destination</th>
                <th className="py-3 px-4 font-semibold">Fulfillment Warehouse</th>
                <th className="py-3 px-4 font-semibold text-right">Units Ordered / Shipped</th>
                <th className="py-3 px-4 font-semibold text-right">Grand Total (INR)</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((o) => {
                  const totalOrdered = o.lines?.reduce((s: number, l: any) => s + l.orderedQty, 0) || 0;
                  const totalDispatched = o.lines?.reduce((s: number, l: any) => s + l.dispatchedQty, 0) || 0;
                  return (
                    <tr key={o._id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/orders/${o._id}`}
                          className="font-mono font-bold text-stone-900 hover:text-emerald-700 underline-offset-2 hover:underline block"
                        >
                          {o.orderNumber}
                        </Link>
                        <span className="text-[10px] text-stone-400 block font-normal">
                          {new Date(o.orderDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-900 block">
                          {o.customerSnapshot?.companyName}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          Attn: {o.customerSnapshot?.contactName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-700">
                        {o.warehouseId?.name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className="font-bold text-stone-900 block">
                          {totalDispatched} / {totalOrdered}
                        </span>
                        <span className="text-[10px] text-stone-400 block">
                          {totalDispatched >= totalOrdered && totalOrdered > 0 ? '100% Shipped' : 'In Progress'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900 text-sm">
                        ₹{(o.grandTotalMinor / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/orders/${o._id}`}
                          className="btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3 text-stone-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No orders found. Click &quot;Create Sales Order&quot; to begin.
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
