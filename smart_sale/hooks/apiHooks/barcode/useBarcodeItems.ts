import { useQuery ,useQueryClient } from "@tanstack/react-query";
import { getBarcodeFilters, getBarcodeItemsDetails } from "@/service/BarcodeService";
import { BarCodeFilter } from "@/types/barcode/BarcodeDetails";
import { useApiQuery ,useApiMutation } from "../apiHook/ApiHook";
import { CreateTag, CreateTagResponse } from "@/types/tagging/Tag";

export const useBarcodeItems = (data:BarCodeFilter) => {
  return useQuery({
    queryKey: ["barcode-items", data],
    queryFn: () => getBarcodeItemsDetails(data),
    select:(data) => data.data,
  });

  
};

export const getBarcodeFilter = (param:any) => {
  return useQuery({
    queryKey: ["barcode-items-filter", param],
    queryFn: () => getBarcodeFilters(param),
    select:(data) => data.data,
  });
};

export const useCreateTag = () =>{
  const queryClient = useQueryClient();
  return useApiMutation<CreateTagResponse,CreateTag>(
    {
      url:"/tagged",
      method:"POST",
      queryKey:['barcode-items-filter'],
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tag-details']})
      }
    }
  )
}

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  return useApiMutation<CreateTagResponse, CreateTag & { id?: string | number }>(
    {
      url:({id})=>`/tagged/${id}`,
      method:"PUT",
      queryKey:['barcode-items-filter'],
      // enabled: !!id ,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tag-details']})
      }
    }
  )
}

