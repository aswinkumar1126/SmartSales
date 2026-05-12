"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
    Text,
    Box,
    Flex,
    Stack,
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
import SaveModal from "./SaveModal/SaveModal";

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
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";


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
import { TRANSACTIONTYPES } from '@/data/Transaction/TransactionType';
import { BaseClosingFormDetails } from "@/types/balanceSummary/BalanceSummary";
//Utilities
import { formatToFixed } from '@/utils/format/numberFormat';
import PurchaseReceipt from "@/component/ReceiptPrint/PurchasePrint";


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
    const initialClosingRef = useRef<BaseClosingFormDetails>(
        {
            BANKPAID: "",
            BANKPAIDDETAILS: [],
            BANKRCVD: "",
            BANKRCVDDETAILS: [],
            CASHPAID: "",
            CASHRCVD: "",
            CONVAMT: "",
            CONVTYPE: "",
            CONVWT: ""
        }
    );

    const METAL_RATE_KEYS = {
        G: "GOLD 916.00",
        S: "SILVER 916.00", // ✅ FIXED
    };

    console.log(initialClosingRef.current, 'currentClosingRef');

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
    VALIDATION FROM SOFT CONTROL
================================ */

    const isPRTag = 'PR-TAGNO-REQ';

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
    const [deselectFlag, setDeselectFlag] = useState<boolean>(false);
    const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
    const [printData, setPrintData] = useState<any>(null);

    const [purchaseFilter, setPurchaseFilter] = useState<PurchaseFilter>({
        fromDate: "",
        toDate: "",
        weight: '',
        pureId: '',
        itemId: '',
        accode: ''
    });
    console.log(printData, 'printData');

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

    const [openRemarkModal ,setIsOpenRemarkModal ] = useState<boolean>(false);



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

    console.log(pureStockList,'pureStockListpureStockList')





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
                    value: String(b.ENTRYNO),
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

    const rateKey = METAL_RATE_KEYS[headerForm.METALTYPE as "G" | "S"];
    const rate = rateKey ? metalRates?.[rateKey] : null;

    useSyncPurchaseHeader(
        transactionHeaderDetail,
        metalRates,
        headerForm.METALTYPE
    );


    const transactionIdsList = useMemo(() => {
        const list = transactionList?.snoList;
        if (!list || !Array.isArray(list)) return [];

        return list.map((item: any) => ({
            label: item,
            value: item,
        }));
    }, [transactionList]);


    useEffect(() => {

        const openPure = Number(openingBalance?.data?.OPENPURE ?? 0);
        const openCash = Number(openingBalance?.data?.OPENCASH ?? 0);

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

    console.log(selectedStockData ,'selectedStock');
    console.log(pureStockList ,'pureStockList');


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
            fromDate: '',
            toDate: '',
            weight: '',
            pureId: '',
            itemId: '',
            accode: ''
        });
    },[]);



    /* ================================
      Manage Remark Modal On Save
   ================================ */

   const handleOpenRemarkModal = ()=>{
        setIsOpenRemarkModal(true);
   }
    const handleCloseRemarkModal = () => {
        setIsOpenRemarkModal(false);
    }

    const handleConfirmRemarkModal = () => {
        if (isEditing) {
            handleUpdateTransaction();
        } else {
            handleSaveTransaction();
        }

    };

    // KEY TO ACCESS

    useGlobalKey("F1", () => openFilter(), "openFilter");
    useGlobalKey("Alt+s" , ()=>handleSaveTransaction() , "saveTransaction");
    useGlobalKey("Alt+c", () => handleResetDraft() ,"ClearTransaction");

  

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
        setSelectedTransactionTypes,

        resetStore,

    } = usePurchaseTransactionStore();

    const { handleAddRow, handleEditRow, handleRemoveRow, handleUpdateRow } = useDraftRowOperations(isTagedItem);

useGlobalKey(
    "alt+p",
    () => {
        if(headerForm.CUSTOMER){
            setSelectedTransactionTypes( [
                ...selectedTransactionTypes,
                {
                    code: "PU",
                    key: "purchase",
                    label: "PURCHASE",
                    value: "PU"
                }
        ]);
        }
        else{
            toaster.create({
                title: "Customer Required",
                description: "Select customer first.",
                type: "warning"
            });
        }
         
        
    }
);
useGlobalKey(
    "alt+r",
    () => {
        if(headerForm.CUSTOMER){
            setSelectedTransactionTypes( [
                ...selectedTransactionTypes,
                {
                    code: "PR",
                    key: "purchase_return",
                    label: "PURCHASE_RETURN",
                    value: "PR"
                }
        ]);
        }
        else{
            toaster.create({
                title: "Customer Required",
                description: "Select customer first.",
                type: "warning"
            });
        }
         
        
    }
);
useGlobalKey(
    "alt+i",
    () => {
        if(headerForm.CUSTOMER){
            setSelectedTransactionTypes( [
                ...selectedTransactionTypes,
                {
                    code: "ISP",
                    key: "issue",
                    label: "ISSUE",
                    value: "ISP"
                }
        ]);
        }
        else{
            toaster.create({
                title: "Customer Required",
                description: "Select customer first.",
                type: "warning"
            });
        }
         
        
    }
);
useGlobalKey(
    "alt+t",
    () => {
        if(headerForm.CUSTOMER){
            setSelectedTransactionTypes( [
                ...selectedTransactionTypes,
                {
                    code: "REC",
                    key: "receipt",
                    label: "RECEIPT",
                    value: "REC"
                }
        ]);
        }
        else{
            toaster.create({
                title: "Customer Required",
                description: "Select customer first.",
                type: "warning"
            });
        }
         
        
    }
);

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
        // setDeselectFlag(true);
        // setTimeout(() => setDeselectFlag(false), 50);
    }, [editingState]);



    const { loadTransaction } = useLoadPurchaseTransaction();



    const handleEditTransaction = useCallback((data: any, sno: string) => {

        setOpeningBalance(data, true);
        setEditingSno(sno);

        console.log(data, 'datadata')

        const result = loadTransaction(data, sno, isTagedItem);
        if (!result) return;



        setSelectedTransactionTypes(result.selectedTransactionTypes);
        setDraftRows(result.rows);
        setPrintData(data);


    }, []);



    /* ================================
      SOFT CONTROL CHECKING
    ================================ */

    const {data : softControlData } = useSoftControlById(isPRTag);

    const isTagedPR = softControlData ? softControlData.CTLTEXT === "Y" : false ;
 
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


        setSelectedTransactionId(null);
    };


    /* ================================
          CLOSING DETAILS FORM
       ================================ */
    const { closingDetails, setClosingDetails, resetBalance } = usePurchaseBalanceSummary();

    console.log(closingDetails, 'closingDetailsfromstore');





    useConversionSync(Number(headerForm.RATEGM || 0));

    const { closingPure, closingCash } = useClosingCalculation(closingDetails, openingBalances, Number(headerForm.RATEGM || 0));


    // ✅ Always reads latest — even before re-render
    const getClosingDetailsPayload = (): ClosingDetails => {
        const d = closingDetails;

        return {
            CONVTYPE: d.CONVTYPE,
            CONVAMT: Number(d.CONVAMT || 0),
            CONVWT: Number(d.CONVWT || 0),
            // discAmt: Number(d.discAmt || 0),
            // discWt: Number(d.discWt || 0),
            CASHPAID: Number(d.CASHPAID || 0),
            CASHRCVD: Number(d.CASHRCVD || 0),
            BANKPAID: Number(d.BANKPAID || 0),
            BANKRCVD: Number(d.BANKRCVD || 0),
            BANKPAIDDETAILS: d.BANKPAIDDETAILS,
            BANKRCVDDETAILS: d.BANKRCVDDETAILS,
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
            const touch = stockRow.aTouch;

            availability = getStockAvailability(pureId ,touch);

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
        transactionKeys,
        isIssue,
        isPurchase,
        isPurchaseReturn,
        isReceipt,
        getStockAvailability,
        getAvailableWeight,
        getAvailablePieces,
        validateQuantity,
        getStockForTransaction,
        // These are only available in edit mode
        getEditAvailableWeightForISP,
        getEditAvailableWeightForPU,
    } = useStockAvailability({
        transactionCodes: selectedTransactionTypes.map(t => t.code),
        pureStockList,
        itemsStockList,
        draftRows,
        TRANSACTIONTYPES,
        isEditMode: isEditing, // Enable edit mode if editing
        originalTransactionData, // Pass the original transaction data
    });

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
        // const prev = initialClosingRef.current ?? {};
        // const current = getClosingDetailsPayload() ?? {};
        // console.log(current, 'currentPayloadClosingRef')

        // const closingChanged = !lodash.isEqual(prev, current);

        // console.log(closingChanged,'closingChanged')

        const isBalanceSame = Number(openingBalances.openPure || 0) === Number(closingPure || 0) && Number(openingBalances.openCash || 0) === Number(closingCash || 0);

        

        const hasAnyValue =
            Number(closingDetails.CONVAMT || 0) > 0 ||
            Number(closingDetails.CONVWT || 0) > 0 ||
            Number(closingDetails.CASHPAID || 0) > 0 ||
            Number(closingDetails.CASHRCVD || 0) > 0 ||
            Number(closingDetails.BANKPAID || 0) > 0 ||
            Number(closingDetails.BANKRCVD || 0) > 0 ||
            (closingDetails.BANKPAIDDETAILS?.length ?? 0) > 0 ||
            (closingDetails.BANKRCVDDETAILS?.length ?? 0) > 0;
            
        return (!isBalanceSame && hasAnyValue);
    }, [closingDetails, getClosingDetailsPayload]);


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
            isTagedPR,
    

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
                REMARK:headerForm.REMARK,
                THRU:headerForm.THRU
            },
            TRANSACTION_DETAILS: transactionDetails,
            CLOSING_DETAILS: getClosingDetailsPayload(),
        };

        return { valid: true, payload };
    };



    const handleResetDraft = () => {

        setSelectedTransactionId(null);
        setEditingState({ rowId: null, transactionType: null });
        resetDraftRowTempId();

        setSingleSearch("");

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
            setSelectedTransactionId('');
        }

        const safeRate = rate ?? 0;

        setHeaderForm({
            ENTRYNO: "",
            CUSTOMER: "",
            CUSTOMER_NAME: "",
            BILLNO: "",
            DATE: new Date().toISOString().split("T")[0],
            RATEGM: Number(formatToFixed(safeRate, 2)),
        });

        setDeselectFlag(true);
        setTimeout(() => setDeselectFlag(false), 1000);


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
        console.log("Create Transaction Payload:" , result.payload);

        if (!result.valid || !result.payload) {
            toaster.create({
                title: "Validation Error",
                description: result.error,
                type: "error",
            });
            return;
        }
      

    // return;
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
                    setIsOpenRemarkModal(false);
                },

                onError: (error: any) => {
                    toaster.create({
                        title: "Save Failed",
                        description: error?.message || "Failed to save transaction.",
                        type: "error",
                    });

                    openingBalanceRefetch();
                    setIsOpenRemarkModal(false);
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

        console.log(result.payload, 'updatepayload');

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
            ;

            goldStockRefetch();
            itemStockRefetch();
            openingBalanceRefetch();

            setEditingState({ rowId: null, transactionType: null });

            toaster.create({
                title: "Transaction Update",
                description: "Transaction Updated Successfully",
                type: "success",
            });


            resetStore();
            resetBalance();
            setDeselectFlag(true);
            handleResetDraft();
            setIsOpenRemarkModal(false);

        } catch (error: any) {
            toaster.create({
                title: "Update Failed",
                description: error.message || "Failed to update transaction.",
                type: "error",
            });

            openingBalanceRefetch();
            setIsOpenRemarkModal(false);
        }
    };

  

    const handleTransactionClick = useCallback((transactionId: string) => {

        if (draftRows.length > 0 && !isEditing) {
            toaster.create({
                title: "Warning",
                description: "You have unsaved changes in the draft. Please save or reset before switching transactions.",
                type: "warning",
                duration: 2000
            });
            setDeselectFlag(true);
            setTimeout(() => setDeselectFlag(false), 50);
            return;
        }

        setSelectedTransactionId(prev =>
            prev === transactionId ? '' : transactionId
        );
        if(isEditing){
            setDraftRows([]);
        }

    }, [draftRows]);

    const handleSingleSearch = (term: string) => {
        setSingleSearch(term);
        setDeselectFlag(false); // reset deselect flag whenever typing
    };


    
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

            <Flex gap={1}>

                {/* LEFT – 70% */}
                <Box display='flex' gap={1} width='100%' >
                    <Stack flex={1}>

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
                            isClosingChanged={isClosingChanged()}
                            isDraftRowChanged ={isDraftRowsChanged()}

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
                        {/* {isEditing && selectedTransactionTypes.length > 0 && (
                            <Box p={2} bg={theme.colors.formColor} borderRadius="md" display='flex' gap={2}>
                                <Text fontSize='xs' color={theme.colors.primaryText}>
                                    {selectedTransactionTypes.map(t => t.label).join(", ")} - {editingSno}
                                </Text>
                                <Text fontSize="xs"> <strong>Customer: </strong>{headerForm.CUSTOMER_NAME}</Text>
                                <Text fontSize="xs"> <strong>Date:</strong> {headerForm.DATE}</Text>
                            </Box>
                        )} */}


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


                    </Stack>



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
                <Box width={'30%'}>


                    <BalanceSummary
                        theme={theme}
                        openBalance={openingBalances}
                        accCode={Number(accCode)}
                        rate={Number(headerForm.RATEGM)}
                        closingCash={closingCash}
                        closingPure={closingPure}
                        bankAccList={allBankAccounts}
                        headerForm ={headerForm}
                  
                        onFormChange={setHeaderField}
                    />

                </Box>

                <Box width={'15%'} >
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
                    <PurchaseReceipt
                        COMPANY_DETAILS={companyDetails}
                        {...printData}
                    />
                </Box>

            )}
            <Box>

            {/* <SaveModal 
                isOpen={openRemarkModal}
                isClose={handleCloseRemarkModal}
                onConfirm={handleConfirmRemarkModal}
                headerForm={headerForm}
                onFormChange={setHeaderField}
               
            /> */}
            </Box>

        </>

    );
}