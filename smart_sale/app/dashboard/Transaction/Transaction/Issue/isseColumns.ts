export const issueColumns = [
    {
        key: "SNO",
        label: "S.No",
        width: "80px",
        align: "center" as const,
        editable: false
    },
    {
        key: "ITEMID",
        label: "Item",
        width: "150px",
        align: "left" as const,
        type: "combobox" as const
    },
    {
        key: "PCS",
        label: "Pcs",
        width: "100px",
        type: "number" as const,
        align: "right" as const
    },
    {
        key: "GRSWT",
        label: "Gross Wt",
        width: "120px",
        type: "number" as const,
        align: "right" as const
    },
    {
        key: "LESSWT",
        label: "Less Wt",
        width: "120px",
        type: "number" as const,
        align: "right" as const
    },
    {
        key: "NETWT",
        label: "Net Wt",
        width: "120px",
        type: "number" as const,
        align: "right" as const
    },
    {
        key: "PURITY",
        label: "Purity",
        width: "100px",
        type: "number" as const,
        align: "right" as const
    },
    {
        key: "PUREWT",
        label: "Pure Wt",
        width: "120px",
        type: "number" as const,
        align: "right" as const
    },
    {
        key: "RATE",
        label: "Rate",
        width: "100px",
        type: "number" as const,
        align: "right" as const
    },
    {
        key: "MCHARGE",
        label: "M.Charge",
        width: "120px",
        type: "number" as const,
        align: "right" as const
    },
    {
        key: "WASTAGE",
        label: "Wastage",
        width: "120px",
        type: "number" as const,
        align: "right" as const
    },
];

export const itemCollection = {


    items: [
        { label: "Gold", value: "GOLD" },
        { label: "Silver", value: "SILVER" },
        { label: "Diamond", value: "DIAMOND" },
        { label: "Platinum", value: "PLATINUM" },
        { label: "Ruby", value: "RUBY" },
        { label: "Emerald", value: "EMERALD" },
        { label: "Sapphire", value: "SAPPHIRE" },
    ]
};