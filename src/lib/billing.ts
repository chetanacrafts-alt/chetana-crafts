import type { Order } from "@/lib/types";

export type BillType = "GST" | "Cash";
export type DiscountMode = "flat" | "percent";

export interface BillCustomer {
  name: string;
  phone: string;
  addr: string;
}

export interface BillLineItem {
  code: string;
  name: string;
  qty: number;
  price: number;
}

export interface BillTotals {
  subtotal: number;
  discountAmount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  gstAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
}

export interface BillPayload {
  billNo: string;
  date: string;
  customer: BillCustomer;
  billType: BillType;
  gstRate: number;
  items: BillLineItem[];
  discountValue: number;
  discountMode: DiscountMode;
  paymentMode: string;
  amountPaid: number;
  notify: boolean;
  totals: BillTotals;
}

export interface ComputeBillTotalsInput {
  billType: BillType;
  gstRate: number;
  items: BillLineItem[];
  discountValue: number;
  discountMode: DiscountMode;
  paymentMode: string;
  amountPaid: number;
}

const INVOICE_NO_PATTERN = /^INV-(\d+)$/;

/** Next sequential invoice number, derived from the highest one already saved
 * on an order. Re-derived from data (not an incrementing counter) so an
 * abandoned bill never burns a number, and it stays correct across devices
 * after a Sheet sync. */
export function generateBillNo(existingOrders: Order[]): string {
  const max = existingOrders.reduce((m, o) => {
    const match = INVOICE_NO_PATTERN.exec(o.billNo ?? "");
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `INV-${String(max + 1).padStart(4, "0")}`;
}

export function computeBillTotals(input: ComputeBillTotalsInput): BillTotals {
  const subtotal = input.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const discountAmount = Math.min(
    subtotal,
    Math.max(
      0,
      input.discountMode === "percent"
        ? (subtotal * input.discountValue) / 100
        : input.discountValue
    )
  );
  const taxable = Math.max(0, subtotal - discountAmount);
  const gstAmount = input.billType === "GST" ? (taxable * input.gstRate) / 100 : 0;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const grandTotal = taxable + gstAmount;
  const paidAmount =
    input.paymentMode === "Partial/Due" ? Math.max(0, input.amountPaid) : grandTotal;
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  return {
    subtotal,
    discountAmount,
    taxable,
    cgst,
    sgst,
    gstAmount,
    grandTotal,
    paidAmount,
    dueAmount,
  };
}

/** Items priced over Rs.1,000 on a 5% GST bill may actually require 12% under
 * standard textile/apparel GST slabs — surfaced as an advisory, not a block. */
export function hasGstRateWarning(
  billType: BillType,
  gstRate: number,
  items: BillLineItem[]
): boolean {
  return billType === "GST" && gstRate === 5 && items.some((it) => it.price > 1000);
}
