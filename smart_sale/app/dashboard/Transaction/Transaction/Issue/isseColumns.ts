export const issueColumns = [
    {
        key: "SNO",
        label: "S.N0",
        width: "15px",
        align: "center" as const,
        editable: false,

    },
    {
        key: "ITEMID",
        label: "ITEM",
        width: "40px",
        align: "left" as const,
        type: "combobox" as const,
      
    },
    {
        key: "PCS",
        label: "PCS",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
   
    },
    {
        key: "GRSWT",
        label: "GRS WT",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
 
    },
    {
        key: "LESSWT",
        label: "LESS WT",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
 
    },
    {
        key: "NETWT",
        label: "NET WT",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        editable:false
   
    },
    {
        key: "PURITY",
        label: "PURITY",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
    
    },
    {
        key: "PUREWT",
        label: "PURE WT",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        editable: false
 
    },
    {
        key: "RATE",
        label: "RATE",
        width: "20px",
        type: "number" as const,
        align: "right" as const,

    },
    {
        key: "MCHARGE",
        label: "M.C",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
  
    },
    {
        key: "WASTAGE",
        label: "WASTAGE",
        width: "25px",
        type: "number" as const,
        align: "right" as const,

    },
    
    {
        key: "IGST",
        label: "IGST",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
  
    },
    {
        key: "CGST",
        label: "CGST",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
  
    },
    {
        key: "SGST",
        label: "SGST",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
  
    },
    {
        key: "AMOUNT",
        label: "AMOUNT",
        width: "25px",
        type: "number" as const,
        align: "right" as const,

    },
];
export const issueDataColumns = [
    {
        key: "SNO",
        label: "S.N0",
        width: "15px",
        align: "center" as const,
        editable: false,

    },
    {
        key: "PUREID",
        label: "PURE GOLD NAME",
        width: "50px",
        align: "left" as const,
        type: "combobox" as const,

    },
    
    
    {
        key: "WT",
        label: "WT",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
        max:9999999999,
        decimalScale:3

    },
    {
        key: "A_WT",
        label: "A.WT",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        max: 999,
        decimalScale: 3
       

    },
    {
        key: "TOUCH",
        label: "TOUCH",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        max: 999,
        decimalScale: 3

    },
    {
        key: "A_TOUCH",
        label: "A.TOUCH",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        max: 999,
        decimalScale: 3

    },
    {
        key: "PURE",
        label: "PURE",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        editable: false,
        disabled: true,
        max: 9999999999,
        decimalScale: 3

    },
    {
        key: "A_PURE",
        label: "A.PURE",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        editable: false,
        disabled:true,
        max: 9999999999,
        decimalScale: 3


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