import type { BillPayload } from "@/lib/billing";
import type { BusinessSettings, Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const number = normalizePhoneForWhatsApp(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildBillMessage(payload: BillPayload, settings: BusinessSettings): string {
  const businessName = settings.name || "Chetana Crafts";
  const lines: string[] = [];

  lines.push(`*${businessName}*`);
  if (settings.addr) lines.push(settings.addr);
  if (settings.phone) lines.push(`Ph: ${settings.phone}`);
  lines.push("");
  lines.push(payload.billType === "GST" ? "*GST Tax Invoice*" : "*Cash Bill*");
  lines.push(`Bill No: ${payload.billNo}`);
  lines.push(`Date: ${formatDate(payload.date)}`);
  lines.push("");
  lines.push(`*Bill To:* ${payload.customer.name}`);
  if (payload.customer.phone) lines.push(payload.customer.phone);
  if (payload.customer.addr) lines.push(payload.customer.addr);
  lines.push("");
  lines.push("*Items:*");
  payload.items.forEach((it, i) => {
    lines.push(
      `${i + 1}. ${it.name}${it.code ? ` (${it.code})` : ""} x${it.qty} @ ${formatCurrency(it.price)} = ${formatCurrency(it.qty * it.price)}`
    );
  });
  lines.push("");
  lines.push(`Subtotal: ${formatCurrency(payload.totals.subtotal)}`);
  if (payload.totals.discountAmount > 0) {
    lines.push(`Discount: -${formatCurrency(payload.totals.discountAmount)}`);
  }
  if (payload.billType === "GST") {
    lines.push(`CGST (${payload.gstRate / 2}%): ${formatCurrency(payload.totals.cgst)}`);
    lines.push(`SGST (${payload.gstRate / 2}%): ${formatCurrency(payload.totals.sgst)}`);
  }
  lines.push(`*Total: ${formatCurrency(payload.totals.grandTotal)}*`);
  lines.push("");
  lines.push(`Payment Mode: ${payload.paymentMode}`);
  if (payload.paymentMode === "Partial/Due") {
    lines.push(`Paid: ${formatCurrency(payload.totals.paidAmount)}`);
    lines.push(`Due: ${formatCurrency(payload.totals.dueAmount)}`);
  }
  lines.push("");
  lines.push(`Thank you for shopping with ${businessName}!`);

  return lines.join("\n");
}

export function buildOrderConfirmationMessage(order: Order, settings: BusinessSettings): string {
  const businessName = settings.name || "Chetana Crafts";
  const lines: string[] = [];

  lines.push(`Hi ${order.name}, thank you for your order from *${businessName}*!`);
  lines.push("");
  lines.push(`Product: ${order.product}${order.stockCode ? ` (${order.stockCode})` : ""}`);
  lines.push(`Qty: ${order.qty}`);
  lines.push(`Total: ${formatCurrency(order.price * order.qty)}`);
  lines.push(`Payment Mode: ${order.payMode}`);
  if (order.dueAmount > 0) {
    lines.push(`Paid: ${formatCurrency(order.paidAmount)}`);
    lines.push(`Due: ${formatCurrency(order.dueAmount)}`);
  }
  lines.push(`Status: ${order.status}`);
  lines.push("");
  lines.push("We'll keep you posted. Thank you for shopping with us!");

  return lines.join("\n");
}

export function buildOrderStatusMessage(order: Order, settings: BusinessSettings): string {
  const businessName = settings.name || "Chetana Crafts";
  const lines: string[] = [];

  lines.push(
    `Hi ${order.name}, this is ${businessName} regarding your order for ${order.product} (Qty ${order.qty}).`
  );
  lines.push(`Current status: *${order.status}*`);
  if (order.dueAmount > 0) {
    lines.push(`Pending amount: ${formatCurrency(order.dueAmount)}`);
  }
  lines.push("");
  lines.push("Thank you for shopping with us!");

  return lines.join("\n");
}

export function buildPaymentReminderMessage(order: Order, settings: BusinessSettings): string {
  const businessName = settings.name || "Chetana Crafts";
  const lines: string[] = [];

  lines.push(`Hi ${order.name}, this is a gentle reminder from *${businessName}*.`);
  lines.push(
    `An amount of ${formatCurrency(order.dueAmount)} is pending for your order of ${order.product} (${formatDate(order.date)}).`
  );
  lines.push("");
  lines.push("Please complete the payment at your convenience. Thank you!");

  return lines.join("\n");
}
