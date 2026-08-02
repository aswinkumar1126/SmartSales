import { axiosInstance } from "@/api/axiosInstance";
import { createResourceApi } from "@/api/resourceApi";
import { callApi } from "@/api/apiClient";
// Type for Metal
export interface Metal {
    sno?:number;
    metalId: string;
    metalName: string;
    userId?: number;
    updated?: string;
    uptime?: string;
    autoGenerator?: string;
    metalType?: string;
    active?: string;
    displayOrder?: number;
    weight?:string;
    touch?:string;
    pure?:string
}

export const MetalService = {
    // GET all metals
    getAllMetals: async (): Promise<Metal[]> => {
        const { data } = await axiosInstance.get("/metal");
        return data.data;
    },
    

    // GET active metals
    getActiveMetals: async (): Promise<Metal[]> => {
        const { data } = await axiosInstance.get("/metal/active");
        return data.data;
    },

    // GET metal by id
    getMetalById: async (id: string): Promise<Metal> => {
        const { data } = await axiosInstance.get(`/metal/${id}`);
        return data.data;
    },

    // POST create metal
    createMetal: async (metal: Metal): Promise<Metal> => {
        const { data } = await axiosInstance.post("/metal", metal);
        return data.data;
    },

    // PUT update metal
    updateMetal: async (sno: number, metal: Metal): Promise<Metal> => {
        const { data } = await axiosInstance.put(`/metal/${sno}`, metal);
        return data.data;
    },
};

export interface MetalData {
    status: string;
    message:string;
    data: Metal;
}



export const getMetalBySno = (sno: number) =>

   
    callApi<null, MetalData>({
        method: "get",
        url: `/metal/sno/${sno}`,
    });
