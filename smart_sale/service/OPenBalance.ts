import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";

export const getOpeningBalance = async(id:number|null|undefined):Promise<ApiResponse<any>> =>{
    try{
         const {data} = await axiosInstance.get(`/transaction/balance/${id}`);
         return data;
    }
    catch(err){
        console.log(err);
        throw err;
       
    }
    
}
