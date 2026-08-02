import { useMutation , QueryClient } from "@tanstack/react-query";
import { TouchMastService } from "@/service/TouchService";
import { toastCreated, toastError } from "@/component/toast/toast";

const useTouchMastCreate = () =>{
    const queryClient = new QueryClient();

    return useMutation({
        mutationFn: TouchMastService().createTouchMast,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["touchMast"] });
            toastCreated('touchMaster');
        },
        onError: (error) => {
            console.error("Error creating touch-mast:", error);
            toastError(`${error}`)
        }
    });


}
export default useTouchMastCreate;