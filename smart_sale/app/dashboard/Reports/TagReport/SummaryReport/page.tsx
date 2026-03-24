"use client";
import React,{useMemo ,useEffect} from "react";


/*-------------HOOKS----------------*/
import { useTagedReport } from "@/hooks/report/useReport";

function SummaryReport(){


    //---------------- GET HOOKS CALLING-------------------//

    const {data:taggedReport,isLoading,error} =useTagedReport();

    const tagedReportList = useMemo(() => {
        return Array.isArray(taggedReport) ? taggedReport : [];
    }, [taggedReport]);

    console.log(tagedReportList,'tagedReportList')

    return(
        <div>
            <h1>Summary Report</h1>
        </div>
    )
}
export default SummaryReport;