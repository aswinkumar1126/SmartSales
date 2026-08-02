"use client";

import { Box, Button, HStack, Icon } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TbRotate, TbTableImport } from "react-icons/tb";
import { FaFileExcel, FaPrint } from "react-icons/fa";

/*------------- COMPONENTS ------------------*/
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import DataTable, { ColumnDef } from "@/component/table/ExcelReportTable";


/*------------- HOOKS ------------------*/
import { useAllAccountHead } from "@/hooks/apiHooks/accountHead/useAccountHead";
import { useSalesSummary } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";

/*------------- CONFIG ------------------*/
import { SalesReportFields } from "@/config/report/SalesReport";

/*------------- CONTEXT ------------------*/
import { useTheme } from "@/context/theme/themeContext";
import { usePrint } from "@/context/print/usePrintContext";
import { PrintColumn } from "@/component/screens/PrintPreviewScreen";
import { formatDateForShow } from "@/utils/format/formatDateForAPI";
import { formatToFixed } from "@/utils/format/numberFormat";


// ─── Column definitions (read-only, no editing) ───────────────────────────────


const paymentColumns: ColumnDef[] = [

    {
        data: "ENTRYNO",
        title: "Entry No",
        type: "text",
        width: 80,
        readOnly: true,
        align: "center",
    },
    {
        data: "TRANDATE",
        title: "Date",
        type: "text",
        width: 80,
        readOnly: true,
        align: "center",
    },
    {
        data: "CUSTOMER",
        title: "Party Name",
        type: "text",
        width: 150,
        readOnly: true,
        align: "left",
    },
    {
        data: "SALE",
        title: "Sales",
        type: "numeric",
        width: 90,
        readOnly: true,
        align: "right",
        showTotal: true,
        decimalScale :3 ,
        
    },
    {
      data: "SALERETURN",
        title: "Sales Return",
        type: "numeric",
        width: 100,
        readOnly: true,
        align: "right",
        showTotal: true,
      decimalScale: 3,
    },
    {
        data: "ISSUE",
        title: "Issue",
        type: "numeric",
        width: 80,
        readOnly: true,
        align: "right",
        showTotal: true,
      decimalScale: 3,
    },
    {
      data: "RECEIPT",
      title: "Receipt",
      type: "numeric",
      width: 80,
      readOnly: true,
      align: "right",
      showTotal: true,
      decimalScale: 3,
    },
    {
      data:"CLOSING",
      title: "Closing Details",
      type: "numeric",
      width: 110,
      readOnly: true,
      align: "center",
      subColumns : [
        {
          data: "BANK_PAID",
          title: "Bank Paid",
          type: "numeric",
          width: 80,
          readOnly: true,
          align: "right",
          showTotal: true,
          
        
        },
        {
          data: "BANK_RCVD",
          title: "Bank Rcvd",
          type: "numeric",
          width: 90,
          readOnly: true,
          align: "right",
          showTotal: true,

        },
        {
          data: "CASH_PAID",
          title: "Cash Paid",
          type: "numeric",
          width: 80,
          readOnly: true,
          align: "right",
          showTotal: true,

        },
        {
          data: "CASH_RCVD",
          title: "Cash Rcvd",
          type: "numeric",
          width: 90,
          readOnly: true,
          align: "right",
          showTotal: true,

        },
        {
          data: "CONVWT",
          title: "Conv Wt",
          type: "numeric",
          width: 80,
          readOnly: true,
          align: "right",
          showTotal: true,
          decimalScale: 3,

        },

        {
          data: "CONVPURE",
          title: "Conv Pure",
          type: "numeric",
          width: 90,
          readOnly: true,
          align: "right",
          showTotal: true,
          decimalScale: 3,

        },
        {
          data: "DISC_AMT",
          title: "Disc Amt",
          type: "numeric",
          width: 80,
          readOnly: true,
          align: "right",
          showTotal: true,

        },
        {
          data: "DISC_WT",
          title: "Disc Wt",
          type: "numeric",
          width: 80,
          readOnly: true,
          align: "right",
          showTotal: true,
          decimalScale: 3,

        },

      ]


    }
    

];

// ─── Constants ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

const initialForm = {
    FROMDATE: today,
    TODATE: today,
    ACCODE: "",
};


// ─── Component ────────────────────────────────────────────────────────────────

function SalesReport() {
    const { theme } = useTheme();
    const { setData, setColumns, setShowSno, title } = usePrint();
    const router = useRouter();

    const [formData, setFormData] = useState(initialForm);
    const [fetchEnabled, setFetchEnabled] = useState(false);


   const { data: allAccounts } = useAllAccountHead("CR");

 
    const allCustomerList = useMemo(()=>{
      const customers = allAccounts?.data?.acheads;
      return Array.isArray(customers)
          ? customers.map((c: any) => ({ label: c.ACNAME, value: String(c.ACCODE) }))
          : [];
    }, [allAccounts]);



    const formFields = useMemo(
        () =>
        SalesReportFields({
          customerList: allCustomerList
            }),
      [allCustomerList]
    );

    const fieldNames = formFields.map((f) => f.name);
    const { register, focusNext } = useEnterNavigation(fieldNames, () => { });

    /* ------------ Form change ------------ */
    const handleChange = (name: string, value: any) => {
        setFetchEnabled(false); // reset when form changes
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            return updated;
        });
    };

    /* ------------ Query (manual trigger) ------------ */
  const {
    data = [],
    refetch,
    isLoading,
    isError,
  } = useSalesSummary({
    FROMDATE : formData.FROMDATE,
    TODATE : formData.TODATE,
    ACCODE : formData.ACCODE ?  Number(formData.ACCODE) : undefined,
    fetchEnabled
  });


    /* ------------ View ------------ */
    const handleView = async () => {
        setFetchEnabled(true);
        await refetch();
    };

    /* ------------ Clear ------------ */
    const handleClear = () => {
        setFormData(initialForm);
        setFetchEnabled(false);
    };
    console.log(data ,'salesTrnData');

    /* ------------ Table data — map STATEMENT rows ------------ */
    const tableData = useMemo((): Record<string, unknown>[] => {
      const rows = fetchEnabled ? data : [] ;
        if (!Array.isArray(rows)) return [];
        return rows.map((row) => ({
            ENTRYNO :row.ENTRYNO ,
            TRANDATE: formatDateForShow(row.TRANDATE) ?? "",
            CUSTOMER: row.ACNAME ?? "",
            SALE: row.SALES ?? "",
            SALERETURN: row.SALES_RETURN ?? "",
            RECEIPT:formatToFixed( row.RECEIPT ,2) ?? null,
            ISSUE:  formatToFixed(row.ISSUE,2) ?? null,
            CLOSING:  formatToFixed(row.CLOSING, 2) ?? null,
            BANK_PAID:  formatToFixed(row.BANK_PAID, 2) ?? null,
            BANK_RCVD:  formatToFixed(row.BANK_RCVD, 2) ?? null,
            CASH_PAID:  formatToFixed(row.CASH_PAID, 2) ?? null,
            CASH_RCVD:  formatToFixed(row.CASH_RCVD, 2) ?? null,
            CONVWT:  formatToFixed(row.CONVWT, 2) ?? null,
            CONVPURE:  formatToFixed(row.CONVPURE, 2) ?? null,
            DISC_AMT:  formatToFixed(row.DISC_AMT, 2) ?? null,
            DISC_WT:  formatToFixed(row.DISC_WT, 2) ?? null,

        }));
    }, [data ,fetchEnabled]);

    console.log(tableData,'tableData');

    /* -------------------- EXPORT -------------------- */
  const handleExport = (option: string) => {
    setData(tableData || []);

    const columns: PrintColumn[] = [
      // Simple column without nesting
      {
        key: "ENTRYNO",
        label: "Entry No",
        align: "center",
        isNumeric: true,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 0) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 0) : "",
      },
      {
        key: "TRANDATE",
        label: "entry Date",
        align: "center",

        // renderCell: (value: any) => value ? formatDateForShow(value) : "",
        // printValue: (value: any) => value ? formatDateForShow(value) : "",
      },
      {
        key: "CUSTOMER",
        label: "Party Name",
        align: "start",
      },
      {
        key: "SALE",
        label: "Sales",
        align: "end",
        isNumeric: true,
        allowTotal: true,
        decimalScale: 3,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      {
        key: "SALERETURN",
        label: "Sales Return",
        align: "end",
        isNumeric: true,
        allowTotal: true,
        decimalScale: 3,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      {
        key: "ISSUE",
        label: "Issue",
        align: "end",
        isNumeric: true,
        allowTotal: true,
        decimalScale: 3,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      {
        key: "RECEIPT",
        label: "Receipt",
        align: "end",
        isNumeric: true,
        allowTotal: true,
        decimalScale: 3,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      // Nested headers example - using subColumns
      {
        key: "CLOSING",
        label: "Closing Details",
        align: "center",
        allowTotal: true,
        subColumns: [
          {
            key: "BANK_PAID",
            label: "Bank Paid",
            align: "end",
            isNumeric: true,
            allowTotal: true,
            decimalScale: 2,
            renderCell: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
            printValue: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
          },
          {
            key: "BANK_RCVD",
            label: "Bank Rcvd",
            align: "end",
            isNumeric: true,
            allowTotal: true,
            decimalScale: 2,
            renderCell: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
            printValue: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
          },
          {
            key: "CASH_PAID",
            label: "Cash Paid",
            align: "end",
            isNumeric: true,
            allowTotal: true,
            decimalScale: 2,
            renderCell: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
            printValue: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
          },
          {
            key: "CASH_RCVD",
            label: "Cash Rcvd",
            align: "end",
            isNumeric: true,
            allowTotal: true,
            decimalScale: 2,
            renderCell: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
            printValue: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
          },
          {
            key: "CONVWT",
            label: "Conv Wt",
            align: "end",
            isNumeric: true,
            allowTotal: true,
            decimalScale: 3,
            renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
            printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
          },
          {
            key: "CONVPURE",
            label: "Conv Pure",
            align: "end",
            isNumeric: true,
            allowTotal: true,
            decimalScale: 3,
            renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
            printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
          },
          {
            key: "DISC_AMT",
            label: "Disc Amt",
            align: "end",
            isNumeric: true,
            allowTotal: true,
            decimalScale: 2,
            renderCell: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
            printValue: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
          },
          {
            key: "DISC_WT",
            label: "Disc Wt",
            align: "end",
            isNumeric: true,
            allowTotal: true,
            decimalScale: 3,
            renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
            printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
          },
        ]
      }
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
            {/* ═══════════════ FILTER BAR ═══════════════ */}
            <Box
                display="flex"
                alignItems="center"
                bg={theme.colors.formColor}
                px={4}
                py="10px"
                rounded="lg"
                border="1px solid"
                borderColor={theme.colors.greyColor}
                flexWrap="nowrap"
                overflowX="auto"
                gap={2}
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

                <Box w="1px" h="20px" bg={theme.colors.greyColor} mx={2} flexShrink={0} />

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
                        onClick={handleClear}
                        size="xs"
                        rounded="md"
                        gap={1}
                        borderColor={theme.colors.greyColor}
                        color={theme.colors.primaryText}
                    >
                        <Icon as={TbRotate} boxSize={3.5} />
                        Clear
                    </Button>

                    <Box w="1px" h="20px" bg={theme.colors.greyColor} mx={1} flexShrink={0} />

                    <Button
                        variant="ghost"
                        size="xs"
                        color={theme.colors.green}
                        disabled={!fetchEnabled || tableData.length === 0}
                        onClick={() => handleExport("excel")}
                        title="Export to Excel"
                    >
                        <FaFileExcel />
                    </Button>
                    <Button
                        variant="ghost"
                        size="xs"
                        color={theme.colors.primaryText}
                        disabled={!fetchEnabled || tableData.length === 0}
                        onClick={() => handleExport("pdf")}
                        title="Print / PDF"
                    >
                        <FaPrint />
                    </Button>
                </HStack>
            </Box>

            {/* ═══════════════ TABLE ═══════════════ */}
            <Box mt={3}>
                <DataTable
                    title="Sales Statement"
                    data={tableData}
                    columnDefs={paymentColumns}
                    height="430px"
                    emptyText={emptyText}
                    showRowControls={false}
                    showSearch={false}
                    totals={{
                        enabled: tableData.length > 0,
                        label: "Total",
                        bg: theme.colors.accient,
                        color: theme.colors.whiteColor,
                    }}
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

export default SalesReport;