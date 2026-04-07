import { FormField } from "@/types/form/form";


type collection = {
    label:string;
    value:string;
}


type itemMasterProps = {
    companyCollection:collection[],
    metalCollection: collection[],
    studdedStoneCollection:collection[],
    calTypeCollection:collection[],
    activeTypeCollection:collection[],
    stockTypeCollection:collection[]
    isDisabelStudded?:boolean
}


   
export const ItemMasterFields = (collections: itemMasterProps): FormField[] =>
    [
        {
            name:'companyId',
            label:'COMPANY',
            type:'select',
            items: collections.companyCollection || [],
            minWidth: '200px'
            
            
        },
        {
            name: 'metalId',
            label: 'METAL',
            type: 'select',
            items: collections.metalCollection,
            minWidth: '200px'
     


        },
        {
            name: 'itemId',
            label: 'ITEMID',
            type: 'number',
            disabled:true,
            required:true,
            maxW:'60px'


        },
        {
            name: 'itemName',
            label: 'ITEMNAME',
            type: 'text',

        },
        {
            name: 'hsn',
            label: 'HSNCODE',
            type:'text'

        },
        {
            name: 'shortName',
            label: 'SHORTNAME',
            type: 'text',
        },
        {
            name: 'stockType',
            label: 'STOCKTYPE',
            type: 'select',
            items: collections.stockTypeCollection,
            minWidth: '200px'


        },
        {
            name: 'calType',
            label: 'CALTYPE',
            type: 'select',
            items: collections.calTypeCollection,
            minWidth: '200px'

        },
        {
            name: 'studded',
            label: 'STUDDED',
            type: 'select',
            items: collections.activeTypeCollection,
    

        },
        {
            name: 'studdedStone',
            label: 'STUDDED STONE TYPE',
            type: 'select',
            items: collections.studdedStoneCollection,

            disabled: collections.isDisabelStudded ?? false
        },
        
        {
            name: 'active',
            label: 'ACTIVE',
            type: 'select',
            items: collections.activeTypeCollection,
         
        },

    ]