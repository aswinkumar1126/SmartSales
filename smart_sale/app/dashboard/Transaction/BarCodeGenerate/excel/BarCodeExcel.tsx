"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HotTable } from "@handsontable/react";
import type { CellChange, ChangeSource } from "handsontable/common";
import { HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import { Box, Button, Text, Icon } from "@chakra-ui/react";
import { Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

registerAllModules();

/* ============================================================
   TYPES
   ============================================================ */

export interface ExcelRowData {
    grsweight: number;
    purchaseStoneWt: number;
    stoneWt: number;
    navaWt: number;
    salesStoneWt: number;
    // wastePercent: number;
    diamondWt: number;
    size: string;
    // mc: number;
    // touch: number;
}

export type ExcelData = (string | number | null)[][];

/* ============================================================
   CONSTANTS — column definitions
   ============================================================ */

export const EXCEL_COLUMNS: {
    key: keyof ExcelRowData;
    header: string;
    type: "numeric" | "text";
    numericFormat?: { pattern: string };
    decimalScale?: number;
    width: number;
    readOnly?: boolean;
}[] = [
        { key: "grsweight", header: "WEIGHT", type: "numeric", numericFormat: { pattern: "0.000" }, decimalScale: 3, width: 80 },
        { key: "purchaseStoneWt", header: "P. STN WT", type: "numeric", numericFormat: { pattern: "0.000" }, decimalScale: 3, width: 100 },
        { key: "stoneWt", header: "STN WT", type: "numeric", numericFormat: { pattern: "0.000" }, decimalScale: 3, width: 100 },
        { key: "navaWt", header: "NAVA WT", type: "numeric", numericFormat: { pattern: "0.000" }, decimalScale: 3, width: 100 },
        { key: "salesStoneWt", header: "SALES STN WT", type: "numeric", numericFormat: { pattern: "0.000" }, decimalScale: 3, width: 100, readOnly: true },
        // { key: "wastePercent", header: "WASTE %", type: "numeric", numericFormat: { pattern: "0.00" }, decimalScale: 2, width: 70 },
        { key: "diamondWt", header: "DIAMOND WT", type: "numeric", numericFormat: { pattern: "0.000" }, decimalScale: 3, width: 90 },
        { key: "size", header: "SIZE", type: "text", decimalScale: 0, width: 60 },
        // { key: "mc", header: "MC", type: "numeric", numericFormat: { pattern: "0.00" }, decimalScale: 2, width: 120 },
        // { key: "touch", header: "TOUCH", type: "numeric", numericFormat: { pattern: "0.0" }, decimalScale: 1, width: 120 },
    ];

/**
 * Header aliases: keys are lowercase-trimmed variants the uploaded Excel
 * file might use; values map to EXCEL_COLUMNS indices (0-based).
 */
const HEADER_ALIAS_MAP: Record<string, number> = {
    "grs wt": 0, grsweight: 0, "grs weight": 0, "weight": 0,
    "p. stn wt": 1, "purchase stone wt": 1, purchasestonewt: 1, "purchase stn wt": 1,
    "stn wt": 2, stonewt: 2, "stone weight": 2, "stone wt": 2,
    "nava wt": 3, navawt: 3, "nava": 3,
    "sales stn wt": 4, salesstonewt: 4, "sales stone wt": 4,
    // "waste %": 5, wastepercent: 5, waste: 5,
    "diamond wt": 5, diamondwt: 5, "diamond weight": 5,
    "size": 6,
    // "mc": 7,
    // "touch": 8,
};

// Index constants for clarity
const STONE_WT_INDEX = 2;
const NAVA_WT_INDEX = 3;
const SALES_STONE_WT_INDEX = 4;

const EMPTY_ROW: (string | number | null)[] = EXCEL_COLUMNS.map(() => null);
const makeEmptyRows = (n = 10): ExcelData =>
    Array.from({ length: n }, () => [...EMPTY_ROW]);

/* ============================================================
   HELPERS
   ============================================================ */

const safeNum = (val: unknown, decimals = 3): number => {
    const n = Number(val);
    if (isNaN(n)) return 0;
    return parseFloat(n.toFixed(decimals));
};

const calculateSalesStoneWt = (stoneWt: number, navaWt: number): number => {
    return safeNum(stoneWt + navaWt, 3);
};

const parseGridRow = (row: (string | number | null)[]): ExcelRowData | null => {
    if (row.every((cell) => cell === null || cell === "")) return null;

    const stoneWt = safeNum(row[STONE_WT_INDEX], 3);
    const navaWt = safeNum(row[NAVA_WT_INDEX], 3);

    return {
        grsweight: safeNum(row[0], 3),
        purchaseStoneWt: safeNum(row[1], 3),
        stoneWt: stoneWt,
        navaWt: navaWt,
        salesStoneWt: calculateSalesStoneWt(stoneWt, navaWt),
        // wastePercent: safeNum(row[5], 2),
        diamondWt: safeNum(row[5], 3),
        size: String(row[6] ?? ""),
        // mc: safeNum(row[7], 2),
        // touch: safeNum(row[8], 1),
    };
};

const sheetToExcelData = (worksheet: XLSX.WorkSheet): ExcelData => {
    const rawRows: (string | number | null)[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: true,
    });

    if (rawRows.length === 0) return makeEmptyRows();

    const colCount = EXCEL_COLUMNS.length;
    const firstRow = rawRows[0];

    // Detect header row: at least one cell is a non-numeric string
    const looksLikeHeader = firstRow.some(
        (cell) => typeof cell === "string" && isNaN(Number(cell)) && cell.trim() !== ""
    );

    // Build remap: destColIndex → srcColIndex
    let colRemap: number[] | null = null;
    if (looksLikeHeader) {
        const remap: number[] = new Array(colCount).fill(-1);
        firstRow.forEach((cell, srcIdx) => {
            const key = String(cell ?? "").toLowerCase().trim();
            const destIdx = HEADER_ALIAS_MAP[key];
            if (destIdx !== undefined) remap[destIdx] = srcIdx;
        });
        colRemap = remap;
    }

    const dataRows = looksLikeHeader ? rawRows.slice(1) : rawRows;

    const mapped: ExcelData = dataRows.map((row) => {
        if (colRemap) {
            const mappedRow = colRemap.map((srcIdx) => (srcIdx >= 0 ? (row[srcIdx] ?? null) : null));
            // Auto-calculate sales stone wt
            const stoneWt = safeNum(mappedRow[STONE_WT_INDEX], 3);
            const navaWt = safeNum(mappedRow[NAVA_WT_INDEX], 3);
            mappedRow[SALES_STONE_WT_INDEX] = calculateSalesStoneWt(stoneWt, navaWt);
            return mappedRow;
        }

        const mappedRow = EXCEL_COLUMNS.map((_, i) => row[i] ?? null);
        // Auto-calculate sales stone wt
        const stoneWt = safeNum(mappedRow[STONE_WT_INDEX], 3);
        const navaWt = safeNum(mappedRow[NAVA_WT_INDEX], 3);
        mappedRow[SALES_STONE_WT_INDEX] = calculateSalesStoneWt(stoneWt, navaWt);
        return mappedRow;
    });

    return mapped.length > 0 ? mapped : makeEmptyRows();
};

/* ============================================================
   PROPS
   ============================================================ */

type BarCodeExcelProps = {
    data: ExcelData;
    onChange: (changes: CellChange[] | null, source: ChangeSource) => void;
    onLoad: (rows: ExcelRowData[]) => void;
    onUpdate?: (rows: ExcelRowData[]) => void;
    onFileParsed?: (data: ExcelData) => void;
    hasExistingRows?: boolean;
};

/* ============================================================
   COMPONENT
   ============================================================ */

const BarCodeExcel: React.FC<BarCodeExcelProps> = ({
    data,
    onChange,
    onLoad,
    onUpdate,
    onFileParsed,
    hasExistingRows = false,
}) => {
    const hotRef = useRef<HotTableClass>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [internalData, setInternalData] = useState<ExcelData>(() =>
        data.length > 0 ? data : makeEmptyRows()
    );

    const prevDataRef = useRef<ExcelData>(data);
    useEffect(() => {
        if (data !== prevDataRef.current) {
            prevDataRef.current = data;
            setInternalData(data.length > 0 ? data : makeEmptyRows());
        }
    }, [data]);

    // ── Upload state ──────────────────────────────────────────────────────────
    const [fileName, setFileName] = useState<string>("");
    const [uploadError, setUploadError] = useState<string>("");

    // ── Column settings ───────────────────────────────────────────────────────
    const columns = useMemo(() =>
        EXCEL_COLUMNS.map((col) => ({
            type: col.type === "numeric" ? ("numeric" as const) : ("text" as const),
            numericFormat: col.type === "numeric" ? (col.numericFormat ?? { pattern: "0.000" }) : undefined,
            readOnly: col.readOnly ?? false,
        })), []);

    const colWidths = useMemo(() => EXCEL_COLUMNS.map((c) => c.width), []);
    const colHeaders = useMemo(() => EXCEL_COLUMNS.map((c) => c.header), []);

    // ── afterChange: auto-calculate sales stone wt when stone wt or nava wt changes ───
    const handleAfterChange = useCallback(
        (changes: CellChange[] | null, source: ChangeSource) => {
            // "loadData" fires when HotTable receives a new `data` prop — not a user action
            if (source === "loadData") return;

            // Check if stone wt or nava wt were changed
            if (changes && hotRef.current?.hotInstance) {
                const hot = hotRef.current.hotInstance;
                let recalculateNeeded = false;

                changes.forEach(([row, prop]) => {
                    const col = typeof prop === 'number' ? prop : (typeof prop === 'string' ? hot.propToCol(prop) : -1);
                    if (col === STONE_WT_INDEX || col === NAVA_WT_INDEX) {
                        recalculateNeeded = true;
                    }
                });

                if (recalculateNeeded) {
                    // Suspend rendering for batch update
                    hot.batch(() => {
                        changes.forEach(([row]) => {
                            if (typeof row === 'number') {
                                const stoneWt = safeNum(hot.getDataAtCell(row, STONE_WT_INDEX), 3);
                                const navaWt = safeNum(hot.getDataAtCell(row, NAVA_WT_INDEX), 3);
                                const salesStoneWt = calculateSalesStoneWt(stoneWt, navaWt);
                                hot.setDataAtCell(row, SALES_STONE_WT_INDEX, salesStoneWt, 'auto');
                            }
                        });
                    });
                }
            }

            onChange(changes, source);
        },
        [onChange]
    );

    // ── File upload ───────────────────────────────────────────────────────────
    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setUploadError("");
            setFileName(file.name);

            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const buf = evt.target?.result as ArrayBuffer;
                    const workbook = XLSX.read(buf, { type: "array" });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const parsed = sheetToExcelData(sheet);

                    // Update internal grid directly (no parent round-trip)
                    prevDataRef.current = parsed; // suppress useEffect sync
                    setInternalData(parsed);

                    // Let parent know the new raw data
                    onFileParsed?.(parsed);
                } catch {
                    setUploadError(
                        "Failed to parse file. Please upload a valid .xlsx / .xls / .csv file."
                    );
                }
            };
            reader.onerror = () => setUploadError("Could not read the file.");
            reader.readAsArrayBuffer(file);

            // Allow re-uploading the same file
            e.target.value = "";
        },
        [onFileParsed]
    );

    // ── Clear ─────────────────────────────────────────────────────────────────
    const handleClear = useCallback(() => {
        setFileName("");
        setUploadError("");
        const blank = makeEmptyRows();

        prevDataRef.current = blank;
        setInternalData(blank);
        onFileParsed?.(blank);
    
    }, [onFileParsed]);

    // ── Clear grid only (keep file name if any) ───────────────────────────────
    const handleClearGrid = useCallback(() => {
        const blank = makeEmptyRows();
        prevDataRef.current = blank;
        setInternalData(blank);
        setUploadError("");
    }, []);

    // ── Get parsed data ───────────────────────────────────────────────────────
    const getParsedData = useCallback((): ExcelRowData[] => {
        const sourceData: ExcelData =
            hotRef.current?.hotInstance
                ? (hotRef.current.hotInstance.getData() as ExcelData)
                : internalData;

        return sourceData.reduce<ExcelRowData[]>((acc, row) => {
            const item = parseGridRow(row);
            if (item) acc.push(item);
            return acc;
        }, []);
    }, [internalData]);

    // ── Load button (Add new rows) ────────────────────────────────────────────
    const handleLoad = useCallback(() => {
        const parsed = getParsedData();

        if (parsed.length === 0) {
            alert("No valid rows found in the grid.");
            return;
        }
        onLoad(parsed);
    }, [getParsedData, onLoad]);

    // ── Update button (Update existing rows) ──────────────────────────────────
    const handleUpdate = useCallback(() => {
        const parsed = getParsedData();

        if (parsed.length === 0) {
            alert("No valid rows found in the grid.");
            return;
        }
        onUpdate?.(parsed);
    }, [getParsedData, onUpdate]);

    /* ======================================================================== */

    return (
        <Box display="flex" flexDirection="column" gap={3} p={2}>

            {/* ── File upload strip ── */}
            <Box
                display="flex"
                alignItems="center"
                gap={3}
                p={3}
                border="1px dashed"
                borderColor="gray.300"
                rounded="md"
                bg="gray.50"
                flexWrap="wrap"
            >
                <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />

                <Button
                    size="sm"
                    variant="outline"
                    colorPalette="blue"
                    onClick={() => fileRef.current?.click()}
                >
                    📂 Upload Excel / CSV
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    colorPalette="red"
                    onClick={handleClearGrid}
                >
                    <Icon as={Trash2} w={4} h={4} mr={1} />
                    Clear Grid
                </Button>

                {fileName ? (
                    <>
                        <Text fontSize="sm" color="gray.700" flex={1}>
                            {fileName}
                        </Text>
                        <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={handleClear}
                        >
                            ✕ Remove File
                        </Button>
                    </>
                ) : (
                    <Text fontSize="sm" color="gray.400">
                        No file selected — or fill the grid manually below
                    </Text>
                )}

                {uploadError && (
                    <Text fontSize="xs" color="red.500" w="full">
                        {uploadError}
                    </Text>
                )}
            </Box>

            <Text fontSize="xs" color="gray.500">
                Press <Text as="kbd" fontFamily="mono">Enter</Text> to move down a cell.
                SALES STN WT is auto-calculated (STN WT + NAVA WT).
                Drag column borders to resize. Blank rows are ignored on load.
            </Text>

            {/* ── Spreadsheet grid ── */}
            <Box overflowX="auto" border="1px solid" borderColor="gray.200" rounded="md">
                <HotTable
                    ref={hotRef}
                    data={internalData}
                    colHeaders={colHeaders}
                    columns={columns}
                    colWidths={colWidths}
                    rowHeaders={true}
                    width="100%"
                    height="420px"
                    enterMoves={{ row: 1, col: 0 }}
                    licenseKey="non-commercial-and-evaluation"
                    afterChange={handleAfterChange}
                    contextMenu={true}
                    manualColumnResize={true}
                    manualRowResize={true}
                    allowRemoveRow={true}
                    minSpareRows={5}
                    wordWrap={false}
                    stretchH="last"
                />
            </Box>

            {/* ── Actions ── */}
            <Box display="flex" justifyContent="flex-end" gap={2}>
                {hasExistingRows && onUpdate && (
                    <Button size="sm" colorPalette="orange" onClick={handleUpdate}>
                        Update Table
                    </Button>
                )}
                <Button size="sm" colorPalette="teal" onClick={handleLoad}>
                    {hasExistingRows ? "Load as New" : "Load into Table"}
                </Button>
            </Box>
        </Box>
    );
};

export default BarCodeExcel;