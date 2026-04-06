import { axiosInstance } from "@/api/axiosInstance";
import { TaggingEntryResponse } from "@/types/SummaryReport/SummaryReport";

export const getAllSummaryReport = async(): Promise<TaggingEntryResponse> => {

     try{
        const response = await axiosInstance.get("/report");
        return response.data;
    }
    catch(err){
        console.warn("Error while fetching Summary Report",err);
        throw err;
    }
}
