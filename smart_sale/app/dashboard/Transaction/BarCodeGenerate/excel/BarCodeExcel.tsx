"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HotTable } from "@handsontable/react";
import type { CellChange, ChangeSource } from "handsontable/common";
import { HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import { Box, Button, Text } from "@chakra-ui/react";
import * as XLSX from "xlsx";

registerAllModules();

/* ============================================================
   TYPES
   ============================================================ */

export interface ExcelRowData {
    grsweight: number;
    stoneWt: number;
    salesStoneWt: number;
    wastePercent: number;
    size: string;
    diamondWt: number;
    mc: number;
    touch: number;
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
}[] = [
        { key: "grsweight", header: "GRS WT", type: "numeric", numericFormat: { pattern: "0.000" }, decimalScale: 3, width: 90 },
        { key: "stoneWt", header: "STONE WT", type: "numeric", numericFormat: { pattern: "0.000" }, decimalScale: 3, width: 90 },
        { key: "salesStoneWt", header: "SALES STN WT", type: "numeric", numericFormat: { pattern: "0.000" }, decimalScale: 3, width: 110 },
        { key: "wastePercent", header: "WASTE %", type: "numeric", numericFormat: { pattern: "0.00" }, decimalScale: 2, width: 80 },
        { key: "size", header: "SIZE", type: "text", width: 70 },
        { key: "diamondWt", header: "DIAMOND WT", type: "numeric", numericFormat: { pattern: "0.000" }, decimalScale: 3, width: 100 },
        { key: "mc", header: "MC", type: "numeric", numericFormat: { pattern: "0.00" }, decimalScale: 2, width: 70 },
        { key: "touch", header: "TOUCH", type: "numeric", numericFormat: { pattern: "0.0" }, decimalScale: 1, width: 70 },
    ];

/**
 * Header aliases: keys are lowercase-trimmed variants the uploaded Excel
 * file might use; values map to EXCEL_COLUMNS indices (0-based).
 */
const HEADER_ALIAS_MAP: Record<string, number> = {
    "grs wt": 0, grsweight: 0, "grs weight": 0,
    "stone wt": 1, stonewt: 1, "stone weight": 1,
    "sales stn wt": 2, salesstonewt: 2, "sales stone wt": 2,
    "waste %": 3, wastepercent: 3, waste: 3,
    size: 4,
    "diamond wt": 5, diamondwt: 5, "diamond weight": 5,
    mc: 6,
    touch: 7,
};

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

const parseGridRow = (row: (string | number | null)[]): ExcelRowData | null => {
    if (row.every((cell) => cell === null || cell === "")) return null;
    return {
        grsweight: safeNum(row[0], 3),
        stoneWt: safeNum(row[1], 3),
        salesStoneWt: safeNum(row[2], 3),
        wastePercent: safeNum(row[3], 2),
        size: String(row[4] ?? ""),
        diamondWt: safeNum(row[5], 3),
        mc: safeNum(row[6], 2),
        touch: safeNum(row[7], 1),
    };
};

/**
 * Convert a raw XLSX worksheet into ExcelData aligned with EXCEL_COLUMNS order.
 * Handles:
 *  - Sheets with no header row (columns assumed to match EXCEL_COLUMNS order)
 *  - Sheets with a header row  → auto-mapped via HEADER_ALIAS_MAP
 */
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
            return colRemap.map((srcIdx) => (srcIdx >= 0 ? (row[srcIdx] ?? null) : null));
        }
        return EXCEL_COLUMNS.map((_, i) => row[i] ?? null);
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
    onFileParsed?: (data: ExcelData) => void;
};

/* ============================================================
   COMPONENT
   ============================================================ */

const BarCodeExcel: React.FC<BarCodeExcelProps> = ({
    data,
    onChange,
    onLoad,
    onFileParsed,
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
        EXCEL_COLUMNS.map((col) =>
            col.type === "numeric"
                ? { type: "numeric" as const, numericFormat: col.numericFormat ?? { pattern: "0.000" } }
                : { type: "text" as const }
        ), []);

    const colWidths = useMemo(() => EXCEL_COLUMNS.map((c) => c.width), []);
    const colHeaders = useMemo(() => EXCEL_COLUMNS.map((c) => c.header), []);

    // ── afterChange: user edits only (skip programmatic "loadData" events) ───
    const handleAfterChange = useCallback(
        (changes: CellChange[] | null, source: ChangeSource) => {
            // "loadData" fires when HotTable receives a new `data` prop — not a user action
            if (source === "loadData") return;

            onChange(changes, source);

        
        },
        [onChange, onFileParsed]
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

    // ── Load button ───────────────────────────────────────────────────────────
    const handleLoad = useCallback(() => {
        const sourceData: ExcelData =
            hotRef.current?.hotInstance
                ? (hotRef.current.hotInstance.getData() as ExcelData)
                : internalData;

        const parsed = sourceData.reduce<ExcelRowData[]>((acc, row) => {
            const item = parseGridRow(row);
            if (item) acc.push(item);
            return acc;
        }, []);

        if (parsed.length === 0) {
            alert("No valid rows found in the grid.");
            return;
        }
        onLoad(parsed);
    }, [internalData, onLoad]);

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
                            ✕ Clear
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
                <Button size="sm" colorPalette="teal" onClick={handleLoad}>
                    Load into Table
                </Button>
            </Box>
        </Box>
    );
};

export default BarCodeExcel;