
import { useApiQuery, useApiMutation } from "../apiHook/ApiHook";
import { SoftControl } from "@/types/softcontrol/SoftControl";

// Fetch all SoftControls
export const useSoftControls = () => {
    return useApiQuery<SoftControl[]>({
        url: "/softcontrol",
        queryKey: ["softcontrol"],
        select: (response) => response.data,
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
export const useUpdateSoftControl = () => {
    return useApiMutation<SoftControl, SoftControl & {id : string|number}>({
        url: ({id}) => `/softcontrol/${id}`,
        method: "PUT",
        queryKey: ["softcontrol"],
    });
};

