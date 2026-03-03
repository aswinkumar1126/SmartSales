// Form state (UI)
export interface OrnamentFormData {
    stockType:string;
    accode:string;
    tranType:string;
    metalId:string;
    itemId: string;
    pcs: string;
    grswt: string;
    netwt: string;
    touch: string;
    purewt: string;
    stnwt?:string;
    openCash: string;
    stoneCash: string;
    // actualtouch?: string;
}

// API payload (Backend expects numbers)
export interface OrnamentPayload {

    stockType: string;
    accode: number;
    tranType: string;
    metalId: string;
    itemId: number;
    pcs: number;

    grswt: number;
    stnwt?: number;
    netwt: number;
    
    touch: number;
    purewt: number;

    openCash: number;
    stoneCash: number;
    // actualtouch?:number;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}
