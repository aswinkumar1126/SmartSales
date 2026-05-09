import { useSaleTransactionStore } from "@/store/sales/useSaleTransactionStore";
import { getTagDetails } from "@/service/TagedService";
import { toaster } from "@/components/ui/toaster";

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

            if (stoneDetails.length > 0) {
                stonesWithId = stoneDetails.map((stone: any, index: number) => ({
                    id: `stone-${Date.now()}-${index}-${Math.random()
                        .toString(36)
                        .substr(2, 4)}`,
                    draftRowId: rowId,
                    stoneId: String(stone.STNITEMID || stone.STNSUBITEMID || ""),
                    subStoneId: String(stone.STNSUBITEMID || ""),
                    stonePcs: Number(stone.STNPCS || 1),
                    stoneWeight: Number(stone.SALESSTNWT || 0),
                    stoneUnit: stone.STONEUNIT || "g",
                    stoneCalculation: stone.CALCMODE || "w",
                    stoneRate: Number(stone.STNRATE || 0),
                    stoneAmount: Number(stone.STNAMT || 0),
                }));

                totalStoneWeight = stonesWithId.reduce(
                    (sum: number, s: any) => sum + Number(s.stoneWeight || 0),
                    0
                );
            }

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
                TAGNO: String(data.TAGNO || tagNo),
                PCS: 1,

                GRSWT: Number(data.GRSWT) || 0,
                STNWT: stoneDetails.length > 0
                    ? totalStoneWeight
                    : Number(data.SALESSTNWT) || 0,
                NETWT: Number(data.NETWT) || 0,

                TOUCH: Number(data.TOUCH) || 0,
                MC: Number(data.MC) || 0,

                _hasStones: stonesWithId.length > 0,
                _hasCharges: false,

                // ✅ Always include _stones (empty array if none)
                _stones: stonesWithId,

                ITEM_TYPE: "TAGED",
            };
            console.log(newRow,'newRownewRow')
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