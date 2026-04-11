import { SaleTransactionType } from "@/types/transcation/SaleTransaction";
import { SALE_TRANSACTION_TYPES } from "./SaleTransactionKeyMap";


export const mapSalesTransactionItems = (
    transactionData: any,
    isTagedItem: (id: number | null) => boolean
) => {
    const details = transactionData?.TRANSACTION_DETAILS;

    if (!details) {
        return {
            rows: [],
            stones: [],
            charges: [],
            selectedTransactionTypes: [],
        };
    }

    const allItems: any[] = [];
    const selectedTransactionTypesSet = new Set<string>();

    const pushItems = (list: any[] = [], type: string) => {
        if (list.length > 0) {
            selectedTransactionTypesSet.add(type);

            list.forEach((item) => {
                allItems.push({
                    ...item,
                    _type: type,
                });
            });
        }
    };

    // ================= PUSH DATA =================
    pushItems(details.sales, "SA");
    pushItems(details.issue, "IS");
    pushItems(details.sales_return, "SR");
    pushItems(details.receipt, "RE");

    // ================= ROWS =================
    const rows = allItems.map((item, index) => {
        const rowId = `edit-${item.SNO || Date.now()}-${index}`;

        const stones = item.STONEDETAILS || [];
        const charges = item.OTHERCHARGESDETAILS || [];

        const totalStoneWeight = stones.reduce((sum: number, s: any) => {
            return sum + Number(s.STNWT || 0);
        }, 0);

        const itemId = item.ITEMID ? Number(item.ITEMID) : null;
        const tagged = isTagedItem(itemId);

        return {
            __rowId: rowId,
            SNO: item.SNO,
            BILLNO: item.BILLNO,

            __isNew: false,
            __isEditing: false,
            __previewSno: index + 1,

            TRANSACTION_TYPE: item._type,
            _type: item._type,

            ITEM_TYPE: tagged ? "TAGGED" : "NON_TAGGED",
            __isTagged: tagged,

            ITEMID: String(item.ITEMID || ""),
            TAGNO: item.TAGNO || "",

            PCS: Number(item.PCS || 1),
            GRSWT: Number(item.GRSWT || 0),
            STNWT: totalStoneWeight || Number(item.STNWT || 0),
            NETWT: Number(item.NETWT || 0),

            TOUCH: Number(item.TOUCH || 0),
            MC: Number(item.MC || 0),
            PUREWT: Number(item.PUREWT || 0),
            STNAMT: Number(item.STNAMT || 0),

            WASTYPE: item.WASTYPE || "TOUCH",
            DESCRIPTION: item.DESCRIPTION || "",

            _stones: stones,
            _miscCharges: charges,

            _hasStones: stones.length > 0,
            _hasCharges: charges.length > 0,
        };
    });

    // ================= SAFE TYPE MAPPING =================
    const selectedTransactionTypes: SaleTransactionType[] =
        Array.from(selectedTransactionTypesSet)
            .map((code) =>
                SALE_TRANSACTION_TYPES.find(t => t.code === code)
            )
            .filter((t): t is SaleTransactionType => !!t);

    return {
        rows,
        stones: [],
        charges: [],
        selectedTransactionTypes,
    };
};