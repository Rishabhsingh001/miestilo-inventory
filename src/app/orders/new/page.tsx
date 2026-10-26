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
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [notes, setNotes] = useState('Hospitality partner delivery — handle linen with care.');
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
          if (custRes.data.length > 0) setSelectedCustomerId(custRes.data[0]._id);
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
  const taxTotalMinor = lines.reduce(
    (acc, l) =>
      acc +
      Math.round(
        ((l.orderedQty * l.unitPriceMinor - l.discountMinor) * l.taxRatePercent) / 100
      ),
    0
  );
  const grandTotalMinor = subtotalMinor - discountTotalMinor + taxTotalMinor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        customerId: selectedCustomerId,
        warehouseId: selectedWarehouseId,
        notes,
        lines: lines.map((l) => ({
          skuId: l.skuId,
          orderedQty: Number(l.orderedQty),
          unitPriceMinor: Number(l.unitPriceMinor),
          discountMinor: Number(l.discountMinor),
          taxRatePercent: Number(l.taxRatePercent),
        })),
      };

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
    <div className="space-y-6 max-w-4xl mx-auto">
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
            Draft orders do not reserve stock until explicitly confirmed by sales manager.
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
        <div className="card-surface p-6 bg-white space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            1. Customer & Destination
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">
                Select Customer / Hotel
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="input-field cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName} ({c.contactName})
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="mt-2 p-2.5 rounded-lg bg-stone-50 text-[11px] text-stone-600 space-y-0.5 border border-stone-200">
                  <span className="font-semibold text-stone-900 block">
                    Ship-To Destination:
                  </span>
                  <span>{selectedCustomer.billingAddress}</span>
                  {selectedCustomer.taxId && (
                    <span className="block font-mono text-stone-400">
                      GSTIN: {selectedCustomer.taxId}
                    </span>
                  )}
                </div>
              )}
            </div>

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

              <div className="mt-2">
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  Delivery / Order Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Line Items */}
        <div className="card-surface p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              2. Linen SKU Line Items
            </h2>
            <button
              type="button"
              onClick={addLineItem}
              className="btn-secondary text-xs py-1 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const itemSubtotal = line.orderedQty * line.unitPriceMinor;
              const itemTax = Math.round(
                ((itemSubtotal - line.discountMinor) * line.taxRatePercent) / 100
              );
              const itemTotal = itemSubtotal - line.discountMinor + itemTax;

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#F8FAF8] border border-stone-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="md:col-span-5">
                    <label className="text-[10px] text-stone-500 uppercase font-semibold block mb-1">
                      Linen SKU Variant
                    </label>
                    <select
                      value={line.skuId}
                      onChange={(e) => updateLine(idx, 'skuId', e.target.value)}
                      className="input-field cursor-pointer font-mono font-medium"
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
                      className="input-field font-mono font-bold"
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
                      className="input-field font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 text-right">
                    <span className="text-[10px] text-stone-400 block">Line Total (+12% GST)</span>
                    <span className="font-mono font-bold text-stone-900 text-sm block">
                      ₹{(itemTotal / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="md:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      disabled={lines.length <= 1}
                      className="p-1.5 text-stone-400 hover:text-rose-600 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals Summary */}
          <div className="pt-4 border-t border-stone-100 flex flex-col items-end gap-1.5 text-xs">
            <div className="flex justify-between w-64 text-stone-500">
              <span>Subtotal:</span>
              <span className="font-mono text-stone-800">
                ₹{(subtotalMinor / 100).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between w-64 text-stone-500">
              <span>GST Tax (12%):</span>
              <span className="font-mono text-stone-800">
                ₹{(taxTotalMinor / 100).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between w-64 font-bold text-stone-900 text-sm pt-2 border-t border-stone-200">
              <span>Grand Total:</span>
              <span className="font-mono text-stone-950">
                ₹{(grandTotalMinor / 100).toLocaleString('en-IN')}
              </span>
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
            className="btn-primary text-xs py-2 px-6 shadow-sm"
          >
            {submitting ? 'Creating Draft...' : 'Create Draft Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
