"use client";

import { useState } from "react";
import BarcodeHeaderForm from "./BarcodeHeaderForm/BarCodeHeaderForm";

 /* -------------------Types and Constraints--------------------*/

import { BarcodeHeaderFormInterface } from "@/types/barcode/HeaderForm";


/* ---------------------------- HOOKS -----------------------------*/

import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";

import { useBarcodeItems } from "@/hooks/barcode/useBarcodeItems";

function BarCodeGenerate() {

    const [barcodeHeaderForm, setBarcodeHeaderForm] = useState<BarcodeHeaderFormInterface>({
        ENTRYNO: "",
        DATE: "",
        COMPANYTYPE: "PR",
        COMPANYNAME: "",
        INWARDNO: "",
        ITEMNAME: ""
    });


    const { data: allPurchaseAccount, isLoading: accountIsLoading, isError: accountIsError } = useAllAccountHead("", { accountType: barcodeHeaderForm.COMPANYTYPE || "PR" });
    const {data: barcodeItems, isLoading: barcodeIsLoading, isError: barcodeIsError  } = useBarcodeItems({
        ACCODE: barcodeHeaderForm.COMPANYNAME,
        ENTRYNO: barcodeHeaderForm.ITEMNAME || "",
        SNO: barcodeHeaderForm.ENTRYNO

    });

    console.log(barcodeItems,'barcodeItems')

    const purchaserCollection = Array.isArray(allPurchaseAccount?.data?.acheads) 
        ? allPurchaseAccount.data.acheads.map((item: any) => ({
            label: item.ACNAME,
            value: item.ACCODE,
          }))
        : [];


    const handleChange = (field: string, value: any) => {
        setBarcodeHeaderForm((prev:BarcodeHeaderFormInterface) => ({ ...prev, [field]: value }));
    };

    return (
        <div>
            <BarcodeHeaderForm form={barcodeHeaderForm} onChange={handleChange} purchaserCollection={purchaserCollection || [] } />
            BarCodeGenerate
        </div>
    );
}

export default BarCodeGenerate;