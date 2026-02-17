import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrnamentList, getOrnamentById , updateOrnament ,createOrnament ,deleteOrnament} from '@/service/ornamentService';
import { toastCreated, toastError, toastUpdated } from "@/component/toast/toast";
import { OrnamentPayload ,OrnamentFormData } from "@/types/ornament/ornament";


export const useOrnamentData = (filter?:string) => {
    return useQuery({
        queryKey: ['ornaments' ,filter],
        queryFn: () => getOrnamentList(filter),
    });
}

export const useCreateOrnament = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: OrnamentPayload) => createOrnament(data),
        onSuccess: () => {
            toastCreated('ornament')
            queryClient.invalidateQueries({ queryKey: ['ornaments'] });
        },
    });
};


export const useUpdateOrnament = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ornamentData }: { id: number; ornamentData: OrnamentPayload }) =>
            updateOrnament(id, ornamentData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ornaments'] });
            toastUpdated('Ornament');
        },
    });
};

export const useDeleteOrnament = () =>{
 const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id :number) => deleteOrnament(id),
        onSuccess: () => {
    
            toastCreated('Ornament');
            queryClient.invalidateQueries({ queryKey: ['ornaments'] });
        },
        onError : (error) => {
            console.error("Error deleting ornament:", error);
            toastError("Ornament", error.message);
        }
    });
}

export const useOrnamentDataById = (id: number | null) => {
    return useQuery({
        queryKey: ['ornament', id],
        queryFn: () => getOrnamentById(id as number),
        enabled: !!id, // ✅ only run when id exists
    });
};
