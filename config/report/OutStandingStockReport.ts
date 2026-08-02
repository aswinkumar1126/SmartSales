import { FormField } from "@/types/form/form";


type collection = { label: string, value: string };

type OutstandingStockReportForm = {
    itemList:collection[],
    stockTypeList :collection[],
    metalList :collection[],
    stoneList : collection[],

};

export const OutstandingStockReportFields = (OutstandingStockForm: OutstandingStockReportForm ): FormField[] =>  [
    
   {
        name : "METALID" ,
        label : "METAL NAME" ,
        items: OutstandingStockForm.metalList,
        type : "combobox",
        maxWidth :'200px'

   },
    {
        name: "ITEMID",
        label: "ITEM NAME",
        items: OutstandingStockForm.itemList,
        type: "combobox",
        maxWidth: '220px'

    },
    {
        name: "STOCKTYPE",
        label: "STOCK TYPE",
        items: OutstandingStockForm.stockTypeList,
        type: "select",
        maxWidth: '60px'

    },
    {
        name: "STNPRESENTS",
        label: "STONE PRESENTS",
        items: OutstandingStockForm.stoneList,
        type: "select",
        maxWidth: '60px',
    },
   
];