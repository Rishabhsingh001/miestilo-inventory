'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Phone, User, X, Layers, Edit2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Super Admin Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    contactName: '',
    contactPhone: '',
    capacity: 50000,
    isActive: true,
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const [whRes, meRes] = await Promise.all([
        fetch('/api/v1/warehouses'),
        fetch('/api/v1/auth/me'),
      ]);
      const json = await whRes.json();
      if (json.data) setWarehouses(json.data);
      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.data || null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

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
      setSuccessMsg(`Warehouse ${formData.name} created successfully!`);
      setModalOpen(false);
      setFormData({
        code: '',
        name: '',
        address: '',
        city: '',
        contactName: '',
        contactPhone: '',
      });
      fetchWarehouses();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (w: any) => {
    setEditingWarehouse(w);
    setEditFormData({
      code: w.code,
      name: w.name,
      address: w.address,
      city: w.city,
      contactName: w.contactName || '',
      contactPhone: w.contactPhone || '',
      capacity: w.capacity || 50000,
      isActive: w.isActive ?? true,
    });
    setEditModalOpen(true);
  };

  const handleEditWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse) return;
    try {
      setEditingSubmitting(true);
      setErrorMsg(null);
      const res = await fetch(`/api/v1/warehouses/${editingWarehouse._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to update warehouse');
      setSuccessMsg(`Warehouse ${editFormData.name} updated successfully!`);
      setEditModalOpen(false);
      fetchWarehouses();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setEditingSubmitting(false);
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

        {isSuperAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Warehouse</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full card-surface p-12 text-center text-xs text-stone-400 bg-white">
            Loading warehouses...
          </div>
        ) : warehouses.length > 0 ? (
          warehouses.map((w) => (
            <div
              key={w._id}
              className="card-surface p-6 bg-white space-y-4 hover:border-lime-300 transition-colors flex flex-col justify-between"
            >
              <div>
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

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    w.isActive !== false ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-stone-500 bg-stone-100 border-stone-200'
                  }`}>
                    {w.isActive !== false ? 'Operational' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600 mt-3">
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
              </div>

              {/* Super Admin Edit Action */}
              {isSuperAdmin && (
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400 font-medium">Facility ID: {w.code}</span>
                  <button
                    onClick={() => openEditModal(w)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-200/60 border border-stone-200 transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-stone-500" />
                    <span>Edit Facility</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full card-surface p-12 text-center text-xs text-stone-400 bg-white">
            No warehouses registered yet.
          </div>
        )}
      </div>

      {/* Add Warehouse Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">Add New Warehouse</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-BOM"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="input-field uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Bhiwandi Distribution Hub"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Physical Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Full street address and landmark..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Manager Name"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
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

      {/* Edit Warehouse Modal (Super Admin) */}
      {editModalOpen && editingWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#171B18] text-[#A7F432] font-black text-xs flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Edit Warehouse Details</h3>
                  <span className="text-[10px] text-stone-400">Super Admin Privilege</span>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditWarehouse} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Warehouse Code</label>
                  <input
                    type="text"
                    required
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Physical Address</label>
                <textarea
                  rows={2}
                  required
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editFormData.contactName}
                    onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editFormData.contactPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editWhActive"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0"
                />
                <label htmlFor="editWhActive" className="text-xs text-stone-700 font-medium">
                  Active & Operational
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
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
                  {editingSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
