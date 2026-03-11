import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "./CompanyService";

export const TaggingService = {

    getNextTag: async (): Promise<number> => {
        try {

            const response = await axiosInstance.get(`/tag`);

            console.log(response.data, "Tag Data");

            const dataString = response.data.data;   // "NextTagNO:1"

            const tagNumber = Number(dataString.split(":")[1]);

            return tagNumber;

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

};