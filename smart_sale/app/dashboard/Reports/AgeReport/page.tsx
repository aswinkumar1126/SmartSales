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
import { useStoneItems } from "@/hooks/apiHooks/item/useItems";
import { useAgeReport } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";

/*------------- CONFIG ------------------*/
import { AgeReportFields } from "@/config/report/AgeReport";

/*------------- CONTEXT ------------------*/
import { useTheme } from "@/context/theme/themeContext";
import { usePrint } from "@/context/print/usePrintContext";
import { PrintColumn } from "@/component/screens/PrintPreviewScreen";
import { formatToFixed } from "@/utils/format/numberFormat";
import { formatDateForShow } from "@/utils/format/formatDateForAPI";
import { printValue } from "yup";


// ─── Column definitions (read-only, no editing) ───────────────────────────────


const stockColumns: ColumnDef[] = [

  
    {
        data: "ITEMNAME",
        title: "Item Name",
        type: "text",
        width: 300,
        readOnly: true,
        align: "left",
    },
    {
      data: "TAGNO",
      title: "Tag Number",
      type: "text",
      width: 200,
      readOnly: true,
      align: "left",
        
    },
    {
      data: "TAGDATE",
      title: "Tag Date",
      type: "text",
      width: 200,
      readOnly: true,
      align: "left",
    },
   
    {
      data: "AGE",
      title: "Age",
      type: "text",
      width: 200,
      readOnly: true,
      align: "right",
  }

];

// ─── Constants ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

const initialForm = {
    FROMAGE: "",
    TOAGE: "",
    ITEMID :"",

};


// ─── Component ────────────────────────────────────────────────────────────────

function AgeReport() {
    const { theme } = useTheme();
    const { setData, setColumns, setShowSno, title } = usePrint();
    const router = useRouter();

    const [formData, setFormData] = useState(initialForm);
    const [fetchEnabled, setFetchEnabled] = useState(false);


  const { data: allItems } = useStoneItems({STOCKTYPE:"T"});

  console.log(allItems,'allItems')
    
  const allItemsList = useMemo(()=>{
      const items = allItems;
      return Array.isArray(items)
        ? items.map((i: any) => ({ 
          label: i.itemName, 
          value: String(i.itemId) 
        }))
        : [];
      }, [allItems]);
  
  console.log(allItems,'allItems')
    
  const formFields = useMemo(() => AgeReportFields({ itemList: allItemsList }), [allItemsList]); 

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
  } = useAgeReport({
    FROMAGE: formData.FROMAGE ? Number(formData.FROMAGE) : undefined,
    TOAGE: formData.TOAGE ? Number(formData.TOAGE) : undefined,
    ITEMID: formData.ITEMID ? Number(formData.ITEMID) : undefined,
  });

  console.log(data,'ageReportData');


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
      
      if (!Array.isArray(rows))  return [];
      return rows.map((row)=>({
        ...row,
        TAGDATE : formatDateForShow(row.TAGDATE),
     
      }))
    }, [data ,fetchEnabled]);

    console.log(tableData,'tableData');

    /* -------------------- EXPORT -------------------- */
  const handleExport = (option: string) => {
    setData(tableData || []);

    const columns: PrintColumn[] = [
      {
        key: "ITEMNAME",
        label: "Item Name",
        align: "start",
      },
      {
        key: "TAGNO",
        label: "Tag Number",
        align: "start",
      },
      {
        key: "TAGDATE",
        label: "Tag Date",
        align: "start",

      },
      {
        key: "AGE",
        label: "Age",
        align: "end",
        isNumeric: true,
        allowTotal: false,
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
                gap={2}
                border="1px solid"
                borderColor={theme.colors.greyColor}
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
                    title="Tag Age Statement"
                    data={tableData}
                    columnDefs={stockColumns}
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

export default AgeReport;