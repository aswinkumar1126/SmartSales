export interface  CreateExpenseMast {
    expName :string;
    active :string| "Y" | "N";

}

export interface Expense {
    expId : number;
    expName :string;
    active : string | "Y" | "N";
    
}
