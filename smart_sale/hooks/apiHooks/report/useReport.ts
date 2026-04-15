import { ApiResponse } from "@/types/api/apiResponse"
import { useApiQuery } from "../apiHook/ApiHook"
import { TagReport } from "@/types/report/Report"


export const useTagedReport = () =>{
    return useApiQuery<ApiResponse<TagReport>>({
        queryKey:['taged_report'],
        url:'/tagged/report',
        method:'GET',
        select: (res) => res.data

    }
)
}