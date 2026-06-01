"use client";

import { Box, Button, Flex, HStack ,Icon } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TbRotate, TbTableImport } from "react-icons/tb";
import { FaFileExcel, FaPrint } from "react-icons/fa";

/*------------- COMPONENTS ------------------*/
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import DataTable, { ColumnDef } from "@/component/table/ExcelReportTable";


/*------------- HOOKS ------------------*/
import { usePureStockReport } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";

/*------------- CONFIG ------------------*/
import { PureGoldStockReportFields } from "@/config/report/PureGoldStockReport";

/*------------- CONTEXT ------------------*/
import { useTheme } from "@/context/theme/themeContext";
import { usePrint } from "@/context/print/usePrintContext";
import { PrintColumn } from "@/component/screens/PrintPreviewScreen";
import { formatToFixed } from "@/utils/format/numberFormat";


// ─── Column definitions (read-only, no editing) ───────────────────────────────


const stockColumns: ColumnDef[] = [

  
    {
        data: "PUREGOLDNAME",
        title: "Pure Gold Name",
        type: "text",
        width: 200,
        readOnly: true,
        align: "left",
    },
    {
      data:"TOUCH",
      title:"Touch",
      type :'numeric',
      decimalScale:2,
      width:100,
      readOnly:true
   
    },
    {
      data: "OPENING",
      title: "OPENING",
      type: "text",
      width: 250,
      readOnly: true,
      align: "left",
      
      subColumns :[
        {
          data :"OP_WT",
          title :"WT",
          type :"numeric",
          width:120,
          readOnly:true,
          align:"right",
          decimalScale:3,
     
        },
        {
          data: "OP_PUREWT",
          title: "PUREWT",
          type: "numeric",
          width: 120,
          readOnly: true,
          align: "right",
          decimalScale:3
        }
      ]

      
        
    },
    {
      data: "RECEIVED",
      title: "RECEIVED",
      type: "text",
      width: 200,
      readOnly: true,
      align: "left",
      subColumns: [
        {
          data: "RE_WT",
          title: "WT",
          type: "numeric",
          width: 120,
          readOnly: true,
          align: "right",
          decimalScale: 3
        },
        {
          data: "RE_PUREWT",
          title: "PUREWT",
          type: "numeric",
          width: 120,
          readOnly: true,
          align: "right",
          decimalScale: 3
        }
      ]
    },
   
    {
      data: "ISSUE",
      title: "ISSUE",
      type: "text",
      width: 200,
      readOnly: true,
      align: "right",
      subColumns: [
        {
          data: "IS_WT",
          title: "WT",
          type: "numeric",
          width: 120,
          readOnly: true,
          align: "right",
          decimalScale: 3
        },
        {
          data: "IS_PUREWT",
          title: "PUREWT",
          type: "numeric",
          width: 120,
          readOnly: true,
          align: "right",
          decimalScale: 3
        }
      ]
  },
   {
    data: "CLOSING",
     title: "CLOSING",
    type: "text",
    width: 200,
    readOnly: true,
    align: "right",
     subColumns: [
       {
         data: "CL_WT",
         title: "WT",
          type: "numeric",
          width: 120,
          readOnly: true,
          align: "right",
          decimalScale:3
       },
       {
         data: "CL_PUREWT",
         title: "PUREWT",
         type: "numeric",
         width: 120,
         readOnly: true,
         align: "right",
         decimalScale: 3
       }
     ]
  }

];

// ─── Constants ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

const initialForm = {
    DATE: "",
    COLUMNS : ["WT","PUREWT"] as string[],
};


// ─── Component ────────────────────────────────────────────────────────────────

function PureGoldStockReport() {
    const { theme } = useTheme();
    const { setData, setColumns, setShowSno, title } = usePrint();
    const router = useRouter();

    const [formData, setFormData] = useState(initialForm);
    const [fetchEnabled, setFetchEnabled] = useState(false);

    const columnsToShowList =[
      {label:'WT',value:'WT'},
      {label:'PUREWT',value:'PUREWT'},
    ]

    
  const formFields = useMemo(() => PureGoldStockReportFields({ colToShow :columnsToShowList }), []); 

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
  } = usePureStockReport(
    {
   date:formData.DATE ,
   columns : formData.COLUMNS
  }
);

  console.log(data,'usePureStockReport');


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
    console.log(data ,'salesTrnData');

    /* ------------ Table data — map STATEMENT rows ------------ */
    const tableData = useMemo((): Record<string, unknown>[] => {
      const rows = fetchEnabled ? data : [] ;
      console.log(rows,'rows')
      if (!Array.isArray(rows)) return [];
      return rows ;
    }, [data ,fetchEnabled]);

    console.log(tableData,'tableData');

    /* -------------------- EXPORT -------------------- */
  const handleExport = (option: string) => {
    setData(tableData || []);

    const selected = formData.COLUMNS || [];

    const showWT =
      selected.length === 0 || selected.includes("WT");

    const showPureWT =
      selected.length === 0 || selected.includes("PUREWT");

    const columns: PrintColumn[] = [
      {
        key: "PUREGOLDNAME",
        label: "Pure Gold Name",
        align: "start",
      },
      {
        key: "TOUCH",
        label: "Touch",
        align: "end",
        isNumeric: true,
        decimalScale: 2,
        allowTotal: false,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
      },

      {
        key: "OPENING",
        label: "OPENING",
        subColumns: [
          ...(showWT
            ? [{
              key: "OP_WT",
              label: "WT",
              align: "end" as const,
              isNumeric: true,
              allowTotal: true,
              decimalScale: 3,
              renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
              printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
            }]
            : []),

          ...(showPureWT
            ? [{
              key: "OP_PUREWT",
              label: "PUREWT",
              align: "end" as const ,
              isNumeric: true,
              allowTotal: true,
              decimalScale: 3,
              renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
              printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
            }]
            : [])
        ]
      },

      {
        key: "RECEIVED",
        label: "RECEIVED",
        subColumns: [
          ...(showWT
            ? [{
              key: "RE_WT",
              label: "WT",
              align: "end" as const,
              isNumeric: true,
              allowTotal: true,
              decimalScale: 3,
              renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
              printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
            }]
            : []),

          ...(showPureWT
            ? [{
              key: "RE_PUREWT",
              label: "PUREWT",
              align: "end" as const,
              isNumeric: true,
              allowTotal: true,
              decimalScale: 3,
              renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
              printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
            }]
            : [])
        ]
      },

      {
        key: "ISSUE",
        label: "ISSUE",
        subColumns: [
          ...(showWT
            ? [{
              key: "IS_WT",
              label: "WT",
              align: "end" as const,
              isNumeric: true,
              allowTotal: true,
              decimalScale: 3,
              renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
              printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
            }]
            : []),

          ...(showPureWT
            ? [{
              key: "IS_PUREWT",
              label: "PUREWT",
              align: "end" as const,
              isNumeric: true,
              allowTotal: true,
              decimalScale: 3,
              renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
              printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
            }]
            : [])
        ]
      },

      {
        key: "CLOSING",
        label: "CLOSING",
        subColumns: [
          ...(showWT
            ? [{
              key: "CL_WT",
              label: "WT",
              align: "end" as const,
              isNumeric: true,
              allowTotal: true,
              decimalScale: 3,
              renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
              printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
              
            }]
            : []),

          ...(showPureWT
            ? [{
              key: "CL_PUREWT",
              label: "PUREWT",
              align: "end" as const,
              isNumeric: true,
              allowTotal: true,
              decimalScale: 3,
              renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
              printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
            }]
            : [])
        ]
      },
    ];
    setColumns(columns);
    setShowSno(true);
    title?.("Pure Gold Stock Statement");
    router.push(`/print?export=${option}`);
  };




  const visibleColumns = useMemo(() => {
    const selected = (formData.COLUMNS || []) as string[];

    return stockColumns.map((column) => {
      if (!column.subColumns) return column;

      const filteredSubColumns = column.subColumns.filter((subCol) => {
        const field = String(subCol.data).toUpperCase();

        const isWt =
          field === "OP_WT" ||
          field === "RE_WT" ||
          field === "IS_WT" ||
          field === "CL_WT";

        const isPureWt =
          field === "OP_PUREWT" ||
          field === "RE_PUREWT" ||
          field === "IS_PUREWT" ||
          field === "CL_PUREWT";

        if (isWt && !selected.includes("WT")) {
          return false;
        }

        if (isPureWt && !selected.includes("PUREWT")) {
          return false;
        }

        return true;
      });

      return {
        ...column,
        subColumns: filteredSubColumns,
      };
    });
  }, [formData.COLUMNS]);

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
    
          <Box >
          {fetchEnabled && 
          <Box>
              <Flex justifyContent={'end'} bg={theme.colors.formColor} p={2} mt={3} rounded={'md'}>
                <Button variant="ghost" size="xs" color={theme.colors.green} onClick={() => handleExport("excel")}>
                  <FaFileExcel />
                </Button>
                <Button variant="ghost" size="xs" color={theme.colors.primaryText} onClick={() => handleExport("pdf")}>
                  <FaPrint />
                </Button>
              </Flex>

              {/* ═══════════════ TABLE ═══════════════ */}
              <Box mt={3}>
                <DataTable
                  title="PureGold Stock Statement"
                  data={tableData}
                  columnDefs={visibleColumns}
                  height="430px"
                  emptyText={emptyText}

                  /* Read-only report — hide editing toolbar buttons */
                  showRowControls={false}
                  showSearch={false}

                  /* Totals row for RECEIPT + ISSUE columns */
                  // totals={{
                  //   enabled: tableData.length > 0,
                  //   label: "Total",
                  //   bg: "#222",
                  //   color: "#1e3a5f",
                  // }}

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
          }

            
          </Box>

        </Box>
    );
}

export default PureGoldStockReport;