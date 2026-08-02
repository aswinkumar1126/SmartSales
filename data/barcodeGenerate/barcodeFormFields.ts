export const transactionTableCols = [
    {
        key: "barcode",
        label: "BARCODE",
        align: "left" as const,
        disabled: true,
        width: '120px'
    },
    {
        key: "grsweight",
        label: "WEIGHT",
        align: "right" as const,
        decimalScale: 3,
        width: '80px',
        type: "number" as const,
        max: 999999999,
        allowFocus: true
    },
    {
        key: "purchaseStoneWt",
        label: "P. STN WT",
        align: "right" as const,
        decimalScale: 3,
        type: "number" as const,
        width: '100px',
        allowFocus: true,
        showWhenHasStone: true  // 👈 Add this flag
    },
    {
        key: "stoneWt",
        label: "STN WT",
        align: "right" as const,
        decimalScale: 3,
        type: "number" as const,
        width: '100px',
        allowFocus: true,
        showWhenHasStone: true  // 👈 Add this flag
    },
    {
        key: "navaWt",
        label: "NAVA WT",
        align: "right" as const,
        decimalScale: 3,
        type: "number" as const,
        width: '100px',
        allowFocus: true,
        showWhenHasStone: true  // 👈 Add this flag
    },
    {
        key: "salesStoneWt",
        label: "SALES STN WT",
        align: "right" as const,
        decimalScale: 3,
        width: '100px',
        allowFocus: true,
        disabled: true,
        showWhenHasStone: true  // 👈 Add this flag
    },
    {
        key: "diamondWt",
        label: "DIAMOND WT",
        align: "right" as const,
        decimalScale: 3,
        width: '90px',
        type: "number" as const,
        allowFocus: true
    },
    {
        key: "size",
        label: "SIZE",
        align: "center" as const,
        width: '60px',
        type: "text" as const,
    },
    {
        key: '__print',
        label: 'PRINT',
        align: 'center' as const,
        width: '100px'
    }
];