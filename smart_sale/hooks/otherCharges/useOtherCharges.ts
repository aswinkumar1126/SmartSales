import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createOtherCharges,
    updateOtherCharges,
    deleteOtherCharges,
    getAllOtherCharges,
    getOtherChargeById,
} from "@/service/OtherCharges";
import { OtherChargeForm } from "@/types/others/OtherCharges";

/** Query key */
const OTHER_CHARGES_KEY = ["otherCharges"];

/** Fetch all other charges */
export const useOtherCharges = (filter?:string) => {
    return useQuery({
        queryKey: [...OTHER_CHARGES_KEY , filter],
        queryFn:() => getAllOtherCharges(filter),
    });
};

/** Fetch a single other charge by ID */
export const useOtherChargeById = (id: number) => {
    return useQuery({
        queryKey: [...OTHER_CHARGES_KEY, id],
        queryFn: () => getOtherChargeById(id),
        enabled: !!id,
    });
};

/** Create a new other charge */
export const useCreateOtherCharges = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: OtherChargeForm) => createOtherCharges(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: OTHER_CHARGES_KEY });
        },
    });
};

/** Update an existing other charge */
export const useUpdateOtherCharges = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: OtherChargeForm }) =>
            updateOtherCharges(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: OTHER_CHARGES_KEY });
        },
    });
};

/** Delete an existing other charge */
export const useDeleteOtherCharges = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteOtherCharges(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: OTHER_CHARGES_KEY });
        },
    });
};
