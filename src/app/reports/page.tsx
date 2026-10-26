'use client';

import React from 'react';
import {
  FileText,
  Download,
  Boxes,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    {
      title: 'Current Inventory & Stock Balances',
      description:
        'Complete snapshot of all sellable SKUs, physical on-hand quantities, order reservations, damaged buckets, and available units per warehouse.',
      icon: Boxes,
      endpoint: '/api/v1/reports/inventory/export',
      format: 'CSV (.csv)',
      frequency: 'Real-time On-demand',
    },
    {
      title: 'Stock Movement Ledger Audit',
      description:
        'Append-only historical movement log containing every receipt, reservation, dispatch, transfer, and adjustment with linked reference numbers and actors.',
      icon: TrendingUp,
      endpoint: '/api/v1/reports/movements/export',
      format: 'CSV (.csv)',
      frequency: 'Immutable Ledger',
    },
    {
      title: 'Sales Orders & Fulfillment History',
      description:
        'Customer orders breakdown including fulfillment status, ordered vs shipped linen quantities, and grand total in INR.',
      icon: FileText,
      endpoint: '/api/v1/reports/orders/export',
      format: 'CSV (.csv)',
      frequency: 'Daily / On-demand',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Operational Reports & Data Exports
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Export verified inventory ledgers and business fulfillment data. All CSV exports are protected against spreadsheet formula injection.
        </p>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((r, i) => {
          const Icon = r.icon;
          return (
            <div
              key={i}
              className="card-surface p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-lime-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 tracking-tight">
                    {r.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 max-w-xl">
                    {r.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400 font-mono">
                    <span>Format: {r.format}</span>
                    <span>•</span>
                    <span>{r.frequency}</span>
                  </div>
                </div>
              </div>

              <a
                href={r.endpoint}
                download
                className="btn-primary text-xs py-2.5 px-4 shrink-0 self-start sm:self-center shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </a>
            </div>
          );
        })}
      </div>

      {/* Security note */}
      <div className="card-surface p-5 bg-stone-50/50 border-stone-200 text-xs text-stone-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-stone-900 block">
            CSV Formula Injection Protection Enforced
          </span>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Values starting with spreadsheet calculation triggers (<code className="font-mono">=</code>, <code className="font-mono">+</code>, <code className="font-mono">-</code>, <code className="font-mono">@</code>) are automatically escaped with apostrophes before file streaming to prevent DDE and CSV code execution vulnerabilities in Microsoft Excel.
          </p>
        </div>
      </div>
    </div>
  );
}
