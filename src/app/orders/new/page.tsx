'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Trash2,
  Building2,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Calculator,
  Search,
  X,
  ChevronDown,
} from 'lucide-react';

export default function NewOrderPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [availableSkus, setAvailableSkus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customGstin, setCustomGstin] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [notes, setNotes] = useState('Hospitality partner delivery — handle linen with care.');

  // Customer Search by text state
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = React.useRef<HTMLDivElement>(null);
  
  // GST Manual Mode & Amount
  const [gstMode, setGstMode] = useState<'LINE' | 'MANUAL'>('LINE');
  const [manualGstRupees, setManualGstRupees] = useState<number>(0);

  const [lines, setLines] = useState<
    Array<{
      skuId: string;
      orderedQty: number;
      unitPriceMinor: number;
      discountMinor: number;
      taxRatePercent: number;
    }>
  >([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/customers').then((r) => r.json()),
      fetch('/api/v1/warehouses').then((r) => r.json()),
      fetch('/api/v1/products?pageSize=100').then((r) => r.json()),
    ])
      .then(([custRes, whRes, prodRes]) => {
        if (custRes.data) {
          setCustomers(custRes.data);
          if (custRes.data.length > 0) {
            setSelectedCustomerId(custRes.data[0]._id);
            setCustomGstin(custRes.data[0].taxId || '');
          }
        }
        if (whRes.data) {
          setWarehouses(whRes.data);
          if (whRes.data.length > 0) setSelectedWarehouseId(whRes.data[0]._id);
        }
        if (prodRes.data) {
          setProducts(prodRes.data);
          const skus = prodRes.data.flatMap((p: any) =>
            (p.variants || []).map((v: any) => ({
              ...v,
              productName: p.name,
            }))
          );
          setAvailableSkus(skus);
          if (skus.length > 0) {
            setLines([
              {
                skuId: skus[0]._id,
                orderedQty: 20,
                unitPriceMinor: skus[0].sellingPriceMinor || 199900,
                discountMinor: 0,
                taxRatePercent: 12,
              },
            ]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const c = customers.find((cust) => cust._id === customerId);
    if (c) {
      setCustomGstin(c.taxId || '');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearchText.trim()) return true;
    const q = customerSearchText.toLowerCase();
    const company = c.companyName?.toLowerCase() || '';
    const contact = c.contactName?.toLowerCase() || '';
    const address = c.billingAddress?.toLowerCase() || '';
    const taxId = c.taxId?.toLowerCase() || '';
    const code = c.customerCode?.toLowerCase() || '';
    return (
      company.includes(q) ||
      contact.includes(q) ||
      address.includes(q) ||
      taxId.includes(q) ||
      code.includes(q)
    );
  });

  const addLineItem = () => {
    if (availableSkus.length === 0) return;
    const defaultSku = availableSkus[0];
    setLines([
      ...lines,
      {
        skuId: defaultSku._id,
        orderedQty: 10,
        unitPriceMinor: defaultSku.sellingPriceMinor || 199900,
        discountMinor: 0,
        taxRatePercent: 12,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, key: string, value: any) => {
    const updated = [...lines];
    const current = { ...updated[index], [key]: value };

    if (key === 'skuId') {
      const selectedSku = availableSkus.find((s) => s._id === value);
      if (selectedSku) {
        current.unitPriceMinor = selectedSku.sellingPriceMinor;
      }
    }
    updated[index] = current;
    setLines(updated);
  };

  // Financial calculations
  const subtotalMinor = lines.reduce(
    (acc, l) => acc + l.orderedQty * l.unitPriceMinor,
    0
  );
  const discountTotalMinor = lines.reduce((acc, l) => acc + l.discountMinor, 0);

  const calculatedLineTaxMinor = lines.reduce(
    (acc, l) =>
      acc +
      Math.round(
        ((l.orderedQty * l.unitPriceMinor - l.discountMinor) * (l.taxRatePercent || 0)) / 100
      ),
    0
  );

  const taxTotalMinor =
    gstMode === 'MANUAL'
      ? Math.round(Number(manualGstRupees || 0) * 100)
      : calculatedLineTaxMinor;

  const grandTotalMinor = subtotalMinor - discountTotalMinor + taxTotalMinor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload: any = {
        customerId: selectedCustomerId,
        warehouseId: selectedWarehouseId,
        notes,
        customGstin: customGstin.trim(),
        lines: lines.map((l) => ({
          skuId: l.skuId,
          orderedQty: Number(l.orderedQty),
          unitPriceMinor: Number(l.unitPriceMinor),
          discountMinor: Number(l.discountMinor),
          taxRatePercent: Number(l.taxRatePercent),
        })),
      };

      if (gstMode === 'MANUAL') {
        payload.manualTaxAmountMinor = taxTotalMinor;
      }

      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to create sales order');
      }

      router.push(`/orders/${json.data._id}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCustomer = customers.find((c) => c._id === selectedCustomerId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button and title */}
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Create Draft Sales Order
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure hotel client, manual GST taxes, fulfillment warehouse, and luxury linen items.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Warehouse Selection */}
        <div className="card-surface p-6 bg-white space-y-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            1. Customer & Destination
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="relative" ref={customerDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 block">
                    Select Customer / Hotel
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Search by hotel, contact, or city
                  </span>
                </div>

                {/* Combobox Search Trigger Input */}
                <div className="flex items-center w-full bg-white border border-[#E7EBE7] focus-within:border-[#92DF20] focus-within:ring-2 focus-within:ring-[#A7F432]/30 rounded-[10px] px-3 py-2 text-xs transition-all shadow-2xs">
                  <Search className="w-4 h-4 text-stone-400 shrink-0 mr-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={customerSearchText}
                    onChange={(e) => {
                      setCustomerSearchText(e.target.value);
                      setCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setCustomerDropdownOpen(true)}
                    placeholder={
                      selectedCustomer
                        ? `${selectedCustomer.companyName} (${selectedCustomer.contactName})`
                        : 'Type to search by hotel name, contact, city...'
                    }
                    className="w-full bg-transparent border-0 p-0 text-xs font-medium text-stone-900 outline-none placeholder:text-stone-400"
                  />
                  {customerSearchText ? (
                    <button
                      type="button"
                      onClick={() => setCustomerSearchText('')}
                      className="text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer shrink-0 ml-1.5"
                      title="Clear search text"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                      className="text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer shrink-0 ml-1.5"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          customerDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown Menu */}
                {customerDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-stone-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-stone-100 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2.5 bg-[#F8FAF8] border-b border-stone-200 text-[10px] text-stone-500 font-semibold uppercase tracking-wider flex justify-between items-center sticky top-0 z-10 backdrop-blur-xs">
                      <span>{filteredCustomers.length} Hotel Partners Found</span>
                      {customerSearchText && (
                        <span className="text-[#366804] font-bold">
                          Query: &quot;{customerSearchText}&quot;
                        </span>
                      )}
                    </div>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c) => {
                        const isSelected = c._id === selectedCustomerId;
                        return (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => {
                              handleCustomerChange(c._id);
                              setCustomerSearchText('');
                              setCustomerDropdownOpen(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-stone-50 flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected ? 'bg-[#F0FBD9]' : ''
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-xs text-stone-900 block truncate">
                                {c.companyName}
                              </span>
                              <span className="text-[11px] text-stone-500 block truncate">
                                {c.contactName} {c.billingAddress ? `• ${c.billingAddress.split(',')[0]}` : ''}
                              </span>
                            </div>
                            <div className="shrink-0 text-right">
                              {isSelected ? (
                                <span className="text-[10px] font-bold text-[#162402] bg-[#A7F432] px-2 py-0.5 rounded-md shadow-2xs">
                                  Selected
                                </span>
                              ) : c.taxId ? (
                                <span className="text-[10px] font-mono text-stone-400">
                                  {c.taxId}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-stone-400 space-y-1">
                        <p className="font-medium text-stone-600">No hotel partners found</p>
                        <p className="text-[11px]">No client matches &quot;{customerSearchText}&quot;</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Select Dropdown for direct pick */}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-stone-500">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Or pick from list:</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="bg-transparent text-xs text-stone-700 font-medium underline underline-offset-2 hover:text-stone-900 cursor-pointer outline-none max-w-[260px] truncate"
                  >
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.companyName} ({c.contactName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCustomer && (
                <div className="p-3 rounded-xl bg-stone-50 text-[11px] text-stone-600 space-y-2 border border-stone-200">
                  <div>
                    <span className="font-semibold text-stone-900 block">
                      Ship-To Address:
                    </span>
                    <span>{selectedCustomer.billingAddress}</span>
                  </div>

                  {/* Manual GSTIN Field */}
                  <div className="pt-2 border-t border-stone-200">
                    <label className="font-semibold text-stone-700 block mb-1">
                      Customer GSTIN / Tax ID (Manual Edit)
                    </label>
                    <input
                      type="text"
                      value={customGstin}
                      onChange={(e) => setCustomGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="input-field font-mono uppercase bg-white text-xs py-1"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">
                      Applied to commercial tax invoice for this order
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  Fulfillment Warehouse
                </label>
                <select
                  required
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  Delivery / Order Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Line Items */}
        <div className="card-surface p-6 bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                2. Linen SKU Line Items & GST Rates
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Set individual quantities, unit rates, and GST percentage tiers per product variant.
              </p>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add SKU Line</span>
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const itemSubtotal = line.orderedQty * line.unitPriceMinor;
              const itemTax = Math.round(
                ((itemSubtotal - line.discountMinor) * (line.taxRatePercent || 0)) / 100
              );
              const itemTotal = itemSubtotal - line.discountMinor + itemTax;

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#F8FAF8] border border-stone-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="md:col-span-4">
                    <label className="text-[10px] text-stone-500 uppercase font-semibold block mb-1">
                      Linen SKU Variant
                    </label>
                    <select
                      value={line.skuId}
                      onChange={(e) => updateLine(idx, 'skuId', e.target.value)}
                      className="input-field cursor-pointer font-mono font-medium text-xs"
                    >
                      {availableSkus.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.sku} — {s.productName} ({s.variantName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] text-stone-500 uppercase font-semibold block mb-1">
                      Qty (Pieces)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={line.orderedQty}
                      onChange={(e) => updateLine(idx, 'orderedQty', Number(e.target.value))}
                      className="input-field font-mono font-bold text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] text-stone-500 uppercase font-semibold block mb-1">
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={line.unitPriceMinor / 100}
                      onChange={(e) =>
                        updateLine(idx, 'unitPriceMinor', Math.round(Number(e.target.value) * 100))
                      }
                      className="input-field font-mono text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] text-stone-500 uppercase font-semibold block mb-1">
                      GST Rate Option
                    </label>
                    <select
                      value={line.taxRatePercent}
                      onChange={(e) => updateLine(idx, 'taxRatePercent', Number(e.target.value))}
                      className="input-field text-xs font-semibold bg-white"
                    >
                      <option value={0}>0% (Tax Exempt)</option>
                      <option value={5}>5% (Fabrics & Yarns)</option>
                      <option value={12}>12% (Standard Linen)</option>
                      <option value={18}>18% (Luxury Hospitality)</option>
                      <option value={28}>28% (Special Goods)</option>
                    </select>
                  </div>

                  <div className="md:col-span-1.5 text-right">
                    <span className="text-[10px] text-stone-400 block font-medium">
                      Line Total
                    </span>
                    <span className="font-mono font-bold text-stone-900 text-xs block">
                      ₹{(itemTotal / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-stone-400 block font-mono">
                      (+{line.taxRatePercent}% GST)
                    </span>
                  </div>

                  <div className="md:col-span-0.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      disabled={lines.length <= 1}
                      className="p-1.5 text-stone-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* GST Calculation Mode & Manual Override Options */}
          <div className="pt-4 border-t border-stone-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-stone-700" />
                  GST Tax Mode & Manual Options
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Choose whether to auto-calculate tax from line item rates or enter a manual lump-sum GST amount.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setGstMode('LINE')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    gstMode === 'LINE'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Line-by-Line GST
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGstMode('MANUAL');
                    if (manualGstRupees === 0) {
                      setManualGstRupees(calculatedLineTaxMinor / 100);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    gstMode === 'MANUAL'
                      ? 'bg-[#171B18] text-[#A7F432] shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Manual GST Amount (₹)
                </button>
              </div>
            </div>

            {/* Manual GST Input when in MANUAL mode */}
            {gstMode === 'MANUAL' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2 mb-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-amber-700" />
                    Enter Custom Manual GST Tax Amount (₹)
                  </label>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    Manual Mode Active
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center max-w-xs w-full bg-white border border-[#E7EBE7] focus-within:border-[#92DF20] focus-within:ring-2 focus-within:ring-[#A7F432]/30 rounded-[10px] px-3 py-2 transition-all shadow-2xs">
                    <span className="text-stone-500 font-bold font-mono text-sm shrink-0 mr-2 select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={manualGstRupees}
                      onChange={(e) => setManualGstRupees(Number(e.target.value))}
                      className="w-full bg-transparent border-0 p-0 font-mono font-bold text-sm text-stone-900 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <span className="text-xs text-amber-800">
                    Auto calculated was: <span className="font-mono font-semibold">₹{(calculatedLineTaxMinor / 100).toLocaleString('en-IN')}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Totals Summary */}
            <div className="flex flex-col items-end gap-1.5 text-xs">
              <div className="flex justify-between w-72 text-stone-500">
                <span>Subtotal (Linen Value):</span>
                <span className="font-mono text-stone-800">
                  ₹{(subtotalMinor / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between w-72 text-stone-600 font-medium">
                <span>
                  GST Tax ({gstMode === 'MANUAL' ? 'Manual Override' : 'Calculated'}):
                </span>
                <span className="font-mono text-stone-900 font-bold">
                  ₹{(taxTotalMinor / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between w-72 font-black text-stone-950 text-sm pt-2 border-t border-stone-200">
                <span>Grand Total:</span>
                <span className="font-mono text-base">
                  ₹{(grandTotalMinor / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/orders" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-xs font-bold shadow-sm"
          >
            {submitting ? 'Creating Sales Order...' : 'Create Draft Sales Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
