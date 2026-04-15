import { useApiQuery } from "../apiHook/ApiHook";
import { ItemStockEntry } from "@/types/SummaryReport/SummaryReport";

export const usePureStockReport = (date?: string) => {
        return useApiQuery<ItemStockEntry[]>({
        queryKey: ["pure_stock_report", date ?? ""],
        url: "/report/purewise",
        method: "GET",
        params: date ? { date } : undefined,
        select: (res) => res.data,
    });

};

export const useItemStockReport = (date?: string) => {
        return useApiQuery<ItemStockEntry[]>({
        queryKey: ["item_stock_report", date ?? ""],
        url: "/report/itemwise",
        method: "GET",
        params: date ? { date } : undefined,
        select: (res) => res.data,
    });

};
    // return useApiQuery<ItemStockEntry[]>({
    //     queryKey: ["item_stock_report", date ?? ""],
    //     url: "/report/itemwise",
    //     method: "GET",
    //     params: date ? { date } : undefined,
    //     select: (res) => res.data,
    // });