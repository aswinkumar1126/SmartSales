import { SaleTransactionType } from "@/types/transcation/SaleTransaction";
import { SALE_TRANSACTION_TYPES } from "./SaleTransactionKeyMap";
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

const mapSalesItems = (list: any[] = [], type: string, isUseFinalAmount:boolean) => {
    return list.map((item, index) => {

        console.log(list,'saleslistlist');
        



        const rowId = `edit-${item.SNO || Date.now()}-${index}`;

        const isTaged = item.STOCKTYPE === "T" ;

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

        
        // ---------------- MISC CHARGES (HMC) ----------------
       const { normalizedMisc, totalHMC } = MapOtherCharges(
                  item, rowId, isUseFinalAmount           // ✅
              );


        const totalStoneWeight = normalizedStones.reduce(
            (sum: number, s: any) => sum + s.stoneWeight, 0
        );
        const totalStoneAmount = normalizedStones.length > 0
            ? normalizedStones.reduce((sum: number, s: any) => sum + Number(s.stoneAmount), 0)
            : item.STNAMT || 0;


        return {
            __rowId: `edit-${item.SNO || Date.now()}-${index}`,
            __isNew: false,
            __isTaged: isTaged,

            ITEM_TYPE : isTaged ? "TAGED" : "NON-TAGED",

            TRANSACTION_TYPE: type,
            _type: type,

            ITEMID: String(item.ITEMID || ""),
            ITEMNAME : item.ITEMNAME || "",
            TAGNO : item.TAGNO || "",

            PCS: Number(item.PCS || 0),
            GRSWT: grswt,
            STNWT: totalStoneWeight,
            NETWT: grswt - totalStoneWeight,

            TOUCH: Number(item.TOUCH || 0),
            PUREWT: Number(item.PUREWT || 0),

            HMC : totalHMC,
            MC: Number(item.MC || 0),
            STN_PRESENT : stonePresent,
           
            DESCRIPTION: item.DESCRIPTION || "",

            _stones: normalizedStones,
            _miscCharges: normalizedMisc || [],

              
            SNO: SNO
        };
    });
};

const mapIssueItems = (list: any[] = [], type: string) => {
    return list.map((item, index) => {

        console.log(item,'itemitem');

        const wt = Number(item.WT || 0);

        const SNO = item.SNO;

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


            SNO: SNO
        };
    });
};


export const mapSalesTransactionItems = (
    transactionData: any,
    isUseFinalAmount :boolean
) => {
    const details = transactionData?.TRANSACTION_DETAILS;

    if (!details) {
        return {
            rows: [],
            selectedTransactionTypes: [],
        };
    }

    const sales = mapSalesItems(details.sales, "SA",  isUseFinalAmount );
    const salesReturn = mapSalesItems(details.sales_return, "SR",  isUseFinalAmount);

    const issue = mapIssueItems(details.issue, "IS");
    const receipt = mapIssueItems(details.receipt, "RE");

    const rows = [
        ...sales,
        ...salesReturn,
        ...issue,
        ...receipt,
    ].map((item, index) => ({
        ...item,
        __previewSno: index + 1,
    }));

    const selectedTransactionTypesSet = new Set<string>();

    rows.forEach(r => selectedTransactionTypesSet.add(r.TRANSACTION_TYPE));

    const selectedTransactionTypes: SaleTransactionType[] =
        Array.from(selectedTransactionTypesSet)
            .map(code => SALE_TRANSACTION_TYPES.find(t => t.code === code))
            .filter((t): t is SaleTransactionType => !!t);

    return {
        rows,
        selectedTransactionTypes,
    };
};