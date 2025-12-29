import * as XLSX from "xlsx-js-style";

type Column = {
    key: string;
    label: string;
    align?: "start" | "center" | "end";
    allowTotal?: boolean;
    isNumeric?: boolean;
};

type Settings = {
    headerBg: string;
    headerColor: string;
    fontSize: "sm" | "md" | "lg";
    showTotals?: boolean;
    totalColumns?: string[];
};

export const exportToStyledExcel = (
    data: any[],
    columns: Column[],
    settings: Settings,
    fileName: string
) => {
    if (!data?.length) return;

    const fontSizeMap = { sm: 11, md: 13, lg: 15 };
    const fontSize = fontSizeMap[settings.fontSize] || 13;

    const wsData: any[][] = [];

    /** HEADER ROW */
    wsData.push(columns.map(col => col.label));

    /** DATA ROWS */
    data.forEach((row, index) => {
        wsData.push(
            columns.map(col =>
                col.key === "sno" ? index + 1 : row[col.key] ?? ""
            )
        );
    });

    /** TOTAL ROW */
    /** TOTAL ROW */
    if (settings.showTotals && settings.totalColumns?.length) {
        const totalRow = columns.map((col, index) => {
            // 👈 First column shows TOTAL label
            if (index === 0) return "TOTAL";

            // 👈 Columns allowed for totals
            if (settings.totalColumns!.includes(col.key)) {
                return data.reduce(
                    (sum, row) => sum + Number(row[col.key] || 0),
                    0
                );
            }

            return "";
        });

        wsData.push(totalRow);
    }


    const ws = XLSX.utils.aoa_to_sheet(wsData);

    /** HEADER STYLING */
    columns.forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
        ws[cellRef].s = {
            fill: { fgColor: { rgb: settings.headerBg.replace("#", "") } },
            font: {
                bold: true,
                color: { rgb: settings.headerColor.replace("#", "") },
                sz: fontSize,
            },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
            },
        };
    });

    /** BODY STYLING + ALIGNMENT */
    for (let r = 1; r < wsData.length; r++) {
        columns.forEach((col, c) => {
            const ref = XLSX.utils.encode_cell({ r, c });
            if (!ws[ref]) return;

            ws[ref].s = {
                font: { sz: fontSize },
                alignment: {
                    horizontal:
                        col.align === "end"
                            ? "right"
                            : col.align === "center"
                                ? "center"
                                : "left",
                    vertical: "center",
                },
                border: {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" },
                },
            };
        });
    }

    /** AUTO COLUMN WIDTH */
    ws["!cols"] = columns.map(() => ({ wch: 18 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    XLSX.writeFile(wb, `${fileName}.xlsx`);
};
