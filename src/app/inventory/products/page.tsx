'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Sparkles,
  Tag,
  Check,
  X,
  Layers,
  ChevronRight,
  ExternalLink
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

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/v1/categories');
      const json = await res.json();
      if (json.data) setCategories(json.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('pageSize', '50');
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
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const targetCategoryId = formData.categoryId || (categories.length > 0 ? categories[0]._id : undefined);

      const payload = {
        name: formData.name,
        categoryId: targetCategoryId,
        description: formData.description,
        brand: 'MiEstilo',
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#171B18] bg-[#A7F432] px-2 py-0.5 rounded-md">
              MiEstilo Catalogue
            </span>
            <span className="text-xs text-stone-500 font-medium">30 Luxury Hotel Products</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900">
            Products & SKU Master
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real hospitality specifications, thread counts, GSM weights, weaves, and sellable variants.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Product</span>
        </button>
      </div>

      {/* Filter / Search Bar & Category Pills */}
      <div className="card-surface p-4 bg-white space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, thread count, GSM, fabric, or description..."
              className="w-full bg-[#F3F5F4] border-0 rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:ring-2 focus:ring-[#A7F432] outline-none transition-all"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === ''
                ? 'bg-[#171B18] text-[#A7F432] shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat._id
                  ? 'bg-[#171B18] text-[#A7F432] shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards with Genuine Catalog Photography */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-surface p-12 text-center text-xs text-stone-400 bg-white">
            Loading MiEstilo product catalogue...
          </div>
        ) : products.length > 0 ? (
          products.map((p) => {
            const heroImage = p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : null;

            return (
              <div
                key={p._id}
                className="card-surface p-5 bg-white space-y-4 hover:border-lime-400 transition-all shadow-xs"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-stone-100 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Genuine Catalog Product Photograph */}
                    {heroImage ? (
                      <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200 shadow-xs group">
                        <img
                          src={heroImage}
                          alt={p.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white px-1.5 py-0.5 rounded">
                          MiEstilo
                        </span>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                          {p.categoryId?.name}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {p.brand || 'MiEstilo'}
                        </span>
                        <span className="text-[10px] font-medium text-stone-500">
                          Unit: {p.unit}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-stone-900 tracking-tight leading-snug">
                        {p.name}
                      </h3>

                      {p.description && (
                        <p className="text-xs text-stone-600 line-clamp-2 max-w-2xl leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1 shrink-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                      Starting From
                    </span>
                    <span className="text-sm font-extrabold text-stone-900 font-mono">
                      ₹{(p.defaultSellingPriceMinor / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full mt-1">
                      {p.variants?.length || 0} Sellable SKUs
                    </span>
                  </div>
                </div>

                {/* Sellable SKU Variants Matrix */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                    Available SKU Configurations & Prices
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                    {p.variants?.map((v: any) => (
                      <div
                        key={v._id}
                        className="p-3 rounded-xl bg-[#F8FAF8] border border-stone-200/80 flex flex-col justify-between hover:bg-white hover:border-lime-300 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-xs font-bold text-stone-900 block truncate">
                              {v.sku}
                            </span>
                            <span className="text-[10px] font-bold text-lime-800 bg-lime-100 px-1.5 py-0.2 rounded shrink-0">
                              Active
                            </span>
                          </div>

                          <span className="text-[11px] font-semibold text-stone-700 block line-clamp-1">
                            {v.variantName}
                          </span>

                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[10px] text-stone-500 font-medium">
                            {v.attributes?.size && (
                              <span className="bg-white px-1.5 py-0.5 rounded border border-stone-200">
                                {v.attributes.size}
                              </span>
                            )}
                            {v.attributes?.color && (
                              <span className="bg-white px-1.5 py-0.5 rounded border border-stone-200">
                                {v.attributes.color}
                              </span>
                            )}
                            {v.attributes?.threadCount && (
                              <span className="bg-white px-1.5 py-0.5 rounded border border-stone-200">
                                {v.attributes.threadCount} TC
                              </span>
                            )}
                            {v.attributes?.gsm && (
                              <span className="bg-white px-1.5 py-0.5 rounded border border-stone-200">
                                {v.attributes.gsm} GSM
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 text-[11px]">
                          <span className="text-stone-400 text-[10px]">
                            Min Stock: {v.reorderLevel}
                          </span>
                          <span className="font-mono font-bold text-stone-900">
                            ₹{(v.sellingPriceMinor / 100).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card-surface p-12 text-center text-xs text-stone-400 bg-white">
            No products found matching your search.
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
                <label className="font-semibold text-stone-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pure Cotton Satin Stripe Bedsheet 400 TC"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input-field"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Base Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input-field"
                  >
                    <option value="PIECE">PIECE</option>
                    <option value="SET">SET</option>
                    <option value="PACK">PACK</option>
                    <option value="CARTON">CARTON</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description / Hospitality Features</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Engineered for five-star hotels and luxury hospitality laundering endurance..."
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Base Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.defaultSellingPrice}
                    onChange={(e) => setFormData({ ...formData, defaultSellingPrice: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Primary SKU Variant */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <span className="font-bold text-stone-800 block text-[11px]">Primary SKU Configuration</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="SKU Code (e.g. ME-BL-400-KNG)"
                    value={formData.variants[0].sku}
                    onChange={(e) => {
                      const v = [...formData.variants];
                      v[0].sku = e.target.value.toUpperCase();
                      setFormData({ ...formData, variants: v });
                    }}
                    className="input-field"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Variant Name (e.g. King 108x108)"
                    value={formData.variants[0].variantName}
                    onChange={(e) => {
                      const v = [...formData.variants];
                      v[0].variantName = e.target.value;
                      setFormData({ ...formData, variants: v });
                    }}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Size (e.g. 108 x 108 inches)"
                    value={formData.variants[0].size}
                    onChange={(e) => {
                      const v = [...formData.variants];
                      v[0].size = e.target.value;
                      setFormData({ ...formData, variants: v });
                    }}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Color (e.g. Optical White)"
                    value={formData.variants[0].color}
                    onChange={(e) => {
                      const v = [...formData.variants];
                      v[0].color = e.target.value;
                      setFormData({ ...formData, variants: v });
                    }}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
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
