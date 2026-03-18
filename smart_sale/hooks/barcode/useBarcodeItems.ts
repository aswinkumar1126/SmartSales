import { useQuery } from "@tanstack/react-query";
import { getBarcodeFilters, getBarcodeItemsDetails } from "@/service/BarcodeService";
import { BarCodeFilter } from "@/types/barcode/BarcodeDetails";

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