export interface pureGoldForm{

    pureGoldName:string;
    weight?: number;
    actualPure?: number;
    actualTouch?: number;
}
export interface pureGoldOpenForm {
    pureId?: number;
    weight?: number;
    actualPure?: number;
    actualTouch?: number;
    // metalId?:string;
}

export interface pureGoldData{
    sno:number;
    pureGoldName:string;
    weight?:number;
    actualPure?:number;
    actualTouch?:number;
    metal?:string
}

export interface pureGoldMastForm{

    pureGoldName:string;
    // weight?:string;
    // actualPure?:string;
    // actualTouch?:string;
    metalId?:string;
}

export interface pureGoldMastOpenForm {

    pureId?: string;
    weight?: string;
    actualPure?: string;
    actualTouch?: string;
    metalId?: string
}