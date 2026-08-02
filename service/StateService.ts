import { axiosInstance } from "@/api/axiosInstance";

export const getAllStates = async()=>{
    try{
        const response = await axiosInstance.get('/states');
        return response.data;
    }
    catch(err){
        console.log(err);
    }
}