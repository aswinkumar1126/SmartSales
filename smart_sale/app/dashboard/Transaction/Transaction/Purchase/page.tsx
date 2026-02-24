"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Text,
    Box,
    Button,
    Flex,
    VStack,
    Drawer,
    Portal,
    Grid,
    GridItem
} from "@chakra-ui/react";
import { useTheme } from "@/context/theme/themeContext";
import { toaster, Toaster } from "@/components/ui/toaster";
import { useListCollection, useFilter } from "@chakra-ui/react";
import { useOpeningBalance } from "@/hooks/balance/useOpeningBalance";
import { GiGoldBar } from "react-icons/gi";
// Components
import TransactionHeaderForm from "./TransactionHeaderForm/TransactionHeaderForm";
import TransactionTypeSelector from "./TransactionTypeSelector/TransactionTypeSelector";
import DraftTransactionTable from "./DraftTransactionTable/DraftTransactionTable";
import SaveTransactionBar from "./SaveTransactionBar/TransactionBar";
import RightSideDetailsPanel from "./RightSideDetailsPanel/RightSideDetailsPanel";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import StockDrawer from "./DrawerTable/StockTable";
import { useAllMetals } from "@/hooks/metal/useMetals";
// Hooks
import { useTransactions } from "@/hooks/transaction/useTransactions";
import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";
import { useItems, useStoneItems } from "@/hooks/item/useItems";
import { useCreateTransactions, useUpdateTransaction, useTransactionByTransId } from "@/hooks/transaction/useTransactions";
import { usePureGoldData, usePureGoldNames } from "@/hooks/pureGoldMast/usePureGoldMastData";
// Types & Constants
import { TransactionType, UpdateTransactionPayload, TransactionKey, CreateTransaction, TransactionItems, TRANSACTION_KEY_MAP } from "@/types/transcation/Transaction";
import { TRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import Loader from "@/component/loader/Loader";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import BalanceSummary from "./Balance/BalanceSummary";
import StoneEnterMaster from "./StoneMaster/StoneEntryMaster";
//Icons


/* ================================
   Main Component
================================ */

export default function PurchasePage() {

    const [accCode, setAccCode] = useState<number | undefined | null>();
    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [purchaserList, setPurchaserList] = useState<{ label: string, value: string }[]>([]);
    const [filter, setFilter] = useState<string>('')
    const [isStockDrawerOpen, setIsStockDrawerOpen] = useState(false);

    const [showStock, setShowStock] = useState<string>("PURE");
    const [pureGoldList, setPureGoldList] = useState<{ label: string, value: string }[]>([]);
    const [metalList, setMetalList] = useState<{ label: string, value: string }[]>([]);

    const [metalId, setMetalId] = useState<string | undefined>();

    const [selectedName, setSelectedName] = useState<string | undefined>();
    const [itemsStockList, setItemsStockList] = useState<{ label: string, value: string }[]>([]);

    const TRANSACTIONTYPES_ORDER = ["PU", "PR", "ISP", "REC"];

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const openFilter = () => setIsFilterOpen(true);
    const closeFilter = () => setIsFilterOpen(false);

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
    const [selectedTransactionTypes, setSelectedTransactionTypes] = useState<TransactionType[]>([]);

    // Draft rows (local storage backed)
    const [draftRows, setDraftRows] = useState<any[]>([]);
    const [editingRowId, setEditingRowId] = useState<string | number | null>(null);

    // History state

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
   

    const filters = {
        accountType: "PR"
    }


    const { data: allCustomer } = useAllAccountHead(filter , filters);

    const pureGoldDatafilters = {
        metalId,
        selectedName,
    };

    // Remove empty values
    const cleanedFilters = Object.fromEntries(
        Object.entries(pureGoldDatafilters).filter(
            ([_, value]) => value !== undefined && value !== ""
        )
    );

    const { data: pureStockList = [], refetch: stockRefetch } = usePureGoldData(filter,cleanedFilters);

    const { data: allPureGoldNames } = usePureGoldNames();

    const { data: transactionsById, isLoading: getbySnoLoading } = useTransactionByTransId(selectedTransactionId);

    const updateTransaction = useUpdateTransaction();
    const { data: metalsData } = useAllMetals();

    const { data: openingBalance } = useOpeningBalance(accCode);

    // Note: This hook might need to be updated to handle multiple transaction types
    const { data: transactionList, isLoading, refetch: refetchTransactionList } = useTransactions(
        selectedTransactionTypes[0]?.value, // Using first type for now
        accCode,
        startDate,
        endDate,
        itemCode
    );

    const openingData = openingBalance?.data;
    const createTransaction = useCreateTransactions();
    const { contains } = useFilter({ sensitivity: "base" });

    /* ================================
       Selected Collection For Stock List
    ================================ */

    const selectedStockData = useMemo(() => {
        return showStock === "PURE"
            ? pureStockList
            : itemsStockList;
    }, [showStock, pureStockList, itemsStockList]);

    /* ================================
       Customer Data
    ================================ */
    const customerList = Array.isArray(allCustomer?.data?.acheads) ? allCustomer.data.acheads : [];

    useEffect(() => {
        if (!customerList) return;
        const purchaser = customerList.map((item: any) => {
            return {
                label: item.ACNAME,
                value: item.ACCODE.toString()
            }
        })
        setPurchaserList(purchaser);

    }, [customerList])

    useEffect(() => {
        if (!Array.isArray(allPureGoldNames)) return;
        if (!allPureGoldNames.length) return;

        const fetchedData = allPureGoldNames.map((p: any) => ({
            label: p.pureGoldName,
            value: String(p.pureId),
        }));

        setPureGoldList(fetchedData);
    }, [allPureGoldNames]);

    useEffect(() => {
        if (!Array.isArray(metalsData)) return;
        if (!metalsData.length) return;

        const fetchedData = metalsData.map((m: any) => ({
            label: m.metalName,
            value: m.metalId,
        }));

        setMetalList(fetchedData);
    }, [metalsData]);

    const getLabelByValue = useCallback((collection: any, value: any) => {
        if (!collection) return value ?? "";

        // Decide the array to search: either collection.items or collection itself
        const list = Array.isArray(collection) ? collection : collection.items;
        if (!list?.length) return value ?? "";

        const found = list.find((i: any) => i.value === value?.toString());
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
      Pure Gold Name Data
    ================================ */

    const getAvailableWeight = useCallback(
        (pureId: string | number | null) => {
            if (!pureId) return null;
            const stock = pureStockList.find(
                (s: any) => String(s.pureId) === String(pureId)
            );

            return stock ? Number(stock.weight || 0) : null;
        },
        [pureStockList]
    );

    const mappedPureGoldName = useMemo(
        () =>
            allPureGoldNames?.map((item: any) => ({
                label: item.pureGoldName,
                value: item.pureId.toString(),
            })) ?? [],
        [allPureGoldNames]
    );

    const { collection: pureNameCollection, filter: purenameFilter, set: setPureGoldNames } = useListCollection({
        initialItems: mappedPureGoldName,
        filter: contains,
    });

    useEffect(() => {
        setPureGoldNames(mappedPureGoldName);
        purenameFilter("");
    }, [mappedPureGoldName, setPureGoldNames, purenameFilter]);

    /* ================================
       Helper Functions
    ================================ */
    const isIssueType = (transactionType: TransactionType) => {
        return transactionType.label.toUpperCase() === "ISSUE" || transactionType.label.toUpperCase() === "RECEIPT";
    };

    const getActiveCollectionForType = (transactionType: TransactionType) => {
        return isIssueType(transactionType) ? pureNameCollection : itemsCollection;
    };

    const getActiveFilterForType = (transactionType: TransactionType) => {
        return isIssueType(transactionType) ? purenameFilter : itemsFilter;
    };

    /* ================================
         ADD NEW ROW IN DRAFT TABLE FOR SPECIFIC TYPE
      ================================ */
    const createEmptyRowForType = (transactionType: TransactionType) => {
        const base = {
            __rowId: `row-${transactionType.value}-${Date.now()}`,
            __isNew: true,
            __previewSno: draftRows.filter(r => r.TRANSACTION_TYPE === transactionType.value).length + 1,
            TRANSACTION_TYPE: transactionType.value,
        };

        if (isIssueType(transactionType)) {
            return {
                ...base,
                PUREID: "",
                WT: "",
                TOUCH: "",
                PURE: "",
                AWT: "",
                ATOUCH: "",
                APURE: "",
            };
        }

        return {
            ...base,
            ITEMID: "",
            PCS: "",
            GRSWT: "",
            STNWT: "",
            NETWT: "",
            TOUCH: "",
            PUREWT: "",
            RATE:  "",
            MCHARGE: "",
            WASTAGE: "",
        };
    };

    const handleAddRowForType = (transactionType: TransactionType) => {
        const newRow = createEmptyRowForType(transactionType);
        setDraftRows(prev => [...prev, newRow]);
        setEditingRowId(newRow.__rowId);
    };

    const handleClearRowsForType = (transactionType: TransactionType) => {
        setDraftRows(prev => prev.filter(row => row.TRANSACTION_TYPE !== transactionType.value));
        setEditingRowId(null);
    };

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

    useEffect(() => {
        const editing = localStorage.getItem(EDITING);
        const sno = localStorage.getItem(EDITING_SNO);
        if (!editing) return;
        try {
            const parsedEditing = JSON.parse(editing);
            setIsEditing(parsedEditing);

            if (sno) {
                const parsedSno = JSON.parse(sno);
                setEditingSno(parsedSno);
            }

        }
        catch {
            localStorage.removeItem(EDITING);
            localStorage.removeItem(EDITING_SNO);
        }
    }, [])

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
                // Handle both single and multiple types for backward compatibility
                if (Array.isArray(typeData)) {
                    setSelectedTransactionTypes(typeData);
                } else {
                    setSelectedTransactionTypes([typeData]);
                }
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
        if (selectedTransactionTypes.length > 0) {
            localStorage.setItem(TYPE_KEY, JSON.stringify(selectedTransactionTypes));
        } else {
            localStorage.removeItem(TYPE_KEY);
        }
    }, [selectedTransactionTypes]);

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

    useEffect(() => {
        if (isEditing) {
            localStorage.setItem(EDITING, JSON.stringify(isEditing));
            if (editingSno) {
                localStorage.setItem(EDITING_SNO, JSON.stringify(editingSno));
            }
        }
        else {
            localStorage.removeItem(EDITING);
            localStorage.removeItem(EDITING_SNO);
        }
    }, [isEditing, editingSno])

    /* ================================
       Load Transaction Data When Selected
    ================================ */

    // This useEffect loads transaction data when transactionsById changes
    useEffect(() => {
        if (transactionsById && selectedTransactionId) {
            handleEditTransaction(transactionsById, selectedTransactionId);
        }
    }, [transactionsById, selectedTransactionId]);

    useEffect(() => {
        const transactionDetails = transactionList?.data;

        console.log(transactionDetails,'transactionDetails')

        if (transactionDetails) {
            console.log('Transaction details updated:', transactionDetails);

            setHeaderForm(prev => ({
                ...prev,
                CUSTOMER: transactionDetails.ACCODE ? String(transactionDetails.ACCODE) : prev.CUSTOMER,
                CUSTOMER_NAME: transactionDetails.ACNAME ,
                DATE: transactionDetails.TRANDATE || new Date().toISOString().split("T")[0],
                BILLNO: transactionDetails.BILLNO ,
                ENTRYNO: transactionDetails.ENTRYNO ,
            }));
        }
    }, [transactionList]);

    const handleEditTransaction = useCallback((transactionData: any, sno: string) => {

        if (!transactionData) {
            return;
        }

        // Set editing mode and SNO
        setIsEditing(true);
        setEditingSno(sno);
        setSelectedTransactionId(sno);

        // Try different possible data structures
        const transactionDetails = transactionData.header;
        const transactionItems = transactionData.data?.TRANSACTION_ITEM || transactionData.TRANSACTION_ITEM || transactionData.data?.TRANSACTION_ITEMS || transactionData.TRANSACTION_ITEMS;

        // 1. Load transaction details into header form
        if (transactionDetails) {
            // Set customer and date (readonly during edit)
            setHeaderForm(prev => ({
                ...prev,
                CUSTOMER: transactionDetails.ACCODE ? String(transactionDetails.ACCODE) : "",
                CUSTOMER_NAME: transactionDetails.ACNAME,
                DATE: transactionDetails.TRANDATE || new Date().toISOString().split("T")[0],
                BILLNO: transactionDetails.BILLNO || "",
                ENTRYNO: transactionDetails.ENTRYNO || "",

            }));

            // Set account code
            setAccCode(transactionDetails.ACCODE);

            // Find and set transaction type (readonly)
            // const foundType = TRANSACTIONTYPES.find(t => t.value === transactionDetails.TRANTYPE);

            // if (foundType) {
            //     setSelectedTransactionTypes([foundType]);
            // } else {
            //     console.warn("Transaction type not found:", transactionDetails.TRANTYPE);
            // }
        } else {
            console.warn("No transaction details found in data");
        }

        // 2. Load transaction items into draft rows
        if (transactionItems && Array.isArray(transactionItems)) {
            const newDraftRows = transactionItems.map((item: any, index: number) => {
                const isIssue = transactionDetails?.TRANTYPE === "ISP" || transactionDetails?.TRANTYPE === "REP";

                const rowData = isIssue
                    ? {
                        __rowId: `edit-${Date.now()}-${index}`,
                        __isNew: false,
                        __isEditing: true,
                        __previewSno: index + 1,
                        __originalItemId: item.PUREID,
                        __originalSno: item.SNO,

                        TRANSACTION_TYPE: transactionDetails?.TRANTYPE,
                        PUREID: item.PUREID || "",

                        WT: item.WT || item.WT || "",
                        AWT: item.AWT || item.WT || "",
                        TOUCH: item.TOUCH || "",
                        ATOUCH: item.ATOUCH || item.TOUCH || "",
                        PURE: item.PUREWT || "",
                        APUREWT: item.APUREWT || item.PUREWT || "",
                    }
                    : {
                        __rowId: `edit-${Date.now()}-${index}`,
                        __isNew: false,
                        __isEditing: true,
                        __previewSno: index + 1,
                        __originalItemId: item.ITEMID,
                        __originalSno: item.SNO,

                        TRANSACTION_TYPE: transactionDetails?.TRANTYPE,
                        ITEMID: item.ITEMID ? String(item.ITEMID) : "",

                        PCS: item.PCS || item.pcs || "",
                        GRSWT: item.GRSWT || item.grswt || "",
                        STNWT: item.STNWT || item.stnwt || "",
                        NETWT: item.NETWT || item.netwt || "",
                        TOUCH: item.TOUCH || item.TOUCH || "",
                        PUREWT: item.PUREWT || item.purewt || "",
                        RATE: item.RATE || item.rate || "",
                        MCHARGE: item.MCHARGE || item.mcharge || "",
                        WASTAGE: item.WASTAGE || item.wastage || "",
                        AMOUNT: item.AMOUNT || item.amount || "",
                    };

                return rowData;
            });

            setDraftRows(newDraftRows);

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

    }, []);

    /* ================================
       Header Form Handlers
    ================================ */
    const handleHeaderChange = (field: string, value: any) => {
        setHeaderForm(prev => ({ ...prev, [field]: value }));
    };

    const handleShowFilter = { openFilter }

    const handleCustomerSelect = (customerValue: string, customerLabel: string) => {
        if (isEditing) {
            toaster.create({
                title: "Cannot Change Customer",
                description: "Customer cannot be changed when editing a transaction.",
                type: "warning",
            });
            return;
        }

        console.log('Selected customer:', customerValue, customerLabel); // Add this for debugging

        setHeaderForm(prev => ({
            ...prev,
            CUSTOMER: customerValue || "",      // allow clearing
            CUSTOMER_NAME: customerLabel || "", // clear name as well
        }));

        setAccCode(customerValue ? Number(customerValue) : 0);

        // Add a small delay to ensure state is updated before refetching
        setTimeout(() => {
            refetchTransactionList();
        }, 100);
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
    const handleTransactionTypesSelect = (types: TransactionType[]) => {
       

        if (!headerForm.CUSTOMER) {
            toaster.create({
                title: "Customer Required",
                description: "Select customer first.",
                type: "warning"
            });
            return;
        }

        // Only check draft rows if we're adding new types (not when removing)
        // if (types.length > selectedTransactionTypes.length && draftRows.length > 0) {
        //     toaster.create({
        //         title: "Unsaved Draft",
        //         description: "Save or clear draft before adding new transaction types.",
        //         type: "warning"
        //     });
        //     return;
        // }

        setSelectedTransactionTypes(types);

       

        setSelectedTransactionId(null);
    };

    /* ================================
         Handle Stock Table Values
      ================================ */

    const handleLoadFromStock = (stockRow: any) => {
        if (selectedTransactionTypes.length === 0) {
            toaster.create({
                title: "Transaction Types Required",
                description: "Please select at least one transaction type first.",
                type: "warning",
            });
            return;
        }

        // For now, add to the first selected type
        // You could enhance this to let user choose which type to add to
        const targetType = selectedTransactionTypes[0];
        const isIssue = isIssueType(targetType);

        const pureId = stockRow.PUREID ?? stockRow.pureId;

        if (isIssue) {
            if (!pureId) return;

            const getUsedWeightInTable = (pureId: string | number) =>
                draftRows
                    .filter(r => String(r.PUREID) === String(pureId) && r.TRANSACTION_TYPE === targetType.value)
                    .reduce((sum, r) => sum + Number(r.WT || 0), 0);

            const stockAvailable = getAvailableWeight(pureId) ?? 0;
            const used = getUsedWeightInTable(pureId);
            const remaining = Math.max(stockAvailable - used, 0);

            if (remaining <= 0) {
                toaster.create({
                    title: "Stock Exhausted",
                    description: "No available balance left for this Pure ID.",
                    type: "error",
                });
                return;
            }
        }

        const rowId = `draft-${targetType.value}-${Date.now()}`;

        const newRow = {
            __rowId: rowId,
            __isNew: true,
            __previewSno: draftRows.filter(r => r.TRANSACTION_TYPE === targetType.value).length + 1,
            TRANSACTION_TYPE: targetType.value,

            PUREID: pureId || "",

            WT: isIssue  ||  "",
            TOUCH: stockRow.TOUCH || stockRow.actualTouch || "",
            PURE: stockRow.PURE || stockRow.actualPure || "",

            AWT: isIssue||  "",
            ATOUCH: stockRow.ATOUCH || stockRow.actualTouch || "",
            APUREWT: stockRow.APURE || stockRow.actualPure || "",

            ITEMID: !isIssue ? (stockRow.ITEMID || "") : "",
            PCS: stockRow.PCS || "",
            GRSWT: stockRow.GRSWT || "",
            STNWT: stockRow.STNWT || "",
            NETWT: stockRow.NETWT || "",
            WASTYPE: stockRow.WASTYPE || "",
            WASPER: stockRow.WASPER || "",
            WASTAGE: stockRow.WASTAGE || "",
            PUREWT: stockRow.PUREWT || "",
            MC: stockRow.MC || "",
            DESCRIPTION:stockRow.DESCRIPTION || "",
        };

        setDraftRows(prev => [...prev, newRow]);
        setEditingRowId(rowId);
    };

    /* ================================
       Draft Table Handlers
    ================================ */
    const handleClearForm = () => {
        if (selectedTransactionTypes.length === 0) {
            toaster.create({
                title: "Transaction Type Required",
                description: "Please select a transaction type first.",
                type: "warning",
            });
            return;
        }

        // This function is now handled per type, so we'll use handleAddRowForType instead
        handleAddRowForType(selectedTransactionTypes[0]);
    };

    const handleUpdateDraftRow = useCallback(
        (rowIndex: number, field: string, value: any) => {
            setDraftRows(prev => {
                const newRows = [...prev];
                let row = { ...newRows[rowIndex], [field]: value };

                const transactionType = TRANSACTIONTYPES.find(t => t.value === row.TRANSACTION_TYPE);
                const isIssue = transactionType ? isIssueType(transactionType) : false;

                // Manual override tracking
                if (field === "AWT") row.__manual_AWT = true;
                if (field === "ATOUCH") row.__manual_ATOUCH = true;
                if (field === "APUREWT") row.__manual_APUREWT = true;

                if (field === "WT") row.__manual_AWT = false;
                if (field === "TOUCH") row.__manual_ATOUCH = false;

                // Mirror logic
                if (field === "WT" && !row.__manual_AWT) row.AWT = value;
                if (field === "TOUCH" && !row.__manual_ATOUCH) row.ATOUCH = value;

                // Stock limit check for issue types
                if (isIssue && (field === "WT" || field === "AWT")) {
                    const available = getAvailableWeight(row.PUREID);
                    if (available != null) {
                        const getTotalUsedWeight = (
                            rows: any[],
                            pureId: string | number,
                            ignoreIndex?: number
                        ) => {
                            return rows.reduce((sum, r, idx) => {
                                if (ignoreIndex === idx) return sum;
                                if (String(r.PUREID) === String(pureId) && r.TRANSACTION_TYPE === row.TRANSACTION_TYPE) {
                                    return sum + Number(r.WT || 0);
                                }
                                return sum;
                            }, 0);
                        };

                        const otherUsed = getTotalUsedWeight(prev, row.PUREID, rowIndex);
                        const current = Number(field === "WT" ? value : row.WT) || 0;
                        const total = otherUsed + current;

                        if (total > available) {
                            toaster.create({
                                title: "Stock Limit Exceeded",
                                description: `Available: ${available}, Used: ${otherUsed}`,
                                type: "error",
                            });

                            return prev; // ⛔ reject update
                        }
                    }
                }

                // Calculations for non-issue types
                if (!isIssue) {
                    if (field === "GRSWT" || field === "STNWT") {
                        const grswt = Number(row.GRSWT) || 0;
                        const stnwt = Number(row.STNWT) || 0;
                        row.NETWT = Math.max(0, grswt - stnwt);
                    }

                    if (field === "NETWT" || field === "TOUCH") {
                        const netwt = Number(row.NETWT) || 0;
                        const TOUCH = Number(row.TOUCH) || 0;
                        row.PUREWT = (netwt * TOUCH) / 100;
                    }
                }

                // Calculations for issue types
                if (isIssue) {
                    if (field === "WT" || field === "TOUCH") {
                        const wt = Number(row.WT) || 0;
                        const touch = Number(row.TOUCH) || 0;
                        row.PURE = (wt * touch) / 100;
                    }

                    if (field === "AWT" || field === "ATOUCH") {
                        const wt = Number(row.AWT) || 0;
                        const touch = Number(row.ATOUCH) || 0;
                        if (!row.__manual_APUREWT) {
                            row.APUREWT = (wt * touch) / 100;
                        }
                    }
                }

                row.__previewSno = rowIndex + 1;

                newRows[rowIndex] = row;
                return newRows;
            });
        },
        [getAvailableWeight, toaster]
    );

    const handleRemoveDraftRow = (rowId: string) => {
        setDraftRows(prev => prev.filter(row => row.__rowId !== rowId));
        if (editingRowId === rowId) {
            setEditingRowId(null);
        }
    };

    /* ================================
        Calculate Totals For Specific Type
     ================================ */
    const calculateTotalsForType = (transactionType: TransactionType) => {
        const typeRows = draftRows.filter(row => row.TRANSACTION_TYPE === transactionType.value);

        return typeRows.reduce((acc, row) => {
            acc.PCS += Number(row.PCS || 0);
            acc.GRSWT += Number(row.GRSWT || 0);
            acc.STNWT += Number(row.STNWT || 0);
            acc.NETWT += Number(row.NETWT || 0);
            acc.TOUCH += Number(row.TOUCH || 0);
            acc.PUREWT += Number(row.PUREWT || 0);
            acc.RATE += Number(row.RATE || 0);
            acc.MCHARGE += Number(row.MCHARGE || 0);
            acc.WASTAGE += Number(row.WASTAGE || 0);
            acc.AMOUNT += Number(row.AMOUNT || 0);
            return acc;
        }, {
            PCS: 0,
            GRSWT: 0,
            STNWT: 0,
            NETWT: 0,
            TOUCH: 0,
            PUREWT: 0,
            RATE: 0,
            MCHARGE: 0,
            WASTAGE: 0,
            AMOUNT: 0
        });
    };

    /* ================================
        Normalize Handler
     ================================ */
    const normalizeRowForApi = (row: any, isIssue: boolean) => {
        const {
            __rowId,
            __isNew,
            __previewSno,
            __manual_AWT,
            __manual_ATOUCH,
            __manual_APUREWT,
            ...rest
        } = row;

        if (isIssue) {
            return {
                PUREID: rest.PUREID ? Number(rest.PUREID) : undefined,
                WT: Number(rest.WT || 0),
                TOUCH: Number(rest.TOUCH || 0),
                PUREWT: Number(rest.PURE || 0),
                AWT: Number(rest.AWT || 0),
                ATOUCH: Number(rest.ATOUCH || 0),
                APUREWT: Number(rest.APUREWT || 0),
            };
        }

        return {
            ITEMID: rest.ITEMID ? String(rest.ITEMID) : undefined,
            PCS: Number(rest.PCS || 0),
            GRSWT: Number(rest.GRSWT || 0),
            STNWT: Number(rest.STNWT || 0),
            NETWT: Number(rest.NETWT || 0),
            WASTYPE: String(rest.WASTYPE || 'TOUCH'),
            WASPER: Number(rest.WASPER || 0),
            WASTAGE: Number(rest.WASTAGE || 0),
            TOUCH: Number(rest.TOUCH || 0),
            ATOUCH: Number(rest.ATOUCH || 0),
            PUREWT: Number(rest.PUREWT || 0),
            MC: Number(rest.MC || 0),
        
        };
    };

    /* ================================
         Validation Handler
      ================================ */
    const validateDraftRows = () => {
        if (draftRows.length === 0) {
            toaster.create({
                title: "No Items",
                description: "Please add at least one item.",
                type: "error",
            });
            return false;
        }

        // Validate each row based on its transaction type
        for (let i = 0; i < draftRows.length; i++) {
            const row = draftRows[i];
            const transactionType = TRANSACTIONTYPES.find(t => t.value === row.TRANSACTION_TYPE);

            if (!transactionType) {
                toaster.create({
                    title: "Invalid Transaction Type",
                    description: `Row ${i + 1}: Invalid transaction type.`,
                    type: "error",
                });
                return false;
            }

            const isIssue = isIssueType(transactionType);

            if (isIssue) {
                if (!row.PUREID || row.WT == null || row.TOUCH == null || row.PURE == null) {
                    toaster.create({
                        title: "Incomplete Items",
                        description: `Row ${i + 1}: Please fill PUREID, Weight, Touch, and Pure for all rows.`,
                        type: "error",
                    });
                    return false;
                }
            } else {
                if (!row.ITEMID) {
                    toaster.create({
                        title: "Incomplete Items",
                        description: `Row ${i + 1}: Please select an item.`,
                        type: "error",
                    });
                    return false;
                }

                if (Number(row.GRSWT) <= 0) {
                    toaster.create({
                        title: "Invalid Gross Weight",
                        description: `Row ${i + 1}: Gross weight must be greater than 0.`,
                        type: "warning",
                    });
                    return false;
                }

                if (Number(row.TOUCH) <= 0) {
                    toaster.create({
                        title: "Invalid TOUCH",
                        description: `Row ${i + 1}: TOUCH must be greater than 0.`,
                        type: "warning",
                    });
                    return false;
                }
            }
        }

        // Check stock limits for issue-type rows grouped by type
        const groupedByType: Record<string, Record<string, number>> = {};

        draftRows.forEach((row) => {
            const transactionType = TRANSACTIONTYPES.find(t => t.value === row.TRANSACTION_TYPE);
            if (!transactionType) return;

            const isIssue = isIssueType(transactionType);

            if (isIssue && row.PUREID) {
                if (!groupedByType[row.TRANSACTION_TYPE]) {
                    groupedByType[row.TRANSACTION_TYPE] = {};
                }
                const key = String(row.PUREID);
                groupedByType[row.TRANSACTION_TYPE][key] = (groupedByType[row.TRANSACTION_TYPE][key] || 0) + Number(row.WT || 0);
            }
        });

        for (const typeValue in groupedByType) {
            for (const pureId in groupedByType[typeValue]) {
                const available = getAvailableWeight(pureId);
                if (available != null && groupedByType[typeValue][pureId] > available) {
                    toaster.create({
                        title: "Stock Exceeded",
                        description: `Pure ID ${pureId} in transaction type ${typeValue}: Total ${groupedByType[typeValue][pureId]} exceeds available stock (${available})`,
                        type: "error",
                    });
                    return false;
                }
            }
        }

        return true;
    };

    /* ================================
       Save Transaction Handler
    ================================ */
    const handleSaveTransaction = async () => {
        setEditingRowId(null);

        if (selectedTransactionTypes.length === 0) {
            toaster.create({
                title: "Transaction Types Required",
                description: "Please select at least one transaction type.",
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

        if (!validateDraftRows()) return;

        try {

            /* -----------------------------------------
               STEP 1 — GROUP ROWS BY TYPE
               ----------------------------------------- */

            const transactionDetails: TransactionItems = {};

            draftRows.forEach(row => {
                const mappedType = TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];

                if (!mappedType) return;

                if (!transactionDetails[mappedType]) {
                    transactionDetails[mappedType] = [];
                }

                const normalized = normalizeRowForApi(
                    row,
                    mappedType === "issue" || mappedType === "receipt"
                );

                (transactionDetails[mappedType] as any[]).push(normalized);
            });

            /* -----------------------------------------
               STEP 2 — BUILD HEADER
               ----------------------------------------- */

            const payload: CreateTransaction = {
                TRANSACTION_HEADER: {
                    ACCODE: Number(headerForm.CUSTOMER),
                    TRANDATE: headerForm.DATE,
                    BILLNO: headerForm.BILLNO ? Number(headerForm.BILLNO) : undefined,
                    RATE: headerForm.RATEGM ? Number(headerForm.RATEGM) : undefined,
                },
                TRANSACTION_DETAILS: transactionDetails,
            };
            console.log(payload,'createTransaction')

            /* -----------------------------------------
               STEP 3 — SINGLE API CALL
               ----------------------------------------- */

            await createTransaction.mutateAsync(payload);


            /* -----------------------------------------
               STEP 4 — CLEANUP
               ----------------------------------------- */

            setDraftRows([]);
            setEditingRowId(null);
            localStorage.removeItem(DRAFT_KEY);

            toaster.create({
                title: "Transaction Saved",
                description: "Transaction saved successfully.",
                type: "success",
            });

            stockRefetch();

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

        if (selectedTransactionTypes.length === 0) {
            toaster.create({
                title: "Transaction Types Required",
                description: "Please select at least one transaction type.",
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

        if (!validateDraftRows()) return;

        try {
            /* -----------------------------------------
               STEP 1 — GROUP ROWS BY TRANSACTION TYPE
               ----------------------------------------- */
            const transactionDetails: TransactionItems = {};

            draftRows.forEach(row => {
                const mappedType = TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];
                if (!mappedType) return;

                if (!transactionDetails[mappedType]) transactionDetails[mappedType] = [];

                const isIssue = mappedType === "issue" || mappedType === "receipt";
                const normalized = normalizeRowForApi(row, isIssue);
                (transactionDetails[mappedType] as any[]).push(normalized);
            });

            /* -----------------------------------------
               STEP 2 — BUILD HEADER
               ----------------------------------------- */
            const payload: CreateTransaction = {
                TRANSACTION_HEADER: {
                    ACCODE: Number(headerForm.CUSTOMER),
                    TRANDATE: headerForm.DATE,
                    BILLNO: headerForm.BILLNO ? Number(headerForm.BILLNO) : undefined,
                    RATE: headerForm.RATEGM ? Number(headerForm.RATEGM) : undefined,
                },
                TRANSACTION_DETAILS: transactionDetails,
            };

            console.log("Updating Transaction:", payload);

            /* -----------------------------------------
               STEP 3 — API CALL
               ----------------------------------------- */
            await updateTransaction.mutateAsync({
                sno: editingSno,
                payload,
            });

            /* -----------------------------------------
               STEP 4 — CLEANUP
               ----------------------------------------- */
            setIsEditing(false);
            setEditingSno(null);
            setSelectedTransactionId(null);
            setDraftRows([]);
            setEditingRowId(null);
            setSelectedTransactionTypes([]);

            setHeaderForm({
                ENTRYNO: "",
                CUSTOMER: "",
                CUSTOMER_NAME: "",
                BILLNO: "",
                DATE: new Date().toISOString().split("T")[0],
                RATEGM: "",
            });

            // Clear local storage keys
            [
                DRAFT_KEY,
                HEADER_KEY,
                TYPE_KEY,
                DATE_RANGE_KEY,
                ITEMID,
                FILTER,
                EDITING,
                EDITING_SNO,
            ].forEach(key => localStorage.removeItem(key));

            toaster.create({
                title: "Transaction Updated",
                description: "Transaction updated successfully.",
                type: "success",
            });

            stockRefetch();

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
                RATEGM: ""
            }));

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
            setSelectedTransactionTypes([]);
            localStorage.removeItem(TYPE_KEY);
        }

        localStorage.removeItem(DRAFT_KEY);
    };

  


    const handleTransactionClick = useCallback((transactionId: string) => {
        setSelectedTransactionId(transactionId);
        // Clear any existing draft first
        setDraftRows([]);
        setIsEditing(false);
    }, []);

    const handleSelectItemCode = useCallback((id: number | null) => {
        setItemCode(id);
    }, []);

    /* ================================
       Calculate Overall Totals
    ================================ */
    const totals = useMemo(() => {
        return draftRows.reduce((acc, row) => {
            acc.PCS += Number(row.PCS || 0);
            acc.GRSWT += Number(row.GRSWT || 0);
            acc.STNWT += Number(row.STNWT || 0);
            acc.NETWT += Number(row.NETWT || 0);       
            acc.PUREWT += Number(row.PUREWT || 0);
            acc.MC += Number(row.MC || 0);
        
      
            return acc;
        }, {
            PCS: 0,
            GRSWT: 0,
            STNWT: 0,
            NETWT: 0,
            PUREWT: 0,
            MC: 0,
        });
    }, [draftRows]);

    /* ================================
       Render
    ================================ */
    const pageLoading = isLoading || getbySnoLoading || createTransaction.isPending;

    return (
        <>
        <Flex align="stretch" gap={2} >
            <Toaster />

            {/* Loading indicator for transaction data */}
            {getbySnoLoading && (
                <Box position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" zIndex={1000}>
                    <Loader isLoading={true} />
                </Box>
            )}

            {/* LEFT – 70% */}
            <Box w='100%'>
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
                        handleShowFilter={openFilter}
                        isEditing={isEditing}
                        entryNo={transactionList?.data?.ENTRYNO}
                        billNo={transactionList?.data?.BILLNO}
                    />

                    {/* 2. Transaction Type Selector */}
                  
                        <TransactionTypeSelector
                            transactionTypes={TRANSACTIONTYPES}
                            selectedTypes={selectedTransactionTypes}
                            onSelectTypes={handleTransactionTypesSelect}
                            theme={theme}
                            TRANSACTIONTYPES_ORDER={TRANSACTIONTYPES_ORDER}
                        />
                

                    {/* Show transaction info when editing */}
                    {isEditing && selectedTransactionTypes.length > 0 && (
                        <Box p={2} bg={theme.colors.formColor} borderRadius="md" display='flex' gap={2}>
                            <Text fontSize='xs' color={theme.colors.primaryText}>
                                {selectedTransactionTypes.map(t => t.label).join(", ")} - {editingSno}
                            </Text>
                            <Text fontSize="xs"> <strong>Customer: </strong>{headerForm.CUSTOMER_NAME}</Text>
                            <Text fontSize="xs"> <strong>Date:</strong> {headerForm.DATE}</Text>
                        </Box>
                    )}

                    {/* Draft Section - show separate tables for each transaction type */}
                    {/* Draft Section - show separate tables for each transaction type */}
                    {(selectedTransactionTypes?.length > 0 || isEditing) && (
                        <Box display='flex' gap={1} >

                            {/* LEFT SIDE - Tables */}
                            <Box w='100%'>
                                    <Box  gap={2}>
                                    {TRANSACTIONTYPES_ORDER
                                        .map(code => selectedTransactionTypes?.find(t => t.code === code))
                                        .filter((t): t is TransactionType => !!t)
                                        .map((transactionType) => {

                                            const typeRows = draftRows.filter(
                                                row => row.TRANSACTION_TYPE === transactionType.code
                                            );

                                            const typeTotals = calculateTotalsForType(transactionType);
                                            const activeCollection = getActiveCollectionForType(transactionType);
                                            const activeFilter = getActiveFilterForType(transactionType);
                                            const isIssue = isIssueType(transactionType);

                                            return (
                                                <Box
                                                    key={transactionType.code}
                                                    borderWidth="1px"
                                                    borderRadius="md"
                                                    borderColor={theme.colors.greyColor}
                                                    w='100%'
                                                >
                                                    <DraftTransactionTable
                                                        rows={typeRows}
                                                        editingRowId={editingRowId}
                                                        isEditing={isEditing}
                                                        onAddRow={(formData) => {
                                                            if (formData && typeof formData === "object") {

                                                                if (!formData.__isNew) {
                                                                    // ── UPDATE existing row in place ──
                                                                    setDraftRows(prev =>
                                                                        prev.map(r => r.__rowId === formData.__rowId ? formData : r)
                                                                    );
                                                                } else {
                                                                    // ── ADD new row ──
                                                                    const newRow = {
                                                                        ...formData,
                                                                        TRANSACTION_TYPE: transactionType.value,
                                                                        // __rowId and __previewSno already set by DraftTransactionTable
                                                                    };
                                                                    setDraftRows(prev => [...prev, newRow]);
                                                                }

                                                            } else {
                                                                handleAddRowForType(transactionType);
                                                            }
                                                        }}
                                                        onUpdateRow={(rowIndex, field, value) => {
                                                            const actualIndex = draftRows.findIndex(
                                                                r =>
                                                                    r.TRANSACTION_TYPE === transactionType.value &&
                                                                    r.__rowId === typeRows[rowIndex]?.__rowId
                                                            );
                                                            if (actualIndex !== -1) {
                                                                handleUpdateDraftRow(actualIndex, field, value);
                                                            }
                                                        }}
                                                        handleClearForm={() => handleAddRowForType(transactionType)}
                                                        onRemoveRow={(rowId) => {
                                                            setDraftRows(prev => prev.filter(row => row.__rowId !== rowId));
                                                            if (editingRowId === rowId) {
                                                                setEditingRowId(null);
                                                            }
                                                        }}
                                                        onRowClick={(row) => {
                                                            if (editingRowId !== row.__rowId) {
                                                                setEditingRowId(row.__rowId);
                                                            }
                                                        }}
                                                        onCancelEdit={(rowId) => {
                                                            if (rowId) {
                                                                setDraftRows(prev => prev.filter(row => row.__rowId !== rowId));
                                                            }
                                                            setEditingRowId(null);
                                                        }}
                                                        onSaveRow={() => {
                                                            setEditingRowId(null);
                                                        }}
                                                        itemsCollection={activeCollection}
                                                        itemsFilter={activeFilter}
                                                        totals={typeTotals}
                                                        transactionTitle={transactionType.label}
                                                        transactionType = {transactionType.code}
                                                        theme={theme}
                                                        isIssue={isIssue}
                                                        getAvailableWeight={getAvailableWeight}
                                                        onClear={() => handleClearRowsForType(transactionType)}
                                                    />
                                                </Box>
                                            );
                                        })}
                                </Box>
                            </Box>


                            {/* RIGHT SIDE - Summary Panel */}
                            <Box position="sticky">
                                <BalanceSummary theme={theme} />
                            </Box>
                          
                        </Box>
                   
                    )}
                    {/* Save Transaction Bar - appears once for all tables */}
                    {draftRows.length > 0 && (
                        <Box
                            position="sticky"
                            bottom="0"
                            left="0"
                            right="0"
                            zIndex="10"
                            p={2} 
                           
                        >
                            <Flex justify='start'>
                                <Box w={'75%'} bg={theme.colors.formColor}  rounded='lg'>
                                    <SaveTransactionBar
                                        draftCount={draftRows.length}
                                        onSave={isEditing ? handleUpdateTransaction : handleSaveTransaction}
                                        onReset={handleResetDraft}
                                        isSaving={
                                            createTransaction.isPending || updateTransaction.isPending
                                        }
                                        isEditing={isEditing}
                                        theme={theme}
                                    />
                                </Box>
                            </Flex>
                      </Box>    
                     
                    )}
                </VStack>

                {/* RIGHT – 30% */}
                {isFilterOpen && (
                    <Drawer.Root open={isFilterOpen} onOpenChange={(e) => closeFilter()}>
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
                                        <RightSideDetailsPanel
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
                                        />
                                    </Drawer.Body>

                                    <Drawer.Footer borderTopWidth="1px">
                                        <Button variant="outline" size="sm" onClick={closeFilter}>
                                            Close
                                        </Button>
                                    </Drawer.Footer>
                                </Drawer.Content>
                            </Drawer.Positioner>
                        </Portal>
                    </Drawer.Root>
                )}
               
            </Box>    
    

            <Box>
                <FloatingActionButton
                    icon={<GiGoldBar />}
                    ariaLabel="Share"
                    tooltip="ALL STOCK"
                    onClick={() => setIsStockDrawerOpen(true)}
                    position="bottom-right"
                    colorScheme="yellow"
                    size="md"
                />
            </Box>

            <StockDrawer
                isIssue={selectedTransactionTypes.some(t => isIssueType(t))}
                showStock={showStock}
                setShowStock={setShowStock}
                open={isStockDrawerOpen}
                onClose={() => setIsStockDrawerOpen(false)}
                stockData={selectedStockData}
                metalId={metalId}
                setMetalId={setMetalId}
                metalCollection={metalList}
                selectedName={selectedName}
                setSelectedName={setSelectedName}
                pureGoldCollection={pureGoldList}
                itemCollection={itemsCollection.items}
                onIssue={handleLoadFromStock}
            />
        </Flex>
     
        </>
        
    );
}