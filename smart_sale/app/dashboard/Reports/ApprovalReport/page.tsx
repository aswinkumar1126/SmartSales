"use client";

import { Badge, Box, Button, Flex, HStack ,Icon ,Table ,Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TbRotate, TbTableImport } from "react-icons/tb";
import { FaFileExcel, FaPrint } from "react-icons/fa";

/*------------- COMPONENTS ------------------*/
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { CustomTable, TableColumn } from "@/component/table/CustomTable";


/*------------- HOOKS ------------------*/
import { useAllAccountHead } from "@/hooks/apiHooks/accountHead/useAccountHead";
import { useApprovalSummary } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";

/*------------- CONFIG ------------------*/
import { ApprovalReportFields } from "@/config/report/ApprovalReport";

/*------------- CONTEXT ------------------*/
import { useTheme } from "@/context/theme/themeContext";
import { usePrint } from "@/context/print/usePrintContext";
import { PrintColumn } from "@/component/screens/PrintPreviewScreen";
import { formatDateForShow } from "@/utils/format/formatDateForAPI";
import { formatToFixed } from "@/utils/format/numberFormat";
import { background } from "@chakra-ui/system";


// ─── Column definitions (read-only, no editing) ───────────────────────────────



const approvalColumns: TableColumn[] = [
    {
        key: "ENTRYNO",
        label: "ENTRY NO",
        align: "start"
    },
    {
        key: "ACNAME",
        label: "PARTY NAME",
        align: "start",
    },
    {
        key: "ISS_DATE",
        label: "ISSUE DATE",
        align: "center",
    },
    {
        key: "REC_DATE",
        label: "RECEIVE DATE",
        align: "center",
    },
    {
        key: "PCS",
        label: "PCS",
        align: "end",
    },
    {
        key: "ITEMNAME",
        label: "ITEM NAME",
        align: "start",
    },
   
    {
        key: "GRSWT",
        label: "GROSS WT",
        align: "end",
    },
    {
        key: "STNWT",
        label: "STONE WT",
        align: "end",
    },
    {
        key: "NETWT",
        label: "NET WT",
        align: "end",
    },
    {
        key: "TAGNO",
        label: "TAG NO",
        align: "start",
    }
];
// ─── Constants ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

const initialForm = {
    TYPE : "A"
};


// ─── Component ────────────────────────────────────────────────────────────────

function ApprovalReport() {
    const { theme } = useTheme();
    const { setData, setColumns, title, setRowStyleGetter } = usePrint();
    const router = useRouter();

    const [formData, setFormData] = useState(initialForm);
    const [fetchEnabled, setFetchEnabled] = useState(false);


   const { data: allAccounts } = useAllAccountHead("CR");

 
  const approvalOptions = [
    {label: "ALL" ,value: "A"},
    {label:"PENDING" ,value :"P"},
    {label:"Completed" ,value :"C"},
  ]



    const formFields = useMemo(
        () =>
        ApprovalReportFields({
            appOptionsList: approvalOptions
            }),
        []
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
  } = useApprovalSummary({
    type : formData.TYPE,
    fetchEnabled
  });

    console.log(data ,'approvalreport data');

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
    const tableData = useMemo((): Record<string, any>[] => {
      const rows = fetchEnabled ? data : [];
        if (!Array.isArray(rows)) return [];
        return rows;
    }, [data, fetchEnabled]);

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
          key: "ACNAME",
          label: "Party Name",
          align: "start",
      },
      {
        key: "ISS_DATE",
        label: "Issue Date",
        align: "center",
        renderCell: (value: any) => value ? formatDateForShow(value) : "",
        printValue: (value: any) => value ? formatDateForShow(value) : "",
      },
      {
          key: "REC_DATE",
          label: "Receipt Date",
          align: "center",
          renderCell: (value: any) => value ? formatDateForShow(value) : "",
          printValue: (value: any) => value ? formatDateForShow(value) : "",
      },
      {
        key: "PCS",
        label: "Pcs",
        align: "end",
        isNumeric: true,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 0) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 0) : "",
      }, 
      {
          key: "ITEMNAME",
          label: "item Name",
          align: "start",
      },
      {
        key: "GRSWT",
        label: "Grs Wt",
        align: "end",
        isNumeric: true,
        decimalScale:3,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      {
        key: "STNWT",
        label: "Stn Wt",
        align: "end",
        isNumeric: true,
        decimalScale: 3,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      {
        key: "NETWT",
        label: "Net Wt",
        align: "end",
        isNumeric: true,
        decimalScale: 3,
        renderCell: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
        printValue: (value: any) => value != null ? formatToFixed(Number(value), 3) : "",
      },
      {
          key: "TAGNO",
          label: "Tag No",
          align: "start",
      },
      {
        key : "RM",
        label:"RM",
        hide :true
      }
      
    ];

    setColumns(columns);
    title?.("Approval Report");
    router.push(`/print?export=${option}`);
      setRowStyleGetter(() => (row: any) => {
          switch (row?.RM) {
              case 1:
                  return {
                      background: "#FF0000",
                      color: "#FFFFFF",
                      fontWeight: "600",
                  };

              case 3:
                  return {
                      background: "#008000",
                      color: "#FFFFFF",
                      fontWeight: "700",
                  };

              case 2:
                  return {
                      background: "#F0FDF4",
                      color: "#166534",
                      fontWeight: "500",
                  };

              default:
                  return {};
          }
      });
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
        {fetchEnabled && 
          <Box >
    
            <Flex  bg={theme.colors.formColor} p={2} mt={3} rounded={'md'} justifyContent={'sapce-between'} alignItems={'center'}>
                <Box>
                    <Badge p={2} variant={'subtle'} fontSize={'sm'}>
                        Approval Statements
                    </Badge>
                </Box>
               
                <Box >
                    <Button variant="ghost" size="xs" color={theme.colors.green} onClick={() => handleExport("excel")}>
                        <FaFileExcel />
                    </Button>
                    <Button variant="ghost" size="xs" color={theme.colors.primaryText} onClick={() => handleExport("pdf")}>
                        <FaPrint />
                    </Button>
                </Box>
              
            </Flex>

            {/* ═══════════════ TABLE ═══════════════ */}
            <Box mt={3}>
                <CustomTable
                    columns={approvalColumns}
                    data={fetchEnabled ? tableData : []}
                    emptyText={emptyText}
                    bodyBg="#EEE"
                    borderColor="#DDD"
                    headerColor="#FFF"
                    headerBg={theme.colors.accient}
                    pagination={{
                        enabled: true,
                        pageSize: 10,
                        showPageSizeSelector: true,
                        showPageNumbers: true,
                        showTotalCount: true,
                        pageSizeOptions: [
                            { label: "5", value: "5" },
                            { label: "10", value: "10" },
                            { label: "25", value: "25" },
                            { label: "50", value: "50" },
                            { label: "100", value: "100" },
                        ],
                        onPageChange: (page, pageSize) => {
                            // Optional: Handle page change events
                            console.log(`Page changed to ${page} with size ${pageSize}`);
                        },
                        color : '#FFF'
                    }}

                    renderRow={(row, index, isSelected) => {

                        console.log(row ,'rowin rendering')

                        const rm = row.RM as number;

                        // Define styles based on RM
                        const getRowStyles = () => {
                            switch (rm) {
                                case 1: // Sub-total
                                    return {
                                        background: "red",
                                        color: "#FFF",
                                        fontWeight: "600",
                                        fontSize :'13px',

                                    };
                                case 3: // Grand total
                                    return {
                                        background: "green",
                                        color: "#FFF",
                                        fontWeight: "700",
                                        fontSize: '14px'
                                    };
                                case 2: // Maybe subtotal category 2
                                    return {
                                        background: "#f0fdf4",
                                        color: "#166534",
                                        fontWeight: "500",
                                    };
                                default:
                                    return {
                                        bg: "transparent",
                                        color: "inherit",
                                        fontWeight: "normal",
                                    };
                            }
                        };

                        const rowStyle = getRowStyles();

                        return (
                            <>
                                <Table.Cell
                                    style={{
                                        ...rowStyle,
                                        fontSize: rm === 3 ? "16px" : "12px",
                                        textAlign: "start",
                                    }}
                                >
                                    {row.ENTRYNO}
                                </Table.Cell>
                                <Table.Cell style={{ ...rowStyle, textAlign: "center" }}>
                                    {row.ACNAME}
                                </Table.Cell>
                                <Table.Cell style={{ ...rowStyle, textAlign: "start" }}>
                                    {formatDateForShow(row.ISS_DATE)}
                                </Table.Cell>
                                <Table.Cell style={{ ...rowStyle, textAlign: "start" }}>
                                    {formatDateForShow(row.REC_DATE)}
                                </Table.Cell>
                                <Table.Cell style={{ ...rowStyle, textAlign: "end" }}>
                                    {row.PCS}
                                </Table.Cell>
                                <Table.Cell style={{ ...rowStyle, textAlign: "start" }}>
                                    {row.ITEMNAME}
                                </Table.Cell>
                                <Table.Cell style={{ ...rowStyle, textAlign: "end" }}>
                                    {formatToFixed(row.GRSWT, 3)}
                                </Table.Cell>
                                <Table.Cell style={{ ...rowStyle, textAlign: "end" }}>
                                    {formatToFixed(row.STNWT, 3)}
                                </Table.Cell>
                                <Table.Cell style={{ ...rowStyle, textAlign: "end" }}>
                                    {formatToFixed(row.NETWT, 3)}
                                </Table.Cell>
                                <Table.Cell style={{ ...rowStyle, textAlign: "start" }}>
                                    {row.TAGNO}
                                </Table.Cell>
                              
                            </>
                        );
                    }}
                />
            </Box>
        
          </Box>
        }
        </Box>
    );
}

export default ApprovalReport;