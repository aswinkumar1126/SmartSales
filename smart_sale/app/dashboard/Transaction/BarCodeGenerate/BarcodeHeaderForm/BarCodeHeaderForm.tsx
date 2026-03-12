"use client";


//Hooks
import { useEnterNavigation } from "@/component/form/useEnterNavigation";


//Components
import { DynamicForm } from "@/component/form/DynamicForm";

//Types


//Data
import { barcodeHeaderFields } from "@/data/barcodeGenerate/headerFormFields";


interface BarcodeHeaderFormProps {
    form: Record<string, any>;
    onChange: (field: string, value: any) => void;
    purchaserCollection?: { label: string; value: string; }[];
}


function BarcodeHeaderForm({ form, onChange, purchaserCollection }: BarcodeHeaderFormProps) {


   const barcodeHeaderField = barcodeHeaderFields({ vendorCollection: purchaserCollection });

    console.log(barcodeHeaderField,'barcodeHeaderField')

    const { register, focusNext } = useEnterNavigation(barcodeHeaderField.map(f => f.name), () => {
        console.log("Form Submitted");
    });

    const handleChange = ( field: any , value: any) => {
        onChange(field, value);
    };

    return (
        <div>
            <DynamicForm
            
                fields={barcodeHeaderField}
                formData={form}
                onChange={handleChange}
                register={register}
                focusNext={focusNext}
            />
        </div>
    );
}

export default BarcodeHeaderForm;