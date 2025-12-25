"use client"

import { PrintPreviewScreen } from "@/component/screens/PrintPreviewScreen";
import { usePrint } from "@/context/print/usePrintContext";
function Print(){
    const {data,columns} =usePrint();


    return(
        <PrintPreviewScreen data={data} columns={columns}/>
    )
};

export default Print;