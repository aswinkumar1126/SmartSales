import { FormField } from "@/types/form/form";

export const getAccountHeadFields = ( collections : {accountTypeCollection :{label:string,value:string}[] , stateOptions : {label:string ,value:string}[] ,activeOptions:{label:string ,value:string}[]}  ):FormField[] => [

    {
        name:'ACCODE',
        label:'ACCOUNTID',
        type:'text',
        required:true,
        disabled:true,
        maxW:'100px',

    },
    {
        name:'ACNAME',
        label:'ACCOUNT NAME',
        type:'text',
        required:true,
   
    },
    {
        label:'CUSTOMER TYPE',
        name:'ACTYPE',
        required:true,
        type:'combobox',
        options: collections.accountTypeCollection,
        defaultValue:'PR',
        size:'xs'
    },
    {
        name:'STATEID',
        label:'STATE',
        type:'combobox',
        required:true,
        options: collections.stateOptions,
        size:'xs'
    },
    {
        label:'OPENING PURE',
        name:'OPENING_PURE',
        type:'number',
        allowDecimal:true,
        size:'xs'
    },
    {
        label: 'OPENING CASH',
        name: 'OPENING_CASH',
        type: 'number',
        allowDecimal: true,
        size: 'xs',
    },

    {
        name:'ACTIVE',
        label:'ACTIVE',
        type:'select',
        options: collections.activeOptions,
        defaultValue: 'Y',
        size: 'xs',
        css:{
            minWidth:'70px'
        }
    },


]