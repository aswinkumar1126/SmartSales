"use client";

import React, { useEffect, useMemo, useState, useCallback ,useRef } from "react";
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

// Components
import TransactionHeaderForm from "./TransactionHeaderForm/TransactionHeaderForm";
import TransactionTypeSelector from "./TransactionTypeSelector/TransactionTypeSelector";
import DraftTransactionTable from "./DraftTransactionTable/DraftTransactionTable";
import SaveTransactionBar from "./SaveTransactionBar/TransactionBar";
import RightSideDetailsPanel from "./RightSideDetailsPanel/RightSideDetailsPanel";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import StockDrawer from "./DrawerTable/StockTable";
import { useAllMetals } from "@/hooks/metal/useMetals";
import Loader from "@/component/loader/Loader";

import BalanceSummary, { ClosingFormDetails } from "./Balance/BalanceSummary";
//Key
import { useGlobalKey } from "@/components/key/useGlobalKey";

// Hooks
import { useTransactions } from "@/hooks/transaction/useTransactions";
import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";
import { useItems, useStoneItems } from "@/hooks/item/useItems";
import { useCreateTransactions, useUpdateTransaction, useTransactionByTransId } from "@/hooks/transaction/useTransactions";
import { usePureGoldData, usePureGoldNames } from "@/hooks/pureGoldMast/usePureGoldMastData";
import { useActiveOtherCharges } from "@/hooks/otherCharges/useOtherCharges";
import { useRates } from "@/hooks/rate/useRate";

// Types & Constants
import { TransactionType, UpdateTransactionPayload, TransactionKey, CreateTransaction, TransactionItems, TRANSACTION_KEY_MAP, ClosingDetails } from "@/types/transcation/Transaction";
import { TRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import { useOrnamentData } from "@/hooks/ornament/useOrnamentData";

//Utilities
import { formatToFixed} from '@/utils/format/numberFormat';


//Icons
type StoneRow = {
    id:string;
    draftRowId:string;
    stoneId: string;
    subStoneId: string;
    stonePcs: string;
    stoneWeight: string;
    stoneUnit: "g" | "c";
    stoneCalculation: "w" | "p";
    stoneRate: string;
    stoneAmount: string;
};

type TransactionRow ={
    TRANSACTION_TYPE: string;
    PUREWT?: number;
    HMC?:number;
    STNAMT?:number;
    MC?:number;
}


/* ================================
   Main Component
================================ */

export default function PurchasePage() {

    const isFirstRender = useRef(true);

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

    const STONE_MASTER_KEY = "STONE_MASTER";
    const CLOSING_DETAILS_KEY = "CLOSING_DETAILS";



    const [accCode, setAccCode] = useState<number | undefined | null | string>();
    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [purchaserList, setPurchaserList] = useState<{ label: string, value: string }[]>([]);

    const [filter, setFilter] = useState<string>('');
    const [isStockDrawerOpen, setIsStockDrawerOpen] = useState(false);

    const [showStock, setShowStock] = useState<string>("PURE");
    const [pureGoldList, setPureGoldList] = useState<{ label: string, value: string }[]>([]);
    const [metalList, setMetalList] = useState<{ label: string, value: string }[]>([]);
    const [otherCharges, setOtherCharges] = useState<{ label: string, value: string }[]>([]);

    const [metalId, setMetalId] = useState<string | undefined>();

    const [metalRate, setMetalRate] = useState<number>();

    


    const [selectedName, setSelectedName] = useState<string | undefined>();
    // const [itemsStockList, setItemsStockList] = useState<{ label: string, value: string }[]>([]);

    const TRANSACTIONTYPES_ORDER = ["PU", "PR", "ISP", "REC"];



    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const openFilter = () => setIsFilterOpen(true);
    const closeFilter = () => setIsFilterOpen(false);

    const draftRowTempId = useRef<string | null>(null);

    const [editingState, setEditingState] = useState<{
        rowId: string | null;
        transactionType: string | null;
    }>({ rowId: null, transactionType: null });

    const {data:metalRates ,isLoading:metalRatesLoading ,isError:metalRatesError} = useRates();


    // console.log(metalRate, 'metalRate');


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
        RATEGM: "", // start empty
        CUSTOMER: "",
        CUSTOMER_NAME: "",
    });



    useEffect(() => {
        const rate = metalRates ? formatToFixed(metalRates["GOLD 916.00"], 2) : "";
        // setMetalRate(rate);
        setHeaderForm(prev => ({ ...prev, RATEGM: rate })); // update headerForm too

    }, [metalRates]);

    const [closingDetails, setClosingDetails] = useState<ClosingFormDetails>(() => {
        // Load from localStorage on initial state only
        const saved = localStorage.getItem(CLOSING_DETAILS_KEY);
        if (saved) {
            try {
                return JSON.parse(saved) as ClosingFormDetails;
            } catch (e) {
                console.error("Failed to parse closing details:", e);
                localStorage.removeItem(CLOSING_DETAILS_KEY);
            }
        }

        // Default state if nothing in localStorage
        return {
            convType: "P",
            convAmt: "",
            convWt: "",
            discAmt: "",
            discWt: "",
            cashPaid: "",
            cashRcvd: "",
            bankPaid: "",
            bankRcvd: "",
            bankPaidDetails: [],
            bankRcvdDetails: [],
        };
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editingSno, setEditingSno] = useState<string | null>(null);

    // Transaction type & draft state
    const [selectedTransactionTypes, setSelectedTransactionTypes] = useState<TransactionType[]>([]);


    // Draft rows (local storage backed)
    const [draftRows, setDraftRows] = useState<any[]>([]);

    // const [editingRowId, setEditingRowId] = useState<string | number | null>(null);

    // History state

    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

    // Date range state with localStorage persistence
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [itemCode, setItemCode] = useState<number | null>(null);

    

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
    console.log(filter, cleanedFilters,'cleanedFilters')



    const { data: pureStockList = [], refetch: goldStockRefetch } = usePureGoldData(filter,cleanedFilters);
    const {data : itemsStock ,refetch: itemStockRefetch  } = useOrnamentData(filter);



    const { data: allPureGoldNames } = usePureGoldNames();

    const { data: transactionsById, isLoading: getbySnoLoading } = useTransactionByTransId(selectedTransactionId);

    const { data: otherChargesData } = useActiveOtherCharges();


    const updateTransaction = useUpdateTransaction();
    const { data: metalsData } = useAllMetals();

    const { data: openingBalance ,refetch:openingBalanceRefetch  } = useOpeningBalance(Number(accCode));

    console.log(openingBalance,'openingBalance')
    // Note: This hook might need to be updated to handle multiple transaction types
    const { data: transactionList, isLoading, refetch: refetchTransactionList } = useTransactions(
        selectedTransactionTypes[0]?.value, // Using first type for now
        Number(accCode),
        startDate,
        endDate,
        itemCode
    );

    const [apiBalanceOpening, setApiBalanceOpening] = useState({
        openPure: 0,
        openCash: 0
    });

    const [openingBalances, setOpeningBalances] = useState({
        openPure: 0,
        openCash: 0
    });

    console.log(openingBalances,'openingBalances')

    useEffect(() => {

        const openPure = Number(openingBalance?.data?.openpure ?? 0);
        const openCash = Number(openingBalance?.data?.opencash ?? 0);

        setApiBalanceOpening({
            openPure,
            openCash
        });

    }, [openingBalance]);

    const createTransaction = useCreateTransactions();
    const { contains } = useFilter({ sensitivity: "base" });
    

    /* ================================
       Selected Collection For Stock List
    ================================ */
    const itemsStockList = itemsStock?.data || [] ;

    const selectedStockData = useMemo(() => {
        return showStock === "PURE"
            ? pureStockList
            : itemsStockList;
    }, [showStock, pureStockList, itemsStockList]);

    console.log(selectedStockData, 'selectedStockData')

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
    console.log(otherChargesData,'otherChargers')

    useEffect(() => {
        if (!otherChargesData) return;
        const otherCharges = otherChargesData.data.map((charges: any) => {
            return {
                label: charges.chargeName,
                value: charges.chargeId.toString()
            }
        })
        setOtherCharges(otherCharges);

    }, [otherChargesData]);


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


    // Function to get or create draft row temp ID
    const getDraftRowTempId = () => {
        if (!draftRowTempId.current) {
            draftRowTempId.current = `draft-form-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            console.log(`Created new draft row temp ID: ${draftRowTempId.current}`);
        }
        return draftRowTempId.current;
    };

    // Reset draft row temp ID
    const resetDraftRowTempId = () => {
        draftRowTempId.current = null;
    };

    console.log(selectedTransactionTypes,'selectedTransactionTypes')

    // KEY TO ACCESS

    useGlobalKey("F1" ,()=>openFilter() ,"openFilter");



    /* ================================
    Calculate Used Weight for Pure IDs
 ================================ */
    const getUsedWeightByPureId = useCallback((pureId: string | number, excludeRowId?: string) => {
        const pureIdStr = String(pureId);

        // Sum up all WT values for this Pure ID across all issue-type rows
        const used = draftRows
            .filter(row => {
                // Skip the excluded row
                if (excludeRowId && row.__rowId === excludeRowId) return false;

                // Find the transaction type object
                const transactionType = TRANSACTIONTYPES.find(t => t.value === row.TRANSACTION_TYPE);

                // Only count if the type exists, is ISP, and PUREID matches
                return transactionType &&
                    transactionType.code === "ISP" &&
                    String(row.PUREID) === pureIdStr;
            })
            .reduce((sum, row) => sum + (Number(row.WT) || 0), 0);

        return used;
    }, [draftRows]);

    /* ================================
        Get Stock Availability with Used Weight
     ================================ */
    const getStockAvailability = useCallback((pureId: string | number | null, excludeRowId?: string) => {
        if (!pureId) return undefined;

        const stock = pureStockList.find(
            (s: any) => String(s.pureId) === String(pureId)
        );

        if (!stock) return undefined;

        const totalAvailable = Number(stock.weight || 0);
        const used = getUsedWeightByPureId(pureId, excludeRowId);
        const remaining = Math.max(totalAvailable - used, 0);

        return {
            total: totalAvailable,
            used: used,
            remaining: remaining,
        };
    }, [pureStockList, getUsedWeightByPureId]);

    const getAvailableWeight = useCallback((pureId: string | number | null, excludeRowId?: string ) => {
        if (!pureId) return null;
        const availability = getStockAvailability(pureId, excludeRowId);
        return availability?.remaining ?? null;
    }, [getStockAvailability]);


    // Main calculation function
    function calculateOpeningBalances(
        draftRows: TransactionRow[],
        initialPure: number,
        initialCash: number
    ) {
        let openPure = initialPure;
        let openCash = initialCash;

        draftRows.forEach((row) => {
            const type = TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];
            const pureWt = Number(row.PUREWT) || 0;

            // Calculate cash amount for this row
            const cash = (Number(row.HMC) || 0) +
                (Number(row.STNAMT) || 0) +
                (Number(row.MC) || 0);

            console.log(cash, 'cashamount for row', row.TRANSACTION_TYPE);

            switch (type) {
                case "purchase":
                    openPure += pureWt;
                    openCash += cash;
                    break;

                case "purchase_return":
                    openPure -= pureWt;
                    openCash -= cash;
                    break;

                case "receipt":
                    openPure += pureWt;
                    // Receipt doesn't affect cash balance
                    // openCash remains unchanged
                    break;

                case "issue":
                    openPure -= pureWt;
                    // Issue doesn't affect cash balance
                    // openCash remains unchanged
                    break;
            }
        });

        console.log({
            openPure: parseFloat(openPure.toFixed(3)),
            openCash: parseFloat(openCash.toFixed(2))
        }, 'final opening balances');

        return {
            openPure: parseFloat(openPure.toFixed(3)),
            openCash: parseFloat(openCash.toFixed(2))
        };
    }
    console.log(accCode, apiBalanceOpening,'apiBalanceOpening')


    // Single useEffect to calculate balances when either draftRows or API balances change
    useEffect(() => {
        if (apiBalanceOpening.openPure !== undefined && apiBalanceOpening.openCash !== undefined) {
            const balances = calculateOpeningBalances(
                draftRows,
                apiBalanceOpening.openPure,
                apiBalanceOpening.openCash  // ✅ Fixed: Now using openCash, not openPure
            );

           
            setOpeningBalances(balances);

            // localStorage.setItem("OPENING_BALANCES",JSON.stringify(balances));
        }
    }, [accCode ,draftRows, apiBalanceOpening ]); // ✅ Single dependency array

    /* ================================
    Pure Gold Name Data
  ================================ */

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
    }, [mappedPureGoldName, setPureGoldNames]);

    /* ================================
       Helper Functions
    ================================ */
    const isIssueType = (transactionType: TransactionType) => {
        return transactionType.label.toUpperCase() === "ISSUE" || transactionType.label.toUpperCase() === "RECEIPT";
    };

    // Determines if a stock row should be treated as an Issue-type (ISSUE / RECEIPT)
    const isIssueStock = (stockRow: any): boolean => {
        return !!stockRow.pureId; // if pureId exists, it's issue stock
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
            // Make sure this ID is unique and consistent
            __rowId: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
                PUREWT: "",
                AWT: "",
                ATOUCH: "",
                APUREWT: "",
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
            HMC:"",
            RATE:  "",
            MCHARGE: "",
            WASTAGE: "",
        };
    };
  



    const handleClearRowsForType = (transactionType: TransactionType) => {
        setDraftRows(prev => prev.filter(row => row.TRANSACTION_TYPE !== transactionType.value));
        setEditingState({ rowId: null, transactionType: null })
        // setEditingRowId(null);
        resetDraftRowTempId(); // Reset temp ID when clearing
    };

 
    // Delete stones for a specific draft row
    const deleteStonesForDraftRow = (draftRowId: string) => {
        const all = JSON.parse(localStorage.getItem(STONE_MASTER_KEY) || "[]");
        const filtered = all.filter((s: StoneRow) => s.draftRowId !== draftRowId);
        localStorage.setItem(STONE_MASTER_KEY, JSON.stringify(filtered));
    };

    // Create empty stone row for a draft row
    const createEmptyStoneRow = (draftRowId: string): StoneRow => {
        return {
            id: `stone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            draftRowId, // This must match the draft row ID exactly
            stoneId: "",
            subStoneId: "",
            stonePcs: "",
            stoneWeight: "",
            stoneUnit: "g",
            stoneCalculation: "w",
            stoneRate: "",
            stoneAmount: "",
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
                console.log('parsed')
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
    }, [isEditing, editingSno]);

 

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


    const handleRowClick = (row: any, clickedTransactionType: string) => {
        console.log('Row clicked:', row, 'Type:', clickedTransactionType);
        setEditingState({
            rowId: row.__rowId,
            transactionType: clickedTransactionType
        });
        // setEditingRowId(row.__rowId);
    
    };
    const handleCancelEdit = useCallback(() => {
        console.log('Cancelling edit, editingState:', editingState);

        // Remove temp row ONLY for the current transaction type
        if (editingState.rowId?.toString().startsWith('draft-form-') && editingState.transactionType) {
            setDraftRows(prev => prev.filter(
                row => !(row.__rowId === editingState.rowId && row.TRANSACTION_TYPE === editingState.transactionType)
            ));
        }

        // Clear editing state
        setEditingState({ rowId: null, transactionType: null });
        resetDraftRowTempId();
    }, [editingState]);

    const handleEditTransaction = useCallback((transactionData: any, sno: string) => {
        console.log(transactionData, sno, 'transactionData');

        if (!transactionData) {
            return;
        }

        // Set editing mode and SNO
        setIsEditing(true);
        setEditingSno(sno);
        setSelectedTransactionId(sno);

        // Try different possible data structures
        const transactionDetails = transactionData.header;

        // Collect ALL transaction types that have data
        let transactionTypes: string[] = [];
        let allTransactionItems: any[] = [];

        // Check if TRANSACTION_DETAILS exists and has data
        if (transactionData.TRANSACTION_DETAILS) {
            const details = transactionData.TRANSACTION_DETAILS;

            // Load purchase items
            if (details.purchase && details.purchase.length > 0) {
                transactionTypes.push('PU');
                allTransactionItems = [...allTransactionItems, ...details.purchase.map((item: any) => ({
                    ...item,
                    _type: 'PU'
                }))];
            }

            // Load issue items
            if (details.issue && details.issue.length > 0) {
                transactionTypes.push('ISP');
                allTransactionItems = [...allTransactionItems, ...details.issue.map((item: any) => ({
                    ...item,
                    _type: 'ISP'
                }))];
            }

            // Load purchase return items
            if (details.purchase_return && details.purchase_return.length > 0) {
                transactionTypes.push('PR');
                allTransactionItems = [...allTransactionItems, ...details.purchase_return.map((item: any) => ({
                    ...item,
                    _type: 'PR'
                }))];
            }

            // Load receipt items
            if (details.receipt && details.receipt.length > 0) {
                transactionTypes.push('REP');
                allTransactionItems = [...allTransactionItems, ...details.receipt.map((item: any) => ({
                    ...item,
                    _type: 'REP'
                }))];
            }
        }

        // Remove duplicate transaction types
        const uniqueTransactionTypes = [...new Set(transactionTypes)];

        console.log('Detected transaction types:', uniqueTransactionTypes);
        console.log('Total transaction items:', allTransactionItems.length);

        // 1. Load transaction details into header form
        if (transactionDetails) {
            setHeaderForm(prev => ({
                ...prev,
                CUSTOMER: transactionDetails.ACCODE ? String(transactionDetails.ACCODE) : "",
                CUSTOMER_NAME: transactionDetails.ACNAME || "",
                DATE: transactionDetails.TRANDATE || new Date().toISOString().split("T")[0],
                BILLNO: transactionDetails.BILLNO || "",
                ENTRYNO: transactionDetails.ENTRYNO || "",
            }));

            setAccCode(transactionDetails.ACCODE);

            // Set ALL transaction types that are present
            if (uniqueTransactionTypes.length > 0) {
                const foundTypes = TRANSACTIONTYPES.filter(t => uniqueTransactionTypes.includes(t.code));
                if (foundTypes.length > 0) {
                    setSelectedTransactionTypes(foundTypes);
                    console.log('Set transaction types to:', foundTypes);
                }
            }
        }

        // 2. Load ALL transaction items into draft rows and load stones/charges into localStorage
        if (allTransactionItems && allTransactionItems.length > 0) {
            const allStones: any[] = [];
            const allCharges: any[] = [];

            const newDraftRows = allTransactionItems.map((item: any, index: number) => {
                const itemType = item._type;
                const isIssue = itemType === "ISP" || itemType === "REP";

                // Generate a unique row ID for this item
                const rowId = `edit-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;

                // Process stone details if they exist (for purchase/purchase_return)
                if (!isIssue && item.stoneDetails && item.stoneDetails.length > 0) {
                    const stonesForRow = item.stoneDetails.map((stone: any, stoneIndex: number) => ({
                        id: `stone-${Date.now()}-${index}-${stoneIndex}-${Math.random().toString(36).substr(2, 5)}`,
                        draftRowId: rowId,
                        stoneId: String(stone.stoneId || stone.substoneId || stone.subStoneId || ""),
                        subStoneId: String(stone.substoneId || stone.stoneId || stone.subStoneId || ""),
                        stonePcs: stone.stonepcs || stone.stonePcs || stone.pcs || 0,
                        stoneWeight: stone.stoneWeight || stone.weight || 0,
                        stoneUnit: stone.stoneUnit || stone.unit || "g",
                        stoneCalculation: stone.stoneCalculation || stone.calculation || "w",
                        stoneRate: stone.stoneRate || stone.rate || 0,
                        stoneAmount: stone.stoneAmount || stone.amount || 0,
                    }));
                    allStones.push(...stonesForRow);
                }

                // Process other charges details if they exist
                if (!isIssue && item.otherChargesDetails && item.otherChargesDetails.length > 0) {
                    const chargesForRow = item.otherChargesDetails.map((charge: any, chargeIndex: number) => ({
                        id: `charge-${Date.now()}-${index}-${chargeIndex}-${Math.random().toString(36).substr(2, 5)}`,
                        draftRowId: rowId,
                        chargeName: String(charge.chargeId || charge.chargeName || ""),
                        amount: charge.chargeAmount || charge.amount || 0,
                    }));
                    allCharges.push(...chargesForRow);
                }

                if (isIssue) {
                    // Issue/Receipt type transaction
                    return {
                        __rowId: rowId,
                        __isNew: false,
                        __isEditing: true,
                        __previewSno: index + 1,
                        __originalItemId: item.PUREID,
                        __originalSno: item.SNO,
                        __originalTransNo: item.TRANNO,

                        TRANSACTION_TYPE: itemType,
                        PUREID: item.PUREID || "",

                        WT: item.WT || "",
                        TOUCH: item.TOUCH || "",
                        PUREWT: item.PUREWT || "",

                        AWT: item.AWT || item.WT || "",
                        ATOUCH: item.ATOUCH || item.TOUCH || "",
                        APUREWT: item.APUREWT || item.PUREWT || "",

                        BATCHNO: item.BATCHNO || "",
                    };
                } else {
                    // Purchase/Purchase Return type transaction
                    return {
                        __rowId: rowId,
                        __isNew: false,
                        __isEditing: true,
                        __previewSno: index + 1,
                        __originalItemId: item.ITEMID,
                        __originalSno: item.SNO,
                        __originalTransNo: item.TRANNO,

                        TRANSACTION_TYPE: itemType,
                        ITEMID: item.ITEMID ? String(item.ITEMID) : "",

                        SNO:item.SNO || "",

                        PCS: item.PCS || "",

                        GRSWT: item.GRSWT || "",
                        STNWT: item.STNWT || "",
                        NETWT: item.NETWT || "",

                       
                        TOUCH: item.TOUCH || "",
                        PUREWT: item.PUREWT || "",

                        // ATOUCH: item.ATOUCH || "",
                        // RATE: item.RATE || "",


                        MC: item.MC || item.MCHARGE || "",

                        WASTYPE: item.WASTYPE || "",



                        // WASPER: item.WASPER || "",
                        // WASTAGE: item.WASTAGE || "",


                        AMOUNT: item.AMOUNT || "",
                        STNAMT: item.STNAMT || "",
                        HMC: item.HMC || "",

                        DESCRIPTION: item.DESCRIPTION || "",
                        BATCHNO: item.BATCHNO || "",

                        // Store references to stones and charges
                        _hasStones: item.stoneDetails && item.stoneDetails.length > 0,
                        _hasCharges: item.otherChargesDetails && item.otherChargesDetails.length > 0,
                    };
                }
            });

            // Save stones to localStorage
            if (allStones.length > 0) {
                localStorage.setItem(STONE_MASTER_KEY, JSON.stringify(allStones));
                console.log('Loaded stones to localStorage:', allStones);
            } else {
                localStorage.removeItem(STONE_MASTER_KEY);
            }

            // Save charges to localStorage
            if (allCharges.length > 0) {
                localStorage.setItem("MISC_CHARGE_MASTER", JSON.stringify(allCharges));
                console.log('Loaded charges to localStorage:', allCharges);
            } else {
                localStorage.removeItem("MISC_CHARGE_MASTER");
            }

            setDraftRows(newDraftRows);

            if (newDraftRows.length > 0) {
                const firstRow = newDraftRows[0];
                setEditingState({
                    rowId: firstRow.__rowId,
                    transactionType: firstRow.TRANSACTION_TYPE // Use the row's transaction type
                });
            }
            // Show appropriate message
            setTimeout(() => {
                const stoneCount = allStones.length;
                const chargeCount = allCharges.length;
                let detailsMessage = '';

                if (stoneCount > 0 || chargeCount > 0) {
                    detailsMessage = ` with ${stoneCount} stone(s) and ${chargeCount} charge(s)`;
                }

                toaster.create({
                    title: "Transaction Loaded",
                    description: `Loaded ${uniqueTransactionTypes.join(', ')} transaction with ${allTransactionItems.length} item(s)${detailsMessage}. Only weights and values can be modified.`,
                    type: "success",
                });
            }, 100);
        } else {
            console.warn("No transaction items found");
            setDraftRows([]);
            localStorage.removeItem(STONE_MASTER_KEY);
            localStorage.removeItem("MISC_CHARGE_MASTER");

            setTimeout(() => {
                toaster.create({
                    title: "Transaction Loaded",
                    description: "Transaction header loaded but no items found.",
                    type: "info",
                });
            }, 100);
        }

    }, []);




    /* ================================
       Header Form Handlers
    ================================ */
    const handleHeaderChange = (field: string, value: any) => {
        setHeaderForm(prev => ({ ...prev, [field]: value }));
    };

    const handleShowFilter = { openFilter }

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return; // Skip first render (important for refresh)
        }

        if (!accCode) {
            localStorage.removeItem(CLOSING_DETAILS_KEY);

            setClosingDetails({
                convType: "P",
                convAmt: "",
                convWt: "",
                discAmt: "",
                discWt: "",
                cashPaid: "",
                cashRcvd: "",
                bankPaid: "",
                bankRcvd: "",
                bankPaidDetails: [],
                bankRcvdDetails: [],
            });
        }

    }, [accCode]);


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

        setAccCode(customerValue ? Number(customerValue) : "");

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
          CLOSING DETAILS FORM
       ================================ */

    const handleClosingDetailsChange = useCallback((details:ClosingFormDetails) => {
        // Only update if details actually changed
        setClosingDetails(prev => {
            if (JSON.stringify(prev) === JSON.stringify(details)) {
                return prev; // No change
            }
            return details;
        });
    }, []);

    // useEffect(() => {
    //     localStorage.setItem(CLOSING_DETAILS_KEY, JSON.stringify(closingDetails));
    // }, [closingDetails]);

    // Handle closing details change from BalanceSummary component
    const getClosingDetailsPayload = (): ClosingDetails => {
        return {
            convType: closingDetails.convType,
            convAmt: closingDetails.convAmt ? parseFloat(closingDetails.convAmt) : 0,
            convWt: closingDetails.convWt ? parseFloat(closingDetails.convWt) : 0,
            discAmt: closingDetails.discAmt ? parseFloat(closingDetails.discAmt) : 0,
            discWt: closingDetails.discWt ? parseFloat(closingDetails.discWt) : 0,
            cashPaid: closingDetails.cashPaid ? parseFloat(closingDetails.cashPaid) : 0,
            cashRcvd: closingDetails.cashRcvd ? parseFloat(closingDetails.cashRcvd) : 0,
            bankPaid: closingDetails.bankPaid ? parseFloat(closingDetails.bankPaid) : 0,
            bankRcvd: closingDetails.bankRcvd ? parseFloat(closingDetails.bankRcvd) : 0,
            bankPaidDetails: closingDetails.bankPaidDetails,
            bankRcvdDetails: closingDetails.bankRcvdDetails,
        };
    };

    

    const handleLoadFromStock = (stockRow: any) => {
        // 1️⃣ Determine if this is issue-type stock
        const issueStock = isIssueStock(stockRow);

        console.log(stockRow, 'stockRow');

        // 2️⃣ Pick target type deterministically
        const targetType = issueStock
            ? TRANSACTIONTYPES.find(t => t.key === "issue")
            : TRANSACTIONTYPES.find(t => t.key === "purchase_return");

        console.log(targetType, 'targetType');

        // 2a️⃣ Check if transaction type exists
        if (!targetType) {
            toaster.create({
                title: "Transaction Type Missing",
                description: "No suitable transaction type found for this stock.",
                type: "warning",
            });
            return;
        }

        console.log(targetType, 'targetType');

        // 2b️⃣ Check if transaction type is open
        if (!selectedTransactionTypes.some(t => t.key === targetType.key)) {
            toaster.create({
                title: "Transaction Type Not Opened",
                description: `The transaction type "${targetType.label}" is currently closed.`,
                type: "error",
            });
            return;
        }

        const isIssue = issueStock;
        const pureId = stockRow.PUREID ?? stockRow.pureId;
        const itemId = stockRow.ITEMID ?? stockRow.itemId;

        // 3️⃣ Get the REMAINING/AVAILABLE weight, not the total
        let availableWeight = 0;
        let totalWeight = 0;
        let usedWeight = 0;

        if (isIssue && pureId) {
            const availability = getStockAvailability(pureId);

            if (!availability) {
                toaster.create({
                    title: "Stock Not Found",
                    description: "Stock information not available.",
                    type: "error",
                });
                return;
            }

            if (availability.remaining <= 0) {
                toaster.create({
                    title: "Stock Exhausted",
                    description: `No available balance left. Total: ${availability.total.toFixed(3)}g, Used: ${availability.used.toFixed(3)}g`,
                    type: "error",
                });
                return;
            }

            // 🔥 IMPORTANT: Use the REMAINING weight
            availableWeight = availability.remaining;
            totalWeight = availability.total;
            usedWeight = availability.used;

            toaster.create({
                title: "Stock Available",
                description: `Available: ${availableWeight.toFixed(3)}g of ${totalWeight.toFixed(3)}g`,
                type: "info",
                duration: 3000,
            });
        }

        // 4️⃣ Create a TEMPORARY row with the AVAILABLE weight
        const rowId = `temp-${targetType.value}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        // Calculate NETWT for item stock (Gross Weight - Stone Weight)
        const grswt = Number(stockRow.GRSWT || stockRow.grswt || 0);
        const stnwt = Number(stockRow.STNWT || stockRow.stnwt || 0);
        const calculatedNetwt = grswt - stnwt;

        const newRow = {
            __rowId: rowId,
            __isNew: true,
            __tempId: rowId,
            __previewSno: draftRows.filter(r => r.TRANSACTION_TYPE === targetType.value).length + 1,
            TRANSACTION_TYPE: targetType.value,
            PUREID: pureId || "",
            ITEMID: !isIssue ? String(itemId || stockRow.ITEMID || "") : "",

            // 🔥 Store stock info for validation and UI
            _totalStock: totalWeight,
            _availableStock: availableWeight,
            _usedStock: usedWeight,
            _originalWeight: 0,

            // 🔥 Use AVAILABLE weight for issue type, or original weights for item type
            WT: isIssue ? availableWeight : 0,
            AWT: isIssue ? availableWeight : 0,

            TOUCH: stockRow.TOUCH || stockRow.actualTouch || stockRow.touch || "",
            ATOUCH: stockRow.ATOUCH || stockRow.actualTouch || stockRow.touch || "",

            PURE: stockRow.PURE || stockRow.actualPure || stockRow.pure || "",
            APUREWT: stockRow.APUREWT || stockRow.actualPure || stockRow.pure || "",

            // Item stock fields (for non-issue)
            PCS: stockRow.PCS || stockRow.pcs || 0,
            GRSWT: grswt,
            STNWT: stnwt,
            NETWT: calculatedNetwt, // 🔥 Important: Set NETWT properly
            HMC: stockRow.HMC || stockRow.hmc || 0,
            PUREWT: stockRow.PUREWT || stockRow.purewt || stockRow.pureWeight || 0,
            RATE: stockRow.RATE || stockRow.rate || 0,
            MC: stockRow.MC || stockRow.mc || stockRow.MCHARGE || 0,
            WASTYPE: stockRow.WASTYPE || stockRow.wastype || "TOUCH",
            // WASPER: stockRow.WASPER || stockRow.wasper || 0,
            // WASTAGE: stockRow.WASTAGE || stockRow.wastage || 0,
            AMOUNT: stockRow.AMOUNT || stockRow.amount || 0,
            DESCRIPTION: stockRow.DESCRIPTION || stockRow.description || "",

            // Stone details (if any)
            stoneDetails: stockRow.stoneDetails || [],
            otherChargesDetails: stockRow.otherChargesDetails || [],

        };

        console.log('Created new row with NETWT:', newRow.NETWT);

        // 5️⃣ Add to draft rows
        setDraftRows(prev => [...prev, newRow]);
        setEditingState({rowId:rowId, transactionType: targetType.code});
        setIsStockDrawerOpen(false)

        if (draftRowTempId) {
            draftRowTempId.current = rowId;
        }
        
    };

    /* ================================
       Draft Table Handlers
    ================================ */
  

    const handleUpdateDraftRow = useCallback(
        (rowIndex: number, field: string, value: any) => {
            setDraftRows(prev => {
                const newRows = [...prev];
                let row = { ...newRows[rowIndex], [field]: value };

                const transactionType = TRANSACTIONTYPES.find(t => t.value === row.TRANSACTION_TYPE);
                const isIssue = transactionType ? isIssueType(transactionType) : false;

                // Manual override tracking
                // if (field === "AWT") row.__manual_AWT = true;
                // if (field === "ATOUCH") row.__manual_ATOUCH = true;
                // if (field === "APUREWT") row.__manual_APUREWT = true;
                if (field === "WT") row.__manual_AWT = false;
                if (field === "TOUCH") row.__manual_ATOUCH = false;

                // Mirror logic
                if (field === "WT" && !row.__manual_AWT) row.AWT = value;
                if (field === "TOUCH" && !row.__manual_ATOUCH) row.ATOUCH = value;

                // Stock limit check for issue types - ONLY when increasing
                if (isIssue && (field === "WT" || field === "AWT")) {
                    const availability = getStockAvailability?.(row.PUREID);
                    if (availability) {
                        const currentValue = Number(prev[rowIndex][field]) || 0;
                        const newValue = Number(value) || 0;

                        // If we're decreasing, always allow it
                        if (newValue < currentValue) {
                            console.log('Decreasing value, allowing update');
                        }
                        // If we're increasing, check if we have enough stock
                        else if (newValue > currentValue) {
                            // Calculate total used for this PUREID EXCLUDING the current row's OLD value
                            const otherUsed = prev.reduce((sum, r, idx) => {
                                if (idx === rowIndex) return sum;
                                if (String(r.PUREID) === String(row.PUREID) &&
                                    TRANSACTIONTYPES.find(t => t.value === r.TRANSACTION_TYPE && isIssueType(t))) {
                                    return sum + Number(r.WT || 0);
                                }
                                return sum;
                            }, 0);

                            // The new total will be otherUsed + newValue
                            const newTotal = otherUsed + newValue;

                            // Check if new total exceeds available stock
                            if (newTotal > availability.total) {
                                toaster.create({
                                    title: "Stock Limit Exceeded",
                                    description: `Maximum allowed: ${(availability.total - otherUsed).toFixed(3)}g increase`,
                                    type: "error",
                                });

                                // Reject the update by returning prev
                                return prev;
                            }
                        }
                    }
                }

                // Calculations for non-issue types
                if (!isIssue) {
                    if (field === "GRSWT" || field === "STNWT") {
                        const grswt = Number(row.GRSWT) || 0;
                        const stnwt = Number(row.STNWT) || 0;
                        row.NETWT = Math.max(0, grswt - stnwt).toFixed(3);

                        if (row.TOUCH) {
                            const touch = Number(row.TOUCH) || 0;
                            row.PUREWT = ((grswt - stnwt) * touch / 100).toFixed(3);
                        }
                    }
                }

                // Calculations for issue types
                if (isIssue) {
                    if (field === "WT" || field === "TOUCH") {
                        const wt = Number(row.WT) || 0;
                        const touch = Number(row.TOUCH) || 0;
                        row.PURE = ((wt * touch) / 100).toFixed(3);
                    }

                    // if (field === "AWT" || field === "ATOUCH") {
                    //     const wt = Number(row.AWT) || 0;
                    //     const touch = Number(row.ATOUCH) || 0;
                    //     if (!row.__manual_APUREWT) {
                    //         row.APUREWT = ((wt * touch) / 100).toFixed(3);
                    //     }
                    // }
                }

                row.__previewSno = rowIndex + 1;
                newRows[rowIndex] = row;
                return newRows;
            });
        },
        [getStockAvailability, toaster]
    );

   

    /* ================================
        Calculate Totals For Specific Type
     ================================ */
    const calculateTotalsForType = (transactionType: TransactionType) => {
        const typeRows = draftRows.filter(row => row.TRANSACTION_TYPE === transactionType.value);
        
console.log(typeRows,'typeRows')
        const isIssue = isIssueType(transactionType);

        const keys = isIssue
            ? ["PUREWT", "APUREWT" , "WT" ,"AWT" ] // add other issue-specific numeric fields if needed
            : ["PCS", "GRSWT", "STNWT", "NETWT", "PUREWT","HMC", "RATE", "MC", "WASTAGE", "AMOUNT" ,"STNAMT"];

        return typeRows.reduce((acc, row) => {
            keys.forEach(k => {
                acc[k] = (acc[k] || 0) + Number(row[k] || 0);
            });
            return acc;
        }, Object.fromEntries(keys.map(k => [k, 0])));
    };

    /* ================================
     Normalize Handler with Stone Details Support
  ================================ */

    const normalizeRowForApi = (row: any, isIssue: boolean ,editTransaction?:boolean) => {

        console.log(row,'row')
        const {
            __rowId,
            __isNew,
            __previewSno,
            __manual_AWT,
            __manual_ATOUCH,
            __manual_APUREWT,
            // Don't destructure these - we want to keep them
            // _stoneTempId, _stones, _stoneTotalWeight,
            // _miscTempId, _miscCharges, _miscTotalAmount,
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

            // ✅ Only add SNO when editing
            ...(editTransaction && {
                SNO: String(rest.SNO || ""),
            }),

            GRSWT: Number(rest.GRSWT || 0),
            STNWT: Number(rest.STNWT || 0),
            NETWT: Number(rest.NETWT || 0),


            WASTYPE: String(rest.WASTYPE || 'TOUCH'),

            // WASPER: Number(rest.WASPER || 0),
            // WASTAGE: Number(rest.WASTAGE || 0),
            TOUCH: Number(rest.TOUCH || 0),
            // ATOUCH: Number(rest.ATOUCH || 0),
            PUREWT: Number(rest.PUREWT || 0),

            
            HMC:Number(rest.HMC || 0),
            MC: Number(rest.MC || 0),
            STNAMT:Number(rest.STNAMT || 0),

            // Include stone details if they exist
            ...(row._stones && row._stones.length > 0 && {
                STONEDETAILS: row._stones.map((stone: any) => ({
                    stoneId: stone.stoneId,
                    subStoneId: stone.subStoneId,
                    stonePcs: stone.stonePcs,
                    stoneWeight: stone.stoneWeight,
                    stoneUnit: stone.stoneUnit,
                    stoneCalculation: stone.stoneCalculation,
                    stoneRate: stone.stoneRate,
                    stoneAmount: stone.stoneAmount,
                }))
            }),

            // Include other charges if they exist
            ...(row._miscCharges && row._miscCharges.length > 0 && {
                OTHERCHARGESDETAILS: row._miscCharges.map((charge: any) => ({
                    chargeId: Number(charge.chargeName),
                    chargeAmount: charge.amount,
                }))
            })
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
                if (!row.PUREID || row.WT == null || row.TOUCH == null || row.PUREWT == null) {
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

        // Check stock limits for issue-type rows
        const usedByPureId: Record<string, number> = {};

        draftRows.forEach((row) => {
            const transactionType = TRANSACTIONTYPES.find(t => t.value === row.TRANSACTION_TYPE);
            if (!transactionType) return;

            const isIssue = isIssueType(transactionType);

            if (isIssue && row.PUREID) {
                const key = String(row.PUREID);
                usedByPureId[key] = (usedByPureId[key] || 0) + Number(row.WT || 0);
            }
        });

        for (const pureId in usedByPureId) {
            const availability = getStockAvailability(pureId);
            if (availability && usedByPureId[pureId] > availability.total) {
                toaster.create({
                    title: "Stock Exceeded",
                    description: `Pure ID ${pureId}: Total ${usedByPureId[pureId].toFixed(3)}g exceeds available stock (${availability.total.toFixed(3)}g)`,
                    type: "error",
                });
                return false;
            }
        }

        return true;
    };


    /* ================================
   Save Transaction Handler with Stone Details
================================ */
    const handleSaveTransaction = async () => {
        setEditingState({rowId: null, transactionType: null });

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
            // Get all stones from localStorage
            const allStones = JSON.parse(localStorage.getItem(STONE_MASTER_KEY) || "[]");

            const allCharges = JSON.parse(localStorage.getItem("MISC_CHARGE_MASTER") || "[]");


            console.log(allCharges,'allCharges');

            // Create a map for quick lookup of stones by draftRowId
            const stonesByDraftRowId = allStones.reduce((acc: Record<string, StoneRow[]>, stone: StoneRow) => {
                if (!acc[stone.draftRowId]) {
                    acc[stone.draftRowId] = [];
                }
                acc[stone.draftRowId].push(stone);
                return acc;
            }, {});
            // Create a map for quick lookup of charges by draftRowId
            const chargesByDraftRowId = allCharges.reduce(
                (acc: Record<string, any[]>, charge: any) => {
                    if (!acc[charge.draftRowId]) {
                        acc[charge.draftRowId] = [];
                    }
                    acc[charge.draftRowId].push(charge);
                    return acc;
                },
                {}
            );



            /* -----------------------------------------
               STEP 1 — GROUP ROWS BY TYPE
               ----------------------------------------- */
            const transactionDetails: TransactionItems = {};

            console.log("draftRows", draftRows);

            // Process each draft row and include its stones
            draftRows.forEach(row => {
                const mappedType = TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];
                if (!mappedType) return;

                if (!transactionDetails[mappedType]) {
                    transactionDetails[mappedType] = [];
                }

                // Get stones for this row
                const rowStones = stonesByDraftRowId[row.__rowId] || [];


                // Filter out empty stones (only include stones with real data)
                const validStones = rowStones.filter((stone:any) =>
                    stone.stoneId &&
                    stone.stoneId !== "" &&
                    stone.stonePcs > 0 &&
                    stone.stoneWeight > 0 &&
                    stone.stoneRate > 0
                );

                // Get charges for this row - first check if attached directly to row, then fallback to localStorage
                const rowCharges = row._miscCharges || chargesByDraftRowId[row.__rowId] || [];


                // Filter valid charges
                const validCharges = rowCharges.filter((charge: any) =>
                    charge.id &&
                    charge.id !== "" &&
                    Number(charge.amount) > 0
                );

                // Normalize the main row data
                const normalized = normalizeRowForApi(
                    row,
                    mappedType === "issue" || mappedType === "receipt"
                );

                // Add stones to the normalized row if they exist
                const rowWithStones = {
                    ...normalized,
                    ...(validStones.length > 0 && {
                        STONEDETAILS: validStones.map((stone:any) => ({
                            stoneId: stone.stoneId,
                            subStoneId: stone.subStoneId,
                            stonePcs: stone.stonePcs,
                            stoneWeight: stone.stoneWeight,
                            stoneUnit: stone.stoneUnit,
                            stoneCalculation: stone.stoneCalculation,
                            stoneRate: stone.stoneRate,
                            stoneAmount: stone.stoneAmount,
                        }))
                    }),
                     ...(validCharges.length > 0 && {
                        OTHERCHARGESDETAILS: validCharges.map((charge: any) => ({
                            chargeId: Number(charge.chargeName),
                            chargeAmount: charge.amount,
                        }))
                    })
                };

                (transactionDetails[mappedType] as any[]).push(rowWithStones);
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
                CLOSING_DETAILS: getClosingDetailsPayload() // 👈 Just call this function!
            };

            console.log('Transaction payload with stone details:', payload);

            /* -----------------------------------------
               STEP 3 — SINGLE API CALL
               ----------------------------------------- */
            await createTransaction.mutateAsync(payload);

            /* -----------------------------------------
               STEP 4 — CLEANUP
               ----------------------------------------- */
            setDraftRows([]);
          setEditingState({rowId: null, transactionType: null})

            // Clear stones from localStorage after successful save
            localStorage.removeItem(STONE_MASTER_KEY);
            localStorage.removeItem(DRAFT_KEY);

            toaster.create({
                title: "Transaction Saved",
                description: "Transaction saved successfully with stone details.",
                type: "success",
            });

            goldStockRefetch();
            itemStockRefetch();
            openingBalanceRefetch();

        } catch (error: any) {
            console.error('Save error:', error);
            toaster.create({
                title: "Save Failed",
                description: error.message || "Failed to save transaction.",
                type: "error",
            });
            openingBalanceRefetch();
        }
    };

    const handleUpdateTransaction = async () => {
        setEditingState({ rowId: null, transactionType: null })

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

            console.group(draftRows,'draftRowsforUpdate')

            draftRows.forEach(row => {
                const mappedType = TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];
                if (!mappedType) return;

                if (!transactionDetails[mappedType]) transactionDetails[mappedType] = [];

                const isIssue = mappedType === "issue" || mappedType === "receipt";
                const normalized = normalizeRowForApi(row, isIssue , true);

          
                (transactionDetails[mappedType] as any[]).push(normalized);
            });

            console.log(transactionDetails,'transactionDetailsforUpdate')
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
                CLOSING_DETAILS: getClosingDetailsPayload() 
                
            };

            console.log("Updating Transaction:", payload);
 

            /* -----------------------------------------
               STEP 3 — API CALL
               ----------------------------------------- */
            await updateTransaction.mutateAsync({
                entryNo: Number(headerForm.ENTRYNO),
                payload,
            });

            /* -----------------------------------------
               STEP 4 — CLEANUP
               ----------------------------------------- */
            setIsEditing(false);
            setEditingSno(null);
            setSelectedTransactionId(null);
            setDraftRows([]);
            setEditingState({ rowId: null, transactionType: null })
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

            goldStockRefetch();
            itemStockRefetch();
            openingBalanceRefetch();

        } catch (error: any) {
            console.error("Update error:", error);
            toaster.create({
                title: "Update Failed",
                description: error.message || "Failed to update transaction.",
                type: "error",
            });
            openingBalanceRefetch();
        }
    };

    const handleResetDraft = () => {
        setDraftRows([]);
        setEditingState({rowId:null , transactionType:null});
        resetDraftRowTempId(); // Reset temp ID
   

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
        <Flex gap={2} >
            <Toaster />

            {/* Loading indicator for transaction data */}
            {getbySnoLoading && (
                <Box position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" zIndex={1000}>
                    <Loader isLoading={true} />
                </Box>
            )}

            {/* LEFT – 70% */}
                <Box display='flex' gap={1} w='100%' >
                    <VStack align="stretch" gap={1} w='100%'> 

                    {/* 1. Transaction Header Form */}
                 
                    <TransactionHeaderForm
                        form={headerForm}
                        onFormChange={handleHeaderChange}
                        onCustomerSelect={handleCustomerSelect}
                        customerCollection={purchaserList}
                        getLabelByValue={getLabelByValue}
                        theme={theme}
                        openingBalance={apiBalanceOpening}
                        openingData={openingBalance}
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
                            setIsStockDrawerOpen={setIsStockDrawerOpen}
                            showFilter={showFilter}
                            handleShowFilter={openFilter}
                            isEditing={isEditing}
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
                            <Box display="flex" gap={2} flexWrap="wrap">
                                {/* Map selected transaction types in order */}
                                {TRANSACTIONTYPES_ORDER
                                    .map(code => selectedTransactionTypes?.find(t => t.code === code))
                                    .filter((t): t is TransactionType => !!t)
                                    .map(transactionType => {
                                        const typeRows = draftRows.filter(
                                            row => row.TRANSACTION_TYPE === transactionType.code
                                        );
                                        const typeTotals = calculateTotalsForType(transactionType);
                                        const activeCollection = getActiveCollectionForType(transactionType);
                                        const isIssue = isIssueType(transactionType);

                                        return (
                                            <Box
                                                key={transactionType.code}
                                                borderWidth="1px"
                                                borderRadius="md"
                                                borderColor={theme.colors.greyColor}
                                                flex={'100%'}
                                                // flex={isIssue ? 1 : '100%'} // Issue types share flex, others full width
                                                // minW={isIssue ? '300px' : '100%'} // Minimum width for side by side
                                               
                                            >
                                                        <DraftTransactionTable
                                                            rows={typeRows}
                                                            editingState={editingState}
                                                            isEditing={isEditing}
                                                            onAddRow={(formData) => {
                                                                if (!formData) {
                                                                    // Just create empty row with temp ID
                                                                    const tempId = getDraftRowTempId();
                                                                    const newRow = {
                                                                        ...createEmptyRowForType(transactionType),
                                                                        __rowId: tempId,
                                                                        __isNew: true,
                                                                        __tempId: tempId,
                                                                    };
                                                                    setDraftRows(prev => [...prev, newRow]);
                                                                    // setEditingState(tempId);
                                                                    return;
                                                                }

                                                                // Check if this is an update (has __rowId and it's not a temp ID)
                                                                if (formData.__rowId && !formData.__rowId.toString().startsWith('draft-form-')) {
                                                                    // 🔥 IMPORTANT: This is an UPDATE - find and replace the existing row
                                                                    setDraftRows(prev =>
                                                                        prev.map(row =>
                                                                            row.__rowId === formData.__rowId
                                                                                ? {
                                                                                    ...row,
                                                                                    ...formData,
                                                                                    // Preserve these important fields
                                                                                    __rowId: row.__rowId,
                                                                                    TRANSACTION_TYPE: row.TRANSACTION_TYPE,
                                                                                    __previewSno: row.__previewSno
                                                                                }
                                                                                : row
                                                                        )
                                                                    );

                                                                    // Clear editing state
                                                                    setEditingState({ rowId: null, transactionType: null });

                                                                    // Show success message
                                                                    toaster.create({
                                                                        title: "Row Updated",
                                                                        description: "Row has been updated successfully",
                                                                        type: "success",
                                                                        duration: 2000,
                                                                    });
                                                                } else {
                                                                    // This is a NEW row
                                                                    const tempId = formData.__rowId || formData.__tempId;

                                                                    // Create permanent ID
                                                                    const permanentId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

                                                                    const newRow = {
                                                                        ...formData,
                                                                        __rowId: permanentId,
                                                                        __isNew: false,
                                                                        __previewSno: typeRows.length + 1,
                                                                        TRANSACTION_TYPE: transactionType.value,
                                                                    };

                                                                    setDraftRows(prev => [...prev, newRow]);

                                                                    // Handle stone transfer if there are pending stones
                                                                    if (formData._stoneTempId && formData._stones) {
                                                                        const allStones = JSON.parse(localStorage.getItem(STONE_MASTER_KEY) || "[]");

                                                                        // Remove stones with temp ID
                                                                        const filtered = allStones.filter((s: StoneRow) =>
                                                                            s.draftRowId !== formData._stoneTempId
                                                                        );

                                                                        // Update stones to use the new permanent ID
                                                                        const updatedStones = formData._stones.map((s: StoneRow) => ({
                                                                            ...s,
                                                                            draftRowId: permanentId
                                                                        }));

                                                                        // Save back to localStorage
                                                                        const finalStones = [...filtered, ...updatedStones];
                                                                        localStorage.setItem(STONE_MASTER_KEY, JSON.stringify(finalStones));

                                                                        // Update the STNWT field in the draft row
                                                                        if (formData._stoneTotalWeight) {
                                                                            newRow.STNWT = formData._stoneTotalWeight.toFixed(3);
                                                                        }
                                                                    } else {
                                                                        // Create empty stone row for non-issue types if no stones
                                                                        if (!isIssueType(transactionType)) {
                                                                            const stoneRow = createEmptyStoneRow(permanentId);
                                                                            const existingStones = JSON.parse(localStorage.getItem(STONE_MASTER_KEY) || "[]");
                                                                            existingStones.push(stoneRow);
                                                                            localStorage.setItem(STONE_MASTER_KEY, JSON.stringify(existingStones));
                                                                        }
                                                                    }

                                                                    // Clear editing state
                                                                    setEditingState({rowId:null ,transactionType:null});
                                                                }

                                                                // Clear the temp ID ref
                                                                resetDraftRowTempId();
                                                            }}
                                                            onRemoveRow={(rowId) => {
                                                                const removedRow = draftRows.find(r => r.__rowId === rowId);
                                                                setDraftRows(prev => prev.filter(row => row.__rowId !== rowId));
                                                                if (editingState.rowId === rowId) setEditingState({rowId:null ,transactionType:null} );

                                                                // Remove associated stones when draft row is deleted
                                                                if (removedRow && !isIssueType(transactionType)) {
                                                                    deleteStonesForDraftRow(rowId);
                                                                }
                                                            }}
                                                            onUpdateRow={(rowIndex, field, value) => {
                                                                // Find the actual index in the main draftRows array
                                                                const targetRow = typeRows[rowIndex];
                                                                if (!targetRow) return;

                                                                const actualIndex = draftRows.findIndex(
                                                                    r => r.__rowId === targetRow.__rowId
                                                                );

                                                                if (actualIndex !== -1) {
                                                                    handleUpdateDraftRow(actualIndex, field, value);
                                                                }
                                                            }}
                                                            onRowClick={handleRowClick} 

                                                            onCancelEdit={handleCancelEdit}
                                                            itemsCollection={activeCollection}
                                                            // itemsFilter={activeFilter}
                                                            totals={typeTotals}
                                                            transactionTitle={transactionType.label}
                                                            transactionType={transactionType.code}
                                                            theme={theme}
                                                            isIssue={isIssue}
                                                            getAvailableWeight={getAvailableWeight}
                                                            onClear={() => handleClearRowsForType(transactionType)}
                                                            getStockAvailability={getStockAvailability}
                                                            otherChargesList={otherCharges}
                                                            otherChargesData={otherChargesData?.data}
                                                        />
                                                    </Box>
                                                );
                                            })}
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
                                <Box w={'100%'} bg={theme.colors.formColor}  rounded='lg'>
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
    
                {/* RIGHT SIDE - Summary Panel */}
                <Box position="sticky">


                    <BalanceSummary 

                        theme={theme}
                        openBalance={openingBalances}
                        closingDetails={closingDetails}
                        onClosingDetailsChange={handleClosingDetailsChange}
                        storageKey={CLOSING_DETAILS_KEY}
                        editingState={editingState}
                        accCode={Number(accCode)}
                        rate={Number(headerForm.RATEGM)}
                        // transactionType={transactionType}

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
                getStockAvailability={getStockAvailability}
            />
        </Flex>
     
        </>
        
    );
}