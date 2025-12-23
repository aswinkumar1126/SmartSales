import { axiosInstance } from "@/api/axiosInstance";

// Type for Metal
export interface Metal {
    metalId: string;
    metalName: string;
    userId?: number;
    updated?: string;
    uptime?: string;
    autoGenerator?: string;
    ttype?: string;
    active?: string;
    displayOrder?: number;
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
    updateMetal: async (id: string, metal: Metal): Promise<Metal> => {
        const { data } = await axiosInstance.put(`/metal/${id}`, metal);
        return data.data;
    },
};
