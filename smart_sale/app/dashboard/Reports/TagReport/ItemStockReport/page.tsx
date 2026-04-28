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
  Separator,
  Popover,
  Portal,
} from "@chakra-ui/react";
import { SettingsIcon, DownloadIcon } from "@chakra-ui/icons";

import { useTheme } from "@/context/theme/themeContext";
import { useItemStockReport } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ==================== TYPES ==================== */

interface GroupColors {
  bg: string;
  color: string;
  subBg: string;
  subColor: string;
  border: string;
  cellBg: string;
  pdfHeaderRgb: [number, number, number];
  pdfSubRgb: [number, number, number];
  pdfCellRgb: [number, number, number];
  xlsHeaderHex: string;
  xlsSubHex: string;
  xlsCellHex: string;
}

interface StickyGroups {
  [key: string]: boolean;
}

interface HeaderType {
  key: string;
  label: string;
  align: "center" | "left" | "right";
}

interface SubHeaderType {
  key: string;
  label: string;
  headerKey: string;
  align: "center" | "left" | "right";
}

interface StockReportData {
  [key: string]: any;
}

/* ==================== CONSTANTS ==================== */

const INFO_COLUMNS = new Set([
  "ITEMID",
  "ITEMNAME",
  "METALID",
  "METALNAME",
  "STOCKTYPE",
  "SRC",
  "PUREID",
  "PUREGOLDNAME",
]);

const groupColors: Record<string, GroupColors> = {
  ITEM: {
    bg: "#2B6CB0",
    color: "#ffffff",
    subBg: "#BEE3F8",
    subColor: "#1A365D",
    border: "#90CDF4",
    cellBg: "#EBF8FF",
    pdfHeaderRgb: [43, 108, 176],
    pdfSubRgb: [190, 227, 248],
    pdfCellRgb: [235, 248, 255],
    xlsHeaderHex: "2B6CB0",
    xlsSubHex: "BEE3F8",
    xlsCellHex: "EBF8FF",
  },
  OTHER: {
    bg: "#2D3748",
    color: "#ffffff",
    subBg: "#E2E8F0",
    subColor: "#1A202C",
    border: "#CBD5E0",
    cellBg: "#F7FAFC",
    pdfHeaderRgb: [45, 55, 72],
    pdfSubRgb: [226, 232, 240],
    pdfCellRgb: [247, 250, 252],
    xlsHeaderHex: "2D3748",
    xlsSubHex: "E2E8F0",
    xlsCellHex: "F7FAFC",
  },
  OP: {
    bg: "#276749",
    color: "#ffffff",
    subBg: "#C6F6D5",
    subColor: "#1C4532",
    border: "#9AE6B4",
    cellBg: "#F0FFF4",
    pdfHeaderRgb: [39, 103, 73],
    pdfSubRgb: [198, 246, 213],
    pdfCellRgb: [240, 255, 244],
    xlsHeaderHex: "276749",
    xlsSubHex: "C6F6D5",
    xlsCellHex: "F0FFF4",
  },
  RE: {
    bg: "#553C9A",
    color: "#ffffff",
    subBg: "#E9D8FD",
    subColor: "#322659",
    border: "#D6BCFA",
    cellBg: "#FAF5FF",
    pdfHeaderRgb: [85, 60, 154],
    pdfSubRgb: [233, 216, 253],
    pdfCellRgb: [250, 245, 255],
    xlsHeaderHex: "553C9A",
    xlsSubHex: "E9D8FD",
    xlsCellHex: "FAF5FF",
  },
  IS: {
    bg: "#C05621",
    color: "#ffffff",
    subBg: "#FEEBC8",
    subColor: "#7B341E",
    border: "#FBD38D",
    cellBg: "#FFFAF0",
    pdfHeaderRgb: [192, 86, 33],
    pdfSubRgb: [254, 235, 200],
    pdfCellRgb: [255, 250, 240],
    xlsHeaderHex: "C05621",
    xlsSubHex: "FEEBC8",
    xlsCellHex: "FFFAF0",
  },
  CL: {
    bg: "#285E61",
    color: "#ffffff",
    subBg: "#B2F5EA",
    subColor: "#1D4044",
    border: "#81E6D9",
    cellBg: "#E6FFFA",
    pdfHeaderRgb: [40, 94, 97],
    pdfSubRgb: [178, 245, 234],
    pdfCellRgb: [230, 255, 250],
    xlsHeaderHex: "285E61",
    xlsSubHex: "B2F5EA",
    xlsCellHex: "E6FFFA",
  },
};

const groupLabels: Record<string, string> = {
  ITEM: "Item Information",
  OP: "Opening Balance",
  RE: "Received",
  IS: "Issued",
  CL: "Closing Balance",
  OTHER: "Details",
};

/* ==================== HELPER FUNCTIONS ==================== */

// Helper to measure text width roughly in pixels
const measureTextWidth = (text: string): number => {
  if (!text) return 50;
  // Approximate: each character ~8px, with a max of 400px
  return Math.min(400, text.length * 8);
};

const formatColumnLabel = (key: string): string => {
  const withoutPrefix = key.replace(/^(OP_|CL_|IS_|RE_)/, "");
  return withoutPrefix
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const getInfoLabel = (col: string): string => {
  const labels: Record<string, string> = {
    ITEMID: "Item ID",
    ITEMNAME: "Item Name",
    PUREID: "Pure ID",
    PUREGOLDNAME: "Pure Gold Name",
    METALID: "Metal ID",
    METALNAME: "Metal",
    STOCKTYPE: "Stock Type",
    SRC: "Source",
  };
  return labels[col] ?? col;
};

const formatStockType = (value: any): string => {
  if (value === "T") return "Tagged";
  if (value === "N") return "Non Tagged";
  return value ?? "-";
};

const groupColumnsByPrefix = (columns: string[]): Record<string, string[]> => {
  const groups: Record<string, string[]> = {
    ITEM: [],
    OP: [],
    IS: [],
    RE: [],
    CL: [],
    OTHER: [],
  };
  columns.forEach((col) => {
    if (col.startsWith("OP_")) groups["OP"].push(col);
    else if (col.startsWith("IS_")) groups["IS"].push(col);
    else if (col.startsWith("RE_")) groups["RE"].push(col);
    else if (col.startsWith("CL_")) groups["CL"].push(col);
    else if (col === "ITEMID" || col === "ITEMNAME") groups["ITEM"].push(col);
    else if (INFO_COLUMNS.has(col)) groups["OTHER"].push(col);
  });
  return groups;
};

/* ==================== CHECKBOX DROPDOWN ==================== */

interface CheckboxDropdownProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
}

const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({
  label,
  options,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (item: string) => {
    onChange(
      value.includes(item) ? value.filter((v) => v !== item) : [...value, item]
    );
  };

  const toggleAll = () => {
    onChange(value.length === options.length ? [] : [...options]);
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Popover.Trigger asChild>
        <Button size="xs" variant="outline">
          {label}
          <SettingsIcon style={{ marginLeft: "8px" }} />
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content width="220px" zIndex={9999}>
            <Popover.Body p={2}>
              <VStack align="stretch" gap={2}>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={toggleAll}
                  fontWeight="medium"
                >
                  {value.length === options.length ? "Deselect All" : "Select All"}
                </Button>
                <Separator />
                <Box maxH="200px" overflowY="auto">
                  <VStack align="start" gap={1}>
                    {options.map((opt) => (
                      <label
                        key={opt}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={value.includes(opt)}
                          onChange={() => toggle(opt)}
                          style={{ cursor: "pointer" }}
                        />
                        {opt}
                      </label>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

/* ==================== STICKY CHECKBOX ==================== */

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    style={{
      cursor: "pointer",
      margin: 0,
      marginLeft: "6px",
      accentColor: "#fff",
      width: "13px",
      height: "13px",
    }}
    title="Pin this group"
  />
);

/* ==================== Z-INDEX CONSTANTS ==================== */
const Z = {
  mainHeader: 40,
  mainHeaderSticky: 60,
  subHeader: 30,
  subHeaderSticky: 50,
  bodyCell: 10,
  bodyCellSticky: 20,
};

/* ==================== MAIN COMPONENT ==================== */

function StockReport() {
  const { theme } = useTheme();
  const tableRef = useRef<HTMLTableElement>(null);

  const [asOnDate, setAsOnDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "GRSWT",
    "NETWT",
    "STNWT",
  ]);
  const [selectedGroupBy, setSelectedGroupBy] = useState<string[]>([
    "ITEMID",
    "ITEMNAME",
  ]);
  const [showReport, setShowReport] = useState(false);
  const [stickyGroups, setStickyGroups] = useState<StickyGroups>({});

  const {
    data: reportData,
    refetch,
    isFetching,
    isError,
  } = useItemStockReport({
    date: asOnDate,
    columns: selectedColumns,
    groupBy: selectedGroupBy,
  });

  const columnOptions = ["PCS", "GRSWT", "NETWT", "STNWT", "PUREWT"];
  const groupByOptions = ["STOCKTYPE", "METALNAME", "SRC"];

  const handleGetReport = async () => {
    const res = await refetch();
    setShowReport(!!(res?.data && res.data.length > 0));
    setStickyGroups({});
  };

  const toggleStickyGroup = (groupKey: string) => {
    setStickyGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  /* ---- Build headers, subHeaders, tableData and column widths ---- */
  const { headers, subHeaders, tableData, columnWidthMap } = useMemo(() => {
    if (!reportData || reportData.length === 0) {
      return {
        headers: [] as HeaderType[],
        subHeaders: [] as SubHeaderType[],
        tableData: [] as StockReportData[],
        columnWidthMap: {} as Record<string, number>,
      };
    }

    const allColumns = Object.keys(reportData[0]);
    const columnsToShow: string[] = [];

    ["ITEMID", "ITEMNAME"].forEach((c) => {
      if (allColumns.includes(c)) columnsToShow.push(c);
    });
    ["PUREID", "PUREGOLDNAME", "METALID", "METALNAME", "STOCKTYPE", "SRC"].forEach(
      (c) => {
        if (allColumns.includes(c)) columnsToShow.push(c);
      }
    );
    selectedColumns.forEach((sel) => {
      allColumns.filter((c) => c.endsWith(`_${sel}`)).forEach((c) => columnsToShow.push(c));
    });

    const unique = [...new Set(columnsToShow)];
    const grouped = groupColumnsByPrefix(unique);

    const colOrder = ["PCS", "GRSWT", "NETWT", "PUREWT", "STNWT"];
    const generatedHeaders: HeaderType[] = [];
    const generatedSubHeaders: SubHeaderType[] = [];

    const addGroup = (key: string) => {
      const cols = grouped[key];
      if (!cols || cols.length === 0) return;

      generatedHeaders.push({ key, label: groupLabels[key], align: "center" });

      const sorted =
        key === "ITEM" || key === "OTHER"
          ? cols
          : [...cols].sort((a, b) => {
              const aT = a.split("_").slice(1).join("_");
              const bT = b.split("_").slice(1).join("_");
              return (
                (colOrder.indexOf(aT) === -1 ? 99 : colOrder.indexOf(aT)) -
                (colOrder.indexOf(bT) === -1 ? 99 : colOrder.indexOf(bT))
              );
            });

      sorted.forEach((col) => {
        generatedSubHeaders.push({
          key: col,
          label:
            key === "ITEM" || key === "OTHER"
              ? getInfoLabel(col)
              : formatColumnLabel(col),
          headerKey: key,
          align: key === "ITEM" || key === "OTHER" ? "left" : "right",
        });
      });
    };

    ["ITEM", "OTHER", "OP", "RE", "IS", "CL"].forEach(addGroup);

    const formattedData = reportData.map((item: any, index: number) => ({
      ...item,
      _id: item.ITEMID ? `${item.ITEMID}_${index}` : `row_${index}`,
    }));

    // Calculate dynamic column widths based on content
    const widthMap: Record<string, number> = {};
    generatedSubHeaders.forEach((sh) => {
      // Measure header width
      const headerWidth = measureTextWidth(sh.label);
      
      // Measure all values in this column
      const columnValues = formattedData.map((row) => {
        let val = row[sh.key];
        if (sh.key === "STOCKTYPE") val = formatStockType(val);
        if (val === undefined || val === null) return "-";
        return val.toString();
      });
      
      const maxValueWidth = Math.max(
        ...columnValues.map((v) => measureTextWidth(v)),
        50 // minimum width
      );
      
      // Column width = max(header, values) + padding
      widthMap[sh.key] = Math.max(headerWidth, maxValueWidth) + 16;
    });

    return {
      headers: generatedHeaders,
      subHeaders: generatedSubHeaders,
      tableData: formattedData,
      columnWidthMap: widthMap,
    };
  }, [reportData, selectedColumns]);

  /* ---- Sticky left offset calculator using dynamic column widths ---- */
  const getStickyLeftForGroup = (groupKey: string): number => {
    let pos = 0;
    for (const h of headers) {
      if (h.key === groupKey) break;
      if (stickyGroups[h.key]) {
        const groupSubHeaders = subHeaders.filter((s) => s.headerKey === h.key);
        pos += groupSubHeaders.reduce(
          (sum, s) => sum + (columnWidthMap[s.key] || 120),
          0
        );
      }
    }
    return pos;
  };

  /* ---- Per-subheader sticky left with precise offset calculation ---- */
  const subHeaderLeftMap = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    subHeaders.forEach((sh) => {
      if (!stickyGroups[sh.headerKey]) {
        map[sh.key] = undefined;
        return;
      }
      const groupSubs = subHeaders.filter((s) => s.headerKey === sh.headerKey);
      const indexInGroup = groupSubs.findIndex((s) => s.key === sh.key);
      const leftBase = getStickyLeftForGroup(sh.headerKey);
      const offsetWithinGroup = groupSubs
        .slice(0, indexInGroup)
        .reduce((sum, s) => sum + (columnWidthMap[s.key] || 120), 0);
      map[sh.key] = leftBase + offsetWithinGroup;
    });
    return map;
  }, [subHeaders, stickyGroups, headers, columnWidthMap]);

  /* ---- Get total width for a group header (for colSpan styling) ---- */
  const getGroupHeaderWidth = (groupKey: string): number => {
    const groupSubs = subHeaders.filter((s) => s.headerKey === groupKey);
    return groupSubs.reduce((sum, s) => sum + (columnWidthMap[s.key] || 120), 0);
  };

  /* ---- PDF Export ---- */
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const now = new Date().toLocaleString();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const colMeta = subHeaders.map((sh) => ({
      sh,
      gc: groupColors[sh.headerKey],
      isInfo: INFO_COLUMNS.has(sh.key),
    }));

    const allRows = tableData.map((row) =>
      colMeta.map(({ sh, isInfo }) => {
        const val = row[sh.key];
        if (sh.key === "STOCKTYPE") return formatStockType(val);
        if (isInfo) return val ?? "-";
        if (typeof val === "number") return val.toFixed(3);
        if (typeof val === "string" && !isNaN(parseFloat(val)))
          return parseFloat(val).toFixed(3);
        return val ?? "-";
      })
    );

    const groupSpans: { label: string; span: number; gc: GroupColors }[] = [];
    headers.forEach((h) => {
      const span = subHeaders.filter((sh) => sh.headerKey === h.key).length;
      if (span > 0)
        groupSpans.push({ label: h.label, span, gc: groupColors[h.key] });
    });

    const MM_PER_COL = 22;
    const PAGE_W = pageWidth - 16;
    const ITEM_COLS = subHeaders.filter((sh) => sh.headerKey === "ITEM");
    const OTHER_GROUPS = headers.filter((h) => h.key !== "ITEM");

    const chunks: SubHeaderType[][] = [];
    let current = [...ITEM_COLS];
    let currentW = ITEM_COLS.length * MM_PER_COL;

    for (const grp of OTHER_GROUPS) {
      const grpCols = subHeaders.filter((sh) => sh.headerKey === grp.key);
      const grpW = grpCols.length * MM_PER_COL;
      if (currentW + grpW <= PAGE_W) {
        current.push(...grpCols);
        currentW += grpW;
      } else {
        if (current.length > ITEM_COLS.length) chunks.push([...current]);
        current = [...ITEM_COLS, ...grpCols];
        currentW = ITEM_COLS.length * MM_PER_COL + grpW;
      }
    }
    if (current.length > ITEM_COLS.length) chunks.push(current);
    if (chunks.length === 0 && current.length > 0) chunks.push(current);

    chunks.forEach((chunkCols, chunkIdx) => {
      if (chunkIdx > 0) doc.addPage();

      const chunkGroups = [...new Set(chunkCols.map((sh) => sh.headerKey))];

      const row1: string[] = [];
      let ci = 0;
      chunkGroups.forEach((gk) => {
        const cols = chunkCols.filter((sh) => sh.headerKey === gk);
        cols.forEach(() => row1.push(groupLabels[gk]));
        ci += cols.length;
      });

      const row2 = chunkCols.map((sh) =>
        sh.headerKey === "ITEM" || sh.headerKey === "OTHER"
          ? getInfoLabel(sh.key)
          : formatColumnLabel(sh.key)
      );

      const chunkBody = allRows.map((row) =>
        chunkCols.map((sh) => {
          const origIdx = subHeaders.findIndex((s) => s.key === sh.key);
          return row[origIdx];
        })
      );

      autoTable(doc, {
        head: [row1, row2],
        body: chunkBody,
        startY: 22,
        styles: {
          fontSize: 7,
          cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
          valign: "middle",
          lineColor: [200, 200, 200],
          lineWidth: 0.2,
        },
        headStyles: {
          fontStyle: "bold",
          halign: "center",
          fontSize: 7.5,
        },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        margin: { top: 22, right: 8, bottom: 14, left: 8 },
        columnStyles: chunkCols.reduce((acc, _, idx) => {
          acc[idx] = { cellWidth: MM_PER_COL };
          return acc;
        }, {} as Record<number, any>),

        didParseCell: (data) => {
          if (data.section !== "head") return;
          const colIdx = data.column.index;
          const sh = chunkCols[colIdx];
          if (!sh) return;
          const gc = groupColors[sh.headerKey];

          if (data.row.index === 0) {
            data.cell.styles.fillColor = gc.pdfHeaderRgb;
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.halign = "center";
          } else {
            data.cell.styles.fillColor = gc.pdfSubRgb;
            data.cell.styles.textColor = [30, 30, 30];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.halign = sh.headerKey === "ITEM" || sh.headerKey === "OTHER" ? "left" : "center";
          }
        },

        willDrawCell: (data) => {
          if (data.section !== "body") return;
          const sh = chunkCols[data.column.index];
          if (!sh) return;
          const gc = groupColors[sh.headerKey];
          const blend = (c: number) => Math.round(c + (255 - c) * 0.55);
          const lightRgb = gc.pdfCellRgb.map(blend) as [number, number, number];
          data.cell.styles.fillColor = lightRgb;
          data.cell.styles.halign = INFO_COLUMNS.has(sh.key) ? "left" : "right";
        },

        didDrawPage: (data) => {
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 30, 30);
          doc.text("Stock Report", pageWidth / 2, 11, { align: "center" });

          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          doc.text(`As On: ${asOnDate}`, 8, 8);
          doc.text(`Generated: ${now}`, pageWidth - 8, 8, { align: "right" });

          doc.setDrawColor(180, 180, 180);
          doc.line(8, 14, pageWidth - 8, 14);

          doc.setFontSize(7);
          doc.setTextColor(120, 120, 120);
          doc.text(
            `Page ${data.pageNumber}${chunks.length > 1 ? ` · Part ${chunkIdx + 1} of ${chunks.length}` : ""}`,
            pageWidth / 2,
            pageHeight - 5,
            { align: "center" }
          );
          doc.setTextColor(0, 0, 0);
        },
      });
    });

    doc.save(`Stock_Report_${asOnDate}.pdf`);
  };

  /* ---- Excel Export ---- */
  const exportExcel = () => {
    const row1: string[] = [];
    const row2: string[] = subHeaders.map((sh) =>
      sh.headerKey === "ITEM" || sh.headerKey === "OTHER"
        ? getInfoLabel(sh.key)
        : formatColumnLabel(sh.key)
    );

    headers.forEach((h) => {
      const span = subHeaders.filter((sh) => sh.headerKey === h.key).length;
      for (let i = 0; i < span; i++) row1.push(h.label);
    });

    const dataRows = tableData.map((row) =>
      subHeaders.map((sh) => {
        const val = row[sh.key];
        if (sh.key === "STOCKTYPE") return formatStockType(val);
        if (INFO_COLUMNS.has(sh.key)) return val ?? "";
        if (typeof val === "number") return parseFloat(val.toFixed(3));
        if (typeof val === "string" && !isNaN(parseFloat(val)))
          return parseFloat(parseFloat(val).toFixed(3));
        return val ?? "";
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([row1, row2, ...dataRows]);

    let colIdx = 0;
    const merges: XLSX.Range[] = [];
    headers.forEach((h) => {
      const span = subHeaders.filter((sh) => sh.headerKey === h.key).length;
      if (span > 1) {
        merges.push({
          s: { r: 0, c: colIdx },
          e: { r: 0, c: colIdx + span - 1 },
        });
      }
      colIdx += span;
    });
    ws["!merges"] = merges;

    ws["!cols"] = subHeaders.map((sh) => ({
      wch: Math.ceil((columnWidthMap[sh.key] || 120) / 7), // Convert px to approximate Excel width
    }));

    ws["!rows"] = [{ hpt: 20 }, { hpt: 18 }];

    let c = 0;
    headers.forEach((h) => {
      const span = subHeaders.filter((sh) => sh.headerKey === h.key).length;
      const gc = groupColors[h.key];
      for (let i = 0; i < span; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: c + i });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            fill: { patternType: "solid", fgColor: { rgb: gc.xlsHeaderHex } },
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } },
            },
          };
        }
      }
      c += span;
    });

    subHeaders.forEach((sh, ci) => {
      const gc = groupColors[sh.headerKey];
      const cellRef = XLSX.utils.encode_cell({ r: 1, c: ci });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          fill: { patternType: "solid", fgColor: { rgb: gc.xlsSubHex } },
          font: { bold: true, sz: 9 },
          alignment: {
            horizontal: sh.headerKey === "ITEM" || sh.headerKey === "OTHER" ? "left" : "center",
            vertical: "center",
          },
          border: {
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } },
          },
        };
      }
    });

    dataRows.forEach((_, ri) => {
      subHeaders.forEach((sh, ci) => {
        const gc = groupColors[sh.headerKey];
        const cellRef = XLSX.utils.encode_cell({ r: ri + 2, c: ci });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            fill: { patternType: "solid", fgColor: { rgb: gc.xlsCellHex } },
            font: { sz: 9 },
            alignment: {
              horizontal: INFO_COLUMNS.has(sh.key) ? "left" : "right",
              vertical: "center",
            },
            border: {
              bottom: { style: "hair", color: { rgb: "DDDDDD" } },
              right: { style: "hair", color: { rgb: "DDDDDD" } },
            },
          };
        }
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Report");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
      `Stock_Report_${asOnDate}.xlsx`
    );
  };

  /* ---- Header renderer with dynamic widths ---- */
  const renderHeader = () => (
    <thead style={{ position: "sticky", top: 0, zIndex: Z.mainHeader }}>
      <tr>
        {headers.map((header) => {
          const gc = groupColors[header.key];
          const isSticky = !!stickyGroups[header.key];
          const colSpan = subHeaders.filter((sh) => sh.headerKey === header.key).length;
          const leftPx = isSticky ? getStickyLeftForGroup(header.key) : undefined;
          const groupWidth = getGroupHeaderWidth(header.key);

          return (
            <th
              key={header.key}
              colSpan={colSpan}
              style={{
                textAlign: "center",
                backgroundColor: gc.bg,
                color: gc.color,
                fontWeight: 700,
                fontSize: "11px",
                letterSpacing: "0.03em",
                padding: "9px 10px",
                borderBottom: `2px solid ${gc.border}`,
                borderRight: `2px solid ${gc.border}`,
                position: isSticky ? "sticky" : "relative",
                left: isSticky ? `${leftPx}px` : undefined,
                zIndex: isSticky ? Z.mainHeaderSticky : Z.mainHeader,
                boxShadow: isSticky ? "4px 0 8px rgba(0,0,0,0.18)" : "none",
                whiteSpace: "nowrap",
                userSelect: "none",
                minWidth: isSticky ? `${groupWidth}px` : undefined,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {header.label}
                <CustomCheckbox
                  checked={isSticky}
                  onChange={() => toggleStickyGroup(header.key)}
                />
              </span>
            </th>
          );
        })}
      </tr>
      <tr>
        {subHeaders.map((sh) => {
          const gc = groupColors[sh.headerKey];
          const isSticky = !!stickyGroups[sh.headerKey];
          const left = subHeaderLeftMap[sh.key];
          const colWidth = columnWidthMap[sh.key] || 120;

          return (
            <th
              key={sh.key}
              style={{
                textAlign: sh.align,
                backgroundColor: gc.subBg,
                color: gc.subColor,
                fontWeight: 600,
                fontSize: "10.5px",
                padding: "7px 10px",
                borderBottom: `1px solid ${gc.border}`,
                borderRight: `1px solid ${gc.border}`,
                position: isSticky ? "sticky" : "relative",
                left: isSticky ? `${left}px` : undefined,
                zIndex: isSticky ? Z.subHeaderSticky : Z.subHeader,
                width: `${colWidth}px`,
                minWidth: `${colWidth}px`,
                maxWidth: `${colWidth}px`,
                boxShadow: isSticky ? "4px 0 8px rgba(0,0,0,0.12)" : "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {sh.label}
            </th>
          );
        })}
      </tr>
    </thead>
  );

  /* ---- Row renderer with dynamic widths ---- */
  const getNumericValue = (v: any): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") return parseFloat(v) || 0;
    return 0;
  };

  const renderStockRows = () =>
    tableData.map((row, rowIndex) => (
      <tr
        key={row._id}
        style={{
          backgroundColor: rowIndex % 2 === 0 ? undefined : "rgba(0,0,0,0.018)",
        }}
      >
        {subHeaders.map((sh) => {
          const gc = groupColors[sh.headerKey];
          const isInfoCol = INFO_COLUMNS.has(sh.key);
          const isSticky = !!stickyGroups[sh.headerKey];
          const left = subHeaderLeftMap[sh.key];
          const colWidth = columnWidthMap[sh.key] || 120;

          let rawVal = row[sh.key];
          if (sh.key === "STOCKTYPE") rawVal = formatStockType(rawVal);

          const isNumeric =
            !isInfoCol &&
            (typeof rawVal === "number" ||
              (typeof rawVal === "string" &&
                !isNaN(parseFloat(rawVal)) &&
                rawVal !== "Tagged" &&
                rawVal !== "Non Tagged"));

          const display = isNumeric
            ? getNumericValue(rawVal).toFixed(3)
            : rawVal ?? "-";

          const numVal = isNumeric ? getNumericValue(rawVal) : null;

          return (
            <td
              key={sh.key}
              style={{
                textAlign: isNumeric ? "right" : "left",
                padding: "6px 10px",
                fontSize: "11.5px",
                backgroundColor: gc.cellBg,
                borderBottom: `1px solid ${gc.border}`,
                borderRight: `1px solid ${gc.border}`,
                position: isSticky ? "sticky" : "relative",
                left: isSticky ? `${left}px` : undefined,
                zIndex: isSticky ? Z.bodyCellSticky : Z.bodyCell,
                width: `${colWidth}px`,
                minWidth: `${colWidth}px`,
                maxWidth: `${colWidth}px`,
                boxShadow: isSticky ? "4px 0 8px rgba(0,0,0,0.08)" : "none",
                whiteSpace: isInfoCol ? "nowrap" : "normal",
                overflow: isInfoCol ? "hidden" : "visible",
                textOverflow: isInfoCol ? "ellipsis" : "unset",
              }}
            >
              <span
                style={{
                  fontWeight: isNumeric && numVal !== 0 ? 500 : 400,
                  color: isNumeric && numVal === 0 ? "#a0aec0" : "inherit",
                  fontVariantNumeric: isNumeric ? "tabular-nums" : "normal",
                  fontFamily: isNumeric ? "'JetBrains Mono', 'Fira Code', monospace" : "inherit",
                  fontSize: isNumeric ? "11px" : "inherit",
                }}
              >
                {display}
              </span>
            </td>
          );
        })}
      </tr>
    ));

  /* ---- Summary stats ---- */
  const summaryStats = useMemo(() => {
    if (!tableData.length) return null;
    const sum = (key: string) =>
      tableData.reduce((acc, item) => {
        const v = item[key];
        return acc + (typeof v === "number" ? v : parseFloat(v) || 0);
      }, 0);
    return {
      totalItems: tableData.length,
      totalOpeningGross: sum("OP_GRSWT"),
      totalClosingGross: sum("CL_GRSWT"),
    };
  }, [tableData]);

  /* ---- Render ---- */
  return (
    <Box
      bg={theme.colors.formColor}
      p={3}
      rounded="xl"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      <VStack gap={4} align="stretch">

        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.100"
          borderRadius="lg"
          px={3}
          py={2}
          boxShadow="0 1px 4px rgba(0,0,0,0.06)"
        >
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <Text
              fontWeight={700}
              fontSize="13px"
              color="gray.700"
              letterSpacing="0.02em"
              whiteSpace="nowrap"
            >
              Stock Report
            </Text>

            <HStack gap={2} flexWrap="wrap" align="center">
              <Box>
                <Input
                  type="date"
                  size="xs"
                  value={asOnDate}
                  onChange={(e) => setAsOnDate(e.target.value)}
                  style={{
                    borderRadius: "6px",
                    fontSize: "12px",
                    padding: "3px 8px",
                    border: "1px solid #CBD5E0",
                    height: "28px",
                  }}
                />
              </Box>

              <CheckboxDropdown
                label="Columns"
                options={columnOptions}
                value={selectedColumns}
                onChange={setSelectedColumns}
              />
              <CheckboxDropdown
                label="Group By"
                options={groupByOptions}
                value={selectedGroupBy}
                onChange={setSelectedGroupBy}
              />

              <Button
                size="xs"
                onClick={handleGetReport}
                loading={isFetching}
                loadingText="Loading…"
                style={{
                  background: "linear-gradient(135deg, #2B6CB0 0%, #2C5282 100%)",
                  color: "#fff",
                  fontWeight: 600,
                  borderRadius: "6px",
                  fontSize: "12px",
                  padding: "0 14px",
                  height: "28px",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                  boxShadow: "0 2px 6px rgba(43,108,176,0.3)",
                }}
              >
                Get Report
              </Button>

              <Box
                style={{
                  display: "flex",
                  gap: "6px",
                  minWidth: showReport && tableData.length > 0 ? undefined : "0px",
                  overflow: "hidden",
                  
                  transition: "min-width 0.2s",
                }}
              >
                {showReport && tableData.length > 0 && (
                  <>
                    <button
                      onClick={exportExcel}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "linear-gradient(135deg, #276749 0%, #1C4532 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        padding: "0 12px",
                        height: "28px",
                        width: "70px",
                        cursor: "pointer",
                        boxShadow: "0 2px 5px rgba(39,103,73,0.3)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      <DownloadIcon style={{ fontSize: "10px", width: "20px",}} />
                      Excel
                    </button>
                    <button
                      onClick={exportPDF}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "linear-gradient(135deg, #C05621 0%, #9C4221 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        padding: "0 12px",
                        height: "28px",
                        width: "70px",
                        cursor: "pointer",
                        boxShadow: "0 2px 5px rgba(192,86,33,0.3)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      <DownloadIcon style={{ fontSize: "10px", width: "20px",}} />
                      PDF
                    </button>
                  </>
                )}
              </Box>
            </HStack>
          </HStack>
        </Box>

        {isFetching && (
          <Box p={8} textAlign="center">
            <Spinner size="xl" color="blue.500" />
            <Text mt={3} fontSize="13px" color="gray.500">
              Loading report data…
            </Text>
          </Box>
        )}

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
              Error loading report data
            </Text>
            <Button size="xs" onClick={() => refetch()}>
              Retry
            </Button>
          </Box>
        )}

        {showReport && tableData.length > 0 && (
          <>
            <HStack gap={3} px={1} fontSize="11px" color="gray.500" flexWrap="wrap">
              {Object.entries(groupColors).map(([key, gc]) => (
                <HStack key={key} gap={1}>
                  <Box
                    w="10px"
                    h="10px"
                    style={{ backgroundColor: gc.bg }}
                    borderRadius="2px"
                    flexShrink={0}
                  />
                  <Text>{groupLabels[key]}</Text>
                </HStack>
              ))}
              <HStack gap={1}>
                <Box
                  w="10px"
                  h="10px"
                  bg="white"
                  border="1px solid"
                  borderColor="gray.400"
                  borderRadius="2px"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "7px" }}
                />
                <Text>☑ pin column group</Text>
              </HStack>
            </HStack>

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
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                {renderHeader()}
                <tbody>{renderStockRows()}</tbody>
              </table>
            </Box>

            {summaryStats && (
              <HStack
                gap={0}
                borderRadius="lg"
                overflow="hidden"
                border="1px solid"
                borderColor="gray.200"
                divideX="1px"
                divideColor="gray.200"
              >
                {[
                  { label: "Total Items", value: summaryStats.totalItems, color: "#2B6CB0" },
                  {
                    label: "Opening Gross Wt",
                    value: summaryStats.totalOpeningGross.toFixed(3),
                    color: "#276749",
                  },
                  {
                    label: "Closing Gross Wt",
                    value: summaryStats.totalClosingGross.toFixed(3),
                    color: "#285E61",
                  },
                ].map((stat) => (
                  <Box
                    key={stat.label}
                    flex={1}
                    px={4}
                    py={3}
                    bg="white"
                    _hover={{ bg: "gray.50" }}
                    transition="background 0.15s"
                  >
                    <Text fontSize="10px" color="gray.400" fontWeight={500} letterSpacing="0.06em" textTransform="uppercase">
                      {stat.label}
                    </Text>
                    <Text
                      fontWeight={700}
                      fontSize="15px"
                      style={{
                        color: stat.color,
                        fontVariantNumeric: "tabular-nums",
                        fontFamily: "'JetBrains Mono', monospace",
                        marginTop: "2px",
                      }}
                    >
                      {stat.value}
                    </Text>
                  </Box>
                ))}
              </HStack>
            )}
          </>
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
            <Text fontSize="28px" mb={3}>📊</Text>
            <Text fontSize="14px" color="gray.600" fontWeight={500} mb={1}>
              Click "Get Report" to view the stock report
            </Text>
            <Text fontSize="12px" color="gray.400">
              Shows opening, issued, received and closing balances per item
            </Text>
          </Box>
        )}

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
              No stock data available for the selected period
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

export default StockReport;