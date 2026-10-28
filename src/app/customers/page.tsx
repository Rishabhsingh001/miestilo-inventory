'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, MapPin, Phone, Mail, Building, X, Edit2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    billingAddress: '',
    taxId: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Super Admin Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    billingAddress: '',
    taxId: '',
    notes: '',
    isActive: true,
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      const [custRes, meRes] = await Promise.all([
        fetch(`/api/v1/customers?${params.toString()}`),
        fetch('/api/v1/auth/me'),
      ]);
      const json = await custRes.json();
      if (json.data) setCustomers(json.data);
      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.data || null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const payload = {
        ...formData,
        shippingAddresses: [
          {
            label: 'Main Resort / Property Receiving',
            street: formData.billingAddress,
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            isDefault: true,
          },
        ],
      };
      const res = await fetch('/api/v1/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create customer');
      setSuccessMsg(`Customer ${formData.companyName} added successfully!`);
      setModalOpen(false);
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        billingAddress: '',
        taxId: '',
        notes: '',
      });
      fetchCustomers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (c: any) => {
    setEditingCustomer(c);
    setEditFormData({
      companyName: c.companyName,
      contactName: c.contactName,
      email: c.email,
      phone: c.phone,
      billingAddress: c.billingAddress,
      taxId: c.taxId || '',
      notes: c.notes || '',
      isActive: c.isActive ?? true,
    });
    setEditModalOpen(true);
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      setEditingSubmitting(true);
      setErrorMsg(null);
      const res = await fetch(`/api/v1/customers/${editingCustomer._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to update customer');
      setSuccessMsg(`Customer ${editFormData.companyName} updated successfully!`);
      setEditModalOpen(false);
      fetchCustomers();
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
            Hospitality Customer Directory
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Hotels, resorts, luxury villas, and commercial linen clients.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Customer</span>
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

      {/* Search Bar */}
      <div className="card-surface p-4 bg-white border border-[#E7EBE7]">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hotel property, group name, email or customer code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F3F5F4] border-0 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-[#A7F432] focus:bg-white outline-none"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full card-surface p-12 text-center text-xs text-stone-400 bg-white">
            Loading customer accounts...
          </div>
        ) : customers.length > 0 ? (
          customers.map((c) => (
            <div
              key={c._id}
              className="card-surface p-6 bg-white space-y-4 hover:border-lime-300 transition-colors flex flex-col justify-between border border-[#E7EBE7]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-md">
                    {c.customerCode}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    c.isActive !== false ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-stone-500 bg-stone-100 border-stone-200'
                  }`}>
                    {c.isActive !== false ? 'Active Partner' : 'Inactive'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-stone-900 mt-2.5 tracking-tight">
                  {c.companyName}
                </h3>
                <span className="text-xs text-stone-600 block">
                  {c.contactName}
                </span>

                <div className="mt-3 space-y-1.5 text-[11px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.billingAddress}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[10px] text-stone-400 font-mono">
                  {c.taxId ? `GSTIN: ${c.taxId}` : 'Tax ID: N/A'}
                </span>
                {isSuperAdmin && (
                  <button
                    onClick={() => openEditModal(c)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-200/60 border border-stone-200 transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-stone-500" />
                    <span>Edit Client</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full card-surface p-12 text-center text-xs text-stone-400 bg-white">
            No customers found.
          </div>
        )}
      </div>

      {/* New Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Add Hospitality Customer</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-stone-700 block mb-1">Hotel / Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taj Lands End Mumbai"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Key Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="Executive Housekeeper"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="linen@tajhotels.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    placeholder="27AAAAA0000A1Z5"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value.toUpperCase() })}
                    className="input-field uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Billing & Delivery Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Street address, City, PIN..."
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
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
                  {submitting ? 'Creating...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal (Super Admin) */}
      {editModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#171B18] text-[#A7F432] font-black text-xs flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Edit Customer Account</h3>
                  <span className="text-[10px] text-stone-400 font-mono">{editingCustomer.customerCode}</span>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditCustomer} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Hotel / Group Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.companyName}
                  onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Key Contact Person</label>
                  <input
                    type="text"
                    required
                    value={editFormData.contactName}
                    onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={editFormData.taxId}
                    onChange={(e) => setEditFormData({ ...editFormData, taxId: e.target.value.toUpperCase() })}
                    className="input-field uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Billing & Delivery Address</label>
                <textarea
                  rows={2}
                  required
                  value={editFormData.billingAddress}
                  onChange={(e) => setEditFormData({ ...editFormData, billingAddress: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editCustActive"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0"
                />
                <label htmlFor="editCustActive" className="text-xs text-stone-700 font-medium">
                  Active Client Partner
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
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
