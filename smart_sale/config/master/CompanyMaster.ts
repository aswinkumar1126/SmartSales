// config/companyForm.config.ts
import { FormField } from "@/types/form/form";

export const getCompanyFormFields = (stateOptions: any[], editId: string | null): FormField[] => [
    {
        name: 'COMPANYID',
        label: 'COMPANY ID',
        type: 'text',
        required: true,
        maxLength: 3,
        width: '110px',
        maxWidth: '110px',
        size: 'xs',
        rounded: 'full',
        disabled: !!editId,
        autoFocus: true,

    },
    {
        name: 'COMPANYNAME',
        label: 'COMPANY NAME',
        type: 'text',
        required: true,
        isCapitalized: true,
        size: 'xs'
    },
    {
        name: 'STATEID',
        label: 'STATE',
        type: 'combobox',
        required: true,
        options: stateOptions,
        placeholder: 'Select State',
        size: 'xs',

        
    },
    {
        name: 'GSTNO',
        label: 'GSTIN',
        type: 'text',
        inputModeType: 'gst',
        maxLength: 15,
        size: 'xs'
    },
    {
        name: 'ACTIVE',
        label: 'ACTIVE',
        type: 'select',
        options: [
            { label: 'YES', value: 'Y' },
            { label: 'NO', value: 'N' }
        ],
        defaultValue: 'Y',
        size: 'xs'
    },

]