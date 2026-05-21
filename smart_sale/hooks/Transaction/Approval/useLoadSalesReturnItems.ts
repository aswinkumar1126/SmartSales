// useLoadSalesReturnItems.ts
import { useCallback } from "react";
import { useApprovalTransactionStore } from "@/store/approval/useApprovalTransaction";
import { toaster } from "@/components/ui/toaster";

export const useLoadApprovalReceiptItems = () => {
    const { draftRows, addDraftRow } = useApprovalTransactionStore();

    const loadApprovalReceiptItems = useCallback((items: any[]) => {
        if (!items || !Array.isArray(items) || items.length === 0) {
            toaster.create({
                title: "No Items",
                description: "No items selected to load",
                type: "warning",
            });
            return;
        }

        let addedCount = 0;

        items.forEach((item) => {
            // ✅ UNIQUE CHECK (SNO is perfect)
            const exists = draftRows.some(
                (row) => row.SNO === item.SNO
            );

            if (exists) {
                toaster.create({
                    title: "Duplicate Item",
                    description: `Item SNO ${item.SNO} already exists`,
                    type: "warning",
                    duration: 1200,
                });
                return;
            }

            const rowId = `sr-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 6)}`;

            // ✅ MAP STONES → attach to row (NEW APPROACH)
            const stones = (item.STONEDETAILS || []).map(
                (stone: any, index: number) => ({
                    id: `stone-${Date.now()}-${index}`,
                    draftRowId: rowId,

                    stoneId: String(
                        stone.STNITEMID || stone.STNSUBITEMID || ""
                    ),
                    subStoneId: String(stone.STNSUBITEMID || ""),

                    stonePcs: Number(stone.STNPCS || 1),
                    stoneWeight: Number(stone.STNWT || 0),

                    stoneUnit: stone.STONEUNIT || "g",
                    stoneCalculation: stone.CALCMODE || "w",

                    stoneRate: Number(stone.STNRATE || 0),
                    stoneAmount: Number(stone.STNAMT || 0),
                })
            );

            // ✅ RECALCULATE STONE WT
            const totalStoneWeight = stones.reduce((sum:number, s:any) => {
                return sum + Number(s.stoneWeight || 0);
            }, 0);


            // ✅ BUILD ROW
            const newRow = {
                __rowId: rowId,
                __isNew: true,
                __isEditing: false,
                __previewSno: draftRows.length + addedCount + 1,

                TRANSACTION_TYPE: "SR",
                _type: "SR",

                ITEMID: String(item.ITEMID || ""),
                TAGNO: String(item.TAGNO || ""),
                PCS: Number(item.PCS || 1),

                GRSWT: Number(item.GRSWT || 0),
                STNWT: totalStoneWeight,
                NETWT: Number(item.NETWT || 0),

                WASTYPE: item.WASTYPE,
                TOUCH: Number(item.TOUCH || 0),
                MC: Number(item.MC || 0),

                // ✅ IMPORTANT
                SNO: item.SNO,
                BILLNO: item.BILLNO,

                DESCRIPTION: item.DESCRIPTION || "",

                // ✅ Attach directly (NO localStorage anymore)
                _stones: stones,
                _miscCharges: item.OTHERCHARGESDETAILS || [],

                _hasStones: stones.length > 0,
                _hasCharges: !!item.OTHERCHARGESDETAILS,
            };

            addDraftRow(newRow);
            addedCount++;
        });

        // ✅ SUCCESS MESSAGE
        if (addedCount > 0) {
            toaster.create({
                title: "Items Loaded",
                description: `${addedCount} item(s) added`,
                type: "success",
                duration: 1200,
            });
        }
    }, [draftRows, addDraftRow]);

    return { loadApprovalReceiptItems };
};