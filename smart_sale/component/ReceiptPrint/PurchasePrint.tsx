"use client";
import React, { useRef, useCallback, useState, useEffect } from "react";
import { Company } from "@/service/CompanyService";
import { PurchaseCLosing } from "@/types/transcation/Transaction";
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";
import { SoftControl } from "@/types/softcontrol/SoftControl";

// ─── API Data Types ───────────────────────────────────────────────────────────

export interface PurchaseOtherChargeDetail {
  [key: string]: any;
}

export interface StoneDetail {
  stoneId?: number | string | null;
  stoneWeight?: number | string | null;
  stoneUnit?: string | null;
  [key: string]: any;
}

type TransactionSectionType = "purchase" | "issue";

export interface TransactionSection {
  label: string;
  rows: TransactionItem[];
  type: TransactionSectionType;
}

export interface TransactionDetails {
  purchase: TransactionItem[];
  purchase_return: TransactionItem[];
  issue: TransactionItem[];
  receipt: TransactionItem[];
}

export interface PurchaseTotals {
  pcs: number;
  grswt: number;
  netwt: number;
  purewt: number;
  stoneWt: number;
  navaWt: number;
  diamondWt: number;
  hmc: number;
  mc: number;
  stoneAmt: number;
  navaAmt: number;
  diamondAmt: number;
}

export interface IssueTotals {
  wt: number;
  purewt: number;
}

type Totals = PurchaseTotals | IssueTotals | null;

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
  STONEDETAILS?: StoneDetail[];
  purchaseOtherChargesDetails?: PurchaseOtherChargeDetail[];
  PUREGOLDNAME?: string | null;
}

export interface softData {
  CTLID: string;
  CTLNAME: string;
  CTLTEXT: string;
  CTLTYPE: string;
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
    REMARK: string;
    THRU: string;
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
  autoPrint?: boolean;
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

const getConvTypeLabel = (type: string | null | undefined): string => {
  if (!type) return "";
  return type.toUpperCase() === "P" ? "PURE" : type.toUpperCase() === "C" ? "CASH" : "";
};

// ─── Styling Constants ────────────────────────────────────────────────────────

const FONT_BODY = "'Roboto', 'Arial', sans-serif";
const FONT_AMOUNT = "'Roboto', 'Arial', sans-serif";

const hasTransactions = (details: PurchaseReceiptProps['TRANSACTION_DETAILS']): boolean => {
  return (
    (details.purchase?.length || 0) > 0 ||
    (details.purchase_return?.length || 0) > 0 ||
    (details.issue?.length || 0) > 0 ||
    (details.receipt?.length || 0) > 0
  );
};

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

const buildThermalHTML = (p: PurchaseReceiptProps, softData?: SoftControl, is50?: boolean): string => {
  const { TRANSACTION_HEADER: H, TRANSACTION_DETAILS: D, BALANCE: B, CLOSING_DETAILS: C, ACHEAD_DETAILS: A } = p;

  const partyName = A?.ACNAME || `AC #${H.ACCODE}`;
  const partyAddress = A?.ADDRESS ? A.ADDRESS.replace(/null/g, "") : "";
  const showTransactions = hasTransactions(D);
  const showClosingSection = hasClosingDetails(C);
  const convTypeLabel = getConvTypeLabel(C.CONVTYPE);

  const sections = [
    { label: "PURCHASE", rows: D.purchase ?? [], type: "purchase" },
    { label: "PURCHASE RETURN", rows: D.purchase_return ?? [], type: "purchase" },
    { label: "ISSUE", rows: D.issue ?? [], type: "issue" },
    { label: "RECEIPT", rows: D.receipt ?? [], type: "issue" },
  ].filter((s) => s.rows.length > 0);

  const itemSections = sections.map(({ label, rows, type }) => {
    const isPurchaseType = type === "purchase";

    const hasStoneWt = rows.some((item) =>
      (item?.STONEDETAILS || []).some((s: any) => Number(s.stoneId) === 9999)
    );

    const hasNavaWt = rows.some((item) =>
      (item?.STONEDETAILS || []).some((s: any) => Number(s.stoneId) === 9997)
    );

    const hasDiamondWt = rows.some((item) =>
      (item?.STONEDETAILS || []).some((s: any) => Number(s.stoneId) === 9998)
    );

    let totals: any = null;

    if (rows.length > 0) {
      if (isPurchaseType) {
        totals = {
          pcs: rows.reduce((sum, item) => sum + (Number(item.PCS) || 0), 0),
          grswt: rows.reduce((sum, item) => sum + (Number(item.GRSWT) || 0), 0),
          netwt: rows.reduce((sum, item) => sum + (Number(item.NETWT) || 0), 0),
          purewt: rows.reduce((sum, item) => sum + (Number(item.PUREWT) || 0), 0),
          stoneWt: 0,
          navaWt: 0,
          diamondWt: 0,
          hmc: rows.reduce((sum, item) => sum + (Number(item.HMC) || 0), 0),
          mc: rows.reduce((sum, item) => sum + (Number(item.MC) || 0), 0),
          stoneAmt: 0,
          navaAmt: 0,
          diamondAmt: 0,
        };

        rows.forEach((item) => {
          const stoneDetails = item?.STONEDETAILS || [];

          stoneDetails.forEach((s: any) => {
            const wt = (s.stoneUnit || "g") === "c"
              ? (Number(s.stoneWeight) || 0) / 5
              : Number(s.stoneWeight) || 0;

            const amt = Number(s.stoneAmount) || 0;

            if (Number(s.stoneId) === 9999) {
              totals.stoneWt += wt;
              totals.stoneAmt += amt;
            }
            if (Number(s.stoneId) === 9997) {
              totals.navaWt += wt;
              totals.navaAmt += amt;
            }
            if (Number(s.stoneId) === 9998) {
              totals.diamondWt += wt;
              totals.diamondAmt += amt;
            }
          });
        });
      } else {
        totals = {
          wt: rows.reduce((sum, item) => sum + (Number(item.WT) || 0), 0),
          purewt: rows.reduce((sum, item) => sum + (Number(item.PUREWT) || 0), 0),
        };
      }
    }

    const headers = isPurchaseType
      ? `
<tr style="font-size:8px">
  <th style="border:1px solid #000; padding:2px;">ITEM</th>
  <th style="border:1px solid #000; padding:2px; text-align:center">PCS</th>
  <th style="border:1px solid #000; padding:2px; text-align:center">GRS WT</th>
  ${hasStoneWt ? `<th style="border:1px solid #000; padding:2px; text-align:center">STN WT</th>` : ""}
  ${hasNavaWt ? `<th style="border:1px solid #000; padding:2px; text-align:center">NAVA WT</th>` : ""}
  ${hasDiamondWt ? `<th style="border:1px solid #000; padding:2px; text-align:center">DIA WT</th>` : ""}
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

  //${ partyAddress ? `<tr><td style="font-weight:bold; width:40%;">ADDRESS :</td><td>${partyAddress}</td>` : "" }
    const rowsHtml = rows
      .map((item) => {
        const name =
          item.ITEMNAME ||
          item.PUREGOLDNAME ||
          (item.PUREID ? `Pure #${item.PUREID}` : item.ITEMID ? `Item #${item.ITEMID}` : "—");

        const stoneDetails = item?.STONEDETAILS || [];

        const getWt = (stoneId: number) => {
          return stoneDetails
            .filter((s: any) => Number(s.stoneId) === stoneId)
            .reduce((sum: number, s: any) => {
              const wt = Number(s.stoneWeight) || 0;
              return sum + ((s.stoneUnit || "g") === "c" ? wt / 5 : wt);
            }, 0);
        };

        const stoneWt = getWt(9999);
        const navaWt = getWt(9997);
        const diamondWt = getWt(9998);

        if (isPurchaseType) {
          return `
<tr style="font-size:10px">
  <td style="border:1px solid #000; padding:2px; text-align:left">${name}</td>
  <td style="border:1px solid #000; padding:2px; text-align:right">${item.PCS ?? 0}</td>
  <td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(item.GRSWT)}</td>
  ${hasStoneWt ? `<td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(stoneWt)}</td>` : ""}
  ${hasNavaWt ? `<td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(navaWt)}</td>` : ""}
  ${hasDiamondWt ? `<td style="border:1px solid #000; padding:2px; text-align:right">${fmtWt(diamondWt)}</td>` : ""}
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
  <td style="border:1px solid #000; padding:2px; text-align:right;"><strong>${totals.pcs}</strong></td>
  <td style="border:1px solid #000; padding:2px; text-align:right;"><strong>${fmtWt(totals.grswt)}</strong></td>
  ${hasStoneWt ? `<td style="border:1px solid #000; padding:2px; text-align:right;"><strong>${fmtWt(totals.stoneWt)}</strong></td>` : ""}
  ${hasNavaWt ? `<td style="border:1px solid #000; padding:2px; text-align:right;"><strong>${fmtWt(totals.navaWt)}</strong></td>` : ""}
  ${hasDiamondWt ? `<td style="border:1px solid #000; padding:2px; text-align:right;"><strong>${fmtWt(totals.diamondWt)}</strong></td>` : ""}
  <td style="border:1px solid #000; padding:2px; text-align:right;"><strong>${fmtWt(totals.netwt)}</strong></td>
  <td style="border:1px solid #000; padding:2px;"></td>
  <td style="border:1px solid #000; padding:2px; text-align:right;"><strong>${fmtWt(totals.purewt)}</strong></td>
</tr>`
        : `
<tr style="font-size:10px">
  <td style="border:1px solid #000; padding:2px; text-align:center;"><strong>TOTAL</strong></td>
  <td style="border:1px solid #000; padding:2px; text-align:right;"><strong>${fmtWt(totals.wt)}</strong></td>
  <td style="border:1px solid #000; padding:2px;"></td>
  <td style="border:1px solid #000; padding:2px; text-align:right;"><strong>${fmtWt(totals.purewt)}</strong></td>
</tr>`
      : "";

    /**
     * =====================================================
     * EXTRA CHARGES TABLE - Split into Stone, Nava, Diamond
     * =====================================================
     */
    const extraChargesTable = totals && isPurchaseType && (totals.hmc || totals.mc || totals.stoneAmt || totals.navaAmt || totals.diamondAmt)
      ? `
<div style="width:100%; display:flex; justify-content:flex-end; margin-top:2px;">
  <table style="border-collapse:collapse;" class="no-border">
    <tr>
      ${totals.hmc ? `<td style="padding:2px; text-align:right;">HMC : ${fmtNormalAmt(totals.hmc)}</td>` : ""}
      ${totals.mc ? `<td style="padding:2px; text-align:right;">MC : ${fmtNormalAmt(totals.mc)}</td>` : ""}
    </tr>
    <tr>
      ${totals.stoneAmt ? `<td style="padding:2px; text-align:right;">STONE : ${fmtNormalAmt(totals.stoneAmt)}</td>` : ""}
      ${totals.navaAmt ? `<td style="padding:2px; text-align:right;">NAVA : ${fmtNormalAmt(totals.navaAmt)}</td>` : ""}
      ${totals.diamondAmt ? `<td style="padding:2px; text-align:right;">DIAMOND : ${fmtNormalAmt(totals.diamondAmt)}</td>` : ""}
    </tr>
    <tr>
      <td colspan="3" style="padding:2px; text-align:right; font-weight:600; border-top:1px dashed #000;">
        TOTAL CHARGES : ${fmtNormalAmt(
        (totals.hmc || 0) +
        (totals.mc || 0) +
        (totals.stoneAmt || 0) +
        (totals.navaAmt || 0) +
        (totals.diamondAmt || 0)
      )}
      </td>
    </tr>
  </table>
</div>`
      : "";

    return `
<div class="sec-title">${label}</div>
<table style="width:100%; border-collapse:collapse; border:1px solid #000;" class="with-border">
  <thead>${headers}</thead>
  <tbody>${rowsHtml}${totalsRow}</tbody>
</table>
${extraChargesTable}`;
  }).join("");

  const closingDetailsHtml = showClosingSection ? `
<div class="sec-title">CLOSING DETAILS</div>
<table style="width:100%; margin:4px 0; font-size:10px;" class="no-border">
  ${C.CONVTYPE && convTypeLabel ? `<tr><td style="font-weight:600;">CONVERSION TYPE :</td><td style="text-align:right; font-weight:600;">${convTypeLabel}</td>` : ""}
  ${C.CONVWT > 0 ? `<tr><td style="font-weight:600;">CONVERSION WEIGHT :</td><td style="text-align:right; font-weight:600;">${fmtWt(C.CONVWT)}</td>` : ""}
  ${H.RATE > 0 && C.CONVTYPE ? `<tr><td style="font-weight:600;">CONVERSION RATE :</td><td style="text-align:right; font-weight:600;">${fmtNormalAmt(H.RATE)}</td>` : ""}
  ${C.CONVAMT > 0 ? `<tr><td style="font-weight:600;">CONVERSION AMOUNT :</td><td style="text-align:right; font-weight:600;">${fmtNormalAmt(C.CONVAMT)}</td>` : ""}
</table>
` : '';

  const cashRcvd = Number(C.CASHRCVD) || 0;
  const cashPaid = Number(C.CASHPAID) || 0;
  const bankRcvd = Number(C.BANKRCVD) || 0;
  const bankPaid = Number(C.BANKPAID) || 0;

  const paymentsHtml = (cashRcvd > 0 || cashPaid > 0 || bankRcvd > 0 || bankPaid > 0) ? `
<table style="width:100%; margin:4px 0; border-collapse: collapse;" class="with-border">
  <thead>
    <tr><th></th><th style="border:1px solid #000; padding:2px; text-align:right">RECEIVED</th><th style="border:1px solid #000; padding:2px; text-align:right">PAID</th>
  </thead>
  <tbody>
    <tr><td style="border:1px solid #000; padding:2px;">CASH</td><td style="border:1px solid #000; padding:2px; text-align:right">${cashRcvd > 0 ? fmtNormalAmt(cashRcvd) : '0'}</td><td style="border:1px solid #000; padding:2px; text-align:right">${cashPaid > 0 ? fmtNormalAmt(cashPaid) : '0'}</td>
    <tr>
    <tr><td style="border:1px solid #000; padding:2px;">BANK</td><td style="border:1px solid #000; padding:2px; text-align:right">${bankRcvd > 0 ? fmtNormalAmt(bankRcvd) : '0'}</td><td style="border:1px solid #000; padding:2px; text-align:right">${bankPaid > 0 ? fmtNormalAmt(bankPaid) : '0'}</td>
    </tr>
    <tr style="font-weight:bold;"><td style="border:1px solid #000; padding:2px;">TOTAL</td><td style="border:1px solid #000; padding:2px; text-align:right">${fmtNormalAmt(cashRcvd + bankRcvd)}</td><td style="border:1px solid #000; padding:2px; text-align:right">${fmtNormalAmt(cashPaid + bankPaid)}</td>
  </tbody>
</table>
` : '';

  const openingBalanceHtml = `
<div class="sec-title">OPENING BALANCE</div>
<table style="width:100%; margin:2px 0;" class="no-border">
  <tr style="display:flex; justify-content:space-between; gap:15px; width:100%;">
    <td style="text-align:right; font-weight:600;">CASH : ${fmtNormalAmt(B.openingCash)}</td>
    <td style="text-align:right; font-weight:600;">PURE : ${fmtWt(B.openingPure)}</td>
  </tr>
</table>`;

  const transactionsHtml = showTransactions ? `<div class="tran-table">${itemSections}</div>` : '';

  const closingBalanceHtml = `
<div class="sec-title">CLOSING BALANCE</div>
<table style="width:100%; margin:4px 0;" class="no-border">
  <tr style="display:flex; justify-content:space-between; gap:15px; width:100%;">
    <td style="text-align:right; font-weight:600;">CASH : ${fmtNormalAmt(B.closingCash)}</td>
    <td style="text-align:right; font-weight:600;">PURE : ${fmtWt(B.closingPure)}</td>
  </tr>
</table>`;

  return `
<div class="pr-thermal">
  ${softData && softData.CTLTEXT === "Y" ? `<div style="text-align:center; margin-bottom:4px;">
    <img src="/printImg.jpeg" alt="logo" style="height:60px; object-fit:contain;" />
  </div>` : ''}
  
  <div style="text-align:center; font-size:12px; font-weight:bold; letter-spacing:0.5px; margin:4px 0;">PURCHASE ESTIMATION</div>

  <table style="width:100%; margin:4px 0;" class="no-border">
    <tr>
      <td style="width:55%; vertical-align:top;">
        <table style="width:100%;" class="no-border">
          <tr><td style="font-weight:bold; width:40%;">PARTY <span style="display:inline-block; width:10px;"></span>: </td><td>${partyName}</td>
          </tr>
        
          <tr><td style="font-weight:bold; width:40%;">REMARK <span style="display:inline-block; width:2px;"></span>:</td><td>${H.REMARK}</td>
           <tr><td style="font-weight:bold; width:40%;">THRU <span style="display:inline-block; width:15px;"></span>:</td><td>${H.THRU}</td> 
        </table>
      </td>
      <td style="width:45%; vertical-align:top; text-align:left;">
        <table style="width:100%; font-size:10px; text-align:left;" class="no-border">
          <tr><td style="font-weight:bold; width:42%;">BILL NO :</td><td>${H.BILLNO}</td>
          </tr>
          <tr><td style="font-weight:bold; width:42%;">DATE <span style="display:inline-block; width:12px;"></span>:</td><td>${formatDate(H.TRANDATE)}</td>
          </tr>
         
        </table>
      </td>
    </tr>
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
  const pageW = is50 ? "120mm" : "100mm";
  const bodyW = is50 ? "110mm" : "95mm";
  const margin = is50 ? "2mm" : "1mm";
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
  margin: 30px auto 0px;
  padding: 4px 2px;
  font-size: 14px;
  line-height: 1.4;
}
.pr-thermal .co-name, .pr-thermal .sec-title { text-align:center; font-size:12px; font-weight:bold; margin:4px 0px 2px; }
.pr-thermal .sec-title { font-size:10px; text-transform:uppercase; }
.pr-thermal .dashed-line { border-top: 1px dashed #000; margin: 4px 0; }
.pr-thermal .double-line { border-top: 3px double #000; margin: 4px 0; }
.pr-thermal .lr { display:flex; justify-content:space-between; font-size:10px; margin:2px 0; }
.pr-thermal table { width:100%; margin:4px 0;}
.pr-thermal table.no-border { width:100%; border-collapse:collapse; margin:2px 0;}
.pr-thermal table.with-border { width:100%; border-collapse:collapse; margin:4px 0; border:1px solid #222;}
.pr-thermal table th { padding:2px; font-size:10px; font-weight:bold; }
.pr-thermal table td { padding:2px; font-size:10px; vertical-align:top; }
.pr-thermal .tran-table { margin: 10px 0px 10px 0px;}
.pr-thermal .closing-table{ margin: 10px 0px;}
`;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PurchaseReceipt: React.FC<PurchaseReceiptProps> = (props) => {
  const { columnSize = "40", autoPrint = true } = props;
  const { data: softData } = useSoftControlById('RECEIPT_PRINT_LOGO');
  const is50 = columnSize === "50";
  const hasPrintedRef = useRef(false);

  const handlePrint = useCallback(() => {
    const thermalHTML = buildThermalHTML(props, softData, is50);
    const css = buildPrintCSS(is50);

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:120mm;height:1px;border:none;visibility:hidden;";
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
  }, [props, softData, is50]);

  useEffect(() => {
    if (autoPrint && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      handlePrint();
    }
  }, [handlePrint, autoPrint]);

  return null;
};

export default PurchaseReceipt;