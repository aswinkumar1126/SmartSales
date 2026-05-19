"use client";

import React, { useMemo, useState, useRef } from "react";
import {
  Box,
  Button,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
  Field,
} from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";
import { useTheme } from "@/context/theme/themeContext";
import { usePurchaseSummary } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* =========================================================
   CONSTANTS
========================================================= */

const NUMERIC_COLUMNS = new Set([
  "PURCHASE",
  "PURCHASE_RETURN",
  "ISSUE",
  "RECEIPT",
  "CONVPURE",
  "DISC_AMT",
  "DISC_WT",
  "CASH_RCVD",
  "CASH_PAID",
  "BANK_RCVD",
  "BANK_PAID",
]);

// Preferred column order
const PREFERRED_ORDER = [
  "#",
  "TRANDATE",
  "ENTRYNO",
  "ACNAME",
  "PURCHASE",
  "PURCHASE_RETURN",
  "ISSUE",
  "RECEIPT",
  "CONVPURE",
  "DISC_AMT",
  "DISC_WT",
  "CASH_RCVD",
  "CASH_PAID",
  "BANK_RCVD",
  "BANK_PAID",
];

const getToday = () => new Date().toISOString().split("T")[0];

/* =========================================================
   HELPERS
========================================================= */

const formatLabel = (key: string) => {
  if (key === "#") return "#";
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatNumber = (value: any) => {
  // Check for null or undefined
  if (value === null || value === undefined) return null;
  
  const num = Number(value);
  
  // Check if it's a valid number
  if (isNaN(num)) return null;
  
  // Return 0 as null or as "0.000" based on your preference
  if (num === 0) return null; // or return "0.000" if you want to show zero
  
  // Return formatted number with 3 decimal places
  return num.toFixed(3);
};

const measureText = (t: string) => {
  const baseWidth = (t?.toString().length ?? 1) * 7.5;
  const extraSpace = 45; // More space for checkbox + handle
  return Math.min(300, Math.max(80, baseWidth + extraSpace));
};

const Z = {
  header: 40,
  headerSticky: 60,
  body: 10,
  bodySticky: 20,
};

// Exact colors from TranReport
const COLORS = {
  headerBg: "#2B6CB0",
  headerText: "#ffffff",
  subBg: "#BEE3F8",
  subText: "#1A365D",
  border: "#90CDF4",
  cellBg: "#EBF8FF",
  pinnedBg: "#dbeeff",
  rowAlt: "rgb(255, 255, 255)",
  totalBg: "#2B6CB0",
  totaltext: "#ffffff",
};

/* =========================================================
   TYPES
========================================================= */

interface PurchaseSummaryRow {
  TRANDATE: string;
  ENTRYNO: number;

  ACNAME: string;
  PURCHASE: number;
  PURCHASE_RETURN: number;
  ISSUE: number;
  RECEIPT: number;
  CONVPURE: number;
  DISC_MT: number;
  DISC_WT: number;
  CASH_RCVD: number;
  CASH_PAID: number;
  BANK_RCVD: number;
  BANK_PAID: number;
  [key: string]: string | number;
}

interface RowWithNumber extends PurchaseSummaryRow {
  "#": number;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PurchaseSummaryReport() {
  const { theme } = useTheme();
  const tableRef = useRef<HTMLTableElement>(null);

  const [fromDate, setFromDate] = useState(getToday());
  const [toDate, setToDate] = useState(getToday());
  const [showReport, setShowReport] = useState(false);

  const [stickyKeys, setStickyKeys] = useState<Set<string>>(new Set());
  const [colOrder, setColOrder] = useState<string[]>([]);
  const dragCol = useRef<number | null>(null);
  const dragOverCol = useRef<number | null>(null);

  const toggleSticky = (key: string) =>
    setStickyKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const {
    data = [],
    refetch,
    isFetching,
    isError,
  } = usePurchaseSummary({
    fromAge: undefined,
    toAge: undefined,
  });

  const rows = data as PurchaseSummaryRow[];

  const { cols, widthMap, tableData } = useMemo(() => {
    if (!rows || rows.length === 0)
      return {
        cols: [] as string[],
        widthMap: {} as Record<string, number>,
        tableData: [] as RowWithNumber[],
      };

    const rowsWithNumbers: RowWithNumber[] = rows.map((row, idx) => ({
      ...row,
      "#": idx + 1,
    }));

    const rawCols = Object.keys(rowsWithNumbers[0]);
    const preferred = PREFERRED_ORDER.filter((k) => rawCols.includes(k));
    const rest = rawCols.filter((k) => !PREFERRED_ORDER.includes(k) && k !== "#");
    const ordered = [...preferred, ...rest];

    const widthMap: Record<string, number> = {};
    ordered.forEach((k) => {
      const headerW = measureText(formatLabel(k));
      let maxValW = 50;
      
      if (k === "#") {
        maxValW = measureText(String(rows.length));
      } else {
        maxValW = Math.max(
          ...rowsWithNumbers.map((r) => measureText(String(r[k] ?? "-"))),
          50
        );
      }
      widthMap[k] = Math.max(headerW, maxValW) + 16;
    });

    setColOrder(ordered);

    return { cols: ordered, widthMap, tableData: rowsWithNumbers };
  }, [rows]);

  const activeCols = colOrder.length > 0 ? colOrder : cols;

  const stickyLeftMap = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    let offset = 0;
    activeCols.forEach((k) => {
      if (stickyKeys.has(k)) {
        map[k] = offset;
        offset += widthMap[k] || 80;
      } else {
        map[k] = undefined;
      }
    });
    return map;
  }, [activeCols, stickyKeys, widthMap]);

  const onDragStart = (index: number) => {
    dragCol.current = index;
  };

  const onDragEnter = (index: number) => {
    dragOverCol.current = index;
  };

  const onDragEnd = () => {
    if (dragCol.current === null || dragOverCol.current === null) return;
    if (dragCol.current === dragOverCol.current) return;

    const next = [...activeCols];
    const [moved] = next.splice(dragCol.current, 1);
    next.splice(dragOverCol.current, 0, moved);
    setColOrder(next);

    dragCol.current = null;
    dragOverCol.current = null;
    setStickyKeys(new Set());
  };

  const totals = useMemo(() => {
    const result: Record<string, number> = {};

    NUMERIC_COLUMNS.forEach((col) => {
      result[col] = rows.reduce(
        (sum, row) => sum + (parseFloat(String(row[col])) || 0),
        0
      );
    });

    return result;
  }, [rows]);

  const handleGetReport = async () => {
    if (!fromDate || !toDate) {
      alert("Please select both From Date and To Date");
      return;
    }
    const res = await refetch();
    const reportData = (res.data || []) as PurchaseSummaryRow[];
    setShowReport(reportData.length > 0);
    setStickyKeys(new Set());
    setColOrder([]);
  };

  const exportExcel = () => {
    const header = activeCols.map(formatLabel);

    const body = tableData.map((row) =>
      activeCols.map((col) => {
        if (col === "#") return row[col];
        if (NUMERIC_COLUMNS.has(col))
          return Number(row[col] || 0);
        return row[col] ?? "";
      })
    );

    const totalRow = activeCols.map((col, index) => {
      if (index === 0) return "TOTAL";
      if (NUMERIC_COLUMNS.has(col)) return totals[col];
      if (col === "#") return "";
      return "";
    });

    const ws = XLSX.utils.aoa_to_sheet([header, ...body, totalRow]);
    ws["!cols"] = activeCols.map((k) => ({
      wch: Math.ceil((widthMap[k] || 80) / 7),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Summary");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer]),
      `Purchase_Summary_${fromDate}_to_${toDate}.xlsx`
    );
  };

 const exportPDF = () => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const pW = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString();

  const bodyRows = tableData.map((row) =>
    activeCols.map((col) => {
      if (col === "#") return String(row[col]);
      if (NUMERIC_COLUMNS.has(col))
        return formatNumber(row[col]);
      return row[col] ?? "-";
    })
  );

  const totalRowData = activeCols.map((col, index) => {
    if (index === 0) return "TOTAL";
    if (NUMERIC_COLUMNS.has(col)) return formatNumber(totals[col]);
    if (col === "#") return "";
    return "";
  });

  autoTable(doc, {
    head: [activeCols.map(formatLabel)],
    body: [...bodyRows, totalRowData],
    startY: 22,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: "right",
      // Black borders with minimal stroke
      lineColor: [0, 0, 0],  // Black color
      lineWidth: 0.1,        // Minimal stroke
    },
    headStyles: {
      fillColor: [43, 108, 176],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      lineColor: [0, 0, 0],  // Black borders for header
      lineWidth: 0.1,        // Minimal stroke
    },
    bodyStyles: {
      halign: "right",
      lineColor: [0, 0, 0],  // Black borders for body
      lineWidth: 0.1,        // Minimal stroke
    },
    footStyles: {
      lineColor: [0, 0, 0],  // Black borders for footer
      lineWidth: 0.1,        // Minimal stroke
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
    margin: {
      top: 22,
      right: 8,
      bottom: 14,
      left: 8,
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const colKey = activeCols[data.column.index];
        
        if (!NUMERIC_COLUMNS.has(colKey) && colKey !== "#") {
          data.cell.styles.halign = "left";
        }
        
        if (colKey === "#") {
          data.cell.styles.halign = "center";
        }
      }
    },
    didDrawPage: (d) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        "Purchase Summary Report",
        pW / 2,
        11,
        { align: "center" }
      );
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${now}`, pW - 8, 8, { align: "right" });
      doc.setFontSize(8);
      doc.text(
        `Period: ${fromDate} to ${toDate}`,
        pW / 2,
        17,
        { align: "center" }
      );
    },
  });

  doc.save(`Purchase_Summary_${fromDate}_to_${toDate}.pdf`);
};

  return (
    <Box
      bg={theme.colors.formColor}
      p={3}
      rounded="xl"
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}
    >
      <VStack gap={4} align="stretch">
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.100"
          borderRadius="lg"
          px={4}
          py={3}
          boxShadow="0 1px 4px rgba(0,0,0,0.06)"
        >
          <VStack gap={3} align="stretch">
            <Text fontWeight={700} fontSize="14px" color="gray.700">
              Purchase Summary Report
            </Text>

            <HStack gap={3} flexWrap="wrap" align="flex-end">
              {/* <Field.Root width="auto" minW="150px">
                <Field.Label fontSize="11px" mb={1} color="gray.600">
                  From Date
                </Field.Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  size="sm"
                  height="32px"
                  fontSize="12px"
                  borderColor="gray.300"
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #4299e1",
                  }}
                />
              </Field.Root>

              <Field.Root width="auto" minW="150px">
                <Field.Label fontSize="11px" mb={1} color="gray.600">
                  To Date
                </Field.Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  size="sm"
                  height="32px"
                  fontSize="12px"
                  borderColor="gray.300"
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #4299e1",
                  }}
                />
              </Field.Root> */}

              <Button
                size="sm"
                onClick={handleGetReport}
                loading={isFetching}
                loadingText="Loading…"
                style={{
                  background: "linear-gradient(135deg,#2B6CB0 0%,#2C5282 100%)",
                  color: "#fff",
                  fontWeight: 600,
                  borderRadius: "6px",
                  fontSize: "12px",
                  padding: "0 16px",
                  height: "32px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(43,108,176,0.3)",
                }}
              >
                GET REPORT
              </Button>

              {showReport && rows.length > 0 && (
                <HStack gap="6px">
                  <button
                    onClick={exportExcel}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "linear-gradient(135deg,#276749 0%,#1C4532 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      padding: "0 12px",
                      height: "28px",
                      cursor: "pointer",
                      boxShadow: "0 2px 5px rgba(39,103,73,0.3)",
                    }}
                  >
                    <DownloadIcon style={{ fontSize: "10px", width: "16px" }} />
                    Export Excel
                  </button>
                  <button
                    onClick={exportPDF}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "linear-gradient(135deg,#C05621 0%,#9C4221 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      padding: "0 12px",
                      height: "28px",
                      cursor: "pointer",
                      boxShadow: "0 2px 5px rgba(192,86,33,0.3)",
                    }}
                  >
                    <DownloadIcon style={{ fontSize: "10px", width: "16px" }} />
                    Export PDF
                  </button>
                </HStack>
              )}
            </HStack>

            {showReport && rows.length > 0 && !isFetching && (
              <HStack gap={1} px={1} fontSize="10.5px" color="gray.400">
                <Box
                  w="10px"
                  h="10px"
                  bg="white"
                  border="1px solid"
                  borderColor="gray.400"
                  borderRadius="2px"
                />
                <Text>
                  Check the box in any column header to pin it | Drag columns
                  by the ⠿ handle to reorder
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>

        {isFetching && (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" color="blue.500" />
          </Box>
        )}

        {isError && (
          <Box
            p={4}
            bg="red.50"
            borderRadius="md"
            border="1px solid"
            borderColor="red.200"
          >
            <Text color="red.600">Error loading report.</Text>
          </Box>
        )}

        {showReport && rows.length > 0 && !isFetching && (
          <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            overflow="auto"
            maxH="650px"
            boxShadow="0 2px 8px rgba(0,0,0,0.06)"
          >
            <table
              ref={tableRef}
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead style={{ position: "sticky", top: 0, zIndex: Z.header }}>
                <tr>
                  {activeCols.map((col, colIdx) => {
                    const isSticky = stickyKeys.has(col);
                    const left = stickyLeftMap[col];
                    const w = widthMap[col] || 80;
                    const isDragOver = dragOverCol.current === colIdx;

                    return (
                      <th
                        key={col}
                        draggable
                        onDragStart={() => onDragStart(colIdx)}
                        onDragEnter={() => onDragEnter(colIdx)}
                        onDragEnd={onDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        style={{
                          backgroundColor: isDragOver
                            ? "#1565a7"
                            : isSticky
                            ? "#1A4F8A"
                            : COLORS.headerBg,
                          color: COLORS.headerText,
                          fontWeight: 700,
                          fontSize: "12px",
                          padding: "10px 14px",
                          borderBottom: `2px solid ${COLORS.border}`,
                          borderRight: `1px solid ${COLORS.border}`,
                          position: isSticky ? "sticky" : "relative",
                          left: isSticky ? `${left}px` : undefined,
                          zIndex: isSticky ? Z.headerSticky : Z.header,
                          width: `${w}px`,
                          minWidth: `${w}px`,
                          maxWidth: `${w}px`,
                          whiteSpace: "nowrap",
                          boxShadow: isSticky
                            ? "4px 0 8px rgba(0,0,0,0.18)"
                            : isDragOver
                            ? "inset 3px 0 0 #63b3ed"
                            : "none",
                          textAlign: col === "#" ? "center" : "right",
                          userSelect: "none",
                          cursor: "grab",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            justifyContent: col === "#" ? "center" : "flex-end",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSticky}
                            onChange={() => toggleSticky(col)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              cursor: "pointer",
                              margin: 0,
                              accentColor: "#fff",
                              width: "13px",
                              height: "13px",
                              flexShrink: 0,
                            }}
                            title="Pin column"
                          />
                          <span style={{ whiteSpace: "nowrap" }}>
                            {formatLabel(col)}
                          </span>
                          <span
                            style={{
                              opacity: 0.5,
                              fontSize: "10px",
                              cursor: "grab",
                            }}
                          >
                            ⠿
                          </span>
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {tableData.map((row, index) => (
                  <tr
                    key={index}
                    style={{
                      background: index % 2 === 0 ? COLORS.cellBg : COLORS.rowAlt,
                    }}
                  >
                    {activeCols.map((col) => {
                      const isSticky = stickyKeys.has(col);
                      const left = stickyLeftMap[col];
                      const w = widthMap[col] || 80;
                      const isNum = NUMERIC_COLUMNS.has(col);
                      const raw = row[col];
                      const display = col === "#" ? raw : (isNum ? formatNumber(raw) : raw ?? "-");
                      const numVal = isNum ? parseFloat(String(raw)) : null;

                      return (
                        <td
                          key={col}
                          style={{
                            textAlign: col === "#" ? "center" : (isNum ? "right" : "left"),
                            padding: "8px 12px",
                            fontSize: "12px",
                            backgroundColor: isSticky ? COLORS.pinnedBg : "inherit",
                            borderBottom: `1px solid ${COLORS.border}`,
                            borderRight: `1px solid ${COLORS.border}`,
                            position: isSticky ? "sticky" : "relative",
                            left: isSticky ? `${left}px` : undefined,
                            zIndex: isSticky ? Z.bodySticky : Z.body,
                            width: `${w}px`,
                            minWidth: `${w}px`,
                            maxWidth: `${w}px`,
                            whiteSpace: !isNum ? "nowrap" : "normal",
                            overflow: !isNum ? "hidden" : "visible",
                            textOverflow: !isNum ? "ellipsis" : "unset",
                            boxShadow: isSticky ? "4px 0 8px rgba(0,0,0,0.08)" : "none",
                            fontWeight: col === "#" ? 600 : "normal",
                            color: col === "#" ? "#1A365D" : "inherit",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: isNum && numVal !== 0 ? 500 : 400,
                              color: isNum && numVal === 0 ? "#a0aec0" : "inherit",
                              fontVariantNumeric: isNum ? "tabular-nums" : "normal",
                              fontFamily: isNum ? "'JetBrains Mono','Fira Code',monospace" : "inherit",
                              fontSize: isNum ? "11.5px" : "12px",
                            }}
                          >
                            {display}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr style={{ backgroundColor: COLORS.totalBg }}>
                  {activeCols.map((col, index) => {
                    const isSticky = stickyKeys.has(col);
                    const left = stickyLeftMap[col];
                    const w = widthMap[col] || 80;

                    return (
                      <td
                        key={col}
                        style={{
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          textAlign: col === "#" ? "center" : (NUMERIC_COLUMNS.has(col)
                            ? "right"
                            : index === 0
                            ? "left"
                            : "center"),
                          color: COLORS.totaltext,
                          borderTop: `2px solid ${COLORS.border}`,
                          borderRight: `1px solid ${COLORS.border}`,
                          backgroundColor: isSticky ? "#c7d2fe" : "inherit",
                          position: isSticky ? "sticky" : "relative",
                          left: isSticky ? `${left}px` : undefined,
                          zIndex: isSticky ? Z.bodySticky : Z.body,
                          width: `${w}px`,
                          minWidth: `${w}px`,
                          maxWidth: `${w}px`,
                          fontVariantNumeric: NUMERIC_COLUMNS.has(col) ? "tabular-nums" : "normal",
                          fontFamily: NUMERIC_COLUMNS.has(col) ? "'JetBrains Mono',monospace" : "inherit",
                        }}
                      >
                        {index === 0
                          ? "TOTAL"
                          : col === "#"
                          ? ""
                          : NUMERIC_COLUMNS.has(col)
                          ? formatNumber(totals[col])
                          : ""}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </Box>
        )}

        {showReport && rows.length === 0 && !isFetching && (
          <Box
            p={8}
            textAlign="center"
            bg="gray.50"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
          >
            <Text fontSize="13px" color="gray.500">
              No data found for the selected period.
            </Text>
          </Box>
        )}

        {!showReport && !isFetching && (
          <Box
            p={14}
            textAlign="center"
            bg="gray.50"
            borderRadius="xl"
            border="2px dashed"
            borderColor="gray.200"
          >
            <Text fontSize="28px" mb={3}>
              📊
            </Text>
            <Text fontSize="14px" color="gray.600" fontWeight={500} mb={1}>
              Select date range and click GET REPORT
            </Text>
            <Text fontSize="12px" color="gray.400">
              Pin columns with the checkbox | Drag columns by the ⠿ handle to reorder
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}