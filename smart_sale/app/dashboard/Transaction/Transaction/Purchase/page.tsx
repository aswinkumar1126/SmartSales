"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Text,
    Box,
    Button,
    Flex,
    VStack,

} from "@chakra-ui/react";
import { useTheme } from "@/context/theme/themeContext";
import { toaster, Toaster } from "@/components/ui/toaster";
import { useListCollection, useFilter } from "@chakra-ui/react";
import { useOpeningBalance } from "@/hooks/balance/useOpeningBalance";
import {GiGoldBar} from "react-icons/gi";

// Components
import TransactionHeaderForm from "./TransactionHeaderForm/TransactionHeaderForm";
import TransactionTypeSelector from "./TransactionTypeSelector/TransactionTypeSelector";
import DraftTransactionTable from "./DraftTransactionTable/DraftTransactionTable";
import SaveTransactionBar from "./SaveTransactionBar/TransactionBar";
import TransactionHistoryTable from "./TransactionHistoryTable/TransactionHistoryTable";
import RightSideDetailsPanel from "./RightSideDetailsPanel/RightSideDetailsPanel";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import StockDrawer from "./DrawerTable/StockTable";
import { useAllMetals } from "@/hooks/metal/useMetals";
// Hooks
import { useTransactions } from "@/hooks/transaction/useTransactions";
import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";
import { useItems } from "@/hooks/item/useItems";
import { useCreateTransactions, useUpdateTransaction, useTransactionByTransId } from "@/hooks/transaction/useTransactions";
import { usePureGoldData, usePureGoldNames } from "@/hooks/pureGoldMast/usePureGoldMastData";
// Types & Constants
import { TransactionType, UpdateTransactionPayload } from "@/types/transcation/Transaction";
import { TRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import Loader from "@/component/loader/Loader";
import { applyWeightTouchLogic } from "@/hooks/pure/applyWeightTouchLogic";
//Icons
import { LuShare, LuTrash2 } from "react-icons/lu";


/* ================================
   Main Component
================================ */

export default function PurchasePage() {

    const [accCode, setAccCode] = useState<number | undefined | null>();
    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [purchaserList ,setPurchaserList] = useState<{label:string,value:string}[]>([]);
 
    const [isStockDrawerOpen, setIsStockDrawerOpen] = useState(false);

    const [showStock, setShowStock] = useState<string>("PURE");
    const [pureGoldList ,setPureGoldList] = useState<{label:string ,value:string}[]>([]);
    const [metalList ,setMetalList] = useState<{label:string ,value:string}[]>([]);

    const [metalId, setMetalId] = useState<string | undefined>();

    const [selectedName, setSelectedName] = useState<string | undefined>();
    const [itemsStockList ,setItemsStockList] = useState<{label:string,value:string}[]>([]);




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

    console.log(headerForm ,'headerForm')
    
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

    const isIssue =
        transactionTitle === "ISSUE" ||
        transactionTitle === "RECEIPT";

    //console.log(transactionTitle,'selectedTransactionType');

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
    //console.log(itemsData,'itemsData')

    const filters={
        accountType:"PR"
    }

    const { data: allCustomer } = useAllAccountHead(filters);

    //console.log(allCustomer,'allCustomer');
    
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

    const { data: pureStockList = [], refetch:stockRefetch } = usePureGoldData(cleanedFilters);

  
    const {data:allPureGoldNames } = usePureGoldNames();

    const { data: transactionsById, isLoading: getbySnoLoading } = useTransactionByTransId(selectedTransactionId);
    //console.log(transactionsById,'transactionsById');

    const updateTransaction = useUpdateTransaction();
        const { data: metalsData } = useAllMetals();

    const { data: openingBalance } = useOpeningBalance(accCode);

    const { data: transactionList, isLoading ,refetch:refetchTransactionList  } = useTransactions(
        selectedTransactionType?.value,
        accCode,
        startDate,
        endDate,
        itemCode
    );
    //console.log(transactionList,'transactionList')

    const openingData = openingBalance?.data;
    const createTransaction = useCreateTransactions();
    const { contains } = useFilter({ sensitivity: "base" });

    // Log transaction data for debugging
    useEffect(() => {
        //console.log("transactionsById data:", transactionsById);
        //console.log("selectedTransactionId:", selectedTransactionId);
    }, [transactionsById, selectedTransactionId]);

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

    useEffect(()=>{
        if (!customerList) return;
        const purchaser = customerList.map((item:any)=>
            {
                return{
                    label:item.ACNAME,
                    value:item.ACCODE.toString()
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


    const { collection: pureNameCollection, filter: purenameFilter, set:setPureGoldNames } = useListCollection({
        initialItems: mappedPureGoldName,
        filter: contains,
    });

    useEffect(() => {
        setPureGoldNames(mappedPureGoldName);
        purenameFilter(""); // 🔥 RESET FILTER
    }, [mappedPureGoldName, setPureGoldNames, purenameFilter]);


    
    const transactionCode = selectedTransactionType?.value;
    const isISP = transactionCode === "ISP" || "REP";

    const activeCollection = isISP ? pureNameCollection : itemsCollection;
    const activeFilter = isISP ? purenameFilter : itemsFilter;

    useEffect(() => {
        // Clear table
        setDraftRows([]);

        // Clear edit state
        setEditingRowId(null);

        // Reset filters
        purenameFilter("");
        itemsFilter("");

    }, [transactionCode]);
    /* ================================
         ADD NEW ROW IN DRAFT TABLE
      ================================ */
    const createEmptyRow = () => {
        const base = {
            __rowId: `row-${Date.now()}`,
            __isNew: true,
            __previewSno: draftRows.length + 1,
            TRANSACTION_TYPE: transactionCode,
        };

        if (isISP) {
            return {
                ...base,
                PUREID: "",
                WT: "",
                TOUCH: "",
                PURE: "",
                A_WT: "",
                A_TOUCH: "",
                A_PURE: "",
            };
        }

        return {
            ...base,
            ITEMID: "",
            PCS: "",
            GRSWT: "",
            LESSWT: "",
            NETWT: "",
            PURITY: "",
            PUREWT: "",
            RATE: headerForm.RATEGM ?? "",
            MCHARGE: "",
            WASTAGE: "",
        };
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
      Condition For Adding New Item or Pure Gold 
   ================================ */

    // const hasDuplicateId = (
    //     rows: any[],
    //     field: "PUREID" | "ITEMID",
    //     value: any,
    //     currentIndex: number
    // ) => {
    //     return rows.some((r, i) => {
    //         if (i === currentIndex) return false; // ignore self
    //         return String(r[field]) === String(value);
    //     });
    // };



    /* ================================
       Load Transaction Data When Selected
    ================================ */
    
    // This useEffect loads transaction data when transactionsById changes
    useEffect(() => {
        if (transactionsById && selectedTransactionId) {
            handleEditTransaction(transactionsById, selectedTransactionId);
        }
    }, [transactionsById, selectedTransactionId]);

    useEffect(()=>{
        const transactionDetails = transactionList?.data || "";

        setHeaderForm(prev => ({
            ...prev,
            CUSTOMER: transactionDetails.ACCODE ? String(transactionDetails.ACCODE) : "",
            CUSTOMER_NAME: transactionDetails.ACNAME,
            DATE: transactionDetails.TRANDATE || new Date().toISOString().split("T")[0],
            BILLNO: transactionDetails.nextBillno || "",
            ENTRYNO: transactionDetails.nextSno || "",

        }));
    },[transactionList])


    const handleEditTransaction = useCallback((transactionData: any, sno: string) => {
        
        if (!transactionData) {
            return;
        }

        // Set editing mode and SNO
        setIsEditing(true);
        setEditingSno(sno);
        setSelectedTransactionId(sno);

        // Debug: Log the data structure
       // console.log("Full transaction data structure:", JSON.stringify(transactionData, null, 2));
        
        // Try different possible data structures
        const transactionDetails = transactionData.header;
        const transactionItems = transactionData.data?.TRANSACTION_ITEM || transactionData.TRANSACTION_ITEM || transactionData.data?.TRANSACTION_ITEMS || transactionData.TRANSACTION_ITEMS;
        
        //console.log("Extracted details:", transactionDetails);
        //console.log("Extracted items:", transactionItems);

        // 1. Load transaction details into header form
        if (transactionDetails) {
           // console.log("Setting header form with details:", transactionDetails);
            
          

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
            const foundType = TRANSACTIONTYPES.find(t => t.value === transactionDetails.TRANTYPE);
            //console.log("Found transaction type:", foundType, "for value:", transactionDetails.TRANTYPE);
            
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
            //console.log("Loading", transactionItems.length, "items into draft rows");

            //console.log(transactionItems,'transactionItems')

            const newDraftRows = transactionItems.map((item: any, index: number) => {
                //console.log(`Processing item ${index}:`, item);

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
                        A_WT: item.A_WT|| item.WT || "",
                        TOUCH: item.TOUCH || "",
                        A_TOUCH: item.A_TOUCH || item.TOUCH ||"",
                        PURE: item.PUREWT || "",
                        A_PURE: item.A_PUREWT || item.PUREWT || "",
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
                        LESSWT: item.LESSWT || item.lesswt || "",
                        NETWT: item.NETWT || item.netwt || "",
                        PURITY: item.PURITY || item.purity || "",
                        PUREWT: item.PUREWT || item.purewt || "",
                        RATE: item.RATE || item.rate || "",
                        MCHARGE: item.MCHARGE || item.mcharge || "",
                        WASTAGE: item.WASTAGE || item.wastage || "",
                        AMOUNT: item.AMOUNT || item.amount || "",
                    };

                //console.log(`Created row ${index}:`, rowData);
                return rowData;
            });

            setDraftRows(newDraftRows);
            //console.log("Set draft rows:", newDraftRows);

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

        console.log(customerValue, customerLabel,'headerFormss')

        setHeaderForm(prev => ({
            ...prev,
            CUSTOMER: customerValue || "",      // allow clearing
            CUSTOMER_NAME: customerLabel || "", // clear name as well
        }));

        console.log(headerForm,'headerFormsss')

        setAccCode(customerValue ? Number(customerValue) : 0);
        refetchTransactionList();
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
         Handle Stock Table Values
      ================================ */
    
    const handleLoadFromStock = (stockRow: any) => {
        if (!selectedTransactionType) {
            toaster.create({
                title: "Transaction Type Required",
                description: "Please select a transaction type first.",
                type: "warning",
            });
            return;
        }

        const pureId = stockRow.PUREID ?? stockRow.pureId;
        if (!pureId) return;

        const getUsedWeightInTable = (pureId: string | number) =>
            draftRows
                .filter(r => String(r.PUREID) === String(pureId))
                .reduce((sum, r) => sum + Number(r.WT || 0), 0);

        const stockAvailable = getAvailableWeight(pureId) ?? 0;
        const used = getUsedWeightInTable(pureId);
        const remaining = Math.max(stockAvailable - used, 0);

        if (isIssue && remaining <= 0) {
            toaster.create({
                title: "Stock Exhausted",
                description: "No available balance left for this Pure ID.",
                type: "error",
            });
            return;
        }

        const rowId = `draft-${Date.now()}`;

        const newRow = {
            __rowId: rowId,
            __isNew: true,
            __previewSno: draftRows.length + 1,
            TRANSACTION_TYPE: selectedTransactionType.value,

            PUREID: pureId,

            WT: remaining,
            TOUCH: stockRow.TOUCH || stockRow.actualTouch || "",
            PURE: stockRow.PURE || stockRow.actualPure || "",

            A_WT: remaining,
            A_TOUCH: stockRow.ATOUCH || stockRow.actualTouch || "",
            A_PURE: stockRow.APURE || stockRow.actualPure || "",

            ITEMID: stockRow.ITEMID || "",
            PCS: stockRow.PCS || "",
            GRSWT: stockRow.GRSWT || "",
            LESSWT: stockRow.LESSWT || "",
            NETWT: stockRow.NETWT || "",
            PURITY: stockRow.PURITY || "",
            PUREWT: stockRow.PUREWT || "",
            RATE: stockRow.RATE || headerForm.RATEGM || "",
            MCHARGE: stockRow.MCHARGE || "",
            WASTAGE: stockRow.WASTAGE || "",
        };

        setDraftRows(prev => [...prev, newRow]);
        setEditingRowId(rowId);
    };



    // const handleLoadFromStock = (stockRow: any) => {

       
    //     if (isIssue) {
    //         const exists = draftRows.some(r => String(r.pureId) === String(stockRow.PUREID));
    //         if (exists) {
    //             toaster.create({
    //                 title: "Duplicate Pure ID",
    //                 description: "This Pure ID already exists in the table.",
    //                 type: "error",
    //             });
    //             return;
    //         }
    //     } else {
    //         const exists = draftRows.some(r => String(r.ITEMID) === String(stockRow.ITEMID));
    //         if (exists) {
    //             toaster.create({
    //                 title: "Duplicate Item",
    //                 description: "This Item already exists in the table.",
    //                 type: "error",
    //             });
    //             return;
    //         }
    //     }
    //     if (!selectedTransactionType) {
    //         toaster.create({
    //             title: "Transaction Type Required",
    //             description: "Please select a transaction type first.",
    //             type: "warning",
    //         });
    //         return;
    //     }

    //     const rowId = `draft-${Date.now()}`;

    //     const newRow = {
    //         __rowId: rowId,
    //         __isNew: true,
    //         __previewSno: draftRows.length + 1,
    //         TRANSACTION_TYPE: selectedTransactionType.value,

    //         // Map stock row → transaction row
    //         PUREID: stockRow.PUREID || stockRow.pureId ||"",
    //         WT: stockRow.WT || stockRow.weight ||"",
    //         TOUCH: stockRow.TOUCH || stockRow.actualTouch||"",
    //         PURE: stockRow.PURE || stockRow.actualPure|| "",

    //         A_WT: stockRow.AWT || stockRow.weight || "",
    //         A_TOUCH: stockRow.ATOUCH || stockRow.actualTouch || "",
    //         A_PURE: stockRow.APURE || stockRow.actualPure || "",

    //         ITEMID: stockRow.ITEMID || "",
    //         PCS: stockRow.PCS || "",
    //         GRSWT: stockRow.GRSWT || "",
    //         LESSWT: stockRow.LESSWT || "",
    //         NETWT: stockRow.NETWT || "",
    //         PURITY: stockRow.PURITY || "",
    //         PUREWT: stockRow.PUREWT || "",
    //         RATE: stockRow.RATE || headerForm.RATEGM || "",
    //         MCHARGE: stockRow.MCHARGE || "",
    //         WASTAGE: stockRow.WASTAGE || "",
    //     };

    //     setDraftRows(prev => [...prev, newRow]);
    //     setEditingRowId(rowId);
    // };



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

    const handleUpdateDraftRow = useCallback(
        (rowIndex: number, field: string, value: any) => {
            setDraftRows(prev => {
                const newRows = [...prev];
                let row = { ...newRows[rowIndex], [field]: value };

                // ===============================
                // 🚫 DUPLICATE PREVENTION
                // ===============================
                // if (isIssue && field === "PUREID") {
                //     const exists = hasDuplicateId(prev, "PUREID", value, rowIndex);
                //     if (exists) {
                //         toaster.create({
                //             title: "Duplicate Pure ID",
                //             description: "This Pure ID is already added.",
                //             type: "error",
                //         });
                //         return prev; // ⛔ reject change
                //     }
                // }

                // if (!isIssue && field === "ITEMID") {
                //     const exists = hasDuplicateId(prev, "ITEMID", value, rowIndex);
                //     if (exists) {
                //         toaster.create({
                //             title: "Duplicate Item",
                //             description: "This Item is already added.",
                //             type: "error",
                //         });
                //         return prev; // ⛔ reject change
                //     }
                // }

                // -------------------------------
                // Manual override tracking
                // -------------------------------
                if (field === "A_WT") row.__manual_A_WT = true;
                if (field === "A_TOUCH") row.__manual_A_TOUCH = true;
                if (field === "A_PURE") row.__manual_A_PURE = true;

                if (field === "WT") row.__manual_A_WT = false;
                if (field === "TOUCH") row.__manual_A_TOUCH = false;

                // -------------------------------
                // Mirror logic
                // -------------------------------
                if (field === "WT" && !row.__manual_A_WT) row.A_WT = value;
                if (field === "TOUCH" && !row.__manual_A_TOUCH) row.A_TOUCH = value;

                // -------------------------------
                // 🔒 Stock limit
                // -------------------------------
                const getTotalUsedWeight = (
                    rows: any[],
                    pureId: string | number,
                    ignoreIndex?: number
                ) => {
                    return rows.reduce((sum, r, idx) => {
                        if (ignoreIndex === idx) return sum;
                        if (String(r.PUREID) === String(pureId)) {
                            return sum + Number(r.WT || 0);
                        }
                        return sum;
                    }, 0);
                };

                if (isIssue && (field === "WT" || field === "A_WT")) {
                    const available = getAvailableWeight(row.PUREID);
                    if (available != null) {
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

                // -------------------------------
                // Calculations
                // -------------------------------
                if (field === "GRSWT" || field === "LESSWT") {
                    const grswt = Number(row.GRSWT) || 0;
                    const lesswt = Number(row.LESSWT) || 0;
                    row.NETWT = Math.max(0, grswt - lesswt);
                }

                if (field === "NETWT" || field === "PURITY") {
                    const netwt = Number(row.NETWT) || 0;
                    const purity = Number(row.PURITY) || 0;
                    row.PUREWT = (netwt * purity) / 100;
                }

                if (isIssue && (field === "WT" || field === "TOUCH")) {
                    const wt = Number(row.WT) || 0;
                    const touch = Number(row.TOUCH) || 0;
                    row.PURE = (wt * touch) / 100;
                }

                if (isIssue && (field === "A_WT" || field === "A_TOUCH")) {
                    const wt = Number(row.A_WT) || 0;
                    const touch = Number(row.A_TOUCH) || 0;
                    if (!row.__manual_A_PURE) {
                        row.A_PURE = (wt * touch) / 100;
                    }
                }

                row.__previewSno = rowIndex + 1;

                newRows[rowIndex] = row;
                return newRows;
            });
        },
        [isIssue, getAvailableWeight, toaster]
    );





    const handleRemoveDraftRow = (rowId: string) => {
        setDraftRows(prev => prev.filter(row => row.__rowId !== rowId));
        if (editingRowId === rowId) {
            setEditingRowId(null);
        }
    };

    /* ================================
        Normalize Handler
     ================================ */
    const normalizeRowForApi = (row: any, isIssue: boolean) => {
        const {
            __rowId,
            __isNew,
            __previewSno,
            __manual_A_WT,
            __manual_A_TOUCH,
            __manual_A_PURE,
            ...rest
        } = row;

        if (isIssue) {
            return {
                PUREID: rest.PUREID ? Number(rest.PUREID) : undefined,
                WT: Number(rest.WT || 0),
                TOUCH: Number(rest.TOUCH || 0),
                PUREWT: Number(rest.PURE || 0),
                A_WT: Number(rest.A_WT || 0),
                A_TOUCH: Number(rest.A_TOUCH || 0),
                A_PUREWT: Number(rest.A_PURE || 0),
            };
        }

        return {
            PCS: Number(rest.PCS || 0),
            GRSWT: Number(rest.GRSWT || 0),
            LESSWT: Number(rest.LESSWT || 0),
            NETWT: Number(rest.NETWT || 0),
            PURITY: Number(rest.PURITY || 0),
            PUREWT: Number(rest.PUREWT || 0),
            RATE: Number(rest.RATE || 0),
            MCHARGE: Number(rest.MCHARGE || 0),
            WASTAGE: Number(rest.WASTAGE || 0),
            AMOUNT: Number(rest.AMOUNT || 0),
            ITEMID: rest.ITEMID ? String(rest.ITEMID) : undefined,
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
        // if (isIssue) {
        //     const ids = draftRows.map(r => r.PUREID);
        //     const hasDuplicate = new Set(ids).size !== ids.length;
        //     if (hasDuplicate) {
        //         toaster.create({
        //             title: "Duplicate Pure IDs",
        //             description: "Remove duplicate Pure IDs before saving.",
        //             type: "error",
        //         });
        //         return false;
        //     }
        // } else {
        //     const ids = draftRows.map(r => r.ITEMID);
        //     const hasDuplicate = new Set(ids).size !== ids.length;
        //     if (hasDuplicate) {
        //         toaster.create({
        //             title: "Duplicate Items",
        //             description: "Remove duplicate Items before saving.",
        //             type: "error",
        //         });
        //         return false;
        //     }
        // }

        if (isIssue) {
            const grouped: Record<string, number> = {};

            for (const r of draftRows) {
                if (!r.PUREID) continue;
                grouped[r.PUREID] =
                    (grouped[r.PUREID] || 0) + Number(r.WT || 0);
            }

            for (const pureId in grouped) {
                const available = getAvailableWeight(pureId);
                if (available != null && grouped[pureId] > available) {
                    toaster.create({
                        title: "Stock Exceeded",
                        description: `Pure ID ${pureId} exceeds available stock (${available})`,
                        type: "error",
                    });
                    return false;
                }
            }
        

            const missingFieldsRow = draftRows.find(
                (r) =>
                    !r.PUREID ||
                    r.WT == null ||
                    r.TOUCH == null ||
                    r.PURE == null
            );

            if (missingFieldsRow) {
                toaster.create({
                    title: "Incomplete Items",
                    description: "Please fill PUREID, Weight, Touch, and Pure for all rows.",
                    type: "error",
                });
                return false;
            }
        } else {
            const invalidRows = draftRows.filter(row => !row.ITEMID);
            if (invalidRows.length > 0) {
                toaster.create({
                    title: "Incomplete Items",
                    description: "Please select an item for all rows.",
                    type: "error",
                });
                return false;
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
                return false;
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
                return false;
            }
        }

        return true;
    };

    const validateIssueStockOnSave = (
        rows: any[],
        getAvailableWeight: (pureId: string | number) => number | null
    ) => {
        const grouped: Record<string, number> = {};

        for (const r of rows) {
            if (!r.PUREID) continue;

            const key = String(r.PUREID);
            grouped[key] = (grouped[key] || 0) + Number(r.WT || 0);
        }

        for (const pureId in grouped) {
            const available = getAvailableWeight(pureId);
            if (available != null && grouped[pureId] > available) {
                return {
                    pureId,
                    used: grouped[pureId],
                    available,
                };
            }
        }

        return null;
    };


    /* ================================
       Save Transaction Handler
    ================================ */
    const handleSaveTransaction = async () => {
        setEditingRowId(null);

        if (isIssue) {
            // 1️⃣ Required fields
            const missingFieldsRow = draftRows.find(
                (r) =>
                    !r.PUREID ||
                    r.WT == null ||
                    r.TOUCH == null ||
                    r.PURE == null
            );

            if (missingFieldsRow) {
                toaster.create({
                    title: "Incomplete Items",
                    description: "Please fill PUREID, Weight, Touch, and Pure for all rows.",
                    type: "error",
                });
                return;
            }

            // 2️⃣ Aggregate stock validation (🔥 IMPORTANT)
            const stockError = validateIssueStockOnSave(
                draftRows,
                getAvailableWeight
            );

            if (stockError) {
                toaster.create({
                    title: "Stock Exceeded",
                    description: `Pure ID ${stockError.pureId}: Used ${stockError.used}, Available ${stockError.available}`,
                    type: "error",
                });
                return;
            }
        }


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

        // ================= VALIDATION =================
        if (isIssue) {
            // const exceededRow = draftRows.find((r) => {
            //     const available = getAvailableWeight(r.PUREID);
            //     return available != null && Number(r.WT) > available;
            // });

            // console.log(draftRows, 'draftRows')
            // const ids = draftRows.map(r => Number(r.PUREID));
            // console.log(ids,'draftRows')
            // const hasDuplicate = new Set(ids).size !== ids.length;
            // if (hasDuplicate) {
            //     toaster.create({
            //         title: "Duplicate Pure IDs",
            //         description: "Remove duplicate Pure IDs before saving.",
            //         type: "error",
            //     });
            //     return false;
            // }

            // if (exceededRow) {
            //     toaster.create({
            //         title: "Stock Exceeded",
            //         description: "One or more rows exceed available stock weight.",
            //         type: "error",
            //     });
            //     return;
            // }
            const missingFieldsRow = draftRows.find(
                (r) =>
                    !r.PUREID ||
                    r.WT == null ||
                    r.TOUCH == null ||
                    r.PURE == null
            );

            if (missingFieldsRow) {
                toaster.create({
                    title: "Incomplete Items",
                    description: "Please fill PUREID, Weight, Touch, and Pure for all rows.",
                    type: "error",
                });
                return;
            }
        } else {
            const invalidRows = draftRows.filter(row => !row.ITEMID);
            if (invalidRows.length > 0) {
                toaster.create({
                    title: "Incomplete Items",
                    description: "Please select an item for all rows.",
                    type: "error",
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
        }

        try {
            const transactionData = {
                TRANSACTION_DETAILS: {
                    ACCODE: Number(headerForm.CUSTOMER),
                    TRANTYPE: String(selectedTransactionType.value),
                    TRANDATE: headerForm.DATE,
                },
                TRANSACTION_ITEMS: draftRows.map(row =>
                    normalizeRowForApi(row, isIssue)
                ),
            };

            //console.log("CREATE PAYLOAD:", transactionData);

            await createTransaction.mutateAsync(transactionData);

            setDraftRows([]);
            setEditingRowId(null);
            localStorage.removeItem(DRAFT_KEY);

            toaster.create({
                title: "Transaction Saved",
                description: "Transaction has been saved successfully.",
                type: "success",
            });
            stockRefetch();

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

        if (!validateDraftRows()) return;

        try {
            const updateData = {
                TRANSACTION_DETAILS: {
                    ACCODE: Number(headerForm.CUSTOMER),
                    TRANTYPE: String(selectedTransactionType?.value),
                    TRANDATE: headerForm.DATE,
                },
                TRANSACTION_ITEM: draftRows.length > 0 ? normalizeRowForApi(draftRows[0], isIssue) : null,
            };

            //console.log("UPDATE PAYLOAD:", updateData);

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

            // Clear storage
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
                description: "Transaction updated successfully.",
                type: "success",
            });
            stockRefetch();
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
        //console.log("Transaction clicked:", transactionId);
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
                                itemsCollection={activeCollection}
                                itemsFilter={activeFilter}
                                totals={totals}
                                transactionTitle={transactionTitle}
                                theme={theme}
                                isIssue={isIssue}
                                getAvailableWeight={getAvailableWeight}
                               
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
                        transactionList={transactionList}
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
                    icon={<GiGoldBar />}
                    ariaLabel="Share"
                    tooltip="ALL STOCK"
                    onClick={() => setIsStockDrawerOpen(true)}
                    position="bottom-right"
                    colorScheme="yellow"
                    size="lg"
                />
            </Box>
            <StockDrawer
                isIssue={isIssue}
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
    );
}