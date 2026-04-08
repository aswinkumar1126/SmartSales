"use client";
import React, { useRef, useCallback, useState, useEffect } from "react";

// ─── API Data Types ───────────────────────────────────────────────────────────

export interface TransactionItem {
  PUREID?: number | null;
  ITEMID?: number | null;
  ITEMNAME?: string | null;
  PCS?: number | null;
  WT?: number | null;
  AWT?: number | null;
  TOUCH?: number | null;
  ATOUCH?: number | null;
  PUREWT?: number | null;
  APUREWT?: number | null;
  GRSWT?: number | null;
  STNWT?: number | null;
  NETWT?: number | null;
  HMC?: number | null;
  MC?: number | null;
  STNAMT?: number | null;
  AMOUNT?: number | null;
  RATE?: number | null;
  TRANTYPE?: string | null;
  BATCHNO?: string | null;
  SNO?: string | null;
  DESCRIPTION?: string | null;
  stoneDetails?: any[];
  purchaseOtherChargesDetails?: any[];
  PUREGOLDNAME?: string | null;
}

export interface PurchaseReceiptProps {
  CLOSING_DETAILS: {
    accode: number;
    bankPaid: number;
    bankPaidDetails: any[];
    bankRcvd: number;
    bankRcvdDetails: any[];
    batchNo: string;
    billno: number;
    cashPaid: number;
    cashRcvd: number;
    convAmt: number;
    convType: string;
    convWt: number;
    discAmt: number;
    discWt: number;
    entryNo: number;
    purchaseNo: string;
    rate: number;
    tranDate: string | null;
  };
  TRANSACTION_HEADER: {
    BILLNO: number;
    ACCODE: number;
    RATE: number;
    ENTRYNO: number;
    TRANDATE: string;
    BATCHNO: string;
    PURCHASENO: string;
    ACNAME?: string;
  };
  TRANSACTION_DETAILS: {
    purchase: TransactionItem[];
    purchase_return: TransactionItem[];
    issue: TransactionItem[];
    receipt: TransactionItem[];
  };
  BALANCE: {
    openingCash: number;
    openingPure: number;
    closingCash: number;
    closingPure: number;
  };
  ACHEAD_DETAILS?: {
    ACNAME: string;
    ADDRESS: string | null;
    PINCODE: string | null;
  };
  columnSize?: "40" | "50";
  accentColor?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtWt = (n: number | null | undefined) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " g";

const fmtAmt = (n: number | null | undefined) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN"); } catch { return d; }
};

// ─── Static Company Details ───────────────────────────────────────────────────

const COMPANY = {
  name: "RANGAS PAATHIRA KADAL",
  address1: "NO 12, BIG BAZAAR STREET",
  address2: "THERADI BAZAAR, (OPP.) MALAI VASAL",
  address3: "TRICHY - 620002",
  mobile: "04312711916",
  gst: "33BAAFR6426L123",
};

// ─── Styling Constants (matching EstimationPrint) ────────────────────────────

const FONT_SHOP = "Arial, 'Helvetica Neue', sans-serif";
const FONT_BODY = "Arial, 'Helvetica Neue', sans-serif";
const FONT_AMOUNT = "Arial, 'Helvetica Neue', sans-serif";

const baseStyle: React.CSSProperties = {
  fontFamily: FONT_BODY,
  fontWeight: "normal",
  color: "#000",
  background: "#fff",
  width: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
  maxWidth: "72mm",
  padding: "4px 2px",
  fontSize: "12px",
  lineHeight: "1.4",
};

const thStyle: React.CSSProperties = {
  padding: "2px 2px",
  fontSize: "10px",
  fontWeight: "bold",
  borderBottom: "1px solid #000",
  fontFamily: FONT_BODY,
};

const tdStyle: React.CSSProperties = {
  padding: "1px 2px",
  fontSize: "10px",
  fontWeight: "medium",
  fontFamily: FONT_BODY,
};

const tdAmtStyle: React.CSSProperties = {
  padding: "3px 4px",
  fontSize: "10px",
  fontWeight: "medium",
  fontFamily: FONT_AMOUNT,
  textAlign: "right",
};

const DashedLine = () => <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />;
const DoubleLine = () => <div style={{ borderTop: "3px double #000", margin: "4px 0" }} />;

// ─── Thermal HTML Builder (with full columns for purchase/purchase_return) ────

const buildThermalHTML = (p: PurchaseReceiptProps, is50: boolean): string => {
  const { TRANSACTION_HEADER: H, TRANSACTION_DETAILS: D, BALANCE: B, CLOSING_DETAILS: C, ACHEAD_DETAILS: A } = p;

  const partyName = A?.ACNAME || `AC #${H.ACCODE}`;
  const partyAddress = A?.ADDRESS ? A.ADDRESS.replace(/null/g, "") : "";

  // Define sections with a flag 'isIssue' (Issue/Receipt) vs purchase/purchase_return
  const sections = [
    { label: "PURCHASE", rows: D.purchase ?? [], type: "purchase" },
    { label: "PURCHASE RETURN", rows: D.purchase_return ?? [], type: "purchase" },
    { label: "ISSUE", rows: D.issue ?? [], type: "issue" },
    { label: "RECEIPT", rows: D.receipt ?? [], type: "issue" },
  ].filter((s) => s.rows.length > 0);

  const itemSections = sections.map(({ label, rows, type }) => {
    const isPurchaseType = type === "purchase";
    const headers = isPurchaseType
      ? `<th>Item</th><th style="text-align:right">Pcs</th><th style="text-align:right">Gr.Wt</th><th style="text-align:right">Stn Wt</th><th style="text-align:right">Touch</th><th style="text-align:right">Net Wt</th><th style="text-align:right">Pure Wt</th>`
      : `<th>Item</th><th style="text-align:right">Wt</th><th style="text-align:right">Touch</th><th style="text-align:right">PureWt</th>`;

    const rowsHtml = rows.map((item, idx) => {
      const name = item.ITEMNAME || item.PUREGOLDNAME || (item.PUREID ? `Pure #${item.PUREID}` : item.ITEMID ? `Item #${item.ITEMID}` : "—");
      if (isPurchaseType) {
        return `<tr style="background:${idx % 2 === 0 ? "#fafafa" : "#fff"}">
          <td>${name}</td>
          <td class="r">${item.PCS ?? 0}</td>
          <td class="r">${fmtWt(item.GRSWT)}</td>
          <td class="r">${fmtWt(item.STNWT)}</td>
          <td class="r">${Number(item.TOUCH || 0).toFixed(2)}%</td>
          <td class="r">${fmtWt(item.NETWT)}</td>
          <td class="r">${fmtWt(item.PUREWT)}</td>
        </tr>`;
      } else {
        return `<tr style="background:${idx % 2 === 0 ? "#fafafa" : "#fff"}">
          <td>${name}</td>
          <td class="r">${fmtWt(item.WT)}</td>
          <td class="r">${Number(item.TOUCH || 0).toFixed(2)}%</td>
          <td class="r">${fmtWt(item.PUREWT)}</td>
        </tr>`;
      }
    }).join("");

    return `<div class="dashed-line"></div>
      <div class="sec-title">${label}</div>
      <table><thead>${headers}</thead><tbody>${rowsHtml}</tbody></table>`;
  }).join("");

  return `
<div class="pr-thermal">
  <div style="text-align:center; margin-bottom:6px;">
    <img src="/logo3.png" alt="logo" style="height:60px; object-fit:contain;" />
  </div>
  <div style="text-align:center; margin-bottom:6px;">
    <div style="font-size:17px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">${COMPANY.name}</div>
    <div style="font-size:12px;">${COMPANY.address1}</div>
    ${COMPANY.address2 ? `<div style="font-size:12px;">${COMPANY.address2}</div>` : ""}
    ${COMPANY.address3 ? `<div style="font-size:12px;">${COMPANY.address3}</div>` : ""}
    <div style="font-size:12px;">Mob: ${COMPANY.mobile}</div>
    <div style="font-size:12px;">GST: ${COMPANY.gst}</div>
  </div>
  <div class="dashed-line"></div>
  <div style="text-align:center; font-size:15px; font-weight:bold; letter-spacing:2px; margin:4px 0;">PURCHASE RECEIPT</div>
  <div class="dashed-line"></div>
  <div style="display:flex; justify-content:space-between; margin:4px 0;">
    <div style="font-size:12px;">
      <div><strong>Bill No :</strong> ${H.BILLNO}</div>
      <div><strong>Batch :</strong> ${H.BATCHNO}</div>
    </div>
    <div style="font-size:12px; text-align:right;">
      <div><strong>Date :</strong> ${formatDate(H.TRANDATE)}</div>
      <div><strong>Rate/g :</strong> ₹${Number(H.RATE).toFixed(2)}</div>
    </div>
  </div>
  <div style="font-size:12px; margin:4px 0;">
    <div><strong>Party :</strong> ${partyName}</div>
    ${partyAddress ? `<div>${partyAddress}</div>` : ""}
  </div>
  <div class="dashed-line"></div>
  <div class="sec-title">Opening Balance</div>
  <div class="lr"><span>Cash</span><span class="lv">${fmtAmt(B.openingCash)}</span></div>
  <div class="lr"><span>Pure Wt</span><span class="lv">${fmtWt(B.openingPure)}</span></div>
  ${itemSections}
  <div class="double-line"></div>
  <div class="sec-title">Closing Balance</div>
  <div class="lr"><span>Cash</span><span class="lv">${fmtAmt(B.closingCash)}</span></div>
  <div class="lr"><span>Pure Wt</span><span class="lv">${fmtWt(B.closingPure)}</span></div>
  ${C.cashRcvd ? `<div class="lr"><span>Cash Rcvd</span><span class="lv">${fmtAmt(C.cashRcvd)}</span></div>` : ""}
  ${C.cashPaid ? `<div class="lr"><span>Cash Paid</span><span class="lv">${fmtAmt(C.cashPaid)}</span></div>` : ""}
  ${C.bankRcvd ? `<div class="lr"><span>Bank Rcvd</span><span class="lv">${fmtAmt(C.bankRcvd)}</span></div>` : ""}
  ${C.bankPaid ? `<div class="lr"><span>Bank Paid</span><span class="lv">${fmtAmt(C.bankPaid)}</span></div>` : ""}
  <div class="double-line"></div>
  <div class="greeting">Thank you for your business!</div>
  <div class="double-line"></div>
</div>`;
};

// ─── Print CSS ────────────────────────────────────────────────────────────────

const buildPrintCSS = (is50: boolean): string => {
  const pageW = is50 ? "100mm" : "80mm";
  const bodyW = is50 ? "96mm" : "72mm";
  const margin = is50 ? "4mm 2mm" : "2mm auto";
  return `
@page { size: ${pageW} auto; margin: ${margin}; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${pageW}; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.pr-thermal {
  font-family: 'Arial', 'Helvetica Neue', sans-serif;
  font-weight: normal;
  color: #000;
  background: #fff;
  width: ${bodyW};
  margin: 0 auto;
  padding: 4px 2px;
  font-size: 12px;
  line-height: 1.4;
}
.pr-thermal .co-name, .pr-thermal .sec-title { text-align:center; font-weight:bold; margin:6px 0 4px; }
.pr-thermal .co-name { font-size:17px; text-transform:uppercase; letter-spacing:0.5px; }
.pr-thermal .sec-title { font-size:12px; text-transform:uppercase; }
.pr-thermal .dashed-line { border-top: 1px dashed #000; margin: 4px 0; }
.pr-thermal .double-line { border-top: 3px double #000; margin: 4px 0; }
.pr-thermal .lr { display:flex; justify-content:space-between; font-size:12px; margin:2px 0; }
.pr-thermal table { width:100%; border-collapse:collapse; margin:4px 0; }
.pr-thermal table th { padding:2px 2px; font-size:11px; font-weight:bold; border-bottom:1px solid #000; text-align:left; }
.pr-thermal table td { padding:2px 2px; font-size:11px; vertical-align:top; border-bottom:1px dotted #ccc; }
.pr-thermal table td.r { text-align:right; font-family: 'Arial', 'Helvetica Neue', sans-serif; }
.pr-thermal .greeting { text-align:center; font-size:12px; font-weight:bold; margin:6px 0; }
`;
};

// ─── Screen Card Component (same column logic) ───────────────────────────────

const CardReceiptBody: React.FC<{ p: PurchaseReceiptProps; innerRef?: React.Ref<HTMLDivElement> }> = ({ p, innerRef }) => {
  const { TRANSACTION_HEADER: H, TRANSACTION_DETAILS: D, BALANCE: B, CLOSING_DETAILS: C, ACHEAD_DETAILS: A } = p;
  const partyName = A?.ACNAME || `AC #${H.ACCODE}`;
  const partyAddress = A?.ADDRESS ? A.ADDRESS.replace(/null/g, "") : "";

  const sections = [
    { label: "PURCHASE", rows: D.purchase ?? [], type: "purchase" },
    { label: "PURCHASE RETURN", rows: D.purchase_return ?? [], type: "purchase" },
    { label: "ISSUE", rows: D.issue ?? [], type: "issue" },
    { label: "RECEIPT", rows: D.receipt ?? [], type: "issue" },
  ].filter((s) => s.rows.length > 0);

  return (
    <div ref={innerRef} className="pr-thermal" style={baseStyle}>
      {/* Logo & Company */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <img src="/logo.jpg" alt="logo" style={{ height: "60px", objectFit: "contain" }} />
      </div>
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <div style={{ fontSize: "17px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {COMPANY.name}
        </div>
        <div style={{ fontSize: "12px" }}>{COMPANY.address1}</div>
        {COMPANY.address2 && <div style={{ fontSize: "12px" }}>{COMPANY.address2}</div>}
        {COMPANY.address3 && <div style={{ fontSize: "12px" }}>{COMPANY.address3}</div>}
        <div style={{ fontSize: "12px" }}>Mob: {COMPANY.mobile}</div>
        <div style={{ fontSize: "12px" }}>GST: {COMPANY.gst}</div>
      </div>
      <DashedLine />
      <div style={{ textAlign: "center", fontSize: "15px", fontWeight: "bold", letterSpacing: "2px", margin: "4px 0" }}>
        PURCHASE RECEIPT
      </div>
      <DashedLine />
      {/* Bill & Party */}
      <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
        <div style={{ fontSize: "12px" }}>
          <div><strong>Bill No :</strong>SMJ/2627/{H.BILLNO}</div>
          <div><strong>Batch :</strong> {H.BATCHNO}</div>
        </div>
        <div style={{ fontSize: "12px", textAlign: "right" }}>
          <div><strong>Date :</strong> {formatDate(H.TRANDATE)}</div>
          <div><strong>Rate/g :</strong> ₹{Number(H.RATE).toFixed(2)}</div>
        </div>
      </div>
      <div style={{ fontSize: "12px", margin: "4px 0" }}>
        <div><strong>Party :</strong> {partyName}</div>
        {partyAddress && <div>{partyAddress}</div>}
      </div>
      <DashedLine />
      {/* Opening Balance */}
      <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", margin: "6px 0 4px" }}>OPENING BALANCE</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "2px 0" }}>
        <span>Cash</span><span>{fmtAmt(B.openingCash)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "2px 0" }}>
        <span>Pure Wt</span><span>{fmtWt(B.openingPure)}</span>
      </div>

      {/* Transaction Sections */}
      {sections.map(({ label, rows, type }) => {
        const isPurchase = type === "purchase";
        return (
          <React.Fragment key={label}>
            <DashedLine />
            <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", margin: "6px 0 4px" }}>{label}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "4px 0" }}>
              <thead>
                <tr>
                  {isPurchase ? (
                    <>
                      <th style={thStyle}>Item</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Pcs</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Gr.Wt</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Stn Wt</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Touch</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Net Wt</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Pure Wt</th>
                    </>
                  ) : (
                    <>

                      <th style={thStyle}>Item</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Wt</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Touch</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>PureWt</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((item, idx) => {
                  const name = item.ITEMNAME || item.PUREGOLDNAME || (item.PUREID ? `Pure #${item.PUREID}` : item.ITEMID ? `Item #${item.ITEMID}` : "—");
                  if (isPurchase) {
                    return (
                      <tr key={idx}>
                        <td style={tdStyle}>{name}</td>
                        <td style={tdAmtStyle}>{item.PCS ?? 0}</td>
                        <td style={tdAmtStyle}>{fmtWt(item.GRSWT)}</td>
                        <td style={tdAmtStyle}>{fmtWt(item.STNWT)}</td>
                        <td style={tdAmtStyle}>{Number(item.TOUCH || 0).toFixed(2)}</td>
                        <td style={tdAmtStyle}>{fmtWt(item.NETWT)}</td>
                        <td style={tdAmtStyle}>{fmtWt(item.PUREWT)}</td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={idx}>
                        <td style={tdStyle}>{name}</td>
                        <td style={tdAmtStyle}>{fmtWt(item.WT)}</td>
                        <td style={tdAmtStyle}>{Number(item.TOUCH || 0).toFixed(2)}%</td>
                        <td style={tdAmtStyle}>{fmtWt(item.PUREWT)}</td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </React.Fragment>
        );
      })}

      <DoubleLine />
      <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", margin: "6px 0 4px" }}>CLOSING BALANCE</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "2px 0" }}>
        <span>Cash</span><span>{fmtAmt(B.closingCash)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "2px 0" }}>
        <span>Pure Wt</span><span>{fmtWt(B.closingPure)}</span>
      </div>
      {(C.cashRcvd > 0 || C.cashPaid > 0 || C.bankRcvd > 0 || C.bankPaid > 0) && (
        <>
          <DashedLine />
          <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", margin: "6px 0 4px" }}>PAYMENTS</div>
          {C.cashRcvd > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Cash Received</span><span>{fmtAmt(C.cashRcvd)}</span></div>}
          {C.cashPaid > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Cash Paid</span><span>{fmtAmt(C.cashPaid)}</span></div>}
          {C.bankRcvd > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bank Received</span><span>{fmtAmt(C.bankRcvd)}</span></div>}
          {C.bankPaid > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bank Paid</span><span>{fmtAmt(C.bankPaid)}</span></div>}
        </>
      )}
      <DoubleLine />
      <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", margin: "6px 0" }}>
        Thank you for your business!
      </div>
      <DoubleLine />
    </div>
  );
};

// ─── Main Component (unchanged logic) ────────────────────────────────────────

const PurchaseReceipt40Col: React.FC<PurchaseReceiptProps> = (props) => {
  useEffect(() => {
    console.log("RECEIPT PROPS:", props);
  }, [props]);

  const { columnSize = "40", accentColor = "#1E40AF" } = props;
  const is50 = columnSize === "50";
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(() => {
    if (isPrinting) return;
    setIsPrinting(true);

    const thermalHTML = buildThermalHTML(props, is50);
    const css = buildPrintCSS(is50);

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:120mm;height:1px;border:none;visibility:hidden;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { iframe.remove(); setIsPrinting(false); return; }

    const GOOGLE_FONTS = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap";
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><link rel="stylesheet" href="${GOOGLE_FONTS}"/><style>${css}</style></head><body>${thermalHTML}</body></html>`);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch { }
        setTimeout(() => { iframe.remove(); setIsPrinting(false); }, 300);
      }, 400);
    };
  }, [props, isPrinting, is50]);

  return (
    <div style={{ fontFamily: "'Inter','DM Sans',sans-serif" }}>
      <CardReceiptBody p={props} innerRef={printRef} />
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          style={{
            padding: "9px 24px", fontSize: 14, fontWeight: 500,
            background: isPrinting ? "#9ca3af" : accentColor,
            color: "#fff", border: "none", borderRadius: 8,
            cursor: isPrinting ? "not-allowed" : "pointer",
          }}
        >
          {isPrinting ? "Printing…" : `Print Receipt (${columnSize} col)`}
        </button>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{is50 ? "100 mm paper" : "80 mm paper"}</span>
      </div>
    </div>
  );
};

export default PurchaseReceipt40Col;