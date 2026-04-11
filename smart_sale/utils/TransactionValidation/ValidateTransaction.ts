import { VALIDATORS } from "./validatorEngine";




export const validateTransactions = ({
    draftRows,
    isDraftRowsChanged,
    isClosingChanged,
    SALE_TRANSACTION_KEY_MAP,
    SALETRANSACTIONTYPES,
    getStockAvailability,
    isIssueType,
    isTagedItem,
}: any): { valid: boolean; error?: string } => {

    const draftChanged = isDraftRowsChanged();
    const closingChanged = isClosingChanged();

    // console.log(draftChanged , closingChanged ,'changesmade');    

    if (!draftChanged && !closingChanged) {
        return { valid: false, error: "No changes detected to save." };
    }

    if (draftRows.length === 0) {
        return { valid: false, error: "Please add at least one item." };
    }

    for (let i = 0; i < draftRows.length; i++) {
        const row = draftRows[i];

        const mappedType = SALE_TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];

        if (!mappedType) {
            return { valid: false, error: `Row ${i + 1}: Invalid transaction type` };
        }

        const validator = VALIDATORS[mappedType];

        if (validator) {
            const error = validator(row, { isTagedItem });

            if (error) {
                return { valid: false, error: `Row ${i + 1}: ${error}` };
            }
        }
    }

    // ---------------- STOCK VALIDATION ----------------
    const usedByPureId: Record<string, number> = {};

    draftRows.forEach((row: any) => {
        const transactionType = SALETRANSACTIONTYPES.find(
            (t: any) => t.value === row.TRANSACTION_TYPE
        );

        if (!transactionType) return;

        const isIssue = isIssueType(transactionType);

        if (isIssue && row.PUREID) {
            const key = String(row.PUREID);
            usedByPureId[key] =
                (usedByPureId[key] || 0) + Number(row.WT || 0);
        }
    });

    for (const pureId in usedByPureId) {
        const availability = getStockAvailability(pureId);
        console.log(availability,'availabilityofstock')

        if (availability && usedByPureId[pureId] > availability.total) {
            return {
                valid: false,
                error: `Pure ID ${pureId} exceeds stock`,
            };
        }
    }

    return { valid: true };
};