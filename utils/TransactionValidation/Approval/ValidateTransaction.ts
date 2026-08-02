import { VALIDATORS } from "./validatorEngine";

export const validateTransactions = ({
    draftRows,
    isDraftRowsChanged,
    APPROVAL_TRANSACTION_KEY_MAP,
    APPROVALTRANSACTIONTYPES,
    getStockAvailability,
    isSRBillTag
}: any): { valid: boolean; error?: string } => {

    const draftChanged = isDraftRowsChanged();

  

    // ✅ Must have EITHER draft rows with changes OR closing details with any value
    const hasSomethingToSave = draftChanged ;

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
        const mappedType = APPROVAL_TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];

        if (!mappedType) {
            return { valid: false, error: `Row ${i + 1}: Invalid transaction type` };
        }

        const validator = VALIDATORS[mappedType];
        if (validator) {
            const error = validator(row, isSRBillTag );
       
            if (error) {
                return { valid: false, error: `Row ${i + 1}: ${error}` };
            }
        }
    }

    return { valid: true };
};