'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Phone, User, X, Layers } from 'lucide-react';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    contactName: '',
    contactPhone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/warehouses');
      const json = await res.json();
      if (json.data) setWarehouses(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await fetch('/api/v1/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create warehouse');
      setModalOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Warehouses & Logistics Centers
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Physical stockholding locations, regional depots, and internal storage zones.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Warehouse</span>
        </button>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full card-surface p-12 text-center text-xs text-stone-400 bg-white">
            Loading warehouses...
          </div>
        ) : warehouses.length > 0 ? (
          warehouses.map((w) => (
            <div
              key={w._id}
              className="card-surface p-6 bg-white space-y-4 hover:border-lime-300 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 tracking-tight">
                      {w.name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-stone-400">
                      {w.code} ({w.city})
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Operational
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <span>{w.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>Contact: {w.contactName || 'Warehouse Manager'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{w.contactPhone || '+91 22 2830 0000'}</span>
                </div>
              </div>

              {/* Bin locations preview */}
              {w.locations && w.locations.length > 0 && (
                <div className="pt-3 border-t border-stone-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                    Storage Bins ({w.locations.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {w.locations.map((loc: any, idx: number) => (
                      <span
                        key={idx}
                        className="font-mono text-[11px] bg-stone-50 border border-stone-200 px-2 py-0.5 rounded text-stone-700 font-medium"
                      >
                        {loc.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full card-surface p-12 text-center text-xs text-stone-400 bg-white">
            No warehouses registered.
          </div>
        )}
      </div>

      {/* New Warehouse Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Add Warehouse Facility</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateWarehouse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Facility Code</label>
                  <input
                    type="text"
                    required
                    placeholder="WH-BLR-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input-field font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Warehouse Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="Bengaluru Southern Logistics Hub"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Full Physical Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Plot number, industrial estate, city, postal code"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Contact Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Murthy"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 80 2345 6789"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="input-field"
                  />
                </div>
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
                  {submitting ? 'Creating...' : 'Save Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
