export const issueColumns = [
    {
        key: "SNO",
        label: "S.N0",
        width: "15px",
        align: "left" as const,
        editable: false,

    },
    {
        key: "ITEMID",
        label: "ITEM",
        width: "45px",
        align: "left" as const,
        type: "combobox" as const,
      
    },
    {
        key: "PCS",
        label: "PCS",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
        decimalScale:0
   
    },
    {
        key: "GRSWT",
        label: "GRS WT",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        decimalScale: 3
 
    },
    {
        key: "STNWT",
        label: "STONE",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        decimalScale: 3
 
    },
    {
        key: "NETWT",
        label: "NET WT",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        editable:false,
        decimalScale: 3
   
    },
    {
        key: "WASTYPE",
        label: "W.TYPE",
        width: "25px",
        type: "select" as const,
        align: "right" as const,

    },
    // {
    //     key: "WASPER",
    //     label: "WAS %",
    //     width: "20px",
    //     type: "number" as const,
    //     align: "right" as const,

    // },
    // {
    //     key: "WASTAGE",
    //     label: "WASTAGE",
    //     width: "20px",
    //     type: "number" as const,
    //     align: "right" as const,
    //     decimalScale: 3

    // },
    {
        key: "TOUCH",
        label: "TOUCH",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
        max: 999,
        decimalScale: 1

    },
    {
        key: "PUREWT",
        label: "PURE WT",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        editable: false,
        decimalScale: 3
 
    },
    {
        key: "HMC",
        label: "HMC",
        width: "30px",
        type: "number" as const,
        align: "right" as const,
        decimalScale: 3,
        dependsOn:"ITEMID"

    },
    {
        key: "MC",
        label: "M.C",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        decimalScale: 2
  
    },
    
    {
        key: "ATOUCH",
        label: "A.TOUCH",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
        max: 999,
        decimalScale: 1

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
        label: "WEIGHT",
        width: "20px",
        type: "number" as const,
        align: "right" as const,
        max: 9999999999,
        decimalScale:3

    },
    {
        key: "AWT",
        label: "A.WEIGHT",
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
        key: "ATOUCH",
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
        key: "APURE",
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

