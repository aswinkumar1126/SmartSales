// service/CompanyService.ts
import { axiosInstance } from "@/api/axiosInstance";

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

export interface Company {
    companyid: string;
    companyname: string;
    costid?: string;
    address1?: string;
    areacode?: string;
    phone?: string;
    email?: string;
    gstno?: string;
    active: "Y" | "N";
    stateid?: number;
    logo?: string;
}

export interface CreateCompanyPayload {
    companyid: string;
    companyname: string;
    costid?: string;
    address1?: string;
    areacode?: string;
    phone?: string;
    email?: string;
    gstno?: string;
    active: "Y" | "N";
    stateid?: number;
}

export const CompanyService = {
    getAll: async (): Promise<ApiResponse<Company[]>> => {
        const { data } = await axiosInstance.get("/company");
        return data;
    },

    getById: async (companyId: string): Promise<ApiResponse<Company>> => {
        const { data } = await axiosInstance.get(`/company/${companyId}`);
        return data;
    },

    create: async (payload: CreateCompanyPayload, logo?: File): Promise<ApiResponse<Company>> => {
        const formData = new FormData();
        formData.append("company", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        if (logo) formData.append("logo", logo);
        const { data } = await axiosInstance.post("/company", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },

    updateById: async (companyId: string, payload: CreateCompanyPayload, logo?: File): Promise<ApiResponse<Company>> => {
        const formData = new FormData();
        formData.append("company", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        if (logo) formData.append("logo", logo);
        const { data } = await axiosInstance.patch(`/company/update`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },
};
