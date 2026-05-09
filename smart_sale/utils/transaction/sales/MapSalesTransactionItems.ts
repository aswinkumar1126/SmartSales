import { SaleTransactionType } from "@/types/transcation/SaleTransaction";
import { SALE_TRANSACTION_TYPES } from "./SaleTransactionKeyMap";


const mapSalesItems = (list: any[] = [], type: string, isTagedItem: any) => {
    return list.map((item, index) => {

        console.log(list,'listlist');
           const rowId = `edit-${item.SNO || Date.now()}-${index}`;

        const stones = item.STONEDETAILS || [];

     
        // ---------------- MISC CHARGES (HMC) ----------------
        const miscChargesRaw = item.OTHERCHARGESDETAILS || [];

        const normalizedMisc = miscChargesRaw.map((c: any, i: number) => {

            const isHmc =
                c?.chargeName?.trim().toUpperCase() === "HMC";
                
            const finalAmt = Number(c.chargeAmount || 0);

            return{
                id: `misc-${rowId}-${i}`,

                draftRowId: rowId,

                chargeId: String(c.chargeId || 0),
                chargeName: c.chargeName || "",
                amount: isHmc
                    ? finalAmt / Number(item.PCS || 1)
                    : finalAmt,
                finalAmount: finalAmt,
                itemId: Number(c.itemId || item.ITEMID || 0),
            }
           
        });

        const totalHMC =
            normalizedMisc.length > 0
                ? normalizedMisc.reduce(
                    (sum: number, c: any) => sum + c.amount,
                    0
                )
                : Number(item.HMC || item.MC || 0);



        const totalStoneWeight = stones.reduce(
            (sum: number, s: any) => sum + Number(s.STNWT || 0),
            0
        );

      

        const isTagged = item.ITEMID
            ? isTagedItem(Number(item.ITEMID))
            : false;

        const ITEM_TYPE = isTagged ? "TAGGED" : "NON_TAGGED";



        const grswt = Number(item.GRSWT || 0);
        const stnwt = stones.length > 0 ? totalStoneWeight : Number(item.STNWT || 0);

        const SNO = item.SNO;

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

            HMC : totalHMC,
            MC: Number(item.MC || 0),
           
            DESCRIPTION: item.DESCRIPTION || "",

            _stones: stones,
            _miscCharges: normalizedMisc || [],
              
            SNO: SNO
        };
    });
};

const mapIssueItems = (list: any[] = [], type: string) => {
    return list.map((item, index) => {

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
            ATOUCH: Number(item.TOUCH || 0),

            PUREWT: Number(item.PUREWT || 0),
            APUREWT: Number(item.PUREWT || 0),

            DESCRIPTION: item.DESCRIPTION || "",


            SNO: SNO
        };
    });
};


export const mapSalesTransactionItems = (
    transactionData: any,
    isTagedItem: (id: number | null) => boolean
) => {
    const details = transactionData?.TRANSACTION_DETAILS;

    if (!details) {
        return {
            rows: [],
            selectedTransactionTypes: [],
        };
    }

    const sales = mapSalesItems(details.sales, "SA", isTagedItem);
    const salesReturn = mapSalesItems(details.sales_return, "SR", isTagedItem);

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