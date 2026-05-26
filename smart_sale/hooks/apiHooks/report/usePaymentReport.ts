import { PaymentReport } from "@/service/ReportService";
import { useQuery } from "@tanstack/react-query";
import { PaymentReportParams ,PaymentReportResponse } from "@/types/report/PaymentReport";
import { ApiResponse } from "@/service/CompanyService";

export const usePaymentReport = (params: PaymentReportParams, isEnabled: boolean) => {
    return useQuery({
        queryKey: ["cash-report", params],
        queryFn: () => PaymentReport(params),
        select: (res) => res.data,
        enabled: isEnabled
    })
}

