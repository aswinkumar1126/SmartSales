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
    REMARK:string;
    THRU:string;
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
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const fmtAmt = (n: number | null | undefined) =>
  "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNormalAmt = (n: number | null | undefined) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

const FONT_SHOP = " 'Roboto', 'Arial', sans-serif";
const FONT_BODY =  "'Roboto', 'Arial', sans-serif";
const FONT_AMOUNT = "'Roboto', 'Arial', sans-serif";

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
  fontWeight: "semibold",
  borderBottom: "1px solid #000",
  fontFamily: FONT_BODY,
};

const tdStyle: React.CSSProperties = {
  padding: "1px 1px",
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

  console.log(showClosingSection,C,'showClosingSection');

  const convTypeLabel = getConvTypeLabel(C.CONVTYPE);

  // const totalCol = ['pcs', 'grswt', 'stnwt', 'purewt'];

  const sections = [
    { label: "PURCHASE", rows: D.purchase ?? [], type: "purchase" },
    { label: "PURCHASE RETURN", rows: D.purchase_return ?? [], type: "purchase" },
    { label: "ISSUE", rows: D.issue ?? [], type: "issue" },
    { label: "RECEIPT", rows: D.receipt ?? [], type: "issue" },
  ].filter((s) => s.rows.length > 0);
  

  const itemSections = sections.map(({ label, rows, type }) => {
    const isPurchaseType = type === "purchase";

    let totals = null;

    if (rows.length > 0) {
      if (isPurchaseType) {
        // ✅ FULL TOTALS (purchase + purchase return)
        totals = {
          pcs: rows.reduce((sum, item) => sum + (Number(item.PCS) || 0), 0),
          grswt: rows.reduce((sum, item) => sum + (Number(item.GRSWT) || 0), 0),
          stnwt: rows.reduce((sum, item) => sum + (Number(item.STNWT) || 0), 0),
          netwt: rows.reduce((sum, item) => sum + (Number(item.NETWT) || 0), 0),
          purewt: rows.reduce((sum, item) => sum + (Number(item.PUREWT) || 0), 0),

         
          hmc: rows.reduce((sum, item) => sum + (Number(item.HMC) || 0), 0),
          mc: rows.reduce((sum, item) => sum + (Number(item.MC) || 0), 0),
          stoneAmt: rows.reduce((sum, item) => sum + (Number(item.STNAMT) || 0), 0),
        };
      } else {
        // ✅ ISSUE / RECEIPT TOTALS
        totals = {
          wt: rows.reduce((sum, item) => sum + (Number(item.WT) || 0), 0),
          purewt: rows.reduce((sum, item) => sum + (Number(item.PUREWT) || 0), 0),
        };
      }
    }

    const headers = isPurchaseType
      ? `
      <tr style="font-size:8px">
        <th style="border:1px solid #000; padding:2px; ">ITEM</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">PCS</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">GRS WT</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">STN WT</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">NET WT</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">TOUCH</th>
        <th style="border:1px solid #000; padding:2px; text-align:center">PURE</th>
      </tr>`
      : `
      <tr style="font-size:8px">
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

        if (isPurchaseType) {
          return `
        <tr style="font-size:10px">
          <td style="border:1px solid #000; padding:2px; text-align:left">${name}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${item.PCS ?? 0}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.GRSWT)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.STNWT)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.NETWT)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${Number(item.TOUCH || 0).toFixed(2)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.PUREWT)}</td>
        </tr>`;
        }

        return `
        <tr style="font-size:10px">
          <td style="border:1px solid #000; padding:2px; text-align:left">${name}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.WT)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${Number(item.TOUCH || 0).toFixed(2)}</td>
          <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.PUREWT)}</td>
        </tr>`;
      })
      .join("");

    const totalsRow = totals
      ? isPurchaseType
        ? `
<tr style="font-size:10px">
  <td style="border:1px solid #000; padding:2px; text-align:center;"><strong>TOTAL</strong></td>
  <td style="border:1px solid #000; padding:2px; text-align:right;">${totals.pcs}</td>
  <td style="border:1px solid #000; padding:2px; text-align:right;">${fmtWt(totals.grswt)}</td>
  <td style="border:1px solid #000; padding:2px; text-align:right;">${fmtWt(totals.stnwt)}</td>
  <td style="border:1px solid #000; padding:2px; text-align:right;">${fmtWt(totals.netwt)}</td>
  <td style="border:1px solid #000; padding:2px;"></td>
  <td style="border:1px solid #000; padding:2px; text-align:right;">${fmtWt(totals.purewt)}</td>
</tr>
`
        : `
<tr style="font-size:10px">
  <td style="border:1px solid #000; padding:2px; text-align:center;"><strong>TOTAL</strong></td>
  <td style="border:1px solid #000; padding:2px; text-align:right;">${fmtWt(totals.wt)}</td>
  <td style="border:1px solid #000; padding:2px;"></td>
  <td style="border:1px solid #000; padding:2px; text-align:right;">${fmtWt(totals.purewt)}</td>
</tr>
`
      : '';


      const extraChargesTable =totals &&
  isPurchaseType && (totals.hmc || totals.mc || totals.stoneAmt)
    ? `
<div style="width:100%; display:flex; justify-content:flex-end; margin-top:2px;">
  <table style="border-collapse:collapse;" class="no-border">

    <!-- ✅ DATA ROW -->
    <tr style="width:100%;">
      ${totals.hmc ? `
      <td style="padding:2px;">HMC :</td>
      <td style="padding:2px; text-align:right;">${fmtNormalAmt(totals.hmc)}</td>
      ` : ''}

      ${totals.mc ? `
      <td style="padding:2px;">MC :</td>
      <td style="padding:2px; text-align:right;">${fmtNormalAmt(totals.mc)}</td>
      ` : ''}

      ${totals.stoneAmt ? `
      <td style="padding:2px;">STN :</td>
      <td style="padding:2px; text-align:right;">${fmtNormalAmt(totals.stoneAmt)}</td>
      ` : ''}
    </tr>

    <!-- ✅ TOTAL ROW (aligned to right) -->
    <tr>
      <td colspan="${(
        (totals.hmc ? 2 : 0) +
        (totals.mc ? 2 : 0) +
        (totals.stoneAmt ? 2 : 0) - 2
      )}" style="padding:2px;"></td>

      <td style="padding:2px; font-weight:600;">TOTAL :</td>
      <td style="padding:2px; text-align:right; font-weight:600;">
        ${fmtNormalAmt(
          (totals.hmc || 0) +
          (totals.mc || 0) +
          (totals.stoneAmt || 0)
        )}
      </td>
    </tr>

  </table>
</div>
`
    : '';


    return `
    <div class="sec-title">${label}</div>
    <table style="width:100%; border-collapse:collapse; border:1px solid #000;" class="with-border">
      <thead >
        ${headers}
      </thead>
      <tbody >
        ${rowsHtml}
        ${totalsRow}
      </tbody>
    </table>
    ${extraChargesTable}
  `;
  }).join("");

  // Build closing details section
  const closingDetailsHtml = showClosingSection ? `
    <div class="sec-title"> CLOSING DETAILS </div>
    <table style="width:100%;  margin:4px 0; font-size:12px;" class="no-border">
      ${C.CONVTYPE && convTypeLabel ? `
      <tr>
        <td>CONVERSION TYPE :</td>
        <td style="text-align:right; font-weight:600;">${convTypeLabel}</td>
      </tr>
      ` : ''}
      ${C.CONVWT > 0 ? `
      <tr>
        <td>CONVERSION WEIGHT :</td>
        <td style="text-align:right; font-weight:600;">${fmtWt(C.CONVWT)}</td>
      </tr>
      ` : ''}
      ${C.CONVAMT > 0 ? `
      <tr>
        <td>CONVERSION AMOUNT :</td>
        <td style="text-align:right; font-weight:600;">${fmtNormalAmt(C.CONVAMT)}</td>
      </tr>
      ` : ''}
    </table>
  ` : '';

  const cashRcvd = Number(C.CASHRCVD) || 0;
  const cashPaid = Number(C.CASHPAID) || 0;
  const bankRcvd = Number(C.BANKRCVD) || 0;
  const bankPaid = Number(C.BANKPAID) || 0;

  const paymentsHtml = (cashRcvd > 0 || cashPaid > 0 || bankRcvd > 0 || bankPaid > 0) ? `

  <table style="width:100%; margin:4px 0; border-collapse: collapse;" class="with-border">
    <thead>
      <tr>
        <th></th>
        <th style="border:1px solid #000; padding:2px; text-align:right">RECEIVED</th>
        <th style="border:1px solid #000; padding:2px; text-align:right">PAID</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #000; padding:2px;">CASH</td>
        <td style="border:1px solid #000; padding:2px; text-align:right">
          ${cashRcvd > 0 ? fmtNormalAmt(cashRcvd) : '0'}
        </td>
        <td style="border:1px solid #000; padding:2px; text-align:right">
          ${cashPaid > 0 ? fmtNormalAmt(cashPaid) : '0'}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:2px;">BANK</td>
        <td style="border:1px solid #000; padding:2px; text-align:right">
          ${bankRcvd > 0 ? fmtNormalAmt(bankRcvd) : '0'}
        </td>
        <td style="border:1px solid #000; padding:2px; text-align:right">
          ${bankPaid > 0 ? fmtNormalAmt(bankPaid) : '0'}
        </td>
      </tr>

      <tr style="font-weight:bold;">
        <td style="border:1px solid #000; padding:2px;">TOTAL</td>
        <td style="border:1px solid #000; padding:2px; text-align:right">
          ${fmtNormalAmt(cashRcvd + bankRcvd)}
        </td>
        <td style="border:1px solid #000; padding:2px; text-align:right">
          ${fmtNormalAmt(cashPaid + bankPaid)}
        </td>
      </tr>
    </tbody>
  </table>
` : '';

  // Opening balance always shows
  const openingBalanceHtml = `
    <div class="sec-title">OPENING BALANCE</div>
    <table style="width:100%;  margin:2px 0;" class="no-border">
      <tr  style="display:flex; justify-content:space-between; gap:15px; width:100%; ">
        <td >CASH :</td>
        <td style=" text-align:right; font-weight:600;">${fmtNormalAmt(B.openingCash)}</td>
     
        <td>PURE :</td>
        <td style="text-align:right; font-weight:600;">${fmtWt(B.openingPure)}</td>
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
    <table style="width:100%;  margin:4px 0;" class="no-border">
      <tr  style="display:flex; justify-content:space-between; gap:15px; width:100%; ">
        <td >CASH :</td>
        <td style="text-align:right; font-weight:600;">${fmtNormalAmt(B.closingCash)}</td>
      
        <td >PURE :</td>
        <td style=" text-align:right; font-weight:600;">${fmtWt(B.closingPure)}</td>
      </tr>
    </table>
  `;

  return `
<div class="pr-thermal">
  <div style="text-align:center; margin-bottom:4px;">
    <img src="/printImg.jpeg" alt="logo" style="height:60px; object-fit:contain;" />
  </div>
  
  <div style="text-align:center; font-size:16px; font-weight:bold; letter-spacing:0.5px; margin:4px 0;">PURCHASE RECEIPT</div>


  <table style="width:100%;  margin:4px 0;" class="no-border">
    <tr>
      <td style="width:55%; vertical-align:top;">
        <table style="width:100%;" class="no-border">
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
         
        </table>
      </td>
    </tr>
   

  ${H.REMARK ? `
<tr>
  <td colspan="2">
    <div style="font-size:12px;">
      
      ${H.REMARK ? `
        <div>
          <span style="font-weight:bold;">REMARK :</span> ${H.REMARK}
        </div>
      ` : ''}

     

    </div>
  </td>
</tr>
` : ''}

      ${H.THRU ? `
<tr>
  <td colspan="2" style="font-size:12px;">
    <div>
      <span style="font-weight:bold;">THRU : </span>${H.THRU}
    </div>
  </td>
</tr>
` : ''}
  </table>


  ${openingBalanceHtml}
  
  ${transactionsHtml}
  
  ${closingDetailsHtml}
  
  ${paymentsHtml}

  ${closingBalanceHtml}

</div>`;
};

// ─── Print CSS ────────────────────────────────────────────────────────────────

const buildPrintCSS = (is50: boolean): string => {
 const pageW = is50 ? "100mm" : "90mm";
  const bodyW = is50 ? "95mm" : "82mm";
  const margin = is50 ? "1mm" : "0.5mm";
  return `
@page { size: ${pageW} auto; margin: ${margin}; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${pageW}; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.pr-thermal {
  font-family: 'Roboto', 'Helvetica Neue', sans-serif;
  font-weight: normal;
  color: #000;
  background: #fff;
  width: ${bodyW};
  margin: 0 auto;
  padding: 4px 2px;
  font-size: 14px;
  line-height: 1.4;
}
.pr-thermal .co-name, .pr-thermal .sec-title { text-align:center; font-size:14px; font-weight:bold; margin:4px 0px 2px; }
.pr-thermal .co-name { font-size:16px; text-transform:uppercase; letter-spacing:0.5px; }
.pr-thermal .sec-title { font-size:14px; text-transform:uppercase; }
.pr-thermal .dashed-line { border-top: 1px dashed #000; margin: 4px 0; }
.pr-thermal .double-line { border-top: 3px double #000; margin: 4px 0; }
.pr-thermal .lr { display:flex; justify-content:space-between; font-size:12px; margin:2px 0; }
.pr-thermal table { width:100%; margin:4px 0;}
.pr-thermal table.no-border { width:100%; border-collapse:collapse; margin:2px 0;}
.pr-thermal table.with-border { width:100%; border-collapse:collapse; margin:4px 0; border:1px solid #222;}
.pr-thermal table th { padding:2px; font-size:12px; font-weight:bold; color:'#000';  }
.pr-thermal table td { padding:2px; font-size:12px; vertical-align:top; color:'#000'; }
.pr-thermal table td.r { text-align:right; color:'#000';  }
.pr-thermal .tran-table { margin: 10px 0px 10px 0px;}
.pr-thermal .closing-table{ margin: 10px 0px ;}
`;
};


// ─── Main Component ───────────────────────────────────────────────────────────

const PurchaseReceipt: React.FC<PurchaseReceiptProps> = (props) => {
  const { columnSize = "40",} = props;


  console.log("PurchaseReceipt props", props)
  const is50 = columnSize === "50";
 
  const hasPrintedRef = useRef(false);

  const handlePrint = useCallback(() => {
    const thermalHTML = buildThermalHTML(props, is50);
    const css = buildPrintCSS(is50);

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:120mm;height:1px;border:none;visibility:hidden;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <style>${css}</style>
        </head>
        <body>${thermalHTML}</body>
      </html>
    `);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch { }
        setTimeout(() => iframe.remove(), 300);
      }, 300);
    };
  }, [props, is50]);

  useEffect(() => {
    if (!hasPrintedRef.current) {
      hasPrintedRef.current = true;
      handlePrint();
    }
  }, [handlePrint]);

  return null;
};

export default PurchaseReceipt;