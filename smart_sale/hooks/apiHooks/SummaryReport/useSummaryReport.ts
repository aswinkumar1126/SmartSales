import { useQuery } from "@tanstack/react-query";
import { useApiQuery } from "../apiHook/ApiHook";
import { ItemStockEntry, OutStandingStockReportParams, AgeReportParams } from "@/types/SummaryReport/SummaryReport";


export const usePurchaseSummary = ({
  fromAge,
  toAge,
  fetchEnabled
}: {
  fromAge?: number;
  toAge?: number;
  fetchEnabled :boolean
}) => {
  return useApiQuery<Record<string, any>[]>({
    queryKey: ["age_report", fromAge?.toString() ?? "", toAge?.toString() ?? ""],
    url: "/report/purchase", // Adjust the endpoint URL as needed
    method: "GET",

    select: (res) => res.data,
    enabled: !!fetchEnabled,
  });
};

export const useSalesSummary = ({
  fromAge,
  toAge,
  fetchEnabled
}: {
  fromAge?: number;
  toAge?: number;
  fetchEnabled :boolean;
}) => {
  return useApiQuery<Record<string, any>[]>({
    queryKey: ["age_report", fromAge?.toString() ?? "", toAge?.toString() ?? ""],
    url: "/report/sales", // Adjust the endpoint URL as needed
    method: "GET",

    select: (res) => res.data,
    enabled: fetchEnabled,
  });
};

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

export const useTranReport = ({
  stage,
  fromDate,
  toDate,
  tranType,
  date,
  entryNo,
}: {
  stage?: number;
  fromDate?: string;
  toDate?: string;
  tranType?: string;
  date?: string;
  entryNo?: number;
}) => {
  return useApiQuery<Record<string, any>[]>({
    queryKey: ["tran_report", stage?.toString() ?? "1", fromDate ?? "", toDate ?? "", tranType ?? "", date ?? "", entryNo?.toString() ?? ""],
    url: "/report/tran",
    method: "GET",
    params: {
      STAGE: stage,
      FROMDATE: fromDate,
      TODATE: toDate,
      TRANTYPE: tranType,
      DATE: date,
      ENTRYNO: entryNo !== undefined ? entryNo : undefined,
    },
    select: (res) => res.data,
    enabled: false,
  });
};
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




// In your useSummaryReport.ts file, add this hook:

// Add this to your useSummaryReport.ts file

export const useAgeReport = (params:AgeReportParams) => {
  return useApiQuery<Record<string, any>[]>({
    queryKey: ["age_report", params.FROMAGE?.toString() ?? "", params.TOAGE?.toString() ?? "", params.ITEMID?.toString() ?? "",],
    url: "/report/age",
    params:{params},
    select: (res) => res.data,
  });
};


export const useOutstandingStockReport = (params: OutStandingStockReportParams) => {
  return useApiQuery<Record<string, any>[]>({
    queryKey: ["outstanding_stock_report"],
    url: "/report/outstanding",
    select: (res) => res.data,
    params : {
      ...params
    }
  });
};