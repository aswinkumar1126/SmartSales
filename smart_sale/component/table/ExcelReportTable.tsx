"use client";

import { HotTable } from "@handsontable/react";
import type { CellChange, ChangeSource } from "handsontable/common";
import { HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import {
    useRef,
    useState,
    useCallback,
    useMemo,
    useEffect,
    ReactNode,
} from "react";
import Handsontable from "handsontable";
import type { ColumnSettings } from "handsontable/settings";

registerAllModules();

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ColumnDef {
    data: string;
    title: string;
    type?: "text" | "numeric" | "date" | "checkbox" | "dropdown";
    width?: number;
    readOnly?: boolean;
    source?: string[];
    hidden?: boolean;
    align?: "left" | "center" | "right";
    headerBg?: string;
    headerColor?: string;
    subColumns?: SubColumnDef[];
    showTotal?: boolean;
    renderTotal?: (allData: Record<string, unknown>[]) => ReactNode;
    decimalScale?:number;
}

export interface SubColumnDef {
    data: string;
    title: string;
    type?: "text" | "numeric" | "date" | "checkbox" | "dropdown";
    width?: number;
    readOnly?: boolean;
    source?: string[];
    hidden?: boolean;
    align?: "left" | "center" | "right";
    headerBg?: string;
    headerColor?: string;
    showTotal?: boolean;
    renderTotal?: (allData: Record<string, unknown>[]) => ReactNode;
    decimalScale?: number;
    
}

export type TotalsConfig = {
    enabled: boolean;
    label?: string;
    bg?: string;
    color?: string;
    calculate?: (data: Record<string, unknown>[]) => Record<string, unknown>;
};

export type PaginationConfig = {
    enabled: boolean;
    pageSize?: number;
    pageSizeOptions?: { label: string; value: string }[];
    showPageSizeSelector?: boolean;
    showPageNumbers?: boolean;
    showTotalCount?: boolean;
    onPageChange?: (page: number, pageSize: number) => void;
};

export interface DataTableProps {
    data?: Record<string, unknown>[];
    columnDefs: ColumnDef[];
    title?: string;
    onChange?: (data: Record<string, unknown>[]) => void;
    height?: string;
    totals?: TotalsConfig;
    pagination?: PaginationConfig;
    showRowControls?: boolean;
    showSearch?: boolean;
    emptyText?: string;
    
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenLeaves(defs: ColumnDef[]): (ColumnDef | SubColumnDef)[] {
    const leaves: (ColumnDef | SubColumnDef)[] = [];
    for (const col of defs) {
        if (col.hidden) continue;
        if (col.subColumns && col.subColumns.length > 0) {
            for (const sub of col.subColumns) {
                if (!sub.hidden) leaves.push(sub);
            }
        } else {
            leaves.push(col);
        }
    }
    return leaves;
}

function autoSum(
    data: Record<string, unknown>[],
    leaves: (ColumnDef | SubColumnDef)[]
): Record<string, unknown> {
    const totals: Record<string, unknown> = {};
    for (const col of leaves) {
        const leaf = col as ColumnDef & SubColumnDef;
        if (leaf.type === "numeric" || leaf.showTotal) {
            totals[col.data] = data.reduce((acc, row) => {
                const v = row[col.data];
                return acc + (typeof v === "number" ? v : parseFloat(String(v)) || 0);
            }, 0);
        }
    }
    return totals;
}

function formatTotalValue(v: unknown): string {
    if (v === undefined || v === null) return "";
    if (typeof v === "number") {
        return Number.isInteger(v) ? String(v) : v.toFixed(2);
    }
    return String(v);
}

// ─── Pagination ────────────────────────────────────────────────────────────────

interface PaginationBarProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalRows: number;
    pageSizeOptions: { label: string; value: string }[];
    showPageSizeSelector: boolean;
    showPageNumbers: boolean;
    showTotalCount: boolean;
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
}

function PaginationBar({
    currentPage,
    totalPages,
    pageSize,
    totalRows,
    pageSizeOptions,
    showPageSizeSelector,
    showPageNumbers,
    showTotalCount,
    onPageChange,
    onPageSizeChange,
}: PaginationBarProps) {
    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalRows);

    const pageNums = useMemo(() => {
        const nums: number[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) nums.push(i);
        } else if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) nums.push(i);
            nums.push(-1, totalPages);
        } else if (currentPage >= totalPages - 3) {
            nums.push(1, -1);
            for (let i = totalPages - 4; i <= totalPages; i++) nums.push(i);
        } else {
            nums.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -2, totalPages);
        }
        return nums;
    }, [currentPage, totalPages]);

    const btnBase: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 30,
        height: 30,
        padding: "0 6px",
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 6,
        border: "0.5px solid #d0d5dd",
        cursor: "pointer",
        background: "#fff",
        color: "#344054",
        fontFamily: "inherit",
        transition: "background 0.1s",
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderTop: "1px solid #f2f4f7",
                background: "#fcfcfd",
                flexWrap: "wrap",
                gap: 8,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {showTotalCount && (
                    <span style={{ fontSize: 12, color: "#667085" }}>
                        Showing{" "}
                        <strong style={{ color: "#344054" }}>
                            {startIdx}–{endIdx}
                        </strong>{" "}
                        of <strong style={{ color: "#344054" }}>{totalRows}</strong> rows
                    </span>
                )}
                {showPageSizeSelector && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, color: "#667085" }}>Rows</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            style={{
                                height: 28,
                                fontSize: 12,
                                border: "0.5px solid #d0d5dd",
                                borderRadius: 5,
                                padding: "0 6px",
                                background: "#fff",
                                color: "#344054",
                                cursor: "pointer",
                                fontFamily: "inherit",
                            }}
                        >
                            {pageSizeOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {showPageNumbers && totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{ ...btnBase, opacity: currentPage === 1 ? 0.4 : 1 }}
                    >
                        ‹
                    </button>
                    {pageNums.map((n, i) =>
                        n < 0 ? (
                            <span
                                key={`ellipsis-${i}`}
                                style={{ fontSize: 12, color: "#98a2b3", padding: "0 2px" }}
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={n}
                                onClick={() => onPageChange(n)}
                                style={{
                                    ...btnBase,
                                    background: currentPage === n ? "#1d4ed8" : "#fff",
                                    color: currentPage === n ? "#fff" : "#344054",
                                    borderColor: currentPage === n ? "#1d4ed8" : "#d0d5dd",
                                }}
                            >
                                {n}
                            </button>
                        )
                    )}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                            ...btnBase,
                            opacity: currentPage === totalPages ? 0.4 : 1,
                        }}
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function DataTable({
    data = [],
    columnDefs,
    title = "Data Table",
    onChange,
    height = "360px",
    totals,
    pagination,
    showRowControls = true,
    showSearch = true,
    emptyText = "No records found",
}: DataTableProps) {

    console.log(data,'exceldata');

    

    const hotRef = useRef<HotTableClass>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(pagination?.pageSize ?? 25);

    const pageSizeOptions = pagination?.pageSizeOptions ?? [
        { label: "10", value: "10" },
        { label: "25", value: "25" },
        { label: "50", value: "50" },
        { label: "100", value: "100" },
    ];

    const isPaginationEnabled = pagination?.enabled ?? false;
    const isTotalsEnabled = totals?.enabled ?? false;

    // ── Leaves ────────────────────────────────────────────────────────────────
    const leaves = useMemo(() => flattenLeaves(columnDefs), [columnDefs]);

    const hotColumns = useMemo<ColumnSettings[]>(
        () =>
            leaves.map(
                (c): ColumnSettings => ({
                    data: c.data,
                    type: c.type ?? "text",
                    readOnly: c.readOnly ?? false,

                    ...(("source" in c && c.source)
                        ? { source: c.source }
                        : {}),

                    ...(c.type === "numeric"
                        ? {
                            numericFormat: {
                                // fixed decimals
                                pattern: `0.${"0".repeat(c.decimalScale ?? 2)}`,
                            },

                            renderer: (
                                instance,
                                td,
                                row,
                                col,
                                prop,
                                value,
                                cellProperties
                            ) => {
                                // preserve numeric alignment/styles
                                Handsontable.renderers.NumericRenderer(
                                    instance,
                                    td,
                                    row,
                                    col,
                                    prop,
                                    value,
                                    cellProperties
                                );

                                // hide only zero values
                                if (Number(value) === 0) {
                                    td.innerText = "";
                                }

                                return td;
                            },
                        }
                        : {}),
                })
            ),
        [leaves]
    );

    const colWidths = useMemo(() => leaves.map((c) => c.width ?? 140), [leaves]);

    // ── Nested headers ────────────────────────────────────────────────────────
    const hasGroups = columnDefs.some(
        (c) => !c.hidden && c.subColumns && c.subColumns.length > 0
    );

    const nestedHeaders = useMemo(() => {
        if (!hasGroups) {
            return [leaves.map((c) => c.title)];
        }

        const topRow: (string | { label: string; colspan: number })[] = [];
        const subRow: string[] = [];

        for (const col of columnDefs) {
            if (col.hidden) continue;

            const visibleSubs = col.subColumns?.filter((s) => !s.hidden) ?? [];

            if (visibleSubs.length > 0) {
                topRow.push({
                    label: col.title,
                    colspan: visibleSubs.length,
                });

                // push sub headers
                for (const sub of visibleSubs) {
                    subRow.push(sub.title ?? "");
                }
            } else {
                topRow.push({
                    label: col.title,
                    colspan: 1,
                });

                // no sub columns → empty cell
                subRow.push("");
            }
        }

        return [topRow, subRow];
    }, [columnDefs, hasGroups]);

    // ── Pagination ────────────────────────────────────────────────────────────
    const totalRows = data.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

    const pagedData = useMemo(() => {
        if (!isPaginationEnabled) return data;
        const start = (currentPage - 1) * pageSize;
        return data.slice(start, start + pageSize);
    }, [data, isPaginationEnabled, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [totalRows, pageSize]);

    // ── Totals — injected as an extra read-only row at the bottom of pagedData
    //    This means HotTable owns the row, so column widths always match.
    // ─────────────────────────────────────────────────────────────────────────
    const calculatedTotals = useMemo(() => {
        if (!isTotalsEnabled) return {};
        if (totals?.calculate) return totals.calculate(data);
        return autoSum(data, leaves);
    }, [data, leaves, isTotalsEnabled, totals]);

    // The actual data array fed to HotTable — real rows + optional totals sentinel
    const TOTALS_SENTINEL = "__TOTALS__";

    const hotData = useMemo(() => {
        if (!isTotalsEnabled || data.length === 0) return pagedData;

        // Build a totals row as a plain object matching leaf keys
        const totalsRow: Record<string, unknown> = { [TOTALS_SENTINEL]: true };
        leaves.forEach((col, idx) => {
            const leaf = col as ColumnDef & SubColumnDef;
            if (leaf.renderTotal) {
                // renderTotal returns ReactNode — we store the formatted string
                totalsRow[col.data] = formatTotalValue(calculatedTotals[col.data]);
            } else {
                const v = calculatedTotals[col.data];
                totalsRow[col.data] = v !== undefined ? formatTotalValue(v) : "";
            }
            // First leaf gets the label
            if (idx === 0) {
                totalsRow[col.data] = totals?.label ?? "Total";
            } else if (leaf.renderTotal) {
                totalsRow[col.data] = formatTotalValue(calculatedTotals[col.data]);
            } else {
                totalsRow[col.data] =
                    calculatedTotals[col.data] !== undefined
                        ? formatTotalValue(calculatedTotals[col.data])
                        : "";
            }
        });

        return [...pagedData, totalsRow];
    }, [pagedData, isTotalsEnabled, data.length, calculatedTotals, leaves, totals]);

    // ── afterRenderer — style the totals row differently ─────────────────────
    const handleAfterRenderer = useCallback(
        (
            TD: HTMLTableCellElement,
            row: number,
            _col: number,
            _prop: string | number,
            _value: unknown,
            cellProperties: Record<string, unknown>
        ) => {
            if (!isTotalsEnabled || data.length === 0) return;
            const isTotalsRow = row === hotData.length - 1 &&
                (hotData[row] as Record<string, unknown>)?.[TOTALS_SENTINEL];
            if (!isTotalsRow) return;

            const bg ="#a50808";
            const color = totals?.color ?? "#222";
            TD.style.backgroundColor = bg;
            TD.style.color = color;
            TD.style.fontWeight = "700";
            TD.style.fontSize = "12px";
            TD.style.borderTop = "2px solid #c5cfe8";
        },
        [isTotalsEnabled, data.length, hotData, totals]
    );

    // Make totals row fully read-only via cells callback
    const cellsCallback = useCallback(
        (row: number, _col: number) => {
            if (!isTotalsEnabled || data.length === 0) return {};
            const isTotalsRow =
                row === hotData.length - 1 &&
                (hotData[row] as Record<string, unknown>)?.[TOTALS_SENTINEL];
            if (isTotalsRow) return { readOnly: true };
            return {};
        },
        [isTotalsEnabled, data.length, hotData]
    );

    // ── Also style the row header cell of the totals row ─────────────────────
    const handleAfterGetRowHeader = useCallback(
        (row: number, TH: HTMLTableCellElement) => {
            if (!isTotalsEnabled || data.length === 0) return;
            const isTotalsRow =
                row === hotData.length - 1 &&
                (hotData[row] as Record<string, unknown>)?.[TOTALS_SENTINEL];
            if (!isTotalsRow) return;
            TH.style.background = totals?.bg ?? "#f0f4ff";
            TH.style.color = totals?.color ?? "#1e3a5f";
            TH.style.fontWeight = "700";
            TH.style.fontSize = "10px";
            TH.style.borderTop = "2px solid #c5cfe8";
            TH.innerHTML = "Σ";
        },
        [isTotalsEnabled, data.length, hotData, totals]
    );

    // ── Sync ──────────────────────────────────────────────────────────────────
    const syncData = useCallback(() => {
        const hot = hotRef.current?.hotInstance;
        if (!hot) return;
        const raw = hot.getData() as unknown[][];
        // Strip totals sentinel row if present
        const realRows = isTotalsEnabled && data.length > 0
            ? raw.slice(0, raw.length - 1)
            : raw;
        const result = realRows.map((row) => {
            const obj: Record<string, unknown> = {};
            leaves.forEach((col, i) => {
                obj[col.data] = row[i] ?? null;
            });
            return obj;
        });
        onChange?.(result);
    }, [leaves, onChange, isTotalsEnabled, data.length]);

    const handleAfterChange = useCallback(
        (changes: CellChange[] | null, source: ChangeSource) => {
            if (source === "loadData" || !changes) return;
            syncData();
        },
        [syncData]
    );

    // ── Row controls ──────────────────────────────────────────────────────────
    const addRow = () => {
        const hot = hotRef.current?.hotInstance;
        if (!hot) return;
        // Insert before the totals row if present
        const insertAt = isTotalsEnabled && data.length > 0
            ? hot.countRows() - 2
            : hot.countRows() - 1;
        hot.alter("insert_row_below", Math.max(0, insertAt), 1);
    };

    const removeSelectedRows = () => {
        const hot = hotRef.current?.hotInstance;
        if (!hot) return;
        const selected = hot.getSelected();
        if (!selected) return;
        const totalsRowIndex = isTotalsEnabled && data.length > 0
            ? hotData.length - 1
            : -1;
        const rowSet = new Set<number>();
        selected.forEach(([r1, , r2]) => {
            const lo = Math.min(r1, r2);
            const hi = Math.max(r1, r2);
            for (let r = lo; r <= hi; r++) {
                if (r !== totalsRowIndex) rowSet.add(r); // never delete totals row
            }
        });
        Array.from(rowSet)
            .sort((a, b) => b - a)
            .forEach((r) => hot.alter("remove_row", r, 1));
    };

 

    const handleSearch = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const q = e.target.value;
            setSearchQuery(q);
            const hot = hotRef.current?.hotInstance;
            if (!hot) return;
            const searchPlugin = hot.getPlugin("search" as never) as {
                query: (q: string) => void;
            };
            searchPlugin.query(q);
            hot.render();
        },
        []
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div
            style={{
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                background: "#fff",
                border: "1px solid #e4e7ec",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow:
                    "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
            }}
        >
            {/* ── Toolbar ── */}
            <div
                style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f2f4f7",
                    background: "#fcfcfd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#101828" }}>
                        {title}
                    </span>
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#1d4ed8",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: 99,
                            padding: "1px 8px",
                        }}
                    >
                        {totalRows} rows
                    </span>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                    }}
                >
                    {showSearch && (
                        <div style={{ position: "relative" }}>
                            <svg
                                style={{
                                    position: "absolute",
                                    left: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#98a2b3",
                                    pointerEvents: "none",
                                }}
                                width="13"
                                height="13"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                            >
                                <circle cx="7" cy="7" r="5" />
                                <path d="M11 11l3 3" strokeLinecap="round" />
                            </svg>
                            <input
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search…"
                                style={{
                                    paddingLeft: 27,
                                    paddingRight: 10,
                                    height: 32,
                                    width: 170,
                                    fontSize: 12,
                                    border: "0.5px solid #d0d5dd",
                                    borderRadius: 6,
                                    outline: "none",
                                    background: "#fff",
                                    color: "#101828",
                                    fontFamily: "inherit",
                                }}
                            />
                        </div>
                    )}

                    <div style={{ width: 1, height: 22, background: "#e4e7ec" }} />

                    {showRowControls && (
                        <>
                            <ToolbarBtn onClick={addRow} icon="add" label="Add row" />
                            <ToolbarBtn
                                onClick={removeSelectedRows}
                                icon="remove"
                                label="Remove"
                                variant="danger"
                            />
                        </>
                    )}

                   
                </div>
            </div>

            {/* ── Table ── */}
            <div className="dt-wrapper" style={{ position: "relative" }}>
                <HotTable
                    ref={hotRef}
                    
                    data={hotData}
                    columns={hotColumns}
                    colWidths={colWidths}
                    nestedHeaders={nestedHeaders as never}
                    rowHeaders={true}
                    width="100%"
                    height={height}
                    enterMoves={{ row: 1, col: 0 }}
                    licenseKey="non-commercial-and-evaluation"
                    afterChange={handleAfterChange}
                    afterRemoveRow={syncData}
                    afterRenderer={handleAfterRenderer}
                    afterGetRowHeader={handleAfterGetRowHeader}
                    cells={cellsCallback}
                    contextMenu={{
                        items: {
                            row_above: { name: "Insert row above" },
                            row_below: { name: "Insert row below" },
                            remove_row: { name: "Remove row" },
                            separator1: { name: "---------" },
                            col_left: { name: "Insert column left" },
                            col_right: { name: "Insert column right" },
                            remove_col: { name: "Remove column" },
                            separator2: { name: "---------" },
                            copy: { name: "Copy" },
                            cut: { name: "Cut" },
                        },
                    }}
                    manualColumnResize
                    manualRowResize
                    wordWrap={false}
                    stretchH="last"
                    // filters
                    // dropdownMenu={[
                    //     "filter_by_condition",
                    //     "filter_operators",
                    //     "filter_by_value",
                    //     "filter_action_bar",
                    // ]}
                    // columnSorting={{ sortEmptyCells: false, headerAction: true }}
                    // search={{ searchResultClass: "dt-search-result" }}
                    selectionMode="multiple"
                    outsideClickDeselects={true}
                    fixedRowsBottom={1}
                />
            </div>

            {/* ── Pagination ── */}
            {isPaginationEnabled && totalRows > 0 ? (
                <PaginationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalRows={totalRows}
                    pageSizeOptions={pageSizeOptions}
                    showPageSizeSelector={pagination?.showPageSizeSelector ?? true}
                    showPageNumbers={pagination?.showPageNumbers ?? true}
                    showTotalCount={pagination?.showTotalCount ?? true}
                    onPageChange={(p) => {
                        setCurrentPage(p);
                        pagination?.onPageChange?.(p, pageSize);
                    }}
                    onPageSizeChange={(s) => {
                        setPageSize(s);
                        setCurrentPage(1);
                        pagination?.onPageChange?.(1, s);
                    }}
                />
            ) : null}

            {/* ── Styles ── */}
            <style>{`
        .dt-wrapper .handsontable th {
          background: #dadafc !important;
          color: #111 !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          border-color: #BBB !important;
        }
      
        .dt-wrapper .handsontable td {
          font-size: 12px !important;
          color: #222 !important;
          border-color: #DDD !important;
          padding:0px auto !important;
        }
        .dt-wrapper .handsontable tr:hover td {
          background: #ececff !important;
        }
        .dt-wrapper .handsontable .htCore td.current {
          background: #bdd7f8 !important;
        }
        .dt-wrapper .handsontable .htCore td.area {
          background: #eff6ff !important;
        }
        .dt-search-result {
          background: #fef9c3 !important;
          color: #713f12 !important;
          font-weight: 700 !important;
        }
        .dt-wrapper .handsontable .htDropdownMenu,
        .dt-wrapper .handsontable .htContextMenu {
          border-radius: 8px !important;
          border: 1px solid #e4e7ec !important;
          box-shadow: 0 6px 20px rgba(16,24,40,0.1) !important;
        }
        .dt-wrapper .handsontable .columnSorting.ascending::after {
          border-bottom-color: #1d4ed8 !important;
        }
        .dt-wrapper .handsontable .columnSorting.descending::after {
          border-top-color: #1d4ed8 !important;
        }
        .dt-wrapper ::-webkit-scrollbar { width: 7px; height: 7px; }
        .dt-wrapper ::-webkit-scrollbar-track { background: #f1f3f9; border-radius: 4px; }
        .dt-wrapper ::-webkit-scrollbar-thumb { background: #c5cfe0; border-radius: 4px; }
        .dt-wrapper ::-webkit-scrollbar-thumb:hover { background: #a8b4cc; }
      `}</style>
        </div>
    );
}

// ─── ToolbarBtn ───────────────────────────────────────────────────────────────

function ToolbarBtn({
    onClick,
    icon,
    label,
    variant = "default",
}: {
    onClick: () => void;
    icon: "add" | "remove" | "export";
    label: string;
    variant?: "default" | "primary" | "danger";
}) {
    const styles: Record<string, React.CSSProperties> = {
        default: { background: "#fff", border: "0.5px solid #d0d5dd", color: "#344054" },
        primary: { background: "#1d4ed8", border: "1px solid #1d4ed8", color: "#fff" },
        danger: { background: "#fff", border: "0.5px solid #fda29b", color: "#b42318" },
    };

    const icons = {
        add: <path d="M8 3v10M3 8h10" />,
        remove: <path d="M2 4h12M6 4V2h4v2M13 4l-1 10H4L3 4M6 7v5M10 7v5" />,
        export: <path d="M8 2v9M5 8l3 3 3-3M2 13h12" />,
    };

    return (
        <button
            onClick={onClick}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                height: 32,
                padding: "0 11px",
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "opacity 0.1s",
                ...styles[variant],
            }}
            onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.opacity = "0.8")
            }
            onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.opacity = "1")
            }
        >
            <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            >
                {icons[icon]}
            </svg>
            {label}
        </button>
    );
}