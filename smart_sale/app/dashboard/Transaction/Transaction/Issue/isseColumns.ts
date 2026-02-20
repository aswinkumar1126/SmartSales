export const issueColumns = [
    {
        key: "SNO",
        label: "S.N0",
        width: "10px",
        align: "left" as const,
        editable: false,

    },
    {
        key: "ITEMID",
        label: "ITEM",
        width: "50px",
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
        key: "STNWT",
        label: "STONE",
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
        key: "WASTYPE",
        label: "WAS.TYPE",
        width: "25px",
        type: "text" as const,
        align: "right" as const,

    },
    {
        key: "WASPER",
        label: "WAS %",
        width: "20px",
        type: "number" as const,
        align: "right" as const,

    },
    {
        key: "WASTAGE",
        label: "W",
        width: "20px",
        type: "number" as const,
        align: "right" as const,

    },
    {
        key: "TOUCH",
        label: "TOUCH",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
        max: 999,
        decimalScale: 0

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
        key: "MC",
        label: "M.C",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
  
    },
    
    {
        key: "ATOUCH",
        label: "A.TOUCH",
        width: "20px",
        type: "number" as const,
        align: "right" as const,

    },
  
    {
        key: "DESCRIPTION",
        label: "DESCRIPTION",
        width: "45px",
        align: "left" as const,

    },
];
export const issueDataColumns = [
    {
        key: "SNO",
        label: "S.N0",
        width: "10px",
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
        max: 9999999999,
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

