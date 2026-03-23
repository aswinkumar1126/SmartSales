"use client";
import { useApiQuery ,useApiMutation } from "../apiHook/ApiHook";
import { CreateTag, getTagedEntryNo } from "@/types/tagging/Tag";
import { ApiResponse } from "@/types/api/apiResponse";

export const useTagEntryNos = () =>{
    return useApiQuery<ApiResponse<getTagedEntryNo>>(
        {
            url:'/tagged',
            method:'GET',
            queryKey:['tag-details'],
            select:(data)=>data.data,
        
        }
    )
} 

export const useTagedDetailsBySno = (id: string) => {
    return useApiQuery<CreateTag & { id: string }>({
        url: `/tagged/${id}`,   // direct usage
        method: 'GET',
        queryKey: ['tag-details', id],
        select: (res) => res.data,
        enabled: !!id,
    });
};

