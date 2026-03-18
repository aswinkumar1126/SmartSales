"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HotTable } from "@handsontable/react";
import type { HotTableClass } from "@handsontable/react";
import type { CellChange, ChangeSource } from "handsontable/common";
import { registerAllModules } from "handsontable/registry";
import { Box, Button, Text, Badge } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
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
   COLUMN DEFINITIONS
   ============================================================ */

export const EXCEL_COLUMNS: {
    key: keyof ExcelRowData;
    header: string;
    type: "numeric" | "text";
    numericFormat?: { pattern: string };
    width: number;
    validator?: "positive" | "nonNegative";
}[] = [
        { key: "grsweight", header: "GRS WT", type: "numeric", numericFormat: { pattern: "0.000" }, width: 90, validator: "positive" },
        { key: "stoneWt", header: "STONE WT", type: "numeric", numericFormat: { pattern: "0.000" }, width: 90, validator: "nonNegative" },
        { key: "salesStoneWt", header: "SALES STN WT", type: "numeric", numericFormat: { pattern: "0.000" }, width: 110, validator: "nonNegative" },
        { key: "wastePercent", header: "WASTE %", type: "numeric", numericFormat: { pattern: "0.00" }, width: 80 },
        { key: "size", header: "SIZE", type: "text", width: 80 },
        { key: "diamondWt", header: "DIAMOND WT", type: "numeric", numericFormat: { pattern: "0.000" }, width: 100, validator: "nonNegative" },
        { key: "mc", header: "MC", type: "numeric", numericFormat: { pattern: "0.00" }, width: 70 },
        { key: "touch", header: "TOUCH", type: "numeric", numericFormat: { pattern: "0.0" }, width: 70 },
    ];

const LAST_COL_IDX = EXCEL_COLUMNS.length - 1;

/* ============================================================
   HELPERS
   ============================================================ */

const safeNum = (val: unknown): number => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

const makeEmptyRows = (n = 15): ExcelData =>
    Array.from({ length: n }, () => EXCEL_COLUMNS.map(() => null));

const parseGridRow = (row: (string | number | null)[]): ExcelRowData | null => {
    if (row.every((c) => c === null || c === "")) return null;
    return {
        grsweight: safeNum(row[0]),
        stoneWt: safeNum(row[1]),
        salesStoneWt: safeNum(row[2]),
        wastePercent: safeNum(row[3]),
        size: String(row[4] ?? ""),
        diamondWt: safeNum(row[5]),
        mc: safeNum(row[6]),
        touch: safeNum(row[7]),
    };
};

const parseXlsxFile = (file: File): Promise<ExcelData> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("File read failed"));
        reader.onload = (e) => {
            try {
                const buf = new Uint8Array(e.target!.result as ArrayBuffer);
                const wb = XLSX.read(buf, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, {
                    header: 1, defval: null, raw: false,
                }) as (string | number | null)[][];
                const colCount = EXCEL_COLUMNS.length;
                const parsed: ExcelData = rows
                    .slice(1)
                    .filter((r) => r.some((c) => c !== null && c !== ""))
                    .map((r) => Array.from({ length: colCount }, (_, i) => r[i] ?? null));
                resolve(parsed);
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });

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

const BarCodeExcel: React.FC<BarCodeExcelProps> = ({ data, onChange, onLoad, onFileParsed }) => {
    const hotRef = useRef<HotTableClass>(null);

    const [rowCount, setRowCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    /**
     * When we call hot.selectCell() programmatically (inside Enter handler),
     * afterSelection fires again. This flag tells afterSelection to skip
     * opening the editor for that one synthetic selection event, because
     * the Enter handler will open it manually after its own setTimeout.
     */
    const suppressNextOpen = useRef(false);

    /* ── Badge: count filled rows ── */
    useEffect(() => {
        const filled = data.filter((r) => r.some((c) => c !== null && c !== "")).length;
        setRowCount(filled);
    }, [data]);

    /* ──────────────────────────────────────────────────────────
       COLUMN CONFIG
    ────────────────────────────────────────────────────────── */
    const columns = useMemo(
        () =>
            EXCEL_COLUMNS.map((col) => {
                const cfg: Record<string, unknown> = {
                    type: col.type,
                    allowEmpty: true,
                };
                if (col.type === "numeric" && col.numericFormat) {
                    cfg.numericFormat = col.numericFormat;
                }
                if (col.validator === "positive") {
                    cfg.validator = (value: unknown, cb: (v: boolean) => void) => {
                        if (value === null || value === "") { cb(true); return; }
                        cb(Number(value) > 0);
                    };
                } else if (col.validator === "nonNegative") {
                    cfg.validator = (value: unknown, cb: (v: boolean) => void) => {
                        if (value === null || value === "") { cb(true); return; }
                        cb(Number(value) >= 0);
                    };
                }
                return cfg;
            }),
        []
    );

    const colHeaders = useMemo(() => EXCEL_COLUMNS.map((c) => c.header), []);
    const colWidths = useMemo(() => EXCEL_COLUMNS.map((c) => c.width), []);
    const gridData = useMemo(() => (data.length > 0 ? data : makeEmptyRows()), [data]);

    /* ──────────────────────────────────────────────────────────
       HOOK 1 — afterSelection → open editor on single click / focus
       ──────────────────────────────────────────────────────────
       KEY INSIGHT (why doc 7 worked):
         • Use beginEditing() not openEditor().
           beginEditing() is the public API that also positions the
           editor textarea correctly for numeric cells.
           openEditor() is lower-level and skips some setup steps.
         • Use setTimeout(..., 10) not requestAnimationFrame.
           rAF fires before the browser has processed the mouse-up
           event in some browsers, causing the editor to open then
           immediately close. A 10 ms delay clears that race.
    ────────────────────────────────────────────────────────── */
    const handleAfterSelection = useCallback(
        (r: number, c: number, r2: number, c2: number) => {
            // Multi-cell selection — leave it alone
            if (r !== r2 || c !== c2) return;

            // Programmatic move from Enter handler — skip this cycle
            if (suppressNextOpen.current) {
                suppressNextOpen.current = false;
                return;
            }

            const hot = hotRef.current?.hotInstance;
            if (!hot) return;

            // Already editing — nothing to do
            if (hot.getActiveEditor()?.isOpened()) return;

            setTimeout(() => {
                const instance = hotRef.current?.hotInstance;
                if (!instance) return;
                // Re-check: another event may have opened the editor in the gap
                if (instance.getActiveEditor()?.isOpened()) return;
                if (suppressNextOpen.current) return;

                // beginEditing() is the correct API for opening + positioning
                instance.getActiveEditor()?.beginEditing();
            }, 10);
        },
        []
    );

    /* ──────────────────────────────────────────────────────────
       HOOK 2 — beforeKeyDown → Enter moves to next field
       ──────────────────────────────────────────────────────────
       KEY INSIGHTS (why doc 7 worked):
         • e.stopPropagation() (not stopImmediatePropagation).
           stopImmediatePropagation also blocks our own setTimeout
           callback in some HOT versions.
         • finishEditing(true, false) — first arg `true` = save the
           value. false = do not revert. Doc 6 used (false, false)
           which discards the typed value.
         • enterMoves={{ row:0, col:0 }} disables HOT's own cursor
           move after Enter. Without this, HOT moves AND our handler
           moves — resulting in a double-jump.
         • setTimeout 50 ms for the beginEditing() call after
           selectCell. 10 ms is sometimes not enough for HOT to
           complete its internal state reset after finishEditing.
    ────────────────────────────────────────────────────────── */
    const handleBeforeKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key !== "Enter") return;

        const hot = hotRef.current?.hotInstance;
        if (!hot) return;

        const selected = hot.getSelectedLast();
        if (!selected) return;

        const [row, col] = selected;
        const totalRows = hot.countRows();

        // Block HOT's default Enter handling (cursor move + editor open)
        e.preventDefault();
        e.stopPropagation();

        // Save the current value — true = commit, false = don't revert
        hot.getActiveEditor()?.finishEditing(true, false);

        // Calculate destination: next column, or col 0 of next row at end
        let nextRow = row;
        let nextCol = col + 1;

        if (nextCol > LAST_COL_IDX) {
            nextCol = 0;
            nextRow = row + 1 < totalRows ? row + 1 : row;
        }

        // Tell afterSelection to skip the synthetic selection event
        suppressNextOpen.current = true;

        hot.selectCell(nextRow, nextCol);

        // Open editor on the destination cell.
        // 50 ms gives HOT time to finish finishEditing + selectCell internally.
        setTimeout(() => {
            const instance = hotRef.current?.hotInstance;
            if (!instance) return;
            suppressNextOpen.current = false;
            instance.getActiveEditor()?.beginEditing();
        }, 50);
    }, []);

    /* ──────────────────────────────────────────────────────────
       LOAD
    ────────────────────────────────────────────────────────── */
    const handleLoad = useCallback(() => {
        const hot = hotRef.current?.hotInstance;
        if (!hot) {
            toaster.create({ title: "Error", description: "Grid is not ready", type: "error", duration: 2000 });
            return;
        }
        // Commit any open editor before reading source data
        hot.getActiveEditor()?.finishEditing(true, false);

        const sourceRows = hot.getSourceData() as (string | number | null)[][];
        const parsed = sourceRows
            .map(parseGridRow)
            .filter((r): r is ExcelRowData => r !== null);

        if (!parsed.length) {
            toaster.create({ title: "Nothing to load", description: "Fill in at least one row before loading.", type: "warning", duration: 2000 });
            return;
        }
        onLoad(parsed);
    }, [onLoad]);

    /* ──────────────────────────────────────────────────────────
       CLEAR
    ────────────────────────────────────────────────────────── */
    const handleClear = useCallback(() => {
        const hot = hotRef.current?.hotInstance;
        if (!hot) return;
        hot.loadData(makeEmptyRows());
        onFileParsed?.([]);
    }, [onFileParsed]);

    /* ──────────────────────────────────────────────────────────
       FILE PROCESSING
    ────────────────────────────────────────────────────────── */
    const processFile = useCallback(async (file: File) => {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/csv",
        ];
        if (!validTypes.includes(file.type) && !["xlsx", "xls", "csv"].includes(ext)) {
            toaster.create({ title: "Invalid file", description: "Please upload an .xlsx, .xls, or .csv file", type: "error", duration: 2500 });
            return;
        }
        setIsParsing(true);
        try {
            const parsed = await parseXlsxFile(file);
            if (!parsed.length) {
                toaster.create({ title: "Empty file", description: "No data rows found.", type: "warning", duration: 2000 });
                return;
            }
            onFileParsed?.(parsed);
            toaster.create({ title: "File loaded", description: `${parsed.length} row(s) imported into the grid`, type: "success", duration: 2000 });
        } catch {
            toaster.create({ title: "Parse error", description: "Could not read the file. Check the format.", type: "error", duration: 2500 });
        } finally {
            setIsParsing(false);
        }
    }, [onFileParsed]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = "";
    }, [processFile]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback(() => setIsDragging(false), []);

    const styleColHeader = useCallback((_col: number, TH: HTMLTableCellElement) => {
        TH.style.fontSize = "11px";
        TH.style.fontWeight = "600";
        TH.style.background = "#EBF8FF";
        TH.style.color = "#2B6CB0";
        TH.style.textAlign = "center";
        TH.style.padding = "4px 6px";
        TH.style.whiteSpace = "nowrap";
    }, []);

    /* ──────────────────────────────────────────────────────────
       RENDER
    ────────────────────────────────────────────────────────── */
    return (
        <Box display="flex" flexDirection="column" gap={3} p={2}>

            {/* ── Drop zone ── */}
            <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                position="relative"
                border="2px dashed"
                borderColor={isDragging ? "teal.400" : "gray.200"}
                bg={isDragging ? "teal.50" : "gray.50"}
                rounded="lg"
                p={3}
                textAlign="center"
                transition="all 0.15s ease"
                cursor="pointer"
            >
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInput}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                />
                <Text fontSize="xs" color="gray.500" pointerEvents="none">
                    {isParsing ? "⏳ Parsing file…" : "📂 Drop an .xlsx / .xls / .csv here, or click to browse"}
                </Text>
                <Text fontSize="2xs" color="gray.400" mt={1} pointerEvents="none">
                    First row is treated as header and skipped automatically
                </Text>
            </Box>

            {/* ── Badge + hint ── */}
            <Box display="flex" alignItems="center" gap={2}>
                <Badge colorPalette={rowCount > 0 ? "teal" : "gray"} size="sm">
                    {rowCount} filled row{rowCount !== 1 ? "s" : ""}
                </Badge>
                <Text fontSize="2xs" color="gray.400">
                    Click any cell to edit · Enter moves to next field · Tab moves right · Ctrl+Z to undo
                </Text>
            </Box>

            {/* ── Grid ── */}
            <Box
                overflowX="auto"
                border="1px solid"
                borderColor="gray.200"
                rounded="md"
                onKeyDown={(e) => e.stopPropagation()}
            >
                <HotTable
                    ref={hotRef}
                    data={gridData}

                    /* ── Columns ── */
                    colHeaders={colHeaders}
                    columns={columns}
                    colWidths={colWidths}
                    rowHeaders={true}

                    /* ── Dimensions ── */
                    width="100%"
                    height="400px"
                    stretchH="last"
                    rowHeights={24}

                    licenseKey="non-commercial-and-evaluation"

                    /* ── Callbacks ── */
                    afterChange={onChange}
                    afterSelection={handleAfterSelection}
                    beforeKeyDown={handleBeforeKeyDown}

                    /* ── Enter behaviour ──
                         enterBeginsEditing : Enter on a selected-but-closed
                                              cell opens the editor immediately.
                         enterMoves {0,0}   : Disables HOT's built-in cursor
                                              move after Enter so our handler
                                              is the only thing that moves.    */
                    enterBeginsEditing={true}
                    enterMoves={{ row: 0, col: 0 }}

                    /* ── Tab moves right in same row ── */
                    tabMoves={{ row: 0, col: 1 }}

                    /* ── Navigation ── */
                    autoWrapRow={true}
                    autoWrapCol={true}
                    outsideClickDeselects={false}

                    /* ── Editing UX ── */
                    allowRemoveRow={true}
                    minSpareRows={3}

                    /* ── Features ── */
                    contextMenu={true}
                    copyPaste={true}
                    undo={true}
                    manualColumnResize={true}
                    manualRowResize={true}
                    manualColumnMove={false}

                    /* ── Validation ── */
                    invalidCellClassName="htInvalid"

                    /* ── Visual ── */
                    wordWrap={false}
                    afterGetColHeader={styleColHeader}
                />
            </Box>

            {/* ── Action bar ── */}
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                <Button size="xs" variant="ghost" colorPalette="red" fontSize="xs" onClick={handleClear}>
                    Clear Grid
                </Button>
                <Button
                    size="sm"
                    colorPalette="teal"
                    fontSize="xs"
                    onClick={handleLoad}
                    disabled={rowCount === 0}
                >
                    Load {rowCount > 0 ? `${rowCount} row${rowCount !== 1 ? "s" : ""}` : ""} into Table
                </Button>
            </Box>
        </Box>
    );
};

export default BarCodeExcel;