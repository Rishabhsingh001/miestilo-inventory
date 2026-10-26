'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Layers,
  Sparkles,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // New product form state
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    unit: 'PIECE',
    reorderLevel: 25,
    defaultSellingPrice: 1999,
    variants: [
      {
        sku: '',
        variantName: '',
        size: 'Standard',
        color: 'Optical White',
        threadCount: 300,
        gsm: 0,
        sellingPrice: 1999,
      },
    ],
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      const res = await fetch(`/api/v1/products?${params.toString()}`);
      const json = await res.json();
      if (json.data) setProducts(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        name: formData.name,
        categoryId: formData.categoryId || products[0]?.categoryId?._id,
        description: formData.description,
        unit: formData.unit,
        reorderLevel: Number(formData.reorderLevel),
        defaultSellingPriceMinor: Math.round(Number(formData.defaultSellingPrice) * 100),
        variants: formData.variants.map((v) => ({
          sku: v.sku,
          variantName: v.variantName,
          size: v.size,
          color: v.color,
          threadCount: v.threadCount ? Number(v.threadCount) : undefined,
          gsm: v.gsm ? Number(v.gsm) : undefined,
          sellingPriceMinor: Math.round(Number(v.sellingPrice) * 100),
        })),
      };

      const res = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to create product');
      }

      setModalOpen(false);
      fetchProducts();
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
            Products & SKU Catalogue
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Master linen specifications, configurations, thread counts, and unique sellable SKUs.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card-surface p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title or description..."
            className="w-full bg-[#F3F5F4] border-0 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:ring-2 focus:ring-[#A7F432] outline-none transition-all"
          />
        </div>
      </div>

      {/* Product Grid / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-surface p-12 text-center text-xs text-stone-400 bg-white">
            Loading product catalogue...
          </div>
        ) : products.length > 0 ? (
          products.map((p) => (
            <div key={p._id} className="card-surface p-5 bg-white space-y-4 hover:border-lime-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 tracking-tight">
                      {p.name}
                    </h3>
                    <span className="text-[11px] text-stone-500">
                      Category: <span className="font-medium text-stone-700">{p.categoryId?.name}</span> • Brand: {p.brand}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-stone-700 font-mono">
                    Base: ₹{(p.defaultSellingPriceMinor / 100).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                    {p.variants?.length || 0} Variants
                  </span>
                </div>
              </div>

              {p.description && (
                <p className="text-xs text-stone-600 line-clamp-2">
                  {p.description}
                </p>
              )}

              {/* Variants Matrix */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                  Sellable SKU Variants
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {p.variants?.map((v: any) => (
                    <div
                      key={v._id}
                      className="p-3 rounded-xl bg-[#F8FAF8] border border-stone-200/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-stone-900 block">
                          {v.sku}
                        </span>
                        <span className="text-[11px] text-stone-600 block">
                          {v.variantName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-400">
                          {v.attributes?.size && <span>{v.attributes.size}</span>}
                          {v.attributes?.color && <span>• {v.attributes.color}</span>}
                          {v.attributes?.threadCount && <span>• {v.attributes.threadCount} TC</span>}
                          {v.attributes?.gsm && <span>• {v.attributes.gsm} GSM</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-stone-900 block">
                          ₹{(v.sellingPriceMinor / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-stone-400 font-normal">
                          Min: {v.reorderLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card-surface p-12 text-center text-xs text-stone-400 bg-white">
            No products found in catalogue.
          </div>
        )}
      </div>

      {/* New Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Add New Linen Product</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-stone-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Misterio 500TC Jacquard Duvet Cover"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Fabric composition, weave type, laundering specs..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Base Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.defaultSellingPrice}
                    onChange={(e) => setFormData({ ...formData, defaultSellingPrice: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <span className="font-bold text-stone-900 block mb-2">Initial Variant (SKU)</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-stone-600 block mb-1">SKU Code</label>
                    <input
                      type="text"
                      required
                      placeholder="ML-DC-500-WHT-K"
                      value={formData.variants[0].sku}
                      onChange={(e) => {
                        const copy = [...formData.variants];
                        copy[0].sku = e.target.value;
                        setFormData({ ...formData, variants: copy });
                      }}
                      className="input-field uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-600 block mb-1">Variant Name</label>
                    <input
                      type="text"
                      required
                      placeholder="King 100x108 White"
                      value={formData.variants[0].variantName}
                      onChange={(e) => {
                        const copy = [...formData.variants];
                        copy[0].variantName = e.target.value;
                        setFormData({ ...formData, variants: copy });
                      }}
                      className="input-field"
                    />
                  </div>
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
                  {submitting ? 'Creating...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
