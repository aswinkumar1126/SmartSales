"use client";
import React, { useMemo } from "react";
import { Box, Text, Table } from "@chakra-ui/react";
import { CustomTable, TableColumn } from "@/component/table/CustomTable";
import Loader from "@/component/loader/Loader";
import { useSummaryReport } from "@/hooks/SummaryReport/useSummaryReport";
import { TaggingEntry } from "@/types/SummaryReport/SummaryReport";

const columns: TableColumn[] = [
    { key: "SNO",          label: "S.No",        align: "center" },
    { key: "TRANDATE",     label: "Date",         align: "center" },
    { key: "TRANNO",       label: "Tran No",      align: "center" },
    { key: "ACCODE",       label: "AC Code",      align: "center" },
    { key: "ENTRYNO",      label: "Entry No",     align: "center" },
    { key: "ITEMID",       label: "Item ID",      align: "center" },
    { key: "PCS",          label: "PCS",          align: "end" },
    { key: "T_PCS",        label: "T.PCS",        align: "end" },
    { key: "GRSWT",        label: "Grs.Wt",       align: "end" },
    { key: "T_GRSWT",      label: "T.Grs.Wt",     align: "end" },
    { key: "NETWT",        label: "Net.Wt",       align: "end" },
    { key: "T_NETWT",      label: "T.Net.Wt",     align: "end" },
    { key: "STNWT",        label: "Stn.Wt",       align: "end" },
    { key: "T_STNWT",      label: "T.Stn.Wt",     align: "end" },
    { key: "T_SALESSTNWT", label: "Sales Stn.Wt", align: "end" },
];

function SummaryReport() {
    const { data, isLoading, isError } = useSummaryReport();

    const tableData: TaggingEntry[] = useMemo(() => data ?? [], [data]);

    if (isLoading) return <Loader isLoading fullscreen content="Loading Summary Report..." />;

    if (isError)
        return (
            <Box p={6} textAlign="center">
                <Text color="red.500">Failed to load Summary Report. Please try again.</Text>
            </Box>
        );

    return (
        <Box p={4}>
            <Text fontWeight="bold" fontSize="md" mb={3}>
                Summary Report
            </Text>

            <CustomTable<TaggingEntry>
                columns={columns}
                data={tableData}
                headerBg="blue.600"
                headerColor="white"
                size="sm"
                emptyText="No summary report data found."
                renderRow={(row, index) => (
                    <>
                        <Table.Cell textAlign="center">{index + 1}</Table.Cell>
                        <Table.Cell textAlign="center">{row.TRANDATE ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="center">{row.TRANNO ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="center">{row.ACCODE ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="center">{row.ENTRYNO ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="center">{row.ITEMID ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="end">{row.PCS ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="end">{row.T_PCS ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="end">{row.GRSWT ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="end">{row.T_GRSWT ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="end">{row.NETWT ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="end">{row.T_NETWT ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="end">{row.STNWT ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="end">{row.T_STNWT ?? "-"}</Table.Cell>
                        <Table.Cell textAlign="end">{row.T_SALESSTNWT ?? "-"}</Table.Cell>
                    </>
                )}
            />
        </Box>
    );
}

export default SummaryReport;
