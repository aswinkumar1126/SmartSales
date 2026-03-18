"use client";

/**
 * BARCODE GENERATION COMPONENT
 * @component
 */

/*--------------STATES--------------------*/
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Box, Table, Text, Button, HStack, Drawer, Portal } from '@chakra-ui/react';

/*--------------COMPONENTS------------------*/
import BarcodeHeaderForm from "./BarcodeHeaderForm/BarCodeHeaderForm";
import { CustomTable } from "@/component/table/CustomTable";
import SummaryTable from "@/component/table/SummaryTable";
import TransactionTable from "@/component/table/TransactionTable";

import { SelectCombobox } from "@/components/ui/selectComboBox";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";
import { toaster } from "@/components/ui/toaster";

/*--------------TYPES----------------------*/
import { BarcodeHeaderFormInterface } from "@/types/barcode/HeaderForm";

/*--------------HOOKS---------------------*/
import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";
import { useBarcodeItems } from "@/hooks/barcode/useBarcodeItems";
import { useSessionStorage } from "@/hooks/storage/useSessionStorage";
import { useTheme } from "@/context/theme/themeContext";
import { useSoftControlById } from "@/hooks/softControl/useSoftControl";

/*-------------- CONSTANTS & DATA's --------------*/
import { transactionTableCols } from "@/data/barcodeGenerate/barcodeFormFields";

/*-------------- UTILITIES  -------------------*/
import { formatToFixed } from "@/utils/format/numberFormat";


import Image from "next/image";
import saveIcon from '@/asserts/icons/save.png';
import clearIcon from '@/asserts/icons/clear.jpeg';
import updateIcon from '@/asserts/icons/update.png';
import { HiFilter } from "react-icons/hi";

/*-------------- STORAGE KEYS -------------------*/
const BARCODE_HEADER_KEY = 'barcode_header_form';
const BARCODE_TRANSACTIONS_KEY = 'barcode_transactions';

const safeNum = (val: any): number => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};






// Transaction item interface
interface BarcodeTransactionItem {
    
    id: string;
    draftRowId: string;
    grsweight: number;
    stoneWt: number;
    salesStoneWt: number;
    wastePercent: number;
    size: string;
    diamondWt: number;
    mc: number;
    touch: number;
    barcode: string;
    print?: boolean;
}

// Define field order for focus traversal (excluding any calculated/disabled fields)
const FIELD_ORDER = [
    "grsweight", "stoneWt", "salesStoneWt", "wastePercent",
    "size", "diamondWt", "mc", "touch", "barcode"
] as const;

type FieldKey = typeof FIELD_ORDER[number];

function BarCodeGenerate() {
    const { theme } = useTheme();

    /**
     * Refs
     */
    const isFirstRender = useRef(true);
    const submitBtnRef = useRef<HTMLButtonElement>(null);
    const rowsRef = useRef<BarcodeTransactionItem[]>([]);

    // Individual refs for each field
    const weightRef = useRef<HTMLInputElement>(null);
    const stoneWtRef = useRef<HTMLInputElement>(null);
    const salesStoneWtRef = useRef<HTMLInputElement>(null);
    const wastePercentRef = useRef<HTMLInputElement>(null);
    const sizeRef = useRef<HTMLInputElement>(null);
    const diamondWtRef = useRef<HTMLInputElement>(null);
    const mcRef = useRef<HTMLInputElement>(null);
    const touchRef = useRef<HTMLInputElement>(null);
    const barcodeRef = useRef<HTMLInputElement>(null);

    //overlay requirements
      const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const handleShowFilter = () => {
    setIsFilterOpen(prev => !prev);
  };

  const closeFilter=()=>{
    setIsFilterOpen(prev => !prev);
  }

    const fieldRefs: Record<FieldKey, React.RefObject<any>> = {
        grsweight: weightRef,
        stoneWt: stoneWtRef,
        salesStoneWt: salesStoneWtRef,
        wastePercent: wastePercentRef,
        size: sizeRef,
        diamondWt: diamondWtRef,
        mc: mcRef,
        touch: touchRef,
        barcode: barcodeRef,
    };
    

    /**
     * State Management with Session Storage
     */
    const [barcodeHeaderForm, setBarcodeHeaderForm] = useSessionStorage<BarcodeHeaderFormInterface>(
        BARCODE_HEADER_KEY,
        {
            ENTRYNO: "",
            DATE: "",
            COMPANYTYPE: "PR",
            COMPANYNAME: "",
            INWARDNO: "",
            ITEMNAME: ""
        }
    );

    const [transactionRows, setTransactionRows] = useSessionStorage<BarcodeTransactionItem[]>(
        BARCODE_TRANSACTIONS_KEY,
        []
    );
//clear ALL 
    const  handleClear=()=>{
        setTransactionRows([])
    }

    // Update rowsRef whenever transactionRows changes
    useEffect(() => {
        rowsRef.current = transactionRows;
    }, [transactionRows]);

    const emptyTransactionForm = {
        grsweight: "",
        stoneWt: "",
        salesStoneWt: "",
        wastePercent: "",
        size: "",
        diamondWt: "",
        mc: "",
        touch: "",
        barcode: "",
    };

    const [transactionFormData, setTransactionFormData] = useState(emptyTransactionForm);
    const [editId, setEditId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Data Fetching Hooks
     */
    const { data: allPurchaseAccount } = useAllAccountHead("", {
        accountType: barcodeHeaderForm.COMPANYTYPE || "PR"
    });

    const { data: barcodeItems } = useBarcodeItems({
        ACCODE: Number(barcodeHeaderForm.COMPANYNAME),
        PURCHASE_ENTRYNO: Number(barcodeHeaderForm.INWARDNO),
        SNO: String(barcodeHeaderForm.ITEMNAME),
    });

      const { data: softControlDataById, isLoading, error } = useSoftControlById('LOT_TAG_CONTROL')
      console.log(softControlDataById,'softControlDataById')
    console.log(barcodeItems,'barcodeItems')
    /**
     * Effects
     */
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (barcodeItems?.ENTRY_NO) {
            setBarcodeHeaderForm((prev) => ({
                ...prev,
                ENTRYNO: String(barcodeItems.ENTRY_NO),
            }));
        }
    }, [barcodeItems, setBarcodeHeaderForm]);

    // Focus first field when component mounts or when editId changes
    useEffect(() => {
        setTimeout(() => {
            if (editId) {
                fieldRefs[FIELD_ORDER[0]]?.current?.focus();
            } else {
                fieldRefs[FIELD_ORDER[0]]?.current?.focus();
            }
        }, 100);
    }, [editId]);

    /**
     * Data Transformations
     */
    const purchaserCollection = Array.isArray(allPurchaseAccount?.data?.acheads)
        ? allPurchaseAccount.data.acheads.map((item: any) => ({
            label: item.ACNAME,
            value: item.ACCODE,
        }))
        : [];

    const inwardCollection = Array.isArray(barcodeItems?.PURCHASE_ENTRY_NO)
        ? barcodeItems.PURCHASE_ENTRY_NO.map((item: number) => ({
            label: String(`INWARD NO ${item}`),
            value: String(item),
        }))
        : [];

    const itemCollection = Array.isArray(barcodeItems?.ITEMLIST)
        ? barcodeItems.ITEMLIST.map((item: any) => ({
            label: item.ITEMNAME,
            value: item.SNO,
        }))
        : [];

    const itemSizeCollection = Array.isArray(barcodeItems?.SIZELIST)
        ? barcodeItems.SIZELIST.map((item: any) => ({
            label: item.SIZENAME,
            value: String(item.SIZEID),
        }))
        : [];
    
    const baseBarcodePrefix = barcodeItems?.TAGNO?.PREFIX || "";
    console.log(baseBarcodePrefix,'baseBarcodePrefix')
    const startBarcodeNumber = Number(barcodeItems?.TAGNO?.TAGNO || 0);

    const rebuildBarcodes = (rows: BarcodeTransactionItem[]) => {
        return rows.map((row, index) => {
            // Always regenerate barcode based on position in the array
            return {
                ...row,
                barcode: `${baseBarcodePrefix}${startBarcodeNumber + index + 1}`
            };
        });
    };
    /* ==================== TRANSACTION TABLE CONFIGURATION ==================== */

    // Table columns definition
    const getWidth = (width: string | number) => width || "50px";

    // Fields that should be treated as numbers
    const numericFields = ["grsweight", "stoneWt", "salesStoneWt", "wastePercent", "diamondWt", "mc", "touch"];


    // Generate form fields from table columns using useMemo
    const transactionFormFields = useMemo(() => {
        return transactionTableCols.map((col): any => {
            const isNum = numericFields.includes(col.key );
            const isRequired = ["grsweight", "stoneWt", "salesStoneWt"].includes(col.key);

            const base: any = {
                key: col.key,
                label: col.label || col.key,
                placeholder: col.label || col.key,
                type: isNum ? "number" : "text",
                isRequired,
                size: "xs",
                align: "right", // Right align numbers
            };

            // Add decimal scale if specified in column
            if (col.decimalScale) {
                base.decimalScale = col.decimalScale;
            }

            // Special field types
            if (col.key === "size") {
                return { ...base, type: "combobox" as const, align: "left", collection: itemSizeCollection   };
            }

            if (col.key === "wastePercent") {
                return { ...base, type: "number", decimalScale: 2 };
            }

            if (col.key === "barcode") {
                return { ...base, type: "text", align: "left" ,disabled:true };
            }

            return base;
        });
    }, [transactionTableCols, itemSizeCollection]);

    // Filter visible form fields (exclude any calculated fields if needed)
    const visibleFormFields = useMemo(() => {
        return transactionFormFields.filter(f => f.type !== "calculated");
    }, [transactionFormFields]);

    // All display columns including S.No, actions, and print
    const allDisplayCols = [
        { key: "__sno", label: "#", align: "center" as const, width: '50px' },
        ...transactionTableCols.map(col => ({
            ...col,
            align: col.key === "size" || col.key === "barcode" ? "left" as const : "right" as const
        })),
        { key: "__actions", label: "ACTIONS", align: "center" as const, width: '50px' },
        { key: "__print", label: "PRINT", align: "center" as const, width: '50px' },
    ];

    const validateTransactionForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};

        // Mark all fields as touched
        FIELD_ORDER.forEach(k => {
            newTouched[k] = true;
        });

        // Validation rules
        if (!transactionFormData.grsweight || Number(transactionFormData.grsweight) <= 0) {
            newErrors.grsweight = "Weight must be greater than 0";
        }
        if (!transactionFormData.stoneWt || Number(transactionFormData.stoneWt) < 0) {
            newErrors.stoneWt = "Stone weight must be 0 or greater";
        }
        if (!transactionFormData.salesStoneWt || Number(transactionFormData.salesStoneWt) < 0) {
            newErrors.salesStoneWt = "Sales stone weight must be 0 or greater";
        }
       
        setErrors(newErrors);
        setTouched(newTouched);

        if (Object.keys(newErrors).length > 0) {
            // Focus the first errored field
            const firstError = FIELD_ORDER.find(k => newErrors[k]);
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
    };

    /**
     * Focus management functions
     */
    const focusField = useCallback((key: FieldKey) => {
        setTimeout(() => {
            const ref = fieldRefs[key];
            ref?.current?.focus?.();
            ref?.current?.select?.();
        }, 50);
    }, []);

    const handleTransactionSubmit = useCallback(() => {
        if (!validateTransactionForm()) return;
        setIsSubmitting(true);

        try {
            let newTransaction: BarcodeTransactionItem;

            if (editId) {
                // 🖊️ Editing → update but don't change barcode
                const existingRow = transactionRows.find(t => t.id === editId);
                if (!existingRow) return;

                newTransaction = {
                    ...existingRow,
                    grsweight: Number(transactionFormData.grsweight),
                    stoneWt: Number(transactionFormData.stoneWt),
                    salesStoneWt: Number(transactionFormData.salesStoneWt),
                    wastePercent: Number(transactionFormData.wastePercent || 0),
                    size: transactionFormData.size,
                    diamondWt: Number(transactionFormData.diamondWt),
                    mc: Number(transactionFormData.mc),
                    touch: Number(transactionFormData.touch),
                    // Keep existing barcode
                };

                const updatedRows = transactionRows.map(t => t.id === editId ? newTransaction : t);
                // Rebuild barcodes to maintain sequence
                const rebuiltRows = rebuildBarcodes(updatedRows);
                setTransactionRows(rebuiltRows);
                setEditId(null);

                toaster.create({
                    title: "Row Updated",
                    description: "Row has been updated successfully",
                    type: "success",
                    duration: 2000,
                });

            } else {
                // ➕ New row → add at the end
                newTransaction = {
                    id: `barcode-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    draftRowId: barcodeHeaderForm.ENTRYNO || Date.now().toString(),
                    grsweight: Number(transactionFormData.grsweight),
                    stoneWt: Number(transactionFormData.stoneWt),
                    salesStoneWt: Number(transactionFormData.salesStoneWt),
                    wastePercent: Number(transactionFormData.wastePercent || 0),
                    size: transactionFormData.size,
                    diamondWt: Number(transactionFormData.diamondWt),
                    mc: Number(transactionFormData.mc),
                    touch: Number(transactionFormData.touch),
                    barcode: '', // Will be set by rebuildBarcodes
                };

                const updatedRows = [...transactionRows, newTransaction];
                // Rebuild barcodes to assign sequential numbers
                const rebuiltRows = rebuildBarcodes(updatedRows);
                setTransactionRows(rebuiltRows);

                toaster.create({
                    title: "Row Added",
                    description: "New row has been added successfully",
                    type: "success",
                    duration: 2000,
                });
            }

            resetTransactionForm();
            setTimeout(() => focusField(FIELD_ORDER[0]), 100);

        } finally {
            setIsSubmitting(false);
        }
    }, [
        transactionFormData,
        editId,
        barcodeHeaderForm.ENTRYNO,
        transactionRows,
        validateTransactionForm,
        focusField,
        baseBarcodePrefix,
        startBarcodeNumber
    ]);
    /**
     * Focus management functions
     */
    const moveToNext = useCallback((currentKey: FieldKey) => {
        const idx = FIELD_ORDER.indexOf(currentKey);
        if (idx < FIELD_ORDER.length - 2) {
            focusField(FIELD_ORDER[idx + 1]);
        } else {
            handleTransactionSubmit();
        }
    }, [handleTransactionSubmit, focusField]);

    const handleHeaderChange = (field: any, value: any) => {
        setBarcodeHeaderForm((prev) => ({ ...prev, [field]: value }));
    };

    /**
     * Transaction Table Handlers
     */
    const handleTransactionChange = (key: string, value: any) => {
        setTransactionFormData(prev => ({ ...prev, [key]: value }));
        setTouched(prev => ({ ...prev, [key]: true }));
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: "" }));
        }
    };

    const resetTransactionForm = () => {
        setTransactionFormData(emptyTransactionForm);
        setErrors({});
        setTouched({});
        setEditId(null);
    };

    const handleEditRow = (row: BarcodeTransactionItem) => {
        setTransactionFormData({
            grsweight: row.grsweight.toString(),
            stoneWt: row.stoneWt.toString(),
            salesStoneWt: row.salesStoneWt.toString(),
            wastePercent: row.wastePercent.toString(),
            size: row.size,
            diamondWt: row.diamondWt.toString(),
            mc: row.mc.toString(),
            touch: row.touch.toString(),
            barcode: row.barcode,
        });
        setEditId(row.id);
        setErrors({});
        setTouched({});
        // Focus first field when editing
        setTimeout(() => focusField(FIELD_ORDER[0]), 100);
    };

    const handleDeleteRow = (row: BarcodeTransactionItem) => {
        if (window.confirm("Delete this item?")) {
            const filteredRows = transactionRows.filter(t => t.id !== row.id);
            // Rebuild barcodes to resequence them
            const rebuiltRows = rebuildBarcodes(filteredRows);
            setTransactionRows(rebuiltRows);

            if (editId === row.id) resetTransactionForm();

            toaster.create({
                title: "Row Deleted",
                description: "Row has been deleted successfully",
                type: "info",
                duration: 1000,
            });
        }
    };

    const handlePrint = (row: BarcodeTransactionItem) => {
        console.log("Print barcode for:", row);
        alert(`Printing barcode for item: ${row.barcode}`);
    };

    // Custom cell rendering for print button and formatted values
    const getCellValue = useCallback((col: any, row: BarcodeTransactionItem) => {
        if (col.key === "__print") {
            return (
                <button
                    onClick={() => handlePrint(row)}
                    style={{
                        padding: "2px 8px",
                        background: "#3182CE",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                    }}
                >
                    PRINT
                </button>
            );
        }

        const value = row[col.key as keyof BarcodeTransactionItem];

        if (value === undefined || value === null) return "-";

        if (typeof value === "number") {
            if (col.key === "grsweight" || col.key === "stoneWt" || col.key === "salesStoneWt" || col.key === "diamondWt") {
                return formatToFixed(value, 3);
            }
            if (col.key === "wastePercent" || col.key === "mc") {
                return formatToFixed(value, 2);
            }
            if (col.key === "touch") {
                return formatToFixed(value, 1);
            }
        }
        if (col.key === "size" && value) {
            const item = itemSizeCollection?.find((i: any) => i.value === value);
            return item ? item.label : value;
        }
        if (col.key === "barcode" && value) {
            return value; // just display the stored barcode
        }

        return value.toString();
    }, []);

    const getCellStyle = useCallback((col: any, extra?: any) => {
        const baseStyle = {
            padding: "4px 6px",
            borderRight: "1px solid #E2E8F0",
            textAlign: col.align || (col.key === "size" || col.key === "barcode" ? "left" : "right"),
            fontSize: "12px",
            width: getWidth(col.width),
            minWidth: getWidth(col.width),
            maxWidth: getWidth(col.width),
            ...extra
        };
        return baseStyle;
    }, []);

    const formatTotal = useCallback((value: any, decimalScale?: number, key?: string) => {
        if (value == null || value === "") return "";

        // For PCS totals, show as integer
        if (key === "PCS") {
            return Math.round(Number(value)).toString();
        }

        return Number(value).toFixed(decimalScale || 2);
    }, []);

    // Calculate totals for transaction table
    const transactionTotals = {
        grsweight: transactionRows.reduce((sum, t) => sum + t.grsweight, 0),
        stoneWt: transactionRows.reduce((sum, t) => sum + t.stoneWt, 0),
        salesStoneWt: transactionRows.reduce((sum, t) => sum + t.salesStoneWt, 0),
        diamondWt: transactionRows.reduce((sum, t) => sum + t.diamondWt, 0),
        mc: transactionRows.reduce((sum, t) => sum + t.mc, 0),
    };

    // Render form cell for transaction table - matching StoneEnterMaster pattern
    const renderFormCell = useCallback((field: any) => {
        const key = field.key as FieldKey;
        const ref = fieldRefs[key];
        const isInvalid = !!errors[key] && !!touched[key];
        const value = transactionFormData[field.key as keyof typeof transactionFormData]?.toString() || "";
        const shouldDisable = field.disabled || false;
        // const value = formData[field.key as keyof typeof formData]?.toString() || "";
        // For number fields
        if (field.type === "number") {
            return (
                <Box position="relative">
                    <CapitalizedInput
                        field={key}
                        value={value}
                        onChange={(_, v) => handleTransactionChange(key, v)}
                        type="number"
                        isCapitalized={false}
                        size="xs"
                        rounded="sm"
                        decimalScale={field.decimalScale || 3}
                        inputRef={ref}
                        onEnter={() => moveToNext(key)}
                        noBorder
                    />
                </Box>
            );
        }

        // For text fields (size, barcode)
        if (field.key === "barcode") {
            return (
                <Box position="relative">
                    <CapitalizedInput
                        field={key}
                        value={value}
                        onChange={(_, v) => handleTransactionChange(key, v)}
                        type="text"
                        isCapitalized={false}
                        size="xs"
                        rounded="sm"
                        inputRef={ref}
                        onEnter={() => handleTransactionSubmit()}
                        noBorder
                        disabled={shouldDisable}
                    />
                </Box>
            );
        }
        if(field.type === "combobox"){
            return (
                <Box>
                    <SelectCombobox
                       value={value}
                        onChange={(v) => { handleTransactionChange(field.key, v); if (v) moveToNext(field.key); }}
                        items={field.collection || []}
                        placeholder={field.placeholder || `Select ${field.label}`}
                        ref={ref as React.RefObject<HTMLInputElement>}
                        rounded="sm" 
                        disable={shouldDisable} 
                        onEnter={() => moveToNext(field.key)}

                       
                        />
                </Box>
            )

        }

        // Default for text fields
        return (
            <Box position="relative">
                <CapitalizedInput
                    field={key}
                    value={value}
                    onChange={(_, v) => handleTransactionChange(key, v)}
                    type="text"
                    isCapitalized={false}
                    size="xs"
                    rounded="sm"
                    inputRef={ref}
                    onEnter={() => moveToNext(key)}
                    noBorder
                />
            </Box>
        );
    }, [transactionFormData, errors, touched, moveToNext, handleTransactionSubmit]);

    /**
     * Stock Table Configuration
     */
    const stockTableHeader = [
        { key: 'ITEMID', label: 'ITEM ID', align: 'start' as const },
        { key: 'GRSWT', label: 'GROSS WT', align: 'end' as const, decimalScale: 3 },
        { key: 'STNWT', label: 'STONE WT', align: 'end' as const, decimalScale: 3 },
        { key: 'NETWT', label: 'NET WT', align: 'end' as const, decimalScale: 3 },
        { key: 'WASTYPE', label: 'WASTE TYPE', align: 'center' as const },
        { key: 'TOUCH', label: 'TOUCH', align: 'center' as const, decimalScale: 1 },
    ];

    const selectedItem = barcodeItems?.SELECTED_ITEM;

    const totalPieces = selectedItem?.PCS ?? 0;
    const totalGrossWeight = formatToFixed(selectedItem?.GRSWT , 3) ?? 0;

    const totalSelectedPieces = transactionRows?.length ;

    const showTableForm = Boolean(
        totalSelectedPieces < totalPieces ||
        Boolean(editId)
    );

    const stockTableData = Array.isArray(selectedItem)
        ? selectedItem
        : selectedItem && typeof selectedItem === 'object'
            ? [selectedItem]
            : [];

    const handleStockRender = (row: any, index: number) => {
        if (!row) {
            return (
                <Table.Cell colSpan={7} textAlign="center" color="gray.500">
                    Invalid row
                </Table.Cell>
            );
        }

        return (
            <>
                <Table.Cell textAlign="start">{row.ITEMID || '-'} - {row.ITEMNAME || row.item_name || '-'}</Table.Cell>
                <Table.Cell textAlign="right">{formatToFixed(row.GRSWT, 3) ?? '0.000'}</Table.Cell>
                <Table.Cell textAlign="right">{formatToFixed(row.STNWT, 3) ?? '0.000'}</Table.Cell>
                <Table.Cell textAlign="right">{formatToFixed(row.NETWT, 3) ?? '0.000'}</Table.Cell>
                <Table.Cell textAlign='center'>{row.WASTYPE || '-'}</Table.Cell>
                <Table.Cell textAlign='center'>{formatToFixed(row.TOUCH, 1) || '-'}</Table.Cell>
            </>
        );
    };

    /**
     * Summary Table Configuration
     */
    const summaryRowData = [
        { key: "PCS", label: "Pieces" },
        { key: "GRSWT", label: "Gross Wt" },
        { key: "STNWT", label: "Stone Wt" },
    ];

    const summaryColData = [
        { key: "total", label: "LOT" ,align:'end'as const},
        { key: "completed", label: "COMPLETED", align: 'end'as const},
        { key: "balance", label: "BALANCE", align: 'end' as const},
    ];

    // Calculate LOT totals from selected item
    const computeLotTotals = (items: any): Record<string, string> => {
        let itemList: any[] = [];

        if (Array.isArray(items)) {
            itemList = items;
        } else if (items && typeof items === "object") {
            itemList = [items];
        }

        return {
            PCS: itemList.reduce((sum, item) => sum + safeNum(item?.PCS), 0).toString(),
            GRSWT: formatToFixed(
                itemList.reduce((sum, item) => sum + safeNum(item?.GRSWT), 0), 3
            ),
            STNWT: formatToFixed(
                itemList.reduce((sum, item) => sum + safeNum(item?.STNWT), 0), 3
            ),
            NETWT: formatToFixed(
                itemList.reduce((sum, item) => sum + safeNum(item?.NETWT), 0), 3
            ),
        };
    };

    // Calculate COMPLETED totals from transaction rows
    const computeCompletedTotals = (): Record<string, string> => {
        // Note: Transaction rows don't have PCS, so we need to calculate based on available data
        // You might need to adjust this based on your actual business logic
        return {
            PCS: transactionRows.length.toString(), // Or calculate based on some logic
            GRSWT: formatToFixed(
                transactionRows.reduce((sum, t) => sum + t.grsweight, 0), 3
            ),
            STNWT: formatToFixed(
                transactionRows.reduce((sum, t) => sum + t.stoneWt, 0), 3
            ),
            NETWT: formatToFixed(
                transactionRows.reduce((sum, t) => sum + (t.grsweight - t.stoneWt), 0), 3
            ),
        };
    };

    const buildSummaryTableData = (): Record<string, { total: string; completed: string; balance: string }> => {
        const lotTotals = computeLotTotals(selectedItem);
        const completedTotals = computeCompletedTotals();
        const result: Record<string, { total: string; completed: string; balance: string }> = {};

        summaryRowData.forEach((row) => {
            const totalVal = Number(lotTotals[row.key] ?? 0);
            const completedVal = Number(completedTotals[row.key] ?? 0);
            const balanceVal = totalVal - completedVal;

            result[row.key] = {
                total: row.key === "PCS"
                    ? Math.round(totalVal).toString()
                    : formatToFixed(totalVal, row.key === "GRSWT" || row.key === "STNWT" || row.key === "NETWT" ? 3 : 2),
                completed: row.key === "PCS"
                    ? Math.round(completedVal).toString()
                    : formatToFixed(completedVal, row.key === "GRSWT" || row.key === "STNWT" || row.key === "NETWT" ? 3 : 2),
                balance: row.key === "PCS"
                    ? Math.max(0, Math.round(balanceVal)).toString()
                    : formatToFixed(Math.max(0, balanceVal), row.key === "GRSWT" || row.key === "STNWT" || row.key === "NETWT" ? 3 : 2),
            };
        });

        return result;
    };

    const tableData = buildSummaryTableData();

    /**
     * Main Render
     */
    return (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Box bg={theme.colors.formColor} p={2} rounded={'xl'} display={'flex'} flexDirection={'column'} gap={4} >
                <Box display={'flex'} justifyContent={'center'} alignItems={'center'} >
                    <Text fontSize={'base'} fontWeight={'semibold'} textAlign={'center'}>
                        BARCODE GENERATION
                    </Text>
                </Box>
                <Box display='flex' gap={2} flexDirection='row' justifyContent='space-between'>
                <BarcodeHeaderForm
                    form={barcodeHeaderForm}
                    onChange={handleHeaderChange}
                    purchaserCollection={purchaserCollection || []}
                    inwardCollection={inwardCollection || []}
                    itemCollection={itemCollection || []}
                    isDisabled={transactionRows?.length > 0}
                />
                    <Box className="flex flex-col items-center cursor-pointer animate__animated animate__fadeInUp gap-1  "
                    onClick={handleShowFilter}>
                                 <HiFilter size={20} className="text-blue-500 " />
                                  <Text fontSize="x-small" fontWeight="semibold">
                                      { "VIEW REPORT"}
                                  </Text>
                              </Box>
                </Box>
              
                              
            </Box>
                            {isFilterOpen && (
                                <Drawer.Root open={isFilterOpen} //onOpenChange={(e) => closeFilter()}
                                >
                                    <Portal>
                                        <Drawer.Backdrop />
                                        <Drawer.Positioner>
                                            <Drawer.Content maxW="480px">
                                                <Drawer.Header borderBottomWidth="1px" bg='cyan.50' fontSize='md'>
                                                    Transaction Filters
                                                    <Drawer.CloseTrigger asChild>
                                                        <Button variant="ghost" size="sm" onClick={closeFilter}>×</Button>
                                                    </Drawer.CloseTrigger>
                                                </Drawer.Header>
            
                                                <Drawer.Body p={0}>
                                                     {/* <RightSideDetailsPanel
                                                        selectedTransactionId={selectedTransactionId}
                                                        onTransactionClick={(id: any) => {
                                                            handleTransactionClick(id);
                                                            closeFilter(); // auto close after select
                                                        }}
                                                        transactionList={transactionList}
                                                        isLoadingTransactions={isLoading}
                                                        draftTotals={totals}
                                                        headerForm={headerForm}
                                                        selectedTransactionType={selectedTransactionTypes}
                                                        theme={theme}
                                                        startDate={startDate}
                                                        endDate={endDate}
                                                        onStartDateChange={handleStartDateChange}
                                                        onEndDateChange={handleEndDateChange}
                                                        onSelectItem={handleSelectItemCode}
                                                        selectedItemCode={itemCode}
                                                        itemsCollection={itemsCollection}
                                                        itemsFilter={itemsFilter}
                                                        getLabelByValue={getLabelByValue}
                                                    />  */}
                                                </Drawer.Body>
            
                                                <Drawer.Footer borderTopWidth="1px">
                                                    <Button variant="outline" size="sm" 
                            onClick={closeFilter}
                                                    >
                                                        Close
                                                    </Button>
                                                </Drawer.Footer>
                                            </Drawer.Content>
                                        </Drawer.Positioner>
                                    </Portal>
                                </Drawer.Root>
                            )}

            <Box display='flex' flexDirection={{ sm: 'column', md: 'row' }} gap={2} bg={theme.colors.formColor} p={2} rounded={'xl'} >
                <CustomTable
                    columns={stockTableHeader}
                    data={stockTableData}
                    renderRow={handleStockRender}
                    headerBg={theme.colors.accient}
                    headerColor="white"
                    bodyBg={theme.colors.formColor}
                    borderColor="white"
                    maxWidth="40%"
                />
                <Box w={'30%'}>
                    <SummaryTable
                        title="STOCK SUMMARY"
                        rowLabels={summaryRowData}
                        columnLabels={summaryColData}
                        data={tableData}
                        headerFontSize="xs"
                        headerBg={theme.colors.accient}
                        
                        size="sm"
                    
                        
                    />
                </Box>
            </Box>

            <Box display='flex' flexDirection={{ sm: 'column', md: 'column' }} gap={2} bg={theme.colors.formColor} p={2} rounded={'xl'} >

                <Box display='flex' gap={2} justifyContent='end'>

                    <Button
                        size="xs"
                        fontSize='2xs'
                        onClick={handleClear}
                        variant='ghost'
                        bg={theme.colors.formColor}
                        p={0}
                    >
                        <Image src={clearIcon} width={58} alt="CLEAR" />
                    </Button>

                    <Button
                        size="xs"
                        bg={theme.colors.formColor}
                        // onClick={onSave}
                        // loading={isSaving}
                        loadingText="Saving..."
                        variant='ghost'
                        
                        p={0}
                    >
                        <Image src={saveIcon} width={60} alt="save" />
                    </Button>

                </Box>

                <TransactionTable
                    theme={theme}
                    tableCols={transactionTableCols}
                    formFields={visibleFormFields}
                    rows={transactionRows}
                    errors={errors}
                    touched={touched}
                    localEditId={editId}
                    isSubmitting={isSubmitting}
                    totals={transactionTotals}
                    allDisplayCols={allDisplayCols}
                    resetForm={resetTransactionForm}
                    handleSubmit={handleTransactionSubmit}
                    handleEditRow={handleEditRow}
                    handleDeleteRow={handleDeleteRow}
                    renderFormCell={renderFormCell}
                    getCellValue={getCellValue}
                    formatTotal={formatTotal}
                    getCellStyle={getCellStyle}
                    transactionType="barcode"
                    showTotal
                    showTableForm={showTableForm}
                    
                />
            </Box>
        </Box>
    );
}

export default BarCodeGenerate;