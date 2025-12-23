import { useMutation ,QueryClient } from "@tanstack/react-query";
import { TouchMastService } from "@/service/TouchService";
import { TouchForm } from "@/types/touch/touch";
import { toastError, toastUpdated } from "@/component/toast/toast";

export const useModifyTouchMasterById = () =>{
    const queryClient = new QueryClient();

    return useMutation({
        mutationFn: (data: { id: number; formData: TouchForm }) => TouchMastService().updateTouchMast(data.id, data.formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["touchMast"] });
            toastUpdated('touchMaster')
        },
        onError: (error) => {
            console.error("Error updating touch-mast:", error);
            toastError(`${error}`)
        }
    });
}