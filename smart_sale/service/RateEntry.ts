import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "./CompanyService";
import { RatePayload } from "@/types/rate/rate";

export const RateEntryService = {

    getLatestRate: async ():Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.get('/rate');
            return response.data;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    },
    createRate: async (payload: RatePayload): Promise<RatePayload> => {
        try {
        
            const response = await axiosInstance.post('/rate', payload);
            console.log(response.data ,'Saving Rate');
            return response.data;
            
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
}
