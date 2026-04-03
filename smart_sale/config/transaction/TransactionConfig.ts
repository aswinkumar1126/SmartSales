type TransactionMode = "purchase" | "sale";

export const TransactionConfig = (type: TransactionMode) => {
    const isPurchase = type === "purchase";
    const isSale = type === "sale";

    return {
        type,

        // ✅ Account Type (Supplier vs Customer)
        accountType: isPurchase ? "PR" : "CU",

        // ✅ Transaction Types
        transactionTypes: isPurchase
            ? ["PU", "PR", "ISP", "REC"]
            : ["SA", "SR", "IS", "RE"],

        // ✅ Default Transaction Type
        defaultType: isPurchase ? "PU" : "SA",

        // ✅ Stock Behavior
        stockEffect: isPurchase ? "IN" : "OUT",

        // ✅ Labels (UI)
        labels: {
            pageTitle: isPurchase ? "Purchase" : "Sale",
            party: isPurchase ? "Supplier" : "Customer",
        },

        // ✅ API Type
        apiType: type, // used in hooks like useTransactions(type)

        // ✅ Validation Mode
        validateStock: isSale, // sale needs strict stock validation

        // ✅ Rate Usage
        useRate: true, // can customize later if needed
    };
};