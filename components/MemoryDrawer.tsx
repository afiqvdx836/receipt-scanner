'use client'

import { useState } from 'react'
import {
  getLearnedRules,
  deleteMerchantRule,
  clearAllRules,
  getMemoryStats,
  MerchantRule,
  saveMerchantCorrection,
} from '@/lib/memory'
import { X, Brain, Trash2, Plus, CheckCircle2, RotateCcw } from 'lucide-react'

interface MemoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  onRulesUpdated?: () => void
}

export default function MemoryDrawer({ isOpen, onClose, onRulesUpdated }: MemoryDrawerProps) {
  const [rules, setRules] = useState<MerchantRule[]>(() => getLearnedRules())
  const [stats, setStats] = useState(() => getMemoryStats())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStore, setNewStore] = useState('')
  const [newCategory, setNewCategory] = useState('Meals & Dining')
  const [newCurrency, setNewCurrency] = useState('MYR')
  const [newNote, setNewNote] = useState('')
  const [taxInclusive, setTaxInclusive] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState(false)

  function reload() {
    const loaded = getLearnedRules()
    setRules(loaded)
    setStats(getMemoryStats())
    if (onRulesUpdated) onRulesUpdated()
  }

  function handleDelete(name: string) {
    deleteMerchantRule(name)
    reload()
  }

  function handleClear() {
    if (window.confirm('Are you sure you want to reset learned merchant memory?')) {
      clearAllRules()
      reload()
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newStore.trim()) return

    saveMerchantCorrection({
      storeName: newStore.trim(),
      normalizedName: newStore.trim(),
      currency: newCurrency,
      category: newCategory,
      taxInclusive,
      correctionNotes: newNote.trim() ? [newNote.trim()] : ['Custom merchant learning profile'],
    })

    setNewStore('')
    setNewNote('')
    setShowAddForm(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
    reload()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="relative h-full w-full max-w-lg bg-zinc-950 text-zinc-100 border-l border-zinc-800 shadow-2xl flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Adaptive Merchant Memory</h2>
              <p className="text-xs text-zinc-400">Stores learned tax rules and layout corrections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 py-4 border-b border-zinc-800 text-center">
          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Merchants</p>
            <p className="text-lg font-mono font-semibold text-zinc-100 mt-0.5">{stats.totalMerchants}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Corrections</p>
            <p className="text-lg font-mono font-semibold text-emerald-400 mt-0.5">{stats.totalCorrections}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Accuracy</p>
            <p className="text-lg font-mono font-semibold text-emerald-400 mt-0.5">{stats.accuracyEstimate}%</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            Merchant rule saved. Next scan will prioritize these rules.
          </div>
        )}

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Remembered Stores ({rules.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              type="button"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
            >
              <Plus className="h-3 w-3" />
              {showAddForm ? 'Cancel' : 'Add Rule'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAdd} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Village Grocer"
                  value={newStore}
                  onChange={(e) => setNewStore(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="MYR">MYR (RM)</option>
                    <option value="USD">USD ($)</option>
                    <option value="SGD">SGD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Meals & Dining">Meals & Dining</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Travel & Fuel">Travel & Fuel</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="taxInc"
                  checked={taxInclusive}
                  onChange={(e) => setTaxInclusive(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="taxInc" className="text-xs text-zinc-300">
                  Item prices already include taxes (tax inclusive)
                </label>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Pattern Note</label>
                <input
                  type="text"
                  placeholder="e.g. Receipt number is at bottom barcode"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-lg transition-colors"
              >
                Save Learned Rule
              </button>
            </form>
          )}

          {rules.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-8">
              No merchant rules saved yet. Scan a receipt and edit fields to train the memory.
            </p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.storeName}
                className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-100">{rule.storeName}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {rule.currency}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {rule.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {rule.taxInclusive ? 'Tax Included' : 'Tax Added'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(rule.storeName)}
                    type="button"
                    title="Delete merchant memory"
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {rule.correctionNotes && rule.correctionNotes.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1">
                    {rule.correctionNotes.map((note, i) => (
                      <p key={i} className="text-[11px] text-zinc-400 leading-relaxed">
                        • {note}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
          <button
            onClick={handleClear}
            type="button"
            className="text-zinc-500 hover:text-red-400 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Memory
          </button>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
