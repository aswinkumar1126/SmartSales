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
import { useStoneItems } from "@/hooks/apiHooks/item/useItems";
import { useAllMetals } from "@/hooks/apiHooks/metal/useMetals";
import { useOutstandingStockReport } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";

/*------------- CONFIG ------------------*/
import { OutstandingStockReportFields } from "@/config/report/OutStandingStockReport";

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
        width: 250,
        readOnly: true,
        align: "left",
    },
    {
        data: "PCS",
        title: "Pcs",
        type: "numeric",
        width: 100,
        readOnly: true,
        align: "right",
        showTotal: true,
        decimalScale :0 ,
        
    },
    {
      data: "GRSWT",
        title: "Grs Wt",
        type: "numeric",
        width: 150,
        readOnly: true,
        align: "right",
        showTotal: true,
      decimalScale: 3,
    },
    {
        data: "STNWT",
        title: "Stn Wt",
        type: "numeric",
        width: 150,
        readOnly: true,
        align: "right",
        showTotal: true,
      decimalScale: 3,
    },
    {
      data: "NETWT",
      title: "Net Wt",
      type: "numeric",
      width: 150,
      readOnly: true,
      align: "right",
      showTotal: true,
      decimalScale: 3,
    },
    {
      data:"PUREWT",
      title: "Pure Wt",
      type: "numeric",
      width: 200,
      readOnly: true,
      align: "center",
      decimalScale :3,
    },
    {
    data: "STNAMT",
    title: "Stn Amt",
    type: "numeric",
    width: 200,
    readOnly: true,
    align: "center",
    decimalScale: 2,
  }

];

// ─── Constants ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

const initialForm = {
    FROMDATE: today,
    TODATE: today,
    PAYMODE: "CASH",
    BANKID: "",
};


// ─── Component ────────────────────────────────────────────────────────────────

function OurStandingStockReport() {
    const { theme } = useTheme();
    const { setData, setColumns, setShowSno, title } = usePrint();
    const router = useRouter();

    const [formData, setFormData] = useState(initialForm);
    const [fetchEnabled, setFetchEnabled] = useState(false);


  const { data: allItems } = useStoneItems({STUDDED:'N'});
  const { data: metalData } = useAllMetals();

 
    const allItemsList = useMemo(()=>{
      const items = allItems;
      return Array.isArray(items)
        ? items.map((i: any) => ({ label: i.itemName, value: String(i.itemId) }))
          : [];
    }, [allItems]);

    
  
      const metals = useMemo(() => {
          if (!metalData) return [];
          return metalData.map((m) => ({
              label: m.metalName,
              value: m.metalId
          }))
      }, [metalData]);

  
      const yesNoOptions = [
          { label: "YES", value: "Y" },
          { label: "NO", value: "N" },
      ];
  
const stockTypeList = [
  {label:'TAGED',value:'T'},
  {label:'NON TAGED',value:'N'},

]




    const formFields = useMemo(
        () =>
        OutstandingStockReportFields({
          itemList: allItemsList ,
          stockTypeList: stockTypeList,
          stoneList: yesNoOptions ,
          metalList: metals

            }),
      [allItemsList, metals]
    );

    const fieldNames = formFields.map((f) => f.name);
    const { register, focusNext ,focusFirst } = useEnterNavigation(fieldNames, () => { });

    /* ------------ Form change ------------ */
    const handleChange = (name: string, value: any) => {
        setFetchEnabled(false); // reset when form changes
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === "PAYMODE" && value !== "BANK") updated.BANKID = "";
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
  } = useOutstandingStockReport({
    ITEMNAME : "" ,
    STOCKTYPE : "",
    METAL :"",
    STONE_PRESENT :""
  });


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

    const columns: PrintColumn[] = [
      // Simple column without nesting
      
      {
        key: "ITEMNAME",
        label: "Item Name",
        align: "start",
      },
      {
        key: "PCS",
        label: "Pcs",
        align: "end",
        isNumeric: true,
        allowTotal: true,
        decimalScale: 0,
      },
      {
        key: "GRSWT",
        label: "Grs Wt",
        align: "end",
        isNumeric: true,
        allowTotal: true,
        decimalScale: 3,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      {
        key: "STNWT",
        label: "Stn Wt",
        align: "end",
        isNumeric: true,
        allowTotal: true,
        decimalScale: 3,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      {
        key: "NETWT",
        label: "Net Wt",
        align: "end",
        isNumeric: true,
        allowTotal: true,
        decimalScale: 3,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      // Nested headers example - using subColumns
      {
        key: "PUREWT",
        label: "Pure Wt",
        align: "end",
        allowTotal: true,
        isNumeric :true,
        decimalScale :3 ,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      {
        key: "STNAMT",
        label: "Stn Amt",
        align: "end",
        allowTotal: true,
        isNumeric: true,
        decimalScale: 2,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 2) : "",
      },

    ];

    setColumns(columns);
    setShowSno(true);
    title?.("Outstanding Stock Report");
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
                  title="Outstanding Stock Statement"
                  data={tableData}
                  columnDefs={stockColumns}
                  height="430px"
                  emptyText={emptyText}

                  /* Read-only report — hide editing toolbar buttons */
                  showRowControls={false}
                  showSearch={false}

                  /* Totals row for RECEIPT + ISSUE columns */
                  totals={{
                    enabled: tableData.length > 0,
                    label: "Total",
                    bg: "#222",
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
          }

            
          </Box>

        </Box>
    );
}

export default OurStandingStockReport;