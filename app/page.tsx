'use client'

import { useState, useRef, useEffect } from 'react'
import { scanReceipt, ReceiptData } from './actions/scan'
import ReceiptInspector from '@/components/ReceiptInspector'
import MemoryDrawer from '@/components/MemoryDrawer'
import { SAMPLE_RECEIPTS, SampleReceipt } from '@/lib/samples'
import { getMemoryStats, getFewShotPromptForMerchant } from '@/lib/memory'
import {
  Upload,
  Loader2,
  Brain,
  Receipt,
  Sparkles,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react'

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('Analyzing document structure...')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isMemoryOpen, setIsMemoryOpen] = useState(false)
  const [memoryStats, setMemoryStats] = useState({
    totalMerchants: 2,
    totalCorrections: 2,
    accuracyEstimate: 92.0,
  })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMemoryStats(getMemoryStats())
  }, [])

  function refreshMemory() {
    setMemoryStats(getMemoryStats())
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file in PNG, JPG, or WEBP format.')
      return
    }
    setSelectedFile(file)
    setResult(null)
    setError(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleReset() {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function openFilePicker() {
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }

  async function handleScan(fileToScan?: File) {
    const file = fileToScan || selectedFile
    if (!file) return

    setLoading(true)
    setError(null)
    setLoadingStage('Detecting merchant and layout structure...')

    const t1 = setTimeout(() => {
      setLoadingStage('Extracting line items and tax breakdown...')
    }, 1200)

    const t2 = setTimeout(() => {
      setLoadingStage('Cross-checking mathematical reconciliation...')
    }, 2400)

    try {
      const formData = new FormData()
      formData.append('receipt', file)

      // Query any learned memory rules from persistent storage
      const learnedPrompt = getFewShotPromptForMerchant(file.name.replace(/\.[^/.]+$/, ''))
      if (learnedPrompt) {
        formData.append('learnedMemory', learnedPrompt)
      }

      const data = await scanReceipt(formData)
      setResult(data)
    } catch (err: unknown) {
      console.error('Scan error:', err)
      const message = err instanceof Error ? err.message : 'Failed to process receipt. Please try again.'
      setError(message)
    } finally {
      clearTimeout(t1)
      clearTimeout(t2)
      setLoading(false)
    }
  }

  function loadSample(sample: SampleReceipt) {
    setSelectedFile(null)
    setPreview(sample.previewUrl)
    setResult(sample.data)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
      {/* Navigation: Single line at desktop, height <= 80px */}
      <nav className="h-16 border-b border-zinc-900 px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Receipt className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">Chronicle</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            v2.0
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMemoryOpen(true)}
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            <Brain className="h-3.5 w-3.5 text-emerald-400" />
            <span>Learned Memory</span>
            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300">
              {memoryStats.totalMerchants} stores
            </span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {result ? (
          /* Dual-Pane Document Inspector */
          <ReceiptInspector
            receipt={result}
            previewUrl={preview}
            onReset={handleReset}
            onMemoryUpdated={refreshMemory}
          />
        ) : (
          /* Intake Command Center */
          <div className="max-w-3xl mx-auto space-y-8 pt-4 sm:pt-8">
            {/* Hero Discipline: Headline max 2 lines, subtext max 20 words */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <Sparkles className="h-3.5 w-3.5" />
                Adaptive Financial Ledger
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-100">
                Self-Learning Financial Receipt Scanner.
              </h1>
              <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Autonomous high-precision extraction, mathematical reconciliation, and adaptive merchant memory.
              </p>
            </div>

            {/* Hidden native input */}
            <input
              ref={inputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
              onChange={handleChange}
            />

            {/* Upload Zone */}
            <div className="bg-zinc-900/40 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-xs">
              {!preview ? (
                /* Empty Dropzone */
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openFilePicker}
                  onKeyDown={(e) => e.key === 'Enter' && openFilePicker()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-500/5 scale-[0.99]'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-950'
                  }`}
                >
                  <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-200">
                      Drop receipt image here or browse files
                    </p>
                    <p className="text-xs text-zinc-500 font-mono">
                      Accepts PNG, JPG, or WEBP up to 20MB
                    </p>
                  </div>
                </div>
              ) : (
                /* Selected File Preview & Execution */
                <div className="space-y-5">
                  <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-center overflow-hidden max-h-80">
                    <img
                      src={preview}
                      alt="Receipt candidate"
                      className="max-h-72 object-contain rounded-lg"
                    />
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
                      <span>{selectedFile.name}</span>
                      <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={openFilePicker}
                      disabled={loading}
                      type="button"
                      className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors disabled:opacity-50"
                    >
                      Choose Different Photo
                    </button>
                    <button
                      onClick={() => handleScan()}
                      disabled={loading}
                      type="button"
                      className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                          <span>Processing Document...</span>
                        </>
                      ) : (
                        <>
                          <span>Run Precision Extraction</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Live Loading Stage Tracker */}
              {loading && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{loadingStage}</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-pulse w-3/4 rounded-full" />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
                  {error}
                </div>
              )}

              {/* Sample Receipt Presets for Instant Testing */}
              <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[11px] uppercase tracking-wider">
                    Instant Test Presets
                  </span>
                  <span className="text-[11px] text-zinc-500">Zero upload required</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SAMPLE_RECEIPTS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => loadSample(sample)}
                      type="button"
                      className="group p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/40 text-left transition-all hover:bg-zinc-900/60"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors truncate">
                          {sample.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-500 font-mono">
                        <span>{sample.category}</span>
                        <span className="text-zinc-300 font-medium">{sample.totalFormatted}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid: Asymmetric 3-col with no fake div screenshot */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-400">
              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-900 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Math Reconciliation</span>
                </div>
                <p className="leading-relaxed text-zinc-500">
                  Automated checksum engine flags discrepancies between item totals, taxes, and grand totals.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-900 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Brain className="h-4 w-4 text-emerald-400" />
                  <span>Merchant Memory</span>
                </div>
                <p className="leading-relaxed text-zinc-500">
                  Corrections train persistent rules for tax behavior, categories, and store aliases.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-900 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  <span>Dual Document Canvas</span>
                </div>
                <p className="leading-relaxed text-zinc-500">
                  Side-by-side inspection with zoom, rotation, and high-contrast thermal paper enhancement.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Memory Drawer Modal */}
      <MemoryDrawer
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        onRulesUpdated={refreshMemory}
      />
    </main>
  )
}