import { useApiQuery } from "../apiHook/ApiHook";
import { TaggingEntry } from "@/types/SummaryReport/SummaryReport";

export const useSummaryReport = () => {
    return useApiQuery<TaggingEntry[]>({
        queryKey: ["summary_report"],
        url: "/report",
        method: "GET",
        select: (res) => res.data,
    });
};
