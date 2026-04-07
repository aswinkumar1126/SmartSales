import { createPrinterSetting, getAllPrinterSettings, updatePrinterSetting, getActivePrinterSettings } from "@/service/PrinterSettingService";
import { useQuery ,useMutation ,useQueryClient } from "@tanstack/react-query";


export const useCreatePrint = ()=>{
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createPrinterSetting,
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:['printer-settings']})
        }
    })
}

export const usePrint = ()=>{
    return useQuery({
        queryKey:['printer-settings'],
        queryFn : getAllPrinterSettings
    })
}

export const useActivePrinter = () => {
    return useQuery({
        queryKey: ['printer-settings'],
        queryFn: getActivePrinterSettings
    })
}


export const useUpdatePrint = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) =>
            updatePrinterSetting(id, payload), // Make sure this function exists in your service
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['printer-settings'] })
        }
    })
}