"use client"
import React from "react";
import { PrintPreviewScreen } from "@/component/screens/PrintPreviewScreen";
import { usePrint } from "@/context/print/usePrintContext";
import { useSearchParams } from "next/navigation";

function Print() {
    const {data,columns ,showSno , titleText } =usePrint();
    console.log("Print Data:",data);

    const searchParams = useSearchParams();

    const exportOption = searchParams.get('export');

    const title = searchParams.get('title');
 
    console.log(title,'titletitle');
    console.log(titleText,'titletitle');


    return(
        <PrintPreviewScreen data={data} columns={columns} exportOption={exportOption} showSno={showSno} title={titleText} />
    )
};

export default Print;