// service/CompanyService.ts
import { axiosInstance } from "@/api/axiosInstance";

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

export interface Company {
    ACTIVE: "Y" | "N";

    COMPANYID: string;
    COMPANYNAME: string;

    ADDRESS1?: string;
    ADDRESS2?: string;
    ADDRESS3?: string;
    ADDRESS4?: string;

    AREACODE?: string;

    PHONE?: string;
    EMAIL?: string;

    GSTNO?: string;
    PANNO?: string;

    STATEID: number;
    STATE?: string;

    LOGO?: string | File;

    UPDATED?: string;
    UPTIME?: string;

    // Optional / nullable fields converted to optional
    ANDROIDLINK?: string;
    APPSTORELINK?: string;
    AUTOGENERATOR?: string;
    BASEURL?: string;

    COSTID?: string;
    CSTNO?: string;
    DISPLAYORDER?: number;

    FACEBOOKLINK?: string;
    GOOGLEBUSINESSLINK?: string;
    INSTALINK?: string;
    TWITTERLINK?: string;
    WHATSAPPLINK?: string;
    YOUTUBELINK?: string;

    LOCALTAXNO?: string;
    TANNO?: string;
    TDSNO?: string;
    TINNO?: string;

    PASSWORD?: string;
    SHORTKEY?: string;

    USERID?: number;
    USERNAME?: string;
}

export interface CreateCompanyPayload {
    COMPANYID: string;
    COMPANYNAME: string;
    COSTID?: string;
    ADDRESS1?: string;
    ADDRESS2?: string;
    ADDRESS3?: string;
    ADDRESS4?: string;
    AREACODE?: string;
    PHONE?: string;
    EMAIL?: string;
    GSTNO?: string;
    ACTIVE: "Y" | "N";
    STATEID?: string;
    LOGO?: File | null |undefined | string;
    PANNO?:string
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

    create: async (payload: CreateCompanyPayload, logo?: File|null): Promise<ApiResponse<Company>> => {
        try{
            const formData = new FormData();

            console.log(payload, 'payload in service')

            formData.append("company", new Blob([JSON.stringify(payload)], { type: "application/json" }));

            if (logo) formData.append("logo", logo);

            console.log(formData,'formData')

            const response = await axiosInstance.post("/company", formData, {

                headers: { "Content-Type": "multipart/form-data" },

            });
            console.log(response, 'data after compan')

            return response.data;
            
        }
        catch(error){
           return Promise.reject(error);
        }
       
    },

    updateById: async (companyId: string, payload: CreateCompanyPayload, logo?: File|null): Promise<ApiResponse<Company>> => {
        const formData = new FormData();
        formData.append("company", new Blob([JSON.stringify(payload)], { type: "application/json" }));

        // console.log(payload, 'payload in service');
        // for (const [key, value] of formData.entries()) {
        //     console.log(key, value);
        // }

        if (logo) formData.append("logo", logo);
        
        
        const { data } = await axiosInstance.put(`/company/update`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        console.log(data,'updated result')
        return data;
    },
};
