'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, MapPin, Phone, Mail, Building, X } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
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

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      const res = await fetch(`/api/v1/customers?${params.toString()}`);
      const json = await res.json();
      if (json.data) setCustomers(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

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
      setModalOpen(false);
      fetchCustomers();
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
            Hospitality Customer Directory
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Hotels, resorts, luxury villas, and commercial linen clients.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card-surface p-4 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hotel name, contact person, or email..."
            className="w-full bg-[#F3F5F4] border-0 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:ring-2 focus:ring-[#A7F432] outline-none transition-all"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full card-surface p-12 text-center text-xs text-stone-400 bg-white">
            Loading customers...
          </div>
        ) : customers.length > 0 ? (
          customers.map((c) => (
            <div
              key={c._id}
              className="card-surface p-5 bg-white space-y-3 hover:border-lime-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <span className="font-mono text-xs font-bold text-stone-400">
                    {c.customerCode}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Partner
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

              {c.taxId && (
                <div className="pt-2 border-t border-stone-100 text-[10px] text-stone-400 font-mono">
                  GSTIN: {c.taxId}
                </div>
              )}
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

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-stone-700 block mb-1">Company / Hotel Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Hyatt Mumbai"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma (Purchasing)"
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
                    placeholder="+91 98200 11223"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="purchasing@grandhyatt.local"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Billing & Delivery Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Street, Landmark, City, State, PIN"
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  placeholder="27AABCT3518Q1ZV"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="input-field font-mono uppercase"
                />
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
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
