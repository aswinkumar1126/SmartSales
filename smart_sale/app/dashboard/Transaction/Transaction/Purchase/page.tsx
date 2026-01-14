"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Text,
    Box,
    Button,
    Flex,
    VStack,
    HStack,
    ActionBar,
    Portal
} from "@chakra-ui/react";
import { useTheme } from "@/context/theme/themeContext";
import { toaster, Toaster } from "@/components/ui/toaster";
import { useListCollection, useFilter } from "@chakra-ui/react";
import { useOpeningBalance } from "@/hooks/balance/useOpeningBalance";
import Fab from '@mui/material/Fab';

// Components
import TransactionHeaderForm from "./TransactionHeaderForm/TransactionHeaderForm";
import TransactionTypeSelector from "./TransactionTypeSelector/TransactionTypeSelector";
import DraftTransactionTable from "./DraftTransactionTable/DraftTransactionTable";
import SaveTransactionBar from "./SaveTransactionBar/TransactionBar";
import TransactionHistoryTable from "./TransactionHistoryTable/TransactionHistoryTable";
import RightSideDetailsPanel from "./RightSideDetailsPanel/RightSideDetailsPanel";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
// Hooks
import { useTransactions } from "@/hooks/transaction/useTransactions";
import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";
import { useItems } from "@/hooks/item/useItems";
import { useCreateTransactions, useUpdateTransaction, useTransactionByTransId } from "@/hooks/transaction/useTransactions";

// Types & Constants
import { TransactionType, UpdateTransactionPayload } from "@/types/transcation/Transaction";
import { TRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import Loader from "@/component/loader/Loader";

//Icons
import { LuShare, LuTrash2 } from "react-icons/lu"


/* ================================
   Main Component
================================ */

export default function IssuePage() {
    const [accCode, setAccCode] = useState<number | undefined | null>();
    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [purchaserList ,setPurchaserList] = useState<{label:string,value:string}[]>([]);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    /* ================================
       State Management
    ================================ */
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Transaction header state
    const [headerForm, setHeaderForm] = useState({
        ENTRYNO: "",
        BILLNO: "",
        DATE: new Date().toISOString().split("T")[0],
        RATEGM: "",
        CUSTOMER: "",
        CUSTOMER_NAME: "",
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [editingSno, setEditingSno] = useState<string | null>(null);
    
    // Transaction type & draft state
    const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType | null>(null);
    const [transactionTitle, setTransactionTitle] = useState<string | undefined>();

    // Draft rows (local storage backed)
    const [draftRows, setDraftRows] = useState<any[]>([]);
    const [editingRowId, setEditingRowId] = useState<string | number | null>(null);

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

    // Date range state with localStorage persistence
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [itemCode, setItemCode] = useState<number | null>(null);

    /* ================================
       Local Storage Keys
    ================================ */
    const DRAFT_KEY = "transaction_draft";
    const HEADER_KEY = "transaction_header";
    const TYPE_KEY = "transaction_type";
    const DATE_RANGE_KEY = "transaction_date_range";
    const ITEMID = "transaction_itemid";
    const FILTER = "show_filter";
    const EDITING = "isEditing";
    const EDITING_SNO = "editing_sno";

    const { theme } = useTheme();
    const { data: itemsData } = useItems();

    const filters={
        accountType:"PR"
    }

    const { data: allCustomer } = useAllAccountHead(filters);

    console.log(allCustomer,'allCustomer')

    const { data: transactionsById, isLoading: getbySnoLoading } = useTransactionByTransId(selectedTransactionId);

    const updateTransaction = useUpdateTransaction();

    const { data: openingBalance } = useOpeningBalance(accCode);
    const { data: transactionList, isLoading } = useTransactions(
        selectedTransactionType?.value,
        accCode,
        startDate,
        endDate,
        itemCode
    );

    const openingData = openingBalance?.data;
    const createTransaction = useCreateTransactions();
    const { contains } = useFilter({ sensitivity: "base" });

    // Log transaction data for debugging
    useEffect(() => {
        console.log("transactionsById data:", transactionsById);
        console.log("selectedTransactionId:", selectedTransactionId);
    }, [transactionsById, selectedTransactionId]);

    /* ================================
       Customer Data
    ================================ */
    const customerList = Array.isArray(allCustomer?.data?.acheads) ? allCustomer.data.acheads : [];

    useEffect(()=>{
        if (!customerList) return;
        const purchaser = customerList.map((item:any)=>
            {
                return{
                    label:item.ACNAME,
                    value:item.ACCODE.toString()
                }
            })
            setPurchaserList(purchaser)

    }, [customerList])


  


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

    const { collection: itemsCollection, filter: itemsFilter, set } = useListCollection({
        initialItems: mappedItems,
        filter: contains,
    });

    useEffect(() => {
        set(mappedItems);
    }, [mappedItems, set]);

    /* ================================
       Local Storage Persistence
    ================================ */
    useEffect(() => {
        const saved = localStorage.getItem(DATE_RANGE_KEY);
        if (!saved) return;
        try {
            const parsed = JSON.parse(saved);
            setStartDate(parsed.startDate ?? null);
            setEndDate(parsed.endDate ?? null);
        } catch {
            localStorage.removeItem(DATE_RANGE_KEY);
        }
    }, []);



    useEffect(() => {
        const savedItemCode = localStorage.getItem(ITEMID);
        if (!savedItemCode) return;
        try {
            const parsed = JSON.parse(savedItemCode);
            setItemCode(Number(parsed));
        } catch {
            localStorage.removeItem(ITEMID);
        }
    }, []);

    useEffect(() => {
        const filter = localStorage.getItem(FILTER);
        if (!filter) return;
        try {
            const parsed = JSON.parse(filter);
            setShowFilter(parsed);
        } catch {
            localStorage.removeItem(FILTER);
        }
    }, []);
    useEffect(()=>{
        const editing = localStorage.getItem(EDITING);
        const sno = localStorage.getItem(EDITING_SNO);
        if(!editing) return;
        try{
            const parsedEditing = JSON.parse(editing);
            setIsEditing(parsedEditing);

            if (sno) {
                const parsedSno = JSON.parse(sno);
                setEditingSno(parsedSno);
            }

        }
        catch{
            localStorage.removeItem(EDITING);
            localStorage.removeItem(EDITING_SNO);
        }
    },[])

    // Load from localStorage on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        const savedHeader = localStorage.getItem(HEADER_KEY);
        const savedType = localStorage.getItem(TYPE_KEY);

        if (savedHeader) {
            const headerValues = JSON.parse(savedHeader);
            setAccCode(Number(headerValues?.CUSTOMER));
        }

        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setDraftRows(parsed);
            } catch (e) {
                console.error("Failed to parse draft:", e);
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

        return () => {
            localStorage.removeItem(DRAFT_KEY);
            localStorage.removeItem(HEADER_KEY);
            localStorage.removeItem(TYPE_KEY);
            localStorage.removeItem(DATE_RANGE_KEY);
            localStorage.removeItem(ITEMID);
            localStorage.removeItem(FILTER);
            localStorage.removeItem(EDITING);
            localStorage.removeItem(EDITING_SNO);
        };
    }, []);

    // Save to localStorage on changes
    useEffect(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftRows));
    }, [draftRows]);

    useEffect(() => {
        localStorage.setItem(FILTER, JSON.stringify(showFilter));
    }, [showFilter]);

    useEffect(() => {
        localStorage.setItem(HEADER_KEY, JSON.stringify(headerForm));
    }, [headerForm]);

    useEffect(() => {
        if (selectedTransactionType) {
            localStorage.setItem(TYPE_KEY, JSON.stringify(selectedTransactionType));
        }
    }, [selectedTransactionType]);

    useEffect(() => {
        if (itemCode !== null) {
            localStorage.setItem(ITEMID, JSON.stringify(itemCode));
        }
    }, [itemCode]);

    useEffect(() => {
        if (startDate || endDate) {
            localStorage.setItem(
                DATE_RANGE_KEY,
                JSON.stringify({ startDate, endDate })
            );
        } else {
            localStorage.removeItem(DATE_RANGE_KEY);
        }
    }, [startDate, endDate]);

    useEffect(()=>{
        if(isEditing){
            localStorage.setItem(EDITING , JSON.stringify(isEditing));
            if (editingSno) {
                localStorage.setItem(EDITING_SNO,  JSON.stringify(editingSno));
            }
        }
        else{
            localStorage.removeItem(EDITING);
            localStorage.removeItem(EDITING_SNO);
        }
    }, [isEditing, editingSno])

    /* ================================
       Load Transaction Data When Selected
    ================================ */
    
    // This useEffect loads transaction data when transactionsById changes
    useEffect(() => {
        if (transactionsById?.data && selectedTransactionId) {
            console.log("Loading transaction data:", transactionsById.data);
            handleEditTransaction(transactionsById.data, selectedTransactionId);
        }
    }, [transactionsById, selectedTransactionId]);

    const handleEditTransaction = useCallback((transactionData: any, sno: string) => {
        console.log("handleEditTransaction called with:", transactionData);
        
        if (!transactionData) {
            console.log("No transaction data provided");
            return;
        }

        // Set editing mode and SNO
        setIsEditing(true);
        setEditingSno(sno);
        setSelectedTransactionId(sno);

        // Debug: Log the data structure
        console.log("Full transaction data structure:", JSON.stringify(transactionData, null, 2));
        
        // Try different possible data structures
        const transactionDetails = transactionData.data?.TRANSACTION_DETAILS || transactionData.TRANSACTION_DETAILS;
        const transactionItems = transactionData.data?.TRANSACTION_ITEM || transactionData.TRANSACTION_ITEM || transactionData.data?.TRANSACTION_ITEMS || transactionData.TRANSACTION_ITEMS;
        
        console.log("Extracted details:", transactionDetails);
        console.log("Extracted items:", transactionItems);

        // 1. Load transaction details into header form
        if (transactionDetails) {
            console.log("Setting header form with details:", transactionDetails);
            
          

            // Set customer and date (readonly during edit)
            setHeaderForm(prev => ({
                ...prev,
                CUSTOMER: transactionDetails.ACCODE ? String(transactionDetails.ACCODE) : "",
                CUSTOMER_NAME: "ash",
                DATE: transactionDetails.TRANDATE || new Date().toISOString().split("T")[0],
                BILLNO: transactionDetails.TRANNO || ""
            }));

            // Set account code
            setAccCode(transactionDetails.ACCODE);

            // Find and set transaction type (readonly)
            const foundType = TRANSACTIONTYPES.find(t => t.value === transactionDetails.TRANTYPE);
            console.log("Found transaction type:", foundType, "for value:", transactionDetails.TRANTYPE);
            
            if (foundType) {
                setSelectedTransactionType(foundType);
                setTransactionTitle(foundType.label);
            } else {
                console.warn("Transaction type not found:", transactionDetails.TRANTYPE);
            }
        } else {
            console.warn("No transaction details found in data");
        }

        // 2. Load transaction items into draft rows
        if (transactionItems && Array.isArray(transactionItems)) {
            console.log("Loading", transactionItems.length, "items into draft rows");
            
            const newDraftRows = transactionItems.map((item: any, index: number) => {
                console.log(`Processing item ${index}:`, item);
                
                const rowData = {
                    __rowId: `edit-${Date.now()}-${index}`,
                    __isNew: false,
                    __isEditing: true, // Flag for edit mode
                    __previewSno: index + 1,
                    __originalItemId: item.ITEMID,
                    __originalSno: item.SNO,

                    // Fixed fields (cannot be changed during edit)
                    TRANSACTION_TYPE: transactionDetails?.TRANTYPE,
                    ITEMID: item.ITEMID ? String(item.ITEMID) : "",

                    // Editable fields - convert null/undefined to empty string for inputs
                    PCS: item.PCS || item.pcs || "",
                    GRSWT: item.GRSWT || item.grswt || "",
                    LESSWT: item.LESSWT || item.lesswt || "",
                    NETWT: item.NETWT || item.netwt || "",
                    PURITY: item.PURITY || item.purity || "",
                    PUREWT: item.PUREWT || item.purewt || "",
                    RATE: item.RATE || item.rate || "",
                    MCHARGE: item.MCHARGE || item.mcharge || "",
                    WASTAGE: item.WASTAGE || item.wastage || "",
                    AMOUNT: item.AMOUNT || item.amount || "",
                };
                
                console.log(`Created row ${index}:`, rowData);
                return rowData;
            });

            setDraftRows(newDraftRows);
            console.log("Set draft rows:", newDraftRows);

            // Optionally set the first row as editing
            if (newDraftRows.length > 0) {
                setEditingRowId(newDraftRows[0].__rowId);
            }
        } else {
            console.warn("No transaction items found or items is not an array");
            setDraftRows([]);
        }

        setTimeout(() => {
            toaster.create({
                title: "Transaction Loaded",
                description: "Transaction loaded for editing. Only weights and values can be modified.",
                type: "success",
            });
        }, 100);

    }, [purchaserList, getLabelByValue]);

    /* ================================
       Header Form Handlers
    ================================ */
    const handleHeaderChange = (field: string, value: any) => {
        setHeaderForm(prev => ({ ...prev, [field]: value }));
    };

    const handleShowFilter = () => {
        setShowFilter((prev) => !prev);
    };

    const handleCustomerSelect = (customerValue: string, customerLabel: string) => {
        if (isEditing) {
            toaster.create({
                title: "Cannot Change Customer",
                description: "Customer cannot be changed when editing a transaction.",
                type: "warning",
            });
            return;
        }
        
        setHeaderForm(prev => ({
            ...prev,
            CUSTOMER: customerValue,
            CUSTOMER_NAME: customerLabel,
        }));
        setAccCode(Number(customerValue));
    };

    /* ================================
       Date Range Handlers
    ================================ */
    const handleStartDateChange = (val?: string) => {
        setStartDate(val || null);
        localStorage.setItem(DATE_RANGE_KEY, JSON.stringify({ startDate: val || null, endDate }));
    };

    const handleEndDateChange = (val?: string) => {
        setEndDate(val || null);
        localStorage.setItem(DATE_RANGE_KEY, JSON.stringify({ startDate, endDate: val || null }));
    };

    /* ================================
       Transaction Type Handlers
    ================================ */
    const handleTransactionTypeSelect = (type: TransactionType) => {
        if (isEditing) {
            toaster.create({
                title: "Cannot Change Transaction Type",
                description: "Transaction type cannot be changed when editing a transaction.",
                type: "warning",
            });
            return;
        }
        
        if (!headerForm.CUSTOMER) {
            toaster.create({ title: "Customer Required", description: "Select customer first.", type: "warning" });
            return;
        }
        if (draftRows.length > 0) {
            toaster.create({ title: "Unsaved Draft", description: "Save or clear draft before changing type.", type: "warning" });
            return;
        }

        setSelectedTransactionType(type);
        setTransactionTitle(type.label);
        setSelectedTransactionId(null);
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

        setDraftRows(prev => [...prev, newRow]);
        setEditingRowId(rowId);
    };

    const handleUpdateDraftRow = useCallback((rowIndex: number, field: string, value: any) => {
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
                    };
                }),
            };
            
            const invalidItem = draftRows.find(
                (r) => r.ITEMID == null || isNaN(Number(r.ITEMID))
            );
            
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
                    title: "Invalid Purity",
                    description: `Row ${invalidPurity + 1}: Purity must be greater than 0.`,
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

    const handleUpdateTransaction = async () => {
        setEditingRowId(null);

        if (!editingSno) {
            toaster.create({
                title: "Transaction ID Missing",
                description: "Cannot update without transaction SNO.",
                type: "error",
            });
            return;
        }

        // Validation for editable fields
        const invalidGrossWt = draftRows.findIndex(
            (r) => Number(r.GRSWT) <= 0
        );

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
                title: "Invalid Purity",
                description: `Row ${invalidPurity + 1}: Purity must be greater than 0.`,
                type: "warning",
            });
            return;
        };

        const row = draftRows[0];

        try {
            // Prepare update data - only TRANSACTION_ITEMS can be modified
            const updateData = {
                TRANSACTION_DETAILS: {
                    // Keep original values
                    ACCODE: Number(headerForm.CUSTOMER),
                    TRANTYPE: String(selectedTransactionType?.value),
                    TRANDATE: headerForm.DATE,
                    
                },
                TRANSACTION_ITEM: row
                    ? {
                        PCS: row.PCS || 0,
                        GRSWT: row.GRSWT || 0,
                        LESSWT: row.LESSWT || 0,
                        NETWT: row.NETWT || 0,
                        PURITY: row.PURITY || 0,
                        PUREWT: row.PUREWT || 0,
                        RATE: row.RATE || 0,
                        MCHARGE: row.MCHARGE || 0,
                        WASTAGE: row.WASTAGE || 0,
                        AMOUNT: row.AMOUNT || 0,
                        ITEMID:
                            row.__originalItemId || row.ITEMID
                                ? Number(row.ITEMID)
                                : null,
                    }
                    : null,
            };
            console.log("Updating transaction with SNO:", editingSno);
            console.log("Update data:", updateData);

            // Call update API
            await updateTransaction.mutateAsync({
                sno: editingSno,
                payload: updateData,
            });

            // Reset edit mode
            setIsEditing(false);
            setEditingSno(null);
            setSelectedTransactionId(null);
            setDraftRows([]);
            setEditingRowId(null);
            setSelectedTransactionType(null);
            setTransactionTitle("");

            setHeaderForm(prev => ({
                ...prev,
                CUSTOMER: "",
                CUSTOMER_NAME: "",
                BILLNO: "",
                DATE: new Date().toISOString().split("T")[0],
                RATEGM: ""
            }));
            

            // Clear localStorage
            localStorage.removeItem(DRAFT_KEY);
            localStorage.removeItem(HEADER_KEY);
            localStorage.removeItem(TYPE_KEY);
            localStorage.removeItem(DATE_RANGE_KEY);
            localStorage.removeItem(ITEMID);
            localStorage.removeItem(FILTER);
            localStorage.removeItem(EDITING);
            localStorage.removeItem(EDITING_SNO);

            toaster.create({
                title: "Transaction Updated",
                description: "Transaction items have been updated successfully.",
                type: "success",
            });

            // Refresh the transaction list
            setShowHistory(true);

        } catch (error: any) {
            console.error("Update error:", error);
            toaster.create({
                title: "Update Failed",
                description: error.message || "Failed to update transaction.",
                type: "error",
            });
        }
    };

    const handleResetDraft = () => {
        setDraftRows([]);
        setEditingRowId(null);

        if (isEditing) {
            setHeaderForm(prev => ({
                ...prev,
                CUSTOMER: "",
                CUSTOMER_NAME: "",
                BILLNO: "",
                DATE: new Date().toISOString().split("T")[0],
                RATEGM:""
            }));
            // If editing, exit edit mode
            
            setIsEditing(false);
            setEditingSno(null);
            setSelectedTransactionId(null);

            toaster.create({
                title: "Edit Cancelled",
                description: "Transaction edit has been cancelled.",
                type: "info",
            });
        } else {
            // If creating new, clear everything
            setSelectedTransactionType(null);
            setTransactionTitle("");
            localStorage.removeItem(TYPE_KEY);
        }

        localStorage.removeItem(DRAFT_KEY);
    };

    /* ================================
       History Handlers
    ================================ */
    const handleHistoryRowClick = (transaction: any) => {
        setSelectedHistoryId(transaction.id);
    };

    const handleTransactionClick = useCallback((transactionId: string) => {
        console.log("Transaction clicked:", transactionId);
        setSelectedTransactionId(transactionId);
        // Clear any existing draft first
        setDraftRows([]);
        setIsEditing(false);
    }, []);

    const handleSelectItemCode = useCallback((id: number | null) => {
        setItemCode(id);
    }, []);

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
            acc.RATE += Number(row.RATE || 0);
            acc.MCHARGE += Number(row.MCHARGE || 0);
            acc.WASTAGE += Number(row.WASTAGE || 0);
            acc.AMOUNT += Number(row.AMOUNT || 0);
            return acc;
        }, {
            PCS: 0,
            GRSWT: 0,
            LESSWT: 0,
            NETWT: 0,
            PURITY: 0,
            PUREWT: 0,
            RATE: 0,
            MCHARGE: 0,
            WASTAGE: 0,
            AMOUNT: 0
        });
    }, [draftRows]);

    /* ================================
       Render
    ================================ */
    const pageLoading = isLoading || getbySnoLoading || createTransaction.isPending;

    return (
        <Flex align="stretch" gap={2} >
            <Toaster />
            {loading && <Loader isLoading={true} fullscreen={true} />}
            
            {/* Loading indicator for transaction data */}
            {getbySnoLoading && (
                <Box position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" zIndex={1000}>
                    <Loader isLoading={true} />
                </Box>
            )}
            
            {/* Debug info - show current state */}
            {/* {process.env.NODE_ENV === 'development' && (
                <Box position="fixed" bottom="10px" right="10px" bg="gray.800" color="white" p={2} borderRadius="md" fontSize="xs" zIndex={1000}>
                    <Text>Editing: {isEditing ? 'Yes' : 'No'}</Text>
                    <Text>SNO: {editingSno || 'None'}</Text>
                    <Text>Selected ID: {selectedTransactionId || 'None'}</Text>
                    <Text>Draft Rows: {draftRows.length}</Text>
                    <Text>Customer: {headerForm.CUSTOMER}</Text>
                    <Text>Type: {selectedTransactionType?.label || 'None'}</Text>
                </Box>
            )} */}
            
            {/* LEFT – 70% */}
            <Box w={showFilter ? "70%" : "100%"}>
                <VStack align="stretch" gap={1}>
                    {/* 1. Transaction Header Form */}
                    <TransactionHeaderForm
                        form={headerForm}
                        onFormChange={handleHeaderChange}
                        onCustomerSelect={handleCustomerSelect}
                        customerCollection={purchaserList}
                        getLabelByValue={getLabelByValue}
                        theme={theme}
                        openingBalance={openingBalance}
                        openingData={openingData}
                        showFilter={showFilter}
                        handleShowFilter={handleShowFilter}
                        // isEditing={isEditing}
                    />

                    {/* 2. Transaction Type Selector */}
                    {!isEditing && (
                        <TransactionTypeSelector
                            transactionTypes={TRANSACTIONTYPES}
                            selectedType={selectedTransactionType}
                            onSelectType={handleTransactionTypeSelect}
                            theme={theme}
                            isEditing={isEditing}
                        />
                    )}

                    {/* Show transaction info when editing */}
                    {isEditing && selectedTransactionType && (
                        <Box p={2} bg={theme.colors.formColor} borderRadius="md" display='flex' gap={2}>
                            <Text  fontSize='xs' color={theme.colors.primaryText}>
                              {selectedTransactionType.label} - {editingSno}
                            </Text>
                            <Text fontSize="xs"> <strong>Customer: </strong>{headerForm.CUSTOMER_NAME}</Text>
                            <Text fontSize="xs"> <strong>Date:</strong> {headerForm.DATE}</Text>
                        </Box>
                    )}

                    {/* Draft Section - show if transaction type selected OR if editing */}
                    {(selectedTransactionType || isEditing) && (
                        <>
                            {/* Draft Transaction Table with Form */}
                            <DraftTransactionTable
                                rows={draftRows}
                                editingRowId={editingRowId}
                                isEditing={isEditing}
                                onAddRow={(formData) => {
                                    if (formData && typeof formData === 'object') {
                                        const newRow = {
                                            ...formData,
                                            __rowId: `row-${Date.now()}`,
                                            __isNew: true,
                                            __previewSno: draftRows.length + 1,
                                        };
                                        setDraftRows(prev => [...prev, newRow]);
                                    } else {
                                        const newRow = {
                                            __rowId: `row-${Date.now()}`,
                                            __isNew: true,
                                            __previewSno: draftRows.length + 1,
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
                                onSave={isEditing ? handleUpdateTransaction : handleSaveTransaction}
                                onReset={handleResetDraft}
                                isSaving={createTransaction.isPending || updateTransaction.isPending}
                                isEditing={isEditing}
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
            {showFilter && (
                <Box width='30%'>
                    <RightSideDetailsPanel
                        selectedTransactionId={selectedTransactionId}
                        onTransactionClick={handleTransactionClick}
                        transactionList={transactionList?.data}
                        isLoadingTransactions={isLoading}
                        draftTotals={totals}
                        headerForm={headerForm}
                        selectedTransactionType={selectedTransactionType}
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
                        // isEditing={isEditing}
                    />
                </Box>
            )}
            <Box>
                <FloatingActionButton
                    icon={<LuShare />}
                    ariaLabel="Share"
                    tooltip="Share this"
                    onClick={() => console.log("Clicked")}
                    position="bottom-right"
                    colorScheme="blue"
                    size="lg"
                />
            </Box>
        </Flex>
    );
}