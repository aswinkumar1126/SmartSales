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
        name:'ADDRESS1',
        label:'FLAT',
        type:'text',
        size:'xs'
    },
    {
        name: 'ADDRESS2',
        label: 'STREET',
        type: 'text',
        size: 'xs'
    },
    {
        name: 'ADDRESS3',
        label: 'AREA',
        type: 'text',
        size: 'xs'
    },
    {
        name: 'ADDRESS4',
        label: 'CITY',
        type: 'text',
        size: 'xs'
    },
    {
        name: 'AREACODE',
        label: 'PIN CODE',
        type: 'text',
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
        name: 'PHONE',
        label: 'PHONE',
        type: 'text',
        size: 'xs',
        inputModeType:'mobile'
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
        name: 'EMAIL',
        label: 'EMAIL',
        type: 'text',
        inputModeType: 'email',
        maxLength: 15,
        size: 'xs'
    },
    {
        name: 'PANNO',
        label: 'PAN NO',
        type: 'text',
        inputModeType: 'pan',
        size: 'xs'
    },
    {
        name: 'LOGO',
        label: 'LOGO',
        type: 'image',
        size: 'xs',
        maxW:'50px'
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