// @/utils/draftRowUtils.ts

import { TransactionType } from "@/types/transcation/Transaction";

// Counter for generating unique temp IDs
let tempIdCounter = 0;

// Transaction type codes
export type TransactionTypeCode = 'ISP' | 'REC' | 'PU' | 'PR';

// Sales Transaction Item Interface (with string for form handling)
export interface PURCHASE_TRANSACTION_ITEMS {

    ITEMID: string | null;
    SNO?: string;
    TAGNO?: string;
    PCS: string;
    GRSWT: string;
    STNWT: string;
    NETWT: string;
    WASTYPE: string;
    TOUCH: string;
    PUREWT: string;
    HMC: string;
    STNAMT: string;
    MC: string;
    DESCRIPTION?: string;
}

// Issue Transaction Item Interface (with string for form handling)
export interface ISSUE_TRANSACTION_ITEMS {

    WT: string;
    TOUCH: string;
    PUREWT?: string;

    AWT?: string;
    ATOUCH?: string;
    APUREWT?: string;
}

// Base Draft Row Interface
export interface DraftRow {
    __rowId: string;
    __isNew?: boolean;
    __tempId?: string;
    __previewSno?: number;
    __isTaged?:boolean;
    TRANSACTION_TYPE: string;
    items?: PURCHASE_TRANSACTION_ITEMS[] | ISSUE_TRANSACTION_ITEMS[];
    [key: string]: any;
}

// Sales Draft Row (SA & SR) - All fields as strings for form handling
export interface PurchaseDraftRow extends DraftRow {
    ITEMID: string | null;
    SNO?: string;
    TAGNO?: string;
    PCS: string;
    GRSWT: string;
    STNWT: string;
    NETWT: string;
    WASTYPE: string;
    TOUCH: string;
    PUREWT: string;
    HMC: string;
    STNAMT: string;
    MC: string;
    DESCRIPTION?: string;
    RATE: string;
    AMOUNT: string;
    DISC: string;
    ITEM_TYPE: string;
}

// Issue Draft Row (IS) - All fields as strings for form handling
export interface IssueDraftRow extends DraftRow {
    WT: string;
    TOUCH: string;
    PUREWT?: string;
    AWT?: string;
    ATOUCH?: string;
    APUREWT?: string;
    RATE: string;
    AMOUNT: string;
}

// Receipt Draft Row (RE) - All fields as strings for form handling
export interface ReceiptDraftRow extends DraftRow {
    AMOUNT: string;
    BANK_NAME: string;
    TRAN_MODE: string;
    CHQ_NO: string;
    TRAN_DATE: string;
    NOTES?: string;
}

export const getDraftRowTempId = (transactionType: string): string => {
    tempIdCounter++;
    return `temp-${transactionType}-${Date.now()}-${tempIdCounter}`;
};

export const getPermanentRowId = (transactionType: string): string => {
    const random = Math.random().toString(36).substring(2, 8);
    return `row-${transactionType}-${Date.now()}-${random}`;
};

/**
 * Reset the temporary ID counter
 */
export const resetDraftRowTempId = (): void => {
    tempIdCounter = 0;
};

/**
 * Check if an ID is a temporary ID
 */
export const isTempId = (id: string): boolean => {
    return id?.startsWith('temp-') || false;
};

/**
 * Extract transaction type from row ID
 */
export const getTransactionTypeFromId = (id: string): string | null => {
    const match = id.match(/^(?:temp|row)-([A-Z]{2})-/);
    return match ? match[1] : null;
};

/**
 * Convert string to number safely
 */
export const toNumber = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

/**
 * Convert number to string for form
 */
export const toString = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return value.toString();
};

/**
 * Create empty sales row (for SA and SR)
 */
export const createEmptyPurchaseRow = (transactionType: 'PU' | 'PR'): PurchaseDraftRow => {
    return {
        __rowId: '',
        __isNew: true,
        __isTaged:true,
        TRANSACTION_TYPE: transactionType,
        ITEMID: null,
        SNO: '',
        TAGNO: '',
        PCS: '',
        GRSWT: '',
        STNWT: '',
        NETWT: '',
        WASTYPE: 'N',
        TOUCH: '',
        PUREWT: '',
        HMC: '',
        STNAMT: '',
        MC: '',
        DESCRIPTION: '',
        RATE: '',
        AMOUNT: '',
        DISC: '',
        ITEM_TYPE:'',
    };
};

/**
 * Create empty issue row (for IS)
 */
export const createEmptyIssueRow = (): IssueDraftRow => {
    return {
        __rowId: '',
        __isNew: true,
        TRANSACTION_TYPE: 'IS',
        WT: '',
        TOUCH: '',
        PUREWT: '',
        AWT: '',
        ATOUCH: '',
        APUREWT: '',
        RATE: '',
        AMOUNT: '',
    };
};

/**
 * Create empty receipt row (for RE)
 */
export const createEmptyReceiptRow = (): ReceiptDraftRow => {
    const today = new Date().toISOString().split('T')[0];
    return {
        __rowId: '',
        __isNew: true,
        TRANSACTION_TYPE: 'RE',
        AMOUNT: '',
        BANK_NAME: '',
        TRAN_MODE: '',
        CHQ_NO: '',
        TRAN_DATE: today,
        NOTES: '',
    };
};

/**
 * Create empty row based on transaction type
 */
export const createEmptyRowForType = (transactionType: TransactionType): DraftRow => {
    const code = transactionType.value as TransactionTypeCode;

    switch (code) {
        case 'PU':
            return createEmptyPurchaseRow('PU');
        case 'PR':
            return createEmptyPurchaseRow('PR');
        case 'ISP':
            return createEmptyIssueRow();
        case 'REC':
            return createEmptyReceiptRow();
        default:
            throw new Error(`Unknown transaction type: ${code}`);
    }
};

/**
 * Create a draft row with proper ID (temp or permanent)
 */
export const createDraftRow = (
    transactionType: TransactionType,
    existingData?: Partial<DraftRow>
): DraftRow => {
    const isNew = !existingData?.__rowId || isTempId(existingData.__rowId);

    // Create empty row based on type
    const emptyRow = createEmptyRowForType(transactionType);

    // Generate appropriate ID
    const rowId = isNew
        ? getDraftRowTempId(transactionType.value || 'SA')
        : existingData!.__rowId!;

    const previewSno = existingData?.__previewSno || 1;

    return {
        ...emptyRow,
        ...existingData,
        __rowId: rowId,
        __isNew: isNew,
        __tempId: isNew ? rowId : undefined,
        __previewSno: previewSno,
        TRANSACTION_TYPE: transactionType.value ? transactionType.value : '',
    };
};

/**
 * Convert a temporary row to permanent (after saving)
 */
export const convertToPermanentRow = (tempRow: DraftRow): DraftRow => {
    if (!isTempId(tempRow.__rowId)) {
        return tempRow; // Already permanent
    }

    const permanentId = getPermanentRowId(tempRow.TRANSACTION_TYPE);

    return {
        ...tempRow,
        __rowId: permanentId,
        __isNew: false,
        __tempId: undefined,
    };
};

/**
 * Validate draft row based on transaction type
 */
export const validateDraftRow = (
    row: DraftRow,
    transactionType: string
): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    switch (transactionType) {
        case 'PU': 
        case 'PR': 
            const purchaseRow = row as PurchaseDraftRow;
            if (!purchaseRow.ITEMID && !purchaseRow.TAGNO) {
                errors.push('Item or Tag number is required');
            }
            if (toNumber(purchaseRow.PCS) <= 0 && toNumber(purchaseRow.STNWT) <= 0) {
                errors.push('Either Pieces or Weight must be greater than 0');
            }
            if (toNumber(purchaseRow.RATE) <= 0) {
                errors.push('Rate must be greater than 0');
            }
            break;

        case 'IS': // Issue
            const issueRow = row as IssueDraftRow;
            if (toNumber(issueRow.WT) <= 0) {
                errors.push('Weight must be greater than 0');
            }
            if (toNumber(issueRow.TOUCH) <= 0) {
                errors.push('Touch must be greater than 0');
            }
            break;

        case 'RE': // Receipt
            const receiptRow = row as ReceiptDraftRow;
            if (toNumber(receiptRow.WT) <= 0) {
                errors.push('Weight must be greater than 0');
            }
            break;
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};



/**
 * Create a deep copy of a draft row
 */
export const cloneDraftRow = <T extends DraftRow>(row: T): T => {
    return JSON.parse(JSON.stringify(row));
};

/**
 * Generate preview serial number for new rows
 */
export const getNextPreviewSno = (existingRows: DraftRow[], transactionType: string): number => {
    const typeRows = existingRows.filter(r => r.TRANSACTION_TYPE === transactionType);
    return typeRows.length + 1;
};

/**
 * Format row for API submission (convert strings to numbers)
 */
export const formatRowForAPI = (row: DraftRow): any => {
    // Remove internal fields before sending to API
    const { __rowId, __isNew, __tempId, __previewSno, ...apiRow } = row;

    // Convert string numbers to actual numbers for API
    const convertedRow: any = { ...apiRow };

    // Define which fields should be numbers
    const numberFields = ['PCS', 'GRSWT', 'STNWT', 'NETWT', 'TOUCH', 'PUREWT',
        'HMC', 'STNAMT', 'MC', 'RATE', 'AMOUNT', 'DISC',
        'WT', 'AWT', 'ATOUCH', 'APUREWT'];

    numberFields.forEach(field => {
        if (convertedRow[field] !== undefined && convertedRow[field] !== '') {
            convertedRow[field] = toNumber(convertedRow[field]);
        } else {
            convertedRow[field] = 0;
        }
    });

    // Handle ITEMID specially
    if (convertedRow.ITEMID === '' || convertedRow.ITEMID === null) {
        convertedRow.ITEMID = null;
    } else if (convertedRow.ITEMID) {
        convertedRow.ITEMID = toNumber(convertedRow.ITEMID);
    }

    return convertedRow;
};

/**
 * Format API response to draft row (convert numbers to strings)
 */
export const formatAPIResponseToDraftRow = (apiData: any, transactionType: string): DraftRow => {
    const row: any = {
        __rowId: getPermanentRowId(transactionType),
        __isNew: false,
        TRANSACTION_TYPE: transactionType,
    };

    // Convert number fields to strings
    const numberFields = ['PCS', 'GRSWT', 'STNWT', 'NETWT', 'TOUCH', 'PUREWT',
        'HMC', 'STNAMT', 'MC', 'RATE', 'AMOUNT', 'DISC',
        'WT', 'AWT', 'ATOUCH', 'APUREWT'];

    Object.keys(apiData).forEach(key => {
        if (numberFields.includes(key)) {
            row[key] = toString(apiData[key]);
        } else {
            row[key] = apiData[key];
        }
    });

    return row as DraftRow;
};