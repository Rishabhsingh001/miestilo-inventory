'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, Search, Building2, PackageCheck, ArrowRight } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function DispatchesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/orders')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          // Filter to orders that have been dispatched or partially fulfilled
          const dispatchedOrders = json.data.filter((o: any) =>
            ['CONFIRMED', 'PICKING', 'PARTIALLY_FULFILLED', 'FULFILLED'].includes(o.status)
          );
          setOrders(dispatchedOrders);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Shipments & Fulfillment Queue
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Monitor pick/pack lists, carrier waybills, and order fulfillment status.
        </p>
      </div>

      {/* Dispatches Table */}
      <div className="card-surface bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Order #</th>
                <th className="py-3 px-4 font-semibold">Customer / Property</th>
                <th className="py-3 px-4 font-semibold">Warehouse</th>
                <th className="py-3 px-4 font-semibold text-right">Units Dispatched / Ordered</th>
                <th className="py-3 px-4 font-semibold text-center">Fulfillment Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Loading fulfillment queue...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((o) => {
                  const ordered = o.lines?.reduce((s: number, l: any) => s + l.orderedQty, 0) || 0;
                  const dispatched = o.lines?.reduce((s: number, l: any) => s + l.dispatchedQty, 0) || 0;
                  return (
                    <tr key={o._id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {o.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-900 block">
                          {o.customerSnapshot?.companyName}
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          {o.shipToSnapshot?.city}, {o.shipToSnapshot?.state}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-700">
                        {o.warehouseId?.name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={dispatched >= ordered ? 'text-emerald-700' : 'text-stone-900'}>
                          {dispatched} / {ordered}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/orders/${o._id}`}
                          className="btn-secondary text-xs py-1 px-3"
                        >
                          <span>Manage Dispatch</span>
                          <ArrowRight className="w-3 h-3 text-stone-400 ml-1 inline" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No active fulfillment orders in queue.
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
