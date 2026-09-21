import { ReceiptData } from '@/app/actions/scan'

export interface SampleReceipt {
  id: string
  label: string
  storeName: string
  category: string
  totalFormatted: string
  data: ReceiptData
  previewUrl: string
}

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'artisan-cafe',
    label: 'Artisan Roast & Bakery',
    storeName: 'Artisan Roast & Bakery',
    category: 'Meals & Dining',
    totalFormatted: 'RM 38.40',
    previewUrl: 'https://images.unsplash.com/photo-1554415707-9e4966a604f7?q=80&w=800&auto=format&fit=crop',
    data: {
      storeName: 'Artisan Roast & Bakery',
      date: '2026-03-14',
      items: [
        { name: 'Oat Milk Flat White', qty: 2, unitPrice: 13.0, price: 26.0 },
        { name: 'Sourdough Almond Croissant', qty: 1, unitPrice: 10.5, price: 10.5 },
      ],
      subtotal: 36.5,
      tax: 2.19,
      total: 38.69,
      paymentMethod: 'Credit Card',
      merchant: {
        name: 'Artisan Roast & Bakery',
        branch: 'Bangsar Outlet',
        address: '42 Jalan Telawi 3, Bangsar, 59100 Kuala Lumpur',
        phone: '+60 3-2287 1999',
        taxId: 'W10-1808-32000412',
      },
      meta: {
        receiptNumber: 'INV-2026-08819',
        date: '2026-03-14',
        time: '10:24:18',
        cashier: 'Sara M.',
        category: 'Meals & Dining',
      },
      currency: {
        code: 'MYR',
        symbol: 'RM',
      },
      financials: {
        subtotal: 36.5,
        discounts: 0,
        tax: 2.19,
        taxRatePercent: 6,
        serviceCharge: 0,
        rounding: 0.01,
        grandTotal: 38.7,
      },
      payment: {
        method: 'Credit Card',
        cardBrand: 'Visa',
        last4Digits: '8841',
      },
      confidence: {
        score: 98,
        notes: ['Clean thermal receipt', 'SST 6% explicitly calculated'],
      },
    },
  },
  {
    id: 'metro-grocer',
    label: 'Metro Fresh Supermarket',
    storeName: 'Metro Fresh Supermarket',
    category: 'Groceries',
    totalFormatted: 'RM 94.30',
    previewUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop',
    data: {
      storeName: 'Metro Fresh Supermarket',
      date: '2026-03-18',
      items: [
        { name: 'Organic Rolled Oats 1kg', qty: 1, unitPrice: 18.5, price: 18.5 },
        { name: 'Greek Yogurt Unsweetened', qty: 2, unitPrice: 14.2, price: 28.4 },
        { name: 'Fresh Hass Avocado 3pk', qty: 1, unitPrice: 16.9, price: 16.9 },
        { name: 'Cold Brew Ethiopian 500ml', qty: 2, unitPrice: 15.0, price: 30.0 },
        { name: 'Member Loyalty Voucher', qty: 1, unitPrice: -5.0, price: -5.0, discount: 5.0 },
      ],
      subtotal: 93.8,
      tax: 0.0,
      total: 93.8,
      paymentMethod: 'E-Wallet',
      merchant: {
        name: 'Metro Fresh Supermarket',
        branch: 'Damansara Utama',
        address: 'Level G, The Starling Mall, Petaling Jaya',
        phone: '+60 3-7733 8000',
        taxId: '001928374612',
      },
      meta: {
        receiptNumber: 'MF-8839120',
        date: '2026-03-18',
        time: '17:42:05',
        cashier: 'Kiosk 04',
        category: 'Groceries',
      },
      currency: {
        code: 'MYR',
        symbol: 'RM',
      },
      financials: {
        subtotal: 93.8,
        discounts: 5.0,
        tax: 0.0,
        taxRatePercent: 0,
        serviceCharge: 0,
        rounding: 0.0,
        grandTotal: 88.8,
      },
      payment: {
        method: 'Touch n Go eWallet',
        cardBrand: 'DuitNow QR',
        last4Digits: '9102',
      },
      confidence: {
        score: 96,
        notes: ['Voucher discount line processed accurately'],
      },
    },
  },
  {
    id: 'tech-hardware',
    label: 'Apex Hardware & Electronics',
    storeName: 'Apex Hardware & Electronics',
    category: 'Technology',
    totalFormatted: '$ 189.98',
    previewUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
    data: {
      storeName: 'Apex Hardware & Electronics',
      date: '2026-03-10',
      items: [
        { name: 'Ultra-Fast 100W GaN Charger', qty: 1, unitPrice: 59.99, price: 59.99 },
        { name: 'Braided Thunderbolt 4 Cable 2m', qty: 2, unitPrice: 29.99, price: 59.98 },
        { name: 'Ergonomic Vertical Mouse Pro', qty: 1, unitPrice: 69.99, price: 69.99 },
      ],
      subtotal: 189.96,
      tax: 15.2,
      total: 205.16,
      paymentMethod: 'Apple Pay',
      merchant: {
        name: 'Apex Hardware & Electronics',
        branch: 'San Francisco Flagship',
        address: '742 Market Street, San Francisco, CA 94102',
        phone: '+1 (415) 555-0199',
        taxId: 'US-CA-94-1829304',
      },
      meta: {
        receiptNumber: 'TXN-90241-SF',
        date: '2026-03-10',
        time: '14:15:32',
        cashier: 'Terminal 02',
        category: 'Technology',
      },
      currency: {
        code: 'USD',
        symbol: '$',
      },
      financials: {
        subtotal: 189.96,
        discounts: 0,
        tax: 15.2,
        taxRatePercent: 8.0,
        serviceCharge: 0,
        rounding: 0,
        grandTotal: 205.16,
      },
      payment: {
        method: 'Apple Pay',
        cardBrand: 'Mastercard',
        last4Digits: '4129',
      },
      confidence: {
        score: 99,
        notes: ['Perfect barcode and item code reconciliation'],
      },
    },
  },
]
