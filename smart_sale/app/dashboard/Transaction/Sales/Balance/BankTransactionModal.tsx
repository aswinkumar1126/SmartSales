"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Text,
    Button,
    HStack,
    IconButton,
} from "@chakra-ui/react";
import { LuX } from "react-icons/lu";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";
import TransactionTable from "@/component/table/TransactionTable";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { toaster } from "@/components/ui/toaster";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import { PaymentModes } from "@/data/bankDetails/BankDetailsData";

export interface BankTransaction {

    ID:         string;
    DRAFTROWID: string;
    BANKID:  string;
    TRANMODE:  "C" | "F" | "I" | "N" | "R" | "U";
    PAYDATE:  string;
    CHQNO:     string;
    AMOUNT:    number;
}

interface BankTransactionModalProps {
    
    draftRowId: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (transactions: BankTransaction[], total: number) => void;
    type: "paid" | "received";
    theme: any;
    initialTransactions?: BankTransaction[];
    accCode?: number | string | null;
    escapeId?: string;
    bankAccList?:{label:string ,value:string}[]
}



// Define table columns for bank transactions
const bankTableCols = [
    { key: "BANKID", label: "BANK NAME", align: "left" as const },
    { key: "TRANMODE", label: "MODE", align: "center" as const },
    { key: "PAYDATE", label: "DATE", align: "center" as const },
    { key: "CHQNO", label: "CHEQUE NO.", align: "left" as const },
    { key: "AMOUNT", label: "AMOUNT", align: "right" as const, decimalScale: 2 },
];

// Column widths
const COL_WIDTHS: Record<string, string> = {
    __sno: "30px",
    BANKID: "160px",
    TRANMODE: "120px",
    PAYDATE: "80px",
    CHQNO: "80px",
    AMOUNT: "100px",
    __ACTIONS: "30px",
};

const getWidth = (key: string) => COL_WIDTHS[key] || "100px";

const getCellStyle = (col: any, extra?: React.CSSProperties): React.CSSProperties => ({
    width: getWidth(col.key),
    minWidth: getWidth(col.key),
    maxWidth: getWidth(col.key),
    padding: "4px 6px",
    borderRight: "1px solid #E2E8F0",
    textAlign: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
    overflow: "hidden",
    boxSizing: "border-box",
    fontSize: "12px",
    ...extra,
});

export const BankTransactionModal = ({
    draftRowId,
    isOpen,
    onClose,
    onSave,
    type,
    theme,
    initialTransactions = [],
    accCode,
    escapeId,
    bankAccList
}: BankTransactionModalProps) => {
    const emptyForm = {
        BANKID: "",
        TRANMODE: "F",
        PAYDATE: new Date().toISOString().split('T')[0],
        CHQNO: "",
        AMOUNT: ""
    };

    // Local state only - no localStorage
    const [transactions, setTransactions] = useState<BankTransaction[]>(initialTransactions);
    const [formData, setFormData] = useState(emptyForm);
    const [editId, setEditId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitBtnRef = useRef<HTMLButtonElement>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    // Refs for field navigation
    const fieldRefs = {
        BANKID: useRef<any>(null),
        TRANMODE: useRef<HTMLSelectElement>(null),
        PAYDATE: useRef<HTMLInputElement>(null),
        CHQNO: useRef<HTMLInputElement>(null),
        AMOUNT: useRef<HTMLInputElement>(null),
    };

    // Field order for focus traversal
    const fieldOrder = ["BANKID", "TRANMODE", "PAYDATE", "CHQNO", "AMOUNT"] as const;
    type FieldKey = typeof fieldOrder[number];

    // Form fields definition
    const formFields = [
        { key: "BANKID", label: "Bank Name", type: "combobox", isRequired: true, collection: bankAccList || [] },
        { key: "TRANMODE", label: "Mode", type: "select", isRequired: true },
        { key: "PAYDATE", label: "Date", type: "date", isRequired: true },
        { key: "CHQNO",   label: "Cheque No.", type: "text", isRequired: false, dependsOn: "TRANMODE" },
        { key: "AMOUNT", label: "AMOUNT", type: "number", isRequired: true, decimalScale: 2, allowNegative: false },
    ];

    // All display columns for the table
    const allDisplayCols = [
        { key: "__sno", label: "#", align: "center" as const },
        ...bankTableCols,
        { key: "__actions", label: "ACTION", align: "center" as const },
    ];

    // Reset when modal opens with new initialTransactions
    useEffect(() => {
        if (isOpen) {
            setTransactions(initialTransactions);
            setTimeout(() => { fieldRefs.BANKID.current?.focus?.(); }, 100);
        }
    }, [isOpen, initialTransactions]);

    // Escape key handler
    useGlobalKey('Escape', () => {
        if (isOpen) handleSaveAndClose();
    }, `bank-${type}-${escapeId}`);

    // Handle field change
    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setTouched(prev => ({ ...prev, [key]: true }));
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: "" }));
        }
    };

    // Focus helper
    const focusField = useCallback((key: FieldKey) => {
        setTimeout(() => {
            const ref = fieldRefs[key];
            ref?.current?.focus?.();
            ref?.current?.select?.();
        }, 50);
    }, []);

    // Validation
    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};

        fieldOrder.forEach(k => { newTouched[k] = true; });
        console.log(formData ,'bankFormData')

        if (!formData.BANKID) {
            newErrors.BANKID = "Bank name is required";
        }
        if (!formData.TRANMODE) {
            newErrors.TRANMODE = "Mode is required";
        }
        if (!formData.PAYDATE) {
            newErrors.PAYDATE = "Date is required";
        }
        if (!formData.CHQNO || formData.CHQNO.trim() === "") {
            newErrors.CHQNO = "Cheque/Reference number is required";
        }
        const AMOUNT = Number(formData.AMOUNT);
        if (!formData.AMOUNT || isNaN(AMOUNT) || AMOUNT <= 0) {
            newErrors.AMOUNT = "AMOUNT must be greater than 0";
        }

        setErrors(newErrors);
        setTouched(newTouched);

        if (Object.keys(newErrors).length > 0) {
            const firstError = fieldOrder.find(k => newErrors[k]);
            if (firstError) {
                focusField(firstError);
                toaster.create({
                    title: "Validation Error",
                    description: newErrors[firstError],
                    type: "error",
                    duration: 2000,
                });
            }
            return false;
        }

        return true;
    }, [formData, focusField]);

    // Move to next field on Enter
    

    // Submit handler
    const handleSubmit = () => {
        if (!validateForm()) return;
        setIsSubmitting(true);

        try {
            const newTransaction: BankTransaction = {
                ID: editId || `bank-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                DRAFTROWID: draftRowId,
                BANKID: formData.BANKID,
                TRANMODE: formData.TRANMODE as "C" | "F" | "I" | "N" | "R" | "U",
                PAYDATE: formData.PAYDATE,
                CHQNO: formData.CHQNO,
                AMOUNT: Number(formData.AMOUNT)
            };

            if (editId) {
                setTransactions(prev => prev.map(t => t.ID === editId ? newTransaction : t));
                setEditId(null);
            } else {
                setTransactions(prev => [...prev, newTransaction]);
            }

            resetForm();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Move to next field on Enter
    const moveToNext = useCallback((currentKey: FieldKey) => {
        const idx = fieldOrder.indexOf(currentKey);
        const nextIdx = idx + 1;

        if (nextIdx < fieldOrder.length) {
            focusField(fieldOrder[nextIdx]);
        } else {
            // Small delay to ensure the last field's state is updated
            setTimeout(() => {
                handleSubmit();
            }, 50);
        }
    }, [focusField, handleSubmit]); // Add handleSubmit to dependencies

    // Reset form
    const resetForm = () => {
        setFormData(emptyForm);
        setErrors({});
        setTouched({});
        setEditId(null);
        setTimeout(() => { fieldRefs.BANKID.current?.focus(); }, 100);
    };

    // Edit row
    const handleEditRow = (row: BankTransaction) => {
        setFormData({
            BANKID: row.BANKID,
            TRANMODE: row.TRANMODE,
            PAYDATE: row.PAYDATE,
            CHQNO: row.CHQNO,
            AMOUNT: row.AMOUNT.toString()
        });
        setEditId(row.ID);
        setErrors({});
        setTouched({});
        setTimeout(() => { fieldRefs.BANKID.current?.focus(); }, 100);
    };

    // Delete row
    const handleDeleteRow = (row: BankTransaction) => {
        if (window.confirm("Delete this transaction?")) {
            setTransactions(prev => prev.filter(t => t.ID !== row.ID));
            if (editId === row.ID) resetForm();
        }
    };

    // Save and close — notify parent
    const handleSaveAndClose = () => {
        const nonEmptyRows = transactions.filter(t =>
            t.BANKID && t.BANKID !== "" && t.AMOUNT > 0
        );
        const total = nonEmptyRows.reduce((sum, t) => sum + t.AMOUNT, 0);
        onSave(nonEmptyRows, total);
        onClose();
    };

    // Cancel
    const handleCancel = () => {
        onClose();
    };

    // Render form cell
    const renderFormCell = (field: any) => {
        const ref = fieldRefs[field.key as FieldKey];
        const value = formData[field.key as keyof typeof formData]?.toString() || "";

        if (field.key === "BANKID") {
            return (
                <Box position="relative">
                    <SelectCombobox
                        ref={ref as React.RefObject<HTMLInputElement>}
                        value={value}
                        items={bankAccList || []}
                        onChange={val => {
                            handleChange(field.key, val);
                            if (val) moveToNext(field.key);
                        }}
                        placeholder="Select Bank"
                        rounded="sm"
                        onEnter={() => moveToNext(field.key)}
                    />
                </Box>
            );
        }

        if (field.key === "TRANMODE") {
            return (
                <Box position="relative">
                    <NativeSelectWrapper
                        ref={ref as React.RefObject<HTMLSelectElement>}
                        value={value || "C"}
                        onChange={(e) => {
                            handleChange(field.key, e.target.value);
                            moveToNext(field.key);
                        }}
                        items={PaymentModes}
                        size="xs"
                        fontSize="11px"
                        minW="100%"
                        onEnter={() => moveToNext(field.key)}
                    />
                </Box>
            );
        }

        if (field.key === "PAYDATE") {
            return (
                <Box position="relative">
                    <DatePickerInput
                        ref={ref as React.RefObject<HTMLInputElement>}
                        value={value}
                        onChange={(date) => {
                            handleChange(field.key, date);
                            moveToNext(field.key);
                        }}
                        placeholder="dd-mm-yyyy"
                        dateFormat="dd-MM-yyyy"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                moveToNext(field.key);
                            }
                        }}
                        maxDate={new Date()}
                        isRoot
                    />
                </Box>
            );
        }

        if (field.key === "CHQNO") {
            return (
                <Box position="relative">
                    <CapitalizedInput
                        field={field.key}
                        value={value}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="text"
                        isCapitalized
                        size="xs"
                        rounded="sm"
                        inputRef={ref}
                        onEnter={() => moveToNext(field.key)}
                        noBorder
                    />
                </Box>
            );
        }

        if (field.key === "AMOUNT") {
            return (
                <Box position="relative">
                    <CapitalizedInput
                        field={field.key}
                        value={value}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number"
                        isCapitalized={false}
                        size="xs"
                        rounded="sm"
                        decimalScale={2}
                        inputRef={ref}
                        onEnter={() => moveToNext(field.key)}
                        noBorder
                    />
                </Box>
            );
        }

        return null;
    };

    // Get cell value
    const getCellValue = (col: any, row: BankTransaction) => {
        if (col.key === "TRANMODE") {
            const mode = PaymentModes.find(m => m.value === row.TRANMODE);
            return mode?.label || row.TRANMODE;
        }
        if (col.key === "AMOUNT") {
            return `₹${row.AMOUNT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (col.key === "BANKID") {
            const item = bankAccList?.find(i => i.value === row.BANKID);
            return item?.label || row.BANKID || "-";
        }
        return row[col.key as keyof BankTransaction] || "-";
    };
    const formatTotal = (value: any, decimalScale?: number) => {
        if (value == null) return "";
        return Number(value).toFixed(decimalScale || 0);
    };

    const totals = {
        AMOUNT: transactions.reduce((sum, t) => sum + t.AMOUNT, 0),
    };

    if (!isOpen) return null;

    return (
        <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0,0,0,0.5)"
            zIndex={50}
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={handleCancel}
        >
            <Box
                ref={modalContentRef}
                bg={theme?.colors?.formColor || "white"}
                borderRadius="xl"
                maxW="7xl"
                width="100%"
                maxH="90vh"
                overflow="auto"
                onClick={e => e.stopPropagation()}
                p={4}
                zIndex={99}
                position="relative"
                boxShadow="xl"
            >
                <HStack justify="center" mb={2}>
                    <Text fontSize="base" fontWeight="semibold">
                        Bank {type === "paid" ? "Paid" : "Received"} Details
                    </Text>
                    {/* <IconButton
                        aria-label="Close"
                        onClick={handleCancel}
                        size="sm"
                        variant="ghost"
                    >
                        {/* <LuX size={16} />
                    </IconButton> */}
                </HStack>

                {/* Hidden submit button */}
                <button
                    ref={submitBtnRef}
                    onClick={handleSubmit}
                    style={{ display: 'none' }}
                />

                {/* Transaction Table */}
                <Box position="relative" zIndex={1}>
                    <TransactionTable
                        theme={theme}
                        tableCols={bankTableCols}
                        formFields={formFields}
                        rows={transactions}
                        formData={formData}
                        errors={errors}
                        touched={touched}
                        localEditId={editId}
                        isSubmitting={isSubmitting}
                        totals={totals}
                        allDisplayCols={allDisplayCols}
                        resetForm={resetForm}
                        handleSubmit={handleSubmit}
                        handleEditRow={handleEditRow}
                        handleDeleteRow={handleDeleteRow}
                        renderFormCell={renderFormCell}
                        getCellValue={getCellValue}
                        formatTotal={formatTotal}
                        getCellStyle={getCellStyle}
                        transactionType={type}
                    />
                </Box>

                {/* Action Buttons */}
                <HStack justify="flex-end" gap={2} mt={4}>
                    <Text fontSize="small" fontWeight="500">
                        Total: ₹{totals.AMOUNT.toFixed(2)}
                    </Text>
                    <Button
                        size="xs"
                        colorPalette="blue"
                        onClick={handleSaveAndClose}
                    >
                        Save & Close
                    </Button>
                </HStack>
            </Box>
        </Box>
    );
};