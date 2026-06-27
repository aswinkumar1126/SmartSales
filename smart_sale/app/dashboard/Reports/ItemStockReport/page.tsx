"use client";

import { Box, Button, HStack, Icon } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TbRotate, TbTableImport } from "react-icons/tb";
import { FaFileExcel, FaPrint } from "react-icons/fa";

/*------------- COMPONENTS ------------------*/
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import DataTable, { ColumnDef } from "@/component/table/ExcelReportTable";


/*------------- HOOKS ------------------*/
import { useItemStockReport } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";

/*------------- CONFIG ------------------*/
import { ItemStockReportFields } from "@/config/report/ItemStockReport";

/*------------- CONTEXT ------------------*/
import { useTheme } from "@/context/theme/themeContext";
import { usePrint } from "@/context/print/usePrintContext";
import { PrintColumn } from "@/component/screens/PrintPreviewScreen";
import { formatToFixed } from "@/utils/format/numberFormat";


// ─── Column definitions (read-only, no editing) ───────────────────────────────


const stockColumns: ColumnDef[] = [
  {
    data: "ITEMNAME",
    title: "Item Name",
    type: "text",
    width: 150,
    readOnly: true,
    align: "left",
    
  },

  {
    data: "OPENING",
    title: "OPENING",
    type: "text",
    width: 600,
    readOnly: true,
    align: "left",
    subColumns: [
      {
        data: "OP_PCS",
        title: "PCS",
        type: "numeric",
        width: 40,
        readOnly: true,
        align: "right",
        decimalScale: 0,
      },
      {
        data: "OP_GRSWT",
        title: "GRSWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "OP_STNWT",
        title: "STNWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "OP_NETWT",
        title: "NETWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "OP_STNAMT",
        title: "STNAMT",
        type: "numeric",
        width: 75,
        readOnly: true,
        align: "right",
        decimalScale: 2,
      },
      {
        data: "OP_PUREWT",
        title: "PUREWT",
        type: "numeric",
        width: 75,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
    ],
  },

  {
    data: "RECEIVED",
    title: "RECEIVED",
    type: "text",
    width: 600,
    readOnly: true,
    align: "left",
    subColumns: [
      {
        data: "RE_PCS",
        title: "PCS",
        type: "numeric",
        width: 35,
        readOnly: true,
        align: "right",
        decimalScale: 0,
      },
      {
        data: "RE_GRSWT",
        title: "GRSWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "RE_STNWT",
        title: "STNWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "RE_NETWT",
        title: "NETWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "RE_STNAMT",
        title: "STNAMT",
        type: "numeric",
        width: 75,
        readOnly: true,
        align: "right",
        decimalScale: 2,
      },
      {
        data: "RE_PUREWT",
        title: "PUREWT",
        type: "numeric",
        width: 75,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
    ],
  },

  {
    data: "ISSUE",
    title: "ISSUE",
    type: "text",
    width: 600,
    readOnly: true,
    align: "right",
    subColumns: [
      {
        data: "IS_PCS",
        title: "PCS",
        type: "numeric",
        width: 35,
        readOnly: true,
        align: "right",
        decimalScale: 0,
      },
      {
        data: "IS_GRSWT",
        title: "GRSWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "IS_STNWT",
        title: "STNWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "IS_NETWT",
        title: "NETWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "IS_STNAMT",
        title: "STNAMT",
        type: "numeric",
        width: 75,
        readOnly: true,
        align: "right",
        decimalScale: 2,
      },
      {
        data: "IS_PUREWT",
        title: "PUREWT",
        type: "numeric",
        width: 75,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
    ],
  },

  {
    data: "CLOSING",
    title: "CLOSING",
    type: "text",
    width: 600,
    readOnly: true,
    align: "right",
    subColumns: [
      {
        data: "CL_PCS",
        title: "PCS",
        type: "numeric",
        width: 35,
        readOnly: true,
        align: "right",
        decimalScale: 0,
      },
      {
        data: "CL_GRSWT",
        title: "GRSWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "CL_STNWT",
        title: "STNWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "CL_NETWT",
        title: "NETWT",
        type: "numeric",
        width: 65,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
      {
        data: "CL_STNAMT",
        title: "STNAMT",
        type: "numeric",
        width: 75,
        readOnly: true,
        align: "right",
        decimalScale: 2,
      },
      {
        data: "CL_PUREWT",
        title: "PUREWT",
        type: "numeric",
        width: 75,
        readOnly: true,
        align: "right",
        decimalScale: 3,
      },
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

const initialForm = {
    DATE: "",
    COLUMNS : ["PCS","GRSWT","STNWT", "PUREWT"] as string[],
};


// ─── Component ────────────────────────────────────────────────────────────────

function ItemStockReport() {
    const { theme } = useTheme();
    const { setData, setColumns, setShowSno, title } = usePrint();
    const router = useRouter();

    const [formData, setFormData] = useState(initialForm);
    const [fetchEnabled, setFetchEnabled] = useState(false);

    const columnsToShowList =[
      {label:'PCS',value:'PCS'},
      {label:'GRS WT',value:'GRSWT'},
      {label:'STN WT',value:'STNWT'},
      {label:'NET WT',value:'NETWT'},
      {label:'STN AMT',value:'STNAMT'},
      {label:'PURE WT',value:'PUREWT' ,},
    ]

    
  const formFields = useMemo(() => ItemStockReportFields({ colToShow :columnsToShowList }), []); 

  const fieldNames = formFields.map((f) => f.name);
  const { register, focusNext ,focusFirst } = useEnterNavigation(fieldNames, () => { });

    /* ------------ Form change ------------ */
  const handleChange = (name: string, value: any) => {
    setFetchEnabled(false); // reset when form changes
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
  };

  useEffect(()=>{
    focusFirst();
  },[])
    /* ------------ Query (manual trigger) ------------ */
  const {
    data = [],
    refetch,
    isLoading,
    isError,
  } = useItemStockReport(
    {
   date:formData.DATE ,
   columns : formData.COLUMNS
  }
);

  console.log(data,'usePureStockReport');


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
    const tableData = useMemo((): Record<string, any>[] => {
      const rows = fetchEnabled ? data : [] ;
   
      if (!Array.isArray(rows)) return [];
      return rows ;
    }, [data ,fetchEnabled]);

  const visibleColumns = useMemo(() => {
    const selected = (formData.COLUMNS || []) as string[];

    if (selected.length === 0) {
      return stockColumns;
    }

    return stockColumns.map((column) => {
      if (!column.subColumns) return column;

      return {
        ...column,
        subColumns: column.subColumns.filter((subCol) => {
          const field = String(subCol.data).toUpperCase();

          if (field.includes("PCS"))
            return selected.includes("PCS");

          if (field.includes("GRSWT"))
            return selected.includes("GRSWT");

          if (field.includes("STNWT"))
            return selected.includes("STNWT");

          if (field.includes("NETWT"))
            return selected.includes("NETWT");

          if (field.includes("STNAMT"))
            return selected.includes("STNAMT");

          if (field.includes("PUREWT"))
            return selected.includes("PUREWT");

          return true;
        }),
      };
    });
  }, [formData.COLUMNS]);

    /* -------------------- EXPORT -------------------- */
  const handleExport = (option: string) => {
    setData(tableData || []);

    const columns = visibleColumns.map((col) => ({
      key: String(col.data),
      label: col.title,
      align:
        col.align === "right"
          ? "end" as const 
          : col.align === "center"
            ? "center" as const 
            : "start" as const,

      isNumeric: col.type === "numeric",
      decimalScale: col.decimalScale,
      allowTotal: col.type === "numeric" ? true : false,

      subColumns: col.subColumns?.map((sub) => ({
        key: String(sub.data),
        label: sub.title,

        align:
          sub.align === "right"
            ? "end"
            : sub.align === "center"
              ? "center"
              : "start",

        isNumeric: sub.type === "numeric",
        decimalScale: sub.decimalScale,
        allowTotal: true,

        renderCell: (value: any) =>
          value != null && sub.decimalScale != null
            ? formatToFixed(Number(value), sub.decimalScale)
            : value,

        printValue: (value: any) =>
          value != null && sub.decimalScale != null
            ? formatToFixed(Number(value), sub.decimalScale)
            : value,
      })),
    }));
    setColumns(columns);
    setShowSno(true);
    title?.("Pure Gold Stock Statement");
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
                    title="Items Stock Statement"
                    data={tableData}
                    columnDefs={visibleColumns}
                    height="430px"
                    emptyText={emptyText}
                    showRowControls={false}
                    showSearch={false}
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

export default ItemStockReport;