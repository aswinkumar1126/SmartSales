import * as XLSX from "xlsx-js-style";

type Column = {
    key: string;
    label: string;
    align?: "start" | "center" | "end";
    allowTotal?: boolean;
    isNumeric?: boolean;
    decimalScale?: number; // Add decimal scale support
    subColumns?: Column[];
};

type Settings = {
    headerBg: string;
    headerColor: string;
    fontSize: "xs" | "sm" | "md" | "lg";
    showTotals?: boolean;
    totalColumns?: string[];
    showSno?: boolean;
};

// Helper functions for nested headers
const hasGroups = (columns: Column[]): boolean => {
    return columns.some(col => col.subColumns && col.subColumns.length > 0);
};

const getLeafColumns = (columns: Column[]): Column[] => {
    const leaves: Column[] = [];
    columns.forEach(col => {
        if (col.subColumns && col.subColumns.length > 0) {
            leaves.push(...col.subColumns);
        } else {
            leaves.push(col);
        }
    });
    return leaves;
};

const getNestedHeaders = (columns: Column[]) => {
    if (!hasGroups(columns)) {
        return [columns.map((c) => c.label)];
    }

    const topRow: (string | { label: string; colspan: number })[] = [];
    const subRow: string[] = [];

    for (const col of columns) {
        const visibleSubs = col.subColumns ?? [];

        if (visibleSubs.length > 0) {
            topRow.push({
                label: col.label,
                colspan: visibleSubs.length,
            });

            for (const sub of visibleSubs) {
                subRow.push(sub.label ?? "");
            }
        } else {
            topRow.push({
                label: col.label,
                colspan: 1,
            });
            subRow.push("");
        }
    }

    return [topRow, subRow];
};

// Helper function to format number with decimal scale
const formatNumberWithScale = (value: number, decimalScale: number = 2): string | number => {
    if (isNaN(value)) return "";
    if (decimalScale === 0) return Math.round(value).toString();
    return value.toFixed(decimalScale);
};

export const exportToStyledExcel = (
    data: any[],
    columns: Column[],
    settings: Settings,
    fileName: string,
    rowStyleGetter?: (row: any) => React.CSSProperties

) => {
    if (!data?.length) return;

    console.log(data,'exceldatatoprint');

    const fontSizeMap = { xs: 9, sm: 11, md: 13, lg: 15 };
    const fontSize = fontSizeMap[settings.fontSize] || 13;

    const wsData: any[][] = [];

    const hasGroupedColumns = hasGroups(columns);
    const leafColumns = getLeafColumns(columns);
    const nestedHeaders = getNestedHeaders(columns);

    // Calculate total columns count (including S.No if enabled)
    const totalColsCount = leafColumns.length + (settings.showSno ? 1 : 0);

    /** HEADER ROWS with nested headers support */
    if (hasGroupedColumns && nestedHeaders[0].length > 0) {
        // Top header row (parent groups)
        const topRow: any[] = [];
        if (settings.showSno) topRow.push("S.No");

        for (const header of nestedHeaders[0]) {
            if (typeof header === 'string') {
                topRow.push(header);
            } else {
                topRow.push(header.label);
                // Add empty cells for colspan (will be merged later)
                for (let i = 1; i < header.colspan; i++) {
                    topRow.push("");
                }
            }
        }
        wsData.push(topRow);

        // Sub header row (child columns)
        const subRow: any[] = [];
        if (settings.showSno) subRow.push("");
        subRow.push(...nestedHeaders[1]);
        wsData.push(subRow);
    } else {
        // Single header row
        const headerRow: any[] = [];
        if (settings.showSno) headerRow.push("S.No");
        headerRow.push(...columns.map(col => col.label));
        wsData.push(headerRow);
    }

    /** DATA ROWS */
    data.forEach((row, index) => {
        const dataRow: any[] = [];
        if (settings.showSno) dataRow.push(index + 1);

        leafColumns.forEach(col => {
            let value = row[col.key] ?? "";
            // Format numeric values with decimal scale for data rows
            if (col.isNumeric && value !== "" && !isNaN(Number(value))) {
                const decimalScale = col.decimalScale || 0;
                value = formatNumberWithScale(Number(value), decimalScale);
            }
            dataRow.push(value);
        });

        wsData.push(dataRow);
    });

    /** TOTAL ROW - Fixed to avoid extra column */
    if (settings.showTotals && settings.totalColumns?.length) {
        const totalRow: any[] = [];

        leafColumns.forEach((col, index) => {

            // First column shows TOTAL label
            if (index === 0) {
                totalRow.push("TOTAL");
                return;
            }

            // Calculate totals only for allowed columns
            if (
                settings.totalColumns!.includes(col.key) &&
                col.allowTotal
            ) {
                const total = data.reduce((sum, row) => {
                    const value = Number(row[col.key] || 0);
                    return sum + (isNaN(value) ? 0 : value);
                }, 0);

                const decimalScale =
                    col.decimalScale || (col.isNumeric ? 2 : 0);

                totalRow.push(
                    formatNumberWithScale(total, decimalScale)
                );
            } else {
                totalRow.push("");
            }
        });

        // Add S.No column support
        if (settings.showSno) {
            totalRow.unshift("");
        }

        wsData.push(totalRow);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Track merged cells for nested headers
    const merges: XLSX.Range[] = [];

    if (hasGroupedColumns && nestedHeaders[0].length > 0) {
        let colIndex = settings.showSno ? 1 : 0;

        for (const header of nestedHeaders[0]) {
            if (typeof header !== 'string' && header.colspan > 1) {
                // Merge cells for parent headers that span multiple columns
                merges.push({
                    s: { r: 0, c: colIndex },
                    e: { r: 0, c: colIndex + header.colspan - 1 }
                });
                colIndex += header.colspan;
            } else if (typeof header !== 'string') {
                colIndex += header.colspan;
            } else {
                colIndex++;
            }
        }
    }

    ws['!merges'] = merges;

    /** HEADER STYLING (handles both top and sub headers) */
    const headerRowsCount = hasGroupedColumns ? 2 : 1;

    for (let r = 0; r < headerRowsCount; r++) {
        const colsToStyle = settings.showSno ? totalColsCount : leafColumns.length;

        for (let c = 0; c < colsToStyle; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            if (!ws[cellRef]) continue;

            ws[cellRef].s = {
                fill: { fgColor: { rgb: settings.headerBg.replace("#", "") } },
                font: {
                    bold: true,
                    color: { rgb: settings.headerColor.replace("#", "") },
                    sz: fontSize,
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    wrapText: true
                },
                border: {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" },
                },
            };
        }
    }

    /** BODY STYLING + ALIGNMENT */
    /** BODY STYLING + ALIGNMENT */
    const startRow = headerRowsCount;

    for (let r = startRow; r < wsData.length; r++) {
        let colOffset = 0;

        // Handle S.No column
        if (settings.showSno) {
            const snoRef = XLSX.utils.encode_cell({ r, c: 0 });

            if (ws[snoRef]) {
                ws[snoRef].s = {
                    font: { sz: fontSize },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    border: {
                        top: { style: "thin" },
                        bottom: { style: "thin" },
                        left: { style: "thin" },
                        right: { style: "thin" },
                    },
                };
            }

            colOffset = 1;
        }

        const isTotalRow =
            settings.showTotals &&
            settings.totalColumns?.length &&
            r === wsData.length - 1;

        // Actual data row index
        const dataIndex = r - startRow;
        console.log("rowStyleGetter", rowStyleGetter);
        console.log("first row", data?.[0]);

        const rowData =
            !isTotalRow && dataIndex >= 0 && dataIndex < data.length
                ? data[dataIndex]
                : null;
        console.log("rowData", rowData);
        const customStyle = rowData
            ? rowStyleGetter?.(rowData)
            : undefined;
        console.log("customStyle", customStyle);
        const bgColor =
            typeof customStyle?.background === "string" &&
                customStyle.background.startsWith("#")
                ? customStyle.background.replace("#", "")
                : undefined;

        const textColor =
            typeof customStyle?.color === "string" &&
                customStyle.color.startsWith("#")
                ? customStyle.color.replace("#", "")
                : undefined;

        const isBold =
            customStyle?.fontWeight === "700" ||
            customStyle?.fontWeight === 700 ||
            customStyle?.fontWeight === "600" ||
            customStyle?.fontWeight === 600 ||
            isTotalRow;

        leafColumns.forEach((col, c) => {
            const ref = XLSX.utils.encode_cell({
                r,
                c: c + colOffset,
            });

            if (!ws[ref]) return;

            const cellValue = ws[ref]?.v;

            const isNumericValue =
                !isNaN(parseFloat(String(cellValue))) &&
                isFinite(Number(cellValue));

            let horizontalAlign = "left";

            if (col.align === "end") horizontalAlign = "right";
            else if (col.align === "center") horizontalAlign = "center";
            else if (col.align === "start") horizontalAlign = "left";
            else if (col.isNumeric || isNumericValue)
                horizontalAlign = "right";

            ws[ref].s = {
                font: {
                    sz: fontSize,
                    bold: isBold,
                    ...(textColor
                        ? {
                            color: {
                                rgb: textColor,
                            },
                        }
                        : {}),
                },

                alignment: {
                    horizontal: horizontalAlign,
                    vertical: "center",
                },

                border: {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" },
                },

                ...(bgColor
                    ? {
                        fill: {
                            fgColor: {
                                rgb: bgColor,
                            },
                        },
                    }
                    : isTotalRow
                        ? {
                            fill: {
                                fgColor: {
                                    rgb: "F1F5F9",
                                },
                            },
                        }
                        : {}),
            };
        });
    }

    /** AUTO COLUMN WIDTH with better calculation */
    ws["!cols"] = [];

    // Calculate column widths based on content
    const calculateColumnWidth = (columnData: any[], headerText: string, minWidth: number = 10, maxWidth: number = 50) => {
        let maxLength = headerText.length;

        columnData.forEach(cell => {
            if (cell && cell.toString) {
                maxLength = Math.max(maxLength, cell.toString().length);
            }
        });

        return Math.min(Math.max(maxLength + 2, minWidth), maxWidth);
    };

    // Build column data arrays for width calculation
    const columnDataArrays: any[][] = [];
    leafColumns.forEach((col, idx) => {
        const colData = data.map(row => {
            let value = row[col.key] ?? "";
            if (col.isNumeric && value !== "" && !isNaN(Number(value))) {
                const decimalScale = col.decimalScale || 2;
                value = formatNumberWithScale(Number(value), decimalScale);
            }
            return value;
        });
        columnDataArrays.push(colData);
    });

    // Set widths for each column
    if (settings.showSno) {
        ws["!cols"].push({ wch: 6 });
    }

    ws["!cols"] = ws["!cols"] || [];

    leafColumns.forEach((col, idx) => {
        const headerText = col.label;
        const colData = columnDataArrays[idx];
        const width = calculateColumnWidth(colData, headerText, 12, 40);

        ws["!cols"]!.push({ wch: width });
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    XLSX.writeFile(wb, `${fileName}.xlsx`);
};