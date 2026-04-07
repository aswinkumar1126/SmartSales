"use client";

import { Box } from "@chakra-ui/react";
import { useState } from "react";

//Hooks
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { useTheme } from "@/context/theme/themeContext";

//Components
import { DynamicForm } from "@/component/form/DynamicForm";

//Data
import { barcodeHeaderFields } from "@/data/barcodeGenerate/headerFormFields";

interface BarcodeHeaderFormProps {
    form: Record<string, any>;
    onChange: (field: string, value: any) => void;
    purchaserCollection?: { label: string; value: string }[];
    inwardCollection?: { label: string; value: string }[];
    itemCollection?: { label: string; value: string }[];
    isDisabled?: boolean;
    validationError?: Record<string, string>;
}

function BarcodeHeaderForm({
    form,
    onChange,
    purchaserCollection,
    inwardCollection,
    itemCollection,
    isDisabled = false,
    validationError,
}: BarcodeHeaderFormProps) {
    const { theme } = useTheme();
    const barcodeHeaderField = barcodeHeaderFields({
        vendorCollection: purchaserCollection,
        inwardCollection,
        itemCollection,
    });

    const { register, focusNext } = useEnterNavigation(
        barcodeHeaderField.map((f) => f.name),
        // () => handleSubmit()
    );

  



    return (
        <Box>
            <DynamicForm
                fields={barcodeHeaderField}
                formData={form}
                onChange={onChange}
                register={register}
                focusNext={focusNext}
                layout="horizontalCombine"
                minLabelWidth="70px"
                errors={validationError}
                disabled={{
                    ENTRYNO: isDisabled,
                    DATE: isDisabled,
                    COMPANYTYPE: isDisabled,
                    COMPANYNAME: isDisabled,
                    ITEMNAME: isDisabled,
                    INWARDNO: isDisabled,
                }}
            />

            {/* Submit button */}
         
        </Box>
    );
}

export default BarcodeHeaderForm;