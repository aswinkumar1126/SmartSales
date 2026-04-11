import { useSaleTransactionStore } from "@/store/sales/useSaleTransactionStore";
import { getTagDetails } from "@/service/TagedService";
import { toaster } from "@/components/ui/toaster";

export const useLoadSaleTag = () => {
    const {
        draftRows,
        addDraftRow,
        setSelectedTransactionId,
    } = useSaleTransactionStore();

    const loadSaleTag = async (
        tagNo: string,
        customerId: number
    ) => {
        try {
            // ---------------- VALIDATION ----------------
            if (!tagNo?.trim()) {
                toaster.create({
                    title: "Invalid Tag",
                    description: "Tag number is required",
                    type: "warning",
                });
                return;
            }

            const response = await getTagDetails(
                tagNo,
                customerId,
                false
            );

            const data = response?.data;
            console.log(data,'data')

            if (!data) {
                toaster.create({
                    title: "Tag Not Found",
                    description: `No data found for tag ${tagNo}`,
                    type: "error",
                });
                return;
            }

            // ---------------- DUPLICATE CHECK ----------------
            const exists = draftRows.some(
                (row) => row.TAGNO === tagNo
            );

            if (exists) {
                toaster.create({
                    title: "Duplicate Tag",
                    description: `Tag ${tagNo} already added`,
                    type: "warning",
                });
                return;
            }

            // ---------------- ROW ID ----------------
            const rowId = `tag-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 5)}`;
                

            const stoneDetails = Array.isArray(data.STONEDETAILS)
                ? data.STONEDETAILS
                : [];
            console.log(stoneDetails,'stoneDetails')

            // ---------------- BUILD ROW ----------------
            const newRow: any = {
                __rowId: rowId,
                __isNew: true,
                __isEditing: false,
                __previewSno: draftRows.length + 1,

                TRANSACTION_TYPE: "SA",
                _type: "SA",

                ITEMID: data.ITEMID ? String(data.ITEMID) : "",
                TAGNO: String(data.TAGNO || tagNo),
                PCS: 1,

                GRSWT: Number(data.GRSWT) || 0,
                STNWT: Number(data.SALESSTNWT) || 0,
                NETWT: Number(data.NETWT) || 0,

                TOUCH: Number(data.TOUCH) || 0,
                MC: Number(data.MC) || 0,

                _hasStones: stoneDetails.length > 0,
                _hasCharges: false,
            };

            // ---------------- STONES ----------------
            let stonesWithId: any[] = [];

            if (stoneDetails.length > 0) {
                stonesWithId = stoneDetails.map(
                    (stone: any, index: number) => ({
                        id: `stone-${Date.now()}-${index}-${Math.random()
                            .toString(36)
                            .substr(2, 4)}`,

                        draftRowId: rowId,

                        stoneId: String(
                            stone.STNITEMID ||
                            stone.STNSUBITEMID ||
                            ""
                        ),

                        subStoneId: String(
                            stone.STNSUBITEMID || ""
                        ),

                        stonePcs: Number(stone.STNPCS || 1),
                        stoneWeight: Number(stone.SALESSTNWT || 0),

                        stoneUnit: stone.STONEUNIT || "g",
                        stoneCalculation: stone.CALCMODE || "w",

                        stoneRate: Number(stone.STNRATE || 0),
                        stoneAmount: Number(stone.STNAMT || 0),
                    })
                );

                console.log(stonesWithId,'stonesWithId')
                // recalc stone weight
                const totalStoneWeight = stonesWithId.reduce((sum: number, s: any) => {
                    return sum + Number(s.stoneWeight || 0);
                }, 0);

                newRow.STNWT = totalStoneWeight;
                newRow._stones= stonesWithId;
            }

            // ---------------- STORE UPDATE ----------------
            console.log(newRow,'newRownewRow')
            addDraftRow(newRow);

            setSelectedTransactionId("SA");

            // ---------------- SUCCESS ----------------
            toaster.create({
                title: "Tag Loaded",
                description: `Tag ${tagNo} loaded successfully`,
                type: "success",
                duration: 1500,
            });

            return {
                success: true,
                row: newRow,
            };
        } catch (error: any) {
            console.error("loadSaleTag error:", error);

            toaster.create({
                title: "Unexpected Error",
                description:
                    error?.message || "Failed to load tag details",
                type: "error",
            });

            return {
                success: false,
                message: error?.message || "Failed",
            };
        }
    };

    return { loadSaleTag };
};