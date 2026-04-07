import { axiosInstance } from "@/api/axiosInstance";

export type CreatePrinterSettingInterface = {
 
    ipAddress: string; 
    exeName: string;     
    printerName: string;  
    active:string;
}

export const createPrinterSetting = async (createPayload: CreatePrinterSettingInterface) => {
    try {
        console.log(createPayload,'createPayload')
        const response = await axiosInstance.post('/printer', createPayload); // Fixed: Added missing payload
        console.log(response.data); // Fixed: Added response data to console.log
        return response.data;
    }
    catch (error) {
        console.error('Error creating printer setting:', error);
        throw error;
    }
}

// Additional useful service functions:
export const getActivePrinterSettings = async () => {
    try {
        const response = await axiosInstance.get('/printer');
        return response.data;
    }
    catch (error) {
        console.error('Error fetching printer settings:', error);
        throw error;
    }
}


// Additional useful service functions:
export const getAllPrinterSettings = async () => {
    try {
      
        const response = await axiosInstance.get('/printer/all');
        return response.data;
    }
    catch (error) {
        console.error('Error fetching printer settings:', error);
        throw error;
    }
}

export const getPrinterSettingById = async (id: string) => {
    try {
        const response = await axiosInstance.get(`/printer/${id}`);
        return response.data;
    }
    catch (error) {
        console.error('Error fetching printer setting:', error);
        throw error;
    }
}

export const updatePrinterSetting = async (id: string, updatePayload: CreatePrinterSettingInterface) => {
    try {
        console.log(updatePayload, 'updatePayload')
        const response = await axiosInstance.put(`/printer/${id}`, updatePayload);
        return response.data;
    }
    catch (error) {
        console.error('Error updating printer setting:', error);
        throw error;
    }
}

export const deletePrinterSetting = async (id: string) => {
    try {
        const response = await axiosInstance.delete(`/printer-setting/${id}`);
        return response.data;
    }
    catch (error) {
        console.error('Error deleting printer setting:', error);
        throw error;
    }
}