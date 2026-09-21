'use client'

import { useState, useRef, useEffect } from 'react'
import { scanReceipt, ReceiptData } from './actions/scan'
import ReceiptInspector from '@/components/ReceiptInspector'
import MemoryDrawer from '@/components/MemoryDrawer'
import HeroParallaxSection from '@/components/HeroParallaxSection'
import { SAMPLE_RECEIPTS, SampleReceipt } from '@/lib/samples'
import { getMemoryStats, getFewShotPromptForMerchant } from '@/lib/memory'
import {
  Upload,
  Loader2,
  Brain,
  Receipt,
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
    <main
      className="min-h-screen flex flex-col antialiased"
      style={{ backgroundColor: '#100904', color: '#ffedd7' }}
    >
      {/* =========================================================================
          FIXED TOP NAVIGATION — ORYZO style
          Transparent, minimal, 4 items max. Logo wordmark left, controls right.
          All uppercase weight 500, 12px, Warm Cream.
          ========================================================================= */}
      <nav
        className="h-16 px-6 flex items-center justify-between sticky top-0 z-30"
        style={{
          backgroundColor: 'rgba(16, 9, 4, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #40372e',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo Wordmark — ORYZO spec: pure typographic identity */}
          <span
            className="font-medium uppercase"
            style={{ fontSize: '14px', color: '#ffedd7', letterSpacing: '0.06em' }}
          >
            CHRONICLE
          </span>
          <span
            className="font-medium uppercase"
            style={{
              fontSize: '8px',
              color: '#6c5f51',
              letterSpacing: '0.1em',
              padding: '2px 6px',
              border: '1px solid #40372e',
              borderRadius: '22.5px',
            }}
          >
            V2.0
          </span>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={() => setIsMemoryOpen(true)}
            type="button"
            className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-70 cursor-pointer"
            style={{
              padding: '7.5px 16px',
              borderRadius: '22.5px',
              border: '1px solid #40372e',
              backgroundColor: 'transparent',
              color: '#ffedd7',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.04em',
            }}
          >
            <Brain className="h-3.5 w-3.5" style={{ color: '#dc5000' }} />
            <span>MEMORY</span>
            <span
              style={{
                color: '#6c5f51',
                fontSize: '10px',
                marginLeft: '4px',
              }}
            >
              {memoryStats.totalMerchants}
            </span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 w-full mx-auto">
        {result ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Dual-Pane Document Inspector */}
            <ReceiptInspector
              receipt={result}
              previewUrl={preview}
              onReset={handleReset}
              onMemoryUpdated={refreshMemory}
            />
          </div>
        ) : (
          <div>
            <HeroParallaxSection onScanClick={openFilePicker} />

            {/* =========================================================================
                INTAKE COMMAND CENTER — ORYZO void-mode section
                Walnut Shadow canvas, Cork Border dashed dividers, Bark Brown surfaces
                ========================================================================= */}
            <div
              id="upload-zone"
              className="max-w-3xl mx-auto space-y-8 px-6 sm:px-8 pb-24 pt-8"
            >
              {/* Hidden native input */}
              <input
                ref={inputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={handleChange}
              />

              {/* Upload Zone — Bark Brown surface, 12px radius, dashed border */}
              <div
                className="space-y-6"
                style={{
                  borderRadius: '12px',
                  border: '1px solid #40372e',
                  backgroundColor: '#382416',
                  padding: '24px',
                }}
              >
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
                    className="flex flex-col items-center justify-center gap-5 p-12 text-center cursor-pointer transition-all duration-200"
                    style={{
                      borderRadius: '8px',
                      border: isDragging
                        ? '2px dashed #dc5000'
                        : '2px dashed #40372e',
                      backgroundColor: isDragging
                        ? 'rgba(220, 80, 0, 0.05)'
                        : '#100904',
                      transform: isDragging ? 'scale(0.99)' : 'scale(1)',
                    }}
                  >
                    <div
                      className="h-12 w-12 flex items-center justify-center"
                      style={{
                        borderRadius: '12px',
                        border: '1px solid #40372e',
                        backgroundColor: '#382416',
                        color: '#6c5f51',
                      }}
                    >
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5">
                      <p
                        className="font-medium uppercase"
                        style={{ fontSize: '14px', color: '#ffedd7', letterSpacing: '0.02em' }}
                      >
                        DROP RECEIPT IMAGE OR BROWSE
                      </p>
                      <p
                        className="uppercase"
                        style={{ fontSize: '10px', color: '#6c5f51', fontWeight: 500, letterSpacing: '0.06em' }}
                      >
                        ACCEPTS PNG, JPG, OR WEBP UP TO 20MB
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Selected File Preview & Execution */
                  <div className="space-y-5">
                    <div
                      className="relative flex items-center justify-center overflow-hidden max-h-80"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #40372e',
                        backgroundColor: '#100904',
                        padding: '12px',
                      }}
                    >
                      <img
                        src={preview}
                        alt="Receipt candidate"
                        className="max-h-72 object-contain"
                        style={{ borderRadius: '4px' }}
                      />
                    </div>

                    {selectedFile && (
                      <div
                        className="flex items-center justify-between px-1 uppercase"
                        style={{ fontSize: '10px', color: '#6c5f51', fontWeight: 500, letterSpacing: '0.06em' }}
                      >
                        <span>{selectedFile.name}</span>
                        <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {/* Ghost button — choose different */}
                      <button
                        onClick={openFilePicker}
                        disabled={loading}
                        type="button"
                        className="flex-1 font-medium uppercase transition-opacity duration-200 hover:opacity-70 disabled:opacity-40 cursor-pointer"
                        style={{
                          borderRadius: '22.5px',
                          border: '1px solid #ffedd7',
                          backgroundColor: 'transparent',
                          color: '#ffedd7',
                          padding: '10px 16px',
                          fontSize: '12px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        CHOOSE DIFFERENT
                      </button>

                      {/* Pill CTA — run extraction */}
                      <button
                        onClick={() => handleScan()}
                        disabled={loading}
                        type="button"
                        className="flex-1 flex items-center justify-center gap-2 font-medium uppercase transition-opacity duration-200 hover:opacity-80 disabled:opacity-40 cursor-pointer"
                        style={{
                          borderRadius: '36px',
                          backgroundColor: '#382416',
                          border: '1px solid #40372e',
                          color: '#ffedd7',
                          padding: '10px 16px',
                          fontSize: '12px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#6c5f51' }} />
                            <span>PROCESSING...</span>
                          </>
                        ) : (
                          <>
                            <span>RUN EXTRACTION</span>
                            <ArrowRight className="h-3.5 w-3.5" style={{ color: '#6c5f51' }} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading Stage Tracker */}
                {loading && (
                  <div
                    className="p-4 space-y-2"
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #40372e',
                      backgroundColor: '#100904',
                    }}
                  >
                    <div
                      className="flex items-center gap-2 uppercase"
                      style={{ fontSize: '10px', fontWeight: 500, color: '#dc5000', letterSpacing: '0.06em' }}
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{loadingStage}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden" style={{ borderRadius: '4px', backgroundColor: '#382416' }}>
                      <div
                        className="h-full w-3/4"
                        style={{
                          borderRadius: '4px',
                          backgroundColor: '#dc5000',
                          animation: 'pulse-warm 2s ease-in-out infinite',
                        }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    className="p-4 text-center uppercase"
                    style={{
                      borderRadius: '8px',
                      border: '1px solid rgba(220, 80, 0, 0.3)',
                      backgroundColor: 'rgba(220, 80, 0, 0.05)',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#dc5000',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Dashed Divider */}
                <div style={{ borderTop: '1px dashed #40372e' }} />

                {/* Sample Receipt Presets */}
                <div className="space-y-4">
                  <div
                    className="flex items-center justify-between uppercase"
                    style={{ fontSize: '10px', fontWeight: 500, color: '#6c5f51', letterSpacing: '0.08em' }}
                  >
                    <span>INSTANT TEST PRESETS</span>
                    <span>ZERO UPLOAD REQUIRED</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SAMPLE_RECEIPTS.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => loadSample(sample)}
                        type="button"
                        className="group p-4 text-left transition-all duration-200 hover:opacity-80 cursor-pointer"
                        style={{
                          borderRadius: '12px',
                          border: '1px solid #40372e',
                          backgroundColor: '#100904',
                        }}
                      >
                        <div
                          className="font-medium uppercase truncate"
                          style={{ fontSize: '12px', color: '#ffedd7', letterSpacing: '0.02em' }}
                        >
                          {sample.label}
                        </div>
                        <div
                          className="flex items-center justify-between mt-1.5 uppercase"
                          style={{ fontSize: '10px', fontWeight: 500, color: '#6c5f51', letterSpacing: '0.06em' }}
                        >
                          <span>{sample.category}</span>
                          <span style={{ color: '#ffedd7' }}>{sample.totalFormatted}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  FEATURE HIGHLIGHTS — Three-column grid
                  12px radius cards, Bark Brown surface, Cork Border, no shadows.
                  ========================================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className="p-6 space-y-3"
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #40372e',
                    backgroundColor: '#382416',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" style={{ color: '#dc5000' }} />
                    <span
                      className="font-medium uppercase"
                      style={{ fontSize: '12px', color: '#ffedd7', letterSpacing: '0.04em' }}
                    >
                      MATH RECONCILIATION
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.4, color: '#6c5f51' }}>
                    Automated checksum engine flags discrepancies between item totals, taxes, and grand totals.
                  </p>
                </div>

                <div
                  className="p-6 space-y-3"
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #40372e',
                    backgroundColor: '#382416',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" style={{ color: '#dc5000' }} />
                    <span
                      className="font-medium uppercase"
                      style={{ fontSize: '12px', color: '#ffedd7', letterSpacing: '0.04em' }}
                    >
                      MERCHANT MEMORY
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.4, color: '#6c5f51' }}>
                    Corrections train persistent rules for tax behavior, categories, and store aliases.
                  </p>
                </div>

                <div
                  className="p-6 space-y-3"
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #40372e',
                    backgroundColor: '#382416',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" style={{ color: '#dc5000' }} />
                    <span
                      className="font-medium uppercase"
                      style={{ fontSize: '12px', color: '#ffedd7', letterSpacing: '0.04em' }}
                    >
                      DUAL DOCUMENT CANVAS
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.4, color: '#6c5f51' }}>
                    Side-by-side inspection with zoom, rotation, and high-contrast thermal paper enhancement.
                  </p>
                </div>
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