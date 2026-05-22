import { CashReport } from "@/service/ReportService";
import { useQuery } from "@tanstack/react-query";
import { CashReportParams } from "@/types/report/CashReport";

export const useCashReport  =(params:CashReportParams , isEnabled :boolean) => {
    return useQuery({
        queryKey:["cash-report",params],
        queryFn:()=>CashReport(params),
        select :(res) => res.data ,
        enabled: isEnabled
    })
}

