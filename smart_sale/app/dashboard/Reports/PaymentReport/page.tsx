"use client";

import { Box, Button, Flex, HStack ,Icon } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TbRotate, TbTableImport } from "react-icons/tb";
import { FaFileExcel, FaPrint } from "react-icons/fa";

/*------------- COMPONENTS ------------------*/
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import DataTable, { ColumnDef } from "@/component/table/ExcelReportTable";


/*------------- HOOKS ------------------*/
import { usePaymentReport } from "@/hooks/apiHooks/report/usePaymentReport";
import { useAllBankAccounts } from "@/hooks/apiHooks/bankAccount/useBankAccount";

/*------------- CONFIG ------------------*/
import { PaymentReportFields } from "@/config/report/PaymentReport";

/*------------- CONTEXT ------------------*/
import { useTheme } from "@/context/theme/themeContext";
import { usePrint } from "@/context/print/usePrintContext";
import { PrintColumn } from "@/component/screens/PrintPreviewScreen";
import { formatDateForShow } from "@/utils/format/formatDateForAPI";
import { formatToFixed } from "@/utils/format/numberFormat";


// ─── Column definitions (read-only, no editing) ───────────────────────────────

const paymentColumns: ColumnDef[] = [
    {
        data: "TRANDATE",
        title: "Date",
        type: "text",
        width: 100,
        readOnly: true,
        align: "center",
    },
    {
        data: "PARTICULAR",
        title: "Particular",
        type: "text",
        width: 200,
        readOnly: true,
        align: "left",
    },
    {
        data: "TRANTYPE",
        title: "Type",
        type: "text",
        width: 110,
        readOnly: true,
        align: "center",
    },
    {
        data: "BANKNAME",
        title: "Bank",
        type: "text",
        width: 150,
        readOnly: true,
        align: "left",
    },
    {
        data: "RECEIPT",
        title: "Receipt",
        type: "numeric",
        width: 110,
        readOnly: true,
        align: "right",
        showTotal: true,
    },
    {
        data: "ISSUE",
        title: "Issue",
        type: "numeric",
        width: 110,
        readOnly: true,
        align: "right",
        showTotal: true,
    },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

const initialForm = {
    FROMDATE: today,
    TODATE: today,
    PAYMODE: "CASH",
    BANKID: "",
};

const payModeCollection = [
    { label: "CASH", value: "CASH" },
    { label: "BANK", value: "BANK" },
];

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
    label,
    value,
    accent,
}: {
    label: string;
    value: number | null | undefined;
    accent: string;
}) {
    const formatted =
        value == null
            ? "—"
            : value.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                padding: "8px 18px",
                background: "#fff",
                border: `1.5px solid ${accent}`,
                borderRadius: 8,
                minWidth: 140,
            }}
        >
            <span style={{ fontSize: 9, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>
                ₹ {formatted}
            </span>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

function PaymentReport() {
    const { theme } = useTheme();
    const { setData, setColumns, setShowSno, title } = usePrint();
    const router = useRouter();

    const [formData, setFormData] = useState(initialForm);
    const [fetchEnabled, setFetchEnabled] = useState(false);

    /* ------------ API data ------------ */
    const { data: bankAccounts } = useAllBankAccounts();

    const bankAccountList = useMemo(() => {
        const banks = bankAccounts?.data;
        return Array.isArray(banks)
            ? banks.map((b: any) => ({ label: b.BANKNAME, value: b.ENTRYNO }))
            : [];
    }, [bankAccounts]);

    const formFields = useMemo(
        () =>
            PaymentReportFields({
                payModeList: payModeCollection,
                bankAccountList,
                isDisableBank: formData.PAYMODE !== "BANK",
            }),
        [formData.PAYMODE, bankAccountList]
    );

    const fieldNames = formFields.map((f) => f.name);
    const { register, focusNext } = useEnterNavigation(fieldNames, () => { });

    /* ------------ Form change ------------ */
    const handleChange = (name: string, value: any) => {
        setFetchEnabled(false); // reset when form changes
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === "PAYMODE" && value !== "BANK") updated.BANKID = "";
            return updated;
        });
    };

    /* ------------ Query (manual trigger) ------------ */
    const {
        data: reportResponse,
        isLoading,
        isError,
        refetch,
    } = usePaymentReport(
        {
            FROMDATE: formData.FROMDATE,
            TODATE: formData.TODATE,
            PAYMODE: formData.PAYMODE,
            BANKID: Number(formData.BANKID),
        },
        fetchEnabled   // ← pass enabled flag directly to the hook
    );

    /* ------------ View ------------ */
    const handleView = async () => {
        if (!fetchEnabled) {
            // First click: enable the query (it will auto-fetch)
            setFetchEnabled(true);
        } else {
            // Subsequent clicks: manually refetch
            await refetch();
        }
    };

    /* ------------ Clear ------------ */
    const handleClear = () => {
        setFormData(initialForm);
        setFetchEnabled(false);
    };

    /* ------------ Table data — map STATEMENT rows ------------ */
    const tableData = useMemo((): Record<string, unknown>[] => {
        const rows = reportResponse?.STATEMENT;
        if (!Array.isArray(rows)) return [];
        return rows.map((row) => ({
            TRANDATE: row.TRANDATE ?? "",
            PARTICULAR: row.PARTICULAR ?? "",
            TRANTYPE: row.TRANTYPE ?? "",
            BANKNAME: row.BANKNAME ?? "",
            RECEIPT: row.RECEIPT ?? null,
            ISSUE: row.ISSUE ?? null,
        }));
    }, [reportResponse]);

    console.log(tableData,'tableData');

    /* -------------------- EXPORT -------------------- */
    const handleExport = (option: string) => {
        setData(tableData || []);

        const columns: PrintColumn[] = [
            {
                key: "TRANDATE",
                label: "Date",

                renderCell: (value: any) =>
                    value ? formatDateForShow(value) : "",

                printValue: (value: any) =>
                    value ? formatDateForShow(value) : "",
            },

            {
                key: "PARTICULAR",
                label: "Particular",
            },

            {
                key: "TRANTYPE",
                label: "Type",
            },

            {
                key: "RECEIPT",
                label: "Receipt",

                renderCell: (value: any) =>
                    value != null
                        ? formatToFixed(Number(value), 2)
                        : "",

                printValue: (value: any) =>
                    value != null
                        ? formatToFixed(Number(value), 2)
                        : "",
            },

            {
                key: "ISSUE",
                label: "Issue",

                renderCell: (value: any) =>
                    value != null
                        ? formatToFixed(Number(value), 2)
                        : "",

                printValue: (value: any) =>
                    value != null
                        ? formatToFixed(Number(value), 2)
                        : "",
            },
        ];

        setColumns(columns);
        setShowSno(true);

        title?.("Payment Report");

        router.push(`/print?export=${option}`);
    };

    /* ------------ Empty / error state text ------------ */
    const emptyText = isLoading
        ? "Loading…"
        : isError
            ? "Failed to load data. Please try again."
            : !fetchEnabled
                ? "Set filters and click View to load the report."
                : "No records found for the selected criteria.";

    return (
        <Box>
            {/* ═══════════════ FILTER FORM ═══════════════ */}
            <Box
                display="flex"
                alignItems="center"
                bg={theme.colors.formColor}
                px={4}
                py="10px"
                rounded="lg"
                gap={0}
                border="0.5px solid"
                borderColor="gray.200"
                flexWrap="nowrap"
                overflowX="auto"
            >
                <DynamicForm
                    fields={formFields}
                    formData={formData}
                    onChange={handleChange}
                    register={register}
                    focusNext={focusNext}
                    layout="horizontal"
                    minLabelWidth="65px"
                />

                {/* visual separator */}
                <Box w="1px" h="20px" bg="gray.200" mx={3} flexShrink={0} />

                <HStack gap={2} flexShrink={0}>
                    <Button
                        colorPalette="blue"
                        variant="solid"
                        onClick={handleView}
                        loading={isLoading}
                        size="xs"
                        rounded="md"
                        gap={1}
                    >
                        <Icon as={TbTableImport} boxSize={3.5} />
                        View
                    </Button>
                    <Button
                        variant="outline"
                        colorPalette="gray"
                        onClick={handleClear}
                        size="xs"
                        rounded="md"
                        gap={1}
                    >
                        <Icon as={TbRotate} boxSize={3.5} />
                        Clear
                    </Button>
                </HStack>
            </Box>

            {/* ═══════════════ SUMMARY CARDS ═══════════════ */}
            {fetchEnabled && reportResponse && (
                <Box display="flex" justifyContent="space-between" alignItems={'center'} mt={3} gap={3} flexWrap="wrap" bg={theme.colors.formColor} p={2} rounded={'sm'}>

                    <Box display="flex" gap={2} flexWrap="wrap" >
                    <SummaryCard
                        label="Opening Balance"
                        value={reportResponse.OPENING}
                        accent="#1d4ed8"
                    />
                   
                    <SummaryCard
                        label="Total Receipt"
                        value={tableData.reduce(
                            (s, r) => s + (Number(r.RECEIPT) || 0),
                            0
                        )}
                        accent="#0891b2"
                    />
                    <SummaryCard
                        label="Total Issue"
                        value={tableData.reduce(
                            (s, r) => s + (Number(r.ISSUE) || 0),
                            0
                        )}
                        accent="#d97706"
                    />
                    <SummaryCard
                        label="Closing Balance"
                        value={reportResponse.CLOSING}
                        accent={
                            (reportResponse.CLOSING ?? 0) >= 0 ? "#16a34a" : "#dc2626"
                        }
                    />
                    </Box>
                    <Flex>
                         <Button variant="ghost" size="xs" color={theme.colors.green} onClick={() => handleExport("excel")}>
                            <FaFileExcel />
                        </Button>
                        <Button variant="ghost" size="xs" color={theme.colors.primaryText} onClick={() => handleExport("pdf")}>
                            <FaPrint />
                        </Button>
                    </Flex>
                </Box>
            )}

            {/* ═══════════════ TABLE ═══════════════ */}
            <Box mt={3}>
                <DataTable
                    title="Payment Statement"
                    data={tableData}
                    columnDefs={paymentColumns}
                    height="300px"
                    emptyText={emptyText}

                    /* Read-only report — hide editing toolbar buttons */
                    showRowControls={false}
                    showExport={false}
                    showSearch={false}

                    /* Totals row for RECEIPT + ISSUE columns */
                    totals={{
                        enabled: fetchEnabled && tableData.length > 0,
                        label: "Total",
                        bg: "#f0f4ff",
                        color: "#1e3a5f",
                    }}

                    /* Pagination */
                    pagination={{
                        enabled: true,
                        pageSize: 10,
                        showPageSizeSelector: true,
                        showPageNumbers: true,
                        showTotalCount: true,
                        
                    }}
                />
            </Box>
        </Box>
    );
}

export default PaymentReport;