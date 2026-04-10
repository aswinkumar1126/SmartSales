"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Box,
    Text,
    Button,
    HStack,
} from "@chakra-ui/react";
import { SelectCombobox, SelectItem } from "@/components/ui/selectComboBox";
import TransactionTable from "@/component/table/TransactionTable";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { toaster } from "@/components/ui/toaster";
import { useGlobalKey } from "@/components/key/useGlobalKey";

type MiscChargeRow = {
    id: string;
    draftRowId: string;
    chargeName: string;
    amount: number;
};

type Props = {
    draftRowId: string;
    onClose: () => void;
    onSave: (rows: MiscChargeRow[]) => void;
    initialRows?: MiscChargeRow[];
    chargeItems?: SelectItem[];
    otherChargesData?: any;
};

const COL_WIDTHS: Record<string, string> = {
    __sno: "40px",
    chargeName: "200px",
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

export default function OtherChargesWindow({
    draftRowId,
    onClose,
    onSave,
    initialRows = [],
    chargeItems,
    otherChargesData
}: Props) {

    console.log(initialRows,'initialRowsinitialRows')

    const prevInitialRowsRef = useRef<string>('');

    const tableCols = [
        { key: "chargeName", label: "MISCELLANEOUS", align: "left" as const },
        { key: "amount", label: "AMOUNT", align: "right" as const, decimalScale: 2, allowFocus: true },
    ];

    const allDisplayCols = [
        { key: "__sno", label: "#", align: "center" as const },
        ...tableCols,
        { key: "__actions", label: "ACTION", align: "center" as const },
    ];

    const emptyForm = { chargeName: "", amount: "" };

    const [formData, setFormData] = useState<{ chargeName: string; amount: string }>(emptyForm);
    const [rows, setRows] = useState<MiscChargeRow[]>([]);
    const [editId, setEditId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting] = useState(false);
    const [isAmountManuallyChanged, setIsAmountManuallyChanged] = useState(false);

    const chargeNameRef = useRef<any>(null);
    const amountRef = useRef<HTMLInputElement>(null);

    const fieldRefs = {
        chargeName: chargeNameRef,
        amount: amountRef,
    };

    const fieldOrder = ["chargeName", "amount"] as const;

  

    useEffect(() => {
        const currentRowsString = JSON.stringify(initialRows);

        // Only update if initialRows actually changed
        if (prevInitialRowsRef.current !== currentRowsString) {
            prevInitialRowsRef.current = currentRowsString;

            if (initialRows && initialRows.length > 0) {
                const mappedRows = initialRows.map(r => ({ ...r, draftRowId }));
                setRows(mappedRows);
            } else {
                setRows([]);
            }
        }

        setTimeout(() => { chargeNameRef.current?.focus?.(); }, 100);
    }, [initialRows, draftRowId]);

    // ✅ FIXED: Auto-fill amount when charge name changes (if not manually changed)
    useEffect(() => {
        // Only auto-fill if:
        // 1. Not in edit mode
        // 2. Has a charge name selected
        // 3. Amount has NOT been manually changed
        if (!editId && formData.chargeName && !isAmountManuallyChanged) {
            if (otherChargesData && Array.isArray(otherChargesData)) {
                const selectedCharge = otherChargesData.find(
                    (item: any) => Number(item.chargeId) === Number(formData.chargeName)
                );

                if (selectedCharge && selectedCharge.chargeAmount) {
                    setFormData(prev => ({
                        ...prev,
                        amount: String(selectedCharge.chargeAmount)
                    }));
                    // Keep isAmountManuallyChanged as false since this is auto-filled
                }
            }
        }
    }, [formData.chargeName, editId, otherChargesData, isAmountManuallyChanged]);

    const formFields = [
        {
            key: "chargeName",
            label: "Charge Name",
            type: "combobox" as const,
            isRequired: true,
            collection: { items: chargeItems || [] },
            ref: chargeNameRef,
        },
        {
            key: "amount",
            label: "Amount",
            type: "number" as const,
            isRequired: true,
            decimalScale: 2,
            placeholder: "0.00",
            ref: amountRef,
            allowFocus: true
        },
    ];

    const focusField = useCallback((key: typeof fieldOrder[number]) => {
        setTimeout(() => {
            const ref = fieldRefs[key];
            ref?.current?.focus?.();
            ref?.current?.select?.();
        }, 50);
    }, []);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};

        if (!formData.chargeName || formData.chargeName.trim() === "") {
            newErrors.chargeName = "Charge name is required";
        }
        newTouched.chargeName = true;

        const amount = Number(formData.amount);
        if (!formData.amount || isNaN(amount) || amount <= 0) {
            newErrors.amount = "Amount must be greater than 0";
        }
        newTouched.amount = true;

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

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setTouched(prev => ({ ...prev, [key]: true }));
        setErrors(prev => ({ ...prev, [key]: "" }));

        // ✅ FIXED: If user manually changes amount, set the flag
        if (key === 'amount') {
            setIsAmountManuallyChanged(true);
        }

        // If user changes charge name, reset the manual change flag
        if (key === 'chargeName') {
            setIsAmountManuallyChanged(false);
        }
    };

    const handleSubmit = useCallback(() => {
        if (!validateForm()) return;

        const newRow: MiscChargeRow = {
            id: editId ?? `charge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            draftRowId: draftRowId,
            chargeName: formData.chargeName,
            amount: Number(formData.amount),
        };

        if (editId) {
            setRows(prev => prev.map(r => r.id === editId ? newRow : r));
            setEditId(null);
        } else {
            setRows(prev => [...prev, newRow]);
        }

        resetForm();
    }, [formData, editId, draftRowId, validateForm]);

    const moveToNext = useCallback((currentKey: typeof fieldOrder[number]) => {
        const idx = fieldOrder.indexOf(currentKey);
        if (idx < fieldOrder.length - 1) {
            focusField(fieldOrder[idx + 1]);
        } else {
            handleSubmit();
        }
    }, [focusField, handleSubmit]);

    const resetForm = () => {
        setFormData(emptyForm);
        setErrors({});
        setTouched({});
        setIsAmountManuallyChanged(false);
        setTimeout(() => { chargeNameRef.current?.focus(); }, 100);
    };

    const handleEditRow = (row: MiscChargeRow) => {
        setFormData({ chargeName: row.chargeName, amount: row.amount.toString() });
        setEditId(row.id);
        setErrors({});
        setTouched({});
        setIsAmountManuallyChanged(true); // When editing, treat as manually set
        setTimeout(() => { chargeNameRef.current?.focus(); }, 100);
    };

    const handleDeleteRow = (row: MiscChargeRow) => {
        if (confirm("Delete this charge?")) {
            setRows(prev => prev.filter(r => r.id !== row.id));
            if (editId === row.id) resetForm();
        }
    };

    const handleSaveAndClose = () => {
        const nonEmptyRows = rows.filter(r => r.chargeName && r.chargeName !== "" && r.amount > 0);
        onSave(nonEmptyRows);
        onClose();
    };

    useGlobalKey('Escape', () => {
        handleSaveAndClose();
    }, "other-charges-window");

    const handleResetToDefault = () => {
        if (formData.chargeName && otherChargesData) {
            const selectedCharge = otherChargesData.find(
                (item: any) => Number(item.chargeId) === Number(formData.chargeName)
            );

            if (selectedCharge && selectedCharge.chargeAmount) {
                setFormData(prev => ({
                    ...prev,
                    amount: selectedCharge.chargeAmount.toString()
                }));
                setIsAmountManuallyChanged(false);
            }
        }
    };

    const renderFormCell = (field: any) => {
        const ref = fieldRefs[field.key as keyof typeof fieldRefs];
        const value = formData[field.key as keyof typeof formData]?.toString() || "";
        const isInvalid = !!errors[field.key] && !!touched[field.key];

        if (field.type === "combobox") {
            return (
                <Box position="relative">
                    <SelectCombobox
                        value={value}
                        items={field.collection?.items || []}
                        onChange={val => {
                            handleChange(field.key, val);
                            if (val) moveToNext(field.key);
                        }}
                        ref={ref as React.RefObject<HTMLInputElement>}
                        onEnter={() => moveToNext(field.key)}
                        rounded="sm"
                        placeholder={`Select ${field.label}`}
                    />
                    {isInvalid && (
                        <Text fontSize="9px" color="red.500" position="absolute" bottom="-13px" left="2px" whiteSpace="nowrap">
                            {errors[field.key]}
                        </Text>
                    )}
                </Box>
            );
        }

        return (
            <Box position="relative">
                <CapitalizedInput
                    value={value}
                    field={field.key}
                    type="number"
                    allowDecimal={field.decimalScale > 0}
                    onChange={(f, v) => handleChange(f, v)}
                    inputRef={ref}
                    onEnter={() => moveToNext(field.key)}
                    size="xs"
                    rounded="sm"
                    noBorder
                    allowFocus={true}
                />
                {isInvalid && (
                    <Text fontSize="9px" color="red.500" position="absolute" bottom="-13px" left="2px" whiteSpace="nowrap">
                        {errors[field.key]}
                    </Text>
                )}
            </Box>
        );
    };

    const getCellValue = (col: any, row: MiscChargeRow) => {
        if (col.key === "amount") {
            return `${formatTotal(row.amount, 2)}`;
        }
        if (col.key === "chargeName") {
            const item = chargeItems?.find(i => i.value === row.chargeName);
            return item?.label || row.chargeName || "-";
        }
        return row[col.key as keyof MiscChargeRow];
    };

    const formatTotal = (value: any, decimalScale?: number) => {
        if (value == null) return "";
        return Number(value).toFixed(decimalScale || 0);
    };

    const totals = {
        amount: rows.reduce((sum, r) => sum + r.amount, 0),
    };

    return (
        <Box p={2} minW="600px">
            <HStack justify="center" mb={2}>
                <Text fontSize="smaller" fontWeight="semibold">
                    OTHER CHARGES DETAILS
                </Text>
            </HStack>

            <TransactionTable
                theme={{ colors: { borderColor: "#CBD5E0", formColor: "#EDF2F7" } }}
                tableCols={tableCols}
                formFields={formFields}
                rows={rows}
                formData={formData}
                errors={errors}
                touched={touched}
                localEditId={editId}
                isSubmitting={isSubmitting}
                totals={totals}
                stripedBg="#F7FAFC"
                allDisplayCols={allDisplayCols}
                resetForm={resetForm}
                handleSubmit={handleSubmit}
                handleEditRow={handleEditRow}
                handleDeleteRow={handleDeleteRow}
                renderFormCell={renderFormCell}
                getCellValue={getCellValue}
                formatTotal={formatTotal}
                getCellStyle={getCellStyle}
            />

            <HStack justify="flex-end" gap={2} mt={4}>
                {isAmountManuallyChanged && formData.chargeName && (
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={handleResetToDefault}
                        colorScheme="orange"
                    >
                        Reset to Default
                    </Button>
                )}
                <Text m={2} fontSize="small" fontWeight="500">
                    Total: ₹{totals.amount.toFixed(2)}
                </Text>
                <Button colorPalette="blue" size="xs" onClick={handleSaveAndClose}>
                    Save & Close
                </Button>
            </HStack>
        </Box>
    );
}