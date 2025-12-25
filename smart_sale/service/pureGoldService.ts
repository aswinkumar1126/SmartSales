import { axiosInstance } from "@/api/axiosInstance";
import { pureGoldForm ,pureGoldData } from "@/types/pureGold/pureGold";
import { ApiResponse } from "@/types/api/apiResponse";


export const pureGoldMastService = () =>({

    getAllPureGoldData: async (): Promise<ApiResponse<pureGoldData[]>>  => {
        try{
            const response =  await axiosInstance.get("/puregold");
            return response.data;  
        }
        catch(err){
            throw err;
        }
    },

    getPureGoldMastDataById : async():Promise<ApiResponse<pureGoldData>> =>{
        try{
            const response = await axiosInstance.get("/puregold/{id}");
            return response.data;

        }
        catch(err){
            throw(err);
            
        }
    },
    createPureGoldMast: async (data: pureGoldForm) => {
        console.log(data,'pureGoldData');
        try{
            const response = await axiosInstance.post("/puregold", data);
            return response.data;
        }
        catch(error){
            throw error;
        }
    },
    updatepureGoldMastById : async(id:number,data:pureGoldForm):Promise<ApiResponse<pureGoldData>> =>{
        try{
            const response = await axiosInstance.put(`/puregold/${id}`,data);
            return response.data;
        }
        catch(err){
            throw err;
        }
    },
    deletePureGoldMastById : async(id:number):Promise<ApiResponse<pureGoldData>> =>{
        try{
            const response = await axiosInstance.delete(`/puregold/${id}`);
            return response.data;
        }
        catch(err){
            throw err;
        }
    }
})