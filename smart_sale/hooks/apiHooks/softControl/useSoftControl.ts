
import { useApiQuery, useApiMutation } from "../apiHook/ApiHook";
import { SoftControl } from "@/types/softcontrol/SoftControl";

// Fetch all SoftControls
export const useSoftControls = () => {
    return useApiQuery<SoftControl[]>({
        url: "/softcontrol",
        queryKey: ["softcontrol"],
        params:{ },
        select: (response) => response.data,
    });
};

// Fetch SoftControl by ID
export const useSoftControlById = (id: string) => {
    return useApiQuery<SoftControl & { id: string }>({
        url: (params) => `/softcontrol/${params.id}`,
        params: { id },
        queryKey: ["softcontrol", id],
        select: (res) => res.data,
        enabled: !!id,
    });
};
// Create a new SoftControl
export const useCreateSoftControl = () => {
    return useApiMutation<SoftControl, SoftControl>({
        url: "/softcontrol",
        method: "POST",
        queryKey: ["softcontrol"],
        
    });
};

// Update an existing SoftControl
export const useUpdateSoftControl = (id:number|string) => {
    return useApiMutation<SoftControl, SoftControl & {id : string|number}>({
        url: ({id}) => `/softcontrol/${id}`,
        method: "PUT",
        queryKey: ["softcontrol" ,String(id)],
    });
};

