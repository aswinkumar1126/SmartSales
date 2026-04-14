import { TransactionType } from "@/types/transcation/Transaction";
import { TRANSACTIONTYPES } from "@/data/Transaction/TransactionType";


const mapPurchaseReturnItems = (list: any[] = [], type: string, isTagedItem?: any) => {
    return list.map((item, index) => {

        const rowId = `edit-${item.SNO || Date.now()}-${index}`;

     

        const isTagged = item.ITEMID
            ? isTagedItem(Number(item.ITEMID))
            : false;
        const ITEM_TYPE = isTagged ? "TAGGED" : "NON_TAGGED";



        // ---------------- STONES ----------------
        const stonesRaw = item.STONEDETAILS || [];

        const normalizedStones = stonesRaw.map((s: any, i: number) => ({
            id: `stone-${rowId}-${i}`,

            draftRowId: rowId,

            stoneId: String(s.stoneId || s.STNITEMID || ""),
            subStoneId: String(s.substoneId || s.STNSUBITEMID || ""),

            stonePcs: Number(s.stonepcs || s.STNPCS || 1),
            stoneWeight: Number(s.stoneWeight || s.STNWT || 0),

            stoneUnit: s.stoneUnit || "g",
            stoneCalculation: s.stoneCalculation || s.stoneCalculation || "w",

            stoneRate: Number(s.stoneRate || s.STNRATE || 0),
            stoneAmount: Number(s.stoneAmount || s.STNAMT || 0),
        }));

        const totalStoneWeight = normalizedStones.reduce(
            (sum: number, s: any) => sum + s.stoneWeight,
            0
        );
     
        const grswt = Number(item.GRSWT || 0);
        const stnwt = normalizedStones.length > 0 ? totalStoneWeight : Number(item.STNWT || 0);
        const totalStoneAmount = normalizedStones.length > 0 ? normalizedStones.reduce((sum:number ,s:any) => sum + Number(s.stoneAmount), 0) : item.STNAMT || 0 ;


        // ---------------- MISC CHARGES (HMC) ----------------
        const miscChargesRaw = item.PURCHASEOTHERCHARGESDETAILS || [];

        const normalizedMisc = miscChargesRaw.map((c: any, i: number) => ({
            id: `misc-${rowId}-${i}`,

            draftRowId: rowId,

            chargeName: String(c.chargeId || 0),
            amount: Number(c.chargeAmount || 0),

            itemId: Number(c.itemId || item.ITEMID || 0),
        }));

        const totalHMC =
            normalizedMisc.length > 0
                ? normalizedMisc.reduce(
                    (sum: number, c: any) => sum + c.amount,
                    0
                )
                : Number(item.HMC || item.MC || 0);

        return {
            __rowId: `edit-${item.SNO || Date.now()}-${index}`,
            __isNew: false,
            __isTagged:isTagged,

            ITEM_TYPE,

            TRANSACTION_TYPE: type,
            _type: type,

            ITEMID: String(item.ITEMID || ""),
            TAGNO : item.TAGNO || "",

            PCS: Number(item.PCS || 0),
            GRSWT: grswt,
            STNWT: stnwt,
            NETWT: grswt - stnwt,

            TOUCH: Number(item.TOUCH || 0),
            PUREWT: Number(item.PUREWT || 0),

            STNAMT: totalStoneAmount,
            HMC: totalHMC,
            MC: Number(item.MC || 0),
            DESCRIPTION: item.DESCRIPTION || "",

            _stones: normalizedStones,
            _miscCharges: normalizedMisc || [],
        };
    });
};


const mapPurchaseItems = (list: any[] = [], type: string) => {
    return list.map((item, index) => {

        console.log(list,'purchaseitems');

        const rowId = `edit-${item.SNO || Date.now()}-${index}`;

        // ---------------- STONES ----------------
        const stonesRaw = item.STONEDETAILS || [];

        const normalizedStones = stonesRaw.map((s: any, i: number) => ({
            id: `stone-${rowId}-${i}`,

            draftRowId: rowId,

            stoneId: String(s.stoneId || s.STNITEMID || ""),
            subStoneId: String(s.substoneId || s.STNSUBITEMID || ""),

            stonePcs: Number(s.stonepcs || s.STNPCS || 1),
            stoneWeight: Number(s.stoneWeight || s.STNWT || 0),

            stoneUnit: s.stoneUnit || "g",
            stoneCalculation: s.stoneCalculation || s.stoneCalculation || "w",

            stoneRate: Number(s.stoneRate || s.STNRATE || 0),
            stoneAmount: Number(s.stoneAmount || s.STNAMT || 0),
        }));

        const totalStoneWeight = normalizedStones.reduce(
            (sum: number, s: any) => sum + s.stoneWeight,
            0
        );

        // ---------------- BASIC WEIGHTS ----------------
        const grswt = Number(item.GRSWT || 0);

        const stnwt =
            normalizedStones.length > 0
                ? totalStoneWeight
                : Number(item.STNWT || 0);

        const netwt = grswt - stnwt;

        // ---------------- MISC CHARGES (HMC) ----------------
        const miscChargesRaw = item.PURCHASEOTHERCHARGESDETAILS || [];

        const normalizedMisc = miscChargesRaw.map((c: any, i: number) => ({
            id: `misc-${rowId}-${i}`,

            draftRowId: rowId,

            chargeName: String(c.chargeId || 0),
            amount: Number(c.chargeAmount || 0),

            itemId: Number(c.itemId || item.ITEMID || 0),
        }));

        const totalHMC =
            normalizedMisc.length > 0
                ? normalizedMisc.reduce(
                    (sum: number, c: any) => sum + c.amount,
                    0
                )
                : Number(item.HMC || item.MC || 0);

        // ---------------- FINAL ROW ----------------
        return {
            __rowId: rowId,
            __isNew: false,
            __isEditing: false,

            TRANSACTION_TYPE: type,
            _type: type,

            ITEMID: String(item.ITEMID || ""),
            TAGNO: item.TAGNO || "",

            PCS: Number(item.PCS || 0),

            GRSWT: grswt,
            STNWT: stnwt,
            NETWT: netwt,

            TOUCH: item.TOUCH || 'TOUCH',
            PUREWT: Number(item.PUREWT || 0),

            MC: Number(item.MC || 0),
            HMC: totalHMC,
            STNAMT:item.STNAMT || 0,

            DESCRIPTION: item.DESCRIPTION || "",

            // ✅ MATCHES SALE TAG STRUCTURE
            _stones: normalizedStones,

            _miscCharges: normalizedMisc,
        };
    });
};

const mapIssueItems = (list: any[] = [], type: string) => {
    return list.map((item, index) => {

        const wt = Number(item.WT || 0);

        return {
            __rowId: `edit-${item.SNO || Date.now()}-${index}`,
            __isNew: false,

            TRANSACTION_TYPE: type,
            _type: type,

            PUREID: String(item.PUREID || ""),

            WT: wt,
            AWT: wt,

            TOUCH: Number(item.TOUCH || 0),
            ATOUCH: Number(item.TOUCH || 0),

            PUREWT: Number(item.PUREWT || 0),
            APUREWT: Number(item.PUREWT || 0),

            DESCRIPTION: item.DESCRIPTION || "",
        };
    });
};


export const mapPurchaseTransactionItems = (
    transactionData: any,
    isTagedItem: (id: number | null) => boolean
) => {
    const details = transactionData?.TRANSACTION_DETAILS;

    console.log(details,'detailsdetails')

    if (!details) {
        return {
            rows: [],
            selectedTransactionTypes: [],
        };
    }

    const purchase = mapPurchaseItems(details.purchase, "PU");
    const purchaseReturn = mapPurchaseReturnItems(details.purchase_return, "PR", isTagedItem);

    const issue = mapIssueItems(details.issue, "ISP");
    const receipt = mapIssueItems(details.receipt, "REC");

    const rows = [
        ...purchase,
        ...purchaseReturn,
        ...issue,
        ...receipt,
    ].map((item, index) => ({
        ...item,
        __previewSno: index + 1,
    }));

    const selectedTransactionTypesSet = new Set<string>();

    rows.forEach(r => selectedTransactionTypesSet.add(r.TRANSACTION_TYPE));

    const selectedTransactionTypes: TransactionType[] =
        Array.from(selectedTransactionTypesSet)
            .map(code => TRANSACTIONTYPES.find(t => t.code === code))
            .filter((t): t is TransactionType => !!t);

    return {
        rows,
        selectedTransactionTypes,
    };
};