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
}: any): { valid: boolean; error?: string } => {

    const draftChanged = isDraftRowsChanged();
    const closingChanged = isClosingChanged();
    const closingPayload = getClosingDetailsPayload();
    const closingHasValues = hasAnyClosingValue(closingPayload);

    console.log({ draftChanged, closingChanged, closingHasValues }, 'changesMade');

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
            const error = validator(row);
            console.log(error,'errorerror')
            if (error) {
                return { valid: false, error: `Row ${i + 1}: ${error}` };
            }
        }
    }

    // ✅ Stock validation
    const usedByPureId: Record<string, number> = {};

    draftRows.forEach((row: any) => {
        const transactionType = TRANSACTIONTYPES.find(
            (t: any) => t.value === row.TRANSACTION_TYPE
        );
        if (!transactionType) return;

        const isIssue = isIssueType(transactionType);
        console.log(isIssue, row.PUREID, transactionType, 'isIssuecheck')
        if (transactionType.value === "ISP" && row.PUREID) {
            const key = String(row.PUREID);
            usedByPureId[key] = (usedByPureId[key] || 0) + Number(row.WT || 0);
        }
    });

    for (const pureId in usedByPureId) {
        const availability = getStockAvailability(pureId);
        console.log(availability, 'availabilityofstock');

        if ( availability && usedByPureId[pureId] >  availability.total) {
            return {
                valid: false,
                error: `Pure ID ${pureId} exceeds available stock`,
            };
        }
    }

    return { valid: true };
};