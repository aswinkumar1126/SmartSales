import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";
import { TouchForm ,Touch} from "@/types/touch/touch";


export const TouchMastService = () => ({
    getTouchMastData: async (filter?: string) => {
        try {
            const response = await axiosInstance.get("/touch", {
                params: filter ? { filter: filter } : undefined, // wrap string as object
            });
            return response.data;
        } catch (error: any) {
            console.error("Error fetching TouchMast data:", error?.response?.data || error.message);
            throw error;
        }
    },
    getTouchMastDataById: async (id:number|null): Promise<ApiResponse<Touch>> => {
        if(!id) return Promise.reject('Invalid ID Provided');

        try {
            const response = await axiosInstance.get(`/touch/${id}`);
            return response.data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }

    },
        createTouchMast: async (data: TouchForm) => {
            try{
                const response = await axiosInstance.post("/touch", data);
                return response.data;
            }
            catch(error){
                console.log(error);
                throw error;
            }
            
        },
        updateTouchMast: async (id:number,data: TouchForm) => {

            console.log(data ,'updateform')
            try{
                const response = await axiosInstance.put(`/touch/${id}`, data);
                return response.data;
            }
            catch(error){
                console.log(error);
                throw error;
            }
           
        },
        deleteTouchMast: async (id: number) => {
           try{
               const response = await axiosInstance.delete(`/touch/${id}`);
               return response.data;
           }
           catch(error){
               console.log(error);
               throw error;
           }
        }
});
