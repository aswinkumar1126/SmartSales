"use client";
import React, { useRef, useCallback, useState, useEffect } from "react";
import { Company } from "@/service/CompanyService";
import { PurchaseCLosing } from "@/types/transcation/Transaction";
import { Caprasimo } from "@/context/theme/font";

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
  CLOSING_DETAILS: PurchaseCLosing;
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
  COMPANY_DETAILS: Company;
  autoPrint?: boolean; // New prop for auto-printing
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtWt = (n: number | null | undefined) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + "g";

const fmtAmt = (n: number | null | undefined) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN"); } catch { return d; }
};

// Get conversion type label
const getConvTypeLabel = (type: string | null | undefined): string => {
  if (!type) return "";
  return type.toUpperCase() === "P" ? "PURE" : type.toUpperCase() === "C" ? "CASH" : "";
};

// ─── Styling Constants ────────────────────────────────────────────────────────

const FONT_SHOP = "Arial, 'Helvetica Neue', sans-serif";
const FONT_BODY = "Arial, 'Helvetica Neue', sans-serif";
const FONT_AMOUNT = "Arial, 'Helvetica Neue', sans-serif";

const baseStyle: React.CSSProperties = {
  fontFamily: FONT_BODY,
  fontWeight: "normal",
  color: "#000",
  background: "#fff",
  width: "100%",
  margin: "0",
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

// Check if transactions exist
const hasTransactions = (details: PurchaseReceiptProps['TRANSACTION_DETAILS']): boolean => {
  return (
    (details.purchase?.length || 0) > 0 ||
    (details.purchase_return?.length || 0) > 0 ||
    (details.issue?.length || 0) > 0 ||
    (details.receipt?.length || 0) > 0
  );
};

// Check if closing details exist
const hasClosingDetails = (closing: PurchaseReceiptProps['CLOSING_DETAILS']): boolean => {
  return (
    (closing.CONVTYPE && closing.CONVTYPE.trim() !== "") ||
    closing.CONVWT > 0 ||
    closing.CONVAMT > 0 ||
    closing.CASHRCVD > 0 ||
    closing.CASHPAID > 0 ||
    closing.BANKRCVD > 0 ||
    closing.BANKPAID > 0
  );
};

// ─── Thermal HTML Builder ─────────────────────────────────────────────────────

const buildThermalHTML = (p: PurchaseReceiptProps, is50: boolean): string => {
  const { TRANSACTION_HEADER: H, TRANSACTION_DETAILS: D, BALANCE: B, CLOSING_DETAILS: C, ACHEAD_DETAILS: A, COMPANY_DETAILS: CD } = p;

  const partyName = A?.ACNAME || `AC #${H.ACCODE}`;
  const partyAddress = A?.ADDRESS ? A.ADDRESS.replace(/null/g, "") : "";
  const showTransactions = hasTransactions(D);
  const showClosingSection = hasClosingDetails(C);



  const convTypeLabel = getConvTypeLabel(C.CONVTYPE);

  const totalCol = ['pcs', 'grswt', 'stnwt', 'purewt'];

  const sections = [
    { label: "PURCHASE", rows: D.purchase ?? [], type: "purchase" },
    { label: "PURCHASE RETURN", rows: D.purchase_return ?? [], type: "purchase" },
    { label: "ISSUE", rows: D.issue ?? [], type: "issue" },
    { label: "RECEIPT", rows: D.receipt ?? [], type: "issue" },
  ].filter((s) => s.rows.length > 0);

  const itemSections = sections.map(({ label, rows, type }) => {
    const isPurchaseType = type === "purchase";

    let totals = null;
    if (isPurchaseType && totalCol.length > 0) {
      totals = {
        pcs: rows.reduce((sum, item) => sum + (Number(item.PCS) || 0), 0),
        grswt: rows.reduce((sum, item) => sum + (Number(item.GRSWT) || 0), 0),
        stnwt: rows.reduce((sum, item) => sum + (Number(item.STNWT) || 0), 0),
        netwt: rows.reduce((sum, item) => sum + (Number(item.NETWT) || 0), 0),
        purewt: rows.reduce((sum, item) => sum + (Number(item.PUREWT) || 0), 0),
      };
    }

    const headers = isPurchaseType
      ? `
      <tr>
        <th style="border:1px solid #000; padding:2px; ">ITEM</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">PCS</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">GRS WT</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">STN WT</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">NET WT</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">TOUCH</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">PURE</th>
      </tr>`
      : `
      <tr>
        <th style="border:1px solid #000; padding:2px;">ITEM</th>
        <th style="border:1px solid #000; padding:2px; text-align:end">WT</th>
        <th style="border:1px solid #000; padding:2px; text-align:end">TOUCH</th>
        <th style="border:1px solid #000; padding:2px; text-align:end">PURE</th>
      </tr>`;

    const rowsHtml = rows
      .map((item, idx) => {
        const name =
          item.ITEMNAME ||
          item.PUREGOLDNAME ||
          (item.PUREID ? `Pure #${item.PUREID}` : item.ITEMID ? `Item #${item.ITEMID}` : "—");

        const bg = idx % 2 === 0 ? "#FFF" : "#FFF";

        if (isPurchaseType) {
          return `
        <tr style="background:${bg}">
          <td style="border:1px solid #000; padding:2px;">${name}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${item.PCS ?? 0}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.GRSWT)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.STNWT)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.NETWT)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${Number(item.TOUCH || 0).toFixed(2)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.PUREWT)}</td>
        </tr>`;
        }

        return `
        <tr style="background:${bg}">
          <td style="border:1px solid #000; padding:2px;">${name}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.WT)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${Number(item.TOUCH || 0).toFixed(2)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.PUREWT)}</td>
        </tr>`;
      })
      .join("");

    const totalsRow = totals ? `
      <tr font-weight:semi-bold;">
        <td style="border:1px solid #000; padding:2px; text-align:right;"><strong>TOTAL</strong></td>
        <td style="border:1px solid #000; padding:2px; text-align:right;">${totals.pcs}</td>
        <td style="border:1px solid #000; padding:2px; text-align:right;">${fmtWt(totals.grswt)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:right;">${fmtWt(totals.stnwt)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:right;">${fmtWt(totals.netwt)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:right;"> </td>
        <td style="border:1px solid #000; padding:2px; text-align:right;">${fmtWt(totals.purewt)}</td>
      </tr>
    ` : '';

    return `
    <div class="sec-title">${label}</div>
    <table style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #000;" class="with-border">
      <thead style=${thStyle}>
        ${headers}
      </thead>
      <tbody style=${tdStyle}>
        ${rowsHtml}
        ${totalsRow}
      </tbody>
    </table>
  `;
  }).join("");

  // Build closing details section
  const closingDetailsHtml = showClosingSection ? `
    <div class="sec-title">CLOSING DETAILS</div>
    <table style="width:100%; font-size:12px; margin:4px 0;" class="no-border">
      ${C.CONVTYPE && convTypeLabel ? `
      <tr>
        <td>CONVERSION TYPE :</td>
        <td style="text-align:right;">${convTypeLabel}</td>
      </tr>
      ` : ''}
      ${C.CONVWT > 0 ? `
      <tr>
        <td>CONVERSION WEIGHT :</td>
        <td style="text-align:right;">${fmtWt(C.CONVWT)}</td>
      </tr>
      ` : ''}
      ${C.CONVAMT > 0 ? `
      <tr>
        <td>CONVERSION AMOUNT :</td>
        <td style="text-align:right;">${fmtAmt(C.CONVAMT)}</td>
      </tr>
      ` : ''}
    </table>
  ` : '';

  // Build payments section
  const paymentsHtml = (C.CASHRCVD > 0 || C.CASHPAID > 0 || C.BANKRCVD > 0 || C.BANKPAID > 0) ? `
  <div class="sec-title">PAYMENTS</div>
  <table style="width:100%; font-size:12px; margin:4px 0; border-collapse: collapse;" class="with-border">
    <thead>
      <tr>
        <th></th>
        <th style="border:1px solid #000; padding:2px; text-align:right">RECEIVED</th>
        <th style="border:1px solid #000; padding:2px; text-align:right">PAID</th>
      </tr>
    </thead>
    <tbody >
      <tr>
        <td style="border:1px solid #000; padding:2px;">CASH</td>
        <td style="border:1px solid #000; padding:2px; text-align:right">${C.CASHRCVD > 0 ? fmtAmt(C.CASHRCVD) : '0'}</td>
        <td style="border:1px solid #000; padding:2px; text-align:right">${C.CASHPAID > 0 ? fmtAmt(C.CASHPAID) : '0'}</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:2px;">BANK</td>
        <td style="border:1px solid #000; padding:2px; text-align:right">${C.BANKRCVD > 0 ? fmtAmt(C.BANKRCVD) : '0'}</td>
        <td style="border:1px solid #000; padding:2px; text-align:right">${C.BANKPAID > 0 ? fmtAmt(C.BANKPAID) : '0'}</td>
      </tr>
      <tr style="font-weight:bold;">
        <td style="border:1px solid #000; padding:2px;">TOTAL</td>
        <td style="border:1px solid #000; padding:2px; text-align:right">${fmtAmt((C.CASHRCVD || 0) + (C.BANKRCVD || 0))}</td>
        <td style="border:1px solid #000; padding:2px; text-align:right">${fmtAmt((C.CASHPAID || 0) + (C.BANKPAID || 0))}</td>
      </tr>
    </tbody>
  </table>
` : '';

  // Opening balance always shows
  const openingBalanceHtml = `
    <div class="sec-title">OPENING BALANCE</div>
    <table style="width:100%; font-size:12px; margin:4px 0;" class="no-border">
      <tr>
        <td>CASH :</td>
        <td style="text-align:right;">${fmtAmt(B.openingCash)}</td>
      </tr>
      <tr>
        <td>PURE :</td>
        <td style="text-align:right;">${fmtWt(B.openingPure)}</td>
      </tr>
    </table>
  `;

  // Transactions section only shows if there are transactions
  const transactionsHtml = showTransactions ? `
    <div class="tran-table">
      ${itemSections}
    </div>
  ` : '';

  // Closing balance always shows
  const closingBalanceHtml = `
    <div class="sec-title">CLOSING BALANCE</div>
    <table style="width:100%; font-size:12px; margin:4px 0;" class="no-border">
      <tr>
        <td>CASH :</td>
        <td style="text-align:right;">${fmtAmt(B.closingCash)}</td>
      </tr>
      <tr>
        <td>PURE :</td>
        <td style="text-align:right;">${fmtWt(B.closingPure)}</td>
      </tr>
    </table>
  `;

  return `
<div class="pr-thermal">
  <div style="text-align:center; margin-bottom:6px;">
    <img src="/printImg.jpeg" alt="logo" style="height:100px; object-fit:contain;" />
  </div>
  <div style="text-align:center; margin-bottom:6px;">
    <div style="font-size:15px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">${CD.COMPANYNAME}</div>
    <div style="font-size:12px;">${CD.ADDRESS1}</div>
    ${CD.ADDRESS2 ? `<div style="font-size:12px;">${CD.ADDRESS2}</div>` : ""}
    ${CD.ADDRESS3 ? `<div style="font-size:12px;">${CD.ADDRESS3}</div>` : ""}
    <div style="font-size:12px;">MOBILE: ${CD.PHONE}</div>
    <div style="font-size:12px;">GST NO: ${CD.GSTNO}</div>
  </div>
  <div class="dashed-line"></div>
  <div style="text-align:center; font-size:14px; font-weight:bold; letter-spacing:2px; margin:4px 0;">PURCHASE RECEIPT</div>
  <div class="dashed-line"></div>

  <table style="width:100%; font-size:12px; margin:4px 0;" class="no-border">
    <tr>
      <td style="width:55%; vertical-align:top;">
        <table style="width:100%; font-size:12px;" class="no-border">
          <tr>
            <td style="font-weight:bold; width:40%;">PARTY :</td>
            <td>${partyName}</td>
          </tr>
          ${partyAddress ? `
          <tr>
            <td style="font-weight:bold; width:40%;">ADDRESS :</td>
            <td>${partyAddress}</td>
          </tr>` : ""}
        </table>
      </td>
      <td style="width:45%; vertical-align:top; text-align:right;">
        <table style="width:100%; font-size:12px; text-align:right;" class="no-border"">
          <tr>
            <td style="font-weight:bold; width:42%;">BILL NO :</td>
            <td>${H.BILLNO}</td>
          </tr>
          <tr>
            <td style="font-weight:bold; width:42%;">DATE :</td>
            <td>${formatDate(H.TRANDATE)}</td>
          </tr>
          <tr>
            <td style="font-weight:bold; width:42%;">BATCH :</td>
            <td>${H.BATCHNO}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <div class="dashed-line"></div>

  ${openingBalanceHtml}
  
  ${transactionsHtml}
  

  
  ${showClosingSection ? '<div class="dashed-line"></div>' : ''}
  ${closingDetailsHtml}
  
  ${(C.CASHRCVD > 0 || C.CASHPAID > 0 || C.BANKRCVD > 0 || C.BANKPAID > 0) ? '<div class="dashed-line"></div>' : ''}
  ${paymentsHtml}

    ${closingBalanceHtml}
  
  <div class="double-line"></div>
  <div class="greeting">THANK YOU FOR YOUR BUSINESS!</div>
  <div class="double-line"></div>
</div>`;
};

// ─── Print CSS ────────────────────────────────────────────────────────────────

const buildPrintCSS = (is50: boolean): string => {
  const pageW = is50 ? "100mm" : "90mm";
  const bodyW = is50 ? "96mm" : "80mm";
  const margin = is50 ? "2mm 1mm" : "1mm";
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
.pr-thermal .co-name { font-size:16px; text-transform:uppercase; letter-spacing:0.5px; }
.pr-thermal .sec-title { font-size:12px; text-transform:uppercase; }
.pr-thermal .dashed-line { border-top: 1px dashed #000; margin: 4px 0; }
.pr-thermal .double-line { border-top: 3px double #000; margin: 4px 0; }
.pr-thermal .lr { display:flex; justify-content:space-between; font-size:12px; margin:2px 0; }
.pr-thermal table { width:100%; margin:4px 0;}
.pr-thermal table.no-border { width:100%; border-collapse:collapse; margin:4px 0;}
.pr-thermal table.with-border { width:100%; border-collapse:collapse; margin:4px 0; border:1px solid #222;}
.pr-thermal table th { padding:2px; font-size:10px; font-weight:bold; color:'#000';  }
.pr-thermal table td { padding:2px; font-size:10px; vertical-align:top; color:'#000'; }
.pr-thermal table td.r { text-align:right; font-family: 'Arial', 'Helvetica Neue', sans-serif; color:'#000';  }
.pr-thermal .tran-table { margin: 10px 0px 10px 0px;}
.pr-thermal .closing-table{ margin: 10px 0px ;}
.pr-thermal .greeting { text-align:center; font-size:12px; font-weight:bold; margin:6px 0;color:'#000';  }
`;
};

// ─── Screen Card Component ────────────────────────────────────────────────────

const CardReceiptBody: React.FC<{ p: PurchaseReceiptProps; innerRef?: React.Ref<HTMLDivElement> }> = ({ p, innerRef }) => {
  const { TRANSACTION_HEADER: H, TRANSACTION_DETAILS: D, BALANCE: B, CLOSING_DETAILS: C, ACHEAD_DETAILS: A, COMPANY_DETAILS: COMPANY } = p;
  const partyName = A?.ACNAME || `AC #${H.ACCODE}`;
  const partyAddress = A?.ADDRESS ? A.ADDRESS.replace(/null/g, "") : "";
  const showTransactions = hasTransactions(D);
  const showClosingSection = hasClosingDetails(C);
  console.log(showClosingSection,C, 'showClosingSection')
  const convTypeLabel = getConvTypeLabel(C.CONVTYPE);

  const totalCol = ['pcs', 'grswt', 'stnwt', 'netwt', 'purewt'];

  const sections = [
    { label: "PURCHASE", rows: D.purchase ?? [], type: "purchase" },
    { label: "PURCHASE RETURN", rows: D.purchase_return ?? [], type: "purchase" },
    { label: "ISSUE", rows: D.issue ?? [], type: "issue" },
    { label: "RECEIPT", rows: D.receipt ?? [], type: "issue" },
  ].filter((s) => s.rows.length > 0);

  const thStyleWithBorder = {
    border: "1px solid #000",
    padding: "4px",
    fontSize: "10px",
    fontWeight: "bold",
    textAlign: "left" as const,
  };

  const tdStyleWithBorder = {
    border: "1px solid #000",
    padding: "4px",
    fontSize: "10px",
    verticalAlign: "top" as const,
  };

  const tdAmtStyleWithBorder = {
    ...tdStyleWithBorder,
    textAlign: "right" as const,
  };

  const tdStyleTotal = {
    ...tdStyleWithBorder,
    textAlign: "right" as const,
    fontWeight: 'bold'
  };

  return (
    <div ref={innerRef} className="pr-thermal" style={baseStyle}>
      {/* Logo & Company */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <img src="/printImg.jpeg" alt="logo" style={{ height: "100px", objectFit: "contain", width: '100%' }} />
      </div>
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <div style={{ fontSize: "17px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {COMPANY.COMPANYNAME}
        </div>
        <div style={{ fontSize: "12px" }}>{COMPANY.ADDRESS1}</div>
        {COMPANY.ADDRESS2 && <div style={{ fontSize: "12px" }}>{COMPANY.ADDRESS2}</div>}
        {COMPANY.ADDRESS3 && <div style={{ fontSize: "12px" }}>{COMPANY.ADDRESS3}</div>}
        <div style={{ fontSize: "12px" }}>Mobile: {COMPANY.PHONE}</div>
        <div style={{ fontSize: "12px" }}>GST: {COMPANY.GSTNO}</div>
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

      {/* Transaction Sections - Only show if transactions exist */}
      {showTransactions && sections.map(({ label, rows, type }) => {
        const isPurchase = type === "purchase";

        let totals = null;
        if (isPurchase && totalCol.length > 0) {
          totals = {
            pcs: rows.reduce((sum, item) => sum + (Number(item.PCS) || 0), 0),
            grswt: rows.reduce((sum, item) => sum + (Number(item.GRSWT) || 0), 0),
            stnwt: rows.reduce((sum, item) => sum + (Number(item.STNWT) || 0), 0),
            netwt: rows.reduce((sum, item) => sum + (Number(item.NETWT) || 0), 0),
            purewt: rows.reduce((sum, item) => sum + (Number(item.PUREWT) || 0), 0),
          };
        }

        return (
          <React.Fragment key={label}>
            <DashedLine />
            <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", margin: "6px 0 4px", letterSpacing: "1px" }}>
              {label}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "4px 0", fontSize: "10px", border: "1px solid #000" }}>
              <thead>
                <tr>
                  {isPurchase ? (
                    <>
                      <th style={thStyleWithBorder}>ITEM</th>
                      <th style={{ ...thStyleWithBorder, textAlign: "right" }}>PCS</th>
                      <th style={{ ...thStyleWithBorder, textAlign: "right" }}>GRS WT</th>
                      <th style={{ ...thStyleWithBorder, textAlign: "right" }}>STN WT</th>
                      <th style={{ ...thStyleWithBorder, textAlign: "right" }}>NET WT</th>
                      <th style={{ ...thStyleWithBorder, textAlign: "right" }}>TOUCH</th>
                      <th style={{ ...thStyleWithBorder, textAlign: "right" }}>PURE WT</th>
                    </>
                  ) : (
                    <>
                      <th style={thStyleWithBorder}>ITEM</th>
                      <th style={{ ...thStyleWithBorder, textAlign: "right" }}>WT</th>
                      <th style={{ ...thStyleWithBorder, textAlign: "right" }}>TOUCH</th>
                      <th style={{ ...thStyleWithBorder, textAlign: "right" }}>PURE WT</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((item, idx) => {
                  const name = item.ITEMNAME || item.PUREGOLDNAME || (item.PUREID ? `Pure #${item.PUREID}` : item.ITEMID ? `Item #${item.ITEMID}` : "—");
                  const rowStyle = { background: idx % 2 === 0 ? "#fafafa" : "#fff" };

                  if (isPurchase) {
                    return (
                      <tr key={idx} style={rowStyle}>
                        <td style={tdStyleWithBorder}>{name}</td>
                        <td style={tdAmtStyleWithBorder}>{item.PCS ?? 0}</td>
                        <td style={tdAmtStyleWithBorder}>{fmtWt(item.GRSWT)}</td>
                        <td style={tdAmtStyleWithBorder}>{fmtWt(item.STNWT)}</td>
                        <td style={tdAmtStyleWithBorder}>{fmtWt(item.NETWT)}</td>
                        <td style={tdAmtStyleWithBorder}>{Number(item.TOUCH || 0).toFixed(2)}</td>
                        <td style={tdAmtStyleWithBorder}>{fmtWt(item.PUREWT)}</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={idx} style={rowStyle}>
                      <td style={tdStyleWithBorder}>{name}</td>
                      <td style={tdAmtStyleWithBorder}>{fmtWt(item.WT)}</td>
                      <td style={tdAmtStyleWithBorder}>{Number(item.TOUCH || 0).toFixed(2)}%</td>
                      <td style={tdAmtStyleWithBorder}>{fmtWt(item.PUREWT)}</td>
                    </tr>
                  );
                })}
                {totals && (
                  <tr style={{ background: "#e8e8e8", fontWeight: "bold" }}>
                    <td style={{ ...tdStyleWithBorder, textAlign: "right" }}><strong>TOTAL</strong></td>
                    <td style={tdStyleTotal}>{totals.pcs}</td>
                    <td style={tdStyleTotal}>{fmtWt(totals.grswt)}</td>
                    <td style={tdStyleTotal}>{fmtWt(totals.stnwt)}</td>
                    <td style={tdStyleTotal}>{fmtWt(totals.netwt)}</td>
                    <td style={tdStyleTotal}> </td>
                    <td style={tdStyleTotal}>{fmtWt(totals.purewt)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </React.Fragment>
        );
      })}

      <DoubleLine />

      {/* Closing Balance */}
      <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", margin: "6px 0 4px" }}>CLOSING BALANCE</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "2px 0" }}>
        <span>Cash</span><span>{fmtAmt(B.closingCash)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "2px 0" }}>
        <span>Pure Wt</span><span>{fmtWt(B.closingPure)}</span>
      </div>

      {/* Closing Details Section - Only show if closing details exist */}
      {showClosingSection && (
        <>
          <DashedLine />
          <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", margin: "6px 0 4px" }}>CLOSING DETAILS</div>
          {C.CONVTYPE && convTypeLabel && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "2px 0" }}>
              <span>Conversion Type</span><span>{convTypeLabel}</span>
            </div>
          )}
          {C.CONVWT > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "2px 0" }}>
              <span>Conversion Weight</span><span>{fmtWt(C.CONVWT)}</span>
            </div>
          )}
          {C.CONVAMT > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "2px 0" }}>
              <span>Conversion Amount</span><span>{fmtAmt(C.CONVAMT)}</span>
            </div>
          )}
        </>
      )}

      {/* Payments Section */}
      {(C.CASHRCVD > 0 || C.CASHPAID > 0 || C.BANKRCVD > 0 || C.BANKPAID > 0) && (
        <>
          <DashedLine />
          <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", margin: "6px 0 4px" }}>PAYMENTS</div>
          {C.CASHRCVD > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Cash Received</span><span>{fmtAmt(C.CASHRCVD)}</span></div>}
          {C.CASHPAID > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Cash Paid</span><span>{fmtAmt(C.CASHPAID)}</span></div>}
          {C.BANKRCVD > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bank Received</span><span>{fmtAmt(C.BANKRCVD)}</span></div>}
          {C.BANKPAID > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bank Paid</span><span>{fmtAmt(C.BANKPAID)}</span></div>}
        </>
      )}

      <DoubleLine />
      <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", margin: "6px 0" }}>
        THANK YOU FOR YOUR BUSINESS!
      </div>
      <DoubleLine />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PurchaseReceipt40Col: React.FC<PurchaseReceiptProps> = (props) => {
  const { columnSize = "40", accentColor = "#1E40AF", autoPrint = false } = props;
  const is50 = columnSize === "50";
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);

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

    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${thermalHTML}</body></html>`);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch { }
        setTimeout(() => { iframe.remove(); setIsPrinting(false); }, 300);
      }, 400);
    };
  }, [props, isPrinting, is50]);

  // Auto print if enabled
  useEffect(() => {
    if (autoPrint && !hasAutoPrinted && !isPrinting) {
      setHasAutoPrinted(true);
      setTimeout(() => {
        handlePrint();
      }, 100);
    }
  }, [autoPrint, hasAutoPrinted, isPrinting, handlePrint]);

  return (
    <div style={{ fontFamily: "'Inter','DM Sans',sans-serif" }}>
      <CardReceiptBody p={props} innerRef={printRef} />
      {!autoPrint && (
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
      )}
    </div>
  );
};

export default PurchaseReceipt40Col;