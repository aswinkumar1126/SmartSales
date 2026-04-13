import { TransactionType } from "@/types/transcation/Transaction";
import { TRANSACTIONTYPES } from "@/data/Transaction/TransactionType";


const mapPurchaseReturnItems = (list: any[] = [], type: string, isTagedItem?: any) => {
    return list.map((item, index) => {

        const stones = item.STONEDETAILS || [];

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

            MC: Number(item.MC || 0),
            DESCRIPTION: item.DESCRIPTION || "",

            _stones: stones,
            _miscCharges: item.OTHERCHARGESDETAILS || [],
        };
    });
};


const mapPurchaseItems = (list: any[] = [], type: string, ) => {
    return list.map((item, index) => {

        const stones = item.STONEDETAILS || [];

        const totalStoneWeight = stones.reduce(
            (sum: number, s: any) => sum + Number(s.STNWT || 0),
            0
        );

  

        const grswt = Number(item.GRSWT || 0);
        const stnwt = stones.length > 0 ? totalStoneWeight : Number(item.STNWT || 0);

        return {
            __rowId: `edit-${item.SNO || Date.now()}-${index}`,
            __isNew: false,

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

            MC: Number(item.MC || 0),
            DESCRIPTION: item.DESCRIPTION || "",

            _stones: stones,
            _miscCharges: item.OTHERCHARGESDETAILS || [],
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