'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, RefreshCw, Key, Clock } from 'lucide-react';

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/audit-events');
      const json = await res.json();
      if (json.data) setEvents(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            System Security & Audit Trail
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Immutable log of all stock postings, order status changes, and sensitive operations.
          </p>
        </div>

        <button
          onClick={fetchAuditEvents}
          className="btn-secondary text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {/* Audit Events Table */}
      <div className="card-surface bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Actor</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Entity</th>
                <th className="py-3 px-4 font-semibold">Summary Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((e) => (
                  <tr key={e._id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-900">
                      {e.actorName || 'System'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {e.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                      {e.entityType} ({e.entityId})
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px] max-w-xs truncate">
                      {JSON.stringify(e.afterSummary || e.beforeSummary || {})}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    No audit events recorded yet.
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
