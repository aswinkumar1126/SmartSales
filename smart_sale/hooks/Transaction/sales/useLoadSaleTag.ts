import { useSaleTransactionStore } from "@/store/sales/useSaleTransactionStore";
import { getTagDetails } from "@/service/TagedService";
import { toaster } from "@/components/ui/toaster";
import { calculateStoneAmount } from "@/app/dashboard/Transaction/SaleEntry/StoneMaster/StoneEntryMaster";
import { formatToFixed } from "@/utils/format/numberFormat";

export const useLoadSaleTag = () => {
    const {
        draftRows,
        addDraftRow,
        setSelectedTransactionId,
    } = useSaleTransactionStore();

    const loadSaleTag = async (tagNo: string, customerId: number) => {
        try {
            if (!tagNo?.trim()) {
                toaster.create({
                    title: "Invalid Tag",
                    description: "Tag number is required",
                    type: "warning",
                });
                return;
            }

            const response = await getTagDetails(tagNo, customerId, true);
            const data = response?.data;
            console.log(data, 'usetouchdata');

            if (!data) {
                toaster.create({
                    title: "Tag Not Found",
                    description: `No data found for tag ${tagNo}`,
                    type: "error",
                });
                return;
            }

            // ✅ Read FRESH state from store at call time, not from closure
            const freshDraftRows = useSaleTransactionStore.getState().draftRows;

            const exists = freshDraftRows.some((row) => row.TAGNO === tagNo);
            if (exists) {
                toaster.create({
                    title: "Duplicate Tag",
                    description: `Tag ${tagNo} already added`,
                    type: "warning",
                });
                return;
            }

            const rowId = `tag-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 5)}`;

            const stoneDetails = Array.isArray(data.STONEDETAILS)
                ? data.STONEDETAILS
                : [];

            // ✅ Build stones FIRST
            let stonesWithId: any[] = [];
            let totalStoneWeight = 0;
            let totalStoneAmount = 0;

            if (stoneDetails.length > 0) {
                stonesWithId = stoneDetails.map((stone: any, index: number) => ({
                    id: `stone-${Date.now()}-${index}-${Math.random()
                        .toString(36)
                        .substr(2, 4)}`,
                    draftRowId: rowId,
                    stoneId: String(stone.STNITEMID || stone.STNSUBITEMID || ""),
                    subStoneId: String(stone.STNSUBITEMID || ""),
                    stonePcs: Number(stone.STNPCS || 1),
                    stoneWeight: formatToFixed(Number(stone.SALESSTNWT || 0), 3),
                    stoneUnit: stone.STONEUNIT || "g",
                    stoneCalculation: stone.CALCMODE || "w",
                    stoneRate: formatToFixed(Number(stone.STNRATE || 0), 2),
                    stoneAmount: formatToFixed(calculateStoneAmount(stone.STONEUNIT || "g",
                        stone.SALESSTNWT,
                        stone.STNPCS || 1,
                        stone.STNRATE || 0,
                        stone.CALCMODE || "w"), 3),
                }));

                totalStoneWeight = stonesWithId.reduce(
                    (sum: number, s: any) => sum + Number(s.stoneWeight || 0),
                    0
                );

                totalStoneAmount = stonesWithId.reduce(
                    (sum: number, s: any) => sum + Number(s.stoneAmount || 0),
                    0
                );
            }
            const hmcAmount = data.HMCAMT;

            // Build the default HMC charge entry once — used in both local state and store
            const defaultHmcCharge = hmcAmount > 0
                ? [{
                    draftRowId: rowId,
                    chargeId: "1",
                    chargeName: "HMC",
                    amount: hmcAmount.toString(),
                    finalAmount: hmcAmount.toString(),
                }]
                : [];


            const STN_PRESENT = data.STNPRESENT === "Y" || stoneDetails.length > 0;

            console.log(STN_PRESENT, 'STN_PRESENT')

            // ✅ Build the complete row object at once — no partial mutation
            const newRow: any = {
                __rowId: rowId,
                __isNew: true,
                __isEditing: false,
                __previewSno: freshDraftRows.length + 1, // ✅ fresh length
                __isTaged: true,

                TRANSACTION_TYPE: "SA",
                _type: "SA",

                ITEMID: data.ITEMID ? String(data.ITEMID) : "",
                ITEMNAME: data.ITEMNAME,
                TAGNO: String(data.TAGNO || tagNo),
                PCS: 1,

                STN_PRESENT: STN_PRESENT,

                GRSWT: formatToFixed(Number(data.GRSWT), 3) || 0,
                STNWT: stoneDetails.length > 0
                    ? formatToFixed(totalStoneWeight, 3)
                    : formatToFixed(Number(data.SALESSTNWT), 3) || 0,
                NETWT: formatToFixed(Number(data.NETWT), 3) || 0,

                TOUCH: formatToFixed(Number(data.TOUCH) ,2) || 0,
                MC: formatToFixed(Number(data.MC), 2) || 0,
                STNAMT: formatToFixed(totalStoneAmount, 0) || 0,

                _hasStones: stonesWithId.length > 0,
                _hasCharges: true,
                HMC: hmcAmount,
                _miscCharges: defaultHmcCharge,

                // ✅ Always include _stones (empty array if none)
                _stones: stonesWithId,

                ITEM_TYPE: "TAGED",
            };
            console.log(newRow, 'newRownewRow')
            addDraftRow(newRow);
            setSelectedTransactionId("SA");

            toaster.create({
                title: "Tag Loaded",
                description: `Tag ${tagNo} loaded successfully`,
                type: "success",
                duration: 1500,
            });

            return { success: true, row: newRow };

        } catch (error: any) {
            console.error("loadSaleTag error:", error);
            toaster.create({
                title: "Unexpected Error",
                description: error?.message || "Failed to load tag details",
                type: "error",
            });
            return { success: false, message: error?.message || "Failed" };
        }
    };

    return { loadSaleTag };
};