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
    id?: string;
    barcode?: string;
    isTaged?: boolean;

    grsweight: number;
    purchaseStoneWt: number;
    stoneWt: number;
    navaWt: number;
    salesStoneWt: number;
    diamondWt: number;
    size: string;
}

export type ExcelData = (string | number | boolean | null)[][];

/* ============================================================
   CONSTANTS
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
        {
            key: "grsweight",
            header: "WEIGHT",
            type: "numeric",
            numericFormat: { pattern: "0.000" },
            decimalScale: 3,
            width: 80,
        },
        {
            key: "purchaseStoneWt",
            header: "P. STN WT",
            type: "numeric",
            numericFormat: { pattern: "0.000" },
            decimalScale: 3,
            width: 100,
        },
        {
            key: "stoneWt",
            header: "STN WT",
            type: "numeric",
            numericFormat: { pattern: "0.000" },
            decimalScale: 3,
            width: 100,
        },
        {
            key: "navaWt",
            header: "NAVA WT",
            type: "numeric",
            numericFormat: { pattern: "0.000" },
            decimalScale: 3,
            width: 100,
        },
        {
            key: "salesStoneWt",
            header: "SALES STN WT",
            type: "numeric",
            numericFormat: { pattern: "0.000" },
            decimalScale: 3,
            width: 100,
            readOnly: true,
        },
        {
            key: "diamondWt",
            header: "DIAMOND WT",
            type: "numeric",
            numericFormat: { pattern: "0.000" },
            decimalScale: 3,
            width: 90,
        },
        {
            key: "size",
            header: "SIZE",
            type: "text",
            width: 60,
        },
    ];

/* ============================================================
   HIDDEN COLUMN INDEXES
   ============================================================ */

const ID_INDEX = 7;
const BARCODE_INDEX = 8;
const ISTAGED_INDEX = 9;

const STONE_WT_INDEX = 2;
const NAVA_WT_INDEX = 3;
const SALES_STONE_WT_INDEX = 4;

/* ============================================================
   EMPTY ROW
   ============================================================ */

const EMPTY_ROW: (string | number | boolean | null)[] = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,

    // hidden
    null,
    null,
    null,
];

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

const calculateSalesStoneWt = (
    stoneWt: number,
    navaWt: number
): number => {
    return safeNum(stoneWt + navaWt, 3);
};

/* ============================================================
   PARSE GRID ROW
   ============================================================ */

const parseGridRow = (
    row: (string | number | boolean | null)[]
): ExcelRowData | null => {

    const visibleCells = row.slice(0, 7);

    if (
        visibleCells.every(
            (cell) => cell === null || cell === ""
        )
    ) {
        return null;
    }

    const stoneWt = safeNum(row[STONE_WT_INDEX], 3);
    const navaWt = safeNum(row[NAVA_WT_INDEX], 3);

    return {
        id: String(row[ID_INDEX] ?? ""),
        barcode: String(row[BARCODE_INDEX] ?? ""),
        isTaged: Boolean(row[ISTAGED_INDEX]),

        grsweight: safeNum(row[0], 3),
        purchaseStoneWt: safeNum(row[1], 3),
        stoneWt,
        navaWt,
        salesStoneWt: calculateSalesStoneWt(stoneWt, navaWt),
        diamondWt: safeNum(row[5], 3),
        size: String(row[6] ?? ""),
    };
};

/* ============================================================
   EXCEL SHEET PARSER
   ============================================================ */

const sheetToExcelData = (
    worksheet: XLSX.WorkSheet
): ExcelData => {

    const rawRows: (string | number | boolean | null)[][] =
        XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null,
            raw: true,
        });

    if (rawRows.length === 0) {
        return makeEmptyRows();
    }

    const dataRows = rawRows.slice(1);

    return dataRows.map((row) => {

        const stoneWt = safeNum(row[2], 3);
        const navaWt = safeNum(row[3], 3);

        return [
            row[0] ?? null,
            row[1] ?? null,
            row[2] ?? null,
            row[3] ?? null,
            calculateSalesStoneWt(stoneWt, navaWt),
            row[5] ?? null,
            row[6] ?? null,

            // hidden
            row[7] ?? null,
            row[8] ?? null,
            row[9] ?? null,
        ];
    });
};

/* ============================================================
   PROPS
   ============================================================ */

type BarCodeExcelProps = {
    data: ExcelData;
    onChange: (
        changes: CellChange[] | null,
        source: ChangeSource
    ) => void;
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

    console.log(data,'exceldatafromtable');

    const hotRef = useRef<HotTableClass>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [internalData, setInternalData] =
        useState<ExcelData>(() =>
            data.length > 0 ? data : makeEmptyRows()
        );

    const [fileName, setFileName] = useState("");
    const [uploadError, setUploadError] = useState("");

    /* ============================================================
       SYNC
       ============================================================ */

    useEffect(() => {
        setInternalData(
            data.length > 0 ? data : makeEmptyRows()
        );
    }, [data]);

    /* ============================================================
       COLUMNS
       ============================================================ */

    const columns = useMemo(
        () => [
            ...EXCEL_COLUMNS.map((col) => ({
                type:
                    col.type === "numeric"
                        ? ("numeric" as const)
                        : ("text" as const),

                numericFormat:
                    col.type === "numeric"
                        ? col.numericFormat
                        : undefined,

                readOnly: col.readOnly ?? false,
            })),

            // hidden id
            {
                type: "text" as const,
                readOnly: true,
            },

            // hidden barcode
            {
                type: "text" as const,
                readOnly: true,
            },

            // hidden isTaged
            {
                type: "text" as const,
                readOnly: true,
            },
        ],
        []
    );

    const colHeaders = useMemo(
        () => [
            ...EXCEL_COLUMNS.map((c) => c.header),

            "ID",
            "BARCODE",
            "ISTAGED",
        ],
        []
    );

    const colWidths = useMemo(
        () => [
            ...EXCEL_COLUMNS.map((c) => c.width),

            1,
            1,
            1,
        ],
        []
    );
    /* ============================================================
       AFTER CHANGE
       ============================================================ */

    const handleAfterChange = useCallback(
        (
            changes: CellChange[] | null,
            source: ChangeSource
        ) => {

            if (source === "loadData") return;

            if (
                changes &&
                hotRef.current?.hotInstance
            ) {

                const hot = hotRef.current.hotInstance;

                hot.batch(() => {

                    changes.forEach(([row, prop]) => {

                        const col =
                            typeof prop === "number"
                                ? prop
                                : hot.propToCol(prop as string);

                        if (
                            col === STONE_WT_INDEX ||
                            col === NAVA_WT_INDEX
                        ) {

                            const stoneWt = safeNum(
                                hot.getDataAtCell(
                                    row as number,
                                    STONE_WT_INDEX
                                ),
                                3
                            );

                            const navaWt = safeNum(
                                hot.getDataAtCell(
                                    row as number,
                                    NAVA_WT_INDEX
                                ),
                                3
                            );

                            hot.setDataAtCell(
                                row as number,
                                SALES_STONE_WT_INDEX,
                                calculateSalesStoneWt(
                                    stoneWt,
                                    navaWt
                                ),
                                "auto"
                            );
                        }
                    });
                });
            }

            onChange(changes, source);
        },
        [onChange]
    );

    /* ============================================================
       FILE CHANGE
       ============================================================ */

    const handleFileChange = useCallback(
        (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {

            const file = e.target.files?.[0];

            if (!file) return;

            setUploadError("");
            setFileName(file.name);

            const reader = new FileReader();

            reader.onload = (evt) => {

                try {

                    const buf =
                        evt.target?.result as ArrayBuffer;

                    const workbook = XLSX.read(buf, {
                        type: "array",
                    });

                    const sheet =
                        workbook.Sheets[
                        workbook.SheetNames[0]
                        ];

                    const parsed =
                        sheetToExcelData(sheet);

                    setInternalData(parsed);

                    onFileParsed?.(parsed);

                } catch {

                    setUploadError(
                        "Failed to parse file."
                    );
                }
            };

            reader.readAsArrayBuffer(file);

            e.target.value = "";
        },
        [onFileParsed]
    );

    /* ============================================================
       CLEAR
       ============================================================ */

    const handleClear = useCallback(() => {

        const blank = makeEmptyRows();

        setFileName("");
        setUploadError("");
        setInternalData(blank);

        onFileParsed?.(blank);

    }, [onFileParsed]);

    /* ============================================================
       GET PARSED DATA
       ============================================================ */

    const getParsedData = useCallback((): ExcelRowData[] => {

        const sourceData =
            hotRef.current?.hotInstance
                ? (hotRef.current.hotInstance.getData() as ExcelData)
                : internalData;

        return sourceData.reduce<ExcelRowData[]>(
            (acc, row) => {

                const item = parseGridRow(row);

                if (item) {
                    acc.push(item);
                }

                return acc;

            },
            []
        );

    }, [internalData]);

    /* ============================================================
       LOAD
       ============================================================ */

    const handleLoad = useCallback(() => {

        const parsed = getParsedData();

        if (!parsed.length) {
            alert("No valid rows found.");
            return;
        }

        onLoad(parsed);

    }, [getParsedData, onLoad]);

    /* ============================================================
       UPDATE
       ============================================================ */

    const handleUpdate = useCallback(() => {

        const parsed = getParsedData();

        console.log(parsed , 'barcodeparsedData');

        if (!parsed.length) {
            alert("No valid rows found.");
            return;
        }

        onUpdate?.(parsed);

    }, [getParsedData, onUpdate]);

    /* ============================================================
       RENDER
       ============================================================ */

    return (
        <Box display="flex" flexDirection="column" gap={3} p={2}>

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
                    onClick={handleClear}
                >
                    <Icon as={Trash2} w={4} h={4} mr={1} />
                    Clear Grid
                </Button>

                {fileName ? (
                    <Text fontSize="sm">{fileName}</Text>
                ) : (
                    <Text fontSize="sm" color="gray.400">
                        No file selected
                    </Text>
                )}

                {uploadError && (
                    <Text fontSize="xs" color="red.500">
                        {uploadError}
                    </Text>
                )}
            </Box>

            <Box
                overflowX="auto"
                border="1px solid"
                borderColor="gray.200"
                rounded="md"
            >

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

                    hiddenColumns={{
                        columns: [7, 8, 9],
                        indicators: false,
                    }}
                />
            </Box>

            <Box
                display="flex"
                justifyContent="flex-end"
                gap={2}
            >

                {hasExistingRows && onUpdate && (
                    <Button
                        size="sm"
                        colorPalette="orange"
                        onClick={handleUpdate}
                    >
                        Update Table
                    </Button>
                )}

                <Button
                    size="sm"
                    colorPalette="teal"
                    onClick={handleLoad}
                >
                    {hasExistingRows
                        ? "Load as New"
                        : "Load into Table"}
                </Button>

            </Box>
        </Box>
    );
};

export default BarCodeExcel;