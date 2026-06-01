import { VALIDATORS } from "./validatorEngine";
import { ClosingDetails } from "@/types/transcation/SaleTransaction";

// ✅ Check if closing details has ANY meaningful value
const hasAnyClosingValue = (payload: ClosingDetails): boolean => {
    return (
        (payload.CONVAMT ?? 0) !== 0 ||
        (payload.CONVWT ?? 0) !== 0 ||
        (payload.DISCAMT ?? 0) !== 0 ||
        (payload.DISCWT ?? 0) !== 0 ||
        (payload.CASHPAID ?? 0) !== 0 ||
        (payload.CASHRCVD ?? 0) !== 0 ||
        (payload.BANKPAID ?? 0) !== 0 ||
        (payload.BANKRCVD ?? 0) !== 0 ||
        (payload.BANKPAIDDETAILS?.length ?? 0) > 0 ||
        (payload.BANKRCVDDETAILS?.length ?? 0) > 0
    );
};

export const validateTransactions = ({
    draftRows,
    isDraftRowsChanged,
    isClosingChanged,
    getClosingDetailsPayload,
    TRANSACTION_KEY_MAP,
    TRANSACTIONTYPES,
    getStockAvailability,
    isIssueType,
    isTagedPR
}: any): { valid: boolean; error?: string } => {

    const draftChanged = isDraftRowsChanged();
    const closingChanged = isClosingChanged();
    const closingPayload = getClosingDetailsPayload();
    const closingHasValues = hasAnyClosingValue(closingPayload);

    // console.log({ draftChanged, closingChanged, closingHasValues }, 'changesMade');

    // ✅ Must have EITHER draft rows with changes OR closing details with any value
    const hasSomethingToSave = draftChanged || closingChanged || closingHasValues;

    if (!hasSomethingToSave) {
        return { valid: false, error: "No changes detected to save." };
    }

    // ✅ If only closing details — allow save, skip row validations
    const hasDraftContent = draftRows.length > 0;

    if (!hasDraftContent && !draftChanged) {
        // Only closing details present — already passed hasSomethingToSave check
        return { valid: true };
    }

    // ✅ Draft rows exist but are empty after changes
    if (draftChanged && draftRows.length === 0) {
        return { valid: false, error: "Please add at least one item." };
    }

    // ✅ Row-level validation
    for (let i = 0; i < draftRows.length; i++) {
        const row = draftRows[i];
        const mappedType = TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];

        if (!mappedType) {
            return { valid: false, error: `Row ${i + 1}: Invalid transaction type` };
        }

        const validator = VALIDATORS[mappedType];
        if (validator) {
            const error = validator(row, isTagedPR);
            console.log(error,'errorerror')
            if (error) {
                return { valid: false, error: `Row ${i + 1}: ${error}` };
            }
        }
    }

    // ✅ Stock validation
// ✅ Stock validation — keyed by "pureId_touch"
const usedByPureIdAndTouch: Record<string, number> = {};

draftRows.forEach((row: any) => {
    const transactionType = TRANSACTIONTYPES.find(
        (t: any) => t.value === row.TRANSACTION_TYPE
    );
    if (!transactionType) return;

    if (transactionType.value === "ISP" && row.PUREID && row.TOUCH) {
        // ✅ Key includes both pureId AND touch
        const key = `${row.PUREID}_${row.TOUCH}`;
        usedByPureIdAndTouch[key] = (usedByPureIdAndTouch[key] || 0) + Number(row.WT || 0);
    }
});

for (const key in usedByPureIdAndTouch) {
    const [pureId, touch] = key.split('_');
    const availability = getStockAvailability(pureId, Number(touch));

    console.log(key, availability, 'availabilityofstock');

    // ✅ Reference the correct variable name
    if (availability && usedByPureIdAndTouch[key] > availability.total) {
        return {
            valid: false,
            error: `Pure ID ${pureId} (Touch: ${touch}) exceeds available stock`,
        };
    }
}
    // ✅ Purchase Return Validation
    const usedByItemIdAndTouch: Record<string, { pcs: number; grswt: number; stnwt: number }> = {};

    draftRows.forEach((row: any) => {
        const transactionType = TRANSACTIONTYPES.find(
            (t: any) => t.value === row.TRANSACTION_TYPE
        );
        if (!transactionType) return;

        if (transactionType.value === "PR" && row.ITEMID && row.TOUCH) {
            const key = `${row.ITEMID}_${row.TOUCH}`;

            if (!usedByItemIdAndTouch[key]) {
                usedByItemIdAndTouch[key] = {
                    pcs: 0,
                    grswt: 0,
                    stnwt: 0,
                };
            }

            usedByItemIdAndTouch[key].pcs += Number(row.PCS || 0);
            usedByItemIdAndTouch[key].grswt += Number(row.GRSWT || 0);
            usedByItemIdAndTouch[key].stnwt += Number(row.STNWT || 0);
        }
    });
    for (const key in usedByItemIdAndTouch) {
        const [itemId, touch] = key.split("_");

        const availability = getStockAvailability(itemId, null);

        console.log(availability,'availabilitywhiesaving');

        const used = usedByItemIdAndTouch[key];

        if (!availability) {
            return {
                valid: false,
                error: `Stock not found for Pure ID ${itemId} (Touch: ${touch})`,
            };
        }


        if (!availability) {
            return {
                valid: false,
                error: `Stock not found for ITEM ID ${itemId}`,
            };
        }

        if (availability.pieces.remaining === 0 && availability.weight.remaining > 0) {
            return {
                valid: false,
                error: `Must match the pcs ${availability.pieces.remaining} with weight ${availability.weight.remaining}`,
            };
        }

        if (availability.pieces.remaining < 0) {
            return {
                valid: false,
                error: `Stock Limit Exceed available ${availability.pieces.total}  used ${availability.pieces.used}`,
            };
        }
        if (availability.weight.remaining < 0) {
            return {
                valid: false,
                error: `Stock Limit Exceed available ${availability.weight.total}  used ${availability.weight.used}`,
            };
        }

        if (availability.weight.remaining === 0 && availability.pieces.remaining > 0) {
            return {
                valid: false,
                error: `Must match the pcs ${availability.pieces.remaining} with weight ${availability.weight.remaining}`,
            };
        }

    }

    return { valid: true };

    
};

