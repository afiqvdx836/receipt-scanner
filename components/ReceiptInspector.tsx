'use client'

import { useState, useMemo } from 'react'
import { ReceiptData, ReceiptItem } from '@/app/actions/scan'
import { reconcileReceipt, formatCurrency } from '@/lib/reconciliation'
import { saveMerchantCorrection } from '@/lib/memory'
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  SunMedium,
  Save,
  Download,
  Copy,
  Plus,
  Trash2,
  ArrowLeft,
  Maximize2,
  Receipt,
} from 'lucide-react'

interface ReceiptInspectorProps {
  receipt: ReceiptData
  previewUrl: string | null
  onReset: () => void
  onMemoryUpdated?: () => void
}

export default function ReceiptInspector({
  receipt: initialReceipt,
  previewUrl,
  onReset,
  onMemoryUpdated,
}: ReceiptInspectorProps) {
  // Live editable state
  const [receipt, setReceipt] = useState<ReceiptData>(initialReceipt)
  const [activeTab, setActiveTab] = useState<'items' | 'financials' | 'merchant'>('items')

  // Document canvas controls
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [contrastBoost, setContrastBoost] = useState<boolean>(false)

  // Notification states
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [copySuccess, setCopySuccess] = useState<boolean>(false)

  // Math reconciliation calculation
  const audit = useMemo(() => {
    return reconcileReceipt({
      items: receipt.items,
      subtotal: receipt.financials.subtotal,
      tax: receipt.financials.tax,
      serviceCharge: receipt.financials.serviceCharge,
      discounts: receipt.financials.discounts,
      rounding: receipt.financials.rounding,
      grandTotal: receipt.financials.grandTotal,
    })
  }, [receipt])

  // Handlers for modifying items
  function updateItem(index: number, field: keyof ReceiptItem, value: string | number) {
    const nextItems = [...receipt.items]
    const updated = { ...nextItems[index], [field]: value }

    // Auto-calculate line total if qty or unitPrice changed
    if (field === 'qty' || field === 'unitPrice') {
      const q = field === 'qty' ? Number(value) || 1 : nextItems[index].qty
      const u = field === 'unitPrice' ? Number(value) || 0 : nextItems[index].unitPrice
      updated.price = Math.round(q * u * 100) / 100
    }

    nextItems[index] = updated

    // Recompute subtotal
    const newSubtotal = nextItems.reduce((acc, it) => acc + (Number(it.price) || 0), 0)
    const newGrandTotal =
      newSubtotal +
      receipt.financials.tax +
      receipt.financials.serviceCharge -
      receipt.financials.discounts +
      receipt.financials.rounding

    setReceipt({
      ...receipt,
      items: nextItems,
      subtotal: Math.round(newSubtotal * 100) / 100,
      total: Math.round(newGrandTotal * 100) / 100,
      financials: {
        ...receipt.financials,
        subtotal: Math.round(newSubtotal * 100) / 100,
        grandTotal: Math.round(newGrandTotal * 100) / 100,
      },
    })
  }

  function removeItem(index: number) {
    const nextItems = receipt.items.filter((_, i) => i !== index)
    const newSubtotal = nextItems.reduce((acc, it) => acc + (Number(it.price) || 0), 0)
    const newGrandTotal =
      newSubtotal +
      receipt.financials.tax +
      receipt.financials.serviceCharge -
      receipt.financials.discounts +
      receipt.financials.rounding

    setReceipt({
      ...receipt,
      items: nextItems,
      subtotal: Math.round(newSubtotal * 100) / 100,
      total: Math.round(newGrandTotal * 100) / 100,
      financials: {
        ...receipt.financials,
        subtotal: Math.round(newSubtotal * 100) / 100,
        grandTotal: Math.round(newGrandTotal * 100) / 100,
      },
    })
  }

  function addItem() {
    const newItem: ReceiptItem = {
      name: 'New Line Item',
      qty: 1,
      unitPrice: 0,
      price: 0,
    }
    setReceipt({
      ...receipt,
      items: [...receipt.items, newItem],
    })
  }

  function updateFinancial(field: keyof typeof receipt.financials, val: number) {
    const nextFinancials = { ...receipt.financials, [field]: Number(val) || 0 }
    // If user modifies tax or discount, auto recalculate grand total
    const computedTotal =
      nextFinancials.subtotal +
      nextFinancials.tax +
      nextFinancials.serviceCharge -
      nextFinancials.discounts +
      nextFinancials.rounding

    nextFinancials.grandTotal = Math.round(computedTotal * 100) / 100

    setReceipt({
      ...receipt,
      total: nextFinancials.grandTotal,
      financials: nextFinancials,
    })
  }

  function handleSaveToMemory() {
    saveMerchantCorrection({
      storeName: receipt.merchant.name,
      normalizedName: receipt.merchant.name,
      currency: receipt.currency.code,
      category: receipt.meta.category,
      taxInclusive: receipt.financials.tax === 0 || receipt.financials.subtotal === receipt.financials.grandTotal,
      correctionNotes: [
        `Reconciled ${receipt.items.length} line items`,
        `Tax rate recorded: ${receipt.financials.taxRatePercent || 0}%`,
      ],
    })
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
    if (onMemoryUpdated) onMemoryUpdated()
  }

  function handleExportCSV() {
    const headers = ['Item Description', 'Quantity', 'Unit Price', 'Line Total', 'Currency']
    const rows = receipt.items.map((it) => [
      `"${it.name.replace(/"/g, '""')}"`,
      it.qty,
      it.unitPrice.toFixed(2),
      it.price.toFixed(2),
      receipt.currency.code,
    ])

    // Append summary totals
    rows.push([])
    rows.push(['Subtotal', '', '', receipt.financials.subtotal.toFixed(2), receipt.currency.code])
    rows.push(['Tax', '', '', receipt.financials.tax.toFixed(2), receipt.currency.code])
    rows.push(['Grand Total', '', '', receipt.financials.grandTotal.toFixed(2), receipt.currency.code])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${receipt.merchant.name.replace(/\s+/g, '_')}_${receipt.meta.date}.csv`
    link.click()
  }

  function handleCopyJSON() {
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2))
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Scan New Receipt
          </button>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>{receipt.merchant.name || 'Receipt Document'}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                {receipt.meta.date}
              </span>
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToMemory}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            {saveSuccess ? 'Rule Learned' : 'Save to Memory'}
          </button>
          <button
            onClick={handleExportCSV}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleCopyJSON}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-medium transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            {copySuccess ? 'Copied' : 'Copy JSON'}
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane: Interactive Document Canvas */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[650px]">
          {/* Document Canvas Toolbar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/90 border-b border-zinc-800 text-xs text-zinc-400">
            <span className="font-mono text-[11px] uppercase tracking-wider">Document Inspector</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}
                type="button"
                title="Zoom Out"
                className="p-1 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="font-mono text-[10px] w-10 text-center text-zinc-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                type="button"
                title="Zoom In"
                className="p-1 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                type="button"
                title="Rotate 90 deg"
                className="p-1 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setContrastBoost((c) => !c)}
                type="button"
                title="Toggle High-Contrast Filter for Faded Thermal Receipts"
                className={`p-1 rounded-md transition-colors ${
                  contrastBoost ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <SunMedium className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1)
                  setRotation(0)
                  setContrastBoost(false)
                }}
                type="button"
                title="Reset Canvas View"
                className="p-1 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Viewport Canvas */}
          <div className="relative flex-1 bg-zinc-900/40 overflow-auto flex items-center justify-center p-4 select-none">
            {previewUrl ? (
              <div
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  filter: contrastBoost ? 'contrast(160%) brightness(95%)' : 'none',
                  transition: 'transform 0.15s ease-out, filter 0.2s ease',
                }}
                className="max-h-full max-w-full origin-center"
              >
                <img
                  src={previewUrl}
                  alt="Scanned receipt source"
                  className="rounded-lg shadow-xl max-h-[560px] object-contain border border-zinc-800"
                />
              </div>
            ) : (
              <div className="text-center text-zinc-600 text-xs">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
                No direct document preview available
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Structured Financial Ledger */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col h-[650px] overflow-hidden">
          {/* Header Bar with Math Reconciliation State */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={receipt.merchant.name}
                  onChange={(e) =>
                    setReceipt({
                      ...receipt,
                      merchant: { ...receipt.merchant, name: e.target.value },
                      storeName: e.target.value,
                    })
                  }
                  className="text-base font-semibold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:outline-hidden transition-colors"
                />
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">
                  {receipt.currency.code} ({receipt.currency.symbol})
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{receipt.meta.category}</p>
            </div>

            {/* Reconciliation Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
                audit.isReconciled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {audit.isReconciled ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Math Reconciled
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Diff: {audit.discrepancy > 0 ? `+${audit.discrepancy.toFixed(2)}` : audit.discrepancy.toFixed(2)}
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-800 px-4 bg-zinc-900/30 text-xs">
            <button
              onClick={() => setActiveTab('items')}
              type="button"
              className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'items'
                  ? 'border-emerald-500 text-zinc-100'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Line Items ({receipt.items.length})
            </button>
            <button
              onClick={() => setActiveTab('financials')}
              type="button"
              className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'financials'
                  ? 'border-emerald-500 text-zinc-100'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Taxes & Totals
            </button>
            <button
              onClick={() => setActiveTab('merchant')}
              type="button"
              className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'merchant'
                  ? 'border-emerald-500 text-zinc-100'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Merchant & Meta
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Tab 1: Line Items */}
            {activeTab === 'items' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
                  <span>ITEM DESCRIPTION</span>
                  <div className="flex items-center gap-10 pr-8">
                    <span>QTY</span>
                    <span>PRICE</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {receipt.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-2 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                    >
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        className="flex-1 bg-transparent text-xs text-zinc-100 focus:outline-hidden focus:text-emerald-400"
                        placeholder="Item description"
                      />
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.qty}
                        onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                        className="w-12 text-center bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-xs text-zinc-200 font-mono focus:outline-hidden focus:border-emerald-500"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500 text-xs font-mono">{receipt.currency.symbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(idx, 'price', e.target.value)}
                          className="w-20 text-right bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-zinc-100 font-mono focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        type="button"
                        className="text-zinc-600 hover:text-red-400 p-1 rounded transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addItem}
                  type="button"
                  className="w-full py-2 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Line Item
                </button>
              </div>
            )}

            {/* Tab 2: Financials & Taxes */}
            {activeTab === 'financials' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Subtotal</span>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 font-mono">{receipt.currency.symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={receipt.financials.subtotal}
                        onChange={(e) => updateFinancial('subtotal', Number(e.target.value))}
                        className="w-24 text-right bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Total Tax / SST / VAT</span>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 font-mono">{receipt.currency.symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={receipt.financials.tax}
                        onChange={(e) => updateFinancial('tax', Number(e.target.value))}
                        className="w-24 text-right bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Service Charge / Tips</span>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 font-mono">{receipt.currency.symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={receipt.financials.serviceCharge}
                        onChange={(e) => updateFinancial('serviceCharge', Number(e.target.value))}
                        className="w-24 text-right bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Discounts / Coupons</span>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 font-mono">{receipt.currency.symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={receipt.financials.discounts}
                        onChange={(e) => updateFinancial('discounts', Number(e.target.value))}
                        className="w-24 text-right bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Cash Rounding Adjustment</span>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 font-mono">{receipt.currency.symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={receipt.financials.rounding}
                        onChange={(e) => updateFinancial('rounding', Number(e.target.value))}
                        className="w-24 text-right bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-100">Calculated Grand Total</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {formatCurrency(receipt.financials.grandTotal, receipt.currency.code, receipt.currency.symbol)}
                    </span>
                  </div>
                </div>

                {/* Payment information card */}
                <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2 text-xs">
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Payment Details</span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-zinc-500 text-[11px] block">Method</span>
                      <span className="text-zinc-200 font-medium">{receipt.payment.method || 'Not specified'}</span>
                    </div>
                    {receipt.payment.cardBrand && (
                      <div>
                        <span className="text-zinc-500 text-[11px] block">Card Brand</span>
                        <span className="text-zinc-200 font-medium">
                          {receipt.payment.cardBrand} {receipt.payment.last4Digits ? `(••• ${receipt.payment.last4Digits})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Merchant & Meta */}
            {activeTab === 'merchant' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div>
                    <label className="text-zinc-400 text-[11px] block mb-1">Branch / Outlet</label>
                    <input
                      type="text"
                      value={receipt.merchant.branch || ''}
                      onChange={(e) =>
                        setReceipt({
                          ...receipt,
                          merchant: { ...receipt.merchant, branch: e.target.value },
                        })
                      }
                      placeholder="e.g. Mid Valley Megamall"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-[11px] block mb-1">Address</label>
                    <input
                      type="text"
                      value={receipt.merchant.address || ''}
                      onChange={(e) =>
                        setReceipt({
                          ...receipt,
                          merchant: { ...receipt.merchant, address: e.target.value },
                        })
                      }
                      placeholder="Street address"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-zinc-400 text-[11px] block mb-1">Tax / Registration ID</label>
                      <input
                        type="text"
                        value={receipt.merchant.taxId || ''}
                        onChange={(e) =>
                          setReceipt({
                            ...receipt,
                            merchant: { ...receipt.merchant, taxId: e.target.value },
                          })
                        }
                        placeholder="e.g. SST-00129384"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 font-mono focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 text-[11px] block mb-1">Receipt / Invoice Number</label>
                      <input
                        type="text"
                        value={receipt.meta.receiptNumber || ''}
                        onChange={(e) =>
                          setReceipt({
                            ...receipt,
                            meta: { ...receipt.meta, receiptNumber: e.target.value },
                          })
                        }
                        placeholder="e.g. INV-90231"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 font-mono focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Fixed Reconciliation Footer */}
          <div className="p-3.5 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Total Items:</span>
              <span className="font-mono text-zinc-200 font-medium">{receipt.items.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-400">Grand Total:</span>
              <span className="text-base font-mono font-bold text-zinc-100">
                {formatCurrency(receipt.financials.grandTotal, receipt.currency.code, receipt.currency.symbol)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
