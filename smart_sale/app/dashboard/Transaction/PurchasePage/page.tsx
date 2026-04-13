"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
    Text,
    Box,
    Flex,
    VStack,
} from "@chakra-ui/react";
import lodash from "lodash";
import { useRouter } from "next/navigation";

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
import SalesReceipt from "@/component/ReceiptPrint/SalesPrint";

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
import { useCompanyById } from "@/hooks/apiHooks/company/useCompany";

/*-------------------  *VALIDATION HOOKS*  --------------------------*/

import { useIsTaggedItem } from "@/utils/TransactionValidation/purchase/TagNumberValidation";
import { validateTransactions } from "@/utils/TransactionValidation/purchase/ValidateTransaction";
import { buildTransactionPayload } from "@/utils/TransactionValidation/purchase/buildTransactionPayload";
import { normalizeRowForApi } from "@/utils/TransactionValidation/purchase/normalizeRowForApi";


/*--------------------- *CALCULATION HOOKS* ---------------------------------*/

import { useStockAvailability } from "@/hooks/Transaction/purchase/useStockAvailability";

import { useConversionSync } from "@/hooks/Transaction/purchase/useConversionSync";
import { useClosingCalculation } from "@/hooks/Transaction/purchase/useClosingBalanceCalculation";
import { usePurchaseOpeningBalances } from "@/hooks/Transaction/purchase/usePurchaseOpeningCal";



import { useSyncPurchaseHeader } from "@/hooks/Transaction/purchase/usePurchaseHeaderSync";
import { useLoadPurchaseTransaction } from "@/hooks/Transaction/purchase/usePurchaseTransactionLoad";

import { useDraftRowOperations } from "@/hooks/Transaction/purchase/useDraftRowOperations";
import { useLoadPurchaseTag } from "@/hooks/Transaction/purchase/useLoadPurchaseTag";
import { useLoadPurchaseStock } from "@/hooks/Transaction/purchase/useLoadPurchaseStock";

/*-------------------  *STORAGE*  --------------------------*/

import { useSessionStorage } from "@/hooks/apiHooks/storage/useSessionStorage";
import { usePurchaseBalanceSummary } from "@/store/purchase/useBalanceSummaryStore";
import { usePurchaseHeader } from "@/store/purchase/usePurchaseHeader";
import { usePurchaseTransactionStore } from "@/store/purchase/usePurchaseTransactionStore";


// Types & Constants
import { ClosingDetails, WeightInfo, PurchaseReturnPayload, PurchasePayload, TransactionType, TRANSACTION_KEY_MAP, CreateTransaction, TransactionItems } from "@/types/transcation/Transaction";
import {TRANSACTIONTYPES} from '@/data/Transaction/TransactionType';
import { BaseClosingFormDetails } from "@/types/balanceSummary/BalanceSummary";
//Utilities
import { formatToFixed } from '@/utils/format/numberFormat';


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


interface PurchaseFilter {
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

export default function PurchasePage() {


    const router = useRouter();
    const today = new Date().toISOString().split("T")[0];

    const initialDraftRowsRef = useRef<any[]>([]);
    const initialClosingRef = useRef<BaseClosingFormDetails>(null);

    console.log(initialClosingRef.current, initialDraftRowsRef.current, 'currentref');

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
    } = usePurchaseHeader();


    /* ================================
   Session Storage Keys (All in one place)
================================ */

    const TYPE_KEY = "purchase_transaction_type";


    const EDITING_SNO_KEY = "purchase_editing_sno";


    const TRANSACTION_LIST_SEARCH = "purchase_transaction_list_search";
    const ISTAG = 'purchase_is_tag';



    const TRANSACTIONTYPES_ORDER = ["PU", "PR", "ISP", "REC"];


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
    const [apiBalanceOpening, setApiBalanceOpening] = useState({ openPure: 0, openCash: 0 });

    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

    const [baseOpening, setBaseOpening] = useSessionStorage<{ openPure: number, openCash: number }>('purchase-openingBalance', {
        openPure: 0,
        openCash: 0,
    });

    const [singleSearch, setSingleSearch] = useSessionStorage<string>(TRANSACTION_LIST_SEARCH, '');
    const [deselectFlag, setDeselectFlag] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
    const [printData, setPrintData] = useState<any>(null);

    const [purchaseFilter, setPurchaseFilter] = useState<PurchaseFilter>({
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
    const [editingRowsData, setEditingRowsData] = useSessionStorage<any>("EDITING_DATA", {});

    const [isTag, setIsTag] = useSessionStorage<boolean>(ISTAG, false);


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
    const { data: tagedItems } = useStoneItems({ STOCKTYPE: 'T' });

    console.log(tagedItems, 'tagedItems')

    const filters = {
        accountType: "PR"
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

    const { data: transactionsById, isLoading: getbySnoLoading } = useTransactionByTransId(selectedTransactionId, "purchase");



    /*------------------------------- BILL DETAILS API ----------------------------*/

    const { data: billDetails, isLoading: billDetailsLoading, isError: billDetailsError } = useBillDetails({
        ACCODE: Number(accCode),
        ENTRYNO: Number(billParams.ENTRYNO),
        BILLDATE: billParams.BILLDATE,
        TAGNO: billParams.TAGNO
    });

    const billDetailsList = useMemo(() => {
        const billList = billDetails;
        return Array.isArray(billList) ? billList : []
    }, [billDetails]);

    console.log(billDetailsList, billParams, 'billDetailsList')


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

    const { data: companyData } = useCompanyById('SMJ');

    const companyDetails = useMemo(() => {
        return companyData?.data
    }, [companyData]);


    const updateTransaction = useUpdateTransaction();
    const { data: metalsData } = useAllMetals();

    const { data: openingBalance, refetch: openingBalanceRefetch } = useOpeningBalance(Number(accCode));


    // Note: This hook might need to be updated to handle multiple transaction types
    const { data: transactionList, isLoading, refetch: refetchTransactionList } = useTransactions({
        TRANTYPE: "purchase",
        trantype: null,
        accode: purchaseFilter.accode ? Number(purchaseFilter.accode) : null,
        startdate: purchaseFilter.fromDate || null,
        enddate: purchaseFilter.toDate || null,
        itemid: purchaseFilter.itemId ? Number(purchaseFilter.itemId) : null,
    });

    const { data: metalRates, isLoading: metalRatesLoading, isError: metalRatesError } = useRates();

    const { data: transactionHeaderDetail, isLoading: transactionHeaderLoading, refetch: refetchTransactionHeaderDetail } = useTransactions({
        TRANTYPE: "purchase",
        accode: headerForm.CUSTOMER ? Number(headerForm.CUSTOMER) : null
    });



    useSyncPurchaseHeader(transactionHeaderDetail, metalRates);


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
    console.log(itemsStockList, 'itemsStockList')


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

    const tagedItemsList = useMemo(() =>
        tagedItems?.map((item: any) => ({
            label: item.itemName,
            value: item.itemId.toString(),
        })) ?? [], []);

    console.log(tagedItemsList, 'tagedItemsList')

    const { collection: itemsCollection, filter: itemsFilter, set } = useListCollection({
        initialItems: mappedItems,
        filter: contains,
    });

    useEffect(() => {
        set(mappedItems);
    }, [mappedItems, set]);




    const isTagedItem = useIsTaggedItem(tagedItemsList);




    // Reset draft row temp ID
    const resetDraftRowTempId = () => {
        draftRowTempId.current = null;
    };



    /* ================================
        Search Management
     ================================ */

    // This only gets called when user clicks "Apply Filters"
    const handleSearchFilter = useCallback((filters: PurchaseFilter) => {
        setPurchaseFilter({
            fromDate: filters.fromDate,
            toDate: filters.toDate,
            weight: filters.weight,
            pureId: filters.pureId,
            itemId: filters.itemId,
            accode: filters.accode
        });
    }, []);

    const handleSearchFilterClear = useCallback(() => {
        setPurchaseFilter({
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
        setDraftRows,
        updateDraftRow,
        clearDraftRowsByType,
        resetStore,
        setSelectedTransactionTypes
    } = usePurchaseTransactionStore();

    const { handleAddRow, handleEditRow, handleRemoveRow, handleUpdateRow } = useDraftRowOperations(isTagedItem);

  


    // Handle clear rows for type
    const handleClearRowsForType = (transactionType: any) => {
        const confirmClear = window.confirm(`Clear all rows for ${transactionType.label}?`);
        if (confirmClear) {
            clearDraftRowsByType(transactionType.value);
        }
    };



    const setOpeningBalance = (data: any, isEdit: boolean) => {
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
    useEffect(() => {
        if (isEditing) return;

        if (apiBalanceOpening) {
            setOpeningBalance(apiBalanceOpening, false);
        }
    }, [apiBalanceOpening, isEditing]);

    // Single useEffect to calculate balances when either draftRows or API balances change
    const openingBalances = usePurchaseOpeningBalances(
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
    const isIssueType = (transactionType: TransactionType) => {
        console.log(transactionType, 'transactionTypetransactionType')
        return transactionType.code.toUpperCase() === "ISP" || transactionType.code.toUpperCase() === "REC";
    };

    // Determines if a stock row should be treated as an Issue-type (ISSUE / RECEIPT)
    const isIssueStock = (stockRow: any): boolean => {
        return !!stockRow.pureId; // if pureId exists, it's issue stock
    };

    const getActiveCollectionForType = (transactionType: TransactionType) => {
        return isIssueType(transactionType) ? pureNameCollection : itemsCollection;
    };




    /* ================================
       Load Transaction Data When Selected
    ================================ */

    // This useEffect loads transaction data when transactionsById changes
    useEffect(() => {
        if (transactionsById && selectedTransactionId) {

            setEditingRowsData(transactionsById);
            handleEditTransaction(transactionsById, selectedTransactionId)
        }
    }, [transactionsById, selectedTransactionId]);





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



    const { loadTransaction } = useLoadPurchaseTransaction();



    const handleEditTransaction = useCallback((data: any, sno: string) => {

        setOpeningBalance(data, true);
        setEditingSno(sno);

        console.log(data,'datadata')

        const result = loadTransaction(data, sno, isTagedItem);
        if (!result) return;



        setSelectedTransactionTypes(result.selectedTransactionTypes);
        setDraftRows(result.rows);
        setPrintData(data);


    }, []);


    /* ================================
       Transaction Type Handlers
    ================================ */
    const handleTransactionTypesSelect = (types:TransactionType[]) => {


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
    const { closingDetails, setClosingDetails, resetBalance } = usePurchaseBalanceSummary();

    console.log(closingDetails, 'closingDetailsfromstore')




    useConversionSync(Number(headerForm.RATEGM || 0));

    const { closingPure, closingCash } = useClosingCalculation(closingDetails, openingBalances, Number(headerForm.RATEGM || 0));


    // ✅ Always reads latest — even before re-render
    const getClosingDetailsPayload = (): ClosingDetails => {
        const d = closingDetails;

        return {
            convType: d.convType,
            convAmt: Number(d.convAmt || 0),
            convWt: Number(d.convWt || 0),
            // discAmt: Number(d.discAmt || 0),
            // discWt: Number(d.discWt || 0),
            cashPaid: Number(d.cashPaid || 0),
            cashRcvd: Number(d.cashRcvd || 0),
            bankPaid: Number(d.bankPaid || 0),
            bankRcvd: Number(d.bankRcvd || 0),
            bankPaidDetails: d.bankPaidDetails,
            bankRcvdDetails: d.bankRcvdDetails,
        };
    };

    const { createRowFromStock } = useLoadPurchaseStock();

    const handleLoadFromStock = (stockRow: any) => {

        const issueStock = isIssueStock(stockRow);

        const targetType = issueStock
            ? TRANSACTIONTYPES.find(t => t.key === "issue")
            : TRANSACTIONTYPES.find(t => t.key === "purchase");

        if (!targetType) {
            toaster.create({
                title: "Transaction Type Missing",
                type: "warning",
            });
            return;
        }

        // check open
        if (!selectedTransactionTypes.some(t => t.value === targetType.value)) {
            toaster.create({
                title: `${targetType.label} Not Opened`,
                type: "error",
            });
            return;
        }

        let availability = null;

        if (issueStock) {
            console.log(stockRow, 'vstockRow')
            const pureId = stockRow.pureId;

            availability = getStockAvailability(pureId);

            console.log(availability, 'availability')

            if (!availability || availability.remaining <= 0) {
                toaster.create({
                    title: "Stock Exhausted",
                    type: "error",
                });
                return;
            }
        }

        // ✅ USE HOOK HERE
        const newRow = createRowFromStock({
            stockRow,
            targetType,
            availability,
            draftRows,
        });
        console.log(targetType, 'targetType')

        // ✅ ADD ROW
        setDraftRows(prev => [...prev, newRow]);

        // ✅ SET EDIT STATE (use SAME TYPE)
        setEditingState({
            rowId: newRow.__rowId,
            transactionType: targetType.code, // FIXED
        });

        setIsStockDrawerOpen(false);
    };


    /* ================================
       Calculate Availability For Stock While Editing
    ================================ */

    const originalTransactionData = editingRowsData ? editingRowsData : [{}];
    console.log(editingRowsData, 'editingRowsData')

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
        // These are only available in edit mode
        getEditAvailableWeightForIS,
        getEditAvailableWeightForSA,
    } = useStockAvailability({
        transactionCode: (selectedTransactionTypes[0] ?? TRANSACTIONTYPES[0]).code,
        pureStockList,
        itemsStockList,
        draftRows,
        TRANSACTIONTYPES,
        isEditMode: !!originalTransactionData, // Enable edit mode if editing
        originalTransactionData, // Pass the original transaction data
    });

    const editavailable = getAvailableWeight('5');
    console.log(editavailable, 'editavailable');


    /* ================================
        Calculate Totals For Specific Type
     ================================ */
    const calculateTotalsForType = (transactionType: TransactionType) => {
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

    const isDraftRowsChanged = useCallback(() => {
        return !lodash.isEqual(
            initialDraftRowsRef.current ?? [],
            draftRows ?? []
        );
    }, [draftRows]);

    const isClosingChanged = useCallback(() => {
        return !lodash.isEqual(
            initialClosingRef.current ?? {},
            getClosingDetailsPayload() ?? {}
        );
    }, [getClosingDetailsPayload]);


    console.log(isDraftRowsChanged(), isClosingChanged(), 'isDraftRowsChanged, isClosingChanged')



    /* ================================
    Save Transaction Handler with Stone Details
    ================================ */

    const buildTransactionRequest = () => {

        const validation = validateTransactions({
            draftRows,
            isDraftRowsChanged,
            isClosingChanged,
            getClosingDetailsPayload,
            TRANSACTION_KEY_MAP,
            TRANSACTIONTYPES,
            getStockAvailability,
            isIssueType,
        });

        if (!validation.valid) {
            return { valid: false, error: validation.error };
        }

        const transactionDetails: TransactionItems = buildTransactionPayload({
            draftRows,
            TRANSACTION_KEY_MAP,
            normalizeRowForApi,
        });

        const payload: CreateTransaction = {
            TRANSACTION_HEADER: {
                ACCODE: Number(headerForm.CUSTOMER),
                TRANDATE: headerForm.DATE,
                BILLNO: headerForm.BILLNO ? Number(headerForm.BILLNO) : undefined,
                RATE: headerForm.RATEGM ? Number(headerForm.RATEGM) : undefined,
            },
            TRANSACTION_DETAILS: transactionDetails,
            CLOSING_DETAILS: getClosingDetailsPayload(),
        };

        return { valid: true, payload };
    };
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

        const result = buildTransactionRequest();



        if (!result.valid || !result.payload) {
            toaster.create({
                title: "Validation Error",
                description: result.error,
                type: "error",
            });
            return;
        }

        createTransaction.mutate(
            { payload: result.payload, TRANTYPE: "purchase" },
            {
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

                    resetStore();
                    resetBalance();
                },

                onError: (error: any) => {
                    toaster.create({
                        title: "Save Failed",
                        description: error?.message || "Failed to save transaction.",
                        type: "error",
                    });

                    openingBalanceRefetch();
                }
            }
        );
    };

    const handleUpdateTransaction = async () => {

        setEditingState({ rowId: null, transactionType: null });

        if (!editingSno) {
            toaster.create({
                title: "Transaction ID Missing",
                description: "Cannot update without transaction SNO.",
                type: "error",
            });
            return;
        }

        const result = buildTransactionRequest();

        if (!result.valid || !result.payload) {
            toaster.create({
                title: "Validation Error",
                description: result.error,
                type: "error",
            });
            return;
        }

        try {
            await updateTransaction.mutateAsync({
                entryNo: Number(headerForm.ENTRYNO),
                payload: result.payload,
                TRANTYPE: "purchase"
            });

            setEditingSno(null);

            toaster.create({
                title: "Transaction Updated",
                description: "Transaction updated successfully.",
                type: "success",
            });

            goldStockRefetch();
            itemStockRefetch();
            openingBalanceRefetch();

            resetStore();
            resetBalance();

        } catch (error: any) {
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

        setEditingSno(null);

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
        setHeaderForm({
            ENTRYNO: "",
            CUSTOMER: "",
            CUSTOMER_NAME: "",
            BILLNO: "",
            DATE: new Date().toISOString().split("T")[0],
            RATEGM: metalRates ? formatToFixed(metalRates["GOLD 916.00"], 2) : "",
        });



    };


    const handleTransactionClick = useCallback((transactionId: string) => {
        if (transactionId === String(transactionId)) {

            setSelectedTransactionId('');
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
    const { loadSaleTag } = useLoadPurchaseTag();

    const handleTagChange = () => setIsTag(prev => !prev);

    const handleTagNoLookup = (tagNo: string) => {
        if (!headerForm.CUSTOMER) return;

        loadSaleTag(tagNo, Number(headerForm.CUSTOMER));
    };


    return (
        <>

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
                        // isClosingChanged={closingChanged}
                        // isDraftRowChanged ={draftChanged}

                        />

                        {/* 2. Transaction Type Selector */}

                        <TransactionTypeSelector
                            transactionTypes={TRANSACTIONTYPES}
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
                            onPrint={() => {
                                setShowPrintModal(prev => !prev)
                            }}
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
                                    .filter((t): t is TransactionType => !!t)
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
                        initialFilters={purchaseFilter}
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
            {showPrintModal && (

                <Box>
                    <SalesReceipt
                        COMPANY_DETAILS={companyDetails}
                        {...printData}
                    />
                </Box>

            )}

        </>

    );
}