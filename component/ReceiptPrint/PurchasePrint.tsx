"use client";
import React, { useRef, useCallback, useEffect } from "react";
import { Company } from "@/service/CompanyService";
import { PurchaseCLosing } from "@/types/transcation/Transaction";
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";
import { SoftControl } from "@/types/softcontrol/SoftControl";
import * as XLSX from 'xlsx'; // Add this import

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
  copies?: number;
  onAfterPrint?: () => void;
  onAfterExport?: () => void; // Callback for after export
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

// ─── Excel Data Builder ─────────────────────────────────────────────────────

interface ExcelRow {
  [key: string]: any;
}

const buildExcelData = (p: PurchaseReceiptProps): ExcelRow[] => {
  const { TRANSACTION_HEADER: H, TRANSACTION_DETAILS: D, BALANCE: B, CLOSING_DETAILS: C, ACHEAD_DETAILS: A } = p;
  const excelRows: ExcelRow[] = [];

  // Header row with receipt information
  excelRows.push({
    'Type': 'RECEIPT INFORMATION',
    'Bill No': H.BILLNO,
    'Date': formatDate(H.TRANDATE),
    'Party': A?.ACNAME || `AC #${H.ACCODE}`,
    'Remark': H.REMARK,
    'Thru': H.THRU,
  });

  excelRows.push({}); // Empty row for spacing

  // Opening Balance
  excelRows.push({
    'Type': 'OPENING BALANCE',
    'Cash': B.openingCash,
    'Pure': B.openingPure,
  });

  excelRows.push({}); // Empty row

  // Purchase Items
  if (D.purchase && D.purchase.length > 0) {
    excelRows.push({
      'Type': 'PURCHASE',
      'Item Name': '',
      'PCS': '',
      'GRS WT': '',
      'NET WT': '',
      'TOUCH': '',
      'PURE WT': '',
      'HMC': '',
      'MC': '',
    });

    D.purchase.forEach((item) => {
      const stoneDetails = item?.STONEDETAILS || [];

      // Get stone weights
      const getStoneWt = (stoneId: number) => {
        return stoneDetails
          .filter((s: any) => Number(s.stoneId) === stoneId)
          .reduce((sum: number, s: any) => {
            const wt = Number(s.stoneWeight) || 0;
            return sum + ((s.stoneUnit || "g") === "c" ? wt / 5 : wt);
          }, 0);
      };

      const stoneWt = getStoneWt(9999);
      const navaWt = getStoneWt(9997);
      const diamondWt = getStoneWt(9998);

      excelRows.push({
        'Type': '',
        'Item Name': item.ITEMNAME || item.PUREGOLDNAME || '-',
        'PCS': item.PCS || 0,
        'GRS WT': item.GRSWT || 0,
        'STN WT': stoneWt || 0,
        'NAVA WT': navaWt || 0,
        'DIA WT': diamondWt || 0,
        'NET WT': item.NETWT || 0,
        'TOUCH': item.TOUCH || 0,
        'PURE WT': item.PUREWT || 0,
        'HMC': item.HMC || 0,
        'MC': item.MC || 0,
      });
    });

    // Purchase totals
    const purchaseTotals = {
      pcs: D.purchase.reduce((sum, item) => sum + (Number(item.PCS) || 0), 0),
      grswt: D.purchase.reduce((sum, item) => sum + (Number(item.GRSWT) || 0), 0),
      netwt: D.purchase.reduce((sum, item) => sum + (Number(item.NETWT) || 0), 0),
      purewt: D.purchase.reduce((sum, item) => sum + (Number(item.PUREWT) || 0), 0),
      hmc: D.purchase.reduce((sum, item) => sum + (Number(item.HMC) || 0), 0),
      mc: D.purchase.reduce((sum, item) => sum + (Number(item.MC) || 0), 0),
    };

    excelRows.push({
      'Type': 'TOTAL',
      'Item Name': '',
      'PCS': purchaseTotals.pcs,
      'GRS WT': purchaseTotals.grswt,
      'NET WT': purchaseTotals.netwt,
      'PURE WT': purchaseTotals.purewt,
      'HMC': purchaseTotals.hmc,
      'MC': purchaseTotals.mc,
    });

    excelRows.push({}); // Empty row
  }

  // Purchase Return Items
  if (D.purchase_return && D.purchase_return.length > 0) {
    excelRows.push({
      'Type': 'PURCHASE RETURN',
      'Item Name': '',
      'PCS': '',
      'GRS WT': '',
      'NET WT': '',
      'TOUCH': '',
      'PURE WT': '',
    });

    D.purchase_return.forEach((item) => {
      excelRows.push({
        'Type': '',
        'Item Name': item.ITEMNAME || item.PUREGOLDNAME || '-',
        'PCS': item.PCS || 0,
        'GRS WT': item.GRSWT || 0,
        'NET WT': item.NETWT || 0,
        'TOUCH': item.TOUCH || 0,
        'PURE WT': item.PUREWT || 0,
      });
    });

    excelRows.push({}); // Empty row
  }

  // Issue Items
  if (D.issue && D.issue.length > 0) {
    excelRows.push({
      'Type': 'ISSUE',
      'Item Name': '',
      'WT': '',
      'TOUCH': '',
      'PURE WT': '',
    });

    D.issue.forEach((item) => {
      excelRows.push({
        'Type': '',
        'Item Name': item.ITEMNAME || item.PUREGOLDNAME || '-',
        'WT': item.WT || 0,
        'TOUCH': item.TOUCH || 0,
        'PURE WT': item.PUREWT || 0,
      });
    });

    // Issue totals
    const issueTotals = {
      wt: D.issue.reduce((sum, item) => sum + (Number(item.WT) || 0), 0),
      purewt: D.issue.reduce((sum, item) => sum + (Number(item.PUREWT) || 0), 0),
    };

    excelRows.push({
      'Type': 'TOTAL',
      'WT': issueTotals.wt,
      'PURE WT': issueTotals.purewt,
    });

    excelRows.push({}); // Empty row
  }

  // Receipt Items
  if (D.receipt && D.receipt.length > 0) {
    excelRows.push({
      'Type': 'RECEIPT',
      'Item Name': '',
      'WT': '',
      'TOUCH': '',
      'PURE WT': '',
    });

    D.receipt.forEach((item) => {
      excelRows.push({
        'Type': '',
        'Item Name': item.ITEMNAME || item.PUREGOLDNAME || '-',
        'WT': item.WT || 0,
        'TOUCH': item.TOUCH || 0,
        'PURE WT': item.PUREWT || 0,
      });
    });

    excelRows.push({}); // Empty row
  }

  // Closing Details
  if (hasClosingDetails(C)) {
    excelRows.push({
      'Type': 'CLOSING DETAILS',
      'Conversion Type': getConvTypeLabel(C.CONVTYPE),
      'Conversion WT': C.CONVWT || 0,
      'Conversion Rate': H.RATE || 0,
      'Conversion Amount': C.CONVAMT || 0,
    });
    excelRows.push({}); // Empty row
  }

  // Payments
  const cashRcvd = Number(C.CASHRCVD) || 0;
  const cashPaid = Number(C.CASHPAID) || 0;
  const bankRcvd = Number(C.BANKRCVD) || 0;
  const bankPaid = Number(C.BANKPAID) || 0;

  if (cashRcvd > 0 || cashPaid > 0 || bankRcvd > 0 || bankPaid > 0) {
    excelRows.push({
      'Type': 'PAYMENTS',
      'Cash Received': cashRcvd,
      'Cash Paid': cashPaid,
      'Bank Received': bankRcvd,
      'Bank Paid': bankPaid,
      'Total Received': cashRcvd + bankRcvd,
      'Total Paid': cashPaid + bankPaid,
    });
    excelRows.push({}); // Empty row
  }

  // Closing Balance
  excelRows.push({
    'Type': 'CLOSING BALANCE',
    'Cash': B.closingCash,
    'Pure': B.closingPure,
  });

  return excelRows;
};

// ─── Export to Excel Function ────────────────────────────────────────────────

export const exportToExcel = (props: PurchaseReceiptProps, filename?: string) => {
  const excelData = buildExcelData(props);

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths (optional)
  ws['!cols'] = [
    { wch: 20 }, // Type column
    { wch: 30 }, // Item Name / Description
    { wch: 12 }, // PCS / WT
    { wch: 15 }, // GRS WT
    { wch: 15 }, // STN WT
    { wch: 15 }, // NAVA WT
    { wch: 15 }, // DIA WT
    { wch: 15 }, // NET WT
    { wch: 12 }, // TOUCH
    { wch: 15 }, // PURE WT
    { wch: 15 }, // HMC
    { wch: 15 }, // MC
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const sheetName = `Receipt_${props.TRANSACTION_HEADER.BILLNO}_${formatDate(props.TRANSACTION_HEADER.TRANDATE)}`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // Excel sheet name max 31 chars

  // Export to file
  const fileName = filename || `Purchase_Receipt_${props.TRANSACTION_HEADER.BILLNO}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ─── Thermal HTML Builder ─────────────────────────────────────────────────────

const buildThermalHTML = (p: PurchaseReceiptProps, softData?: SoftControl, is50?: boolean): string => {
  const { TRANSACTION_HEADER: H, TRANSACTION_DETAILS: D, BALANCE: B, CLOSING_DETAILS: C, ACHEAD_DETAILS: A } = p;

  const partyName = A?.ACNAME || `AC #${H.ACCODE}`;
  const showTransactions = hasTransactions(D);
  const showClosingSection = hasClosingDetails(C);
  const convTypeLabel = getConvTypeLabel(C.CONVTYPE);

  const remark = H.REMARK !== null && H.REMARK !== undefined && H.REMARK !== "" ? H.REMARK : "";
  const thru = H.THRU !== null && H.THRU !== undefined && H.THRU !== "" ? H.THRU :"";

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
</table>`
      : "";

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
    </tr>
    <tr><td style="border:1px solid #000; padding:2px;">BANK</td><td style="border:1px solid #000; padding:2px; text-align:right">${bankRcvd > 0 ? fmtNormalAmt(bankRcvd) : '0'}</td><td style="border:1px solid #000; padding:2px; text-align:right">${bankPaid > 0 ? fmtNormalAmt(bankPaid) : '0'}</td>
    </tr>
    <tr style="font-weight:bold;"><td style="border:1px solid #000; padding:2px;">TOTAL</td><td style="border:1px solid #000; padding:2px; text-align:right">${fmtNormalAmt(cashRcvd + bankRcvd)}</td><td style="border:1px solid #000; padding:2px; text-align:right">${fmtNormalAmt(cashPaid + bankPaid)}</td>
  </tbody>
</table>
` : '';

const openingBalanceHtml = `

<table style="width:100%; margin:2px 0;" class="no-border">
  <tr>
    <td style="width:70%;"></td>

    <td style="font-weight:600; white-space:nowrap; text-align:right;">
      OB PURE
    </td>

    <td style="width:10px; font-weight:600; white-space:nowrap; text-align:center;">
      :
    </td>

    <td style="text-align:right; font-weight:600; white-space:nowrap;">
      ${fmtWt(B.openingPure)}
    </td>
  </tr>

  <tr>
    <td></td>

    <td style="font-weight:600; white-space:nowrap; text-align:right;">
      OB CASH
    </td>

    <td style="font-weight:600; white-space:nowrap; text-align:center;">
      :
    </td>

    <td style="text-align:right; font-weight:600; white-space:nowrap;">
      ${fmtNormalAmt(B.openingCash)}
    </td>
  </tr>
</table>`;

  const transactionsHtml = showTransactions ? `<div class="tran-table">${itemSections}</div>` : '';

 const closingBalanceHtml = `

<table style="width:100%; margin:4px 0;" class="no-border">
  <tr>
    <td style="width:70%;"></td>

    <td style="font-weight:600; white-space:nowrap; text-align:right;">
      CB PURE
    </td>

    <td style="width:10px; font-weight:600; white-space:nowrap; text-align:center;">
      :
    </td>

    <td style="text-align:right; font-weight:600; white-space:nowrap;">
      ${fmtWt(B.closingPure)}
    </td>
  </tr>

  <tr>
    <td></td>

    <td style="font-weight:600; white-space:nowrap; text-align:right;">
      CBCASH
    </td>

    <td style="font-weight:600; white-space:nowrap; text-align:center;">
      :
    </td>

    <td style="text-align:right; font-weight:600; white-space:nowrap;">
      ${fmtNormalAmt(B.closingCash)}
    </td>
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
        <tr>
          <td style="font-weight:bold; width:30%; white-space:nowrap;">PARTY</td>
          <td style="width:5%; white-space:nowrap;">:</td>
          <td>${partyName}</td>
        </tr>
        <tr>
          <td style="font-weight:bold; white-space:nowrap;">REMARK</td>
          <td style="white-space:nowrap;">:</td>
          <td>${remark}</td>
        </tr>
        <tr>
          <td style="font-weight:bold; white-space:nowrap;">THRU</td>
          <td style="white-space:nowrap;">:</td>
          <td>${thru}</td>
        </tr>
      </table>
    </td>

    <td style="width:45%; vertical-align:top; text-align:left;">
      <table style="width:100%; font-size:10px; text-align:left;" class="no-border">
        <tr>
          <td style="font-weight:bold; width:30%; white-space:nowrap;">BILL NO</td>
          <td style="width:5%; white-space:nowrap;">:</td>
          <td>${H.BILLNO}</td>
        </tr>
        <tr>
          <td style="font-weight:bold; white-space:nowrap;">DATE</td>
          <td style="white-space:nowrap;">:</td>
          <td>${formatDate(H.TRANDATE)}</td>
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
  return `
@page {
  size: A6 portrait;
  margin: 4mm;
}

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

html, body{
  background:#fff;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}

.print-container{
  width:100%;
}

/* Remove page-break wrapper - allow natural flow */
.pr-thermal{
  font-family:'Roboto','Helvetica Neue',sans-serif;
  color:#000;
  background:#fff;
  width:100%;
  padding:4px;
  font-size:14px;
  line-height:1.4;
  /* Allow content to break naturally across pages */
  page-break-inside: auto;
}

/* Ensure tables break properly across pages */
.pr-thermal table {
  width:100%; 
  margin:4px 0;
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Allow table rows to break across pages if needed */
.pr-thermal table tr {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Keep totals together */
.pr-thermal table tr:last-child {
  page-break-after: auto;
}

.pr-thermal .co-name,
.pr-thermal .sec-title{
  text-align:center;
  font-size:12px;
  font-weight:bold;
  margin:4px 0 2px;
  page-break-after: avoid;
  break-after: avoid;
}

.pr-thermal .sec-title{
  font-size:10px;
  text-transform:uppercase;
}

.pr-thermal table.no-border { 
  width:100%; 
  border-collapse:collapse; 
  margin:2px 0;
}

.pr-thermal table.with-border { 
  width:100%; 
  border-collapse:collapse; 
  margin:4px 0; 
  border:1px solid #222;
}

.pr-thermal table th { 
  padding:2px; 
  font-size:10px; 
  font-weight:bold; 
}

.pr-thermal table td { 
  padding:2px; 
  font-size:10px; 
  vertical-align:top; 
}

.pr-thermal .tran-table { 
  margin: 10px 0px 10px 0px;
}

.pr-thermal .closing-table { 
  margin: 10px 0px;
}

/* Page break helpers - force break before major sections if needed */
.page-break-before {
  page-break-before: always;
  break-before: page;
}

/* Keep heading with its content */
h1, h2, h3, h4, .sec-title {
  page-break-after: avoid;
  break-after: avoid;
}
`;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PurchaseReceipt: React.FC<PurchaseReceiptProps> = (props) => {
  const { columnSize = "40", autoPrint = true, copies = 1, onAfterPrint } = props;
  const { data: softData } = useSoftControlById('RECEIPT_PRINT_LOGO');
  const is50 = columnSize === "50";
  const hasPrintedRef = useRef(false);

  const handlePrint = useCallback(() => {
    // Generate the receipt HTML
    const receiptHTML = buildThermalHTML(props, softData, is50);

    // If multiple copies requested, repeat the receipt
    const thermalHTML = copies > 1
      ? Array(copies).fill(`<div class="pr-thermal">${receiptHTML}</div>`).join('\n<div class="page-break-before"></div>\n')
      : `<div class="pr-thermal">${receiptHTML}</div>`;

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
        setTimeout(() => { iframe.remove(); onAfterPrint?.(); }, 300);
      }, 300);
    };
  }, [props, softData, is50, copies, onAfterPrint]);

  useEffect(() => {
    if (autoPrint && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      // Small delay to ensure everything is ready
      setTimeout(() => handlePrint(), 100);
    }
  }, [handlePrint, autoPrint]);

  return null;
};

export default PurchaseReceipt;