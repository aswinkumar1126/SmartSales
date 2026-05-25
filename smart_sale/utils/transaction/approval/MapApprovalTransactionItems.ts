import { ApprovalTransactionType } from "@/types/transcation/ApprovalTransaction";
import { APPROVAL_TRANSACTION_TYPES } from "./ApprovalTransactionKeyMap";
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

const mapApprovalItems = (list: any[] = [], type: string, isUseFinalAmount: boolean) => {
    return list.map((item, index) => {

        console.log(list, 'saleslistlist');



        const rowId = `edit-${item.SNO || Date.now()}-${index}`;

        const isTaged = item.STOCKTYPE === "T";

        const stonePresent = item.STNPRESENT === "Y";


        const grswt = Number(item.GRSWT || 0);

        const SNO = item.SNO;


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
        console.log(normalizedStones, 'normalizedStones');


        // ---------------- MISC CHARGES (HMC) ----------------
        const { normalizedMisc, totalHMC } = MapOtherCharges(
            item, rowId, isUseFinalAmount           // ✅
        );


        const totalStoneWeight = normalizedStones.reduce(
            (sum: number, s: any) => sum + Number(s.stoneWeight), 0
        );
        const totalStoneAmount = normalizedStones.length > 0
            ? normalizedStones.reduce((sum: number, s: any) => sum + Number(s.stoneAmount), 0)
            : item.STNAMT || 0;


        return {
            __rowId: `edit-${item.SNO || Date.now()}-${index}`,
            __isNew: false,
            __isTaged: isTaged,

            ITEM_TYPE: isTaged ? "TAGED" : "NON-TAGED",

            TRANSACTION_TYPE: type,
            _type: type,

            ITEMID: String(item.ITEMID || ""),
            ITEMNAME: item.ITEMNAME || "",
            TAGNO: item.TAGNO || "",

            PCS: Number(item.PCS || 0),
            GRSWT: grswt,
            STNWT: totalStoneWeight,
            NETWT: grswt - totalStoneWeight,

            TOUCH: Number(item.TOUCH || 0),
            PUREWT: Number(item.PUREWT || 0),

            HMC: totalHMC,
            MC: Number(item.MC || 0),
            STN_PRESENT: stonePresent,

            DESCRIPTION: item.DESCRIPTION || "",

            _stones: normalizedStones,
            _miscCharges: normalizedMisc || [],


            SNO: SNO
        };
    });
};


export const mapApprovalTransactionItems = (
    transactionData: any,
    isUseFinalAmount: boolean
) => {
    console.log(transactionData, 'transactionDatatransactionData')
    const details = transactionData?.TRANSACTION_DETAILS;

    if (!details) {
        return {
            rows: [],
            selectedTransactionTypes: [],
        };
    }

    const approvalIssue = mapApprovalItems(details.APPROVAL_ISSUE, "APPIS", isUseFinalAmount);
    const approvalReceipt = mapApprovalItems(details.APPROVAL_RECEIPT, "APPRE", isUseFinalAmount);


    const rows = [
        ...approvalIssue,
        ...approvalReceipt,

    ].map((item, index) => ({
        ...item,
        __previewSno: index + 1,
    }));

    const selectedTransactionTypesSet = new Set<string>();

    rows.forEach(r => selectedTransactionTypesSet.add(r.TRANSACTION_TYPE));

    const selectedTransactionTypes: ApprovalTransactionType[] =
        Array.from(selectedTransactionTypesSet)
            .map(code => APPROVAL_TRANSACTION_TYPES.find(t => t.code === code))
            .filter((t): t is ApprovalTransactionType => !!t);

    return {
        rows,
        selectedTransactionTypes,
    };
};