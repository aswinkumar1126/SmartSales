import React, { useRef } from 'react';
import { LuPencil, LuTrash2 } from 'react-icons/lu';
import { Box, Flex, Text } from '@chakra-ui/react';

interface Column {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    decimalScale?: number;
}

interface FormField {
    key: string;
    type: string;
    isRequired?: boolean;
    label?: string;
    placeholder?: string;
    collection?: any;
    disabled?: boolean;
    dependsOn?: string;
    decimalScale?: number;
}

interface TransactionTableProps {
    theme?: {
        colors?: {
            borderColor?: string;
            formColor?: string;
        };
    };
    tableCols: Column[];
    formFields: FormField[];
    rows: any[];
    formData: Record<string, any>;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    localEditId: string | null;
    isSubmitting: boolean;
    totals?: Record<string, number>;
    stripedBg?: string;
    allDisplayCols: Column[];
    isIssue?: boolean;
    getCellStyle?:any;

    // Handlers
    resetForm: () => void;
    handleSubmit: () => void;
    handleEditRow: (row: any) => void;
    handleDeleteRow: (row: any) => void;
    renderFormCell: any;
    getCellValue: (col: Column, row: any) => React.ReactNode;
    formatTotal: (value: number | undefined, decimals?: number) => string;
}





export const TransactionTable: React.FC<TransactionTableProps> = ({
    theme,
    tableCols,
    formFields,
    rows,
    formData,
    errors,
    touched,
    localEditId,
    isSubmitting,
    totals,
    stripedBg = '#F7FAFC',
    allDisplayCols,
    isIssue,
    resetForm,
    handleSubmit,
    handleEditRow,
    handleDeleteRow,
    renderFormCell,
    getCellValue,
    formatTotal,
    getCellStyle
}) => {
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    return (
        <Box
            borderWidth="1px"
            borderColor={theme?.colors?.borderColor || "#CBD5E0"}
            borderRadius="md"
            overflow="hidden"
            bg="white"
        >
            <Box overflowX="auto" style={{ maxHeight: "340px", overflowY: "auto" }}>
                <table style={{
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                    width: "max-content",
                    minWidth: "100%",
                }}>
                    {/* HEADER */}
                    <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                        <tr style={{
                            backgroundColor: theme?.colors?.formColor || "#EDF2F7",
                            borderBottom: "2px solid #A0AEC0",
                           
                        }}>
                            <th style={getCellStyle({ key: "__sno", label: "#", align: "center" }, { fontSize: 11, fontWeight: 700, color: "#4A5568", padding: "5px 3px" })}>
                                #
                            </th>
                            {tableCols.map(col => {
                                const fld = formFields.find(f => f.key === col.key);

                                return (
                                    <th
                                        key={col.key}
                                        style={getCellStyle(col, {
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: "#4A5568",
                                            padding: "5px 3px",
                                            textAlign: "center",   // 👈 add this
                                        })}
                                    >
                                        {col.label}
                                        {fld?.isRequired && (
                                            <span style={{ color: "#E53E3E", marginLeft: 2 }}>*</span>
                                        )}
                                    </th>
                                );
                            })}
                            <th style={getCellStyle({ key: "__actions", label: "ACT", align: "center" }, { fontSize: 11, fontWeight: 700, color: "#4A5568", padding: "5px 3px" })}>
                                {localEditId ? (
                                    <button
                                        onClick={resetForm}
                                        title="Cancel Edit"
                                        style={{
                                            fontSize: 11,
                                            color: "#E53E3E",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            fontWeight: 700
                                        }}
                                    >
                                        ✕ CANCEL
                                    </button>
                                ) : "ACT"}
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* FORM ROW */}
                        <tr style={{
                            backgroundColor: localEditId ? "#EBF8FF" : "#FAFAFA",
                            borderBottom: "2px solid #CBD5E0",
                        }}>
                            <td style={getCellStyle({ key: "__sno", label: "#", align: "center" }, { fontSize: 11 })}>
                                {localEditId ? (
                                    <span style={{ color: "#3182CE", fontWeight: 900, fontSize: 13 }}>✎</span>
                                ) : (
                                    <span style={{ color: "#A0AEC0", fontSize: 11 }}>{rows.length + 1}</span>
                                )}
                            </td>

                            {tableCols.map(col => {
                                const field = formFields.find(f => f.key === col.key);
                                const hasErr = !!errors[col.key] && !!touched[col.key];
                                return (
                                    <td
                                        key={col.key}
                                        style={{
                                            ...getCellStyle(col),
                                            backgroundColor: hasErr ? "#FFF5F5" : undefined,
                                            outline: hasErr ? "1px solid #FC8181" : undefined,
                                            position: "relative",
                                        }}
                                        title={hasErr ? errors[col.key] : undefined}
                                    >
                                        {field ? renderFormCell(field) : null}
                                    </td>
                                );
                            })}

                            <td style={getCellStyle({ key: "__actions", label: "ACT", align: "center" }, { padding: "2px" })}>
                                <button
                                    ref={submitBtnRef}
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    title={localEditId ? "Update Row" : "Add Row"}
                                    style={{
                                        width: "100%",
                                        height: 22,
                                        background: localEditId ? "#3182CE" : "#38A169",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        cursor: isSubmitting ? "not-allowed" : "pointer",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        opacity: isSubmitting ? 0.7 : 1,
                                    }}
                                >
                                    {isSubmitting ? "..." : localEditId ? "✓ UPDATE" : "+ ADD"}
                                </button>
                            </td>
                        </tr>

                      

                        {/* empty state */}
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={allDisplayCols.length}
                                    style={{
                                        textAlign: "center",
                                        padding: "14px",
                                        fontSize: 11,
                                        color: "#A0AEC0"
                                    }}
                                >
                                    No items added yet — fill the form above and click + ADD
                                </td>
                            </tr>
                        )}

                        {/* DATA ROWS */}
                        {rows.map((row, idx) => (
                            <tr
                                key={row.__rowId || idx}
                                style={{
                                    backgroundColor: row.__rowId === localEditId
                                        ? "#BEE3F8"
                                        : idx % 2 === 0 ? stripedBg : "white",
                                    borderBottom: "1px solid #E2E8F0",
                                    transition: "background-color 0.15s",
                                }}
                            >
                                <td style={getCellStyle({ key: "__sno", label: "#", align: "center" }, { fontSize: 15, color: "#718096" })}>
                                    {idx + 1}
                                </td>
                                {tableCols.map(col => (
                                    <td key={col.key} style={getCellStyle(col, { fontSize: 14, color: "#1A202C", whiteSpace: "nowrap" })}>
                                        {getCellValue(col, row)}
                                    </td>
                                ))}
                                <td style={getCellStyle({ key: "__actions", label: "ACT", align: "center" })}>
                                    <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditRow(row);
                                            }}
                                            title="Edit"
                                            style={{
                                                padding: 2,
                                                color: "#3182CE",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <LuPencil size={11} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteRow(row);
                                            }}
                                            title="Delete"
                                            style={{
                                                padding: 2,
                                                color: "#E53E3E",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <LuTrash2 size={11} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                    {/* totals footer */}
                    {rows.length > 0 && (
                        <tfoot style={{ position: "sticky", bottom: 0, zIndex: 1 }}>
                            <tr style={{ backgroundColor: "#4A5568" }}>
                                <td style={getCellStyle({ key: "__sno", label: "#", align: "left" }, { fontSize: 10, fontWeight: 700, color: "white" })}>
                                    TOT
                                </td>
                                {tableCols.map(col => (
                                    <td key={col.key} style={getCellStyle(col, { fontSize: 11, fontWeight: 600, color: "white" })}>
                                        {formatTotal(totals?.[col.key], col.decimalScale)}
                                    </td>
                                ))}
                                <td style={getCellStyle({ key: "__actions", label: "ACT", align: "center" })} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </Box>
        </Box>
    );
};

export default TransactionTable;