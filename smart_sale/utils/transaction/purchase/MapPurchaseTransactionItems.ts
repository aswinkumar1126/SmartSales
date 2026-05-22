import { TransactionType } from "@/types/transcation/Transaction";
import { TRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import { MapOtherCharges } from "./MapOtherCharges";

// ─── Pure calculation function ────────────────────────────────────────────────
function calculateStoneAmount(
    unit: "g" | "c",
    weight: string,
    pcs: string,
    rate: string,
    calculation: "w" | "p" | "c"
): number {
    const w = parseFloat(weight) || 0;
    const p = parseFloat(pcs) || 0;
    const r = parseFloat(rate) || 0;

    if (unit === "g") {
        if (calculation === "w") return w * r;
        if (calculation === "p") return p * r;
        if (calculation === "c") return w * r * 5;
    } else {
        if (calculation === "w") return (w / 5) * r;
        if (calculation === "p") return p * r;
        if (calculation === "c") return (w / 5) * r * 5;
    }
    return 0;
}


// ─── Purchase return items ────────────────────────────────────────────────────
const mapPurchaseReturnItems = (
    list: any[] = [],
    type: string,
    isUseFinalAmount: boolean        // ✅ passed in
) => {
    return list.map((item, index) => {
        const rowId = `edit-${item.SNO || Date.now()}-${index}`;

        const isTagged = item.STOCKTYPE === "T";
        const ITEM_TYPE = isTagged ? "TAGGED" : "NON_TAGGED";

        const stonePresent = item.STNPRESENT === "Y" ;

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
            stoneCalculation: s.stoneCalculation || "w",
            stoneRate: Number(s.stoneRate || s.STNRATE || 0),
            stoneAmount: Number(s.stoneAmount || s.STNAMT || 0),
        }));

        const totalStoneWeight = normalizedStones.reduce(
            (sum: number, s: any) => sum + Number(s.stoneWeight), 0
        );
        const totalStoneAmount = normalizedStones.length > 0
            ? normalizedStones.reduce((sum: number, s: any) => sum + Number(s.stoneAmount), 0)
            : item.STNAMT || 0;

        const grswt = Number(item.GRSWT || 0);
        const stnwt = normalizedStones.length > 0 ? totalStoneWeight : Number(item.STNWT || 0);

        // ---------------- MISC CHARGES ----------------
        const { normalizedMisc, totalHMC } = MapOtherCharges(
            item, rowId, isUseFinalAmount  // ✅
        );

        return {
            __rowId: rowId,
            __isNew: false,
            __isTagged: isTagged,

            ITEM_TYPE,
            TRANSACTION_TYPE: type,
            _type: type,
            ITEMID: String(item.ITEMID || ""),
            TAGNO: item.TAGNO || "",
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
            SNO: item.SNO || "",

            ITEMNAME: item.ITEMNAME,

            STN_PRESENT: stonePresent ,

            _stones: normalizedStones,
            _miscCharges: normalizedMisc,
            isExisting: true,
        };
    });
};

// ─── Purchase items ───────────────────────────────────────────────────────────
const mapPurchaseItems = (
    list: any[] = [],
    type: string,
    isUseFinalAmount: boolean        // ✅ passed in
) => {
    // console.log(isUseFinalAmount,'isUseFinalAmount')
    return list.map((item, index) => {
        const rowId = `edit-${item.SNO || Date.now()}-${index}`;


        console.log(item,'purcaseTranItem');

        const isTagged = item.STOCKTYPE === "T" ;

        const stnPresent = item.STNPRESENT === "Y" ;

        // ---------------- STONES ----------------
        const stonesRaw = item.STONEDETAILS || [];
        const normalizedStones = stonesRaw.map((s: any, i: number) => {
            const unit = (s.stoneUnit || "g") as "g" | "c";
            const calculation = (s.stoneCalculation || "w") as "w" | "p" | "c";
            const stoneWeight = String(s.stoneWeight || s.STNWT || 0);
            const stonePcs = String(s.stonePcs || s.STNPCS || 1);
            const stoneRate = String(s.stoneRate || s.STNRATE || 0);

            const stoneAmount = calculateStoneAmount(unit, stoneWeight, stonePcs, stoneRate, calculation);

            return {
                id: `stone-${rowId}-${i}`,
                draftRowId: rowId,
                stoneId: String(s.stoneId || s.STNITEMID || ""),
                subStoneId: String(s.substoneId || s.STNSUBITEMID || ""),
                stonePcs,
                stoneWeight,
                stoneUnit: unit,
                stoneCalculation: calculation,
                stoneRate,
                stoneAmount: stoneAmount > 0 ? String(stoneAmount) : "",
            };
        });

        const totalStoneWeight = normalizedStones.reduce((sum: number, s: any) => {
            const w = parseFloat(s.stoneWeight) || 0;
            return sum + (s.stoneUnit === "c" ? w / 5 : w);
        }, 0);

        const grswt = Number(item.GRSWT || 0);
        const stnwt = normalizedStones.length > 0 ? totalStoneWeight : Number(item.STNWT || 0);
        const netwt = grswt - stnwt;

        // ---------------- MISC CHARGES ----------------
        const { normalizedMisc, totalHMC } = MapOtherCharges(
            item, rowId, isUseFinalAmount           // ✅
        );

        console.log(totalHMC,'totalHMC')

        return {
            __rowId: rowId,
            __isNew: false,
            __isEditing: false,
            TRANSACTION_TYPE: type,
            _type: type,



            ITEMID: String(item.ITEMID || ""),
            TAGNO: item.TAGNO || "",
            PCS: Number(item.PCS || 0),

            GRSWT: grswt.toFixed(3),
            STNWT: stnwt.toFixed(3),
            NETWT: netwt,

            TOUCH: item.TOUCH || "TOUCH",
            PUREWT: Number(item.PUREWT || 0),

            MC: Number(item.MC || 0),
            HMC: totalHMC,
            STN_PRESENT: stnPresent, 
            STNAMT: item.STNAMT || 0,
            DESCRIPTION: item.DESCRIPTION || "",
            SNO: item.SNO || "",
            _stones: normalizedStones,
            _miscCharges: normalizedMisc,

            __isTaged: isTagged ,
            ITEM_TYPE : isTagged ? "TAGGED" : "NON_TAGGED" ,

            ITEMNAME :item.ITEMNAME ,
            ISEDITABLE: item.EDITABLE  ,

            isExisting :true,
        };
    });
};

// ─── Issue / receipt items ────────────────────────────────────────────────────
const mapIssueItems = (list: any[] = [], type: string) => {
    return list.map((item, index) => {
        console.log(item, 'itemitem');
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
            ATOUCH: Number(item.ATOUCH || 0),

            PUREWT: Number(item.PUREWT || 0),
            APUREWT: Number(item.APUREWT || 0),
            
            DESCRIPTION: item.DESCRIPTION || "",
            SNO: item.SNO || "",

            PUREGOLDNAME : item.PURENAME,
            isExisting: true,
        };
    });
};

// ─── Main export ──────────────────────────────────────────────────────────────
export const mapPurchaseTransactionItems = (
    transactionData: any,
    isUseFinalAmount: boolean = false   // ✅ passed from component after hook call
) => {
    const details = transactionData?.TRANSACTION_DETAILS;

    console.log(details,'detailsinpurchase');

    if (!details) {
        return { rows: [], selectedTransactionTypes: [] };
    }

    const purchase = mapPurchaseItems(details.purchase, "PU", isUseFinalAmount);
    const purchaseReturn = mapPurchaseReturnItems(details.purchase_return, "PR", isUseFinalAmount);
    const issue = mapIssueItems(details.issue, "ISP");
    const receipt = mapIssueItems(details.receipt, "REC");

    const rows = [...purchase, ...purchaseReturn, ...issue, ...receipt]
        .map((item, index) => ({ ...item, __previewSno: index + 1 }));

    const selectedTransactionTypesSet = new Set<string>();
    rows.forEach(r => selectedTransactionTypesSet.add(r.TRANSACTION_TYPE));

    const selectedTransactionTypes: TransactionType[] =
        Array.from(selectedTransactionTypesSet)
            .map(code => TRANSACTIONTYPES.find(t => t.code === code))
            .filter((t): t is TransactionType => !!t);

    return { rows, selectedTransactionTypes };
};