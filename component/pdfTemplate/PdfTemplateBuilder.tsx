"use client";

import React, { useCallback, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─────────────────────────────────────────────
// Paper definitions
// ─────────────────────────────────────────────
export type PdfPaperType =
    | "a4" | "a5" | "letter" | "legal"
    | "40col" | "58col" | "80col";

interface PaperDef {
    label: string;
    widthPt: number;
    heightPt: number;
    scrollable: boolean;
}

const MM_TO_PT = 2.8346;

const PAPER_DEFS: Record<PdfPaperType, PaperDef> = {
    a4: { label: "A4 (210 × 297 mm)", widthPt: 595, heightPt: 842, scrollable: false },
    a5: { label: "A5 (148 × 210 mm)", widthPt: 420, heightPt: 595, scrollable: false },
    letter: { label: "Letter (216 × 279 mm)", widthPt: 612, heightPt: 792, scrollable: false },
    legal: { label: "Legal (216 × 356 mm)", widthPt: 612, heightPt: 1008, scrollable: false },
    "40col": { label: "40-Col Thermal (80 mm)", widthPt: Math.round(80 * MM_TO_PT), heightPt: 600, scrollable: true },
    "58col": { label: "58-Col Thermal (58 mm)", widthPt: Math.round(58 * MM_TO_PT), heightPt: 600, scrollable: true },
    "80col": { label: "80-Col Thermal (80 mm)", widthPt: Math.round(80 * MM_TO_PT), heightPt: 900, scrollable: true },
};

// ─────────────────────────────────────────────
// Field types
// ─────────────────────────────────────────────
export type PdfFieldType = "text" | "image" | "table" | "divider";

export interface PdfBaseField {
    id: string;
    type: PdfFieldType;
    /** All x/y/width/height are in PDF points (pt). Zoom is only a canvas-display scale. */
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    /** Background fill color for this field's canvas block (hex). Does NOT affect PDF output. */
    bgColor?: string;
}

export interface PdfTextField extends PdfBaseField {
    type: "text";
    dataKey: string;
    fontSize?: number;
    fontStyle?: "normal" | "bold" | "italic";
    align?: "left" | "center" | "right";
    /** Text color (hex). Applied in both canvas preview and PDF. */
    color?: string;
}

export interface PdfImageConfig {
    dataKey: string;
    fit?: "contain" | "cover" | "stretch";
}

export interface PdfImageField extends PdfBaseField {
    type: "image";
    image: PdfImageConfig;
}

export interface PdfTableColumn {
    key: string;
    header: string;
    dataKey: string;
    width?: number;
    align?: "left" | "center" | "right";
    showTotal?: boolean;
    format?: (val: string | number) => string;
}

export interface PdfTableConfig {
    dataKey: string;
    columns: PdfTableColumn[];
    showHeader?: boolean;
    showFooterTotals?: boolean;
    footerSummaryRows?: Array<{ label: string; value: string | number }>;
    headerBgColor?: string;
    headerTextColor?: string;
    stripedRows?: boolean;
    borderColor?: string;
    fontSize?: number;
}

export interface PdfTableField extends PdfBaseField {
    type: "table";
    table: PdfTableConfig;
}

export interface PdfDividerField extends PdfBaseField {
    type: "divider";
    dashed?: boolean;
    thickness?: number;
    /** Line color (hex). Applied in both canvas preview and PDF. */
    color?: string;
}

export type PdfField =
    | PdfTextField
    | PdfImageField
    | PdfTableField
    | PdfDividerField;

// ─────────────────────────────────────────────
// Component props
// ─────────────────────────────────────────────
interface PdfTemplateBuilderProps {
    initialFields: PdfField[];
    data: Record<string, any>;
    paperType?: PdfPaperType;
    title?: string;
    showDownload?: boolean;
    onDownload?: (blob: Blob, filename: string) => void;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
async function resolveImage(src: string): Promise<string> {
    if (src.startsWith("data:")) return src;
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext("2d")!.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = src;
    });
}

function hexToRgb(hex: string): [number, number, number] {
    const clean = (hex || "#000000").replace("#", "").padEnd(6, "0");
    return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16),
    ];
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const PdfTemplateBuilder: React.FC<PdfTemplateBuilderProps> = ({
    initialFields,
    data,
    paperType = "a4",
    title = "PDF Template Builder",
    showDownload = true,
    onDownload,
}) => {
    const [fields, setFields] = useState<PdfField[]>(initialFields);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [currentPaper, setCurrentPaper] = useState<PdfPaperType>(paperType);
    const [generating, setGenerating] = useState(false);
    const [zoom, setZoom] = useState(1);
    const canvasRef = useRef<HTMLDivElement>(null);

    const paper = PAPER_DEFS[currentPaper];

    // ── Field updater ──────────────────────────────────────────
    const updateField = useCallback((id: string, patch: Partial<PdfField>) => {
        setFields(prev =>
            prev.map(f => f.id === id ? ({ ...f, ...patch } as PdfField) : f)
        );
    }, []);

    // ── Canvas preview ─────────────────────────────────────────
    // NOTE: `zoom` is ONLY applied to the canvas display via the Rnd
    // size/position props. The stored field.x/y/width/height always remain
    // in raw PDF points. This ensures the PDF generator never needs zoom.
    const renderCanvasField = (field: PdfField) => {
        const isSelected = selectedId === field.id;

        const baseStyle: React.CSSProperties = {
            border: isSelected ? "2px solid #2563eb" : "1px dashed #94a3b8",
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
            background: field.bgColor
                ? field.bgColor
                : isSelected ? "rgba(37,99,235,0.05)" : "transparent",
            cursor: "move",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
        };

        switch (field.type) {
            case "text": {
                const tf = field as PdfTextField;
                const val = data[tf.dataKey] ?? tf.label ?? tf.dataKey;
                return (
                    <div style={{
                        ...baseStyle,
                        justifyContent:
                            tf.align === "right" ? "flex-end"
                                : tf.align === "center" ? "center"
                                    : "flex-start",
                        padding: "2px 4px",
                    }}>
                        <span style={{
                            fontSize: (tf.fontSize || 12) * zoom,
                            fontWeight: tf.fontStyle === "bold" ? "bold" : "normal",
                            fontStyle: tf.fontStyle === "italic" ? "italic" : "normal",
                            color: tf.color || "#111",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}>
                            {String(val)}
                        </span>
                        <TypeBadge color="#2563eb">T</TypeBadge>
                    </div>
                );
            }
            case "image": {
                const imgF = field as PdfImageField;
                const src = data[imgF.image.dataKey];
                return (
                    <div style={{ ...baseStyle, background: field.bgColor || "#f1f5f9" }}>
                        {src
                            ? <img src={src} alt="img" style={{
                                maxWidth: "100%", maxHeight: "100%",
                                objectFit: imgF.image.fit === "stretch" ? "fill" : imgF.image.fit || "contain",
                            }} />
                            : <span style={{ fontSize: 11, color: "#94a3b8" }}>[ Image: {imgF.image.dataKey} ]</span>
                        }
                        <TypeBadge color="#7c3aed">IMG</TypeBadge>
                    </div>
                );
            }
            case "table": {
                const tf = field as PdfTableField;
                const rows: Record<string, any>[] = data[tf.table.dataKey] || [];
                return (
                    <div style={{ ...baseStyle, alignItems: "flex-start", overflow: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: (tf.table.fontSize || 10) * zoom }}>
                            {tf.table.showHeader !== false && (
                                <thead>
                                    <tr style={{ background: tf.table.headerBgColor || "#1e293b", color: tf.table.headerTextColor || "#fff" }}>
                                        {tf.table.columns.map(col => (
                                            <th key={col.key} style={{ padding: "3px 6px", textAlign: col.align || "left", fontWeight: 600 }}>
                                                {col.header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                            )}
                            <tbody>
                                {rows.map((row, ri) => (
                                    <tr key={ri} style={{ background: tf.table.stripedRows && ri % 2 === 1 ? "#f8fafc" : "transparent" }}>
                                        {tf.table.columns.map(col => (
                                            <td key={col.key} style={{ padding: "3px 6px", textAlign: col.align || "left", borderBottom: "1px solid #e2e8f0" }}>
                                                {col.format ? col.format(row[col.dataKey]) : row[col.dataKey]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                            {(tf.table.showFooterTotals || tf.table.footerSummaryRows?.length) && (
                                <tfoot>
                                    {tf.table.showFooterTotals && (
                                        <tr style={{ fontWeight: "bold", borderTop: "2px solid #334155" }}>
                                            {tf.table.columns.map((col, ci) => {
                                                if (ci === 0) return <td key={col.key} style={{ padding: "3px 6px" }}>Totals</td>;
                                                if (!col.showTotal) return <td key={col.key} />;
                                                const total = rows.reduce((s, r) => s + (Number(r[col.dataKey]) || 0), 0);
                                                return <td key={col.key} style={{ padding: "3px 6px", textAlign: col.align || "right" }}>
                                                    {col.format ? col.format(total) : total}
                                                </td>;
                                            })}
                                        </tr>
                                    )}
                                    {tf.table.footerSummaryRows?.map((sr, i) => (
                                        <tr key={i} style={{ borderTop: "1px solid #cbd5e1" }}>
                                            <td colSpan={tf.table.columns.length - 1} style={{ padding: "3px 6px", textAlign: "right", fontWeight: 600 }}>{sr.label}</td>
                                            <td style={{ padding: "3px 6px", textAlign: "right", fontWeight: 700 }}>{sr.value}</td>
                                        </tr>
                                    ))}
                                </tfoot>
                            )}
                        </table>
                        <TypeBadge color="#059669">TBL</TypeBadge>
                    </div>
                );
            }
            case "divider": {
                const df = field as PdfDividerField;
                return (
                    <div style={{ ...baseStyle }}>
                        <div style={{
                            width: "100%",
                            borderTop: `${df.thickness || 1}px ${df.dashed ? "dashed" : "solid"} ${df.color || "#334155"}`,
                        }} />
                        <TypeBadge color="#f59e0b">—</TypeBadge>
                    </div>
                );
            }
            default:
                return <div style={baseStyle}>{(field as any).label || (field as any).id}</div>;
        }
    };

    // ── PDF Generation ─────────────────────────────────────────
    // IMPORTANT: field.x / y / width / height are already in PDF points.
    // We NEVER multiply by zoom here. Zoom is a canvas-display-only concern.
    const downloadPdf = async () => {
        setGenerating(true);
        try {
            const isStandard = !["40col", "58col", "80col"].includes(currentPaper);
            const doc = new jsPDF({
                unit: "pt",
                format: isStandard ? (currentPaper as any) : [paper.widthPt, paper.heightPt],
            });

            for (const field of fields) {
                switch (field.type) {

                    case "text": {
                        const tf = field as PdfTextField;
                        const val = String(data[tf.dataKey] ?? "");
                        doc.setFontSize(tf.fontSize || 12);
                        doc.setFont(
                            "helvetica",
                            tf.fontStyle === "bold" ? "bold"
                                : tf.fontStyle === "italic" ? "italic"
                                    : "normal"
                        );
                        if (tf.color) {
                            const [r, g, b] = hexToRgb(tf.color);
                            doc.setTextColor(r, g, b);
                        } else {
                            doc.setTextColor(0, 0, 0);
                        }
                        // y offset: jsPDF text baseline is at y, so add fontSize to push down
                        doc.text(val, tf.x, tf.y + (tf.fontSize || 12), { align: tf.align || "left" });
                        break;
                    }

                    case "image": {
                        const imgF = field as PdfImageField;
                        const src = data[imgF.image.dataKey];
                        if (src) {
                            try {
                                const b64 = await resolveImage(src);
                                // x, y, width, height — all raw pt, no zoom
                                doc.addImage(b64, "PNG", imgF.x, imgF.y, imgF.width, imgF.height);
                            } catch { /* skip broken image */ }
                        }
                        break;
                    }

                    case "table": {
                        const tf = field as PdfTableField;
                        const rows: Record<string, any>[] = data[tf.table.dataKey] || [];
                        const columns = tf.table.columns;

                        const totalRow: Record<string, string> = {};
                        if (tf.table.showFooterTotals) {
                            columns.forEach((col, ci) => {
                                if (ci === 0) { totalRow[col.dataKey] = "Totals"; return; }
                                if (col.showTotal) {
                                    const sum = rows.reduce((s, r) => s + (Number(r[col.dataKey]) || 0), 0);
                                    totalRow[col.dataKey] = col.format ? col.format(sum) : String(sum);
                                } else {
                                    totalRow[col.dataKey] = "";
                                }
                            });
                        }

                        const head = tf.table.showHeader !== false
                            ? [columns.map(c => c.header)]
                            : undefined;

                        const body = rows.map(row =>
                            columns.map(col =>
                                col.format ? String(col.format(row[col.dataKey])) : String(row[col.dataKey] ?? "")
                            )
                        );

                        const foot: string[][] = [];
                        if (tf.table.showFooterTotals) {
                            foot.push(columns.map(col => totalRow[col.dataKey] || ""));
                        }
                        (tf.table.footerSummaryRows || []).forEach(sr => {
                            const row = Array(columns.length).fill("");
                            row[columns.length - 2] = sr.label;
                            row[columns.length - 1] = String(sr.value);
                            foot.push(row);
                        });

                        autoTable(doc, {
                            startY: tf.y,                    // raw pt — no zoom
                            margin: { left: tf.x },          // raw pt — no zoom
                            tableWidth: tf.width,            // raw pt — no zoom
                            head,
                            body,
                            foot: foot.length ? foot : undefined,
                            styles: { fontSize: tf.table.fontSize || 10 },
                            headStyles: {
                                fillColor: hexToRgb(tf.table.headerBgColor || "#1e293b"),
                                textColor: hexToRgb(tf.table.headerTextColor || "#ffffff"),
                                fontStyle: "bold",
                            },
                            footStyles: { fontStyle: "bold", fillColor: [245, 245, 245] as any },
                            alternateRowStyles: tf.table.stripedRows ? { fillColor: [248, 250, 252] as any } : {},
                            columnStyles: Object.fromEntries(
                                columns.map((col, i) => [i, { halign: col.align || "left" }])
                            ),
                        });
                        break;
                    }

                    case "divider": {
                        const df = field as PdfDividerField;
                        const [r, g, b] = hexToRgb(df.color || "#334155");
                        doc.setDrawColor(r, g, b);
                        doc.setLineWidth(df.thickness || 1);
                        if (df.dashed) doc.setLineDashPattern([4, 3], 0);
                        doc.line(df.x, df.y, df.x + df.width, df.y); // raw pt
                        doc.setLineDashPattern([], 0);
                        break;
                    }
                }
            }

            const filename = `${title.replace(/\s+/g, "_").toLowerCase()}.pdf`;
            if (onDownload) {
                onDownload(doc.output("blob"), filename);
            } else {
                doc.save(filename);
            }
        } finally {
            setGenerating(false);
        }
    };

    const selectedField = fields.find(f => f.id === selectedId);

    return (
        <div style={styles.root}>
            {/* ── Header ──────────────────────────────────────── */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <span style={styles.logo}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </span>
                    <h1 style={styles.title}>{title}</h1>
                </div>

                <div style={styles.headerRight}>
                    <label style={styles.controlLabel}>Paper</label>
                    <select value={currentPaper} onChange={e => setCurrentPaper(e.target.value as PdfPaperType)} style={styles.select}>
                        {(Object.entries(PAPER_DEFS) as [PdfPaperType, PaperDef][]).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>

                    <label style={styles.controlLabel}>Zoom</label>
                    <select value={zoom} onChange={e => setZoom(Number(e.target.value))} style={styles.select}>
                        {[0.5, 0.75, 1, 1.25, 1.5].map(z => (
                            <option key={z} value={z}>{Math.round(z * 100)}%</option>
                        ))}
                    </select>

                    {showDownload && (
                        <button
                            style={{ ...styles.btn, opacity: generating ? 0.6 : 1 }}
                            onClick={downloadPdf}
                            disabled={generating}
                        >
                            {generating ? "Generating…" : "↓ Download PDF"}
                        </button>
                    )}
                </div>
            </header>

            <div style={styles.workspace}>
                {/* ── Canvas ──────────────────────────────────── */}
                <div style={styles.canvasWrapper}>
                    <div style={styles.canvasLabel}>
                        {paper.label} — {paper.widthPt} × {paper.heightPt} pt
                    </div>

                    <div
                        ref={canvasRef}
                        onClick={() => setSelectedId(null)}
                        style={{
                            // Canvas display size = paper size × zoom (display only)
                            width: paper.widthPt * zoom,
                            height: paper.scrollable ? "auto" : paper.heightPt * zoom,
                            minHeight: paper.heightPt * zoom,
                            border: "1px solid #cbd5e1",
                            boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
                            margin: "0 auto",
                            position: "relative",
                            background: "#fff",
                            overflow: paper.scrollable ? "visible" : "hidden",
                            flexShrink: 0,
                        }}
                    >
                        {fields.map(field => (
                            <Rnd
                                key={field.id}
                                // Display: multiply by zoom for canvas visual
                                size={{ width: field.width * zoom, height: field.height * zoom }}
                                position={{ x: field.x * zoom, y: field.y * zoom }}
                                bounds="parent"
                                onMouseDown={e => { e.stopPropagation(); setSelectedId(field.id); }}
                                onDragStop={(_e, d) => {
                                    // Store back as pt: divide by zoom
                                    updateField(field.id, { x: d.x / zoom, y: d.y / zoom });
                                }}
                                onResizeStop={(_e, _dir, ref, _delta, pos) => {
                                    // Store back as pt: divide by zoom
                                    updateField(field.id, {
                                        width: parseInt(ref.style.width) / zoom,
                                        height: parseInt(ref.style.height) / zoom,
                                        x: pos.x / zoom,
                                        y: pos.y / zoom,
                                    });
                                }}
                                style={{ zIndex: selectedId === field.id ? 10 : 1 }}
                            >
                                {renderCanvasField(field)}
                            </Rnd>
                        ))}
                    </div>
                </div>

                {/* ── Inspector ───────────────────────────────── */}
                <aside style={styles.inspector}>
                    <div style={styles.inspectorTitle}>Inspector</div>

                    {!selectedField && (
                        <div style={styles.inspectorEmpty}>Click a field on the canvas to inspect it.</div>
                    )}

                    {selectedField && (
                        <div style={styles.inspectorBody}>
                            <InspRow label="ID">
                                <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>{selectedField.id}</span>
                            </InspRow>
                            <InspRow label="Type">
                                <TypePill type={selectedField.type} />
                            </InspRow>

                            <SectionDivider label="Position & Size" />

                            <InspRow label="X (pt)">
                                <NumInput value={Math.round(selectedField.x)} onChange={v => updateField(selectedField.id, { x: v })} />
                            </InspRow>
                            <InspRow label="Y (pt)">
                                <NumInput value={Math.round(selectedField.y)} onChange={v => updateField(selectedField.id, { y: v })} />
                            </InspRow>
                            <InspRow label="W (pt)">
                                <NumInput value={Math.round(selectedField.width)} onChange={v => updateField(selectedField.id, { width: v })} />
                            </InspRow>
                            <InspRow label="H (pt)">
                                <NumInput value={Math.round(selectedField.height)} onChange={v => updateField(selectedField.id, { height: v })} />
                            </InspRow>

                            <SectionDivider label="Appearance" />

                            {/* BG color — available on ALL field types */}
                            <InspRow label="BG Color">
                                <ColorInput
                                    value={selectedField.bgColor || "#ffffff"}
                                    onChange={v => updateField(selectedField.id, { bgColor: v })}
                                />
                            </InspRow>

                            {/* ── Text-specific ── */}
                            {selectedField.type === "text" && (
                                <>
                                    <InspRow label="Text Color">
                                        <ColorInput
                                            value={(selectedField as PdfTextField).color || "#111111"}
                                            onChange={v => updateField(selectedField.id, { color: v } as any)}
                                        />
                                    </InspRow>
                                    <InspRow label="Font size">
                                        <NumInput
                                            value={(selectedField as PdfTextField).fontSize || 12}
                                            onChange={v => updateField(selectedField.id, { fontSize: v } as any)}
                                        />
                                    </InspRow>
                                    <InspRow label="Align">
                                        <SmSelect
                                            value={(selectedField as PdfTextField).align || "left"}
                                            onChange={v => updateField(selectedField.id, { align: v as any } as any)}
                                            options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]}
                                        />
                                    </InspRow>
                                    <InspRow label="Style">
                                        <SmSelect
                                            value={(selectedField as PdfTextField).fontStyle || "normal"}
                                            onChange={v => updateField(selectedField.id, { fontStyle: v as any } as any)}
                                            options={[["normal", "Normal"], ["bold", "Bold"], ["italic", "Italic"]]}
                                        />
                                    </InspRow>
                                </>
                            )}

                            {/* ── Divider-specific ── */}
                            {selectedField.type === "divider" && (
                                <>
                                    <InspRow label="Line Color">
                                        <ColorInput
                                            value={(selectedField as PdfDividerField).color || "#334155"}
                                            onChange={v => updateField(selectedField.id, { color: v } as any)}
                                        />
                                    </InspRow>
                                    <InspRow label="Thickness">
                                        <NumInput
                                            value={(selectedField as PdfDividerField).thickness || 1}
                                            onChange={v => updateField(selectedField.id, { thickness: v } as any)}
                                        />
                                    </InspRow>
                                    <InspRow label="Dashed">
                                        <input
                                            type="checkbox"
                                            checked={(selectedField as PdfDividerField).dashed || false}
                                            onChange={e => updateField(selectedField.id, { dashed: e.target.checked } as any)}
                                        />
                                    </InspRow>
                                </>
                            )}

                            {/* ── Table header colors ── */}
                            {selectedField.type === "table" && (
                                <>
                                    <InspRow label="Header BG">
                                        <ColorInput
                                            value={(selectedField as PdfTableField).table.headerBgColor || "#1e293b"}
                                            onChange={v => updateField(selectedField.id, {
                                                table: { ...(selectedField as PdfTableField).table, headerBgColor: v }
                                            } as any)}
                                        />
                                    </InspRow>
                                    <InspRow label="Header Text">
                                        <ColorInput
                                            value={(selectedField as PdfTableField).table.headerTextColor || "#ffffff"}
                                            onChange={v => updateField(selectedField.id, {
                                                table: { ...(selectedField as PdfTableField).table, headerTextColor: v }
                                            } as any)}
                                        />
                                    </InspRow>
                                </>
                            )}

                            <div style={{ borderTop: "1px solid #f1f5f9", margin: "10px 0 8px" }} />
                            <button
                                style={{ ...styles.btn, background: "#ef4444", width: "100%", justifyContent: "center" }}
                                onClick={() => { setFields(p => p.filter(f => f.id !== selectedId)); setSelectedId(null); }}
                            >
                                Remove Field
                            </button>
                        </div>
                    )}

                    {/* All fields list */}
                    <div style={{ marginTop: 16 }}>
                        <div style={styles.inspectorTitle}>All Fields</div>
                        {fields.map(f => (
                            <div
                                key={f.id}
                                onClick={() => setSelectedId(f.id)}
                                style={{
                                    ...styles.fieldListItem,
                                    background: selectedId === f.id ? "#eff6ff" : "transparent",
                                    borderLeft: selectedId === f.id ? "3px solid #2563eb" : "3px solid transparent",
                                }}
                            >
                                <TypePill type={f.type} small />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
                                    {f.label || (f as any).dataKey || f.id}
                                </span>
                                {f.bgColor && f.bgColor !== "#ffffff" && (
                                    <span style={{ width: 10, height: 10, borderRadius: 2, background: f.bgColor, border: "1px solid #e2e8f0", flexShrink: 0, marginLeft: "auto" }} />
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
const TYPE_COLORS: Record<PdfFieldType, string> = {
    text: "#2563eb",
    image: "#7c3aed",
    table: "#059669",
    divider: "#f59e0b",
};

const TypeBadge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "#2563eb" }) => (
    <span style={{
        position: "absolute", top: 2, right: 2,
        fontSize: 9, background: color, color: "#fff",
        borderRadius: 3, padding: "1px 4px",
        pointerEvents: "none", lineHeight: "16px",
        letterSpacing: "0.04em", fontWeight: 700,
    }}>
        {children}
    </span>
);

const TypePill: React.FC<{ type: PdfFieldType; small?: boolean }> = ({ type, small }) => (
    <span style={{
        fontSize: small ? 9 : 10, fontWeight: 700,
        padding: small ? "1px 4px" : "2px 6px",
        background: TYPE_COLORS[type] + "18",
        color: TYPE_COLORS[type],
        borderRadius: 4,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        flexShrink: 0,
        border: `1px solid ${TYPE_COLORS[type]}30`,
    }}>
        {type}
    </span>
);

const SectionDivider: React.FC<{ label: string }> = ({ label }) => (
    <div style={{ margin: "10px 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
    </div>
);

const InspRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7, gap: 8 }}>
        <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center" }}>{children}</div>
    </div>
);

const NumInput: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
    <input
        type="number" value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 68, padding: "2px 6px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 12, color: "#0f172a", outline: "none" }}
    />
);

const SmSelect: React.FC<{ value: string; onChange: (v: string) => void; options: [string, string][] }> = ({ value, onChange, options }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: "2px 6px", border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff", fontSize: 12, outline: "none", cursor: "pointer" }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
);

/** Native color picker + hex text input side-by-side */
const ColorInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <input
            type="color" value={value}
            onChange={e => onChange(e.target.value)}
            style={{ width: 28, height: 24, padding: 1, border: "1px solid #e2e8f0", borderRadius: 4, cursor: "pointer", background: "none" }}
        />
        <input
            type="text" value={value} maxLength={7}
            onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
            style={{ width: 68, padding: "2px 5px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 11, fontFamily: "monospace", color: "#0f172a", outline: "none" }}
        />
    </div>
);

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
    root: { fontFamily: "'Inter','Segoe UI',sans-serif", display: "flex", flexDirection: "column", height: "100vh", background: "#f1f5f9", color: "#0f172a" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, background: "#0f172a", color: "#f8fafc", flexShrink: 0, gap: 12 },
    headerLeft: { display: "flex", alignItems: "center", gap: 10 },
    headerRight: { display: "flex", alignItems: "center", gap: 10 },
    logo: { color: "#38bdf8", display: "flex" },
    title: { fontSize: 15, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" },
    controlLabel: { fontSize: 12, color: "#94a3b8" },
    select: { padding: "4px 8px", border: "1px solid #334155", borderRadius: 6, background: "#1e293b", color: "#f1f5f9", fontSize: 12, outline: "none", cursor: "pointer" },
    btn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
    workspace: { display: "flex", flex: 1, overflow: "hidden" },
    canvasWrapper: { flex: 1, overflow: "auto", padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
    canvasLabel: { fontSize: 11, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 },
    inspector: { width: 252, background: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "auto", flexShrink: 0 },
    inspectorTitle: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#475569", padding: "12px 14px 6px", borderBottom: "1px solid #f1f5f9" },
    inspectorEmpty: { padding: 14, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 },
    inspectorBody: { padding: 14 },
    fieldListItem: { display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc" },
};

export default PdfTemplateBuilder;