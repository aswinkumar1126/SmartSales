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
import lodash from "lodash";

import { useTheme } from "@/context/theme/themeContext";
import { toaster } from "@/components/ui/toaster";
import { useListCollection, useFilter } from "@chakra-ui/react";
import { useOpeningBalance } from "@/hooks/balance/useOpeningBalance";

// Components
import TransactionHeaderForm from "./TransactionHeaderForm/TransactionHeaderForm";
import TransactionTypeSelector from "./TransactionTypeSelector/TransactionTypeSelector";
import DraftTransactionTable from "./DraftTransactionTable/DraftTransactionTable";
import RightSideDetailsPanel from "./RightSideDetailsPanel/RightSideDetailsPanel";
import StockDrawer from "./DrawerTable/StockTable";
import { useAllMetals } from "@/hooks/metal/useMetals";
import Loader from "@/component/loader/Loader";
import BalanceSummary, { ClosingFormDetails } from "./Balance/BalanceSummary";
import { TransactionListing } from "./TransactionList/TransactionIdsListing";
import { SalesSearch } from "./Search/SalesSearch";

//Key Management
import { useGlobalKey } from "@/components/key/useGlobalKey";

// Hooks

import { useTransactions } from "@/hooks/transaction/useTransactions";
import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";
import { useItems, useStoneItems } from "@/hooks/item/useItems";
import { useCreateTransactions, useUpdateTransaction, useTransactionByTransId } from "@/hooks/transaction/useTransactions";
import { usePureGoldData, usePureGoldNames } from "@/hooks/pureGoldMast/usePureGoldMastData";
import { useActiveOtherCharges } from "@/hooks/otherCharges/useOtherCharges";
import { useRates } from "@/hooks/rate/useRate";
import { useOrnamentData } from "@/hooks/ornament/useOrnamentData";
import { useTagEntryNos, useTagedDetailsByTagNo } from "@/hooks/tag/useTag";
import { useAllBankAccounts, useBankAccount } from "@/hooks/bankAccount/useBankAccount";


/*-------------------  *STORAGE*  --------------------------*/
import { useSessionStorage } from "@/hooks/storage/useSessionStorage";


// Types & Constants
import { TransactionType, UpdateTransactionPayload, TransactionKey, CreateTransaction, TransactionItems, TRANSACTION_KEY_MAP, ClosingDetails ,WeightInfo , purchasereturnPayload ,purchasePayload} from "@/types/transcation/Transaction";
import { SALETRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import { BankTransaction } from "./Balance/BankTransactionModal";
import { SaleTransactionType } from "@/types/transcation/SaleTransaction";
import { SaleTransactionKey, SaleTransactionItems, SALE_TRANSACTION_KEY_MAP, SALESTRANSACTIONITEMS, CreateSaleTransaction } from "@/types/transcation/SaleTransaction";

//Utilities
import { formatToFixed} from '@/utils/format/numberFormat';

import { getTagDetails } from "@/service/TagedService";



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

interface DateRangeType {
    startDate: string | null;
    endDate: string | null;
}
interface SalesFilter {
    fromDate: string;
    toDate: string;
    weight: string;
    pureId: string;
    itemId: string;
    accode: string;
}

/* ================================
   Main Component
================================ */

export default function SalesPage() {
    const today = new Date().toISOString().split("T")[0];

    const isFirstRender = useRef(true);
    const initialDraftRowsRef = useRef<any[]>([]);
    const initialClosingRef = useRef<ClosingDetails>(null);

    /* ================================
       Session Storage Keys (All in one place)
    ================================ */

    const HEADER_KEY = "sale_transaction_header";
    const DRAFT_KEY = "sale_transaction_draft";
    const TYPE_KEY = "sale_transaction_type";
    const DATE_RANGE_KEY = "sale_transaction_date_range";
    const ITEMID_KEY = "sale_transaction_itemid";
    const FILTER_KEY = "sale_show_filter";
    const EDITING_KEY = "sale_isEditing";
    const EDITING_SNO_KEY = "sale_editing_sno";
    const SALE_STONE_MASTER_KEY = "SALE_STONE_MASTER";
    const MISC_CHARGE_KEY = "sale_MISC_CHARGE_MASTER";
    const CLOSING_DETAILS_KEY = "sale_CLOSING_DETAILS";
  
    const TRANSACTION_LIST_SEARCH = "sale_transaction_list_search";
    const ISTAG = 'sale_is_tag';


  
    // const [itemsStockList, setItemsStockList] = useState<{ label: string, value: string }[]>([]);

    const TRANSACTIONTYPES_ORDER = ["SA" ,"SR","IS" ,"RE"];


    const openFilter = () => setIsFilterOpen(true);
    const closeFilter = () => setIsFilterOpen(false);

    const draftRowTempId = useRef<string | null>(null);

    const [editingState, setEditingState] = useState<{
        rowId: string | null;
        transactionType: string | null;
    }>({ rowId: null, transactionType: null });



    /*------------------- LOCAL STATE NON-PERSISTENT -------------------------------*/
    
    // Regular state (non-persistent)
    const [accCode, setAccCode] = useState<number | undefined | null | string>();
    const [loading, setLoading] = useState<boolean>(true);
    const [saleCustomerList, setSaleCustomerList] = useState<{ label: string, value: string }[]>([]);
    const [filter, setFilter] = useState<string>('');
    const [isStockDrawerOpen, setIsStockDrawerOpen] = useState(false);
    const [showStock, setShowStock] = useState<string>("PURE");
    const [pureGoldList, setPureGoldList] = useState<{ label: string, value: string }[]>([]);
    const [metalList, setMetalList] = useState<{ label: string, value: string }[]>([]);
    const [otherCharges, setOtherCharges] = useState<{ label: string, value: string }[]>([]);
    const [metalId, setMetalId] = useState<string | undefined>();
    const [transactionResetSignal, setTransactionResetSignal] = useState(false);
    const [selectedName, setSelectedName] = useState<string | undefined>();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [apiBalanceOpening, setApiBalanceOpening] = useState({ openPure: 0, openCash: 0 });
    const [openingBalances, setOpeningBalances] = useState({ openPure: 0, openCash: 0 });

    const [closingCash, setClosingCash] = useState(0);
    const [closingPure, setClosingPure] = useState(0);

    const [singleSearch, setSingleSearch] = useSessionStorage<string>(TRANSACTION_LIST_SEARCH,'');
    const [deselectFlag, setDeselectFlag] = useState(false);

    const [saleFilter, setSaleFilter] = useState<SalesFilter>({
            fromDate:today,
            toDate: today,
            weight:'',
            pureId:'',
            itemId:'',
            accode:''
        })
    



    const {data:metalRates ,isLoading:metalRatesLoading ,isError:metalRatesError} = useRates();


    /*-------------------PERSISTENT STATE-------------------------------*/


    const [showFilter, setShowFilter] = useSessionStorage <boolean>(FILTER_KEY, false);

    const [itemCode, setItemCode] = useSessionStorage<number|null> (ITEMID_KEY, null);

    const [isEditing, setIsEditing] = useSessionStorage(EDITING_KEY, false);

    const [editingSno, setEditingSno] = useSessionStorage<string|null>(EDITING_SNO_KEY, null);

    const [dateRange, setDateRange] = useSessionStorage<DateRangeType>(DATE_RANGE_KEY, {
        startDate: null,
        endDate: null
    });

    const [isTag ,setIsTag] = useSessionStorage<boolean>(ISTAG , true);



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
    const [headerForm, setHeaderForm] = useSessionStorage( HEADER_KEY, {
        ENTRYNO: "",
        BILLNO: "",
        DATE: new Date().toISOString().split("T")[0],
        RATEGM: "", 
        CUSTOMER: "",
        CUSTOMER_NAME: "",
    }  );

    useEffect(() => {
        if (!metalRates) return;

        // Only set RATEGM if empty
        if (!headerForm.RATEGM) {
            const apiRate = formatToFixed(metalRates["GOLD 916.00"], 2);
            setHeaderForm(prev => ({ ...prev, RATEGM: apiRate }));
        }
    }, [metalRates, headerForm.RATEGM]);

    useEffect(() => {
        // Get accCode from headerForm after session storage loads
        if (headerForm.CUSTOMER && !accCode) {
            setAccCode(Number(headerForm.CUSTOMER));
        }
    }, [headerForm.CUSTOMER]);


    const [closingDetails, setClosingDetails] = useSessionStorage<ClosingFormDetails>(
        CLOSING_DETAILS_KEY,
        {
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
        }
    );


    // Transaction type & draft state
    const [selectedTransactionTypes, setSelectedTransactionTypes] = useSessionStorage<SaleTransactionType[]>(TYPE_KEY, []);


    // Draft rows (local storage backed)
    const [draftRows, setDraftRows] = useState<any[]>([]);
 

    const { theme } = useTheme();
    const { data: itemsData } = useStoneItems();


    const filters = {
        accountType: "CR"
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



    const { data: pureStockList = [], refetch: goldStockRefetch } = usePureGoldData(filter,cleanedFilters);
    const {data : itemsStock ,refetch: itemStockRefetch  } = useOrnamentData(filter);



    const { data: allPureGoldNames } = usePureGoldNames();

    const { data: transactionsById, isLoading: getbySnoLoading } = useTransactionByTransId(selectedTransactionId,"sales");



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

    const { data: openingBalance ,refetch:openingBalanceRefetch  } = useOpeningBalance(Number(accCode));

    console.log(saleFilter,'saleFilter')

    // Note: This hook might need to be updated to handle multiple transaction types
    const { data: transactionList, isLoading, refetch: refetchTransactionList } = useTransactions({
        TRANTYPE: "sales",
        trantype: null,
        accode: saleFilter.accode ? Number(saleFilter.accode) : null,
        startdate: saleFilter.fromDate || null,
        enddate: saleFilter.toDate || null,
        itemid: saleFilter.itemId ? Number(saleFilter.itemId) : null,
    });
  

  const { data: transactionHeaderDetail, isLoading: transactionHeaderLoading, refetch: refetchTransactionHeaderDetail } = useTransactions({
        TRANTYPE: "sales",
        accode:headerForm.CUSTOMER ? Number(headerForm.CUSTOMER) : null
    })


    const transactionIdsList = useMemo(() => {
        const list = transactionList?.data?.snoList;
        if (!list || !Array.isArray(list)) return [];

        return list.map((item: any) => ({
            label: item,
            value: item,
        }));
    }, [transactionList]);

    useEffect(() => {
        if (!headerForm.CUSTOMER) {
            // Clear both BILLNO and ENTRYNO when no customer is selected
            setHeaderForm(prev => ({
                ...prev,
                BILLNO: "",
                ENTRYNO: ""
            }));
        }
        
        else if (transactionHeaderDetail?.data?.BILLNO && !isEditing) {
            // Set both BILLNO and ENTRYNO when transaction data is available
            setHeaderForm(prev => ({
                ...prev,
                ENTRYNO: transactionHeaderDetail.data.ENTRYNO,
                BILLNO: transactionHeaderDetail.data.BILLNO,
            }));
        }
    }, [transactionHeaderDetail?.data, headerForm.CUSTOMER, isEditing]);
    // Note: Using transactionList?.data as dependency instead of just BILLNO

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

    useGlobalKey("F1" ,()=>openFilter() ,"openFilter");


    const getUsedQuantityByPureId = useCallback((pureId: string | number, options?: {
        excludeRowId?: string,
        transactionTypeCode?: string,
        field?: 'WT' | 'PCS' | 'NETWT'
    }) => {
        const pureIdStr = String(pureId);
        const { excludeRowId, transactionTypeCode, field = 'WT' } = options || {};


        const filteredRows = draftRows.filter(row => {
            // Skip the excluded row
            if (excludeRowId && row.__rowId === excludeRowId) {
                return false;
            }

            // Match PUREID
            if (String(row.PUREID|| row.ITEMID )  !== pureIdStr) {
                return false;
            }

            // Find the transaction type
            const transactionType = SALETRANSACTIONTYPES.find(t => t.value === row.TRANSACTION_TYPE);
            if (!transactionType) {
                return false;
            }
            if (transactionTypeCode && transactionType.value !== transactionTypeCode) {
              
                return false;
            }

          
            return true;
        });

        const sum = filteredRows.reduce((sum, row) => {
            const value = Number(row[field]) || 0;
            // console.log(`Adding ${field}:`, value, 'from row:', row.__rowId);
            return sum + value;
        }, 0);

        

        return sum;
    }, [draftRows]);



    const getStockAvailability = useCallback((pureId: string | number | null, options?: {
        excludeRowId?: string,
        transactionTypeCode?: string,
        isEditing?: boolean,
        originalValue?: number
    }) => {
        if (!pureId) return undefined;

        console.log('getStockAvailability called with:', { pureId, options })
        const { excludeRowId, transactionTypeCode, originalValue } = options || {};
        const isIssue = transactionTypeCode === "IS";
        const isSales = transactionTypeCode === "SA";

        let stock = null;
        let totalAvailableWeight = 0;
        let totalAvailablePieces = 0;
        let stockSource = '';
        console.log()

        if (isIssue) {
            // ISP uses pureStockList
            stock = pureStockList.find((s: any) => String(s.pureId) === String(pureId));
            console.log(stock,'stockstock')
            if (!stock) return undefined;

            totalAvailableWeight = Number(stock.weight || 0);
            stockSource = 'pure';
        } else if (isSales) {
            // PR uses itemsStockList
            stock = itemsStockList.find((s: any) => {
                return String(s.itemId) === String(pureId) || String(s.pureId) === String(pureId);
            });

            if (!stock) return undefined;

            totalAvailablePieces = Number(stock.pcs || stock.pieces || stock.quantity || 0);
            totalAvailableWeight = Number(stock.netwt || stock.netWeight || stock.purewt || 0);

            stockSource = 'items';
        } else {
            return undefined;
        }

        // Calculate used quantities based on transaction type
        let usedWeight = 0;
        let usedPieces = 0;

        if (isIssue) {
            usedWeight = getUsedQuantityByPureId(pureId, {
                excludeRowId,
                transactionTypeCode: "ISP",
                field: 'WT'
            });

            usedPieces = getUsedQuantityByPureId(pureId, {
                excludeRowId,
                transactionTypeCode: "ISP",
                field: 'PCS'
            });
        } else if (isSales) {
            usedWeight = getUsedQuantityByPureId(pureId, {
                excludeRowId,
                transactionTypeCode: "PR",
                field: 'NETWT'
            });

            usedPieces = getUsedQuantityByPureId(pureId, {
                excludeRowId,
                transactionTypeCode: "PR",
                field: 'PCS'
            });
        }

        return {
            stock,
            stockSource,
            transactionTypeCode,
            isIssue,
            isSales,

            weight: {
                total: totalAvailableWeight,
                used: usedWeight,
                remaining: Math.max(totalAvailableWeight - usedWeight, 0)
            },

            pieces: {
                total: totalAvailablePieces,
                used: usedPieces,
                remaining: Math.max(totalAvailablePieces - usedPieces, 0)
            },

            // For backward compatibility
            total: totalAvailableWeight,
            used: usedWeight,
            remaining: Math.max(totalAvailableWeight - usedWeight, 0),
            usedPieces,
            remainingPieces: Math.max(totalAvailablePieces - usedPieces, 0)
        };
    }, [pureStockList, itemsStockList, getUsedQuantityByPureId]);
         



    // Separate helper functions for specific use cases
    const getAvailableWeight = useCallback((pureId: string | number | null, options?: {
        excludeRowId?: string,
        transactionTypeCode?: string
    }) => {
        const availability = getStockAvailability(pureId, options);
        return availability?.weight.remaining ?? null;
    }, [getStockAvailability]);

    const getAvailablePieces = useCallback((pureId: string | number | null, options?: {
        excludeRowId?: string,
        transactionTypeCode?: string
    }) => {
        const availability = getStockAvailability(pureId, options);
        return availability?.pieces.remaining ?? null;
    }, [getStockAvailability]);

    // Validation function for forms
    const validateQuantity = useCallback((pureId: string | number | null, value: number, options: {
        transactionTypeCode: string,
        field: 'WT' | 'PIECES' | 'NETWT',
        excludeRowId?: string,
        originalValue?: number
    }) => {
        if (!pureId) return true;

        const availability = getStockAvailability(pureId, {
            excludeRowId: options.excludeRowId,
            transactionTypeCode: options.transactionTypeCode,
            originalValue: options.originalValue
        });

        if (!availability) return true; // No stock record, assume valid

        if (options.transactionTypeCode === "ISP") {
            // ISP validation
            if (options.field === 'WT') {
                return value <= availability.weight.remaining;
            } else if (options.field === 'PIECES') {
                return value <= availability.pieces.remaining;
            }
        } else if (options.transactionTypeCode === "PR") {
            // PR validation
            if (options.field === 'NETWT') {
                return value <= availability.weight.remaining;
            } else if (options.field === 'PIECES') {
                return value <= availability.pieces.remaining;
            }
        }

        return false; // Unsupported transaction type or field
    }, [getStockAvailability]);

    // Helper to get stock based on transaction type
    const getStockForTransaction = useCallback((pureId: string | number, transactionTypeCode: string) => {
        if (transactionTypeCode === "ISP") {
            return pureStockList.find((s: any) => String(s.pureId) === String(pureId));
        } else if (transactionTypeCode === "PR") {
            return itemsStockList.find((s: any) =>
                String(s.itemId) === String(pureId) || String(s.pureId) === String(pureId)
            );
        }
        return null;
    }, [pureStockList, itemsStockList]);

    
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

        // console.log({
        //     openPure: parseFloat(openPure.toFixed(3)),
        //     openCash: parseFloat(openCash.toFixed(2))
        // }, 'final opening balances');

        return {
            openPure: parseFloat(openPure.toFixed(3)),
            openCash: parseFloat(openCash.toFixed(2))
        };
    }
    // console.log(accCode, apiBalanceOpening,'apiBalanceOpening')


    // Single useEffect to calculate balances when either draftRows or API balances change
    useEffect(() => {
        if (apiBalanceOpening.openPure !== undefined && apiBalanceOpening.openCash !== undefined) {
            const balances = calculateOpeningBalances(
                draftRows,
                apiBalanceOpening.openPure,
                apiBalanceOpening.openCash  // ✅ Fixed: Now using openCash, not openPure
            );

        if(!isEditing){
            setOpeningBalances(balances);
        }
            

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
    const isIssueType = (transactionType: SaleTransactionType) => {
        console.log(transactionType,'transactionTypetransactionType')
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
            HMC:"",
            RATE:  "",
            MCHARGE: "",
            WASTAGE: "",
            DESCRIPTION:"",
            TAGNO:"",
        };
    };
  



    const handleClearRowsForType = (transactionType: SaleTransactionType) => {
        setDraftRows(prev => prev.filter(row => row.TRANSACTION_TYPE !== transactionType.value));
        setEditingState({ rowId: null, transactionType: null })
        // setEditingRowId(null);
        resetDraftRowTempId(); // Reset temp ID when clearing
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
       Local Storage Persistence
    ================================ */



    // Load from localStorage on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        const savedType = localStorage.getItem(TYPE_KEY);

      
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setDraftRows(parsed);
                // console.log('parsed')
            } catch (e) {
                console.error("Failed to parse draft:", e);
                localStorage.removeItem(DRAFT_KEY);
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
            // localStorage.removeItem(HEADER_KEY);
            localStorage.removeItem(TYPE_KEY);
            localStorage.removeItem(DATE_RANGE_KEY);
        };
    }, []);

    // Save to localStorage on changes
    useEffect(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftRows));
    }, [draftRows]);

    console.log(selectedTransactionTypes,'selectedTransactionTypes')

    useEffect(() => {
        if (selectedTransactionTypes.length > 0) {
            localStorage.setItem(TYPE_KEY, JSON.stringify(selectedTransactionTypes));
        } else {
            localStorage.removeItem(TYPE_KEY);
        }
    }, [selectedTransactionTypes]);


 
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
        if (editingState.rowId?.toString().startsWith('draft-form-') && editingState.transactionType) {
            setDraftRows(prev => prev.filter(
                row => !(row.__rowId === editingState.rowId && row.TRANSACTION_TYPE === editingState.transactionType)
            ));
        }

        // Clear editing state
        setEditingState({ rowId: null, transactionType: null });
        resetDraftRowTempId();
        setSingleSearch("");
        setDeselectFlag(true);
        setTimeout(() => setDeselectFlag(false), 50);
    }, [editingState]);

    const handleEditTransaction = useCallback((transactionData: any, sno: string) => {
   
        console.log(transactionData,'transactionData')
        if (!transactionData) {
            return;
        }

        // Set editing mode and SNO
        setIsEditing(true);
        setEditingSno(sno);
        setSelectedTransactionId(sno);


        // After setAccCode(transactionDetails.ACCODE);

        // Try different possible data structures
        const transactionHeaderDetails = transactionData.TRANSACTION_HEADER;
        const transactionClosingDetails = transactionData.CLOSING_DETAILS;
        const transactionBalanceDetails = transactionData.BALANCE;

        // Collect ALL transaction types that have data
        let transactionTypes: string[] = [];
        let allTransactionItems: any[] = [];

        // ✅ Load closing details from transaction header
      

        // Check if TRANSACTION_DETAILS exists and has data
        if (transactionData.TRANSACTION_DETAILS) {
            const details = transactionData.TRANSACTION_DETAILS;

            // Load purchase items
            if (details.sales && details.sales.length > 0) {
                transactionTypes.push('SA');
                allTransactionItems = [...allTransactionItems, ...details.sales.map((item: any) => ({
                    ...item,
                    _type: 'SA'
                }))];
            }

            // Load issue items
            if (details.issue && details.issue.length > 0) {
                transactionTypes.push('IS');
                allTransactionItems = [...allTransactionItems, ...details.issue.map((item: any) => ({
                    ...item,
                    _type: 'IS'
                }))];
            }

            // Load purchase return items
            if (details.sales_return && details.sales_return.length > 0) {
                transactionTypes.push('SR');
                allTransactionItems = [...allTransactionItems, ...details.sales_return.map((item: any) => ({
                    ...item,
                    _type: 'SR'
                }))];
            }

            // Load receipt items
            if (details.receipt && details.receipt.length > 0) {
                transactionTypes.push('RE');
                allTransactionItems = [...allTransactionItems, ...details.receipt.map((item: any) => ({
                    ...item,
                    _type: 'RE'
                }))];
            }
        }

        // Remove duplicate transaction types
        const uniqueTransactionTypes = [...new Set(transactionTypes)];

        console.log('Detected transaction types:', uniqueTransactionTypes);
        console.log('Total transaction items:', allTransactionItems.length);

        // 1. Load transaction details into header form
        if (transactionHeaderDetails) {
            setHeaderForm(prev => ({
                ...prev,
                CUSTOMER: transactionHeaderDetails.ACCODE ? String(transactionHeaderDetails.ACCODE) : "",
                CUSTOMER_NAME: transactionHeaderDetails.ACNAME || "",
                DATE: transactionHeaderDetails.TRANDATE || new Date().toISOString().split("T")[0],
                BILLNO: transactionHeaderDetails.BILLNO || "",
                ENTRYNO: transactionHeaderDetails.ENTRYNO || "",
                RATEGM: transactionHeaderDetails.RATE || transactionHeaderDetails.RATEGM || prev.RATEGM,
            }));

            setAccCode(transactionHeaderDetails.ACCODE);
            
            if (transactionClosingDetails) {
                const loadedClosingDetails: ClosingFormDetails = {
                    convType: transactionClosingDetails.CONVTYPE || "",
                    convAmt: transactionClosingDetails.CONVAMT ? String(transactionClosingDetails.CONVAMT) : "",
                    convWt: transactionClosingDetails.CONVWT ? String(transactionClosingDetails.CONVWT) : "",
                    discAmt: transactionClosingDetails.DISCAMT ? String(transactionClosingDetails.DISCAMT) : "",
                    discWt: transactionClosingDetails.DISCWT ? String(transactionClosingDetails.DISCWT) : "",
                    cashPaid: transactionClosingDetails.CASHPAID ? String(transactionClosingDetails.CASHPAID) : "",
                    cashRcvd: transactionClosingDetails.CASHRCVD ? String(transactionClosingDetails.CASHRCVD) : "",
                    bankPaid: transactionClosingDetails.BANKPAID ? String(transactionClosingDetails.BANKPAID) : "",
                    bankRcvd: transactionClosingDetails.BANKRCVD ? String(transactionClosingDetails.BANKRCVD) : "",
                    bankPaidDetails: transactionClosingDetails.bankPaidDetails || [],
                    bankRcvdDetails: transactionClosingDetails.bankRcvdDetails || [],
                };

                // ✅ Set in parent state
                setClosingDetails(loadedClosingDetails);
                closingDetailsRef.current = loadedClosingDetails;

                // ✅ Persist to localStorage so refresh restores it
                localStorage.setItem("CLOSING_DETAILS", JSON.stringify(loadedClosingDetails));

                // ✅ Also persist bank details under their stable keys
                const accCode = transactionHeaderDetails.ACCODE;
                if (accCode) {
                    if (loadedClosingDetails.bankPaidDetails.length > 0) {
                        localStorage.setItem(
                            `BANK_PAID_bank-paid-${accCode}`,
                            JSON.stringify(loadedClosingDetails.bankPaidDetails)
                        );
                    }
                    if (loadedClosingDetails.bankRcvdDetails.length > 0) {
                        localStorage.setItem(
                            `BANK_RECEIVED_bank-rcvd-${accCode}`,
                            JSON.stringify(loadedClosingDetails.bankRcvdDetails)
                        );
                    }
                }
            }
            // Set ALL transaction types that are present
            if (uniqueTransactionTypes.length > 0) {
                const foundTypes = SALETRANSACTIONTYPES.filter(t => uniqueTransactionTypes.includes(t.code));

                console.log(foundTypes,'foundTypes')
                if (foundTypes.length > 0) {
                    setSelectedTransactionTypes(foundTypes);
                    // console.log('Set transaction types to:', foundTypes);
                }
            }
        }

        // 2. Load Opening Balance 
        if(transactionBalanceDetails){
            setOpeningBalances(
                {
                    openCash:transactionBalanceDetails.openingCash,
                    openPure: transactionBalanceDetails.openingPure 
                }
            )
        } 

        // 3. Load ALL transaction items into draft rows and load stones/charges into localStorage
        if (allTransactionItems && allTransactionItems.length > 0) {
            const allStones: any[] = [];
            const allCharges: any[] = [];

            const newDraftRows = allTransactionItems.map((item: any, index: number) => {
                const itemType = item._type;
                const isIssue = itemType === "IS" || itemType === "RE";

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
                localStorage.setItem(SALE_STONE_MASTER_KEY, JSON.stringify(allStones));
                // console.log('Loaded stones to localStorage:', allStones);
            } else {
                localStorage.removeItem(SALE_STONE_MASTER_KEY);
            }

            // Save charges to localStorage
            if (allCharges.length > 0) {
                localStorage.setItem("MISC_CHARGE_MASTER", JSON.stringify(allCharges));
                // console.log('Loaded charges to localStorage:', allCharges);
            } else {
                localStorage.removeItem("MISC_CHARGE_MASTER");
            }

            setDraftRows(newDraftRows);

           
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
            localStorage.removeItem(SALE_STONE_MASTER_KEY);
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


    const handleCustomerSelect = (customerValue: string, customerLabel: string) => {
        if (isEditing) return; // skip if editing

        setHeaderForm(prev => ({
            ...prev,
            CUSTOMER: customerValue || "",
            CUSTOMER_NAME: customerLabel || "",
        }));

        setAccCode(customerValue ? Number(customerValue) : "");

        setTimeout(() => {
            refetchTransactionHeaderDetail();
        }, 100);
    };

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

    
        setSelectedTransactionTypes(types);

       

        setSelectedTransactionId(null);
    };


    /* ================================
          CLOSING DETAILS FORM
       ================================ */
   

    const closingDetailsRef = useRef(closingDetails);

    useEffect(() => {
        closingDetailsRef.current = closingDetails;
    }, [closingDetails]);

    const handleClosingDetailsChange = (field: string, value: any) => {
        setClosingDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Calculate closing balances whenever relevant data changes
useEffect(() => {
    if (!openingBalances) return;

    const cashRcvd = parseFloat(closingDetails.cashRcvd || "0") || 0;
    const cashPaid = parseFloat(closingDetails.cashPaid || "0") || 0;
    const bankRcvd = closingDetails.bankRcvdDetails.reduce((sum, t) => sum + (t.amount || 0), 0);
    const bankPaid = closingDetails.bankPaidDetails.reduce((sum, t) => sum + (t.amount || 0), 0);

    let convAmt = parseFloat(closingDetails.convAmt || "") || 0;
    let convWt = parseFloat(closingDetails.convWt || "") || 0;
    const conversionType = closingDetails.convType;
    const rate = Number(headerForm.RATEGM) || 0;

    // Auto-calculate based on conversion type
    if (rate > 0) {
        if (conversionType === "P" && convWt > 0) {
            const calculatedAmt = convWt * rate;
            if (calculatedAmt.toFixed(2) !== closingDetails.convAmt) {
                // Update the field with calculated value
                handleClosingDetailsChange("convAmt", calculatedAmt.toFixed(2));
            }
            convAmt = calculatedAmt;
        } else if (conversionType === "C" && convAmt > 0) {
            const calculatedWt = convAmt / rate;
            if (calculatedWt.toFixed(3) !== closingDetails.convWt) {
                // Update the field with calculated value
                handleClosingDetailsChange("convWt", calculatedWt.toFixed(3));
            }
            convWt = calculatedWt;
        }
    }

    let newClosingCash = (openingBalances.openCash || 0) + cashRcvd + bankRcvd - cashPaid - bankPaid;
    let newClosingPure = (openingBalances.openPure || 0);

    if (conversionType === "C") {
        newClosingCash -= convAmt;
        newClosingPure += convWt;
    }
    if (conversionType === "P") {
        newClosingCash += convAmt;
        newClosingPure -= convWt;
    }

    if (!isFinite(newClosingCash)) newClosingCash = 0;
    if (!isFinite(newClosingPure)) newClosingPure = 0;

    setClosingCash(Number(newClosingCash.toFixed(2)));
    setClosingPure(Number(newClosingPure.toFixed(3)));

}, [closingDetails, openingBalances, headerForm.RATEGM]);

    // Handle bank paid save (from modal)
    const handleBankPaidSave = (transactions: BankTransaction[], total: number) => {
        setClosingDetails(prev => ({
            ...prev,
            bankPaid: total.toString(),
            bankPaidDetails: transactions
        }));
    };

    // Handle bank received save (from modal)
    const handleBankRcvdSave = (transactions: BankTransaction[], total: number) => {
        setClosingDetails(prev => ({
            ...prev,
            bankRcvd: total.toString(),
            bankRcvdDetails: transactions
        }));
    };

    // Fix the accCode reset effect
    useEffect(() => {
        
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Only reset if accCode is explicitly null/undefined AND we have no stored data
        if (!accCode) {
            // Check if we have stored data first
            const storedData = sessionStorage.getItem(CLOSING_DETAILS_KEY);

            if (!storedData) {
                const resetDetails = {
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
                };
                setClosingDetails(resetDetails);
                closingDetailsRef.current = resetDetails;
                setClosingCash(0);
                setClosingPure(0);
            }
        }
    }, [accCode, setClosingDetails]);

  
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

        console.log(targetType,'targetTypetargetType')

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
            const availability = getStockAvailability(pureId , {transactionTypeCode: targetType.value} );

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
        setDraftRows(prev => [...prev, newRow]);
        setEditingState({rowId:rowId, transactionType: targetType.key});
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

                const transactionType = SALETRANSACTIONTYPES.find(t => t.value === row.TRANSACTION_TYPE);
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
                                    SALETRANSACTIONTYPES.find(t => t.value === r.TRANSACTION_TYPE && isIssueType(t))) {
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

                    if (field === "AWT" || field === "ATOUCH") {
                        const wt = Number(row.AWT) || 0;
                        const touch = Number(row.ATOUCH) || 0;
                        if (!row.__manual_APUREWT) {
                            row.APUREWT = ((wt * touch) / 100).toFixed(3);
                        }
                    }
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
    const calculateTotalsForType = (transactionType: SaleTransactionType) => {
        const typeRows = draftRows.filter(row => row.TRANSACTION_TYPE === transactionType.value);
        

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

     const normalizeRowForApi = (
        row: any,
        tranType: SaleTransactionKey,
        editTransaction?: boolean
    ): any => {
        const {
            __rowId,
            __isNew,
            __previewSno,
            __manual_AWT,
            __manual_ATOUCH,
            __manual_APUREWT,
            _stones,
            _miscCharges,
            ...rest
        } = row;

        if (tranType === "issue" || tranType === "receipt") {
            // Generic weight-based transaction
            return {
                PUREID: rest.PUREID ? Number(rest.PUREID) : undefined,
                WT: Number(rest.WT || 0),
                TOUCH: Number(rest.TOUCH || 0),
                PUREWT: Number(rest.PUREWT || 0),
                AWT: Number(rest.AWT || 0),
                ATOUCH: Number(rest.ATOUCH || 0),
                APUREWT: Number(rest.APUREWT || 0),
            } as WeightInfo;
        }

        if (tranType === "sales") {
            const payload: SALESTRANSACTIONITEMS = {
                ITEMID: rest.ITEMID ? Number(rest.ITEMID) : null,
                PCS: Number(rest.PCS || 0),
                GRSWT: Number(rest.GRSWT || 0),
                STNWT: Number(rest.STNWT || 0),
                NETWT: Number(rest.NETWT || 0),
                WASTYPE: String(rest.WASTYPE || "TOUCH"),
                TOUCH: Number(rest.TOUCH || 0),
                PUREWT: Number(rest.PUREWT || 0),
                HMC: Number(rest.HMC || 0),
                STNAMT: Number(rest.STNAMT || 0),
                MC: Number(rest.MC || 0),
                ...(editTransaction && { SNO: String(rest.SNO || "") }),
                ...(rest.DESCRIPTION && { DESCRIPTION: rest.DESCRIPTION }),
                ...(_stones && _stones.length > 0 && {
                    STONEDETAILS: _stones.map((stone: any) => ({
                        stoneId: stone.stoneId,
                        subStoneId: stone.subStoneId,
                        stonePcs: stone.stonePcs,
                        stoneWeight: stone.stoneWeight,
                        stoneUnit: stone.stoneUnit,
                        stoneCalculation: stone.stoneCalculation,
                        stoneRate: stone.stoneRate,
                        stoneAmount: stone.stoneAmount,
                    })),
                }),
                ...(_miscCharges && _miscCharges.length > 0 && {
                    OTHERCHARGESDETAILS: _miscCharges.map((charge: any) => ({
                        chargeId: Number(charge.chargeName),
                        chargeAmount: Number(charge.amount),
                    })),
                }),
            };
            return payload;
        }

        if (tranType === "sales_return") {
            const payload: SALESTRANSACTIONITEMS = {
                ITEMID: rest.ITEMID ? Number(rest.ITEMID) : null,
                TAGNO: rest.TAGNO || "",
                PCS: Number(rest.PCS || 0),
                GRSWT: Number(rest.GRSWT || 0),
                STNWT: Number(rest.STNWT || 0),
                NETWT: Number(rest.NETWT || 0),
                WASTYPE: String(rest.WASTYPE || "TOUCH"),
                TOUCH: Number(rest.TOUCH || 0),
                PUREWT: Number(rest.PUREWT || 0),
                HMC: Number(rest.HMC || 0),
                STNAMT: Number(rest.STNAMT || 0),
                MC: Number(rest.MC || 0),
                ...(editTransaction && { SNO: String(rest.SNO || "") }),
                ...(rest.DESCRIPTION && { DESCRIPTION: rest.DESCRIPTION }),
            };
            return payload;
        }

        return null;
    };


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

        if (!validateDraftRows()) return;

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

        const transactionDetails: SaleTransactionItems = {};

        draftRows.forEach(row => {
            const mappedType = SALE_TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];
            console.log(mappedType ,'mappedTypeAtsave')
            if (!mappedType) return;

            if (!transactionDetails[mappedType]) transactionDetails[mappedType] = [];

            const rowStones = stonesByDraftRowId[row.__rowId] || [];

            const validStones = rowStones.filter((stone: any) =>
                stone.stoneId &&
                stone.stonePcs > 0 &&
                stone.stoneWeight > 0 &&
                stone.stoneRate > 0
            );

            const rowCharges = row._miscCharges || chargesByDraftRowId[row.__rowId] || [];

            const validCharges = rowCharges.filter((charge: any) =>
                charge.id &&
                Number(charge.amount) > 0
            );

            const normalized = normalizeRowForApi(
                row,
                mappedType 
            );

            const rowWithStones = {
                ...normalized,
                ...(validStones.length > 0 && {
                    STONEDETAILS: validStones.map((stone: any) => ({
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

        console.log(payload ,'createTransactionPayload')
     
        createTransaction.mutate({payload:payload , TRANTYPE:"sales"}, {
            onSuccess: () => {

                setDraftRows([]);
                setEditingState({ rowId: null, transactionType: null });

                localStorage.removeItem(SALE_STONE_MASTER_KEY);
                localStorage.removeItem(DRAFT_KEY);
                localStorage.removeItem(CLOSING_DETAILS_KEY);
                
                localStorage.removeItem(`BANK_PAID_bank-paid-${accCode}`);
                localStorage.removeItem(`BANK_RECEIVED_bank-rcvd-${accCode}`);

               toaster.create({
                    title: "Transaction Saved",
                    description: "Transaction saved successfully",
                    type: "success",
                });

                goldStockRefetch();
                itemStockRefetch();
                openingBalanceRefetch();
                setSelectedTransactionId(null);
                setSelectedTransactionTypes([]);
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
                setTransactionResetSignal((prev) => !prev)
             
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

            console.group(draftRows,'draftRowsforUpdate')

            draftRows.forEach(row => {
                const mappedType = SALE_TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];
                console.log(mappedType, row.TRANSACTION_TYPE, 'mappedType')
                if (!mappedType) return;

                if (!transactionDetails[mappedType]) transactionDetails[mappedType] = [];

            
                const normalized = normalizeRowForApi(row, mappedType, true);

          
                (transactionDetails[mappedType] as any[]).push(normalized);
            });

            console.log(transactionDetails,'transactionDetailsforUpdate')
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
                RATEGM: metalRates ? formatToFixed(metalRates["GOLD 916.00"], 2) : "",
            });

            // Clear local storage keys
            [
                DRAFT_KEY,
                // HEADER_KEY,
                TYPE_KEY,
                DATE_RANGE_KEY,
                // ITEMID,
                // FILTER,
                // EDITING,
                // EDITING_SNO,
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
   
        setSingleSearch("");
        setDeselectFlag(true);
        setTimeout(() => setDeselectFlag(false), 50);

        if (isEditing) {
            setHeaderForm(prev => ({
                ...prev,
                CUSTOMER: "",
                CUSTOMER_NAME: "",
                BILLNO: "",
                DATE: new Date().toISOString().split("T")[0],
                RATEGM: metalRates ? formatToFixed(metalRates["GOLD 916.00"], 2) : ""
            }));
            setIsEditing(false);
            setEditingSno(null);
            setSelectedTransactionId(null);
            setSelectedTransactionTypes([]);
            setAccCode(null);
            refetchTransactionHeaderDetail();


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
        if (transactionId === String(transactionId)) {
            // Same ID clicked again — force re-fetch by resetting first
            setSelectedTransactionId('');
            console.log(transactionId,'transactionId')
            setTimeout(() => setSelectedTransactionId(String(transactionId)), 0);
            return;
        }
        setSelectedTransactionId(transactionId);
        // Clear any existing draft first
        setDraftRows([]);
        setIsEditing(false);

    }, []);

    const handleSingleSearch = (term: string) => {
        setSingleSearch(term);
        setDeselectFlag(false); // reset deselect flag whenever typing
    };

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


    const handleTagChange = () => setIsTag(prev => !prev);

    const handleTagNoLookup = useCallback(
        async (id: string) => {

        if (!id?.trim()) return null;
        const response = await getTagDetails(id, Number(headerForm.CUSTOMER) ,true );
        const data=response.data ;

        console.log(data,'tagResponse')

        if (!data) return null;

        return {
                GRSWT: Number(data.GRSWT) || 0,
                STNWT: Number(data.STNWT) || 0,
                NETWT: Number(data.NETWT) || 0,
                WASPER: Number(data.WASPER) || 0,
                DIAWT: Number(data.DIAWT) || 0,
                MC: Number(data.MC) || 0,
                TOUCH: Number(data.TOUCH) || 0,
                SALESSTNWT: Number(data.SALESSTNWT) || 0,
                SIZEID: Number(data.SIZEID) || 0,
                ITEMID: data.ITEMID ? String(data.ITEMID) : undefined,
                PCS: 1,
                TAGNO:String(data.TAGNO),
                stoneDetails: data.STNDETAILS || [],
                // otherChargesDetails: stockRow.otherChargesDetails || [],
            };
        }    
  ,
    [headerForm.CUSTOMER] // ✅ IMPORTANT
);

    console.log(draftRows,'draftRowsdraftRows')
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
                        onFormChange={handleHeaderChange}
                        onCustomerSelect={handleCustomerSelect}
                        customerCollection={saleCustomerList}
                        getLabelByValue={getLabelByValue}
                        theme={theme}
                        openingBalance={isEditing ? openingBalances : apiBalanceOpening}
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
                            showFilter={showFilter}
                            handleShowFilter={openFilter}
                            isEditing={isEditing}
                            onSave={isEditing ? handleUpdateTransaction : handleSaveTransaction}
                            onReset={handleResetDraft}
                            isSaving={
                                createTransaction.isPending || updateTransaction.isPending
                            }
                            acCode={headerForm.CUSTOMER}
                            draftRows ={draftRows}
                            setDraftRows={setDraftRows}

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
                                    .map(code => selectedTransactionTypes?.find(t => t.value === code))
                                    .filter((t): t is SaleTransactionType => !!t)
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
                                                                        const allStones = JSON.parse(localStorage.getItem(SALE_STONE_MASTER_KEY) || "[]");

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
                                                                        localStorage.setItem(SALE_STONE_MASTER_KEY, JSON.stringify(finalStones));

                                                                        // Update the STNWT field in the draft row
                                                                        if (formData._stoneTotalWeight) {
                                                                            newRow.STNWT = formData._stoneTotalWeight.toFixed(3);
                                                                        }
                                                                    } else {
                                                                        // Create empty stone row for non-issue types if no stones
                                                                        if (!isIssueType(transactionType)) {
                                                                            const stoneRow = createEmptyStoneRow(permanentId);
                                                                            const existingStones = JSON.parse(localStorage.getItem(SALE_STONE_MASTER_KEY) || "[]");
                                                                            existingStones.push(stoneRow);
                                                                            localStorage.setItem(SALE_STONE_MASTER_KEY, JSON.stringify(existingStones));
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
                                                            transactionTitle={transactionType?.label}
                                                            transactionType={transactionType?.code}
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
                        onClose={()=>setIsFilterOpen(false)}
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
                        closingDetails={closingDetails}
                        onClosingDetailsChange={handleClosingDetailsChange}
                        accCode={Number(accCode)}
                        rate={Number(headerForm.RATEGM)}
                        closingCash={closingCash}      // Pass calculated closing cash
                        closingPure={closingPure}      // Pass calculated closing pure
                        transactionResetSignal={transactionResetSignal}
                        onBankPaidSave={handleBankPaidSave}
                        onBankRcvdSave={handleBankRcvdSave}
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