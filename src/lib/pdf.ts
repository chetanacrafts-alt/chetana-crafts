import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { BillPayload } from "@/lib/billing";
import type { BusinessSettings } from "@/lib/types";
import { formatDate } from "@/lib/format";

const MAROON: [number, number, number] = [110, 19, 19];
const GOLD: [number, number, number] = [201, 150, 47];
const CREAM: [number, number, number] = [251, 243, 228];
const INK: [number, number, number] = [42, 26, 20];
const RED: [number, number, number] = [178, 58, 58];
const MUTED: [number, number, number] = [110, 100, 92];

function rs(amount: number): string {
  return `Rs.${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

const LOGO_ASPECT = 228 / 300; // width / height of /logo-icon-pdf.png

async function loadImageAsDataURL(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function downloadBillPDF(
  payload: BillPayload,
  settings: BusinessSettings
): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" }) as DocWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  let y = 50;

  const businessName = settings.name || "Chetana Crafts";

  // Invoice-type badge (top right)
  const badgeText = payload.billType === "GST" ? "GST TAX INVOICE" : "CASH BILL";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const badgeWidth = doc.getTextWidth(badgeText) + 18;
  doc.setFillColor(...(payload.billType === "GST" ? MAROON : GOLD));
  doc.roundedRect(pageWidth - marginX - badgeWidth, 34, badgeWidth, 20, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, pageWidth - marginX - badgeWidth / 2, 48, { align: "center" });

  // Logo, if it can be loaded — PDF generation must still succeed without it.
  let textX = marginX;
  const iconH = 44;
  const iconW = iconH * LOGO_ASPECT;
  try {
    const logoDataUrl = await loadImageAsDataURL("/logo-icon-pdf.png");
    doc.addImage(logoDataUrl, "PNG", marginX, y - 26, iconW, iconH);
    textX = marginX + iconW + 10;
  } catch {
    // no logo available — fall back to text-only header
  }

  // Brand header
  doc.setTextColor(...MAROON);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(businessName, textX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  y += 18;
  if (settings.addr) {
    doc.text(settings.addr, textX, y);
    y += 13;
  }
  const contactLine = [
    settings.phone && `Ph: ${settings.phone}`,
    settings.gstin && `GSTIN: ${settings.gstin}`,
  ]
    .filter(Boolean)
    .join("   ");
  if (contactLine) {
    doc.text(contactLine, textX, y);
    y += 13;
  }

  y += 10;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 20;

  // ---- Bill To card, with Bill No. / Date meta on the right ----
  const cardPadX = 14;
  const cardTop = y;
  let cardY = cardTop + 12;
  const labelY = cardY;
  cardY += 14;
  const nameY = cardY;
  cardY += 14;
  let phoneY: number | null = null;
  if (payload.customer.phone) {
    phoneY = cardY;
    cardY += 13;
  }
  let addrY: number | null = null;
  if (payload.customer.addr) {
    addrY = cardY;
    cardY += 13;
  }
  const cardHeight = Math.max(cardY - cardTop + 10, 68);
  const cardWidth = pageWidth - marginX * 2;

  doc.setFillColor(...CREAM);
  doc.roundedRect(marginX, cardTop, cardWidth, cardHeight, 6, 6, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("BILL TO", marginX + cardPadX, labelY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(payload.customer.name || "Walk-in customer", marginX + cardPadX, nameY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  if (phoneY) doc.text(payload.customer.phone, marginX + cardPadX, phoneY);
  if (addrY) doc.text(payload.customer.addr, marginX + cardPadX, addrY);

  const metaX = pageWidth - marginX - cardPadX;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("BILL NO.", metaX, labelY, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(payload.billNo, metaX, nameY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("DATE", metaX, nameY + 16, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(formatDate(payload.date), metaX, nameY + 30, { align: "right" });

  y = cardTop + cardHeight + 18;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["Code", "Item", "Qty", "Price", "Amount"]],
    body: payload.items.map((it) => [
      it.code || "-",
      it.name,
      String(it.qty),
      rs(it.price),
      rs(it.qty * it.price),
    ]),
    headStyles: { fillColor: MAROON, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: CREAM },
    bodyStyles: { textColor: INK },
    styles: { fontSize: 9.5, cellPadding: 7 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  let finalY = (doc.lastAutoTable?.finalY ?? y) + 24;

  const totalsLabelX = pageWidth - marginX - 200;

  function totalLine(label: string, value: string, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    doc.text(label, totalsLabelX, finalY);
    doc.text(value, pageWidth - marginX, finalY, { align: "right" });
    finalY += bold ? 18 : 15;
  }

  doc.setTextColor(...INK);
  totalLine("Subtotal", rs(payload.totals.subtotal));
  if (payload.totals.discountAmount > 0) {
    totalLine("Discount", `-${rs(payload.totals.discountAmount)}`);
  }
  if (payload.billType === "GST") {
    totalLine(`CGST (${payload.gstRate / 2}%)`, rs(payload.totals.cgst));
    totalLine(`SGST (${payload.gstRate / 2}%)`, rs(payload.totals.sgst));
  }

  // Highlighted TOTAL box
  finalY += 4;
  doc.setFillColor(...MAROON);
  doc.roundedRect(totalsLabelX - 10, finalY - 14, pageWidth - marginX - (totalsLabelX - 10), 28, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL", totalsLabelX, finalY + 5);
  doc.text(rs(payload.totals.grandTotal), pageWidth - marginX - 10, finalY + 5, { align: "right" });
  finalY += 34;

  doc.setTextColor(...INK);
  totalLine("Payment Mode", payload.paymentMode);
  if (payload.paymentMode === "Partial/Due") {
    totalLine("Paid", rs(payload.totals.paidAmount));
    doc.setTextColor(...RED);
    totalLine("Due", rs(payload.totals.dueAmount), true);
    doc.setTextColor(...INK);
  }

  finalY += 22;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.75);
  doc.line(marginX, finalY, pageWidth - marginX, finalY);
  finalY += 20;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(...MAROON);
  doc.text(`Thank you for shopping with ${businessName}!`, pageWidth / 2, finalY, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(`Bill No. ${payload.billNo}`, pageWidth / 2, pageHeight - 24, { align: "center" });

  const fileSafeName = (payload.customer.name || "customer").replace(/\s+/g, "-");
  doc.save(`bill-${fileSafeName}-${payload.date}.pdf`);
}
