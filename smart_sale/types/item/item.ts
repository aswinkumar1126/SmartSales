export interface ItemMast {
    itemId?: number;

    itemName: string | null;
    shortName: string | null;
    billName: string | null;

    active: "Y" | "N" | null;
    metalId: string | null;
    metalRate: number | null;
    pieceRate: number | null;
    metalName:string | null;

    catCode: string | null;
    stockType: string | null;
    calType: string | null;

    companyId: string | null;
    hsn: string | null;
    companyName:string | null;

    userId: number | null;
    updated: string | null;
    uptime: string | null;

    /* ===== FLAGS (ALL STRING 1 CHAR) ===== */
    allowZeroPcs: "Y" | "N" | null;
    assorted: "Y" | "N" | null;
    autoGenerator: "Y" | "N" | null;
    beeds: "Y" | "N" | null;
    bookStock: "Y" | "N" | null;
    compliments: "Y" | "N" | null;
    coverWt: "Y" | "N" | null;
    diaStone: "Y" | "N" | null;
    extrAWT: "Y" | "N" | null;
    fixedVa: "Y" | "N" | null;
    focusPiece: "Y" | "N" | null;
    grossNetWtDiff: "Y" | "N" | null;
    hallMark: "Y" | "N" | null;
    isService: "Y" | "N" | null;
    maintain4C: "Y" | "N" | null;
    mcCalc: "Y" | "N" | null;
    multiMetal: "Y" | "N" | null;
    othCharge: "Y" | "N" | null;
    rangeStock: "Y" | "N" | null;
    rateGet: "Y" | "N" | null;
    setItem: "Y" | "N" | null;
    sizeStock: "Y" | "N" | null;
    stockReport: "Y" | "N" | null;
    studded: "Y" | "N" | null;
    studdedStone: "Y" | "N" | null;
    subItem: "Y" | "N" | null;
    tagImage: "Y" | "N" | null;
    tagLock: "Y" | "N" | null;
    tagType: "Y" | "N" | null;
    tagValid: "Y" | "N" | null;
    taxInclusive: "Y" | "N" | null;
    touchBased: "Y" | "N" | null;
    valueAddedType: string | null;
    valueCalc: "Y" | "N" | null;
    zeroWastage: "Y" | "N" | null;

    /* ===== NUMERIC ===== */
    currentStyleNo: number | null;
    defItemTypeId: number | null;
    defaultCounter: number | null;
    defaultEmpId: number | null;
    discFixPer: number | null;
    discPerGm: number | null;
    discVaPer: number | null;
    fromWt: number | null;
    giftValue: number | null;
    gpPer: number | null;
    grsWt: number | null;
    marginPer: number | null;
    marginValue: number | null;
    netWtPer: number | null;
    noOfPiece: number | null;
    pieceRatePur: number | null;
    purTouch: number | null;
    salTouch: number | null;
    toWt: number | null;

    /* ===== STRING ===== */
    currentTagNo: string | null;
    endTagNo: string | null;
    itemPctPath: string | null;
    marginIds: string | null;
    pctFile: string | null;
    startTag: string | null;
    stoneUnit: string | null;
    studDeduct: string | null;
    styleCode: string | null;
    styleNo: string | null;
    tableCode: string | null;
    view4C: string | null;
}
