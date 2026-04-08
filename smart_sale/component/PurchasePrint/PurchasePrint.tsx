import React, { useRef, useCallback, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PurchaseItem {
  productName: string;
  qty: number;
  rate: number;
  total: number;
  [key: string]: unknown;
}

export interface PurchaseReceiptProps {
  companyName: string;
  companyAddress: string[];
  partyName: string;
  partyAddress: string[];
  billNo?: string;
  billDate?: string;
  operator?: string;
  cashOpeningBefore: number;
  cashClosingBefore: number;
  weightOpeningBefore: number;
  weightClosingBefore: number;
  items: PurchaseItem[];
  extraLines?: { label: string; value: number }[];
  cashOpeningAfter: number;
  cashClosingAfter: number;
  weightOpeningAfter: number;
  weightClosingAfter: number;
  greeting?: string;
  /** "40" = 80mm thermal print | "50" = 100mm thermal print. Default "40" */
  columnSize?: "40" | "50";
  /** Accent color for the card header. Default "#1E40AF" */
  accentColor?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtKg = (n: number) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " kg";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// ─── Print CSS generator ──────────────────────────────────────────────────────

const buildPrintCSS = (is50: boolean): string => {
  const pageW   = is50 ? "100mm" : "80mm";
  const bodyW   = is50 ? "96mm"  : "76mm";
  const margin  = is50 ? "4mm 2mm" : "3mm 2mm";
  const base    = is50 ? "13pt" : "11pt";
  const small   = is50 ? "12pt" : "10pt";
  const title   = is50 ? "17pt" : "14pt";
  const cellPad = is50 ? "4px 5px" : "3px 4px";

  return `
@page { size: ${pageW} auto; margin: ${margin}; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body {
  width: ${pageW};
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  font-family: 'DM Sans','Segoe UI',sans-serif;
}
.pr-thermal {
  width: ${bodyW};
  margin: 0 auto;
  font-size: ${base};
  line-height: 1.5;
  color: #111;
  padding: 6px 0 10px;
}
.pr-thermal .co-name {
  text-align:center; font-size:${title}; font-weight:900;
  text-transform:uppercase; letter-spacing:1px;
  font-family:'Playfair Display',Georgia,serif;
  line-height:1.2; margin-bottom:4px;
}
.pr-thermal .co-addr { text-align:center; font-size:${small}; color:#333; line-height:1.4; }
.pr-thermal .bold-div { border-top:2.5px solid #111; margin:6px 0; }
.pr-thermal .thin-div { border-top:1px solid #111;   margin:5px 0; }
.pr-thermal .dash-div { border-top:1px dashed #555;  margin:5px 0; }
.pr-thermal .sec-title {
  text-align:center; font-size:${small}; font-weight:700;
  letter-spacing:2.5px; text-transform:uppercase;
  font-family:'Barlow Condensed','Arial Narrow',sans-serif;
  margin:5px 0 4px; color:#222;
}
.pr-thermal .lr {
  display:flex; justify-content:space-between; align-items:baseline;
  font-size:${base}; margin:3px 0;
}
.pr-thermal .lr .lv { font-family:'Courier New',monospace; letter-spacing:0.3px; }
.pr-thermal .party-block { font-size:${base}; margin:6px 0 4px; }
.pr-thermal .party-name  { font-weight:600; }
.pr-thermal .party-addr  { padding-left:46px; color:#444; }
.pr-thermal table { width:100%; border-collapse:collapse; margin-top:2px; }
.pr-thermal table th {
  padding:${cellPad}; font-size:${small}; font-weight:600;
  border-bottom:2px solid #111; border-top:1px solid #111;
  text-align:left; background:#f5f5f5;
}
.pr-thermal table td {
  padding:${cellPad}; font-size:${small};
  vertical-align:top; word-break:break-word; border-bottom:1px dotted #ccc;
}
.pr-thermal table td.r { text-align:right; font-family:'Courier New',monospace; letter-spacing:0.3px; }
.pr-thermal .total-bar {
  display:flex; justify-content:space-between; align-items:center;
  font-size:${base}; border-top:2px solid #111; padding-top:4px; margin:4px 0 2px;
}
.pr-thermal .total-bar .tv { font-family:'Courier New',monospace; font-weight:600; }
.pr-thermal .net-row {
  display:flex; justify-content:space-between;
  font-size:${is50 ? "15pt" : "13pt"}; font-weight:600; margin:3px 0;
}
.pr-thermal .net-row .lv { font-family:'Courier New',monospace; }
.pr-thermal .greeting {
  text-align:center; font-size:${base};
  font-family:'Playfair Display',Georgia,serif;
  font-weight:700; font-style:italic; letter-spacing:0.5px;
  margin:5px 0 2px; color:#222;
}
`;
};

// ─── Thermal HTML builder ─────────────────────────────────────────────────────

const buildThermalHTML = (p: PurchaseReceiptProps, is50: boolean): string => {
  const grandTotal = p.items.reduce((s, i) => s + i.total, 0);
  const grandQty   = p.items.reduce((s, i) => s + i.qty, 0);
  const extraNet   = (p.extraLines ?? []).reduce((s, e) => s + e.value, 0);
  const netTotal   = grandTotal + extraNet;

  const addrLines = p.companyAddress
    .map((l) => `<div class="co-addr">${l}</div>`)
    .join("");

  const partyAddrLines = p.partyAddress
    .map((l) => `<div class="party-addr">${l}</div>`)
    .join("");

  const itemRows = p.items
    .map(
      (item, idx) =>
        `<tr style="background:${idx % 2 === 0 ? "#fafafa" : "#fff"}">
          <td>${item.productName}</td>
          <td class="r">${item.qty}</td>
          <td class="r">${fmt(item.rate)}</td>
          <td class="r">${fmt(item.total)}</td>
        </tr>`
    )
    .join("");

  const extraRows =
    p.extraLines && p.extraLines.length > 0
      ? `<div class="dash-div"></div>
         <div class="sec-title">Extras</div>
         ${p.extraLines
           .map(
             (ex) =>
               `<div class="lr"><span>${ex.label}</span><span class="lv">${fmt(ex.value)}</span></div>`
           )
           .join("")}
         <div class="thin-div"></div>
         <div class="net-row"><span>Net Total</span><span class="lv">${fmt(netTotal)}</span></div>`
      : "";

  const billMeta =
    p.billNo || p.operator
      ? `${p.billNo ? `<div class="lr"><span>Bill No : ${p.billNo}</span><span class="lv">${p.billDate ?? ""}</span></div>` : ""}
         ${p.operator ? `<div class="lr"><span>Operator : ${p.operator}</span><span></span></div>` : ""}
         <div class="thin-div"></div>`
      : "";

  return `
<div class="pr-thermal">
  <div class="co-name">${p.companyName}</div>
  ${addrLines}
  <div class="bold-div"></div>
  <div class="party-block">
    <div style="display:flex;gap:4px;">
      <span style="font-weight:600;min-width:38px;">Party :</span>
      <span class="party-name">${p.partyName}</span>
    </div>
    ${partyAddrLines}
  </div>
  <div class="thin-div"></div>
  ${billMeta}
  <div class="sec-title">Before Purchase</div>
  <div class="lr"><span>Cash Opening</span><span class="lv">${fmt(p.cashOpeningBefore)}</span></div>
  <div class="lr"><span>Cash Closing</span><span class="lv">${fmt(p.cashClosingBefore)}</span></div>
  <div class="lr"><span>Wt. Opening</span><span class="lv">${fmtKg(p.weightOpeningBefore)}</span></div>
  <div class="lr"><span>Wt. Closing</span><span class="lv">${fmtKg(p.weightClosingBefore)}</span></div>
  <div class="dash-div"></div>
  <div class="sec-title">Purchase</div>
  <table>
    <thead>
      <tr>
        <th style="width:40%">Product</th>
        <th style="text-align:right;width:13%">Qty</th>
        <th style="text-align:right;width:23%">Rate</th>
        <th style="text-align:right;width:24%">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="total-bar">
    <span><strong>Total Qty :</strong> ${grandQty}</span>
    <span><strong>Total :</strong> <span class="tv">${fmt(grandTotal)}</span></span>
  </div>
  ${extraRows}
  <div class="bold-div"></div>
  <div class="sec-title">After Purchase</div>
  <div class="lr"><span>Cash Opening</span><span class="lv">${fmt(p.cashOpeningAfter)}</span></div>
  <div class="lr"><span>Cash Closing</span><span class="lv">${fmt(p.cashClosingAfter)}</span></div>
  <div class="lr"><span>Wt. Opening</span><span class="lv">${fmtKg(p.weightOpeningAfter)}</span></div>
  <div class="lr"><span>Wt. Closing</span><span class="lv">${fmtKg(p.weightClosingAfter)}</span></div>
  <div class="bold-div"></div>
  <div class="greeting">${p.greeting ?? "Thank you for your business!"}</div>
  <div class="bold-div"></div>
</div>`;
};

// ─── Card sub-components (screen preview) ────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const, color: "#6b7280", marginBottom: 8 }}>
    {children}
  </div>
);

const StatGrid: React.FC<{
  items: { label: string; value: string }[];
  accent?: boolean;
  accentColor?: string;
}> = ({ items, accent, accentColor = "#1E40AF" }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
    {items.map((s) => (
      <div key={s.label} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{s.label}</div>
        <div style={{ fontSize: 15, fontWeight: 500, fontFamily: "monospace", color: accent ? accentColor : "#111827" }}>
          {s.value}
        </div>
      </div>
    ))}
  </div>
);

// ─── Card Receipt Body (screen) ───────────────────────────────────────────────

const CardReceiptBody: React.FC<{
  p: PurchaseReceiptProps;
  innerRef?: React.Ref<HTMLDivElement>;
}> = ({ p, innerRef }) => {
  const accent      = p.accentColor ?? "#1E40AF";
  const accentLight = "#EFF6FF";
  const border      = "0.5px solid #e5e7eb";

  const grandTotal = p.items.reduce((s, i) => s + i.total, 0);
  const grandQty   = p.items.reduce((s, i) => s + i.qty, 0);
  const extraNet   = (p.extraLines ?? []).reduce((s, e) => s + e.value, 0);
  const netTotal   = grandTotal + extraNet;

  return (
    <div
      ref={innerRef}
      className="purchase-receipt-card"
      style={{ fontFamily: "'Inter','DM Sans','Segoe UI',system-ui,sans-serif", background: "#fff", border, borderRadius: 12, overflow: "hidden", maxWidth: 560, width: "100%", color: "#111827", fontSize: 14, lineHeight: 1.5 }}
    >
      {/* Header */}
      <div style={{ background: accent, padding: "20px 24px", color: "#fff" }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{p.companyName}</div>
        {p.companyAddress.map((l, i) => <div key={i} style={{ fontSize: 13, opacity: 0.78 }}>{l}</div>)}
      </div>

      {/* Meta bar */}
      <div style={{ display: "flex", borderBottom: border }}>
        {[{ label: "Bill No", value: p.billNo ?? "—" }, { label: "Date", value: p.billDate ?? "—" }, { label: "Operator", value: p.operator ?? "—" }].map((m, i, arr) => (
          <div key={m.label} style={{ flex: 1, padding: "10px 14px", borderRight: i < arr.length - 1 ? border : "none" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "#9ca3af", marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Party */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", borderBottom: border }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: accent, flexShrink: 0 }}>
          {initials(p.partyName)}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{p.partyName}</div>
          {p.partyAddress.map((l, i) => <div key={i} style={{ fontSize: 12, color: "#6b7280" }}>{l}</div>)}
        </div>
      </div>

      {/* Before */}
      <div style={{ padding: "14px 24px", borderBottom: border }}>
        <SectionLabel>Before purchase</SectionLabel>
        <StatGrid items={[
          { label: "Cash opening", value: fmt(p.cashOpeningBefore) },
          { label: "Cash closing", value: fmt(p.cashClosingBefore) },
          { label: "Wt. opening",  value: fmtKg(p.weightOpeningBefore) },
          { label: "Wt. closing",  value: fmtKg(p.weightClosingBefore) },
        ]} />
      </div>

      {/* Items */}
      <div style={{ padding: "14px 24px", borderBottom: border }}>
        <SectionLabel>Purchase items</SectionLabel>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>
              {(["Product", "Qty", "Rate", "Total"] as const).map((h, i) => (
                <th key={h} style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.8px", color: "#9ca3af", padding: "0 0 8px", textAlign: i === 0 ? "left" : "right", borderBottom: border, width: i === 0 ? "40%" : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px 0", fontSize: 13, borderBottom: "0.5px solid #f3f4f6", wordBreak: "break-word" }}>{item.productName}</td>
                <td style={{ padding: "8px 0", fontSize: 13, textAlign: "right", fontFamily: "monospace", borderBottom: "0.5px solid #f3f4f6", color: "#374151" }}>{item.qty}</td>
                <td style={{ padding: "8px 0", fontSize: 13, textAlign: "right", fontFamily: "monospace", borderBottom: "0.5px solid #f3f4f6", color: "#374151" }}>{fmt(item.rate)}</td>
                <td style={{ padding: "8px 0", fontSize: 13, textAlign: "right", fontFamily: "monospace", borderBottom: "0.5px solid #f3f4f6", color: "#374151" }}>{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>Subtotal · {grandQty} items</span>
          <span style={{ fontSize: 14, fontWeight: 500, fontFamily: "monospace" }}>{fmt(grandTotal)}</span>
        </div>
      </div>

      {/* Extras */}
      {p.extraLines && p.extraLines.length > 0 && (
        <div style={{ padding: "12px 24px", borderBottom: border }}>
          <SectionLabel>Extras</SectionLabel>
          {p.extraLines.map((ex) => (
            <div key={ex.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", padding: "4px 0" }}>
              <span>{ex.label}</span>
              <span style={{ fontFamily: "monospace" }}>{fmt(ex.value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Net total */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", background: "#f9fafb", borderBottom: border }}>
        <div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Net total</div>
          <span style={{ fontSize: 11, background: accentLight, color: accent, padding: "3px 8px", borderRadius: 999, fontWeight: 500, marginTop: 4, display: "inline-block" }}>
            {grandQty} items
          </span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "monospace", color: accent }}>{fmt(netTotal)}</div>
      </div>

      {/* After */}
      <div style={{ padding: "14px 24px", borderBottom: border }}>
        <SectionLabel>After purchase</SectionLabel>
        <StatGrid accent accentColor={accent} items={[
          { label: "Cash opening", value: fmt(p.cashOpeningAfter) },
          { label: "Cash closing", value: fmt(p.cashClosingAfter) },
          { label: "Wt. opening",  value: fmtKg(p.weightOpeningAfter) },
          { label: "Wt. closing",  value: fmtKg(p.weightClosingAfter) },
        ]} />
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>{p.greeting ?? "Thank you for your business!"}</div>
        <div style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 999, fontWeight: 500 }}>Paid</div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PurchaseReceipt: React.FC<PurchaseReceiptProps> = (props) => {
  const { columnSize = "40", accentColor = "#1E40AF" } = props;
  const is50 = columnSize === "50";

  const printRef   = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(() => {
    if (isPrinting) return;
    setIsPrinting(true);

    const thermalHTML = buildThermalHTML(props, is50);
    const css         = buildPrintCSS(is50);

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:120mm;height:1px;border:none;visibility:hidden;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { iframe.remove(); setIsPrinting(false); return; }

    const GOOGLE_FONTS =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap";

    doc.open();
    doc.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/>` +
      `<link rel="stylesheet" href="${GOOGLE_FONTS}"/>` +
      `<style>${css}</style></head><body>${thermalHTML}</body></html>`
    );
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch {}
        setTimeout(() => { iframe.remove(); setIsPrinting(false); }, 300);
      }, 400);
    };
  }, [props, isPrinting, is50]);

  return (
    <div style={{ fontFamily: "'Inter','DM Sans',sans-serif" }}>
      {/* Screen — always card style */}
      <CardReceiptBody p={props} innerRef={printRef} />

      {/* Print button */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          style={{
            padding: "9px 24px",
            fontSize: 14,
            fontWeight: 500,
            background: isPrinting ? "#9ca3af" : accentColor,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: isPrinting ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {isPrinting ? "Printing…" : `Print Receipt (${columnSize} col)`}
        </button>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>
          {is50 ? "100 mm paper" : "80 mm paper"}
        </span>
      </div>
    </div>
  );
};

export default PurchaseReceipt;