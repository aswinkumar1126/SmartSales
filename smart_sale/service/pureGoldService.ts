import { axiosInstance } from "@/api/axiosInstance";
import { pureGoldForm, pureGoldData, pureGoldOpenForm } from "@/types/pureGold/pureGold";
import { ApiResponse } from "@/types/api/apiResponse";

const baseUrlOpen = 'puregold/open';
const baseUrlMast = 'puregold/mast';

export const pureGoldMastService = () =>({

    getAllPureGoldData: async (filters: any): Promise<ApiResponse<pureGoldData[]>> => {
        try {
            const response = await axiosInstance.get(`/${baseUrlOpen}`, {
                params: filters && Object.keys(filters).length > 0 ? filters : undefined
            });

            return response.data;
        } catch (err) {
            throw err;
        }
    },


    getPureGoldMastDataById : async(id:number):Promise<ApiResponse<pureGoldData>> =>{
        try{
            const response = await axiosInstance.get(`/${baseUrlOpen}/${id}`);
            return response.data;

        }
        catch(err){
            throw(err);
            
        }
    },
    createPureGoldMast: async (data: pureGoldOpenForm) => {
        console.log(data,'pureGoldData');
        try{
            const response = await axiosInstance.post(`/${baseUrlOpen}`, data);
            return response.data;
        }
        catch(error){
            throw error;
        }
    },
    updatepureGoldMastById: async (id: number, data: pureGoldOpenForm):Promise<ApiResponse<pureGoldData>> =>{
        try{
            const response = await axiosInstance.put(`/${baseUrlOpen}/${id}`,data);
            return response.data;
        }
        catch(err){
            throw err;
        }
    },
    deletePureGoldMastById : async(id:number):Promise<ApiResponse<pureGoldData>> =>{
        try{
            const response = await axiosInstance.delete(`/${baseUrlOpen}/${id}`);
            return response.data;
        }
        catch(err){
            throw err;
        }
    },
    getPureGoldNames : async():Promise<ApiResponse<pureGoldData[]>> =>{
        try{
            const response = await axiosInstance.get(`/${baseUrlMast}`);
            return response.data;

        }
        catch(err){
            throw err;

        }
    },
    getPureGoldNamesById: async (id:number): Promise<ApiResponse<pureGoldData[]>> => {
        try {
            const response = await axiosInstance.get(`/${baseUrlMast}/${id}`);
            return response.data;

        }
        catch (err) {
            throw err;

        }
    },
    updatePureGoldName: async (id:number , payload:pureGoldForm): Promise<ApiResponse<pureGoldData[]>> => {
        try {
            const response = await axiosInstance.put(`/${baseUrlMast}/${id}`,payload);
            return response.data;

        }
        catch (err) {
            throw err;

        }
    },
    createPureGoldName: async (payload: pureGoldForm) => {
        try{
            const response = axiosInstance.post(`/${baseUrlMast}`, payload);
            return response;
        }
        catch(err){
            console.warn(err);
            throw err;
        }
        
    }
})