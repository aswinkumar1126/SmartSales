import { usePurchaseTransactionStore } from "@/store/purchase/usePurchaseTransactionStore";
import { getTagDetails } from "@/service/TagedService";
import { toaster } from "@/components/ui/toaster";
import { calculateStoneAmount } from "../both/useCalculationStoneAmount";
import { MapOtherCharges } from "@/utils/transaction/purchase/MapOtherCharges";


export const useLoadPurchaseTag = () => {
    const {
        draftRows,
        addDraftRow,
        setSelectedTransactionId,
    } = usePurchaseTransactionStore();

    const loadPurchaseTag = async (
        tagNo: string,
        customerId: number,
        usePcsBySoftControl :boolean
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
        

            if (!data) {
                toaster.create({
                    title: "Tag Not Found",
                    description: `${response.error}`,
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
                

            const stonesRaw = data.STONEDETAILS || [];
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
                    stoneItemName: s.STNITEMNAME
                };
            });
            console.log(data,'stoneDetails');

            const STNPRESENT = data?.STNPRESENT === "Y";

           

            const totalStoneWeight = normalizedStones.reduce(
                (sum: number, s: any) => sum + Number(s.stoneWeight), 0
            );
            console.log(totalStoneWeight, 'totalStoneWeight');

            const totalStoneAmount = normalizedStones.length > 0
                ? normalizedStones.reduce((sum: number, s: any) => sum + Number(s.stoneAmount), 0)
                : data.STNAMT || 0;

            

            // ---------------- MISC CHARGES (HMC) ----------------
            const hmcAmount = Number(data?.HMCAMT ?? 0);

            const defaultHmcCharge =
                hmcAmount > 0
                    ? [{
                        draftRowId: rowId,
                        chargeId: "1",
                        chargeName: "HMC",
                        amount: hmcAmount.toString(),
                        finalAmount: hmcAmount.toString(),
                    }]
                    : [];

            // ---------------- BUILD ROW ----------------
            const newRow: any = {
                __rowId: rowId,
                __isNew: true,
                __isEditing: false,
                __previewSno: draftRows.length + 1,

                TRANSACTION_TYPE: "PR",
                _type: "PR",

                ITEMID: data.ITEMID ? String(data.ITEMID) : "",
                TAGNO: String(data.TAGNO || tagNo),
                PCS: 1,

                GRSWT: Number(data.GRSWT).toFixed(3) || 0,
                STNWT: Number(data.SALESSTNWT).toFixed(3) || 0,
                NETWT: Number(data.NETWT).toFixed(3) || 0,

                STN_PRESENT: STNPRESENT,

                TOUCH: Number(data.TOUCH).toFixed(2) || 0,
                MC: Number(data.MC).toFixed(2) || 0,
                STNAMT : Number(totalStoneAmount).toFixed(0) || 0,
                _hasCharges: true,
                HMC: hmcAmount,

                _stones: normalizedStones,
                _miscCharges: defaultHmcCharge || [],

            };
          

     
            // ---------------- STORE UPDATE ----------------
       
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

    return { loadPurchaseTag };
};