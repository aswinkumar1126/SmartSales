"use client";
import { useApiQuery ,useApiMutation } from "../apiHook/ApiHook";
import { CreateTag, getTagedEntryNo, getSingleTagDetail, getTagedEntryNoParams } from "@/types/tagging/Tag";
import { ApiResponse } from "@/types/api/apiResponse";

export const useTagEntryNos = (params:getTagedEntryNoParams | undefined) => {
    return useApiQuery<ApiResponse<getTagedEntryNo> ,getTagedEntryNoParams>(
        {
            url: '/tagged',
            method: 'GET',
            queryKey: ['tag-details'],
            select: (data) => data.data,
            params:params
        }
    )
}

export const useTagedDetailsByEntryNo = (id: string) => {
    return useApiQuery<CreateTag & { id: string }>({
        url: `/tagged/${id}`,   // direct usage
        method: 'GET',
        queryKey: ['tag-details', id],
        select: (res) => res.data,
        enabled: !!id,
    });
};


export const useTagedDetailsByTagNo = (id: string) => {
    return useApiQuery<getSingleTagDetail & { id: string }>({
        url: `/tagged/singleTag/${id}`,   // direct usage
        method: 'GET',
        queryKey: ['tag-detail', id],
        select: (res) => res.data,
        enabled: !!id,
    });
};