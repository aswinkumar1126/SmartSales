export const ApprovalColumns = (isTag: boolean) => [


    ...(isTag ? [{
        key: "TAGNO",
        label: "TAGNO",
        width: "50px",
        align: "left" ,
        editable: true,
    }] : []),
    
    {
        key: "ITEMID",
        label: "ITEM",
        width: "110px",
        align: "left" ,
        type: "combobox" ,
      
    },
    {
        key: "PCS",
        label: "PCS",
        width: "30px",
        type: "number" ,
        align: "right" ,
        decimalScale:0
   
    },
    {
        key: "GRSWT",
        label: "GRS WT",
        width: "45px",
        type: "number" ,
        align: "right" ,
        decimalScale: 3
 
    },
    {
        key: "STNWT",
        label: "STONE",
        width: "45px",
        type: "number" ,
        align: "right" ,
        decimalScale: 3
 
    },
    {
        key: "NETWT",
        label: "NET WT",
        width: "45px",
        type: "number" ,
        align: "right" ,
        editable:false,
        decimalScale: 3
   
    },
    // {
    //     key: "WASTYPE",
    //     label: "W.TYPE",
    //     width: "40px",
    //     type: "select" ,
    //     align: "right" ,

    // },
    // {
    //     key: "WASPER",
    //     label: "WAS %",
    //     width: "35px",
    //     type: "number" ,
    //     align: "right" ,

    // },
    // {
    //     key: "WASTAGE",
    //     label: "WASTAGE",
    //     width: "40px",
    //     type: "number" ,
    //     align: "right" ,
    //     decimalScale: 3

    // },
    {
        key: "TOUCH",
        label: "TOUCH",
        width: "35px",
        type: "number" ,
        align: "right" ,
        max: 999,
        decimalScale: 2

    },
    {
        key: "PUREWT",
        label: "PURE WT",
        width: "45px",
        type: "number" ,
        align: "right" ,
        editable: false,
        decimalScale: 3
 
    },
    {
        key: "HMC",
        label: "HMC",
        width: "45px",
        type: "number" ,
        align: "right" ,
        decimalScale: 2,
        dependsOn:"ITEMID"

    },
    {
        key: "MC",
        label: "M.C",
        width: "35px",
        type: "number" ,
        align: "right" ,
        decimalScale: 2
  
    },
    
    // {
    //     key: "ATOUCH",
    //     label: "A.TOUCH",
    //     width: "45px",
    //     type: "number" ,
    //     align: "right" ,
    //     max: 999,
    //     decimalScale: 1

    // },
    {
        key: "STNAMT",
        label: "STN AMT",
        width: "45px",
        type: "number" ,
        align: "right" ,
        max: 999999999,
        decimalScale: 2,
        editable:false

    },
  
    {
        key: "DESCRIPTION",
        label: "DESC",
        width: "30px",
        align: "left" ,
        type: "text" ,

    },
].filter(Boolean);

