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
import { useAgeReport } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ═══════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════ */

const Z = {
  header: 40,
  headerSticky: 60,
  body: 10,
  bodySticky: 20,
};

const COLORS = {
  headerBg:    "#2B6CB0",
  headerText:  "#ffffff",
  subBg:       "#BEE3F8",
  subText:     "#1A365D",
  border:      "#90CDF4",
  cellBg:      "#EBF8FF",
  pinnedBg:    "#dbeeff",
  rowAlt:      "rgba(43,108,176,0.04)",
};

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */

// Calculate pixel width of text (approx 7px per character for normal text, 8px for bold)
const getTextWidth = (text: string, isHeader: boolean = false): number => {
  if (!text || text === "-") return 60;
  const charWidth = isHeader ? 8 : 7;
  const padding = isHeader ? 32 : 24;
  return Math.min(400, Math.max(60, text.toString().length * charWidth + padding));
};

// Format label - preserve original format, don't split by underscore
const formatLabel = (key: string): string => {
  return key;
};

// Check if value is numeric
const isNumeric = (value: any): boolean => {
  if (value === null || value === undefined || value === "") return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
};

// Format value - NO .toFixed, return as-is
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === 'number') {
    // For numbers, convert to string without forcing decimal places
    return value.toString();
  }
  return value.toString();
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

function AgeReport() {
  const { theme } = useTheme();
  const tableRef = useRef<HTMLTableElement>(null);

  // ── Filter state ──────────────────────────────────────
  const [fromAge, setFromAge] = useState<string>("");
  const [toAge, setToAge] = useState<string>("");
  const [showReport, setShowReport] = useState(false);

  // ── Sticky columns ────────────────────────────────────
  const [stickyKeys, setStickyKeys] = useState<Set<string>>(new Set());

  // ── Column order state ────────────────────────────────
  const [colOrder, setColOrder] = useState<string[]>([]);
  const dragCol = useRef<number | null>(null);
  const dragOverCol = useRef<number | null>(null);

  const toggleSticky = (key: string) =>
    setStickyKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── API hook ──
  const { data: rawData, refetch, isFetching, isError } = useAgeReport({
    fromAge: fromAge ? parseInt(fromAge) : undefined,
    toAge: toAge ? parseInt(toAge) : undefined,
  });

  const reportData = (rawData as RowData[]) || [];

  // ── Calculate column widths based on max content ─────
  const { cols, widthMap, tableData } = useMemo(() => {
    if (!reportData || reportData.length === 0) {
      return { cols: [] as string[], widthMap: {} as Record<string, number>, tableData: [] as RowData[] };
    }

    const rawCols = Object.keys(reportData[0]);
    
    // Calculate widths for each column
    const widthMap: Record<string, number> = {};
    
    rawCols.forEach((col) => {
      // Get header width
      const headerWidth = getTextWidth(formatLabel(col), true);
      
      // Get max value width from all rows
      let maxValueWidth = headerWidth;
      reportData.forEach((row: RowData) => {
        const value = row[col];
        const valueStr = formatValue(value);
        const valueWidth = getTextWidth(valueStr, false);
        if (valueWidth > maxValueWidth) {
          maxValueWidth = valueWidth;
        }
      });
      
      // Add extra padding
      widthMap[col] = maxValueWidth + 16;
    });

    const tableData: RowData[] = reportData.map((r: RowData, i: number) => ({ ...r, _rowId: i }));
    
    // Set initial column order
    if (colOrder.length === 0) {
      setColOrder(rawCols);
    }

    return { cols: rawCols, widthMap, tableData };
  }, [reportData]);

  // Always use colOrder for rendering
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
  };

  // ── Fetch trigger ─────────────────────────────────────
  const fetchReport = async () => {
    if (!fromAge || !toAge) {
      alert("Please enter both From Age and To Age");
      return;
    }
    
    const fromAgeNum = parseInt(fromAge);
    const toAgeNum = parseInt(toAge);
    
    if (isNaN(fromAgeNum) || isNaN(toAgeNum)) {
      alert("Please enter valid numbers for age");
      return;
    }
    
    if (fromAgeNum > toAgeNum) {
      alert("From Age cannot be greater than To Age");
      return;
    }
    
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

  // ── PDF export ────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pW = doc.internal.pageSize.getWidth();
    const pH = doc.internal.pageSize.getHeight();
    const now = new Date().toLocaleString();

    const headers = activeCols.map(formatLabel);
    const body = tableData.map((row: RowData) =>
      activeCols.map((k) => {
        const val = row[k];
        return val !== undefined && val !== null ? val.toString() : "-";
      })
    );

    // Calculate column widths in mm (approx 0.26mm per pixel)
    const colWidths = activeCols.map((k) => Math.min(60, Math.max(15, (widthMap[k] || 80) * 0.26)));

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 22,
      styles: {
        fontSize: 8,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        valign: "middle",
        overflow: "linebreak",
      },
      headStyles: {
        fontStyle: "bold",
        halign: "center",
        fillColor: [43, 108, 176],
        textColor: [255, 255, 255],
      },
      bodyStyles: {
        halign: "left",
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { top: 22, right: 8, bottom: 14, left: 8 },
      columnStyles: colWidths.reduce((acc, width, idx) => {
        acc[idx] = { cellWidth: width };
        return acc;
      }, {} as Record<number, any>),
      didDrawPage: (d) => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Age Report", pW / 2, 11, { align: "center" });
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated: ${now}`, pW - 8, 8, { align: "right" });
        doc.text(`Age Range: ${fromAge} to ${toAge}`, pW / 2, 17, { align: "center" });
        doc.text(`Page ${d.pageNumber}`, pW / 2, pH - 5, { align: "center" });
      },
    });

    doc.save(`AgeReport_${fromAge}_to_${toAge}.pdf`);
  };

  // ── Excel export ──────────────────────────────────────
  const exportExcel = () => {
    const headers = activeCols.map(formatLabel);
    const rows = tableData.map((row: RowData) =>
      activeCols.map((k) => {
        const val = row[k];
        return val !== undefined && val !== null ? val : "";
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Set column widths based on calculated pixel widths
    ws["!cols"] = activeCols.map((k) => ({ 
      wch: Math.min(50, Math.max(10, Math.ceil((widthMap[k] || 80) / 7))) 
    }));

    // Style header row
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

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Age Report");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
      `AgeReport_${fromAge}_to_${toAge}.xlsx`
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
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}
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
              Age Report
            </Text>

            <HStack gap={3} flexWrap="wrap" align="flex-end">
              <Field.Root width="auto" minW="150px">
                <Field.Label fontSize="11px" mb={1} color="gray.600">From Age</Field.Label>
                <Input
                  type="number"
                  value={fromAge}
                  onChange={(e) => setFromAge(e.target.value)}
                  size="sm"
                  height="32px"
                  fontSize="12px"
                  borderColor="gray.300"
                  placeholder="Min Age"
                />
              </Field.Root>

              <Field.Root width="auto" minW="150px">
                <Field.Label fontSize="11px" mb={1} color="gray.600">To Age</Field.Label>
                <Input
                  type="number"
                  value={toAge}
                  onChange={(e) => setToAge(e.target.value)}
                  size="sm"
                  height="32px"
                  fontSize="12px"
                  borderColor="gray.300"
                  placeholder="Max Age"
                />
              </Field.Root>

              <Button
                size="sm"
                onClick={handleGetReport}
                loading={isFetching}
                loadingText="Loading…"
                colorScheme="blue"
              >
                GET REPORT
              </Button>

              {showReport && tableData.length > 0 && !isFetching && (
                <>
                  <Button
                    size="sm"

                    onClick={exportExcel}
                    colorScheme="green"
                    variant="outline"
                  > <DownloadIcon/>
                    Excel
                  </Button>
                  <Button
                    size="sm"
                    
                    onClick={exportPDF}
                    colorScheme="orange"
                    variant="outline"
                  ><DownloadIcon />
                    PDF
                  </Button>
                </>
              )}
            </HStack>
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
            <Text>☑ Pin column | Drag ⠿ to reorder</Text>
          </HStack>
        )}

        {/* ── Spinner ── */}
        {isFetching && (
          <Box p={8} textAlign="center">
            <Spinner size="xl" color="blue.500" />
            <Text mt={3} fontSize="13px" color="gray.500">Loading…</Text>
          </Box>
        )}

        {/* ── Error ── */}
        {isError && showReport && (
          <Box p={6} textAlign="center" bg="red.50" borderRadius="md">
            <Text color="red.600" mb={3}>Error loading data</Text>
            <Button size="xs" onClick={() => refetch()}>Retry</Button>
          </Box>
        )}

        {/* ── Table ── */}
        {showReport && tableData.length > 0 && !isFetching && (
          <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            overflowX="auto"
            overflowY="auto"
            maxH="600px"
          >
            <table
              ref={tableRef}
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                minWidth: "100%",
              }}
            >
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
                          backgroundColor: isDragOver ? "#1565a7" : isSticky ? "#1A4F8A" : COLORS.headerBg,
                          color: COLORS.headerText,
                          fontWeight: 700,
                          fontSize: "11px",
                          padding: "8px 12px",
                          borderBottom: `2px solid ${COLORS.border}`,
                          borderRight: `1px solid ${COLORS.border}`,
                          position: isSticky ? "sticky" : "relative",
                          left: isSticky ? `${left}px` : undefined,
                          zIndex: isSticky ? Z.headerSticky : Z.header,
                          width: `${w}px`,
                          minWidth: `${w}px`,
                          maxWidth: `${w}px`,
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          boxShadow: isSticky ? "2px 0 4px rgba(0,0,0,0.1)" : "none",
                          textAlign: "left",
                          userSelect: "none",
                          cursor: "grab",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
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
                          {formatLabel(k)}
                          <span style={{ opacity: 0.5, fontSize: "10px", cursor: "grab" }}>⠿</span>
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
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
                      const rawValue = row[k];
                      const display = formatValue(rawValue);

                      return (
                        <td
                          key={k}
                          style={{
                            textAlign: "left",
                            padding: "6px 12px",
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
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            boxShadow: isSticky ? "2px 0 4px rgba(0,0,0,0.08)" : "none",
                          }}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}

        {/* ── Empty States ── */}
        {showReport && tableData.length === 0 && !isFetching && (
          <Box p={8} textAlign="center" bg="gray.50" borderRadius="md">
            <Text fontSize="13px" color="gray.500">
              No data found for the selected age range
            </Text>
          </Box>
        )}

        {!showReport && !isFetching && (
          <Box p={14} textAlign="center" bg="gray.50" borderRadius="xl" border="2px dashed" borderColor="gray.200">
            <Text fontSize="28px" mb={3}>📊</Text>
            <Text fontSize="14px" color="gray.600" fontWeight={500} mb={1}>
              Enter From Age and To Age, then click "GET REPORT"
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

export default AgeReport;