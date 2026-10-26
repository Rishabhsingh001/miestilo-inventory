'use client';

import React, { useState, useEffect } from 'react';
import {
  DatabaseZap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export default function ReconciliationPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const runReconciliation = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/inventory/reconciliation');
      const json = await res.json();
      if (json.data) setReport(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runReconciliation();
  }, []);

  const hasDiscrepancy = (report?.discrepanciesCount || 0) > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Stock Ledger Reconciliation
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Auditing projected StockBalance records against the mathematical sum of immutable StockMovement events.
          </p>
        </div>

        <button
          onClick={runReconciliation}
          disabled={loading}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Reconciling Ledger...' : 'Run Audit Check'}</span>
        </button>
      </div>

      {/* Audit Banner */}
      <div
        className={`card-surface p-6 ${
          hasDiscrepancy ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50/60 border-emerald-300'
        }`}
      >
        <div className="flex items-center gap-3">
          {hasDiscrepancy ? (
            <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
          )}
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              {hasDiscrepancy
                ? `Attention: ${report?.discrepanciesCount} Stock Discrepancy Found`
                : '100% Ledger Integrity Confirmed'}
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              {hasDiscrepancy
                ? 'Differences detected between projected balance buckets and append-only ledger transaction deltas.'
                : `All ${report?.totalChecked ?? 0} stock balance records strictly reconcile with ledger transaction history.`}
            </p>
          </div>
        </div>
      </div>

      {/* Discrepancy Table */}
      {hasDiscrepancy && (
        <div className="card-surface bg-white overflow-hidden p-5 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-rose-600">
            Discrepant Balances
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-right">Projected On-Hand</th>
                  <th className="py-2.5 px-3 text-right">Ledger Sum</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {report.discrepancies.map((d: any, i: number) => (
                  <tr key={i}>
                    <td className="py-3 px-3 font-mono font-bold text-stone-900">{d.skuName}</td>
                    <td className="py-3 px-3 text-right font-mono">{d.projectedOnHand}</td>
                    <td className="py-3 px-3 text-right font-mono">{d.ledgerOnHand}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                      {d.difference > 0 ? `+${d.difference}` : d.difference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Methodology Card */}
      <div className="card-surface p-5 bg-white space-y-2 text-xs text-stone-600">
        <h4 className="font-bold text-stone-900">Reconciliation Methodology</h4>
        <p>
          Misterio Lifestyle enforces double-entry stock integrity: each posted inward receipt, sales shipment, warehouse transfer, or adjustment posts an immutable record in <code className="font-mono bg-stone-100 px-1 rounded">StockMovement</code>. This verification engine recalculates the full sum of all positive and negative deltas and confirms they match the fast-lookup <code className="font-mono bg-stone-100 px-1 rounded">StockBalance</code> projection.
        </p>
        <span className="text-[10px] text-stone-400 block pt-2">
          Last verified: {report?.reconciledAt ? new Date(report.reconciledAt).toLocaleString('en-IN') : 'Now'}
        </span>
      </div>
    </div>
  );
}
