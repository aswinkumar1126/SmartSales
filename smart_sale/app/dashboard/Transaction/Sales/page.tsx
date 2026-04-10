"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
    Text,
    Box,
    Flex,
    VStack,
} from "@chakra-ui/react";
import lodash from "lodash";

import { useTheme } from "@/context/theme/themeContext";
import { toaster } from "@/components/ui/toaster";
import { useListCollection, useFilter } from "@chakra-ui/react";
import { useOpeningBalance } from "@/hooks/apiHooks/balance/useOpeningBalance";

// Components
import TransactionHeaderForm from "./TransactionHeaderForm/TransactionHeaderForm";
import TransactionTypeSelector from "./TransactionTypeSelector/TransactionTypeSelector";
import DraftTransactionTable from "./DraftTransactionTable/DraftTransactionTable";
import StockDrawer from "./DrawerTable/StockTable";
import { useAllMetals } from "@/hooks/apiHooks/metal/useMetals";
import Loader from "@/component/loader/Loader";
import BalanceSummary from "./Balance/BalanceSummary";
import { TransactionListing } from "./TransactionList/TransactionIdsListing";
import { SalesSearch } from "./Search/SalesSearch";

//Key Management
import { useGlobalKey } from "@/components/key/useGlobalKey";

// Hooks

import { useTransactions } from "@/hooks/apiHooks/transaction/useTransactions";
import { useAllAccountHead } from "@/hooks/apiHooks/accountHead/useAccountHead";
import { useStoneItems } from "@/hooks/apiHooks/item/useItems";
import { useCreateTransactions, useUpdateTransaction, useTransactionByTransId } from "@/hooks/apiHooks/transaction/useTransactions";
import { usePureGoldData, usePureGoldNames } from "@/hooks/apiHooks/pureGoldMast/usePureGoldMastData";
import { useActiveOtherCharges } from "@/hooks/apiHooks/otherCharges/useOtherCharges";
import { useRates } from "@/hooks/apiHooks/rate/useRate";
import { useOrnamentData } from "@/hooks/apiHooks/ornament/useOrnamentData";
import { useAllBankAccounts } from "@/hooks/apiHooks/bankAccount/useBankAccount";
import { useBillDetails } from "@/hooks/apiHooks/transaction/useTransactions";

/*-------------------  *VALIDATION HOOKS*  --------------------------*/

import { useIsTaggedItem } from "@/utils/TransactionValidation/TagNumberValidation";
import { validateTransactions } from "@/utils/TransactionValidation/ValidateTransaction";
import { buildTransactionPayload } from "@/utils/TransactionValidation/buildTransactionPayload";
import { normalizeRowForApi } from "@/utils/TransactionValidation/normalizeRowForApi";


/*--------------------- *CALCULATION HOOKS* ---------------------------------*/

import { useStockAvailability } from "./SalesComponent/UseStokeAvailability";
import { useConversionSync } from "@/hooks/Transaction/sales/useConversionSync";
import { useClosingCalculation } from "@/hooks/Transaction/sales/useClosingBalanceCalculation";
import { useSalesOpeningBalances } from "@/hooks/Transaction/sales/useSalesOpeningCal";



import { useSyncSalesHeader } from "@/hooks/Transaction/sales/useSalesHeaderSync";
import { useLoadSalesTransaction } from "@/hooks/Transaction/sales/useSalesTransactionLoad";

import { useDraftRowOperations } from "@/hooks/Transaction/sales/useDraftRowOperations";
import { useLoadSaleTag } from "@/hooks/Transaction/sales/useLoadSaleTag";

/*-------------------  *STORAGE*  --------------------------*/

import { useSessionStorage } from "@/hooks/apiHooks/storage/useSessionStorage";
import { useSalesBalanceSummary } from "@/store/sales/useSalesBalanceSummaryStore";
import { useSalesHeader } from "@/store/sales/useSalesHeader";
import { useSaleTransactionStore } from "@/store/sales/useSaleTransactionStore";


// Types & Constants
import { ClosingDetails, WeightInfo, purchasereturnPayload, purchasePayload } from "@/types/transcation/Transaction";
import { SALETRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import { SaleTransactionType } from "@/types/transcation/SaleTransaction";
import { SaleTransactionKey, SaleTransactionItems, SALE_TRANSACTION_KEY_MAP, SALESTRANSACTIONITEMS, CreateSaleTransaction } from "@/types/transcation/SaleTransaction";
import { SalesClosingFormDetails } from "@/types/balanceSummary/BalanceSummary";

//Utilities
import { formatToFixed } from '@/utils/format/numberFormat';

import { getTagDetails } from "@/service/TagedService";



//Icons
type StoneRow = {
    id: string;
    draftRowId: string;
    stoneId: string;
    subStoneId: string;
    stonePcs: string;
    stoneWeight: string;
    stoneUnit: "g" | "c";
    stoneCalculation: "w" | "p";
    stoneRate: string;
    stoneAmount: string;
};


interface SalesFilter {
    fromDate: string;
    toDate: string;
    weight: string;
    pureId: string;
    itemId: string;
    accode: string;
}


export type billDetailsParams = {
    ACCODE: number | undefined;
    ENTRYNO?: string;
    BILLDATE?: string;
    TAGNO?: string;
}


/* ================================
   Main Component
================================ */

export default function SalesPage() {
    const today = new Date().toISOString().split("T")[0];

    const initialDraftRowsRef = useRef<any[]>([]);
    const initialClosingRef = useRef<ClosingDetails>(null);


    /* ================================
       GLOBAL  HEADER MANAGEMENT
  ================================ */

    const {
        headerForm,
        accCode,
        setHeaderField,
        setHeaderForm,
        setCustomer,
        setAccCode,
        startEdit,
        stopEdit,
        resetHeader,
        isEditing
    } = useSalesHeader();

    
        /* ================================
       Session Storage Keys (All in one place)
    ================================ */

    const DRAFT_KEY = "sale_transaction_draft";
    const TYPE_KEY = "sale_transaction_type";
    const DATE_RANGE_KEY = "sale_transaction_date_range";

  
    const EDITING_SNO_KEY = "sale_editing_sno";
    const SALE_STONE_MASTER_KEY = "sales_stone_entries";


    const TRANSACTION_LIST_SEARCH = "sale_transaction_list_search";
    const ISTAG = 'sale_is_tag';



    const TRANSACTIONTYPES_ORDER = ["SA", "SR", "IS", "RE"];


    const openFilter = () => setIsFilterOpen(true);

    const draftRowTempId = useRef<string | null>(null);



    /*------------------- LOCAL STATE NON-PERSISTENT -------------------------------*/

   
    const [loading, setLoading] = useState<boolean>(true);
    const [saleCustomerList, setSaleCustomerList] = useState<{ label: string, value: string }[]>([]);

    const [isStockDrawerOpen, setIsStockDrawerOpen] = useState(false);
    const [showStock, setShowStock] = useState<string>("PURE");
    const [pureGoldList, setPureGoldList] = useState<{ label: string, value: string }[]>([]);
    const [metalList, setMetalList] = useState<{ label: string, value: string }[]>([]);
    const [otherCharges, setOtherCharges] = useState<{ label: string, value: string }[]>([]);
    const [metalId, setMetalId] = useState<string | undefined>();
    const [selectedName, setSelectedName] = useState<string | undefined>();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedSalesItems, setSelectedSalesItems] = useState<(string|number)[]>()
    const [apiBalanceOpening, setApiBalanceOpening] = useState({ openPure: 0, openCash: 0 });

    const[ selectedTransactionId ,setSelectedTransactionId] = useState<string | null>(null)

    const [baseOpening, setBaseOpening] = useSessionStorage<{openPure:number ,openCash:number}>('sales-openingBalance' ,{
        openPure: 0,
        openCash: 0,
    });

    const [singleSearch, setSingleSearch] = useSessionStorage<string>(TRANSACTION_LIST_SEARCH, '');
    const [deselectFlag, setDeselectFlag] = useState(false);

    const [saleFilter, setSaleFilter] = useState<SalesFilter>({
        fromDate: today,
        toDate: today,
        weight: '',
        pureId: '',
        itemId: '',
        accode: ''
    });

    const filter = ''

    const initialBillDetailsFormData = {
        ACCODE: undefined,
        BILLDATE: today,
        ENTRYNO: '',
        TAGNO: '',
    };


    const [billParams, setBillParams] = useState<billDetailsParams>(initialBillDetailsFormData);



    const [showBillModal, setShowBillModal] = useState<boolean>(false);

    const handleBillShow = () => {
        setShowBillModal(prev => !prev);
    };

 
    /*-------------------PERSISTENT STATE-------------------------------*/


    const [editingSno, setEditingSno] = useSessionStorage<string | null>(EDITING_SNO_KEY, null);


    const [isTag, setIsTag] = useSessionStorage<boolean>(ISTAG, true);


    /* ================================
       State Management
    ================================ */

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);



    const { theme } = useTheme();
    const { data: itemsData } = useStoneItems();


    const filters = {
        accountType: "CR"
    }


    const { data: allCustomer } = useAllAccountHead(filter, filters);

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



    const { data: pureStockList = [], refetch: goldStockRefetch } = usePureGoldData(filter, cleanedFilters);
    const { data: itemsStock, refetch: itemStockRefetch } = useOrnamentData(filter);



    const { data: allPureGoldNames } = usePureGoldNames();

    const { data: transactionsById, isLoading: getbySnoLoading } = useTransactionByTransId(selectedTransactionId, "sales");

    /*------------------------------- BILL DETAILS API ----------------------------*/

    const { data: billDetails, isLoading: billDetailsLoading, isError: billDetailsError } = useBillDetails({
        ACCODE: Number(billParams.ACCODE),
        ENTRYNO: Number(billParams.ENTRYNO),
        BILLDATE: billParams.BILLDATE,
        TAGNO: billParams.TAGNO
    });

    const billDetailsList = useMemo(() => {
        const billList = billDetails;
        return Array.isArray(billList) ? billList : []
    }, [billDetails]);


    const { data: otherChargesData } = useActiveOtherCharges();

    const { data: bankAccounts } = useAllBankAccounts();


    const allBankAccounts = useMemo(() => {
        if (!bankAccounts) return [];
        if (Array.isArray(bankAccounts.data)) {
            return bankAccounts.data.map((b) => {
                return {
                    label: b.BANKNAME, // fix typo
                    value: b.ENTRYNO,
                };
            });
        }
        return [];
    }, [bankAccounts]);


    const updateTransaction = useUpdateTransaction();
    const { data: metalsData } = useAllMetals();

    const { data: openingBalance, refetch: openingBalanceRefetch } = useOpeningBalance(Number(accCode));


    // Note: This hook might need to be updated to handle multiple transaction types
    const { data: transactionList, isLoading, refetch: refetchTransactionList } = useTransactions({
        TRANTYPE: "sales",
        trantype: null,
        accode: saleFilter.accode ? Number(saleFilter.accode) : null,
        startdate: saleFilter.fromDate || null,
        enddate: saleFilter.toDate || null,
        itemid: saleFilter.itemId ? Number(saleFilter.itemId) : null,
    });

    const { data: metalRates, isLoading: metalRatesLoading, isError: metalRatesError } = useRates(); 

    const { data: transactionHeaderDetail, isLoading: transactionHeaderLoading, refetch: refetchTransactionHeaderDetail } = useTransactions({
        TRANTYPE: "sales",
        accode: headerForm.CUSTOMER ? Number(headerForm.CUSTOMER) : null
    });


   
    useSyncSalesHeader(transactionHeaderDetail , metalRates );


    const transactionIdsList = useMemo(() => {
        const list = transactionList?.snoList;
        if (!list || !Array.isArray(list)) return [];

        return list.map((item: any) => ({
            label: item,
            value: item,
        }));
    }, [transactionList]);

 
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
    const itemsStockList = itemsStock?.data || [];


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
        setSaleCustomerList(purchaser);

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
            itemsData?.map((item: any) => ({
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


    const isTagedItem = useIsTaggedItem(mappedItems);


    // Function to get or create draft row temp ID
    const getDraftRowTempId = () => {
        if (!draftRowTempId.current) {
            draftRowTempId.current = `draft-form-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        }
        return draftRowTempId.current;
    };

    // Reset draft row temp ID
    const resetDraftRowTempId = () => {
        draftRowTempId.current = null;
    };

   

    /* ================================
        Search Management
     ================================ */

    // This only gets called when user clicks "Apply Filters"
    const handleSearchFilter = useCallback((filters: SalesFilter) => {
        setSaleFilter({
            fromDate: filters.fromDate,
            toDate: filters.toDate,
            weight: filters.weight,
            pureId: filters.pureId,
            itemId: filters.itemId,
            accode: filters.accode
        });
    }, []);

    const handleSearchFilterClear = useCallback(() => {
        setSaleFilter({
            fromDate: today,
            toDate: today,
            weight: '',
            pureId: '',
            itemId: '',
            accode: ''
        });
    }, [today]);


    // KEY TO ACCESS

    useGlobalKey("F1", () => openFilter(), "openFilter");

    const handleBillParamChange = useCallback((field: any, value: any) => {
        setBillParams(prev => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const {
        selectedTransactionTypes,
        draftRows,
        editingState,
        setEditingState,
        updateDraftRow,
        clearDraftRowsByType,
        resetStore,
        setSelectedTransactionTypes
    } = useSaleTransactionStore();

    const { handleAddRow, handleEditRow , handleRemoveRow, handleUpdateRow } = useDraftRowOperations();



    // Get rows for specific transaction type
    const getTypeRows = (transactionType: string) => {
        return draftRows.filter(row => row.TRANSACTION_TYPE === transactionType);
    };

    // Handle clear rows for type
    const handleClearRowsForType = (transactionType: any) => {
        const confirmClear = window.confirm(`Clear all rows for ${transactionType.label}?`);
        if (confirmClear) {
            clearDraftRowsByType(transactionType.value);
        }
    };

    const handleSelectedItems = useCallback((selectedItems: (any)[]) => {
        setSelectedSalesItems(selectedItems);
    }, []);

    const handleLoadSalesItems = useCallback(
        (items: any[]) => {
            if (!items || !Array.isArray(items) || items.length === 0) return;

            const newRows: any[] = [];

            console.log(items, 'itemsitemsitems')

            items.forEach((item) => {
                // ✅ Check if SNO already exists in draftRows
                const exists = draftRows.some((row) => row.SNO === item.SNO);
                if (exists) {
                    toaster.create({
                        title: "Duplicate Item",
                        description: `Item with SNO ${item.SNO} already exists in draft`,
                        type: "warning",
                        duration: 1500,
                    });
                    return; // Skip this item
                }

                // ✅ Generate unique rowId
                const rowId = `sales-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

                // Extract stone details if present
                const stonesWithId: any[] = (item.stoneDetails || []).map((stone: any, index: number) => ({
                    id: `stone-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
                    draftRowId: rowId,
                    stoneId: String(stone.STNITEMID || stone.STNSUBITEMID || stone.stoneId || ""),
                    subStoneId: String(stone.STNSUBITEMID || stone.subStoneId || ""),
                    stonePcs: Number(stone.STNPCS || stone.PCS || 1),
                    stoneWeight: Number(stone.STNWT || 0),
                    stoneUnit: stone.STONEUNIT || "g",
                    stoneCalculation: stone.CALCMODE || "w",
                    stoneRate: Number(stone.STNRATE || 0),
                    stoneAmount: Number(stone.STNAMT || 0),
                }));

                // Save stones to localStorage
                const existingStones = JSON.parse(localStorage.getItem(SALE_STONE_MASTER_KEY) || "[]");
                localStorage.setItem(SALE_STONE_MASTER_KEY, JSON.stringify([...existingStones, ...stonesWithId]));

                // Recalculate STNWT from stones
                const totalStoneWeight = stonesWithId.reduce((sum, s) => {
                    const weight = s.stoneUnit === "c" ? s.stoneWeight / 5 : s.stoneWeight;
                    return sum + weight;
                }, 0);

                // Build new row
                newRows.push({
                    __rowId: rowId,
                    __isNew: true,
                    __isEditing: false,
                    __previewSno: draftRows.length + newRows.length + 1,

                    TRANSACTION_TYPE: "SR",
                    _type: "SR",

                    ITEMID: String(item.ITEMID || ""),
                    TAGNO: String(item.TAGNO || ""),
                    PCS: Number(item.PCS || 1),
                    GRSWT: Number(item.GRSWT || 0),
                    STNWT: totalStoneWeight,
                    NETWT: Number(item.NETWT || 0),
                    WASTYPE: item.WASTYPE,
                    TOUCH: Number(item.TOUCH || 0),
                    MC: Number(item.MC || 0),
                    SNO: item.SNO,
                    DESCRIPTION: item.DESCRIPTION || "",

                    _hasStones: stonesWithId.length > 0,
                    _hasCharges: !!item.OtherChargesDetails,
                });
            });

            if (newRows.length > 0) {
                toaster.create({
                    title: "Items Loaded",
                    description: `${newRows.length} item(s) loaded into draft`,
                    type: "success",
                    duration: 1000,
                });
            }
        },
        [draftRows]
    );

   

    // Main calculation function

    /*--------------------------------STOCK CHECKING------------------------ */

    const {
        transactionKey,
        isIssue,
        isSales,
        isSalesReturn,
        isReceipt,
        getStockAvailability,
        getAvailableWeight,
        getAvailablePieces,
        validateQuantity,
        getStockForTransaction,
    } = useStockAvailability({
        transactionCode: (selectedTransactionTypes[0] ?? SALETRANSACTIONTYPES[0]).code,
        pureStockList,
        itemsStockList,
        draftRows,
        SALETRANSACTIONTYPES
    });


   

    const setOpeningBalance= (data: any, isEdit: boolean) => {
        if (isEdit) {
            setBaseOpening({
                openCash: data?.BALANCE?.openingCash ?? 0,
                openPure: data?.BALANCE?.openingPure ?? 0,
            });
        } else {
            setBaseOpening({
                openCash: apiBalanceOpening?.openCash ?? 0,
                openPure: apiBalanceOpening?.openPure ?? 0,
            });
        }
    };
    console.log(isEditing,'isEditing')

    useEffect(() => {
        if (isEditing) return; 

        if (apiBalanceOpening) {
            setOpeningBalance(apiBalanceOpening, false);
        }
    }, [apiBalanceOpening, isEditing]);

    // Single useEffect to calculate balances when either draftRows or API balances change
    const openingBalances = useSalesOpeningBalances(
        draftRows,
        baseOpening.openPure,
        baseOpening.openCash
    );

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
    const isIssueType = (transactionType: SaleTransactionType) => {
        console.log(transactionType, 'transactionTypetransactionType')
        return transactionType.code.toUpperCase() === "IS" || transactionType.code.toUpperCase() === "RE";
    };

    // Determines if a stock row should be treated as an Issue-type (ISSUE / RECEIPT)
    const isIssueStock = (stockRow: any): boolean => {
        return !!stockRow.pureId; // if pureId exists, it's issue stock
    };

    const getActiveCollectionForType = (transactionType: SaleTransactionType) => {
        return isIssueType(transactionType) ? pureNameCollection : itemsCollection;
    };

    const getActiveFilterForType = (transactionType: SaleTransactionType) => {
        return isIssueType(transactionType) ? purenameFilter : itemsFilter;
    };

    /* ================================
         ADD NEW ROW IN DRAFT TABLE FOR SPECIFIC TYPE
      ================================ */

    const createEmptyRowForType = (transactionType: SaleTransactionType) => {
        const base = {
            // Make sure this ID is unique and consistent
            __rowId: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            __isNew: true,
            __previewSno: draftRows.filter(r => r.TRANSACTION_TYPE === transactionType.code).length + 1,
            TRANSACTION_TYPE: transactionType.code,
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
            HMC: "",
            RATE: "",
            MCHARGE: "",
            WASTAGE: "",
            DESCRIPTION: "",
            TAGNO: "",
        };
    };





    // Delete stones for a specific draft row
    const deleteStonesForDraftRow = (draftRowId: string) => {
        const all = JSON.parse(localStorage.getItem(SALE_STONE_MASTER_KEY) || "[]");
        const filtered = all.filter((s: StoneRow) => s.draftRowId !== draftRowId);
        localStorage.setItem(SALE_STONE_MASTER_KEY, JSON.stringify(filtered));
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
       Load Transaction Data When Selected
    ================================ */

    // This useEffect loads transaction data when transactionsById changes
    useEffect(() => {
        if (transactionsById && selectedTransactionId) {
            handleEditTransaction(transactionsById, selectedTransactionId);
        }
    }, [transactionsById, selectedTransactionId]);



    //For Saving the Purchase with Ref
    useEffect(() => {
        initialDraftRowsRef.current = JSON.parse(JSON.stringify(draftRows));
    }, []);


    useEffect(() => {
        initialClosingRef.current = JSON.parse(JSON.stringify(getClosingDetailsPayload()));
    }, []);


    const handleRowClick = (row: any, clickedTransactionType: string) => {
        // console.log('Row clicked:', row, 'Type:', clickedTransactionType);
        setEditingState({
            rowId: row.__rowId,
            transactionType: clickedTransactionType
        });
        // setEditingRowId(row.__rowId);

    };

    const handleCancelEdit = useCallback(() => {
        // console.log('Cancelling edit, editingState:', editingState);

        // Remove temp row ONLY for the current transaction type
       
        // Clear editing state
        setEditingState({ rowId: null, transactionType: null });
        resetDraftRowTempId();
        setSingleSearch("");
        setDeselectFlag(true);
        setTimeout(() => setDeselectFlag(false), 50);
    }, [editingState]);



    const { loadTransaction } =  useLoadSalesTransaction();

    const handleEditTransaction = useCallback((data: any, sno: string) => {

        console.log(data,'datadata')
 
        setOpeningBalance(data , true);

        const result = loadTransaction(data, sno);
        console.log(result, 'resultresult')

        if (!result) return;

    }, []);


    /* ================================
       Transaction Type Handlers
    ================================ */
    const handleTransactionTypesSelect = (types: SaleTransactionType[]) => {


        if (!headerForm.CUSTOMER) {
            toaster.create({
                title: "Customer Required",
                description: "Select customer first.",
                type: "warning"
            });
            return;
        }


        setSelectedTransactionId(null);
    };


    /* ================================
          CLOSING DETAILS FORM
       ================================ */
    const {closingDetails ,setClosingDetails , resetBalance } = useSalesBalanceSummary();

    const closingDetailsRef = useRef(closingDetails);
    useConversionSync(Number(headerForm.RATEGM || 0));
    const {closingPure ,closingCash} = useClosingCalculation(closingDetails ,openingBalances , Number(headerForm.RATEGM || 0) );


    // ✅ Always reads latest — even before re-render
    const getClosingDetailsPayload = useCallback((): ClosingDetails => {
        const d = closingDetailsRef.current;
        return {
            convType: d.convType,
            convAmt: d.convAmt ? parseFloat(d.convAmt) : 0,
            convWt: d.convWt ? parseFloat(d.convWt) : 0,
            discAmt: d.discAmt ? parseFloat(d.discAmt) : 0,
            discWt: d.discWt ? parseFloat(d.discWt) : 0,
            cashPaid: d.cashPaid ? parseFloat(d.cashPaid) : 0,
            cashRcvd: d.cashRcvd ? parseFloat(d.cashRcvd) : 0,
            bankPaid: d.bankPaid ? parseFloat(d.bankPaid) : 0,
            bankRcvd: d.bankRcvd ? parseFloat(d.bankRcvd) : 0,
            bankPaidDetails: d.bankPaidDetails,
            bankRcvdDetails: d.bankRcvdDetails,
        };
    }, []);


    const handleLoadFromStock = (stockRow: any) => {
        // 1️⃣ Determine if this is issue-type stock
        const issueStock = isIssueStock(stockRow);



        // 2️⃣ Pick target type deterministically
        const targetType = issueStock
            ? SALETRANSACTIONTYPES.find(t => t.key === "issue")
            : SALETRANSACTIONTYPES.find(t => t.key === "sales_return");

        console.log(targetType, 'targetTypetargetType')

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
        if (!selectedTransactionTypes.some(t => t.value === targetType.value)) {
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

            console.log(availability, 'availabilityavailability')

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

        console.log('Created new row with NETWT:', newRow.NETWT, targetType);

        // 5️⃣ Add to draft rows
   
        setEditingState({ rowId: rowId, transactionType: targetType.key });
        setIsStockDrawerOpen(false)

        if (draftRowTempId) {
            draftRowTempId.current = rowId;
        }

    };

    /* ================================
       Draft Table Handlers
    ================================ */

 
    // Handle update draft row (for inline edits)
    const handleUpdateDraftRow = (rowIndex: number, field: string, value: any) => {
        const typeRows = draftRows.filter(r => r.TRANSACTION_TYPE === selectedTransactionTypes[0]?.value);
        const targetRow = typeRows[rowIndex];
        if (!targetRow) return;

        updateDraftRow(targetRow.__rowId, { [field]: value });
    };

    /* ================================
        Calculate Totals For Specific Type
     ================================ */
    const calculateTotalsForType = (transactionType: SaleTransactionType) => {
        const typeRows = draftRows.filter(row => row.TRANSACTION_TYPE === transactionType.value);


        const isIssue = isIssueType(transactionType);

        const keys = isIssue
            ? ["PUREWT", "APUREWT", "WT", "AWT"] // add other issue-specific numeric fields if needed
            : ["PCS", "GRSWT", "STNWT", "NETWT", "PUREWT", "HMC", "RATE", "MC", "WASTAGE", "AMOUNT", "STNAMT"];

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

    // const normalizeRowForApi = (
    //     row: any,
    //     tranType: SaleTransactionKey,
    //     editTransaction?: boolean
    // ): any => {

    //     const {
    //         __rowId,
    //         __isNew,
    //         __previewSno,
    //         _stones,
    //         _miscCharges,
    //         ...rest
    //     } = row;

    //     // ---------------- ISSUE / RECEIPT ----------------
    //     if (tranType === "issue" || tranType === "receipt") {
    //         return {
    //             PUREID: rest.PUREID ? Number(rest.PUREID) : undefined,
    //             WT: Number(rest.WT || 0),
    //             TOUCH: Number(rest.TOUCH || 0),
    //             PUREWT: Number(rest.PUREWT || 0),
    //             AWT: Number(rest.AWT || 0),
    //             ATOUCH: Number(rest.ATOUCH || 0),
    //             APUREWT: Number(rest.APUREWT || 0),
    //         };
    //     }

    //     // ---------------- SALES ----------------
    //     if (tranType === "sales") {
    //         const itemId = rest.ITEMID ? Number(rest.ITEMID) : null;
    //         const tagged = isTagedItem(itemId);

    //         const payload: SALESTRANSACTIONITEMS = {
    //             ITEMID: itemId,
    //             PCS: Number(rest.PCS || 0),
    //             GRSWT: Number(rest.GRSWT || 0),
    //             STNWT: Number(rest.STNWT || 0),
    //             NETWT: Number(rest.NETWT || 0),
    //             WASTYPE: String(rest.WASTYPE || "TOUCH"),
    //             TOUCH: Number(rest.TOUCH || 0),
    //             PUREWT: Number(rest.PUREWT || 0),
    //             HMC: Number(rest.HMC || 0),
    //             STNAMT: Number(rest.STNAMT || 0),
    //             MC: Number(rest.MC || 0),

    //             // ✅ Only include TAGNO if tagged item
    //             ...(tagged && { TAGNO: rest.TAGNO || "" }),

    //             ...(editTransaction && { SNO: String(rest.SNO || "") }),
    //             ...(rest.DESCRIPTION && { DESCRIPTION: rest.DESCRIPTION }),
    //         };

    //         return payload;
    //     }

    //     // ---------------- SALES RETURN ----------------
    //     if (tranType === "sales_return") {
    //         const payload: SALESTRANSACTIONITEMS = {
    //             ITEMID: rest.ITEMID ? Number(rest.ITEMID) : null,
    //             PCS: Number(rest.PCS || 0),
    //             GRSWT: Number(rest.GRSWT || 0),
    //             STNWT: Number(rest.STNWT || 0),
    //             NETWT: Number(rest.NETWT || 0),
    //             WASTYPE: String(rest.WASTYPE || "TOUCH"),
    //             TOUCH: Number(rest.TOUCH || 0),
    //             PUREWT: Number(rest.PUREWT || 0),
    //             HMC: Number(rest.HMC || 0),
    //             STNAMT: Number(rest.STNAMT || 0),
    //             MC: Number(rest.MC || 0),

    //             // ✅ Flexible return logic
    //             ...(rest.TAGNO && { TAGNO: rest.TAGNO }),
    //             ...(rest.BILLNO && { BILLNO: rest.BILLNO }),

    //             ...(editTransaction && { SNO: String(rest.SNO || "") }),
    //             ...(rest.DESCRIPTION && { DESCRIPTION: rest.DESCRIPTION }),
    //         };

    //         return payload;
    //     }

    //     return null;
    // };


    const isDraftRowsChanged = () => {
        return !lodash.isEqual(initialDraftRowsRef.current || [], draftRows || []);
    };

    const isClosingChanged = () => {
        return !lodash.isEqual(
            initialClosingRef.current || {},
            getClosingDetailsPayload() || {}
        );
    };


    /* ================================
         Validation Handler
      ================================ */
    const validateDraftRows = () => {

        const draftChanged = isDraftRowsChanged();
        const closingChanged = isClosingChanged();

        if (!draftChanged && !closingChanged) {
            toaster.create({
                title: "No Changes",
                description: "No changes detected to save.",
                type: "warning",
            });
            return false;
        }

        // If draft rows changed → run row validations
        if (draftChanged) {

            if (draftRows.length === 0) {
                toaster.create({
                    title: "No Items",
                    description: "Please add at least one item.",
                    type: "error",
                });
                return false;
            }

            for (let i = 0; i < draftRows.length; i++) {
                const row = draftRows[i];
                const transactionType = SALETRANSACTIONTYPES.find(t => t.code === row.TRANSACTION_TYPE);


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
                            description: `Row ${i + 1}: Please fill PUREID, Weight, Touch, and Pure.`,
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

                    const isTagedItemId = isTagedItem(Number(row.ITEMID));



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

            // Stock validation
            const usedByPureId: Record<string, number> = {};

            draftRows.forEach((row) => {
                const transactionType = SALETRANSACTIONTYPES.find(t => t.value === row.TRANSACTION_TYPE);
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
        }

        return true;
    };

    /* ================================
    Save Transaction Handler with Stone Details
    ================================ */


    const handleSaveTransaction = () => {
        setEditingState({ rowId: null, transactionType: null });

        if (!headerForm.CUSTOMER) {
            toaster.create({
                title: "Customer Required",
                description: "Please select a customer.",
                type: "error",
            });
            return;
        }

        // if (!validateDraftRows()) return;


        const result = validateTransactions({
            draftRows,
            isDraftRowsChanged,
            isClosingChanged,
            SALE_TRANSACTION_KEY_MAP,
            SALETRANSACTIONTYPES,
            getStockAvailability,
            isIssueType,
            isTagedItem,
        });

        if (!result.valid) {
            toaster.create({
                title: "Validation Error",
                description: result.error,
                type: "error",
            });
            return;
        }

        // Get stones
        const allStones = JSON.parse(localStorage.getItem(SALE_STONE_MASTER_KEY) || "[]");
        const allCharges = JSON.parse(localStorage.getItem("MISC_CHARGE_MASTER") || "[]");

        const stonesByDraftRowId = allStones.reduce((acc: Record<string, StoneRow[]>, stone: StoneRow) => {
            if (!acc[stone.draftRowId]) acc[stone.draftRowId] = [];
            acc[stone.draftRowId].push(stone);
            return acc;
        }, {});

        const chargesByDraftRowId = allCharges.reduce((acc: Record<string, any[]>, charge: any) => {
            if (!acc[charge.draftRowId]) acc[charge.draftRowId] = [];
            acc[charge.draftRowId].push(charge);
            return acc;
        }, {});

      
        const transactionDetails: SaleTransactionItems = buildTransactionPayload({
            draftRows,
            stonesByDraftRowId,
            chargesByDraftRowId,
            SALE_TRANSACTION_KEY_MAP,
            normalizeRowForApi,
            isTagedItem,
        });

        const payload: CreateSaleTransaction = {
            TRANSACTION_HEADER: {
                ACCODE: Number(headerForm.CUSTOMER),
                TRANDATE: headerForm.DATE,
                BILLNO: headerForm.BILLNO ? Number(headerForm.BILLNO) : undefined,
                RATE: headerForm.RATEGM ? Number(headerForm.RATEGM) : undefined,
            },
            TRANSACTION_DETAILS: transactionDetails,
            CLOSING_DETAILS: getClosingDetailsPayload()
        };

        console.log(payload, 'createTransactionPayload')

        createTransaction.mutate({ payload: payload, TRANTYPE: "sales" }, {
            onSuccess: () => {

          
                setEditingState({ rowId: null, transactionType: null });


                toaster.create({
                    title: "Transaction Saved",
                    description: "Transaction saved successfully",
                    type: "success",
                });

                goldStockRefetch();
                itemStockRefetch();
                openingBalanceRefetch();
                setSelectedTransactionId(null);
         
                setClosingDetails({
                    convType: "",
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
              

            },

            onError: (error: any) => {


                toaster.create({
                    title: "Save Failed",
                    description: error?.message || "Failed to save transaction.",
                    type: "error",
                });

                openingBalanceRefetch();
            }
        });
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
            const transactionDetails: SaleTransactionItems = {};

            console.group(draftRows, 'draftRowsforUpdate')

            draftRows.forEach(row => {
                const mappedType = SALE_TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];
                console.log(mappedType, row.TRANSACTION_TYPE, 'mappedType')
                if (!mappedType) return;

                if (!transactionDetails[mappedType]) transactionDetails[mappedType] = [];


                const normalized = normalizeRowForApi(row, mappedType, isTagedItem, true);


                (transactionDetails[mappedType] as any[]).push(normalized);
            });

            console.log(transactionDetails, 'transactionDetailsforUpdate')
            /* -----------------------------------------
               STEP 2 — BUILD HEADER
               ----------------------------------------- */
            const payload: CreateSaleTransaction = {
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
                TRANTYPE: "sales"
            });

            /* -----------------------------------------
               STEP 4 — CLEANUP
               ----------------------------------------- */
      
            setEditingSno(null);
            setSelectedTransactionId(null);
       

            setHeaderForm({
                ENTRYNO: "",
                CUSTOMER: "",
                CUSTOMER_NAME: "",
                BILLNO: "",
                DATE: new Date().toISOString().split("T")[0],
                RATEGM: metalRates ? formatToFixed(metalRates["GOLD 916.00"], 2) : "",
            });

            // Clear local storage keys
            [
                DRAFT_KEY,
                TYPE_KEY,
                DATE_RANGE_KEY,
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
     
        setEditingState({ rowId: null, transactionType: null });
        resetDraftRowTempId();

        setSingleSearch("");
        setDeselectFlag(true);
        setTimeout(() => setDeselectFlag(false), 50);

        resetHeader();    
        resetBalance();  
        resetStore();


        if (isEditing) {
            stopEdit();
            refetchTransactionHeaderDetail();

            toaster.create({
                title: "Edit Cancelled",
                description: "Transaction edit has been cancelled.",
                type: "info",
            });
        } else {
            localStorage.removeItem(TYPE_KEY);
        }

        localStorage.removeItem(DRAFT_KEY);
    };


    const handleTransactionClick = useCallback((transactionId: string) => {
        if (transactionId === String(transactionId)) {
            // Same ID clicked again — force re-fetch by resetting first
            setSelectedTransactionId('');
            console.log(transactionId, 'transactionId')
            setTimeout(() => setSelectedTransactionId(String(transactionId)), 0);
            return;
        }
        setSelectedTransactionId(transactionId);
  

    }, []);

    const handleSingleSearch = (term: string) => {
        setSingleSearch(term);
        setDeselectFlag(false); // reset deselect flag whenever typing
    };


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
    const { loadSaleTag } = useLoadSaleTag();

    const handleTagChange = () => setIsTag(prev => !prev);

    const handleTagNoLookup = (tagNo: string) => {
        if (!headerForm.CUSTOMER) return;

        loadSaleTag(tagNo, Number(headerForm.CUSTOMER));
    };

   
    return (
        <>
            <Box display={'flex'} bg={theme.colors.formColor} fontSize={'md'} fontWeight={'bold'} justifyContent={'center'} p={1} mb={1} rounded={'xl'} >
                SALES
            </Box>
            <Flex gap={1} >

                {/* LEFT – 70% */}
                <Box display='flex' gap={1} w='80%' >
                    <VStack align="stretch" gap={1} w='100%'>

                        {/* 1. Transaction Header Form */}

                        <TransactionHeaderForm
                            form={headerForm}
                            onFormChange={setHeaderField}
                            onCustomerSelect={setCustomer}
                            customerCollection={saleCustomerList}
                            getLabelByValue={getLabelByValue}
                            theme={theme}
                            openingBalance={baseOpening}
                            openingData={openingBalance}
                            isEditing={isEditing}

                        />

                        {/* 2. Transaction Type Selector */}

                        <TransactionTypeSelector
                            transactionTypes={SALETRANSACTIONTYPES}
                            selectedTypes={selectedTransactionTypes}
                            onSelectTypes={handleTransactionTypesSelect}
                            theme={theme}
                            TRANSACTIONTYPES_ORDER={TRANSACTIONTYPES_ORDER}
                            setIsStockDrawerOpen={setIsStockDrawerOpen}
                            handleShowFilter={openFilter}
                            isEditing={isEditing}
                            onSave={isEditing ? handleUpdateTransaction : handleSaveTransaction}
                            onReset={handleResetDraft}
                            isSaving={
                                createTransaction.isPending || updateTransaction.isPending
                            }
                            acCode={headerForm.CUSTOMER}
                            draftRows={draftRows}

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
                        {(selectedTransactionTypes?.length > 0) && (
                            <Box display="flex" gap={2} flexWrap="wrap">
                                {/* Map selected transaction types in order */}
                                {TRANSACTIONTYPES_ORDER
                                    .map(code => selectedTransactionTypes?.find(t => t.value === code))
                                    .filter((t): t is SaleTransactionType => !!t)
                                    .map(transactionType => {
                                        const typeRows = draftRows.filter(
                                            row => row.TRANSACTION_TYPE === transactionType.value
                                        );
                                        const typeTotals = calculateTotalsForType(transactionType);
                                        const activeCollection = getActiveCollectionForType(transactionType);
                                        const isIssue = isIssueType(transactionType);

                                        return (
                                            <Box
                                                key={transactionType.value}
                                                borderWidth="1px"
                                                borderRadius="md"
                                                borderColor={theme.colors.greyColor}
                                                flex={'100%'}
                                            >
                                                <DraftTransactionTable
                                                    rows={typeRows}
                                                    editingState={editingState}
                                                    isEditing={false}
                                                    onAddRow={(formData) => {
                                                        handleAddRow(transactionType, formData);
                                                    }}
                                                    onUpdateRow={(rowIndex, field, value) => {
                                                        handleUpdateRow(rowIndex, field, value, typeRows);
                                                    }}
                                                    onRemoveRow={(rowId) => {
                                                        handleRemoveRow(rowId);
                                                    }}
                                                    onEditRow={(rowId, submitData) => handleEditRow(rowId, submitData)}  
                                                    onRowClick={handleRowClick}
                                                    onCancelEdit={handleCancelEdit}
                                                    itemsCollection={activeCollection}
                                                    totals={typeTotals}
                                                    transactionTitle={transactionType?.label}
                                                    transactionType={transactionType?.value}
                                                    theme={theme}
                                                    isIssue={isIssue}
                                                    getAvailableWeight={getAvailableWeight}
                                                    onClear={() => handleClearRowsForType(transactionType)}
                                                    getStockAvailability={getStockAvailability}
                                                    otherChargesList={otherCharges}
                                                    otherChargesData={otherChargesData?.data}
                                                    getAvailablePieces={getAvailablePieces}
                                                    handleTagChange={handleTagChange}
                                                    isTag={isTag}
                                                    onTagNoLookup={handleTagNoLookup}
                                                    acCode={Number(accCode)}
                                                    onSaleReturnModal={{
                                                        billParams,
                                                        onBillParamChange: handleBillParamChange,
                                                        billDetails: billDetailsList || [],
                                                        loading: billDetailsLoading,
                                                        showBillModal,
                                                        handleBillShow: handleBillShow,
                                                        handleSelectedItems: handleSelectedItems,
                                                        handleLoadSelectedItems: handleLoadSalesItems
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                            </Box>
                        )}
                          

                    </VStack>



                    {/* RIGHT – 30% */}
                    <SalesSearch
                        onSearch={handleSearchFilter}           // For final submit
                        onClear={handleSearchFilterClear}
                        isOpen={isFilterOpen}
                        onClose={() => setIsFilterOpen(false)}
                        itemOptions={mappedItems}
                        accodeOptions={saleCustomerList}
                        pureGoldOptions={pureGoldList}
                        initialFilters={saleFilter}
                    />

                </Box>

                {/* RIGHT SIDE - Summary Panel */}
                <Box width={'22%'}>


                    <BalanceSummary
                        theme={theme}
                        openBalance={openingBalances}
                        accCode={Number(accCode)}
                        rate={Number(headerForm.RATEGM)}
                        closingCash={closingCash} 
                        closingPure={closingPure}    
                        bankAccList={allBankAccounts}
                    />

                </Box>

                <Box width={'15%'}>
                    <TransactionListing
                        transactionIdsList={transactionIdsList}
                        handleEditTransaction={handleTransactionClick}
                        searchTerm={singleSearch}
                        handleSearchChange={handleSingleSearch}
                        deselectFlag={deselectFlag}
                        handleDeselect={handleResetDraft}
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