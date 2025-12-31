"use client"

import { PrintPreviewScreen } from "@/component/screens/PrintPreviewScreen";
import { usePrint } from "@/context/print/usePrintContext";
import { useSearchParams } from "next/navigation";

function Print() {
    const {data,columns} =usePrint();
    console.log("Print Data:",data);

    const searchParams = useSearchParams();

    const exportOption = searchParams?.get('export');
 
    

    return(
        <PrintPreviewScreen data={data} columns={columns} exportOption={exportOption} />
    )
};

export default Print;