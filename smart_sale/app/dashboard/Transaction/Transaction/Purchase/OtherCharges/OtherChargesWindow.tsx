"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Box,
    Text,
    Button,
    HStack,
    IconButton,
} from "@chakra-ui/react";
import { LuX, LuPlus } from "react-icons/lu";
import { SelectCombobox, SelectItem } from "@/components/ui/selectComboBox";
import TransactionTable from "@/component/table/TransactionTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { toaster } from "@/components/ui/toaster";

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
    otherChargesData?:any;
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

// const DEFAULT_CHARGE_ITEMS: SelectItem[] = [
//     { label: "HALLMARK CHARGES", value: "HALLMARK CHARGES" },
//     { label: "MAKING CHARGES", value: "MAKING CHARGES" },
//     { label: "WASTAGE CHARGES", value: "WASTAGE CHARGES" },
//     { label: "POLISHING CHARGES", value: "POLISHING CHARGES" },
//     { label: "RHODIUM CHARGES", value: "RHODIUM CHARGES" },
//     { label: "STONE SETTING CHARGES", value: "STONE SETTING CHARGES" },
//     { label: "OTHER CHARGES", value: "OTHER CHARGES" },
// ];

export default function OtherChargesWindow({
    draftRowId,
    onClose,
    onSave,
    initialRows = [],
    chargeItems,
    otherChargesData
}: Props) {

    console.log(otherChargesData, 'otherChargesData');

    const tableCols = [
        { key: "chargeName", label: "MISCELLANEOUS", align: "left" as const },
        { key: "amount", label: "AMOUNT", align: "right" as const, decimalScale: 2 },
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
    const [isInitialized, setIsInitialized] = useState(false);
    // Add state to track if amount was manually changed
    const [isAmountManuallyChanged, setIsAmountManuallyChanged] = useState(false);

    const hasLoadedRef = useRef(false);
    const chargeNameRef = useRef<any>(null);
    const amountRef = useRef<HTMLInputElement>(null);

    const fieldRefs = {
        chargeName: chargeNameRef,
        amount: amountRef,
    };

    // Field order for focus traversal
    const fieldOrder = ["chargeName", "amount"] as const;

    // useEffect to load amount when charge name changes
    useEffect(() => {
        // Only auto-load if we're not in edit mode and amount hasn't been manually changed
        if (!editId && formData.chargeName && !isAmountManuallyChanged) {
            console.log(formData.chargeName ,'checking')
            // Try to find amount from otherChargesData first
            if (otherChargesData && Array.isArray(otherChargesData)) {
                const selectedCharge = otherChargesData.find(
                    (item: any) => Number(item.sno) === Number(formData.chargeName)
                );
                console.log(selectedCharge, 'checking')

                if (selectedCharge && selectedCharge.amount) {
                    setFormData(prev => ({
                        ...prev,
                        amount: String(selectedCharge.amount)
                    }));
                }
            }
            // Optionally try from chargeItems if they contain amount
            // else if (otherChargesData && Array.isArray(otherChargesData)) {
            //     const selectedItem = otherChargesData.find(
            //         (item: any) => item.value === formData.chargeName
            //     );

            //     if (selectedItem && selectedItem.amount) {
            //         setFormData(prev => ({
            //             ...prev,
            //             amount: selectedItem.amount.toString()
            //         }));
            //     }
            // }
        }

        // Reset manual change flag when charge name changes (if we're in a new selection)
        if (formData.chargeName) {
            setIsAmountManuallyChanged(true);
        }
    }, [formData.chargeName, editId, otherChargesData, chargeItems, isAmountManuallyChanged]);

    /* ---------------- LOAD FROM LOCALSTORAGE ---------------- */
    useEffect(() => {
        if (!draftRowId) return;

        if (hasLoadedRef.current && rows.length > 0) {
            console.log(`Already loaded charges for ${draftRowId}, skipping...`);
            return;
        }

        const all: MiscChargeRow[] = JSON.parse(localStorage.getItem("MISC_CHARGE_MASTER") || "[]");
        const linked = all.filter(s => s.draftRowId === draftRowId);
        const nonEmptyRows = linked.filter(s => s.chargeName && s.chargeName !== "" && s.amount > 0);

        if (nonEmptyRows.length > 0) {
            setRows(nonEmptyRows);
            const filtered = all.filter(s =>
                s.draftRowId !== draftRowId || (s.chargeName && s.chargeName !== "" && s.amount > 0)
            );
            localStorage.setItem("MISC_CHARGE_MASTER", JSON.stringify(filtered));
        }

        setIsInitialized(true);
        hasLoadedRef.current = true;

        setTimeout(() => { chargeNameRef.current?.focus?.(); }, 100);

        return () => {
            setTimeout(() => { hasLoadedRef.current = false; }, 300);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftRowId]);

    /* ---------------- ESC KEY — attached to window, not inside load effect ---------------- */
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscKey);
        return () => window.removeEventListener("keydown", handleEscKey);
    }, [onClose]);

    /* ---------------- SAVE TO LOCALSTORAGE ---------------- */
    useEffect(() => {
        if (!isInitialized || !draftRowId) return;
        saveChargesToStorage();
    }, [rows, draftRowId, isInitialized]);

    const saveChargesToStorage = () => {
        const all: MiscChargeRow[] = JSON.parse(localStorage.getItem("MISC_CHARGE_MASTER") || "[]");
        const filtered = all.filter(s => s.draftRowId !== draftRowId);
        const nonEmptyRows = rows.filter(s => s.chargeName && s.chargeName !== "" && s.amount > 0);
        localStorage.setItem("MISC_CHARGE_MASTER", JSON.stringify([...filtered, ...nonEmptyRows]));
    };

    /* ---------------- FORM FIELDS ---------------- */
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
        },
    ];

    /* ---------------- FOCUS HELPER ---------------- */
    const focusField = useCallback((key: typeof fieldOrder[number]) => {
        setTimeout(() => {
            const ref = fieldRefs[key];
            ref?.current?.focus?.();
            ref?.current?.select?.();
        }, 50);
    }, []);


    /* ---------------- VALIDATION with focus ---------------- */
    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};

        // Check chargeName
        if (!formData.chargeName || formData.chargeName.trim() === "") {
            newErrors.chargeName = "Charge name is required";
        }
        newTouched.chargeName = true;

        // Check amount
        const amount = Number(formData.amount);
        if (!formData.amount || isNaN(amount) || amount <= 0) {
            newErrors.amount = "Amount must be greater than 0";
        }
        newTouched.amount = true;

        setErrors(newErrors);
        setTouched(newTouched);

        if (Object.keys(newErrors).length > 0) {
            // Focus the first errored field
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

    /* ---------------- HANDLERS ---------------- */
    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setTouched(prev => ({ ...prev, [key]: true }));
        setErrors(prev => ({ ...prev, [key]: "" }));

        // If user manually changes amount, set the flag
        if (key === 'amount') {
            setIsAmountManuallyChanged(true);
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
        setIsAmountManuallyChanged(false); // Reset manual change flag
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
        saveChargesToStorage();
        const nonEmptyRows = rows.filter(r => r.chargeName && r.chargeName !== "" && r.amount > 0);
        onSave(nonEmptyRows);
        onClose();
    };

    // Optional: Add a reset to default button functionality
    const handleResetToDefault = () => {
        if (formData.chargeName && otherChargesData) {
            const selectedCharge = otherChargesData.find(
                (item: any) => item.value === formData.chargeName || item.label === formData.chargeName
            );

            if (selectedCharge && selectedCharge.amount) {
                setFormData(prev => ({
                    ...prev,
                    amount: selectedCharge.amount.toString()
                }));
                setIsAmountManuallyChanged(false);
            }
        }
    };

    /* ---------------- RENDER FORM CELL ---------------- */
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
                />
               
            </Box>
        );
    };

    const getCellValue = (col: any, row: MiscChargeRow) => {
        if (col.key === "amount") {
        
            return `${row.amount.toLocaleString()}`;
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

    /* ---------------- UI ---------------- */
    return (
        <Box p={2} minW="450px">
            <HStack justify="space-between" mb={2}>
                <Text fontSize="smaller" fontWeight="semibold">
                    OTHER CHARGES DETAILS
                </Text>
                <HStack gap={1}>
                    <IconButton
                        aria-label="Close"
                        onClick={onClose}
                        size="xs"
                        variant="ghost"
                        title="Close"
                    >
                        <LuX size={14} />
                    </IconButton>
                </HStack>
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
                {/* Optional: Reset button */}
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
                <Button variant="outline" size="xs" onClick={onClose} title="ESC">
                    Cancel
                </Button>
                <Button colorPalette="blue" size="xs" onClick={handleSaveAndClose}>
                    Save & Close
                </Button>
            </HStack>
        </Box>
    );
}