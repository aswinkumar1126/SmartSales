import { useQuery } from "@tanstack/react-query";
import { useApiQuery } from "../apiHook/ApiHook";
import { ItemStockEntry } from "@/types/SummaryReport/SummaryReport";
import axios from "axios";



export const usePureStockReport = ({ date, columns, groupBy }: {
  date?: string,
  columns?: string[],
  groupBy?: string[]
}) => {

  return useApiQuery<ItemStockEntry[]>({

    queryKey: [
      "item_stock_report",
      date ?? "",
      ...(columns ?? []),
      ...(groupBy ?? [])
    ],

    url: "/report/purewise",
    method: "GET",

    params: {
      DATE: date,
      
      // ✅ Fix: Send columns as array properly
      COLUMNS: columns && columns.length > 0 ? columns.join(",") : undefined,
      
      // ✅ Fix: Send groupBy as comma separated string
      GROUPBY: groupBy && groupBy.length > 0 ? groupBy.join(",") : undefined
    },

    select: (res) => res.data,

    enabled: false // important (manual trigger)
  });
};

// export const useItemStockReport = (date?: string) => {
//         return useApiQuery<ItemStockEntry[]>({
//         queryKey: ["item_stock_report", date ?? ""],
//         url: "/report/itemwise",
//         method: "GET",
//         params: date ? { date } : undefined,
//         select: (res) => res.data,
//     });

// };
/* ---------------- HOOK ---------------- */

export const useItemStockReport = ({ date, columns, groupBy }: {
  date?: string,
  columns?: string[],
  groupBy?: string[]
}) => {

  return useApiQuery<ItemStockEntry[]>({

    queryKey: [
      "item_stock_report",
      date ?? "",
      ...(columns ?? []),
      ...(groupBy ?? [])
    ],

    url: "/report/itemwise",
    method: "GET",

    params: {
      DATE: date,
      
      // ✅ Fix: Send columns as array properly
      COLUMNS: columns && columns.length > 0 ? columns.join(",") : undefined,
      
      // ✅ Fix: Send groupBy as comma separated string
      GROUPBY: groupBy && groupBy.length > 0 ? groupBy.join(",") : undefined
    },

    select: (res) => res.data,

    enabled: false // important (manual trigger)
  });
};
    // return useApiQuery<ItemStockEntry[]>({
    //     queryKey: ["item_stock_report", date ?? ""],
    //     url: "/report/itemwise",
    //     method: "GET",
    //     params: date ? { date } : undefined,
    //     select: (res) => res.data,
    // });