import { axiosInstance } from "@/api/axiosInstance";
import { pureGoldForm, pureGoldData, pureGoldOpenForm ,pureGoldMastForm } from "@/types/pureGold/pureGold";
import { ApiResponse } from "@/types/api/apiResponse";

const baseUrlOpen = 'puregold/open';
const baseUrlMast = 'puregold/mast';

export const pureGoldMastService = () =>({

 getAllPureGoldData : async (
        filter?: string,
        filters?: Record<string, any>
    ): Promise<ApiResponse<pureGoldData[]>> => {
        try {
            // Build params dynamically
            const params: Record<string, any> = {};

            if (filter) params.filter = filter; // string filter
            if (filters && Object.keys(filters).length > 0) {
                Object.assign(params, filters); // merge object filters
            }

            console.log("Axios params:", params);

            const response = await axiosInstance.get(`/${baseUrlOpen}`, { params });
            return response.data;
        } catch (err: any) {
            console.error("Error fetching Pure Gold data:", err?.response?.data || err.message);
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
    getPureGoldNames: async (filter?:string):Promise<ApiResponse<pureGoldData[]>> =>{
        try{

            console.log('filter', filter);
            const response = await axiosInstance.get(`/${baseUrlMast}`, {
                params: filter ? { filter: filter } : undefined, // wrap string as object
            });
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
    createPureGoldName: async (payload: pureGoldMastForm) => {
        try{
            console.log('payload', payload);
            const response = axiosInstance.post(`/${baseUrlMast}`, payload);
            return response;
        }
        catch(err){
            console.warn(err);
            throw err;
        }
        
    }
})