// Form state (UI)
export interface OrnamentFormData {
    itemId: string;
    pcs: string;
    grswt: string;
    netwt: string;
    touch: string;
    pure: string;
    openCash: string;
    stoneCash: string;
}

// API payload (Backend expects numbers)
export interface OrnamentPayload {
    itemId: number;
    pcs: number;
    grswt: number;
    netwt: number;
    touch: number;
    pure: number;
    openCash: number;
    stoneCash: number;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}
