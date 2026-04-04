"use client";

import { useEffect } from "react";
import PdfTemplateBuilder from "@/component/pdfTemplate/PdfTemplateBuilder";
import type {
    PdfField,
    PdfTableConfig,
    PdfImageConfig,
    PdfPaperType,
} from "@/component/pdfTemplate/PdfTemplateBuilder";

export type { PdfField, PdfTableConfig, PdfImageConfig, PdfPaperType };

export interface PdfBuilderProps {
    /** Paper format. Default: "a4" */
    paperType?: PdfPaperType;
    /** Flat key-value record used to fill text/image/table fields */
    data: Record<string, any>;
    /** Field layout definitions */
    fields: PdfField[];
    /** Title shown in the builder header & used as PDF filename */
    title?: string;
    /** Show the Download PDF button. Default: true */
    showDownload?: boolean;
    /** Called after the PDF blob is generated */
    onDownload?: (blob: Blob, filename: string) => void;

    // ── Overlay control ─────────────────────────────────────────
    /** When true, renders as a full-screen overlay on top of the current page */
    open: boolean;
    /** Called when the user clicks ✕ or presses Escape */
    onClose: () => void;
}

export default function PdfBuilder(props: PdfBuilderProps) {
    const {
        open,
        onClose,
        paperType = "a4",
        data,
        fields,
        title = "PDF Preview",
        showDownload = true,
        onDownload,
    } = props;

    // Prevent body scroll while overlay is open
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div style={styles.backdrop}>
            <style>{`
        @keyframes pdfSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0)    scale(1);     }
        }
      `}</style>

            <div style={styles.shell}>
                {/* Close bar */}
                <div style={styles.closeBar}>
                    <span style={styles.previewLabel}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {title}
                    </span>
                    <button
                        onClick={onClose}
                        style={styles.closeBtn}
                        title="Close (Esc)"
                        onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, styles.closeBtnHover)}
                        onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, styles.closeBtnBase)}
                    >
                        ✕&nbsp; Close
                    </button>
                </div>

                {/* Builder */}
                <div style={styles.builderWrap}>
                    <PdfTemplateBuilder
                        paperType={paperType}
                        data={data}
                        initialFields={fields}
                        title={title}
                        showDownload={showDownload}
                        onDownload={onDownload}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
    backdrop: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(2, 6, 23, 0.72)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
    },
    shell: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        animation: "pdfSlideIn 0.2s ease",
        overflow: "hidden",
    },
    closeBar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: 50,
        background: "#020617",
        borderBottom: "1px solid #1e293b",
        flexShrink: 0,
    },
    previewLabel: {
        display: "flex",
        alignItems: "center",
        color: "#64748b",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontFamily: "'Inter', sans-serif",
    },
    closeBtn: {
        ...{} as React.CSSProperties, // filled below
        background: "transparent",
        border: "1px solid #1e293b",
        color: "#64748b",
        borderRadius: 6,
        padding: "5px 14px",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        transition: "all 0.12s",
    },
    closeBtnBase: {
        background: "transparent",
        color: "#64748b",
        border: "1px solid #1e293b",
    },
    closeBtnHover: {
        background: "#1e293b",
        color: "#f1f5f9",
        border: "1px solid #334155",
    },
    builderWrap: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
};