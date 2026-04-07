"use client";

/*-------------- REACT & STATE --------------*/
import React, {
    useEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
} from "react";
import { Box, Table, Text, Button, Portal, Drawer, Icon ,VStack ,HStack ,Spinner, Span } from "@chakra-ui/react";
import JSZip from "jszip";
import { saveAs } from "file-saver";


/*-------------- COMPONENTS -----------------*/
import { CustomTable } from "@/component/table/CustomTable";
import SummaryTable from "@/component/table/SummaryTable";
import TransactionTable from "@/component/table/TransactionTable";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { toaster } from "@/components/ui/toaster";
import { SingleCheckbox } from "@/components/ui/CheckBox";

/*-------------- TYPES ----------------------*/
import { BarcodeHeaderFormInterface } from "@/types/barcode/HeaderForm";
import type { CellChange, ChangeSource } from "handsontable/common";
import { getTagedEntryNoParams, getTagedEntryNoParamsForApi } from "@/types/tagging/Tag";

/*-------------- HOOKS ----------------------*/

import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";
import { useBarcodeItems, useCreateTag } from "@/hooks/barcode/useBarcodeItems";
import { useSessionStorage } from "@/hooks/storage/useSessionStorage";
import { useTheme } from "@/context/theme/themeContext";
import { useSoftControlById } from "@/hooks/softControl/useSoftControl";
import { useTagEntryNos, useTagedDetailsByEntryNo } from "@/hooks/tag/useTag";
import { useSize } from "@/hooks/size/useSize";
import { useActivePrinter } from "@/hooks/print/usePrint";


/*-------------- CONSTANTS ------------------*/
import { transactionTableCols } from "@/data/barcodeGenerate/barcodeFormFields";

/*-------------- UTILITIES ------------------*/
import { formatToFixed } from "@/utils/format/numberFormat";

/*-------------- ASSETS ---------------------*/
import Image from "next/image";
import saveIcon from "@/asserts/icons/save.png";
import updateIcon from '@/asserts/icons/update.png';
import clearIcon from "@/asserts/icons/clear.jpeg";

/*-------------- PAGE COMPONENTS ------------*/
import BarcodeHeaderForm from "./BarcodeHeaderForm/BarCodeHeaderForm";
import BarCodeExcel, { type ExcelRowData, type ExcelData } from "./excel/BarCodeExcel";
import { BarcodeTagListing } from "./BarcodeTagListing/BarcodeTagList";


/*----------------- IMAGE -------------------*/
import { Printer } from "lucide-react";
import { FaDownload } from "react-icons/fa"; // download icon

/* ============================================================
   CONSTANTS
   ============================================================ */



const BARCODE_HEADER_KEY = "barcode_header_form";
const BARCODE_TRANSACTIONS_KEY = "barcode_transactions";

const BARCODE_PRINT_KEY = "barcode_print_key";

const BARCODE_PRINT_DETAILS = "barcode_print_details";

const BARCODE_EDITING_KEY = "barcode_editing_key";

const BARCODE_EDITING_ENTRY_NO ="barcode_editing_entry_no";

const BARCODE_ENTRY_LIST_SINGLE_SEARCH = "tag_items_single_search";


/* ============================================================
    BARCODE PRINTER 
   ============================================================ */

const APP_NAME = "tag";

const FILES = {
    BAT: `${APP_NAME}.BAT`,
    REG: `${APP_NAME}.REG`,
    SOURCE_TXT: "barcode.txt",
    DEST_TXT: "CTR.txt",
};

const PATHS = {
    DOWNLOADS: "%USERPROFILE%\\Downloads",
    BAT_PATH: `%USERPROFILE%\\Downloads\\${FILES.BAT}`,
    SOURCE_PATH: `%USERPROFILE%\\Downloads\\${FILES.SOURCE_TXT}`,
    DEST_PATH: `%USERPROFILE%\\Downloads\\${FILES.DEST_TXT}`,
};

const PROTOCOL = {
    NAME: APP_NAME,                 // SmartSales://
    REG_KEY: `HKEY_CLASSES_ROOT\\${APP_NAME}`,
};

const buildProtocolUrl = (action: string) =>
    `${PROTOCOL.NAME}://${action}`;


const FIELD_ORDER = [
   "barcode",  "grsweight", "stoneWt", "salesStoneWt", "wastePercent",
    "size", "diamondWt", "mc", "touch",
] as const;

type FieldKey = (typeof FIELD_ORDER)[number];

const NUMERIC_FIELDS = new Set([
    "grsweight", "stoneWt", "salesStoneWt", "wastePercent", "diamondWt", "mc", "touch",
]);
const REQUIRED_FIELDS = new Set(["grsweight", "stoneWt", "salesStoneWt"]);


const today = new Date().toISOString().split("T")[0];


const EMPTY_HEADER: BarcodeHeaderFormInterface = {
    ENTRYNO: "", DATE: today ,  COMPANYNAME: "", INWARDNO: "", ITEMNAME: "",
};
const EMPTY_TRANSACTION_FORM = {
    barcode: "", grsweight: "", stoneWt: "", salesStoneWt: "", wastePercent: "",
    size: "", diamondWt: "", mc: "", touch: "",
};
const EMPTY_ARRAY: never[] = [];

/* ============================================================
   UTILITIES
   ============================================================ */
const safeNum = (val: unknown): number => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

/* ============================================================
   TYPES
   ============================================================ */
interface BarcodeTransactionItem {
    id: string;
    draftRowId: string;
    grsweight: number;
    stoneWt: number;
    salesStoneWt: number;
    wastePercent: number;
    size: string;
    diamondWt: number;
    mc: number;
    touch: number;
    barcode: string;
    print?: boolean;
}

interface BarcodePrintingDetails {

    TAGNO: string;
    GRSWT: number;
    STNWT: number;
    WASPER: number;
    DIAWT: number;
    MC: number;
    TOUCH: number;
    SALESSTNWT: number;
    NETWT: number;
    SIZEID: number;
    UPTIME?: string;
    USERID?: number;
}

type TaggingErrors = Record<string, string>;

interface ValidateRowsParams {
    transactionRows?: BarcodeTransactionItem[];
    limitations: { PCS: number; STNWT: number };
    excelRows?: ExcelRowData[];
    isLoad?: boolean;
}

/* ============================================================
   COMPONENT
   ============================================================ */
function BarCodeGenerate() {

    const { theme } = useTheme();

    /* -------- Refs -------- */

    const isFirstRender = useRef(true);
    const rowsRef = useRef<BarcodeTransactionItem[]>([]);
    const weightRef = useRef<HTMLInputElement>(null);
    const stoneWtRef = useRef<HTMLInputElement>(null);
    const salesStoneWtRef = useRef<HTMLInputElement>(null);
    const wastePercentRef = useRef<HTMLInputElement>(null);
    const sizeRef = useRef<HTMLInputElement>(null);
    const diamondWtRef = useRef<HTMLInputElement>(null);
    const mcRef = useRef<HTMLInputElement>(null);
    const touchRef = useRef<HTMLInputElement>(null);
    const barcodeRef = useRef<HTMLInputElement>(null);

    const fieldRefs = useRef<Record<FieldKey, React.RefObject<HTMLInputElement | null>>>({
        barcode: barcodeRef,
        grsweight: weightRef, 
        stoneWt: stoneWtRef, 
        salesStoneWt: salesStoneWtRef,
        wastePercent: wastePercentRef, 
        size: sizeRef, 
        diamondWt: diamondWtRef,
        mc: mcRef, 
        touch: touchRef, 
    });

    /* -------- Mutation -------- */
    const { mutate: createTag } = useCreateTag();

  

    /* -------- Session-persisted State -------- */
    const [barcodeHeaderForm, setBarcodeHeaderForm] = useSessionStorage<BarcodeHeaderFormInterface>(BARCODE_HEADER_KEY, EMPTY_HEADER);
    console.log(barcodeHeaderForm,'barcodeHeaderForm')

    const [transactionRows, setTransactionRows] = useSessionStorage<BarcodeTransactionItem[]>(
        BARCODE_TRANSACTIONS_KEY, EMPTY_ARRAY
    );

    const [printId, setPrintId] = useSessionStorage<number | null>(BARCODE_PRINT_KEY, null);
    const [printDetails, setPrintDetails] = useSessionStorage<BarcodePrintingDetails[] | [] >(BARCODE_PRINT_DETAILS, []);
    const [isEditing, setIsEditing] = useSessionStorage<boolean>(BARCODE_EDITING_KEY ,false);

    const [printIsEnable, setPrintIsEnable] = useState<boolean>(false);

    const [selectedEntryNo, setSelectedEntryNo] = useSessionStorage<string>(BARCODE_EDITING_ENTRY_NO, '');

    const [singleSearch, setSingleSearch] = useSessionStorage<string>(BARCODE_ENTRY_LIST_SINGLE_SEARCH,'')


    /* -------- Local State -------- */

    const [transactionFormData, setTransactionFormData] = useState(EMPTY_TRANSACTION_FORM);
    const [editId, setEditId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [taggingErrors, setTaggingErrors] = useState<TaggingErrors>({});
    const [excelImport, setExcelImport] = useState(false);
    // Flag to tell child to deselect
    const [deselectFlag, setDeselectFlag] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<number | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);

     

    

    const [tagNumberParams, setTagNumberParams] = useState<getTagedEntryNoParams>({

        FROMDATE:'',
        TODATE: '',
        ITEMID: '',
        ACCODE: '',
        ENTRYNO: '',
        WEIGHT: '',
        PUENTRYNO: '',
        TAGNO: '',
        SEARCH: '',

    });
    console.log(tagNumberParams, 'tagNumberParams')

    const handleFilterChange = useCallback((field: string, value: any) => {
        setTagNumberParams((prev) => ({
            ...prev,
            [field]: value
        }));
    }, []);
// Auto-refetch when filters change
    useEffect(() => {
        if (tagNumberParams) {
            tagEntryNoRefetch();
        }
    }, [tagNumberParams]);


    const [excelData, setExcelData] = useState<ExcelData>([]);


    /* -------- Data Fetching -------- */
    const { data: allPurchaseAccount } = useAllAccountHead("", {
        accountType:"PR",
    });
    const {data:printerSettings} = useActivePrinter();
    console.log(printerSettings, 'printerSettings')

    const printer = useMemo(()=>{
        return printerSettings ? printerSettings.data : null ;
    }, [printerSettings])

    const { data: sizes, isLoading: sizeDataLoading } = useSize('',selectedItemId);
    console.log(sizes,'sizessizes');

    const itemSizeList = useMemo(()=>{
        return Array.isArray(sizes) ? sizes.map((size) => ({
            label:size.SIZENAME,
            value:String(size.SIZEID)
        })):[]
    },[sizes]);
    console.log(itemSizeList,'itemSizeList')


    const barcodeQueryParams = useMemo(() => ({
        ACCODE: Number(barcodeHeaderForm.COMPANYNAME),
        PURCHASE_ENTRYNO: Number(barcodeHeaderForm.INWARDNO),
        SNO: String(barcodeHeaderForm.ITEMNAME),
        ISEDITING: isEditing ? true :false
    }), [barcodeHeaderForm.COMPANYNAME, barcodeHeaderForm.INWARDNO, barcodeHeaderForm.ITEMNAME, isEditing]);


    const { data: barcodeItems } = useBarcodeItems(barcodeQueryParams);

    const { data: softControlDataById } = useSoftControlById("LOT_TAG_CONTROL");
 
   
    // To this:
    const getFilteredParams = useCallback((): Partial<getTagedEntryNoParamsForApi> => {
        const filteredParams: Partial<getTagedEntryNoParamsForApi> = {};

        Object.entries(tagNumberParams).forEach(([key, value]) => {
            if (value === null || value === undefined) return;

            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed) return;

                (filteredParams as any)[key] = trimmed;
            } else if (typeof value === 'number') {
                (filteredParams as any)[key] = value;
            }
        });

        return filteredParams;
    }, [tagNumberParams]);

    console.log(getFilteredParams(),'filterParams')

    // Use filtered params for API call
    const { data: tagEntryNos, isLoading: tagEntryNosLoading, isError: tagEntryNosError, refetch: tagEntryNoRefetch } = useTagEntryNos(getFilteredParams());

    console.log(tagEntryNos, 'tagEntryNos');

    const { data: tagedDetails, isLoading: tagedDetailsLoading, isError: tagedDetailsError } = useTagedDetailsByEntryNo(selectedEntryNo);
    console.log(tagedDetails ,'tagDetailsBySno');

    /* ============================================================
       EFFECTS
       ============================================================ */

    // Keep rowsRef in sync with transactionRows
    useEffect(() => { rowsRef.current = transactionRows; }, [transactionRows]);

    // Sync ENTRY_NO from API into header form (skip first render)
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        if (barcodeItems?.ENTRY_NO) {
            setBarcodeHeaderForm((prev) => ({ ...prev, ENTRYNO: String(barcodeItems.ENTRY_NO) }));
        }
    }, [barcodeItems?.ENTRY_NO, setBarcodeHeaderForm]);

    // Focus first field when editId changes or on mount
    useEffect(() => {
        const t = setTimeout(() => fieldRefs.current[FIELD_ORDER[0]]?.current?.focus(), 100);
        return () => clearTimeout(t);
    }, [editId]);

    useEffect(() => {
        if (printDetails) {
            setPrintIsEnable(true);
        } else {
            setPrintIsEnable(false);
        }
    }, []);

    /* ============================================================
       DERIVED DATA
       ============================================================ */

    const purchaserCollection = useMemo(() =>
        Array.isArray(allPurchaseAccount?.data?.acheads)
            ? allPurchaseAccount.data.acheads.map((i: any) => ({ label: i.ACNAME, value: i.ACCODE }))
            : EMPTY_ARRAY,
        [allPurchaseAccount?.data?.acheads]);

    const inwardCollection = useMemo(() =>
        Array.isArray(barcodeItems?.PURCHASE_ENTRY_NO)
            ? barcodeItems.PURCHASE_ENTRY_NO.map((i: number) => ({ label: `INWARD NO ${i}`, value: String(i) }))
            : EMPTY_ARRAY,
        [barcodeItems?.PURCHASE_ENTRY_NO]);

    const itemCollection = useMemo(() =>
        Array.isArray(barcodeItems?.ITEMLIST)
            ? barcodeItems.ITEMLIST.map((i: any) => ({ label: i.ITEMNAME, value: i.SNO, itemId: i.ITEMID }))
            : EMPTY_ARRAY,
        [barcodeItems?.ITEMLIST]);

    const itemSizeCollection = useMemo(() =>
        Array.isArray(barcodeItems?.SIZELIST)
            ? barcodeItems.SIZELIST.map((i: any) => ({ label: i.SIZENAME, value: String(i.SIZEID) }))
            : EMPTY_ARRAY,
        [barcodeItems?.SIZELIST]);

    const baseBarcodePrefix = useMemo(() => barcodeItems?.TAGNO?.PREFIX ?? "", [barcodeItems?.TAGNO?.PREFIX]);
    const startBarcodeNumber = useMemo(() => Number(barcodeItems?.TAGNO?.TAGNO ?? 0), [barcodeItems?.TAGNO?.TAGNO]);

    const itemId = useMemo(
        () => itemCollection.find((i: any) => i.value === barcodeHeaderForm.ITEMNAME)?.itemId ?? null,
        [barcodeHeaderForm.ITEMNAME, itemCollection]);

    const selectedItem = useMemo(() => barcodeItems?.SELECTED_ITEM ?? null, [barcodeItems?.SELECTED_ITEM]);
    const stockTableData = useMemo(() =>
        Array.isArray(selectedItem) ? selectedItem
            : selectedItem && typeof selectedItem === "object" ? [selectedItem]
                : EMPTY_ARRAY,
        [selectedItem]);

    console.log(selectedItem,'selectedItemselectedItem');

    useEffect(()=>{
        if(!selectedItem?.ITEMID) return;
        setSelectedItemId(selectedItem.ITEMID);
    }, [selectedItem])


    const tagItemList = useMemo(()=>{
        return Array.isArray(tagEntryNos) ? tagEntryNos : [] ;
    }, [tagEntryNos]);

    console.log(tagItemList,'tagItemList')

    /* ============================================================
       BARCODE REBUILD
       ============================================================ */
    const rebuildBarcodes = useCallback(
        (rows: BarcodeTransactionItem[]): BarcodeTransactionItem[] =>
            rows.map((row, i) => ({ ...row, barcode: `${baseBarcodePrefix}${startBarcodeNumber + i + 1}` })),
        [baseBarcodePrefix, startBarcodeNumber]);

    /* ============================================================
         PRINT CONFING
          ============================================================ */
        const TSPL_HEADER = `
            SIZE 97.5 mm, 25 mm
            DIRECTION 0,0
            REFERENCE 0,0
            OFFSET 0 mm
            SET PEEL OFF
            SET CUTTER OFF
            SET PARTIAL_CUTTER OFF
            SET TEAR ON
            CLS
            `;
                const generateLabelTSPL = (data: BarcodePrintingDetails) => {
                    return `
            QRCODE 766,166,L,3,A,180,M2,S7,"${data.TAGNO}"
            CODEPAGE 1252
            TEXT 691,161,"0",180,11,9,"size:${data.SIZEID}"
            TEXT 766,98,"0",180,10,7,"DONE_BY_SUGI"
            TEXT 766,75,"0",180,7,6,"Mc:${data.MC}"
            TEXT 766,56,"0",180,7,6,"GrsWt:${data.GRSWT}"
            TEXT 762,35,"0",180,9,10,"Wt:${data.STNWT}"
            TEXT 624,116,"0",90,8,6,"ASWIN"
            PRINT 1,1
            `;
        };

    const generateAllLabels = (dataArray: BarcodePrintingDetails[]) => {
        const labels = dataArray
            .map(item => generateLabelTSPL(item))
            .join("\n");

        return TSPL_HEADER + "\n" + labels;
    };

    const downloadTxt = (content: string, callback?: () => void) => {
        const blob = new Blob([content], { type: "text/plain" });
        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download = "barcode.txt"; // ✅ fixed name

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // ✅ small delay but controlled
        setTimeout(() => {
            callback && callback();
        }, 500);
    };

    const handlePrintTagDetails = () => {
        console.log("triggering the print");

        if (!printDetails?.length) {
            console.warn("No print data available");
            return;
        }

        const content = generateAllLabels(printDetails);
        console.log("Generated TSPL Content:", content);    

        downloadTxt(content, () => {
            console.log("Download triggered → calling protocol");

            setTimeout(()=>{
                window.location.href = buildProtocolUrl("launch");
            },800);
        });
    };
    
    /* ============================================================
       TABLE CONFIG
       ============================================================ */
    const transactionFormFields = useMemo(() =>
        transactionTableCols.map((col): any => {
            const isNum = NUMERIC_FIELDS.has(col.key);
            const isRequired = REQUIRED_FIELDS.has(col.key);
            const base: any = {
                key: col.key, 
                label: col.label || col.key, 
                placeholder: col.label || col.key,
                type: isNum ? "number" : "text", 
                isRequired, 
                size: "xs", 
                align: isNum ? "right" : "left",
                allowFocus:col.allowFocus

            };
            if (col.decimalScale) base.decimalScale = col.decimalScale;
          
            if (col.key === "size") return { ...base, type: "combobox" as const, align: "left", collection: itemSizeCollection };
            if (col.key === "wastePercent") return { ...base, type: "number", decimalScale: 2 };
            if (col.key === "barcode") return { ...base, type: "text", align: "left", disabled: true };
            if (col.key === "item") return { ...base, type: "text", align: "left", disabled: true, width: '80px' };
            return base;
        }),
        [itemSizeCollection]);

    const visibleFormFields = useMemo(
        () => transactionFormFields.filter((f: any) => f),
        [transactionFormFields]);

    console.log(visibleFormFields,'visibleFormFields')
    const allDisplayCols = useMemo(() => [

        ...transactionTableCols
            .filter(col => isEditing || col.key !== "__print")
            .map((col) => ({
                ...col,
                align:
                    col.key === "size" || col.key === "barcode"
                        ? "left" as const
                        : col.key === "__print"
                            ? "center" as const
                            : "right" as const,
            })),


    ], [isEditing]);


    const stockTableHeader = useMemo(() => [
        { key: "ITEMID", label: "ITEM ID", align: "start" as const },
        { key: "GRSWT", label: "GROSS WT", align: "end" as const, decimalScale: 3 },
        { key: "STNWT", label: "STONE WT", align: "end" as const, decimalScale: 3 },
        { key: "NETWT", label: "NET WT", align: "end" as const, decimalScale: 3 },
        { key: "WASTYPE", label: "WASTE TYPE", align: "center" as const },
        { key: "TOUCH", label: "TOUCH", align: "center" as const, decimalScale: 1 },
    ], []);

    const summaryRowData = useMemo(() => [
        { key: "PCS", label: "Pieces" },
        { key: "GRSWT", label: "Gross Wt" },
        { key: "STNWT", label: "Stone Wt" },
    ], []);

    const summaryColData = useMemo(() => [
        { key: "total", label: "LOT", align: "end" as const },
        { key: "completed", label: "COMPLETED", align: "end" as const },
        { key: "balance", label: "BALANCE", align: "end" as const },
    ], []);

    /* ============================================================
       TRANSACTION TOTALS
       ============================================================ */
    const transactionTotals = useMemo(() => ({
        grsweight: transactionRows.reduce((s, t) => s + t.grsweight, 0),
        stoneWt: transactionRows.reduce((s, t) => s + t.stoneWt, 0),
        salesStoneWt: transactionRows.reduce((s, t) => s + t.salesStoneWt, 0),
        diamondWt: transactionRows.reduce((s, t) => s + t.diamondWt, 0),
        mc: transactionRows.reduce((s, t) => s + t.mc, 0),
    }), [transactionRows]);

    /* ============================================================
       SUMMARY TABLE DATA
       ============================================================ */
    const tableData = useMemo(() => {
        const itemList = Array.isArray(selectedItem) ? selectedItem
            : selectedItem && typeof selectedItem === "object" ? [selectedItem] : [];
        const lot: Record<string, string> = {
            PCS: itemList.reduce((s, i) => s + safeNum(i?.PCS), 0).toString(),
            GRSWT: formatToFixed(itemList.reduce((s, i) => s + safeNum(i?.GRSWT), 0), 3),
            STNWT: formatToFixed(itemList.reduce((s, i) => s + safeNum(i?.STNWT), 0), 3),
            NETWT: formatToFixed(itemList.reduce((s, i) => s + safeNum(i?.NETWT), 0), 3),
        };
        const done: Record<string, string> = {
            PCS: transactionRows.length.toString(),
            GRSWT: formatToFixed(transactionRows.reduce((s, t) => s + t.grsweight, 0), 3),
            STNWT: formatToFixed(transactionRows.reduce((s, t) => s + t.stoneWt, 0), 3),
            NETWT: formatToFixed(transactionRows.reduce((s, t) => s + (t.grsweight - t.stoneWt), 0), 3),
        };

        const is3Dec = new Set(["GRSWT", "STNWT", "NETWT"]);
        const result: Record<string, { total: string; completed: string; balance: string }> = {};
        summaryRowData.forEach(({ key }) => {
            const t = Number(lot[key] ?? 0);
            const c = Number(done[key] ?? 0);
            const b = Math.max(0, t - c);
            const isPCS = key === "PCS";
            const sc = is3Dec.has(key) ? 3 : 2;
            result[key] = {
                total: isPCS ? Math.round(t).toString() : formatToFixed(t, sc),
                completed: isPCS ? Math.round(c).toString() : formatToFixed(c, sc),
                balance: isPCS ? Math.round(b).toString() : formatToFixed(b, sc),
            };
        });
        return result;
    }, [selectedItem, transactionRows, summaryRowData]);

    /* ============================================================
       SHOW/HIDE FORM ROW
       ============================================================ */
    const showTableForm = useMemo(
        () => transactionRows.length < safeNum(selectedItem?.PCS) || Boolean(editId),
        [selectedItem?.PCS, transactionRows.length, editId]);

    /* ============================================================
       CALLBACKS — EXCEL
       ============================================================ */

    /**
     * HotTable afterChange handler.
     * Immutably updates excelData without rebuilding the entire array every keystroke.
     */
    const handleExcelChange = useCallback(
        (changes: CellChange[] | null, _source: ChangeSource) => {
            if (!changes) return;
            setExcelData((prev) => {
                const next = prev.map((row) => [...row]);        // shallow-clone each row
                changes.forEach(([row, col, , newVal]) => {
                    while (next.length <= row) next.push([]);    // grow if HOT added a spare row
                    next[row][col as number] = newVal as string | number | null;
                });
                return next;
            });
        },
        []
    );

    /**
     * Called by BarCodeExcel's "Load into Table" button.
     * Converts ExcelRowData[] → BarcodeTransactionItem[], appends to existing rows,
     * rebuilds barcodes, persists to session storage, and closes the drawer.
     */


    const handleExcelLoad = useCallback(

        (parsedRows: ExcelRowData[]) => {
            if (!parsedRows.length) return;
            if (!validateTaggingHeaders()) {
                toaster.create({ title: "Validation Error", description: "Please fill all required header fields", type: "error", duration: 2000 });
                return;
            }
            const limits = { PCS: safeNum(selectedItem?.PCS), STNWT: safeNum(selectedItem?.STNWT) };

            console.log(parsedRows, 'parsedRows')

            if (!validateTaggingRows({
                transactionRows: rowsRef.current,   // ✅ FIXED
                excelRows: parsedRows,
                limitations: limits,
                isLoad: true
            })) return;
            const draftRowId = barcodeHeaderForm.ENTRYNO || String(Date.now());

            const newItems: BarcodeTransactionItem[] = parsedRows.map((r) => ({
                id: `excel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                draftRowId,
                grsweight: r.grsweight,
                stoneWt: r.stoneWt,
                salesStoneWt: r.salesStoneWt,
                wastePercent: r.wastePercent,
                size: r.size,
                diamondWt: r.diamondWt,
                mc: r.mc,
                touch: r.touch,
                barcode: "",   // rebuildBarcodes assigns the real value
            }));

            // Merge with any manually-entered rows, then resequence barcodes
            setTransactionRows(rebuildBarcodes([...rowsRef.current, ...newItems]));

            toaster.create({
                title: "Excel Imported",
                description: `${newItems.length} row(s) added from Excel`,
                type: "success",
                duration: 2500,
            });

            setExcelData([]);
            setExcelImport(false);   // close the drawer after a successful load
        },
        [barcodeHeaderForm.ENTRYNO, rebuildBarcodes, setTransactionRows]
    );

    /* ============================================================
       CALLBACKS — TRANSACTION FORM
       ============================================================ */

    const focusField = useCallback((key: FieldKey) => {
        const t = setTimeout(() => {
            fieldRefs.current[key]?.current?.focus?.();
            fieldRefs.current[key]?.current?.select?.();
        }, 50);
        return () => clearTimeout(t);
    }, []);

    const handleHeaderChange = useCallback(
        (field: string, value: unknown) => {
            setBarcodeHeaderForm((p) => ({ ...p, [field]: value }));
            setTaggingErrors({})
        }
        , [setBarcodeHeaderForm, taggingErrors]);

    const handleTransactionChange = useCallback((key: string, value: unknown) => {
        setTransactionFormData((p) => ({ ...p, [key]: value }));
        setTouched((p) => ({ ...p, [key]: true }));
        setErrors((p) => { if (!p[key]) return p; const n = { ...p }; delete n[key]; return n; });
    }, []);

    const resetTransactionForm = useCallback(() => {
        setTransactionFormData(EMPTY_TRANSACTION_FORM);
        setErrors({});
        setTouched({});
        setEditId(null);
    }, []);

    const validateTransactionForm = useCallback((): Record<string, string> => {
        const e: Record<string, string> = {};
        if (!transactionFormData.grsweight || Number(transactionFormData.grsweight) <= 0) e.grsweight = "Weight must be greater than 0";
        if (!transactionFormData.stoneWt || Number(transactionFormData.stoneWt) < 0) e.stoneWt = "Stone weight must be 0 or greater";
        if (!transactionFormData.salesStoneWt || Number(transactionFormData.salesStoneWt) < 0) e.salesStoneWt = "Sales stone weight must be 0 or greater";
        return e;
    }, [transactionFormData.grsweight, transactionFormData.stoneWt, transactionFormData.salesStoneWt]);

    const validateTaggingHeaders = useCallback((): boolean => {
        const e: TaggingErrors = {};
        if (!barcodeHeaderForm.COMPANYNAME) e.COMPANYNAME = "Purchaser is required";
        if (!barcodeHeaderForm.INWARDNO) e.INWARDNO = "Inward is required";
        if (!barcodeHeaderForm.ITEMNAME) e.ITEMNAME = "Item is required";
        setTaggingErrors(e);
        return !Object.keys(e).length;
    }, [barcodeHeaderForm.COMPANYNAME, barcodeHeaderForm.INWARDNO, barcodeHeaderForm.ITEMNAME]);

    const validateTaggingRows = ({
        transactionRows = [],
        limitations,
        excelRows = [],
        isLoad
    }: ValidateRowsParams): boolean => {

        const rowsToValidate = isLoad
            ? [...transactionRows, ...excelRows]
            : transactionRows;

        console.log("Validating rows:", rowsToValidate);

        if (!rowsToValidate.length) {
            toaster.create({
                title: "Validation Error",
                description: "At least one transaction row is required",
                type: "error",
                duration: 2000,
            });
            return false;
        }

        let totalPCS = 0;
        let totalStoneWt = 0;
        let hasError = false;

        rowsToValidate.forEach((row, idx) => {
            const n = idx + 1;

            if (!row.grsweight || row.grsweight <= 0) {
                hasError = true;
                toaster.create({ title: `Row ${n} Error`, description: "GRSWT must be greater than 0", type: "error", duration: 2000 });
            }


            if (row.stoneWt < 0) {
                hasError = true;
                toaster.create({ title: `Row ${n} Error`, description: "Stone Wt must be ≥ 0", type: "error", duration: 2000 });
            }

            if (
                row.stoneWt > row.grsweight
            ) {
                hasError = true;
                toaster.create({ title: `Row ${n} Error`, description: "Stone Wt cannot exceed  Gross Weight ", type: "error", duration: 2000 });
            }
            if (row.salesStoneWt > row.stoneWt) {
                hasError = true;
                toaster.create({ title: `Row ${n} Error`, description: "Sales Stone Wt cannot exceed Stone Wt", type: "error", duration: 2000 });
            }

            totalPCS++;
            totalStoneWt += row.stoneWt;
        });

        if (limitations.PCS && totalPCS > limitations.PCS) {
            toaster.create({
                title: "Lot PCS Error",
                description: `Total pieces ${totalPCS} exceed allowed PCS ${limitations.PCS}`,
                type: "error",
                duration: 2000,
            });
            return false;
        }

        if (limitations.STNWT && totalStoneWt > limitations.STNWT) {
            toaster.create({
                title: "Lot Stone Wt Error",
                description: `Total stone weight ${totalStoneWt.toFixed(3)} exceeds allowed STNWT ${limitations.STNWT}`,
                type: "error",
                duration: 2000,
            });
            return false;
        }

        return !hasError;
    };


    const handleTransactionSubmit = useCallback(() => {
        const newErrors = validateTransactionForm();
        if (Object.keys(newErrors).length) {
            setTouched(FIELD_ORDER.reduce((a, k) => ({ ...a, [k]: true }), {} as Record<string, boolean>));
            setErrors(newErrors);
            const first = FIELD_ORDER.find((k) => newErrors[k]);
            if (first) { focusField(first); toaster.create({ title: "Validation Error", description: newErrors[first], type: "error", duration: 2000 }); }
            return;
        }
        setIsSubmitting(true);
        try {
            const current = rowsRef.current;
            if (editId) {
                const existing = current.find((t) => t.id === editId);
                if (!existing) return;
                const updated = current.map((t) => t.id !== editId ? t : {
                    ...existing,
                    grsweight: Number(transactionFormData.grsweight),
                    stoneWt: Number(transactionFormData.stoneWt),
                    salesStoneWt: Number(transactionFormData.salesStoneWt),
                    wastePercent: Number(transactionFormData.wastePercent || 0),
                    size: transactionFormData.size,
                    diamondWt: Number(transactionFormData.diamondWt),
                    mc: Number(transactionFormData.mc),
                    touch: Number(transactionFormData.touch),
                });
                setTransactionRows(rebuildBarcodes(updated));
                setEditId(null);
                toaster.create({ title: "Row Updated", description: "Row has been updated successfully", type: "success", duration: 2000 });
            } else {
                const newRow: BarcodeTransactionItem = {
                    id: `barcode-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    draftRowId: barcodeHeaderForm.ENTRYNO || String(Date.now()),
                    grsweight: Number(transactionFormData.grsweight),
                    stoneWt: Number(transactionFormData.stoneWt),
                    salesStoneWt: Number(transactionFormData.salesStoneWt),
                    wastePercent: Number(transactionFormData.wastePercent || 0),
                    size: transactionFormData.size,
                    diamondWt: Number(transactionFormData.diamondWt),
                    mc: Number(transactionFormData.mc),
                    touch: Number(transactionFormData.touch),
                    barcode: "",
                };
                setTransactionRows(rebuildBarcodes([...current, newRow]));
                toaster.create({ title: "Row Added", description: "New row has been added successfully", type: "success", duration: 2000 });
            }
            resetTransactionForm();
            setTimeout(() => focusField(FIELD_ORDER[0]), 100);
        } finally {
            setIsSubmitting(false);
           
        }
    }, [validateTransactionForm, editId, transactionFormData, barcodeHeaderForm.ENTRYNO, rebuildBarcodes, setTransactionRows, resetTransactionForm, focusField]);

    const moveToNext = useCallback((currentKey: FieldKey) => {
        const idx = FIELD_ORDER.indexOf(currentKey);
        idx < FIELD_ORDER.length - 1 ? focusField(FIELD_ORDER[idx + 1]) : handleTransactionSubmit();
    }, [handleTransactionSubmit, focusField]);

    const handleClear = useCallback(() => {
        setBarcodeHeaderForm({ ...EMPTY_HEADER, DATE: new Date().toISOString().split("T")[0] });
        setTransactionRows([]);
        setIsEditing(false);
        setSelectedEntryNo('');
        setSingleSearch("");
        setDeselectFlag(true);
        setTimeout(() => setDeselectFlag(false), 50);
    }, [setBarcodeHeaderForm, setTransactionRows, setIsEditing, setSelectedEntryNo, setSingleSearch]);

    const handleEditRow = useCallback((row: BarcodeTransactionItem) => {
        setTransactionFormData({
            grsweight: row.grsweight.toString(),
            stoneWt: row.stoneWt.toString(),
            salesStoneWt: row.salesStoneWt.toString(),
            wastePercent: row.wastePercent.toString(),
            size: row.size,
            diamondWt: row.diamondWt.toString(),
            mc: row.mc.toString(),
            touch: row.touch.toString(),
            barcode: row.barcode,
        });
        setEditId(row.id);
        setErrors({});
        setTouched({});
        setTimeout(() => focusField(FIELD_ORDER[0]), 100);
    }, [focusField]);

    const handleDeleteRow = useCallback((row: BarcodeTransactionItem) => {
        if (!window.confirm("Delete this item?")) return;
        setTransactionRows(rebuildBarcodes(rowsRef.current.filter((t) => t.id !== row.id)));
        if (editId === row.id) resetTransactionForm();
        toaster.create({ title: "Row Deleted", description: "Row has been deleted successfully", type: "info", duration: 1000 });
    }, [editId, rebuildBarcodes, setTransactionRows, resetTransactionForm]);

    const handlePrint = useCallback((row: BarcodeTransactionItem) => {
        alert(`Printing barcode for item: ${row.barcode}`);
    }, []);

    console.log(transactionRows,'transactionRows')

    const handleSaveTransaction = useCallback(() => {
        if (!validateTaggingHeaders()) {
            toaster.create({ title: "Validation Error", description: "Please fill all required header fields", type: "error", duration: 2000 });
            return;
        }
        const limits = { PCS: safeNum(selectedItem?.PCS), STNWT: safeNum(selectedItem?.STNWT) };
        if (!validateTaggingRows({ transactionRows, limitations: limits })) return;

        const purchaseDetails = {
            TOTALPCS: transactionRows.length,
            ENTRYNO: Number(barcodeHeaderForm.ENTRYNO),
            PUENTRYNO: Number(barcodeHeaderForm.INWARDNO),
            ITEMID: itemId,
            ACCODE: Number(barcodeHeaderForm.COMPANYNAME),
            PUSNO: barcodeHeaderForm.ITEMNAME,
            TAGDATE: barcodeHeaderForm.DATE || new Date().toISOString().split("T")[0],
        };
        const taggingDetails = transactionRows.map((row) => ({
            TAGNO: row.barcode, 
            GRSWT: row.grsweight, 
            STNWT: row.stoneWt,
            WASPER: row.wastePercent, 
            DIAWT: row.diamondWt, 
            MC: row.mc,
            TOUCH: row.touch, 
            SALESSTNWT: row.salesStoneWt,
            NETWT: row.grsweight - row.stoneWt, 
            SIZEID: Number(row.size),
        }));

        createTag({ PURCHASEDETAILS: purchaseDetails, TAGGINGDETAILS: taggingDetails }, {
            onSuccess: (res) => {
                toaster.create({
                    title: "Success",
                    description: "Tagging created successfully",
                    type: "success",
                    duration: 2000
                });

                setBarcodeHeaderForm({ ...EMPTY_HEADER, DATE: new Date().toISOString().split("T")[0] });
                setTransactionRows([]);

                console.log("API Response:", res);

                // ✅ get printId from response
                setPrintId(res?.data?.ENTRYNO);

                setPrintDetails(res?.data?.TAGDETAILS);
                setTimeout(()=>{
                    handlePrintTagDetails()
                },500)

            },
            onError: (error: any) => {
                const message =
                    error?.response?.data?.message ||   // backend message
                    error?.response?.data?.error ||     // alternative key
                    error?.message ||                   // fallback
                    "Something went wrong";

                toaster.create({
                    title: "Error",
                    description: message,
                    type: "error",
                    duration: 2000
                });
            }
        });
    }, [validateTaggingHeaders, validateTaggingRows, selectedItem, transactionRows, barcodeHeaderForm, itemId, createTag, setTransactionRows]);



    /* ============================================================
       EDIT TAG TRANSACTION
       ============================================================ */
    const mapApiToTransactionRows = (apiRows: any[], entryNo?: string): BarcodeTransactionItem[] => {
        const draftRowId = entryNo || String(Date.now());
        return apiRows.map((r) => ({
            id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            draftRowId,
            grsweight: Number(r.GRSWT) || 0,       // ✅ was GRSWEIGHT
            stoneWt: Number(r.STNWT) || 0,         // ✅ was STONEWT
            salesStoneWt: Number(r.SALESSTNWT) || 0, // ✅ was SALESSTONEWT
            wastePercent: Number(r.WASPER) || 0,    // ✅ was WASTEPERCENT
            size: String(r.SIZEID) || "",           // ✅ was SIZE
            diamondWt: Number(r.DIAWT) || 0,       // ✅ was DIAMONDWT
            mc: Number(r.MC) || 0,
            touch: Number(r.TOUCH) || 0,
            barcode: r.TAGNO || "",                 // ✅ was BARCODE
        }));
    };

    const handleEditTagTransaction = (entryNo: string) => {
        if (selectedEntryNo === String(entryNo)) {
            // Same ID clicked again — force re-fetch by resetting first
            setSelectedEntryNo('');
            setTimeout(() => setSelectedEntryNo(String(entryNo)), 0);
            return;
        }
        setSelectedEntryNo(String(entryNo));
    };

    const handleSingleSearch = (term: string) => {
        setSingleSearch(term);
        setDeselectFlag(false); // reset deselect flag whenever typing
    };

    // Then in the useEffect that watches tagedDetails:
    useEffect(() => {
        if (!tagedDetails) return;

        const purchase = tagedDetails.PURCHASEDETAILS;
        const apiRows = tagedDetails.TAGGINGDETAILS || [];
        console.log(purchase,'purchase')

        // ✅ Reset header completely instead of merging with prev
        setBarcodeHeaderForm({
            ENTRYNO: String(purchase.ENTRYNO ?? ""),
            COMPANYNAME: String(purchase.ACCODE ?? ""),
            INWARDNO: String(purchase.PUENTRYNO ?? ""),
            ITEMNAME: String(purchase.PUSNO ?? ""),
            DATE: purchase.TAGDATE ?? "",
        });

        const mappedRows = mapApiToTransactionRows(apiRows, String(purchase.ENTRYNO));
        setTransactionRows(mappedRows);
        setIsEditing(true);
        setPrintDetails(apiRows);

    }, [tagedDetails]);

    const triggerProtocol = () => {
        const url = buildProtocolUrl("launch");

        console.log("🚀 Triggering protocol...");
        console.log("Protocol URL:", url);

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = url;

        console.log("📦 Iframe created");

        document.body.appendChild(iframe);
        console.log("✅ Iframe appended → protocol should trigger now");

        setTimeout(() => {
            document.body.removeChild(iframe);
            console.log("🧹 Iframe removed");
        }, 2000);
    };

    const handleSinglePrint = useCallback((row: BarcodeTransactionItem) => {
        console.log("🟡 handleSinglePrint triggered");
        console.log("Row:", row);
        console.log("Print Details:", printDetails);

        const detail = printDetails?.find((d) => d.TAGNO === row.barcode);

        if (!detail) {
            console.error("❌ No matching print detail found");
            toaster.create({
                title: "No print data",
                description: "Print details not found for this row",
                type: "error",
                duration: 2000
            });
            return;
        }

        console.log("✅ Found detail:", detail);

        const content = generateAllLabels([detail]);
        console.log("🧾 Generated content:", content);

        downloadTxt(content, () => {
            console.log("⬇️ File downloaded, preparing to trigger protocol...");

            setTimeout(() => {
                console.log("⏳ Delay complete → triggering protocol");
                triggerProtocol();
            }, 500);
        });

    }, [printDetails, generateAllLabels, downloadTxt]);
    /* ============================================================
       CELL RENDERERS
       ============================================================ */

    const getCellValue = useCallback((col: any, row: BarcodeTransactionItem) => {

        if (col.key === "__print") {
            return (
                <button
                    onClick={() => handleSinglePrint(row)}
                >
                    <Printer width={16} height={16} color="#3182CE" />
                </button>
            );
        }
        const value = row[col.key as keyof BarcodeTransactionItem];
        if (value === undefined || value === null) return "-";
        if (typeof value === "number") {
            if (["grsweight", "stoneWt", "salesStoneWt", "diamondWt"].includes(col.key)) return formatToFixed(value, 3);
            if (["wastePercent", "mc"].includes(col.key)) return formatToFixed(value, 2);
            if (col.key === "touch") return formatToFixed(value, 1);
        }
        if (col.key === "size" && value)
            return itemSizeCollection.find((i: any) => i.value === value)?.label ?? value;
        return value.toString();
    }, [handlePrint, itemSizeCollection]);

    const getCellStyle = useCallback((col: any, extra?: React.CSSProperties): React.CSSProperties => ({
        padding: "4px 6px", borderRight: "1px solid #E2E8F0",
        textAlign: col.align ?? (col.key === "size" || col.key === "barcode" ? "left" : "right"),
        fontSize: "12px",
        width: col.width || "50px", minWidth: col.width || "50px", maxWidth: col.width || "50px",
        ...extra,
    }), []);

    const formatTotal = useCallback((value: unknown, decimalScale?: number, key?: string): string => {
        if (value == null || value === "") return "";
        if (key === "PCS") return Math.round(Number(value)).toString();
        return Number(value).toFixed(decimalScale ?? 2);
    }, []);

    const handleStockRender = useCallback((row: any) => {
        if (!row) return <Table.Cell colSpan={7} textAlign="center" color="gray.500">Invalid row</Table.Cell>;
        return (
            <>
                <Table.Cell textAlign="start">{row.ITEMID || "-"} - {row.ITEMNAME || row.item_name || "-"}</Table.Cell>
                <Table.Cell textAlign="right">{formatToFixed(row.GRSWT, 3) ?? "0.000"}</Table.Cell>
                <Table.Cell textAlign="right">{formatToFixed(row.STNWT, 3) ?? "0.000"}</Table.Cell>
                <Table.Cell textAlign="right">{formatToFixed(row.NETWT, 3) ?? "0.000"}</Table.Cell>
                <Table.Cell textAlign="center">{row.WASTYPE || "-"}</Table.Cell>
                <Table.Cell textAlign="center">{formatToFixed(row.TOUCH, 1) || "-"}</Table.Cell>
            </>
        );
    }, []);

    const renderFormCell = useCallback((field: any) => {
        const key = field.key as FieldKey;
        const ref = fieldRefs.current[key];
        const value = transactionFormData[field.key as keyof typeof transactionFormData]?.toString() ?? "";
        const disabled = field.disabled ?? false;

        if (field.type === "number") return (
            <Box position="relative">
                <CapitalizedInput 
                field={key} 
                value={value} 
                onChange={(_: unknown, v: unknown) => handleTransactionChange(key, v)}
                type="number" 
                isCapitalized={false} 
                size="xs" 
                rounded="sm" 
                decimalScale={field.decimalScale ?? 3}
                inputRef={ref} 
                onEnter={() => moveToNext(key)} 
                noBorder
                allowFocus={field.allowFocus || false}
                 />
            </Box>
        );
        if (field.key === "barcode") return (
            <Box position="relative">
                <CapitalizedInput field={key} value={value} onChange={(_: unknown, v: unknown) => handleTransactionChange(key, v)}
                    type="text" isCapitalized={false} size="xs" rounded="sm"
                    inputRef={ref} onEnter={handleTransactionSubmit} noBorder disabled={disabled} />
            </Box>
        );
        if (field.type === "combobox") return (
            <Box>
                <SelectCombobox value={value}
                    onChange={(v: string) => { handleTransactionChange(field.key, v); if (v) moveToNext(field.key); }}
                    items={field.collection ?? EMPTY_ARRAY}
                    placeholder={field.placeholder ?? `Select ${field.label}`}
                    ref={ref as React.RefObject<HTMLInputElement>}
                    rounded="sm" disable={disabled} onEnter={() => moveToNext(field.key)} />
            </Box>
        );
        return (
            <Box position="relative">
                <CapitalizedInput 
                field={key} 
                value={value} 
                onChange={(_: unknown, v: unknown) => handleTransactionChange(key, v)} 
                type="text" 
                isCapitalized={false} 
                size="xs" 
                rounded="sm"
                inputRef={ref}
                onEnter={() => moveToNext(key)} 
                noBorder 
                disabled={disabled}
                />
            </Box>
        );
    }, [transactionFormData, handleTransactionChange, moveToNext, handleTransactionSubmit]);

    console.log(singleSearch,'singleSearch')



    // ---------------- Download helper ----------------
    const downloadFile = (filename: string, content: string) => {
        // Always revoke previous blob URL if any
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;

        // Force click
        a.click();

        // Cleanup
        URL.revokeObjectURL(url);
    };

 
  

    const generateBatFile = (systemName: string, printerName: string) => {
        return `@echo off
setlocal

REM Paths
set DOWNLOAD_PATH=${PATHS.SOURCE_PATH}
set DEST_PATH=${PATHS.DEST_PATH}

echo Waiting for ${FILES.SOURCE_TXT}...

REM Wait for file (max 5 sec)
set count=0
:waitloop
if exist "%DOWNLOAD_PATH%" goto movefile
timeout /t 1 >nul
set /a count+=1
if %count% GEQ 5 goto error
goto waitloop

:movefile
echo File found. Overwriting...

if exist "%DEST_PATH%" del "%DEST_PATH%"
move "%DOWNLOAD_PATH%" "%DEST_PATH%"

echo Printing...
TYPE "%DEST_PATH%" > \\\\${systemName}\\${printerName}

echo Done
exit

:error
echo File not found!
pause
exit
`;
    };
    // ---------------- Generate REG file ----------------
    const generateRegContent = useCallback((): string => `Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\\${PROTOCOL.NAME}]
@="URL:${PROTOCOL.NAME} Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\\${PROTOCOL.NAME}\\shell\\open\\command]
@="cmd.exe /c \"\"%USERPROFILE%\\Downloads\\${FILES.BAT}\""
`, []);

    // ---------------- Handle Submit ----------------
   
    const handleSubmit = async () => {
        setSubmitting(true);

        try {
            if (!printer) {
                throw new Error("Printer configuration not found");
            }

            const printerName = printer.printerName;
            const systemName = printer.exeName;

            const batContent = generateBatFile(systemName, printerName);
            const regContent = generateRegContent();

            // ✅ Download separately
            downloadFile(FILES.BAT, batContent);
            downloadFile(FILES.REG, regContent);

        } catch (error) {
            console.error("Download failed", error);
        } finally {
            setSubmitting(false);
        }
    };
    /* ============================================================
       RENDER
       ============================================================ */
    return (
        <Box display="flex" flexDirection="row" width={"100%"} gap={2}>
            <Box display="flex" flexDirection="column" gap={2} width={'100%'}>
                <Box bg={theme.colors.formColor} p={1} rounded="xl" display="flex" flexDirection="row" justifyContent="center">
                <Text fontSize="base" fontWeight="semibold" textAlign="center">BARCODE GENERATION</Text>
                </Box>
                {/* ── Header ── */}
                <Box bg={theme.colors.formColor} p={2} rounded="xl" display="flex" flexDirection="row" justifyContent="space-between" gap={4}>
                    <Box display="flex" flexDirection="column" gap={4}>
                 
                        <Box display="flex" gap={2} flexDirection="row" justifyContent="space-between">
                            <BarcodeHeaderForm
                                form={barcodeHeaderForm}
                                onChange={handleHeaderChange}
                                purchaserCollection={purchaserCollection}
                                inwardCollection={inwardCollection}
                                itemCollection={itemCollection}
                                isDisabled={transactionRows.length > 0}
                                validationError={taggingErrors}

                            />
                        </Box>
                    </Box>
                    {/* {!isEditing && barcodeHeaderForm.ITEMNAME && */}
                    <Box className="flex items-start flex-col gap-2">

                        <SingleCheckbox
                            label="EXCEL IMPORT"
                            checked={excelImport}
                            onChange={() => setExcelImport((p) => !p)}
                            size="sm"
                            fontSize="xs"
                        />
                
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            variant="ghost"
                            p={0}
                        >
                            <Box display="flex" alignItems="center" flexDirection="column">
                                <Span fontSize="xs" display="flex" gap={1} alignItems="center">
                                    {submitting ? <Spinner size="sm" /> : <Icon as={FaDownload} w={5} h={5} />}
                                </Span>
                                <Span fontSize="2xs" display="flex" gap={1} alignItems="center">
                                    Download Printing Files
                                </Span>
                            </Box>
                        </Button>
                     
                        
                    </Box>
                    {/* } */}


                </Box>

                {/* ── Stock + Summary ── */}
                <Box display="flex" flexDirection={{ sm: "column", md: "row" }} gap={2} bg={theme.colors.formColor} p={2} justifyContent={'space-between'} rounded="xl">
                    <CustomTable columns={stockTableHeader} data={stockTableData} renderRow={handleStockRender}
                        headerBg={theme.colors.accient} headerColor="white" bodyBg={theme.colors.formColor}
                        borderColor="white" maxWidth="40%" />
                    <Box w="30%">
                        <SummaryTable title="STOCK SUMMARY" rowLabels={summaryRowData} columnLabels={summaryColData}
                            data={tableData} headerFontSize="xs" headerBg={theme.colors.accient} size="sm" />
                    </Box>
                </Box>

                {/* ── Transaction Table ── */}
                <Box display="flex" flexDirection="row" gap={2} bg={theme.colors.formColor} rounded="xl">
                    {isEditing && printDetails &&
                        <Box fontSize='xs' display={'flex'} alignItems={'center'} justifyContent={'center'} gap={2} onClick={handlePrintTagDetails} p={2}>

                            <Printer width={20} height={20} />
                            <Text>Print All</Text>

                        </Box>
                    }

                    {/* {!isEditing && transactionRows.length > 0 && */}
                    {transactionRows.length > 0 &&
                        <Box ml="auto" display="flex" alignItems="center" p={2}>
                            <Button size="xs" fontSize="2xs" onClick={handleClear} variant="ghost" bg={theme.colors.formColor} p={0}>
                                <Image src={clearIcon} width={58} alt="CLEAR" />
                            </Button>
                            <Button size="xs" bg={theme.colors.formColor} onClick={handleSaveTransaction} loadingText="Saving..." variant="ghost" p={0}>
                                <Image src={isEditing ? updateIcon : saveIcon} width={60} alt="save" />
                            </Button>
                        </Box>
                    }


                </Box>
                <TransactionTable
                    theme={theme}
                    tableCols={allDisplayCols}
                    formFields={visibleFormFields}
                    rows={transactionRows}
                    errors={errors}
                    touched={touched}
                    localEditId={editId}
                    isSubmitting={isSubmitting}
                    totals={transactionTotals}
                    allDisplayCols={allDisplayCols}
                    resetForm={resetTransactionForm}
                    handleSubmit={handleTransactionSubmit}
                    handleEditRow={handleEditRow}
                    handleDeleteRow={handleDeleteRow}
                    renderFormCell={renderFormCell}
                    getCellValue={getCellValue}
                    formatTotal={formatTotal}
                    getCellStyle={getCellStyle}
                    transactionType="barcode"
                    showTotal
                    showTableForm={showTableForm}
                />

                {/* ── Excel Import Drawer ── */}
                {excelImport && (
                    <Drawer.Root open={excelImport} onOpenChange={() => setExcelImport(false)} >
                        <Portal>
                            <Drawer.Backdrop />
                            <Drawer.Positioner>
                                <Drawer.Content maxWidth="4xl">
                                    <Drawer.Header borderBottomWidth="1px" bg="cyan.50" fontSize="md">
                                        Excel Import
                                        <Drawer.CloseTrigger asChild>
                                            <Button variant="ghost" size="sm" onClick={() => setExcelImport(false)}>×</Button>
                                        </Drawer.CloseTrigger>
                                    </Drawer.Header>

                                    <Drawer.Body p={0}>

                                        <BarCodeExcel
                                            data={excelData}
                                            onChange={handleExcelChange}
                                            onLoad={handleExcelLoad}
                                            onFileParsed={setExcelData}
                                        />
                                    </Drawer.Body>


                                </Drawer.Content>
                            </Drawer.Positioner>
                        </Portal>
                    </Drawer.Root>
                )}
              
            </Box>
            <Box width={'15%'}>
        

                <BarcodeTagListing 

                    tagListItems={tagItemList} 
                    searchTerm={singleSearch} 
                    handleSearchChange={handleSingleSearch} 
                    handleEditTagTransaction={handleEditTagTransaction} 
                    handleDeselect={handleClear} 
                    deselectFlag={deselectFlag} 
                    onFilterChange={handleFilterChange}
                    filterParams={tagNumberParams}
                    collections={{ acCodeCollection: purchaserCollection }}
                />
            </Box>
        </Box>
    
    );
}

export default BarCodeGenerate;