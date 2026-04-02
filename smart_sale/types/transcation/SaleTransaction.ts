export type SaleTransactionKey =
    | "sales"
    | "issue"
    | "receipt"
    | "sales_return";



export interface SaleTransactionType {
    code: "IS" | "RE" | "SA" | "SR";  
    key: SaleTransactionKey;                 
    label: string;
    value?: string;                    
    icon?: React.ComponentType<any>;
}