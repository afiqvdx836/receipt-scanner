"use server";

import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export type ReceiptItem = {
  name: string;
  qty: number;
  unitPrice: number;
  price: number;
  discount?: number;
  taxRate?: number;
};

export type ReceiptData = {
  // Backwards compatibility properties
  storeName: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;

  // Detailed enhanced schema properties
  merchant: {
    name: string;
    branch?: string;
    address?: string;
    phone?: string;
    taxId?: string;
  };
  meta: {
    receiptNumber?: string;
    date: string;
    time?: string;
    cashier?: string;
    category: string;
  };
  currency: {
    code: string;
    symbol: string;
  };
  financials: {
    subtotal: number;
    discounts: number;
    tax: number;
    taxRatePercent?: number;
    serviceCharge: number;
    rounding: number;
    grandTotal: number;
  };
  payment: {
    method: string;
    cardBrand?: string;
    last4Digits?: string;
  };
  confidence: {
    score: number;
    notes: string[];
  };
};

const receiptSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    merchant: {
      type: SchemaType.OBJECT,
      properties: {
        name: {
          type: SchemaType.STRING,
          description: "Store or merchant business name",
        },
        branch: {
          type: SchemaType.STRING,
          description: "Outlet or branch name if available",
        },
        address: {
          type: SchemaType.STRING,
          description: "Street address or location",
        },
        phone: { type: SchemaType.STRING, description: "Phone number" },
        taxId: {
          type: SchemaType.STRING,
          description: "Tax registration number, SST, GST, or EIN",
        },
      },
      required: ["name"],
    },
    meta: {
      type: SchemaType.OBJECT,
      properties: {
        receiptNumber: {
          type: SchemaType.STRING,
          description: "Invoice or receipt reference number",
        },
        date: {
          type: SchemaType.STRING,
          description: "Transaction date in YYYY-MM-DD format if possible",
        },
        time: {
          type: SchemaType.STRING,
          description: "Transaction time e.g. 14:32:00",
        },
        cashier: {
          type: SchemaType.STRING,
          description: "Cashier name or register ID",
        },
        category: {
          type: SchemaType.STRING,
          description:
            "Expense category: Meals & Dining, Groceries, Office Supplies, Travel & Fuel, Technology, Utilities, or Other",
        },
      },
      required: ["date", "category"],
    },
    currency: {
      type: SchemaType.OBJECT,
      properties: {
        code: {
          type: SchemaType.STRING,
          description: "ISO 3-letter currency code like MYR, USD, EUR, SGD",
        },
        symbol: {
          type: SchemaType.STRING,
          description: "Currency symbol like RM, $, €, £",
        },
      },
      required: ["code", "symbol"],
    },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.STRING,
            description: "Product or service description",
          },
          qty: { type: SchemaType.NUMBER, description: "Quantity purchased" },
          unitPrice: {
            type: SchemaType.NUMBER,
            description: "Individual unit price",
          },
          price: { type: SchemaType.NUMBER, description: "Line total price" },
          discount: {
            type: SchemaType.NUMBER,
            description: "Discount applied to this line if any",
          },
        },
        required: ["name", "qty", "price"],
      },
    },
    financials: {
      type: SchemaType.OBJECT,
      properties: {
        subtotal: {
          type: SchemaType.NUMBER,
          description: "Sum of items before taxes or service charges",
        },
        discounts: {
          type: SchemaType.NUMBER,
          description: "Overall receipt discounts or coupons",
        },
        tax: {
          type: SchemaType.NUMBER,
          description: "Total tax amount (SST, GST, VAT)",
        },
        taxRatePercent: {
          type: SchemaType.NUMBER,
          description: "Tax percentage rate if stated",
        },
        serviceCharge: {
          type: SchemaType.NUMBER,
          description: "Service charge or tip amount",
        },
        rounding: {
          type: SchemaType.NUMBER,
          description: "Cash rounding adjustment if present",
        },
        grandTotal: {
          type: SchemaType.NUMBER,
          description: "Final payable total",
        },
      },
      required: ["subtotal", "tax", "grandTotal"],
    },
    payment: {
      type: SchemaType.OBJECT,
      properties: {
        method: {
          type: SchemaType.STRING,
          description:
            "Payment method like Cash, Credit Card, Debit Card, E-Wallet",
        },
        cardBrand: {
          type: SchemaType.STRING,
          description: "Card network like Visa, Mastercard, AMEX",
        },
        last4Digits: {
          type: SchemaType.STRING,
          description: "Last 4 digits of card",
        },
      },
      required: ["method"],
    },
    confidence: {
      type: SchemaType.OBJECT,
      properties: {
        score: {
          type: SchemaType.NUMBER,
          description:
            "Confidence between 0 and 100 on clarity and completeness",
        },
        notes: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description:
            "Any notable observations, crumpled paper issues, or low-contrast text",
        },
      },
      required: ["score"],
    },
  },
  required: [
    "merchant",
    "meta",
    "currency",
    "items",
    "financials",
    "payment",
    "confidence",
  ],
};

export type ScanResult =
  { success: true; data: ReceiptData } | { success: false; error: string };

export async function scanReceipt(formData: FormData): Promise<ScanResult> {
  const file = formData.get("receipt") as File;
  if (!file) {
    return { success: false, error: "No receipt image file provided." };
  }

  if (!apiKey) {
    return {
      success: false,
      error: "Server configuration error: AI service key is not configured.",
    };
  }

  const learnedContext = (formData.get("learnedMemory") as string) || "";

  let parsed: Record<string, unknown>;
  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = (file.type || "image/jpeg") as
      "image/jpeg" | "image/png" | "image/webp";

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
      },
    });

    const systemPrompt = `You are a high-precision financial auditor and receipt extraction model.
Carefully examine this receipt image. Extract every single line item, price, tax rate, and merchant detail.

Guidelines:
1. Currency: Identify the correct currency based on symbols (RM, $, SGD, €, £), store location, or receipt headers. Default to MYR if in Malaysia, USD if in US.
2. Prices & Math: Ensure line item unit prices and line totals reflect the numbers on the receipt.
3. Tax & Subtotal: If tax is inclusive, note that in subtotal or tax fields. Do not hallucinate items that are not present.
4. Clean text: Strip noisy OCR artifacts. Ensure item descriptions are clear and legible.
${learnedContext ? `\nMerchant Rules Memory:\n${learnedContext}\nApply the above learned rules if the store matches.` : ""}
`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
      systemPrompt,
    ]);

    const text = result.response.text();
    parsed = JSON.parse(text);
  } catch (err: unknown) {
    console.error("Gemini API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: `Failed to process receipt: ${message}` };
  }

  // Provide robust normalization and legacy backwards compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = parsed as any;
  const storeName = p.merchant?.name || "Unknown Merchant";
  const date = p.meta?.date || new Date().toISOString().split("T")[0];
  const items = Array.isArray(p.items)
    ? p.items.map(
      (item: {
        name?: string;
        qty?: number;
        unitPrice?: number;
        price?: number;
        discount?: number;
        taxRate?: number;
      }) => ({
        name: item.name || "Item",
        qty: Number(item.qty) || 1,
        unitPrice: Number(item.unitPrice) || Number(item.price) || 0,
        price: Number(item.price) || 0,
        discount: Number(item.discount) || 0,
        taxRate: Number(item.taxRate) || 0,
      }),
    )
    : [];

  const subtotal = Number(p.financials?.subtotal) || 0;
  const tax = Number(p.financials?.tax) || 0;
  const total = Number(p.financials?.grandTotal) || 0;
  const paymentMethod = p.payment?.method || "Cash";

  const enrichedData: ReceiptData = {
    storeName,
    date,
    items,
    subtotal,
    tax,
    total,
    paymentMethod,
    merchant: {
      name: storeName,
      branch: p.merchant?.branch || "",
      address: p.merchant?.address || "",
      phone: p.merchant?.phone || "",
      taxId: p.merchant?.taxId || "",
    },
    meta: {
      receiptNumber: p.meta?.receiptNumber || "",
      date,
      time: p.meta?.time || "",
      cashier: p.meta?.cashier || "",
      category: p.meta?.category || "General",
    },
    currency: {
      code: p.currency?.code || "MYR",
      symbol: p.currency?.symbol || "RM",
    },
    financials: {
      subtotal,
      discounts: Number(p.financials?.discounts) || 0,
      tax,
      taxRatePercent: Number(p.financials?.taxRatePercent) || 0,
      serviceCharge: Number(p.financials?.serviceCharge) || 0,
      rounding: Number(p.financials?.rounding) || 0,
      grandTotal: total,
    },
    payment: {
      method: paymentMethod,
      cardBrand: p.payment?.cardBrand || "",
      last4Digits: p.payment?.last4Digits || "",
    },
    confidence: {
      score: Number(p.confidence?.score) || 95,
      notes: Array.isArray(p.confidence?.notes) ? p.confidence.notes : [],
    },
  };

  return { success: true, data: enrichedData };
}
