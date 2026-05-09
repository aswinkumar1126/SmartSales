"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Box,
  Button,
  VStack,
  Text,
  Spinner,
  HStack,
  Input,
  Field,
} from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";
import { useTheme } from "@/context/theme/themeContext";
import { useOutstandingStockReport } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { border } from "@chakra-ui/system";

/* ═══════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════ */

// Preferred column order
const PREFERRED_ORDER = [
  "ITEMNAME",
  "PCS",
  "GRSWT",
  "STNWT",
  "NETWT",
  "PUREWT",
  "STNAMT",
];

// Columns that are always text/info (left-align, no toFixed)
const INFO_KEYS = new Set(["ITEMNAME"]);

// Stage configuration for drill down (if needed)
const STAGE_LABEL: Record<number, string> = {
  1: "Outstanding Stock Report",
};

const Z = {
  header: 40,
  headerSticky: 60,
  body: 10,
  bodySticky: 20,
};

const COLORS = {
  headerBg: "#2B6CB0",
  headerText: "#ffffff",
  subBg: "#BEE3F8",
  subText: "#1A365D",
  border: "#90CDF4",
  cellBg: "#EBF8FF",
  pinnedBg: "#dbeeff",
  rowAlt: "rgba(43,108,176,0.04)",
  clickHover: "rgba(43,108,176,0.10)",
};

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */

const measureText = (t: string) =>
  Math.min(280, Math.max(60, (t?.toString().length ?? 1) * 8));

const fmtLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const isNumeric = (key: string, rows: Record<string, any>[]) => {
  if (INFO_KEYS.has(key)) return false;
  if (rows.length === 0) return false;
  return rows.slice(0, 8).every((r) => {
    const v = r[key];
    return v === null || v === undefined || v === "" || !isNaN(parseFloat(v));
  });
};

const fmtNum = (v: any) => {
  const n = parseFloat(v);
  console.log(v,'value')
  return isNaN(n) ? (v?? "-") : n >0 ? n.toFixed(3) :"-";
};

/* ═══════════════════════════════════════
   TYPES
═══════════════════════════════════════ */

interface RowData {
  [key: string]: any;
  _rowId?: number;
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */

function OutstandingReport() {
  const { theme } = useTheme();
  const tableRef = useRef<HTMLTableElement>(null);

  // ── Filter state ──────────────────────────────────────

  const [showReport, setShowReport] = useState(false);

  // ── Sticky columns ────────────────────────────────────
  const [stickyKeys, setStickyKeys] = useState<Set<string>>(new Set());

  // ── Drag state ────────────────────────────────────────
  const [colOrder, setColOrder] = useState<string[]>([]);
  const dragCol = useRef<number | null>(null);
  const dragOverCol = useRef<number | null>(null);

  const toggleSticky = (key: string) =>
    setStickyKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── API hook ──────────────────────────────────────────
  const { data: rawData, refetch, isFetching, isError } = useOutstandingStockReport();

  // Type assertion: ensure rawData is treated as array
  const reportData = (rawData as RowData[]) || [];

  // Auto-fetch when component mounts


  // ── Derived table meta ────────────────────────────────
  const { cols, numericSet, widthMap, tableData } = useMemo(() => {
    if (!reportData || reportData.length === 0)
      return {
        cols: [] as string[],
        numericSet: new Set<string>(),
        widthMap: {} as Record<string, number>,
        tableData: [] as RowData[],
      };

    const rawCols = Object.keys(reportData[0]);

    // Sort by PREFERRED_ORDER, rest appended as-is
    const preferred = PREFERRED_ORDER.filter((k) => rawCols.includes(k));
    const rest = rawCols.filter((k) => !PREFERRED_ORDER.includes(k));
    const ordered = [...preferred, ...rest];

    const numericSet = new Set(ordered.filter((k) => isNumeric(k, reportData)));

    const widthMap: Record<string, number> = {};
    ordered.forEach((k) => {
      const headerW = measureText(fmtLabel(k));
      const maxValW = Math.max(
        ...reportData.map((r: RowData) => measureText(String(r[k] ?? "-"))),
        50
      );
      widthMap[k] = Math.max(headerW, maxValW) + 16;
    });

    const tableData: RowData[] = reportData.map((r: RowData, i: number) => ({
      ...r,
      _rowId: i,
    }));

    // Seed colOrder only when cols change (new fetch)
    setColOrder(ordered);

    return { cols: ordered, numericSet, widthMap, tableData };
  }, [reportData]);

  // Always use colOrder for rendering (drag updates this)
  const activeCols = colOrder.length > 0 ? colOrder : cols;

  // ── Sticky left offset map ────────────────────────────
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

  // ── Drag handlers ─────────────────────────────────────
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
    setStickyKeys(new Set()); // reset sticky since positions changed
  };

  // ── Fetch trigger ─────────────────────────────────────
  const fetchReport = async () => {
    setStickyKeys(new Set());
    setColOrder([]);

    const res = await refetch();
    const data = res?.data as RowData[];
    setShowReport(!!(data && data.length > 0));
  };

  // ── Get Report Button ──
  const handleGetReport = () => {

    fetchReport();
  };

  // ── Summary totals ────────────────────────────────────
  const totals = useMemo(() => {
    if (!tableData.length) return {} as Record<string, number>;
    const sums: Record<string, number> = {};
    activeCols
      .filter((k) => numericSet.has(k))
      .forEach((k) => {
        sums[k] = tableData.reduce(
          (acc: number, r: RowData) => acc + (parseFloat(r[k]) || 0),
          0
        );
      });
    return sums;
  }, [tableData, activeCols, numericSet]);

  // ── PDF export ────────────────────────────────────────

  // ── PDF export with column-wise borders ────────────────────────────────────────
// ── PDF export with simple black borders ────────────────────────────────────────
const exportPDF = () => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pW = doc.internal.pageSize.getWidth();
  const pH = doc.internal.pageSize.getHeight();
  const now = new Date().toLocaleString();

  autoTable(doc, {
    head: [activeCols.map(fmtLabel)],
    body: tableData.map((row: RowData) =>
      activeCols.map((k) =>
        numericSet.has(k) ? fmtNum(row[k]) : row[k] ?? "-"
      )
    ),
    startY: 22,
    styles: { 
      fontSize: 7, 
      cellPadding: 2, 
      halign: "right",
      lineWidth: 0.1,      // Simple black border width
      lineColor: [0, 0, 0], // Simple black color
    },
    headStyles: {
      fillColor: [43, 108, 176],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.1,      // Black border for header
      lineColor: [0, 0, 0],
    },
    bodyStyles: { 
      fontSize: 7, 
      halign: "right",
      lineWidth: 0.1,      // Black border for body
      lineColor: [0, 0, 0],
    },
    alternateRowStyles: { 
      fillColor: [240, 248, 255],
      lineWidth: 0.1,      // Black border for alternate rows
      lineColor: [0, 0, 0],
    },
    margin: { top: 22, right: 8, bottom: 14, left: 8 },
    
    didParseCell: (data) => {
      const { section, cell } = data;
      
      if (section === "body") {
        cell.styles.halign = "right";
      }
      
      // Ensure all cells have black borders
      cell.styles.lineWidth = 0.1;
      cell.styles.lineColor = [0, 0, 0];
    },
    
    didDrawPage: (d) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Outstanding Stock Report", pW / 2, 11, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${now}`, pW - 8, 8, { align: "right" });
      doc.text(`Page ${d.pageNumber}`, pW / 2, pH - 5, { align: "center" });
      doc.setFontSize(8);
        },
  });

  doc.save(`Outstanding_Report_${new Date().toISOString().split("T")[0]}.pdf`);
};
  // ── Excel export ──────────────────────────────────────
  const exportExcel = () => {
    const header = activeCols.map(fmtLabel);
    const rows = tableData.map((row: RowData) =>
      activeCols.map((k) =>
        numericSet.has(k)
          ? isNaN(parseFloat(row[k]))
            ? row[k] ?? ""
            : parseFloat(parseFloat(row[k]).toFixed(3))
          : row[k] ?? ""
      )
    );

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws["!cols"] = activeCols.map((k) => ({
      wch: Math.ceil((widthMap[k] || 80) / 7),
    }));

    // Style header row (center aligned)
    activeCols.forEach((_, ci) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c: ci });
      if (ws[ref]) {
        ws[ref].s = {
          fill: { patternType: "solid", fgColor: { rgb: "2B6CB0" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    });

    // Style all data rows to be right-aligned
    for (let ri = 1; ri <= tableData.length; ri++) {
      activeCols.forEach((_, ci) => {
        const ref = XLSX.utils.encode_cell({ r: ri, c: ci });
        if (ws[ref]) {
          ws[ref].s = {
            alignment: { horizontal: "right", vertical: "center" },
          };
        }
      });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Outstanding Report");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
      `Outstanding_Report_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <Box
      bg={theme.colors.formColor}
      p={3}
      rounded="xl"
      style={{ fontFamily: "'Arial','times new roman'" }}
    >
      <VStack gap={4} align="stretch">
        {/* ── Control Bar ── */}
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
            <Text fontWeight={700} fontSize="13px" color="gray.700">
              Outstanding Stock Report
            </Text>

            <HStack gap={3} flexWrap="wrap" align="flex-end">
              {/* From Date */}
            

              {/* Buttons */}
              <HStack gap={2}>
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
              </HStack>
            </HStack>

            {/* Export buttons - show after report is loaded */}
            {showReport && tableData.length > 0 && !isFetching && (
              <HStack gap="6px" justify="flex-end">
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
          </VStack>
        </Box>

        {/* ── Pin hint ── */}
        {showReport && tableData.length > 0 && !isFetching && (
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
              Check the box in any column header to pin it | Drag columns by the ⠿
              handle to reorder
            </Text>
          </HStack>
        )}

        {/* ── Spinner ── */}
        {isFetching && (
          <Box p={8} textAlign="center">
            <Spinner size="xl" color="blue.500" />
            <Text mt={3} fontSize="13px" color="gray.500">
              Loading…
            </Text>
          </Box>
        )}

        {/* ── Error ── */}
        {isError && showReport && (
          <Box
            p={6}
            textAlign="center"
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="md"
          >
            <Text color="red.600" mb={3} fontSize="13px">
              Error loading data
            </Text>
            <Button size="xs" onClick={() => refetch()}>
              Retry
            </Button>
          </Box>
        )}

        {/* ── Table ── */}
        {showReport && tableData.length > 0 && !isFetching && (
          <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            overflow="auto"
            maxH="600px"
            boxShadow="0 2px 8px rgba(0,0,0,0.06)"
          >
            <table
              ref={tableRef}
              style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}
            >
              {/* ── Table Head ── */}
              <thead style={{ position: "sticky", top: 0, zIndex: Z.header }}>
                <tr>
                  {activeCols.map((k, colIdx) => {
                    const isSticky = stickyKeys.has(k);
                    const left = stickyLeftMap[k];
                    const w = widthMap[k] || 80;
                    const isDragOver = dragOverCol.current === colIdx;

                    return (
                      <th
                        key={k}
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
                          fontSize: "11px",
                          padding: "8px 10px",
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
                          textAlign: "right",
                          userSelect: "none",
                          cursor: "grab",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            width: "100%",
                            justifyContent: "flex-end",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSticky}
                            onChange={() => toggleSticky(k)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              cursor: "pointer",
                              margin: 0,
                              accentColor: "#fff",
                              width: "12px",
                              height: "12px",
                              flexShrink: 0,
                            }}
                            title="Pin column"
                          />
                          {fmtLabel(k)}
                          <span style={{ opacity: 0.5, fontSize: "9px", cursor: "grab" }}>
                            ⠿
                          </span>
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* ── Table Body ── */}
              <tbody>
                {tableData.map((row: RowData, ri: number) => (
                  <tr
                    key={row._rowId}
                    style={{
                      backgroundColor: ri % 2 === 0 ? undefined : COLORS.rowAlt,
                    }}
                  >
                    {activeCols.map((k) => {
                      const isSticky = stickyKeys.has(k);
                      const left = stickyLeftMap[k];
                      const w = widthMap[k] || 80;
                      const isNum = numericSet.has(k);
                      const raw = row[k];
                      const display = isNum ? fmtNum(raw) : raw ?? "-";
                      const numVal = isNum ? parseFloat(raw) : null;

                      return (
                        <td
                          key={k}
                          style={{
                            textAlign: isNum ? "right" : "left",
                            padding: "6px 10px",
                            fontSize: "11.5px",
                            backgroundColor: isSticky ? COLORS.pinnedBg : COLORS.cellBg,
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
                          }}
                        >
                          <span
                            style={{
                              fontWeight: isNum && numVal !== 0 ? 500 : 400,
                              color: isNum && numVal === 0 ? "#a0aec0" : "inherit",
                              fontVariantNumeric: isNum ? "tabular-nums" : "normal",
                              fontFamily: isNum
                                ? "'Arial','times new roman'"
                                : "inherit",
                              fontSize: isNum ? "11px" : "inherit",
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

              {/* ── Totals Row ── */}
              {Object.keys(totals).length > 0 && (
                <tfoot>
                  <tr style={{ backgroundColor: COLORS.subBg }}>
                    {activeCols.map((k, i) => {
                      const isSticky = stickyKeys.has(k);
                      const left = stickyLeftMap[k];
                      const w = widthMap[k] || 80;

                      return (
                        <td
                          key={k}
                          style={{
                            padding: "7px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                            textAlign: numericSet.has(k)
                              ? "right"
                              : i === 0
                              ? "left"
                              : "center",
                            color: COLORS.subText,
                            borderTop: `2px solid ${COLORS.border}`,
                            borderRight: `1px solid ${COLORS.border}`,
                            backgroundColor: isSticky ? "#a8d5f5" : COLORS.subBg,
                            position: isSticky ? "sticky" : "relative",
                            left: isSticky ? `${left}px` : undefined,
                            zIndex: isSticky ? Z.bodySticky : Z.body,
                            width: `${w}px`,
                            minWidth: `${w}px`,
                            maxWidth: `${w}px`,
                            fontVariantNumeric: numericSet.has(k)
                              ? "tabular-nums"
                              : "normal",
                            fontFamily: numericSet.has(k)
                              ? "'Arial','times new roman'"
                              : "inherit",
                          }}
                        >
                          {numericSet.has(k)
                            ? totals[k].toFixed(3)
                            : i === 0
                            ? "TOTAL"
                            : ""}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </Box>
        )}

        {/* ── Empty ── */}
        {showReport && tableData.length === 0 && !isFetching && (
          <Box
            p={8}
            textAlign="center"
            bg="gray.50"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
          >
            <Text fontSize="13px" color="gray.500">
              No data found for the selected period
            </Text>
          </Box>
        )}

        {/* ── Initial state ── */}
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
              Select date range and click "GET REPORT"
            </Text>
            <Text fontSize="12px" color="gray.400">
              View outstanding stock report with pin columns and reorder functionality
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

export default OutstandingReport;