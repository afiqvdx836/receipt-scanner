export interface MerchantRule {
  storeName: string
  normalizedName: string
  currency: string
  category: string
  taxInclusive: boolean
  correctionNotes: string[]
  updatedAt: string
  correctionsCount: number
}

const STORAGE_KEY = 'receipt_scanner_merchant_memory_v1'

const DEFAULT_PRESETS: MerchantRule[] = [
  {
    storeName: 'Jaya Grocer',
    normalizedName: 'Jaya Grocer',
    currency: 'MYR',
    category: 'Groceries',
    taxInclusive: true,
    correctionNotes: [
      'Subtotal includes SST. Receipt number is labeled as TR# or Doc#.',
      'Discount lines are prefixed with DISC or -.',
    ],
    updatedAt: new Date().toISOString(),
    correctionsCount: 1,
  },
  {
    storeName: 'Starbucks Coffee',
    normalizedName: 'Starbucks Coffee',
    currency: 'MYR',
    category: 'Meals & Dining',
    taxInclusive: false,
    correctionNotes: [
      'Service tax 6% is typically added separately above total.',
      'Card type and last 4 digits appear below total.',
    ],
    updatedAt: new Date().toISOString(),
    correctionsCount: 1,
  },
  {
    storeName: 'Apple Store',
    normalizedName: 'Apple Store',
    currency: 'USD',
    category: 'Technology & Hardware',
    taxInclusive: false,
    correctionNotes: [
      'Tax is listed by state/locality.',
      'Serial numbers and part numbers should not be confused with prices.',
    ],
    updatedAt: new Date().toISOString(),
    correctionsCount: 1,
  },
]

export function getLearnedRules(): MerchantRule[] {
  if (typeof window === 'undefined') return DEFAULT_PRESETS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRESETS))
      return DEFAULT_PRESETS
    }
    return JSON.parse(raw) as MerchantRule[]
  } catch (e) {
    console.error('Failed to load merchant memory:', e)
    return DEFAULT_PRESETS
  }
}

export function findMerchantRule(storeName: string): MerchantRule | null {
  if (!storeName) return null
  const rules = getLearnedRules()
  const lower = storeName.toLowerCase().trim()

  return (
    rules.find(
      (r) =>
        r.storeName.toLowerCase() === lower ||
        r.normalizedName.toLowerCase() === lower ||
        lower.includes(r.storeName.toLowerCase()) ||
        r.storeName.toLowerCase().includes(lower)
    ) || null
  )
}

export function saveMerchantCorrection(rule: Omit<MerchantRule, 'updatedAt' | 'correctionsCount'> & { correctionsCount?: number }): void {
  if (typeof window === 'undefined') return
  try {
    const rules = getLearnedRules()
    const lower = rule.storeName.toLowerCase().trim()
    const existingIndex = rules.findIndex(
      (r) => r.storeName.toLowerCase() === lower || r.normalizedName.toLowerCase() === lower
    )

    const updated: MerchantRule = {
      ...rule,
      updatedAt: new Date().toISOString(),
      correctionsCount: existingIndex >= 0 ? (rules[existingIndex].correctionsCount || 1) + 1 : 1,
    }

    if (existingIndex >= 0) {
      rules[existingIndex] = updated
    } else {
      rules.unshift(updated)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch (e) {
    console.error('Failed to save merchant correction:', e)
  }
}

export function deleteMerchantRule(storeName: string): void {
  if (typeof window === 'undefined') return
  try {
    const rules = getLearnedRules().filter(
      (r) => r.storeName.toLowerCase() !== storeName.toLowerCase()
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch (e) {
    console.error('Failed to delete rule:', e)
  }
}

export function clearAllRules(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear rules:', e)
  }
}

export function getMemoryStats(): {
  totalMerchants: number
  totalCorrections: number
  accuracyEstimate: number
} {
  const rules = getLearnedRules()
  const totalCorrections = rules.reduce((acc, r) => acc + (r.correctionsCount || 1), 0)
  // Higher corrections mean refined patterns
  const accuracyEstimate = Math.min(99.4, 88.0 + rules.length * 1.5 + totalCorrections * 0.5)

  return {
    totalMerchants: rules.length,
    totalCorrections,
    accuracyEstimate: Number(accuracyEstimate.toFixed(1)),
  }
}

export function getFewShotPromptForMerchant(storeName: string): string {
  const rule = findMerchantRule(storeName)
  if (!rule) return ''

  return `
Learned Merchant Knowledge for "${rule.storeName}":
- Standardized Store Name: "${rule.normalizedName}"
- Expected Currency: ${rule.currency}
- Default Expense Category: ${rule.category}
- Tax Behavior: ${rule.taxInclusive ? 'Prices include tax' : 'Tax is added separately to subtotal'}
- Historical Notes: ${rule.correctionNotes.join('; ')}
`.trim()
}
