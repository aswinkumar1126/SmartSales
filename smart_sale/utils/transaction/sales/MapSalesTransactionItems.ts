export const mapSalesTransactionItems = (transactionData: any) => {
    let allItems: any[] = [];
    let stones: any[] = [];
    let charges: any[] = [];

    const details = transactionData.TRANSACTION_DETAILS;

    if (!details) return { rows: [], stones, charges };

    const pushItems = (list: any[], type: string) => {
        list.forEach((item) => {
            allItems.push({ ...item, _type: type });
        });
    };

    if (details.sales) pushItems(details.sales, "SA");
    if (details.issue) pushItems(details.issue, "IS");
    if (details.sales_return) pushItems(details.sales_return, "SR");
    if (details.receipt) pushItems(details.receipt, "RE");

    const rows = allItems.map((item, index) => {
        const rowId = `edit-${Date.now()}-${index}`;

        // 👉 map row (same as your logic, simplified)
        return {
            __rowId: rowId,
            TRANSACTION_TYPE: item._type,
            PUREWT: item.PUREWT || "",
            AMOUNT: item.AMOUNT || "",
        };
    });

    return { rows, stones, charges };
};