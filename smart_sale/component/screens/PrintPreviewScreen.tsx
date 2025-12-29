"use client";

import { useEffect, useState } from "react";
import {
    Box,
    Flex,
    Heading,
    Button,
    Stack,
    Input,
    Text,
    Portal,
    Select,
    Checkbox,
    createListCollection,
} from "@chakra-ui/react";
import { PrintPreviewTable } from "@/component/printing/PrintPreviewTable";
import { useTheme } from "@/context/theme/themeContext";
import { useRouter } from "next/navigation";
import { exportToStyledExcel } from "@/utils/export/exportToExcel";


type PrintPreviewScreenProps = {
    data: any[];
    columns: {  key: string; 
                label: string, 
                allowTotal?: boolean,
                align?:"end"| "start" | "center" | undefined, 
                isNumeric?:boolean }[];
                exportOption?: string|null;
};

export function PrintPreviewScreen({ data, columns ,exportOption}: PrintPreviewScreenProps) {

  

    const [settings, setSettings] = useState({
        fontSize: "md" as "sm" | "md" | "lg",
        headerBg: "#e5e7eb",
        headerColor:'#222',
        title: "Print Preview",
        showTotals: false,
        totalColumns: [] as string[],
        isNumeric:false
    });

    const router = useRouter();
 

    useEffect(()=>{
        const items = Array.isArray(data) ? data : [];
        (items.length > 0) ? null : router.back();
    } ,[data])

    const fontSizes = createListCollection({
        items: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
        ],
    });

    /* Theme Context */
    const { theme } = useTheme();

    const totalableColumns = columns.filter(col => col.allowTotal);

    const columnAlignCSS = columns
        .map((col, index) => {
            const align =
                col.align ??
                (col.isNumeric ? "right" : "left");

            return `
      th:nth-child(${index + 1}),
      td:nth-child(${index + 1}) {
        text-align: ${align};
      }
    `;
        })
        .join("\n");
        

    const handlePrint = () => {
        const tableContainer = document.getElementById("print-table");
        if (!tableContainer) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const fontSizeMap = { sm: "12px", md: "14px", lg: "16px" };
        const fontSize = fontSizeMap[settings.fontSize] || "14px";

        // Calculate totals only for selected columns
        const totals: Record<string, number> = {};
        settings.totalColumns.forEach((key) => {
            totals[key] = data.reduce((sum, row) => sum + Number(row[key] || 0), 0);
        });

        // Wrap the table content in a div and append totals row at the end
        const tableHTML = tableContainer.innerHTML;
      

        printWindow.document.write(`
<html>
<head>
  <title>Print Table</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: ${fontSize};
      margin: 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      font-size: ${fontSize};
    }

    th, td {
      border: 1px solid #ccc;
      padding: 6px;
      font-size: ${fontSize};
    }

    th {
      background-color: ${settings.headerBg};
      color: ${settings.headerColor};
      font-weight: bold;
    }

    /* ✅ COLUMN ALIGNMENT FROM CONFIG */
    ${columnAlignCSS}

    /* TOTAL ROW */
    tfoot td {
      font-weight: bold;
    }

    @media print {
      thead { display: table-header-group; }
      tfoot { display: table-row-group; }
    }
  </style>
</head>
<body>
  <table>
    ${tableHTML}
  </table>
</body>
</html>
`);


        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };



    return (
        <Flex h="100vh" bg="gray.50" color="black.700">
            {/* LEFT PANEL */}
            <Box
                w="320px"
                bg="white"
                p={5}
                borderRight="1px solid"
                borderColor="gray.200"
                overflowY="auto"
            >   
                <Heading size="sm" mb={6} color="gray.800" alignItems='center'>
                    <Text> Print Settings </Text>
                </Heading>

                <Stack  color="gray.700">

                    {/* FONT SETTINGS */}
                    <Box
                        p={4}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        bg="gray.50"
                    >
                        <Text fontSize="sm" fontWeight="semibold" mb={3}>
                            Typography
                        </Text>

                        <Box>
                            <Text fontSize="xs" mb={1} color="gray.600">
                                Font Size
                            </Text>
                            <Select.Root
                                collection={fontSizes}
                                value={[settings.fontSize]}
                                onValueChange={(val) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        fontSize: val.value[0] as "sm" | "md" | "lg",
                                    }))
                                }
                                size="sm"
                            >
                                <Select.Trigger>
                                    <Select.ValueText placeholder="Select font size" />
                                </Select.Trigger>
                                <Portal>
                                    <Select.Positioner>
                                        <Select.Content>
                                            {fontSizes.items.map((item) => (
                                                <Select.Item item={item} key={item.value}>
                                                    {item.label}
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                            ))}
                                        </Select.Content>
                                    </Select.Positioner>
                                </Portal>
                            </Select.Root>
                        </Box>
                    </Box>

                    {/* HEADER COLORS */}
                    <Box
                        p={4}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        bg="gray.50"
                    >
                        <Text fontSize="sm" fontWeight="semibold" mb={3}>
                            Table Header Style
                        </Text>

                        <Stack>
                            <Box>
                                <Text fontSize="xs" mb={1} color="gray.600">
                                    Background Color
                                </Text>
                                <Input
                                    type="color"
                                    value={settings.headerBg}
                                    onChange={(e) =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            headerBg: e.target.value,
                                        }))
                                    }
                                />
                            </Box>

                            <Box>
                                <Text fontSize="xs" mb={1} color="gray.600">
                                    Text Color
                                </Text>
                                <Input
                                    type="color"
                                    value={settings.headerColor}
                                    onChange={(e) =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            headerColor: e.target.value,
                                        }))
                                    }
                                />
                            </Box>
                        </Stack>
                    </Box>

                    {/* TOTALS */}
                    <Box>
                        <Checkbox.Root
                            checked={settings.showTotals}
                            onCheckedChange={(val) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    showTotals: !!val,
                                    totalColumns: !!val ? prev.totalColumns : [],
                                }))
                            }
                            
                        >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>Show Totals</Checkbox.Label>
                        </Checkbox.Root>

                        {settings.showTotals && (
                            <Stack mt={2} pl={4} >
                                {totalableColumns.map((col) => (
                                    <Checkbox.Root
                                        key={col.key}
                                        checked={settings.totalColumns.includes(col.key)}
                                        onCheckedChange={(val) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                totalColumns: val
                                                    ? [...prev.totalColumns, col.key]
                                                    : prev.totalColumns.filter((c) => c !== col.key),
                                            }))
                                        }
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label>{col.label}</Checkbox.Label>
                                    </Checkbox.Root>
                                ))}
                            </Stack>
                        )}
                    </Box>

                </Stack>
            </Box>


            {/* RIGHT PANEL */}
            <Flex flex={1} direction="column">
                <Box flex={1} p={6} overflow="auto" id="print-table">
                    <PrintPreviewTable
                        data={data}
                        columns={columns}
                        customization={settings}
                    />
                </Box>

                {/* FOOTER */}
                <Flex
                    p={4}
                    bg="white"
                    borderTop="1px solid"
                    borderColor="gray.200"
                    justify="flex-end"
                    gap={3}
                >
                    <Button variant="outline" onClick={() => window.history.back()}>
                        Cancel
                    </Button>

                    {exportOption === "excel" ? (
                        <Button
                            colorScheme="green"
                            onClick={() =>
                                exportToStyledExcel(
                                    data,
                                    columns,
                                    settings,
                                    settings.title || "Report"
                                )
                            }
                        >
                            Export Excel
                        </Button>
                    ) : (
                        <Button colorScheme="blue" onClick={handlePrint}>
                            Print
                        </Button>
                    )}
                </Flex>

            </Flex>
        </Flex>
    );
}
