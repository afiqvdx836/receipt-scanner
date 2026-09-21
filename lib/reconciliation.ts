export interface LineItemAudit {
  name: string
  qty: number
  unitPrice: number
  totalPrice: number
  discount?: number
  taxRate?: number
  isMathAccurate: boolean
  suggestedTotal: number
}

export interface ReconciliationResult {
  isReconciled: boolean
  computedSubtotal: number
  extractedSubtotal: number
  computedGrandTotal: number
  extractedGrandTotal: number
  discrepancy: number
  status: 'reconciled' | 'discrepancy' | 'unverified'
  notes: string[]
}

/**
 * Reconciles line items and totals to catch AI hallucination or scan discrepancies.
 */
export function reconcileReceipt(params: {
  items: Array<{ name: string; qty: number; unitPrice?: number; price: number; discount?: number }>
  subtotal: number
  tax: number
  serviceCharge?: number
  discounts?: number
  rounding?: number
  grandTotal: number
}): ReconciliationResult {
  const {
    items = [],
    subtotal = 0,
    tax = 0,
    serviceCharge = 0,
    discounts = 0,
    rounding = 0,
    grandTotal = 0,
  } = params

  const notes: string[] = []

  // 1. Calculate sum of items
  const computedItemsSum = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0)
  const normalizedItemsSum = Math.round(computedItemsSum * 100) / 100

  // If subtotal is 0 or missing, default to items sum
  const effectiveSubtotal = subtotal > 0 ? subtotal : normalizedItemsSum

  // 2. Calculate grand total
  const calculatedGrandTotal =
    effectiveSubtotal + (Number(tax) || 0) + (Number(serviceCharge) || 0) - (Number(discounts) || 0) + (Number(rounding) || 0)

  const normalizedCalculatedTotal = Math.round(calculatedGrandTotal * 100) / 100
  const normalizedExtractedTotal = Math.round((Number(grandTotal) || 0) * 100) / 100

  const discrepancy = Math.round((normalizedCalculatedTotal - normalizedExtractedTotal) * 100) / 100

  // 3. Line items sanity check
  items.forEach((item, idx) => {
    if (item.qty && item.unitPrice && item.unitPrice > 0) {
      const expectedItemTotal = Math.round(item.qty * item.unitPrice * 100) / 100
      const discount = item.discount || 0
      const netExpected = Math.round((expectedItemTotal - discount) * 100) / 100
      const actualPrice = Math.round(item.price * 100) / 100

      if (Math.abs(netExpected - actualPrice) > 0.05) {
        notes.push(`Item #${idx + 1} (${item.name}): ${item.qty} × ${item.unitPrice} = ${netExpected}, but listed as ${actualPrice}`)
      }
    }
  })

  // Tolerance check (<= 0.02 to allow for small rounding)
  const isMatch = Math.abs(discrepancy) <= 0.02

  if (!isMatch) {
    if (discrepancy > 0) {
      notes.push(`Items plus taxes exceed listed grand total by ${discrepancy.toFixed(2)}`)
    } else {
      notes.push(`Listed grand total exceeds items plus taxes by ${Math.abs(discrepancy).toFixed(2)}`)
    }
  }

  return {
    isReconciled: isMatch,
    computedSubtotal: normalizedItemsSum,
    extractedSubtotal: subtotal,
    computedGrandTotal: normalizedCalculatedTotal,
    extractedGrandTotal: normalizedExtractedTotal,
    discrepancy,
    status: isMatch ? 'reconciled' : 'discrepancy',
    notes,
  }
}

/**
 * Format currency nicely with symbol and code.
 */
export function formatCurrency(
  amount: number,
  currencyCode = 'MYR',
  currencySymbol?: string
): string {
  const cleanAmount = (Number(amount) || 0).toFixed(2)
  const symbol = currencySymbol || (currencyCode === 'MYR' ? 'RM' : currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : currencyCode === 'GBP' ? '£' : currencyCode)
  return `${symbol} ${cleanAmount}`
}
