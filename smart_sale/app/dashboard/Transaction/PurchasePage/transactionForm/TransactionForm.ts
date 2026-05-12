export const purchaseColumns = (isTag: boolean) => [


    ...(isTag ? [{
        key: "TAGNO",
        label: "TAGNO",
        width: "60px",
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
        decimalScale:0,

   
    },
    {
        key: "GRSWT",
        label: "GRS WT",
        width: "45px",
        type: "number" ,
        align: "right" ,
        decimalScale: 3,
        allowFocus:true,
        max: 999999,
 
    },
    {
        key: "STNWT",
        label: "STONE",
        width: "45px",
        type: "number" ,
        align: "right" ,
        decimalScale: 3,
        allowFocus: true,
        max: 999999,
 
    },
    {
        key: "NETWT",
        label: "NET WT",
        width: "45px",
        type: "number" ,
        align: "right" ,
        editable:false,
        decimalScale: 3,
        allowFocus: true,
        max: 999999,
   
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
        max: 9999,
        decimalScale: 1,
        allowFocus: true,
       

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
        width: "40px",
        type: "number" ,
        align: "right" ,
        decimalScale: 2,
        allowFocus:true
  
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
        width: "40px",
        type: "number" ,
        align: "right" ,
        max: 999999,
        decimalScale: 2,
        editable:false,
        allowFocus:true,

    },
  
    {
        key: "DESCRIPTION",
        label: "DESC",
        width: "50px",
        align: "left" ,
        type: "text" ,

    },
].filter(Boolean);

export const issueColumns = [
    {
        key: "SNO",
        label: "S.N0",
        width: "40px",
        align: "center" ,
        editable: false,

    },
    {
        key: "PUREID",
        label: "PURE GOLD NAME",
        width: "120px",
        align: "left" ,
        type: "combobox" ,

    },
    

    {
        key: "WT",
        label: "WEIGHT",
        width: "30px",
        type: "number" ,
        align: "right" ,
        max:999999,
        decimalScale:3,
        allowFocus:true,
    


    },
    {
        key: "AWT",
        label: "A.WEIGHT",
        width: "25px",
        type: "number" ,
        align: "right" ,
        max: 999999,
        decimalScale: 3,
        allowFocus: true,
     

    },
    {
        key: "TOUCH",
        label: "TOUCH",
        width: "30px",
        type: "number" ,
        align: "right" ,
        max: 999,
        decimalScale: 1,
        allowFocus: true,
      

    },
    {
        key: "ATOUCH",
        label: "A.TOUCH",
        width: "30px",
        type: "number" ,
        align: "right" ,
        max: 999,
        decimalScale: 1,
        allowFocus: true,
        editable:false,
 

    },
    {
        key: "PUREWT",
        label: "PURE WT",
        width: "40px",
        type: "number" ,
        align: "right" ,
        editable: true,
        disabled: true,
        decimalScale: 3,
        allowFocus: true,

    },
    {
        key: "APUREWT",
        label: "A.PURE WT",
        width: "40px",
        type: "number" ,
        align: "right" ,
        editable: false,
        disabled:true,
        decimalScale: 3
    },
    
];

