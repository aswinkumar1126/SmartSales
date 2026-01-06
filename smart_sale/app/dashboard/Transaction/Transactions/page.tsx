"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Text,
    Box,
    Button,
    Flex,
    Combobox,
    Portal,
    Input,
    useListCollection,
    useFilter,
    VStack,
    HStack,
} from "@chakra-ui/react";
import { useTheme } from "@/context/theme/themeContext";
import { toaster, Toaster } from "@/components/ui/toaster";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Components
import TransactionHeaderForm from "./TransactionHeaderForm/TransactionHeaderForm";
import TransactionTypeSelector from "./TransactionTypeSelector/TransactionTypeSelector";
import DraftTransactionTable from "./DraftTransactionTable/DraftTransactionTable";
import SaveTransactionBar from "./SaveTransactionBar/TransactionBar";
import TransactionHistoryTable from "./TransactionHistoryTable/TransactionHistoryTable";
import RightSideDetailsPanel from "./RightSideDetailsPanel/RightSideDetailsPanel";

// Hooks
import { useTransactions } from "@/hooks/transaction/useTransactions";
import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";
import { useItems } from "@/hooks/item/useItems";
import { useCreateTransactions ,useUpdateTransaction } from "@/hooks/transaction/useTransactions";

// Types & Constants
import { TransactionType } from "@/types/transcation/Transaction";
import { TRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import { Opening } from "@/data/Transaction/Opening";
import { formatToFixed } from "@/utils/format/numberFormat";

/* ================================
   Main Component
================================ */

export default function IssuePage() {
    const { theme } = useTheme();
    const { data: itemsData } = useItems();
    const { data: allCustomer } = useAllAccountHead();

    const trantype = 'IS'

    const createTransaction = useCreateTransactions();
    const updateTransaction = useUpdateTransaction();
    
    const { contains } = useFilter({ sensitivity: "base" });

    /* ================================
       State Management
    ================================ */

    // Transaction header state
    const [headerForm, setHeaderForm] = useState({
        ENTRYNO: "",
        BILLNO: "",
        DATE: new Date().toISOString().split("T")[0],
        RATEGM: "",
        CUSTOMER: "",
        CUSTOMER_NAME: "",
    });

    // Transaction type & draft state
    const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType | null>(null);
    const [transactionTitle, setTransactionTitle] = useState("");

    // Draft rows (local storage backed)
    const [draftRows, setDraftRows] = useState<any[]>([]);
    const [editingRowId, setEditingRowId] = useState<string | number | null>(null);

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

    /* ================================
       Local Storage Keys
    ================================ */

    const DRAFT_KEY = "transaction_draft";
    const HEADER_KEY = "transaction_header";
    const TYPE_KEY = "transaction_type";

    /* ================================
       Customer Data
    ================================ */

    const customerList = Array.isArray(allCustomer?.data) ? allCustomer.data : [];
    const CustomerList = useMemo(() => {
        return customerList.map((c: any) => ({
            label: c.ACNAME,
            value: String(c.ACCODE),
        }));
    }, [customerList]);

    const {
        collection: customerCollection,
        filter: customerFilter,
        set: customerListSet
    } = useListCollection({
        initialItems: CustomerList,
        filter: contains,
    });

    useEffect(() => {
        customerListSet(CustomerList);
    }, [CustomerList, customerListSet]);

    const getLabelByValue = useCallback((collection: any, value: any) => {
        if (!collection?.items?.length) return value ?? "";
        const found = collection.items.find(
            (i: any) => i.value === value?.toString()
        );
        return found?.label ?? value ?? "";
    }, []);

    /* ================================
       Items Data
    ================================ */

    const mappedItems = useMemo(
        () =>
            itemsData?.items?.map((item: any) => ({
                label: item.itemName,
                value: item.itemId.toString(),
            })) ?? [],
        [itemsData]
    );

    const { collection: comboboxCollection ,set} = useListCollection({
        initialItems: mappedItems,
        filter: contains,
    });

    useEffect(() => {
        set(mappedItems);
    }, [mappedItems, set]);
    /* ================================
       Local Storage Persistence
    ================================ */

    // Load from localStorage on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        const savedHeader = localStorage.getItem(HEADER_KEY);
        const savedType = localStorage.getItem(TYPE_KEY);

        console.log("Loading from localStorage:", {
            draft: savedDraft?.substring(0, 100),
            header: savedHeader,
            type: savedType
        });

        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                console.log("Parsed draft rows:", parsed.length, "items");
                setDraftRows(parsed);
            } catch (e) {
                console.error("Failed to parse draft:", e);
                // Clear corrupted data
                localStorage.removeItem(DRAFT_KEY);
            }
        }

        if (savedHeader) {
            try {
                setHeaderForm(JSON.parse(savedHeader));
            } catch (e) {
                console.error("Failed to parse header:", e);
                localStorage.removeItem(HEADER_KEY);
            }
        }

        if (savedType) {
            try {
                const typeData = JSON.parse(savedType);
                setSelectedTransactionType(typeData);
                setTransactionTitle(typeData.label || "");
            } catch (e) {
                console.error("Failed to parse type:", e);
                localStorage.removeItem(TYPE_KEY);
            }
        }
    }, []);


    // Save to localStorage on changes
    useEffect(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftRows));
    }, [draftRows]);

    useEffect(() => {
        localStorage.setItem(HEADER_KEY, JSON.stringify(headerForm));
    }, [headerForm]);

    useEffect(() => {
        if (selectedTransactionType) {
            localStorage.setItem(TYPE_KEY, JSON.stringify(selectedTransactionType));
        }
    }, [selectedTransactionType]);


    

    /* ================================
       Header Form Handlers
    ================================ */

    const handleHeaderChange = (field: string, value: any) => {
        setHeaderForm(prev => ({ ...prev, [field]: value }));
    };

    const handleCustomerSelect = (customerValue: string, customerLabel: string) => {
        setHeaderForm(prev => ({
            ...prev,
            CUSTOMER: customerValue,
            CUSTOMER_NAME: customerLabel,
        }));
    };

    /* ================================
       Transaction Type Handlers
    ================================ */

    const handleTransactionTypeSelect = (type: TransactionType) => {
        // 1️⃣ Customer validation
        if (!headerForm.CUSTOMER) {
            toaster.create({
                title: "Customer Required",
                description: "Please select a customer before choosing transaction type.",
                type: "warning",
            });
            return;
        }

        // 2️⃣ Draft validation (must be EMPTY)
        if (draftRows.length > 0) {
            toaster.create({
                title: "Unsaved Draft Exists",
                description: "Please save or delete the current draft before changing the transaction type.",
                type: "warning",
            });
            return;
        }

        // 3️⃣ Set transaction type
        setSelectedTransactionType(type);
        setTransactionTitle(type.label);

        // 4️⃣ Create fresh draft row
        const newRowId = `draft-${Date.now()}`;

        const newRow = {
            __rowId: newRowId,
            __isNew: true,
            __previewSno: 1,
            TRANSACTION_TYPE: type.value,
            ITEMID: "",
            PCS: 0,
            GRSWT: 0,
            LESSWT: 0,
            NETWT: 0,
            PURITY: 0,
            PUREWT: 0,
            RATE: 0,
            MCHARGE: 0,
            WASTAGE: 0,
        };

        setDraftRows([newRow]);
        setEditingRowId(newRowId);

        toaster.create({
            title: `${type.label} Started`,
            description: "You can now add items to the transaction.",
            type: "info",
        });
    };


    /* ================================
       Draft Table Handlers
    ================================ */

    const handleAddDraftRow = () => {
        if (!selectedTransactionType) {
            toaster.create({
                title: "Transaction Type Required",
                description: "Please select a transaction type first.",
                type: "warning",
            });
            return;
        }

        const rowId = `draft-${Date.now()}`;
        const newRow = {
            __rowId: rowId,
            __isNew: true,
            __previewSno: draftRows.length + 1,
            TRANSACTION_TYPE: selectedTransactionType.value,
            ITEMID: "",
            PCS: 0,
            GRSWT: 0,
            LESSWT: 0,
            NETWT: 0,
            PURITY: 0,
            PUREWT: 0,
            RATE: headerForm.RATEGM || 0,
            MCHARGE: 0,
            WASTAGE: 0,
        };

        setDraftRows(prev => [newRow, ...prev]);
        setEditingRowId(rowId);
    };

    // In IssuePage component
    const handleUpdateDraftRow = useCallback((rowIndex: number, field: string, value: any) => {
        console.log(`Updating row ${rowIndex}, field ${field} to:`, value);

        setDraftRows(prev => {
            const newRows = [...prev];
            const row = { ...newRows[rowIndex], [field]: value };

            // Auto-calculate dependent fields
            if (field === "GRSWT" || field === "LESSWT") {
                const grswt = row.GRSWT || 0;
                const lesswt = row.LESSWT || 0;
                row.NETWT = Math.max(0, grswt - lesswt);
            }

            if (field === "NETWT" || field === "PURITY") {
                const netwt = row.NETWT || 0;
                const purity = row.PURITY || 0;
                row.PUREWT = (netwt * purity) / 100;
            }

            // Recalculate the preview serial numbers
            if (field !== "__previewSno") {
                row.__previewSno = rowIndex + 1;
            }

            newRows[rowIndex] = row;
            return newRows;
        });
    }, []);
   


    const handleRemoveDraftRow = (rowId: string) => {
        setDraftRows(prev => prev.filter(row => row.__rowId !== rowId));
        if (editingRowId === rowId) {
            setEditingRowId(null);
        }
    };

    
    /* ================================
       Save Transaction Handler
    ================================ */

    const handleSaveTransaction = async () => {
        setEditingRowId(null);
        // Validation
        if (!selectedTransactionType) {
            toaster.create({
                title: "Transaction Type Required",
                description: "Please select a transaction type.",
                type: "error",
            });
            return;
        }

        if (!headerForm.CUSTOMER) {
            toaster.create({
                title: "Customer Required",
                description: "Please select a customer.",
                type: "error",
            });
            return;
        }

        if (draftRows.length === 0) {
            toaster.create({
                title: "No Items",
                description: "Please add at least one item to the transaction.",
                type: "error",
            });
            return;
        }

        // Check if all rows have required fields
        const invalidRows = draftRows.filter(row =>
            !row.ITEMID || row.ITEMID === ""
        );

        if (invalidRows.length > 0) {
            toaster.create({
                title: "Incomplete Items",
                description: "Please select an item for all rows.",
                type: "error",
            });
            return;
        }

        try {
            // Prepare transaction data
            const transactionData = {
                header: {
                    ...headerForm,
                    TRANSACTION_TYPE: selectedTransactionType.value,
                    TRANSACTION_TITLE: transactionTitle,
                },
                items: draftRows.map(row => {
                    const { __rowId, __isNew, __previewSno, ...itemData } = row;
                    return {
                        ...itemData,
                        RATE: row.RATE || headerForm.RATEGM || 0,
                    };
                }),
            };

            // Save to backend
            await createTransaction.mutateAsync(transactionData);

            // Clear draft on success
            setDraftRows([]);
            setEditingRowId(null);

            // Clear localStorage
            localStorage.removeItem(DRAFT_KEY);

            toaster.create({
                title: "Transaction Saved",
                description: "Transaction has been saved successfully.",
                type: "success",
            });

            // Refresh history
            setShowHistory(true);

        } catch (error: any) {
            toaster.create({
                title: "Save Failed",
                description: error.message || "Failed to save transaction.",
                type: "error",
            });
        }
    };

    const handleResetDraft = () => {
        setDraftRows([]);
        setEditingRowId(null);
        setSelectedTransactionType(null);
        setTransactionTitle("");
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(TYPE_KEY);

        toaster.create({
            title: "Draft Cleared",
            description: "All draft items have been removed.",
            type: "info",
        });
    };

    /* ================================
       History Handlers
    ================================ */

    const handleHistoryRowClick = (transaction: any) => {
        setSelectedHistoryId(transaction.id);
        // You can load transaction details into a modal or side panel
    };

    /* ================================
       Calculate Totals
    ================================ */

    const totals = useMemo(() => {
        return draftRows.reduce((acc, row) => {
            acc.PCS += Number(row.PCS || 0);
            acc.GRSWT += Number(row.GRSWT || 0);
            acc.LESSWT += Number(row.LESSWT || 0);
            acc.NETWT += Number(row.NETWT || 0);
            acc.PURITY += Number(row.PURITY || 0);
            acc.PUREWT += Number(row.PUREWT || 0);
            return acc;
        }, {
            PCS: 0,
            GRSWT: 0,
            LESSWT: 0,
            NETWT: 0,
            PURITY: 0,
            PUREWT: 0,
        });
    }, [draftRows]);

    /* ================================
       Opening Items Display
    ================================ */

    const openingItems = useMemo(() => {
        return Opening
            .filter(o => o.value !== 0)
            .map(o => (
                <Box
                    key={o.label}
                    display="flex"
                    alignItems="center"
                    bg={theme.colors.formColor}
                    p={2}
                    gap={1}
                    rounded="sm"
                    justifyContent="space-between"
                >
                    <Text fontSize="2xs" fontWeight="bold">
                        {o.label} :
                    </Text>
                    <Text
                        fontSize="2xs"
                        bg={theme.colors.accient}
                        fontWeight="semibold"
                        p={1}
                        rounded="sm"
                        color={theme.colors.whiteColor}
                    >
                        {formatToFixed(o.value, 2)}
                    </Text>
                </Box>
            ));
    }, [theme]);

    /* ================================
       Render
    ================================ */

    return (
        <Flex  align="stretch" gap={2} fontFamily={theme.fonts.body2}>
            <Toaster />

            {/* LEFT – 70% */}
            <Box w="70%">
                <VStack align="stretch" gap={1}>
                    <Text fontWeight="semibold" fontSize="sm">
                        Transaction Master
                    </Text>

                    {/* 1. Transaction Header Form */}
                    <TransactionHeaderForm
                        form={headerForm}
                        onFormChange={handleHeaderChange}
                        onCustomerSelect={handleCustomerSelect}
                        customerCollection={customerCollection}
                        customerFilter={customerFilter}
                        getLabelByValue={getLabelByValue}
                        theme={theme}
                        
                    />

                    {/* Opening Items Display */}
                    <Flex justifyContent="flex-end" align="center">
                        {openingItems}
                    </Flex>

                    {/* 2. Transaction Type Selector */}
                    <TransactionTypeSelector
                        transactionTypes={TRANSACTIONTYPES}
                        selectedType={selectedTransactionType}
                        onSelectType={handleTransactionTypeSelect}
                        theme={theme}
                    />

                    {/* Draft Section (only show if transaction type selected) */}
                    {selectedTransactionType && (
                        <>
                            {/* 3. Draft Transaction Table */}
                            <DraftTransactionTable
                                rows={draftRows}
                                editingRowId={editingRowId}
                                onAddRow={handleAddDraftRow}
                                onUpdateRow={handleUpdateDraftRow}
                                onRemoveRow={handleRemoveDraftRow}
                                onRowClick={(row) => {
                                    // Only set edit mode if not already editing this row
                                    if (editingRowId !== row.__rowId) {
                                        setEditingRowId(row.__rowId);
                                    }
                                }}
                                onCancelEdit={(rowId) => {
                                    if (rowId) {
                                        handleRemoveDraftRow(rowId);
                                    }
                                    setEditingRowId(null);
                                }}
                                onSaveRow={(row, isNew) => {
                                    // When row is saved, exit edit mode
                                    setEditingRowId(null);

                                    // If you need to perform any save logic, do it here
                                    console.log("Row saved:", row, "isNew:", isNew);
                                }}
                                itemsCollection={comboboxCollection}
                                totals={totals}
                                transactionTitle={transactionTitle}
                                theme={theme}
                            />
                        

                            {/* 4. Save Transaction Bar */}
                            <SaveTransactionBar
                                draftCount={draftRows.length}
                                onSave={handleSaveTransaction}
                                onReset={handleResetDraft}
                                isSaving={createTransaction.isPending}
                                theme={theme}
                            />
                        </>
                    )}

                    {/* 5. Transaction History Table */}
                    <Box>
                        <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setShowHistory(!showHistory)}
                            mb={2}
                        >
                            {showHistory ? "Hide" : "Show"} History
                        </Button>

                        {showHistory && (
                            <TransactionHistoryTable
                                customerCode={headerForm.CUSTOMER}
                                transactionType={selectedTransactionType?.value}
                                onRowClick={handleHistoryRowClick}
                                theme={theme}
                                
                            />
                        )}
                    </Box>
                </VStack>
            </Box>

            {/* RIGHT – 30% */}
            <Box w="30%">
                <RightSideDetailsPanel
                    selectedTransaction={selectedHistoryId}
                    draftTotals={totals}
                    headerForm={headerForm}
                    selectedTransactionType={selectedTransactionType}
                    theme={theme}
                />
            </Box>
        </Flex>
    );
}