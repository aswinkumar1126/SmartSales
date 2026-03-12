import { useQuery } from "@tanstack/react-query";
import { getBarcodeItemsDetails } from "@/service/BarcodeService";
import { BarCodeFilter } from "@/types/barcode/BarcodeDetails";

export const useBarcodeItems = (data:BarCodeFilter) => {
  return useQuery({
    queryKey: ["barcode-items", data],
    queryFn: () => getBarcodeItemsDetails(data),
    select:(data) => data.data,
  });
};