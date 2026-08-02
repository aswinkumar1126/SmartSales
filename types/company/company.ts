export interface CreateCompanyPayload {
    COMPANYID: string;
    COMPANYNAME: string;
    COSTID?: string;
    ADDRESS1?: string;
    AREACODE?: string;
    PHONE?: string;
    EMAIL?: string;
    GSTNO?: string;
    ACTIVE: "Y" | "N";
    STATEID?: number;
}