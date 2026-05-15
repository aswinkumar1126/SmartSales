import { useMutation, useQuery, QueryClient } from "@tanstack/react-query";

import { StoneMappingService } from "@/service/StoneMapping";
import { ApiResponse } from "@/types/api/apiResponse";

import {
    toastCreated,
    toastError,
    toastUpdated,
} from "@/component/toast/toast";

import {
    StoneMappingFilter,
    StoneMappingForm,
} from "@/types/stoneMapping/StoneMappingTypes";

const queryClient = new QueryClient();

/* ---------------- CREATE ---------------- */

export const useStoneMappingCreate = () => {
    return useMutation({
        mutationFn: StoneMappingService().createStoneMapping,

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["hmc"],
            });

            toastCreated("HMC Mapping");
        },

        onError: (error) => {
            console.error("Error creating hmc:", error);
            toastError(`${error}`);
        },
    });
};

/* ---------------- GET ALL ---------------- */

export const useStoneMappingData = (filter?: string) => {
    return useQuery({
        queryKey: ["hmc", filter],

        queryFn: () =>
            StoneMappingService().getStoneMappingData(filter),

        select: (data) => data.data,
    });
};

/* ---------------- GET BY ID ---------------- */

export const useStoneMappingDataById = (
    id: number | null
) => {
    return useQuery({
        queryKey: ["hmc-by-id", id],

        queryFn: () =>
            StoneMappingService().getStoneMappingById(id),

        select: (data) => data.data,

        enabled: !!id,
    });
};

/* ---------------- UPDATE ---------------- */

export const useModifyStoneMappingById = () => {
    return useMutation({
        mutationFn: (data: {
            id: number;
            formData: StoneMappingForm;
        }) =>
            StoneMappingService().updateStoneMapping(
                data.id,
                data.formData
            ),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["hmc"],
            });

            toastUpdated("HMC Mapping");
        },

        onError: (error) => {
            console.error("Error updating hmc:", error);
            toastError(`${error}`);
        },
    });
};

/* ---------------- FILTER ---------------- */

export const useStoneMappingByFilter = (
    filter: StoneMappingFilter,
    enabled: boolean
) => {
    return useQuery({
        queryKey: ["hmc-filter", filter],

        queryFn: () =>
            StoneMappingService().getStoneMappingByFilter(filter),

        select: (data) => data.data,

        enabled,
    });
};