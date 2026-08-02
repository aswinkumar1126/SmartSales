import { ApiResponse } from "@/types/api/apiResponse";
import { CreateParty ,GetParty ,PartyForm } from "@/types/party/party";
import { axiosInstance } from "@/api/axiosInstance";

export const getAllPartyData = async (): Promise<GetParty[]> => {
    try {
        const res = await axiosInstance.get<ApiResponse<GetParty[]>>("/party");
        console.log("API Response:", res.data);
        return res.data.data;
    } catch (err) {
        console.error("Failed to fetch party data", err);
        throw new Error("Unable to load party list");
    }
};

export const getPartyDataById = async(id:any):Promise<GetParty> =>{
    try{

        const response= await axiosInstance.get<ApiResponse<GetParty>>(`/party/${id}` );
        return response.data.data;
    }catch(error){
        console.error("Failed to fetch party data", error);
        throw new Error("Unable to load party list");
    }
}

export const updatePartyDataById = async (id:any ,partyUpdate:CreateParty ): Promise<CreateParty> => {
try{

    const response = await axiosInstance.put<ApiResponse<CreateParty>>(`/party/${id}`,partyUpdate);
    return response.data.data;
}
catch{
    throw new Error("Unable to update party data");
}
} 

export const createPartyData = async (partyForm: CreateParty): Promise<CreateParty> => {
    try{
        const response = await axiosInstance.post<ApiResponse<CreateParty>>('/party', partyForm);
        return response.data.data;
    }
catch (err){
    throw new Error("Unable to create party data");
}
}