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
import { useOpeningBalance } from "@/hooks/balance/useOpeningBalance";

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
import { useCreateTransactions, useUpdateTransaction } from "@/hooks/transaction/useTransactions";

// Types & Constants
import { TransactionType } from "@/types/transcation/Transaction";
import { TRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import { Opening } from "@/data/Transaction/Opening";
import { formatToFixed } from "@/utils/format/numberFormat";

/* ================================
   Main Component
================================ */

export default function IssuePage() {

    const [accCode, setAccCode] = useState<number | undefined | null>();
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
    const [transactionTitle, setTransactionTitle] = useState<string | undefined>();

    // Draft rows (local storage backed)
    const [draftRows, setDraftRows] = useState<any[]>([]);
    const [editingRowId, setEditingRowId] = useState<string | number | null>(null);

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

    // Date range state with localStorage persistence
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);

    const { theme } = useTheme();
    const { data: itemsData } = useItems();
    const { data: allCustomer } = useAllAccountHead();

    const { data: openingBalance } = useOpeningBalance(accCode);
    console.log(openingBalance, 'openingBalnace');

    const { data: transactionList } = useTransactions(
        selectedTransactionType?.value,
        accCode ?? undefined,
        startDate ?? undefined,
        endDate ?? undefined,
    );
    console.log(transactionList, 'transactionList');

    const openingData = openingBalance?.data;


    const createTransaction = useCreateTransactions();
    // const updateTransaction = useUpdateTransaction();

    const { contains } = useFilter({ sensitivity: "base" });

    /* ================================
       Local Storage Keys
    ================================ */

    const DRAFT_KEY = "transaction_draft";
    const HEADER_KEY = "transaction_header";
    const TYPE_KEY = "transaction_type";
    const DATE_RANGE_KEY = "transaction_date_range"; // New key for date range

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
   
    const { collection: itemsCollection ,filter:itemsFilter ,set} = useListCollection({
        initialItems: mappedItems,
        filter: contains,
    });

    useEffect(() => {
        set(mappedItems);
    }, [mappedItems, set]);



    /* ================================
       Date Range Handlers
    ================================ */

    const handleStartDateChange = (val?: string) => {
        setStartDate(val || null);
        if (val) {
            // Save to localStorage
            const dateRange = { startDate: val, endDate };
            localStorage.setItem(DATE_RANGE_KEY, JSON.stringify(dateRange));
        }
    };

    const handleEndDateChange = (val?: string) => {
        setEndDate(val || null);
        if (val) {
            // Save to localStorage
            const dateRange = { startDate, endDate: val };
            localStorage.setItem(DATE_RANGE_KEY, JSON.stringify(dateRange));
        }
    };
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

        if(savedHeader){
            console.log(savedHeader, 'savedType');
            const headerValues =JSON.parse(savedHeader);
            console.log(headerValues, 'savedType');
           setAccCode(Number(headerValues?.CUSTOMER))
        }

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
        return() => {
            localStorage.removeItem(DRAFT_KEY);
            localStorage.removeItem(HEADER_KEY);
            localStorage.removeItem(TYPE_KEY);
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


    useEffect(() => {
        const dateRange = { startDate, endDate };
        localStorage.setItem(DATE_RANGE_KEY, JSON.stringify(dateRange));
    }, [startDate, endDate]);

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
        setAccCode(Number(customerValue));
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
        // const newRowId = `draft-${Date.now()}`;

        // const newRow = {
        //     __rowId: newRowId,
        //     __isNew: true,
        //     __previewSno: 1,
        //     ITEMID: "",
        //     PCS: "",
        //     GRSWT: "",
        //     LESSWT: "",
        //     NETWT: "",
        //     PURITY: "",
        //     PUREWT: "",
        //     RATE: "",
        //     MCHARGE: "",
        //     WASTAGE: "",
        // };

        // setDraftRows([newRow]);
        // setEditingRowId(newRowId);

        toaster.create({
            title: `${type.label} Started`,
            description: "You can now add items to the transaction.",
            type: "info",
        });
    };


    /* ================================
       Draft Table Handlers
    ================================ */

    const handleClearForm = () => {
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
            PCS: "",
            GRSWT: "",
            LESSWT: "",
            NETWT: "",
            PURITY: "",
            PUREWT: "",
            RATE: headerForm.RATEGM || "",
            MCHARGE: "",
            WASTAGE: "",
        };

        setDraftRows(prev => [...prev,newRow]);
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
                TRANSACTION_DETAILS: {
                    ACCODE: Number(headerForm.CUSTOMER),
                    TRANTYPE: String(selectedTransactionType.value),
                    TRANDATE: headerForm.DATE,
                },
                TRANSACTION_ITEMS: draftRows.map((row) => {
                    const { __rowId, __isNew, __previewSno, ITEMID, ...rest } = row;

                    return {
                        ...rest,
                        ITEMID: ITEMID ? Number(ITEMID) : null, 
                        // RATE: row.RATE || headerForm.RATEGM || 0,
                    };
                }),
            };
            const invalidItem = draftRows.find(
                (r) => r.ITEMID == null || isNaN(Number(r.ITEMID))
            );
            console.log(invalidItem,'invalidItem')

        
 
            if (invalidItem) {
                toaster.create({
                    title: "Invalid Item",
                    description: "Please select a valid item before saving.",
                    type: "warning",
                });
                return;
            }
            const invalidGrossWt = draftRows.findIndex(
                (r) => Number(r.GRSWT) <= 0
            );
            console.log(invalidGrossWt,'invalidGrossWt')
            if (invalidGrossWt !== -1) {
                toaster.create({
                    title: "Invalid Gross Weight",
                    description: `Row ${invalidGrossWt + 1}: Gross weight must be greater than 0.`,
                    type: "warning",
                });
                return;
            }
            const invalidPurity = draftRows.findIndex(
                (r) => Number(r.PURITY) <= 0
            );

            if (invalidPurity !== -1) {
                toaster.create({
                    title: "Invalid Gross Weight",
                    description: `Row ${invalidPurity + 1}: Pure  must be greater than 0.`,
                    type: "warning",
                });
                return;
            }


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
            acc.RATE +=Number(row.RATE || 0);
            acc.MCHARGE += Number(row.MCHARGE || 0);
            acc.WASTAGE += Number(row.WASTAGE || 0);
            acc.AMOUNT += Number(row.AMOUNT || 0);
            // acc.GST += Number(row.GST || 0);
            // acc.CGST += Number(row.CGST || 0);
            // acc.SGST += Number(row.SGST || 0);

            return acc;
        }, {
            PCS: 0,
            GRSWT: 0,
            LESSWT: 0,
            NETWT: 0,
            PURITY: 0,
            PUREWT: 0,
            RATE:0,
            MCHARGE:0,
            WASTAGE:0,
            AMOUNT:0
        });
    }, [draftRows]);

    /* ================================
       Opening Items Display
    ================================ */

    // const openingItems = useMemo(() => {
    //     return openingBalance
    //         .filter(o => o.value !== 0)
    //         .map(o => (
    //             <Box
    //                 key={o.label}
    //                 display="flex"
    //                 alignItems="center"
    //                 bg={theme.colors.formColor}
    //                 p={2}
    //                 gap={1}
    //                 rounded="sm"
    //                 justifyContent="space-between"
    //             >
    //                 <Text fontSize="2xs" fontWeight="bold">
    //                     {o.label} :
    //                 </Text>
    //                 <Text
    //                     fontSize="2xs"
    //                     bg={theme.colors.accient}
    //                     fontWeight="semibold"
    //                     p={1}
    //                     rounded="sm"
    //                     color={theme.colors.whiteColor}
    //                 >
    //                     {formatToFixed(o.value, 2)}
    //                 </Text>
    //             </Box>
    //         ));
    // }, [theme]);

    /* ================================
       Render
    ================================ */

    return (
        <Flex  align="stretch" gap={2} fontFamily={theme.fonts.body2}>
            <Toaster />

            {/* LEFT – 70% */}
            <Box w="70%">
                <VStack align="stretch" gap={1}>
                    {/* <Text fontWeight="semibold" fontSize="sm">
                        Transaction Master
                    </Text> */}

                    {/* 1. Transaction Header Form */}
                    <TransactionHeaderForm
                        form={headerForm}
                        onFormChange={handleHeaderChange}
                        onCustomerSelect={handleCustomerSelect}
                        customerCollection={customerCollection}
                        customerFilter={customerFilter}
                        getLabelByValue={getLabelByValue}  
                        theme={theme}
                        openingBalance={openingBalance}
                        openingData={openingData}
                    />

             
               
                 

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
                            {/* Draft Transaction Table with Form */}
                            <DraftTransactionTable
                                rows={draftRows}
                                editingRowId={editingRowId}

                                onAddRow={(formData) => {
                                    if (formData && typeof formData === 'object') {
                                        // Form submission
                                        const newRow = {
                                            ...formData,
                                            __rowId: `row-${Date.now()}`,
                                            __isNew: true,
                                            __previewSno: draftRows.length + 1,
                                        };

                                        // Add to draft rows
                                        setDraftRows(prev => [...prev, newRow]);
                                    } else {
                                        // Original inline add
                                        const newRow = {
                                            __rowId: `row-${Date.now()}`,
                                            __isNew: true,
                                            __previewSno: draftRows.length + 1,
                                            // Add other empty fields based on your columns
                                        };
                                        setDraftRows(prev => [...prev, newRow]);
                                    }
                                }}
                                onUpdateRow={handleUpdateDraftRow}
                                handleClearForm={handleClearForm}
                                onRemoveRow={handleRemoveDraftRow}
                                onRowClick={(row) => {
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
                                    setEditingRowId(null);
                                    console.log("Row saved:", row, "isNew:", isNew);
                                }}
                                itemsCollection={itemsCollection}
                                itemsFilter={itemsFilter}
                                totals={totals}
                                transactionTitle={transactionTitle}
                                theme={theme}
                            />

                            {/* Save Transaction Bar */}
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
                    onSelectTransaction={setSelectedHistoryId}
                    transactionList={transactionList}
                    draftTotals={totals}
                    headerForm={headerForm}
                    selectedTransactionType={selectedTransactionType}
                    theme={theme}
                    startDate={startDate || undefined}
                    endDate={endDate || undefined}
                    onStartDateChange={handleStartDateChange}
                    onEndDateChange={handleEndDateChange}
                />
            </Box>
        </Flex>
    );
}