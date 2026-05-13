import { useMutation, useQuery, QueryClient } from "@tanstack/react-query";

import { HmcService } from "@/service/HmcService";

import {
    toastCreated,
    toastError,
    toastUpdated,
} from "@/component/toast/toast";

import {
    HmcFilter,
    HmcForm,
} from "@/types/hmc/hmc";

const queryClient = new QueryClient();

/* ---------------- CREATE ---------------- */

export const useHmcCreate = () => {
    return useMutation({
        mutationFn: HmcService().createHmc,

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

export const useHmcData = (filter?: string) => {
    return useQuery({
        queryKey: ["hmc", filter],

        queryFn: () =>
            HmcService().getHmcData(filter),

        select: (data) => data.data,
    });
};

/* ---------------- GET BY ID ---------------- */

export const useHmcDataById = (
    id: number | null
) => {
    return useQuery({
        queryKey: ["hmc-by-id", id],

        queryFn: () =>
            HmcService().getHmcById(id),

        select: (data) => data.data,

        enabled: !!id,
    });
};

/* ---------------- UPDATE ---------------- */

export const useModifyHmcById = () => {
    return useMutation({
        mutationFn: (data: {
            id: number;
            formData: HmcForm;
        }) =>
            HmcService().updateHmc(
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

export const useHmcByFilter = (
    filter: HmcFilter,
    enabled: boolean
) => {
    return useQuery({
        queryKey: ["hmc-filter", filter],

        queryFn: () =>
            HmcService().getHmcByFilter(filter),

        select: (data) => data.data,

        enabled,
    });
};