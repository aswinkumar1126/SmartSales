export interface ItemSize {
    SIZEID?: number;
    ITEMID: string;          // CTLID
    SIZENAME: string;   // CTLTEXT
    ITEMNAME?:string;
}

export interface ItemSizePayload {
    ITEMID: number;          // CTLID
    SIZENAME: string;         // CTLTEXT
}

