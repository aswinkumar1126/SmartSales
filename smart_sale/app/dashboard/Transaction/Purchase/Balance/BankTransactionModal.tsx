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
    id: string;
    draftRowId: string;
    bankName: string;
    tranMode: "C" | "F" | "I" | "N" | "R" | "U";
    tranDate: string;
    chqNo: string;
    amount: number;
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
}

// Bank names collection
const bankCollection = {
    items: [
        { label: "State Bank of India", value: "SBI" },
        { label: "HDFC Bank", value: "HDFC" },
        { label: "ICICI Bank", value: "ICICI" },
        { label: "Axis Bank", value: "AXIS" },
        { label: "Punjab National Bank", value: "PNB" },
        { label: "Bank of Baroda", value: "BOB" },
        { label: "Canara Bank", value: "CANARA" },
        { label: "Union Bank", value: "UNION" },
        { label: "Indian Bank", value: "INDIAN" },
        { label: "Other", value: "OTHER" },
    ]
};

// Define table columns for bank transactions
const bankTableCols = [
    { key: "bankName", label: "BANK NAME", align: "left" as const },
    { key: "tranMode", label: "MODE", align: "center" as const },
    { key: "tranDate", label: "DATE", align: "center" as const },
    { key: "chqNo", label: "CHEQUE NO.", align: "left" as const },
    { key: "amount", label: "AMOUNT", align: "right" as const, decimalScale: 2 },
];

// Column widths
const COL_WIDTHS: Record<string, string> = {
    __sno: "40px",
    bankName: "140px",
    tranMode: "70px",
    tranDate: "100px",
    chqNo: "120px",
    amount: "120px",
    __actions: "60px",
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
    escapeId
}: BankTransactionModalProps) => {
    const emptyForm = {
        bankName: "",
        tranMode: "F",
        tranDate: new Date().toISOString().split('T')[0],
        chqNo: "",
        amount: ""
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
        bankName: useRef<any>(null),
        tranMode: useRef<HTMLSelectElement>(null),
        tranDate: useRef<HTMLInputElement>(null),
        chqNo: useRef<HTMLInputElement>(null),
        amount: useRef<HTMLInputElement>(null),
    };

    // Field order for focus traversal
    const fieldOrder = ["bankName", "tranMode", "tranDate", "chqNo", "amount"] as const;
    type FieldKey = typeof fieldOrder[number];

    // Form fields definition
    const formFields = [
        { key: "bankName", label: "Bank Name", type: "combobox", isRequired: true, collection: bankCollection },
        { key: "tranMode", label: "Mode", type: "select", isRequired: true },
        { key: "tranDate", label: "Date", type: "date", isRequired: true },
        { key: "chqNo", label: "Cheque No.", type: "text", isRequired: false, dependsOn: "tranMode" },
        { key: "amount", label: "Amount", type: "number", isRequired: true, decimalScale: 2, allowNegative: false },
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
            setTimeout(() => { fieldRefs.bankName.current?.focus?.(); }, 100);
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

        if (!formData.bankName || formData.bankName.trim() === "") {
            newErrors.bankName = "Bank name is required";
        }
        if (!formData.tranMode) {
            newErrors.tranMode = "Mode is required";
        }
        if (!formData.tranDate) {
            newErrors.tranDate = "Date is required";
        }
        if (!formData.chqNo || formData.chqNo.trim() === "") {
            newErrors.chqNo = "Cheque/Reference number is required";
        }
        const amount = Number(formData.amount);
        if (!formData.amount || isNaN(amount) || amount <= 0) {
            newErrors.amount = "Amount must be greater than 0";
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
                id: editId || `bank-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                draftRowId: draftRowId,
                bankName: formData.bankName,
                tranMode: formData.tranMode as "C" | "F" | "I" | "N" | "R" | "U",
                tranDate: formData.tranDate,
                chqNo: formData.chqNo,
                amount: Number(formData.amount)
            };

            if (editId) {
                setTransactions(prev => prev.map(t => t.id === editId ? newTransaction : t));
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
        setTimeout(() => { fieldRefs.bankName.current?.focus(); }, 100);
    };

    // Edit row
    const handleEditRow = (row: BankTransaction) => {
        setFormData({
            bankName: row.bankName,
            tranMode: row.tranMode,
            tranDate: row.tranDate,
            chqNo: row.chqNo,
            amount: row.amount.toString()
        });
        setEditId(row.id);
        setErrors({});
        setTouched({});
        setTimeout(() => { fieldRefs.bankName.current?.focus(); }, 100);
    };

    // Delete row
    const handleDeleteRow = (row: BankTransaction) => {
        if (window.confirm("Delete this transaction?")) {
            setTransactions(prev => prev.filter(t => t.id !== row.id));
            if (editId === row.id) resetForm();
        }
    };

    // Save and close — notify parent
    const handleSaveAndClose = () => {
        const nonEmptyRows = transactions.filter(t =>
            t.bankName && t.bankName !== "" && t.amount > 0
        );
        const total = nonEmptyRows.reduce((sum, t) => sum + t.amount, 0);
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

        if (field.key === "bankName") {
            return (
                <Box position="relative">
                    <SelectCombobox
                        ref={ref as React.RefObject<HTMLInputElement>}
                        value={value}
                        items={bankCollection.items}
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

        if (field.key === "tranMode") {
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
                        maxW="100%"
                        onEnter={() => moveToNext(field.key)}
                    />
                </Box>
            );
        }

        if (field.key === "tranDate") {
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
                    />
                </Box>
            );
        }

        if (field.key === "chqNo") {
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

        if (field.key === "amount") {
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
        if (col.key === "tranMode") {
            const mode = PaymentModes.find(m => m.value === row.tranMode);
            return mode?.label || row.tranMode;
        }
        if (col.key === "amount") {
            return `₹${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (col.key === "bankName") {
            const item = bankCollection.items.find(i => i.value === row.bankName);
            return item?.label || row.bankName || "-";
        }
        return row[col.key as keyof BankTransaction] || "-";
    };

    const formatTotal = (value: any, decimalScale?: number) => {
        if (value == null) return "";
        return Number(value).toFixed(decimalScale || 0);
    };

    const totals = {
        amount: transactions.reduce((sum, t) => sum + t.amount, 0),
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
            zIndex={9998}
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
                zIndex={9999}
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
                        Total: ₹{totals.amount.toFixed(2)}
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