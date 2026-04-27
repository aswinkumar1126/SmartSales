export const saleColumns = (isTag: boolean) => [


    ...(isTag ? [{
        key: "TAGNO",
        label: "TAGNO",
        width: "65px",
        align: "left" as const,
        editable: true,
    }] : []),
    
    {
        key: "ITEMID",
        label: "ITEM",
        width: "120px",
        align: "left" as const,
        type: "combobox" as const,
      
    },
    {
        key: "PCS",
        label: "PCS",
        width: "25px",
        type: "number" as const,
        align: "right" as const,
        decimalScale:0
   
    },
    {
        key: "GRSWT",
        label: "GRS WT",
        width: "45px",
        type: "number" as const,
        align: "right" as const,
        decimalScale: 3
 
    },
    {
        key: "STNWT",
        label: "STONE",
        width: "45px",
        type: "number" as const,
        align: "right" as const,
        decimalScale: 3
 
    },
    {
        key: "NETWT",
        label: "NET WT",
        width: "45px",
        type: "number" as const,
        align: "right" as const,
        editable:false,
        decimalScale: 3
   
    },
    {
        key: "WASTYPE",
        label: "W.TYPE",
        width: "40px",
        type: "select" as const,
        align: "right" as const,

    },
    // {
    //     key: "WASPER",
    //     label: "WAS %",
    //     width: "35px",
    //     type: "number" as const,
    //     align: "right" as const,

    // },
    // {
    //     key: "WASTAGE",
    //     label: "WASTAGE",
    //     width: "40px",
    //     type: "number" as const,
    //     align: "right" as const,
    //     decimalScale: 3

    // },
    {
        key: "TOUCH",
        label: "TOUCH",
        width: "35px",
        type: "number" as const,
        align: "right" as const,
        max: 999,
        decimalScale: 1

    },
    {
        key: "PUREWT",
        label: "PURE WT",
        width: "45px",
        type: "number" as const,
        align: "right" as const,
        editable: false,
        decimalScale: 3
 
    },
    {
        key: "HMC",
        label: "HMC",
        width: "45px",
        type: "number" as const,
        align: "right" as const,
        decimalScale: 2,
        dependsOn:"ITEMID"

    },
    {
        key: "MC",
        label: "M.C",
        width: "35px",
        type: "number" as const,
        align: "right" as const,
        decimalScale: 2
  
    },
    
    // {
    //     key: "ATOUCH",
    //     label: "A.TOUCH",
    //     width: "45px",
    //     type: "number" as const,
    //     align: "right" as const,
    //     max: 999,
    //     decimalScale: 1

    // },
    {
        key: "STNAMT",
        label: "STN AMT",
        width: "45px",
        type: "number" as const,
        align: "right" as const,
        max: 999999999,
        decimalScale: 2,
        editable:false

    },
  
    {
        key: "DESCRIPTION",
        label: "DESC",
        width: "50px",
        align: "left" as const,
        type: "text" as const,

    },
].filter(Boolean);

export const issueColumns = [
    {
        key: "SNO",
        label: "S.N0",
        width: "40px",
        align: "center" as const,
        editable: false,

    },
    {
        key: "PUREID",
        label: "PURE GOLD NAME",
        width: "120px",
        align: "left" as const,
        type: "combobox" as const,

    },
    

    {
        key: "WT",
        label: "WEIGHT",
        width: "30px",
        type: "number" as const,
        align: "right" as const,
        
        decimalScale:3,
        allowFocus:true,
    


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
        width: "30px",
        type: "number" as const,
        align: "right" as const,
        max: 999,
        decimalScale: 3

    },
    {
        key: "ATOUCH",
        label: "A.TOUCH",
        width: "30px",
        type: "number" as const,
        align: "right" as const,
        max: 999,
        decimalScale: 3,
        allowFocus: true,
        editable: false,
        disabled: true,

    },
    {
        key: "PUREWT",
        label: "PURE WT",
        width: "40px",
        type: "number" as const,
        align: "right" as const,
        editable: true,
        disabled: true,
        decimalScale: 3

    },
    {
        key: "APUREWT",
        label: "A.PURE WT",
        width: "40px",
        type: "number" as const,
        align: "right" as const,
        editable: false,
        disabled:true,
        decimalScale: 3
    },
    
];

