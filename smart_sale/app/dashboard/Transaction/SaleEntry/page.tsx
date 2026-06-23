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
import SalesReceipt from "@/component/ReceiptPrint/SalesPrint";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import TransactionLoader, { TransactionStatus } from "@/component/loader/Transactionloader";

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


import { validateTransactions } from "@/utils/TransactionValidation/sales/ValidateTransaction";
import { buildTransactionPayload } from "@/utils/TransactionValidation/sales/buildTransactionPayload";
import { normalizeRowForApi } from "@/utils/TransactionValidation/sales/normalizeRowForApi";


/*--------------------- *CALCULATION HOOKS* ---------------------------------*/

import { useStockAvailability } from "@/hooks/Transaction/sales/useStockAvailability";

import { useConversionSync, useGstConversion } from "@/hooks/Transaction/sales/useConversionSync";
import { useClosingCalculation } from "@/hooks/Transaction/sales/useClosingBalanceCalculation";
import { useSalesOpeningBalances } from "@/hooks/Transaction/sales/useSalesOpeningCal";



import { useSyncSalesHeader } from "@/hooks/Transaction/sales/useSalesHeaderSync";
import { useLoadSalesTransaction } from "@/hooks/Transaction/sales/useSalesTransactionLoad";

import { useLoadSaleTag } from "@/hooks/Transaction/sales/useLoadSaleTag";
import { useLoadSalesStock } from "@/hooks/Transaction/sales/useLoadSalesStock";

/*-------------------  *STORAGE*  --------------------------*/

import { useSessionStorage } from "@/utils/storage/useSessionStorage";
import { useSalesBalanceSummary } from "@/store/sales/useSalesBalanceSummaryStore";
import { useSalesHeader } from "@/store/sales/useSalesHeader";
import { useSaleTransactionStore } from "@/store/sales/useSaleTransactionStore";


// Types & Constants
import { SALETRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import { SaleTransactionKey, SaleTransactionItems, SALE_TRANSACTION_KEY_MAP, SALESTRANSACTIONITEMS, CreateSaleTransaction, ClosingDetails, SaleTransactionType } from "@/types/transcation/SaleTransaction";

import { BaseClosingFormDetails } from "@/types/balanceSummary/BalanceSummary";
//Utilities
import { formatToFixed } from '@/utils/format/numberFormat';
import SalesSaveModal from "./SaveModal/SaveModal";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";


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


    const router = useRouter();
    const today = new Date().toISOString().split("T")[0];

    const initialDraftRowsRef = useRef<any[]>([]);
    const initialClosingRef = useRef<BaseClosingFormDetails>(null);

    const { data: useApiRate } = useSoftControlById('USE_API_RATE');

    console.log(useApiRate, 'softControl in header form');
    const isApiRateEnabled = useApiRate?.CTLTEXT === 'Y';

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
        startModify,
        stopModify,
        resetHeader,
        isEditing,
        isModifying
    } = useSalesHeader();

    const { isOpen, status, title, description, openLoader, resolveLoader, closeLoader } = useTransactionLoader();


    /* ================================
   Session Storage Keys (All in one place)
================================ */

    const TYPE_KEY = "sales_transaction_type";


    const EDITING_SNO_KEY = "sale_editing_sno";


    const TRANSACTION_LIST_SEARCH = "sale_transaction_list_search";
    const ISTAG = 'sale_is_tag';



    const TRANSACTIONTYPES_ORDER = ["SA", "SR", "IS", "RE"];


    const openFilter = () => setIsFilterOpen(true);
    const closeFilter = () => setIsFilterOpen(false);

    const draftRowTempId = useRef<string | null>(null);





    /* ================================
    VALIDATOR FROM SOFT CONTROL
================================ */
    const isBillTag = '	SR-TAGNO-REQ';

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

    const [selectedTransactionId, setSelectedTransactionId] =
        useSessionStorage<string | null>("selectedTransactionId", null);

    const [baseOpening, setBaseOpening] = useSessionStorage<{ openPure: number, openCash: number }>('sales-openingBalance', {
        openPure: 0,
        openCash: 0,
    });

    const [singleSearch, setSingleSearch] = useSessionStorage<string>(TRANSACTION_LIST_SEARCH, '');
    const [deselectFlag, setDeselectFlag] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
    const [printData, setPrintData] = useState<any>(null);

    const [saleFilter, setSaleFilter] = useState<SalesFilter>({
        fromDate: '',
        toDate: '',
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

    const [isTag, setIsTag] = useSessionStorage<boolean>(ISTAG, true);


    /* ================================
       State Management
    ================================ */



    const { theme } = useTheme();
    const { data: itemsData } = useStoneItems();
    const { data: tagedItems } = useStoneItems({ STOCKTYPE: 'T' });

    const { data: nonTagedItemList } = useStoneItems({ STOCKTYPE: 'N' });

    console.log(tagedItems, 'tagedItems')

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





    const { data: pureStockList = [], refetch: goldStockRefetch } = usePureGoldData(filter, cleanedFilters , isEditing ? Number(headerForm.ENTRYNO) : undefined ,isEditing ?"SA" :undefined );
    const { data: itemsStock, refetch: itemStockRefetch } = useOrnamentData(filter, 'N', isEditing ? Number(headerForm.ENTRYNO) : undefined, isEditing ? "SA" : undefined);



    const { data: allPureGoldNames } = usePureGoldNames();

    const {
        data: transactionsById,
        isFetching,
        isSuccess,
    } = useTransactionByTransId(
        selectedTransactionId,
        "sales"
    );



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
                    label: String(b.BANKNAME), // fix typo
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



    useSyncSalesHeader(transactionHeaderDetail, isApiRateEnabled, metalRates);


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

    const { data: salesReturnTagValidation } = useSoftControlById(isBillTag);

    const isSRBillTag = salesReturnTagValidation ? salesReturnTagValidation.CTLTEXT === "Y" : false;



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
        const otherCharges = otherChargesData?.data?.map((charges: any) => {
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

    const nonTagedItems = useMemo(
        () =>
            nonTagedItemList?.map((item: any) => ({
                label: item.itemName,
                value: item.itemId.toString(),
            })) ?? [],
        [nonTagedItemList]
    )

    const tagedItemsList = useMemo(() =>
        tagedItems?.map((item: any) => ({
            label: item.itemName,
            value: item.itemId.toString(),
        })) ?? [], [tagedItems]);


    const { collection: itemsCollection, filter: itemsFilter, set } = useListCollection({
        initialItems: mappedItems,
        filter: contains,
    });

    useEffect(() => {
        set(mappedItems);
    }, [mappedItems, set]);


    const { collection: notTagedItemCollection, filter: notTagedItemsFilter, set: setNotTaged } = useListCollection({
        initialItems: nonTagedItems,
        filter: contains,
    });

    useEffect(() => {
        setNotTaged(nonTagedItems);
    }, [nonTagedItems, setNotTaged]);


    // console.log(notTagedItemCollection,'notTagedItemCollection');







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
            fromDate: '',
            toDate: '',
            weight: '',
            pureId: '',
            itemId: '',
            accode: ''
        });
    }, []);


    /* ================================
        SALES SAVE MODAL MANAGE
   ================================ */

    //    const openSaleSaveModal = ()=>{
    //     setIsOpenSalesSaveModal(true);
    //    }
    //    const closeSalesSaveModal = ()=>{
    //     setIsOpenSalesSaveModal(false);
    //    }

    //    const confirmSalesSaveModal = ()=>{
    //         if(isEditing){
    //             handleUpdateTransaction()
    //         } 
    //         else{
    //             handleSaveTransaction()
    //         }

    //    }

    // KEY TO ACCESS

    useGlobalKey("F1", () => isFilterOpen ? closeFilter() : openFilter(), "openFilter");
    useGlobalKey("Alt+s", () => handleSaveTransaction(), "saveTransaction");
    useGlobalKey("Alt+u", () => isModifying ? handleUpdateTransaction() : null, "updateTransaction");
    useGlobalKey("Alt+c", () => handleResetDraft(), "ClearTransaction");
    useGlobalKey("Alt+m", () => { isModifying ? stopModify() : startModify() }, "modifyTransaction");
    useGlobalKey("F3", () => { isStockDrawerOpen ? setIsStockDrawerOpen(false) : setIsStockDrawerOpen(true) }, "openStockDrawer");
    useGlobalKey("CTRL+P", () => { isEditing && showPrintModal ? setShowPrintModal(false) : setShowPrintModal(true) }, "openPrintModal");

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
    } = useSaleTransactionStore();


    console.log(draftRows, 'draftRowsssssss');
    useGlobalKey(
        "alt+p",
        () => {
            if (headerForm.CUSTOMER) {
                setSelectedTransactionTypes([
                    ...selectedTransactionTypes,
                    {
                        code: "SA",
                        key: "sales",
                        label: "SALES",
                        value: "SA"
                    }
                ]);
            }
            else {
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
            if (headerForm.CUSTOMER) {
                setSelectedTransactionTypes([
                    ...selectedTransactionTypes,
                    {
                        code: "SR",
                        key: "sales_return",
                        label: "SALES_RETURN",
                        value: "SR"
                    }
                ]);
            }
            else {
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
            if (headerForm.CUSTOMER) {
                setSelectedTransactionTypes([
                    ...selectedTransactionTypes,
                    {
                        code: "IS",
                        key: "issue",
                        label: "ISSUE",
                        value: "IS"
                    }
                ]);
            }
            else {
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
            if (headerForm.CUSTOMER) {
                setSelectedTransactionTypes([
                    ...selectedTransactionTypes,
                    {
                        code: "RE",
                        key: "receipt",
                        label: "RECEIPT",
                        value: "RE"
                    }
                ]);
            }
            else {
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
        return isIssueType(transactionType) ? pureNameCollection : transactionType.code === "SA" ? notTagedItemCollection : itemsCollection;
    };




    /* ================================
       Load Transaction Data When Selected
    ================================ */

    // This useEffect loads transaction data when transactionsById changes
    // useEffect(() => {
    //     if (!transactionsById || !selectedTransactionId) return;

    //     setEditingRowsData(transactionsById);
    //     handleEditTransaction(transactionsById, selectedTransactionId);

    // }, [transactionsById]); // ✅ fresh data arrival drives this, not the ID

    const handleRowClick = (row: any, clickedTransactionType: string) => {
        setEditingState({
            rowId: row.__rowId,
            transactionType: clickedTransactionType
        });

    };

    const handleCancelEdit = useCallback(() => {

        // Clear editing state
        setEditingState({ rowId: null, transactionType: null });
        resetDraftRowTempId();
        setSingleSearch("");
        setDeselectFlag(true);
        setTimeout(() => setDeselectFlag(false), 50);
    }, [editingState]);



    const { loadTransaction } = useLoadSalesTransaction();



    const handleEditTransaction = useCallback((data: any, sno: string) => {

        // CLEAR EVERYTHING
        setDraftRows([]);
        setSelectedTransactionTypes([]);

        setEditingSno(null);

        requestAnimationFrame(() => {

            setOpeningBalance(data, true);
            setEditingSno(sno);

            const result = loadTransaction(data, sno);

            if (!result) return;

            // FORCE NEW REFERENCES
            const freshRows = [...(result.rows || [])];

            const freshTypes = [
                ...(result.selectedTransactionTypes || [])
            ];

            setSelectedTransactionTypes(freshTypes);
            setDraftRows(freshRows);
            setPrintData(data);
            // resolveLoader("success" ,"get");
            toaster.create({ title: "Transaction Loaded Successfully" })
        });


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


        setSelectedTransactionId(null); // Clear selected transaction ID when changing types
    };


    /* ================================
          CLOSING DETAILS FORM
       ================================ */
    const { closingDetails, setClosingDetails, resetBalance } = useSalesBalanceSummary();

    const totalFinalStoneAmount = useMemo(() => {
        return draftRows
            .filter(row => row.TRANSACTION_TYPE === "SA")
            .reduce((sum, item) => sum + (Number(item.STNAMT) || 0), 0);
    }, [draftRows]);




    useConversionSync(Number(headerForm.RATEGM || 0));
    useGstConversion(Number(totalFinalStoneAmount || 0));

    const { closingPure, closingCash } = useClosingCalculation(closingDetails, openingBalances, Number(headerForm.RATEGM || 0));


    // ✅ Always reads latest — even before re-render
    const getClosingDetailsPayload = (): ClosingDetails => {
        const d = closingDetails;

        const cleanBankDetails = (rows: any[] = []) =>
            rows.map(({ ID, DRAFTROWID, ...rest }) => rest);

        return {
            CONVTYPE: d.CONVTYPE,
            CONVAMT: Number(d.CONVAMT || 0),
            CONVWT: Number(d.CONVWT || 0),
            DISCAMT: Number(d.DISCAMT || 0),
            DISCWT: Number(d.DISCWT || 0),

            GSTPER: Number(d.GSTPER),
            GSTAMT: Number(d.GSTAMT),
            TDSPER: Number(d.TDSPER || 0),
            TDSAMT: Number(d.TDSAMT || 0),

            CASHPAID: Number(d.CASHPAID || 0),
            CASHRCVD: Number(d.CASHRCVD || 0),
            BANKPAID: Number(d.BANKPAID || 0),
            BANKRCVD: Number(d.BANKRCVD || 0),
            BANKPAIDDETAILS: cleanBankDetails(d.BANKPAIDDETAILS),
            BANKRCVDDETAILS: cleanBankDetails(d.BANKRCVDDETAILS),
        };
    };

    const { createRowFromStock } = useLoadSalesStock();

    const handleLoadFromStock = (stockRow: any) => {

        const issueStock = isIssueStock(stockRow);

        if (stockRow.PCS <= 0 || stockRow.weight <= 0) {
            return;
        }

        const targetType = issueStock
            ? SALETRANSACTIONTYPES.find(t => t.key === "issue")
            : SALETRANSACTIONTYPES.find(t => t.key === "sales");


        if (!targetType) {
            toaster.create({
                title: "Transaction Type Missing",
                type: "warning",
            });
            return;
        }

        // check open
        if (!selectedTransactionTypes.some(t => t.value === targetType.value)) {
            setSelectedTransactionTypes([
                ...selectedTransactionTypes,
                targetType
            ])
        }

        let availability = null;

        if (issueStock) {
            console.log(stockRow, 'vstockRow')
            const pureId = stockRow.pureId;
            const touch = stockRow.aTouch;

            console.log(pureId, 'pureIdpureId');


            availability = getStockAvailability(pureId, touch);

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
    };


    /* ================================
       Calculate Availability For Stock While Editing
    ================================ */

    const originalTransactionData = editingRowsData ? editingRowsData : [{}];
    console.log(editingRowsData, 'editingRowsData')

    /*--------------------------------STOCK CHECKING------------------------ */

    const {
        transactionKeys,
    
        getStockAvailability,
        getAvailableWeight,
        getAvailablePieces,
        validateQuantity,

    } = useStockAvailability({
        transactionCode: selectedTransactionTypes.map(t => t.code),
        pureStockList,
        itemsStockList,
        draftRows,
        SALETRANSACTIONTYPES,
        isEditMode: isEditing, // Enable edit mode if editing
        originalTransactionData, // Pass the original transaction data
    });


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

    const isDraftRowsChanged = useCallback(() => {
        return !lodash.isEqual(
            initialDraftRowsRef.current ?? [],
            draftRows ?? []
        );
    }, [draftRows]);

    const isClosingChanged = useCallback(() => {


        const isBalanceSame = Number(openingBalances.openPure || 0) === Number(closingPure || 0) && Number(openingBalances.openCash || 0) === Number(closingCash || 0);



        const hasAnyValue =
            Number(closingDetails.CONVAMT || 0) > 0 ||
            Number(closingDetails.CONVWT || 0) > 0 ||
            Number(closingDetails.CASHPAID || 0) > 0 ||
            Number(closingDetails.CASHRCVD || 0) > 0 ||
            Number(closingDetails.BANKPAID || 0) > 0 ||
            Number(closingDetails.BANKRCVD || 0) > 0 ||
            Number(closingDetails.TDSPER || 0) > 0 ||
            Number(closingDetails.TDSAMT || 0) > 0 ||
            Number(closingDetails.GSTPER || 0) > 0 ||
            Number(closingDetails.GSTAMT || 0) > 0 ||
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
            SALE_TRANSACTION_KEY_MAP,
            SALETRANSACTIONTYPES,
            getStockAvailability,
            isIssueType,
            isSRBillTag

        });

        if (!validation.valid) {
            return { valid: false, error: validation.error };
        }

        const transactionDetails: SaleTransactionItems = buildTransactionPayload({
            draftRows,
            SALE_TRANSACTION_KEY_MAP,
            normalizeRowForApi,
        });


        const payload: CreateSaleTransaction = {
            TRANSACTION_HEADER: {
                ACCODE: Number(headerForm.CUSTOMER),
                TRANDATE: headerForm.DATE,
                BILLNO: headerForm.BILLNO ? Number(headerForm.BILLNO) : undefined,
                RATE: headerForm.RATEGM ? Number(headerForm.RATEGM) : undefined,
                REMARK: headerForm.REMARK,
                THRU: headerForm.THRU
            },
            TRANSACTION_DETAILS: transactionDetails,
            CLOSING_DETAILS: getClosingDetailsPayload(),
        };

        return { valid: true, payload };
    };

    const handleReSelectTransaction = async () => {

        const currentId = selectedTransactionId;

        if (!currentId) return;

        // clear UI
        setDraftRows([]);
        setSelectedTransactionTypes([]);
        setEditingSno(null);

        // remove current selection first
        setSelectedTransactionId(null);

        requestAnimationFrame(() => {
            setSelectedTransactionId(currentId);
        });
    };

    const handleResetDraft = () => {

        setSelectedTransactionId(null);

        setEditingState({ rowId: null, transactionType: null });
        resetDraftRowTempId();

        setSingleSearch("");
        setDeselectFlag(true);
        setTimeout(() => setDeselectFlag(false), 50);

        setEditingSno(null);

        resetHeader();
        resetBalance();
        resetStore();
        goldStockRefetch();
        itemStockRefetch();


        if (isEditing) {
            stopEdit();
            refetchTransactionHeaderDetail();

            // toaster.create({
            //     title: "Edit Cancelled",
            //     description: "Transaction edit has been cancelled.",
            //     type: "info",
            // });
        } else {
            localStorage.removeItem(TYPE_KEY);
            setSelectedTransactionId('');
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

        // ✅ Open loader in save mode
        openLoader("save");

        createTransaction.mutate(
            { payload: result.payload, TRANTYPE: "sales" },
            {
                onSuccess: () => {
                    setEditingState({ rowId: null, transactionType: null });

                    // Defer cleanup until after the loader finishes
                    setTimeout(() => {
                        handleResetDraft();
                        resolveLoader("success", "save");
                    }, 500);

                    // ✅ Resolve to success — loader auto-closes after 2s

                },

                onError: (error: any) => {

                    setTimeout(() => {
                        openingBalanceRefetch();
                        resolveLoader("error", "save", error?.message || "Failed to save transaction.");
                    }, 500);

                },
            }
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // handleUpdateTransaction — updated
    // ─────────────────────────────────────────────────────────────────────────────

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

        console.log(result.payload, 'update tran')

        // ✅ Open loader in update mode
        openLoader("update");

        try {
            await updateTransaction.mutateAsync({
                entryNo: Number(headerForm.ENTRYNO),
                payload: result.payload,
                TRANTYPE: "sales",
            });

            setEditingSno(null);



            // Defer cleanup until after the loader finishes
            setTimeout(() => {
                goldStockRefetch();
                itemStockRefetch();
                openingBalanceRefetch();
                resetStore();
                resetBalance();
                // setIsOpenSalesSaveModal(false);
                handleResetDraft();

            }, 500);
            setTimeout(() => {
                // ✅ Resolve to success
                resolveLoader("success", "update");
            }, 600);
        } catch (error: any) {
            // ✅ Resolve to error


            setTimeout(() => {
                openingBalanceRefetch();
                // setIsOpenSalesSaveModal(false);
            }, 500);
            setTimeout(() => {
                resolveLoader("error", "update", error?.message || "Failed to update transaction.");
            }, 600);
        }
    };
  
    const onSelectTransaction = (id: string) => {

        if (draftRows.length > 0 && !isEditing) {

            toaster.create({
                title: "Warning",
                description:
                    "You have unsaved changes in the draft. Please save or reset before switching transactions.",
                type: "warning",
                duration: 2000
            });

            setDeselectFlag(true);

            setTimeout(() => setDeselectFlag(false), 10);

            return;
        }

        // openLoader("get");

        // ONLY SET ID
        setSelectedTransactionId(id);
    };

    useEffect(() => {

        if (!selectedTransactionId) return;

        if (isFetching) return;

        if (!isSuccess || !transactionsById) {

            resolveLoader("error", "get");

            return;
        }

        setEditingRowsData(transactionsById);

        handleEditTransaction(
            transactionsById,
            selectedTransactionId
        );

        resolveLoader("success", "get");

    }, [
        selectedTransactionId,
        transactionsById,
        isFetching,
        isSuccess
    ]);

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

    const handleSave = isEditing
        ? handleUpdateTransaction
        : handleSaveTransaction;

    const handleReset = isEditing
        ? (isModifying ? handleResetDraft : handleReSelectTransaction)
        : handleResetDraft;

    const shortcuts = [
        { keys: "Alt S", label: "Save" },
        { keys: "Alt U", label: "Update" },
        { keys: "Alt C", label: "Clear" },
        { keys: "Alt M", label: "Modify" },
        { keys: "F1", label: "FilterOpen / Close" },
        { keys: "Alt I", label: "Issue" },
        { keys: "Alt T", label: "Receipt" },
        { keys: "Alt P", label: "Sales" },
        { keys: "Alt R", label: "Sales Return" },

    ];


    return (
        <>

            <Flex gap={1}>
                <TransactionLoader
                    isOpen={isOpen}
                    status={status}
                    title={title}
                    description={description}
                    onClose={closeLoader}
                />

                {/* LEFT – 70% */}
                <Box display='flex' gap={1} width={'100%'}>
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
                            isDraftRowChanged={isDraftRowsChanged()}

                        />
                        <ShortcutDialog

                            shortcuts={shortcuts}


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
                            onSave={handleSave}
                            onReset={handleReset}
                            isSaving={
                                createTransaction.isPending || updateTransaction.isPending
                            }
                            acCode={headerForm.CUSTOMER}
                            draftRows={draftRows}
                            onPrint={() => {
                                setShowPrintModal(prev => !prev)
                            }}

                            isModifying={isModifying}
                            startModify={startModify}
                            stopModify={stopModify}
                        />




                        {/* Draft Section - show separate tables for each transaction type */}
                        {(selectedTransactionTypes?.length > 0) && (
                            <Box display="flex" flexWrap="wrap">
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
                                                borderColor={theme.colors.greyColor}
                                                flex={'100%'}
                                            >
                                                <DraftTransactionTable
                                                    rows={typeRows}
                                                    editingState={editingState}
                                                    isEditing={isEditing}
                                                    onRowClick={handleRowClick}
                                                    onCancelEdit={handleCancelEdit}
                                                    itemsCollection={activeCollection}
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
                                                    isModifying={isModifying}
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
                        initialFilters={saleFilter}
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
                        headerForm={headerForm}
                        onFormChange={setHeaderField}
                    />

                </Box>

                <Box width={'15%'}>
                    <TransactionListing
                        transactionIdsList={transactionIdsList}
                        handleEditTransaction={onSelectTransaction}
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
            {/* 
            <SalesSaveModal 
                headerForm={headerForm}
                isOpen={openSalesSaveModal}
                isClose={closeSalesSaveModal}
                onConfirm={confirmSalesSaveModal}
                onFormChange={setHeaderField}
            /> */}

        </>

    );
}