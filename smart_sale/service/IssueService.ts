// services/issue.service.ts

import { axiosInstance } from "@/api/axiosInstance";
import {ISSUE } from '@/types/issue/issue';
import { ApiResponse } from "@/types/api/apiResponse";

const BASE_PATH = "/issue";

export const IssueService = {
    // CREATE
    create: async (payload: ISSUE): Promise<ApiResponse<ISSUE>> => {
        const { data } = await axiosInstance.post(BASE_PATH, payload);
        console.log(data, 'created issue data');
        return data;
    },

    // GET ALL
    getAll: async (): Promise<ApiResponse<any>> => {
        const { data } = await axiosInstance.get(BASE_PATH);
        return data;
    },

    // GET ONE
    getOne: async (sno: number): Promise<ApiResponse<ISSUE>> => {
        const { data } = await axiosInstance.get(`${BASE_PATH}/${sno}`);
        return data;
    },

    // UPDATE (PUT)
    update: async (
        sno: number,
        payload: ISSUE
    ): Promise<ApiResponse<ISSUE>> => {
        const { data } = await axiosInstance.put(`${BASE_PATH}/${sno}`, payload);
        console.log(data, 'created issue data');
        return data;
    },

    // PATCH
    patch: async (
        sno: number,
        payload: Partial<ISSUE>
    ): Promise<ApiResponse<ISSUE>> => {
        const { data } = await axiosInstance.patch(`${BASE_PATH}/${sno}`, payload);
        console.log(data, 'created issue data');
        return data;
    },

    // DELETE
    remove: async (sno: number): Promise<ApiResponse<number>> => {
        const { data } = await axiosInstance.delete(`${BASE_PATH}/${sno}`);
        return data;
    },
};
