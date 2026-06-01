"use client";

import { useEffect, useState, useRef, useCallback ,useMemo} from "react";
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
    CloseButton,
    Drawer,
    useBreakpointValue,
    Badge,
    Separator,
    Icon,
    ScrollArea,
} from "@chakra-ui/react";

import { PrintPreviewTable } from "@/component/printing/PrintPreviewTable";
import { useTheme } from "@/context/theme/themeContext";
import { useRouter } from "next/navigation";
import { exportToStyledExcel } from "@/utils/export/exportToExcel";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

// Updated PrintColumn type with subColumns support
export type PrintColumn = {
    key: string;
    label: string;
    allowTotal?: boolean;
    decimalScale?: number; // Add this
    align?: "end" | "start" | "center";
    isNumeric?: boolean;
    renderCell?: (value: any, row: any) => React.ReactNode;
    printValue?: (value: any, row: any) => string | number;
    subColumns?: PrintSubColumn[]; // Add subColumns support
    setRowStyleGetter? : () => void,
    hide? :boolean
};

export type PrintSubColumn = {
    key: string;
    label: string;
    allowTotal?: boolean;
    decimalScale?: number; // Add this
    align?: "end" | "start" | "center";
    isNumeric?: boolean;
    renderCell?: (value: any, row: any) => React.ReactNode;
    printValue?: (value: any, row: any) => string | number;
};

type PrintPreviewScreenProps = {
    data: any[];
    columns: PrintColumn[];
    exportOption?: string | null;
    showSno?: boolean;
    title?: string;
    rowStyleGetter?: (row: any) => React.CSSProperties;
};


// ─────────────────────────────────────────────────────────────
// Settings type
// ─────────────────────────────────────────────────────────────

type Settings = {
    fontSize: "xs" | "sm" | "md" | "lg";
    headerBg: string;
    headerColor: string;
    rowStriped: boolean;
    title: string | undefined;
    showTotals: boolean;
    totalColumns: string[];
    visibleColumns: string[];
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function PrintPreviewScreen({
    data,
    columns,
    exportOption,
    showSno,
    title,
    rowStyleGetter
}: PrintPreviewScreenProps) {
    const printRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();
    const { theme } = useTheme();

    const layout = useBreakpointValue({
        base: "mobile",
        md: "tablet",
        lg: "desktop",
    });

    const [openDrawer, setOpenDrawer] = useState(false);

    // Initialize visible columns to show all columns
    const [settings, setSettings] = useState<Settings>({
        fontSize: "sm",
        headerBg: "#FFF",
        headerColor: "#222",
        rowStriped: true,
        title,
        showTotals: false,
        totalColumns: [],
        visibleColumns: columns.map(col => col.key),
    });

    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) router.back();
    }, [data]);

    const fontSizes = createListCollection({
        items: [
            { label: "Small (10 px)", value: "10px" },
            { label: "Medium (12 px)", value: "12px" },
            { label: "Large (14 px)", value: "14px" },
        ],
    });

    // Get all totalable columns including sub-columns
    const totalableColumns = useMemo(() => {
        const getAllTotalable = (cols: PrintColumn[]): PrintColumn[] => {
            const totalable: PrintColumn[] = [];
            cols.forEach(col => {
                if (col.subColumns && col.subColumns.length > 0) {
                    totalable.push(...col.subColumns.filter(sub => sub.allowTotal));
                } else if (col.allowTotal) {
                    totalable.push(col);
                }
            });
            return totalable;
        };
        return getAllTotalable(columns);
    }, [columns]);

    console.log(settings.totalColumns,'totalableColumns');

    console.log(totalableColumns,'totalableColumns')
    // Get visible columns based on settings
    const visibleColumns = columns.filter(col => settings.visibleColumns.includes(col.key));

    console.log(visibleColumns,'visibleColumns')



    // Handle column toggle
    const toggleColumn = (columnKey: string) => {
        setSettings(prev => ({
            ...prev,
            visibleColumns: prev.visibleColumns.includes(columnKey)
                ? prev.visibleColumns.filter(key => key !== columnKey)
                : [...prev.visibleColumns, columnKey]
        }));
    };

    // Handle select all columns
    const selectAllColumns = () => {
        setSettings(prev => ({
            ...prev,
            visibleColumns: columns.map(col => col.key)
        }));
    };

    const selectAllTotal = () =>{
        setSettings(prev => ({
            ...prev,
            totalColumns: totalableColumns.map(col => col.key),
        }))
    }

    // Handle deselect all columns
    const deselectAllColumns = () => {
        setSettings(prev => ({
            ...prev,
            visibleColumns: []
        }));
    };


    // Helper function to check if there are any grouped columns
    const hasGroups = (columns: PrintColumn[]): boolean => {
        return columns.some(col => col.subColumns && col.subColumns.length > 0);
    };

    // Helper function to get all leaf columns (flatten nested structure)
    const getLeafColumns = (columns: PrintColumn[]): PrintColumn[] => {
        const leaves: PrintColumn[] = [];
        columns.forEach(col => {
            if (col.subColumns && col.subColumns.length > 0) {
                leaves.push(...col.subColumns);
            } else {
                leaves.push(col);
            }
        });
        return leaves;
    };

    // Generate nested headers structure
    const getNestedHeaders = (columns: PrintColumn[]) => {
        if (!hasGroups(columns)) {
            return [columns.map((c) => c.label)];
        }

        const topRow: (string | { label: string; colspan: number })[] = [];
        const subRow: string[] = [];

        for (const col of columns) {
            const visibleSubs = col.subColumns ?? [];

            if (visibleSubs.length > 0) {
                topRow.push({
                    label: col.label,
                    colspan: visibleSubs.length,
                });

                // push sub headers
                for (const sub of visibleSubs) {
                    subRow.push(sub.label ?? "");
                }
            } else {
                topRow.push({
                    label: col.label,
                    colspan: 1,
                });

                // no sub columns → empty cell
                subRow.push("");
            }
        }

        return [topRow, subRow];
    };
    // ── Resolved print data (plain values only) ──────────────
    const resolvedPrintData = useCallback(
        () => {
            // Get all leaf columns (including sub-columns)
            const leafCols = getLeafColumns(visibleColumns);

            return data.map((row) => {
                const resolved: Record<string, any> = {};
                leafCols.forEach((col) => {
                    // Use the leaf column's printValue or direct value
                    resolved[col.key] = col.printValue
                        ? col.printValue(row[col.key], row)
                        : row[col.key];
                });
                return resolved;
            });
        },
        [data, visibleColumns]
    );

 

    // ─────────────────────────────────────────────────────────
    // Print handler
    // ─────────────────────────────────────────────────────────
    const handlePrint = () => {
        const tableContainer = printRef.current;
        if (!tableContainer) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        // Fix: Larger font sizes for better readability
        const fontSizeMap = { xs: "10px", sm: "12px", md: "14px", lg: "16px" };
        const fontSize = fontSizeMap[settings.fontSize] || "12px";
        const stripedRule = settings.rowStriped
            ? "tbody tr:nth-child(even) { background: #f8fafc; }"
            : "";

        // Adjust scale for better fit
        const scaleMap = { xs: "0.9", sm: "0.95", md: "1", lg: "1" };
        const scale = scaleMap[settings.fontSize] || "1";

        // Get visible columns with nested structure
        const visibleColumns = columns.filter(col => settings.visibleColumns.includes(col.key));
        const hasGroupedColumns = visibleColumns.some(col => col.subColumns && col.subColumns.length > 0);
        const leafColumns = getLeafColumns(visibleColumns);

        // Generate CSS for nested headers
        let nestedHeaderCSS = "";
        if (hasGroupedColumns) {
            nestedHeaderCSS = `
            thead tr:first-child th[colspan] {
                text-align: center;
                vertical-align: middle;
                font-size: ${fontSize};
                font-weight: bold;
            }
            thead tr:last-child th {
                text-align: center;
                vertical-align: middle;
                font-size: ${fontSize};
            }
            th[colspan] {
                border-bottom: 1px solid #e2e8f0;
            }
        `;
        }

        // Column alignment CSS for leaf columns
        const columnAlignCSS = leafColumns
            .map((col, index) => {
                const align = col.align ?? (col.isNumeric ? "right" : "left");
                const nth = showSno ? index + 2 : index + 1;
                const alignMap = {
                    left: "left",
                    right: "right",
                    center: "center",
                    start: "left",
                    end: "right"
                };
                const cssAlign = alignMap[align as keyof typeof alignMap] || "left";
                return `
                td:nth-child(${nth}) { text-align: ${cssAlign}; }
                ${hasGroupedColumns ? 'thead tr:last-child th:nth-child(' + nth + ')' : 'th:nth-child(' + nth + ')'} { 
                    text-align: ${cssAlign}; 
                }
            `;
            })
            .join("\n");

        const snoColumnCSS = showSno ? `
        td:first-child, th:first-child {
            text-align: center;
            width: 30px;
        }
    ` : "";

        // Fix: Calculate totals for sub-columns
        const calculateTotals = () => {
            if (!settings.showTotals || settings.totalColumns.length === 0) return null;

            const totals: Record<string, number> = {};
            leafColumns.forEach(col => {
                if (settings.totalColumns.includes(col.key) && col.allowTotal) {
                    totals[col.key] = data.reduce((sum, row) => {
                        const value = parseFloat(row[col.key]) || 0;
                        return sum + value;
                    }, 0);
                }
            });
            return totals;
        };

        const totals = calculateTotals();
        const hasTotals = totals && Object.keys(totals).length > 0;

        printWindow.document.write(`
    <html>
    <head>
        <title>${settings.title || 'Report'} - Print</title>
        <style>
            * { 
                box-sizing: border-box; 
                margin: 0; 
                padding: 0; 
            }
            
           body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    font-size: ${parseInt(fontSize) - 2}px;
                    margin: 2mm;
                    color: #222;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
            }
            
            .print-container {
                width: 100%;
            }
            
            .report-title {
                margin-bottom: 15px;
                text-align: center;
            }
            
            .report-title h2 {
                font-size: ${parseInt(fontSize) + 3}px;
                margin-bottom: 5px;
                color: #0f172a;
                font-weight: 700;
            }
            
            .report-title p {
                font-size: ${fontSize};
                color: #64748b;
            }
            
            table {
                border-collapse: collapse;
                width: 100%;
                font-size: ${fontSize};
                margin-top: 10px;
            }
            
            th, td {
                border: 1px solid #cbd5e1;
                padding: 2px;
                vertical-align: middle;
                 white-space: nowrap;
            }
            
            th {
                background: ${settings.headerBg};
                color: ${settings.headerColor};
                font-weight: 600;
                font-size: ${fontSize};
                text-transform: uppercase;
                white-space: nowrap;
                padding: 2px 4px;
            }
            
            thead tr:first-child th {
                background: ${settings.headerBg};
                color: ${settings.headerColor};
                font-weight: 700;
                font-size: ${parseInt(fontSize)}px;
            }
            
            thead tr:last-child th {
                background: ${settings.headerBg};
                color: ${settings.headerColor};
                font-weight: 600;
                border-top: none;
            }
            
            tbody tr:hover {
                background: #f8fafc;
            }
            
            tfoot td {
                font-weight: 700;
                background: #f1f5f9;
                border-top: 2px solid #94a3b8;
                padding: 8px 10px;
            }
            
            ${stripedRule}
            ${columnAlignCSS}
            ${snoColumnCSS}
            ${nestedHeaderCSS}
            
            @page { 
                size: portrait;
                margin: 8mm;
            }
            
            tr { 
                page-break-inside: avoid; 
                page-break-after: avoid;
            }
            
            thead {
                display: table-header-group;
            }
            
            tfoot {
                display: table-footer-group;
            }
            
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                }
                
                .print-container {
                    transform: none;
                    width: 100%;
                }
                
                th, td {
                    padding: 2px;
                }
                
                th {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
    
        </style>
    </head>
    <body>
        <div class="print-container">
            ${settings.title ? `
            <div class="report-title">
                <h2>${settings.title}</h2>
            </div>
            ` : ''}
            ${tableContainer.outerHTML}
        </div>
    </body>
    </html>`);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // ─────────────────────────────────────────────────────────
    // Settings panel (shared between sidebar + drawer)
    // ─────────────────────────────────────────────────────────
    const SettingsPanel = () => (
        <Stack gap={0} >
            {/* Header */}
            <Box p={2} borderBottom="1px solid" borderColor="gray.100">
                <Heading size="sm" color="gray.800" letterSpacing="tight">
                    Print Settings
                </Heading>
                <Text fontSize="xs" color="gray.500" mt={0.5}>
                    {data.length} row{data.length !== 1 ? "s" : ""} •{" "}
                    {columns.length} column{columns.length !== 1 ? "s" : ""} •
                    {settings.visibleColumns.length} selected
                </Text>
            </Box>

            {/* Scrollable body */}
            <Stack gap={2} p={2} flex={1} overflowY="auto">

                {/* Column Selection Section */}
                <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="xs" fontWeight="600" color="gray.600">
                            Select Columns ({settings.visibleColumns.length}/{columns.length})
                        </Text>
                        <Flex gap={2}>
                            <Button
                                size="2xs"
                                variant="ghost"
                                onClick={selectAllColumns}
                                colorPalette="blue"
                            >
                                Select All
                            </Button>
                            {/* <Button
                                size="xs"
                                variant="ghost"
                                onClick={deselectAllColumns}
                                colorScheme="gray"
                            >
                                Clear All
                            </Button> */}
                        </Flex>
                    </Flex>

                    <Box
                        maxH="200px"
                        overflowY="auto"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        p={2}
                    >
                        <Stack gap={2}>
                            {columns.map((column) => (
                                <Checkbox.Root
                                    key={column.key}
                                    checked={settings.visibleColumns.includes(column.key)}
                                    onCheckedChange={() => toggleColumn(column.key)}
                                    size={'sm'}
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                    <Checkbox.Label>
                                        <Text fontSize="xs" color="gray.700">
                                            {column.label}
                                        </Text>
                                    </Checkbox.Label>
                                </Checkbox.Root>
                            ))}
                        </Stack>
                    </Box>
                </Box>

                <Separator />

                {/* Report title */}
                <Box>
                    <Text fontSize="xs" fontWeight="600" color="gray.600" mb={1.5}>
                        Report Title
                    </Text>
                    <Input
                        value={settings.title ?? ""}
                        onChange={(e) =>
                            setSettings((p) => ({ ...p, title: e.target.value }))
                        }
                        size="sm"
                        placeholder="Enter report title…"
                        borderColor="gray.200"
                        _focus={{ borderColor: "blue.400", boxShadow: "none" }}
                    />
                </Box>

                <Separator />

                {/* Font size */}
                <Box>
                    <Text fontSize="xs" fontWeight="600" color="gray.600" mb={1.5}>
                        Font Size
                    </Text>
                    <Select.Root
                        collection={fontSizes}
                        value={[settings.fontSize]}
                        onValueChange={(val) =>
                            setSettings((p) => ({
                                ...p,
                                fontSize: val.value[0] as "sm" | "md" | "lg",
                            }))
                        }
                        size="sm"
                    >
                        <Select.Trigger borderColor="gray.200">
                            <Select.ValueText placeholder="Font Size" />
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

                {/* Header colours */}
                <Box>
                    <Text fontSize="xs" fontWeight="600" color="gray.600" mb={2}>
                        Header Style
                    </Text>
                    <Flex gap={3}>
                        <Box flex={1}>
                            <Text fontSize="xs" color="gray.500" mb={1}>Background</Text>
                            <Input
                                type="color"
                                value={settings.headerBg}
                                onChange={(e) =>
                                    setSettings((p) => ({ ...p, headerBg: e.target.value }))
                                }
                                h="36px"
                                p={1}
                                borderColor="gray.200"
                                cursor="pointer"
                            />
                        </Box>
                        <Box flex={1}>
                            <Text fontSize="xs" color="gray.500" mb={1}>Text Color</Text>
                            <Input
                                type="color"
                                value={settings.headerColor}
                                onChange={(e) =>
                                    setSettings((p) => ({ ...p, headerColor: e.target.value }))
                                }
                                h="36px"
                                p={1}
                                borderColor="gray.200"
                                cursor="pointer"
                            />
                        </Box>
                    </Flex>
                </Box>



                {/* Striped rows */}
                <Checkbox.Root
                    checked={settings.rowStriped}
                    onCheckedChange={(v) =>
                        setSettings((p) => ({ ...p, rowStriped: !!v.checked }))
                    }
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>
                        <Text fontSize="sm">Striped Rows</Text>
                    </Checkbox.Label>
                </Checkbox.Root>

                <Separator />

                {/* Totals */}
                
                {totalableColumns.length > 0 && (
                    <>  
                    <Flex justifyContent={'space-between'}>
                            <Checkbox.Root
                                checked={settings.showTotals}
                                onCheckedChange={(v) =>
                                    setSettings((p) => ({
                                        ...p,
                                        showTotals: !!v.checked,
                                        totalColumns: !!v.checked ? p.totalColumns : [],
                                    }))
                                }
                            >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label>
                                    <Text fontSize="sm">Show Column Totals</Text>
                                </Checkbox.Label>
                            </Checkbox.Root>
                            <Flex gap={2}>
                                <Button
                                    size="2xs"
                                    variant="ghost"
                                    onClick={selectAllTotal}
                                    colorPalette="blue"
                                >
                                    Select All
                                </Button>
                                {/* <Button
                                size="xs"
                                variant="ghost"
                                onClick={deselectAllColumns}
                                colorScheme="gray"
                            >
                                Clear All
                            </Button> */}
                            </Flex>

                    </Flex>
                      

                        {settings.showTotals && (

                            <Box
                                maxH="150px"
                                overflowY="auto"
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                p={2}
                            >
                            <Stack gap={2}>
                                {totalableColumns
                                    // .filter(col => settings.visibleColumns.includes(col.key))
                                    .map((col) => (
                                        <Checkbox.Root
                                            key={col.key}
                                            checked={settings.totalColumns.includes(col.key)}
                                            onCheckedChange={(v) =>
                                                setSettings((p) => ({
                                                    ...p,
                                                    totalColumns: v.checked
                                                        ? [...p.totalColumns, col.key]
                                                        : p.totalColumns.filter((c) => c !== col.key),
                                                }))
                                            }
                                        >
                                            <Checkbox.HiddenInput />
                                            <Checkbox.Control />
                                            <Checkbox.Label>
                                                <Text fontSize="sm" color="gray.600">{col.label}</Text>
                                            </Checkbox.Label>
                                        </Checkbox.Root>
                                    ))}
                            </Stack>
                            </Box>
                        )}
                       
                    </>
                )}
             
            </Stack>

            {/* Footer actions */}
            <Box px={5} py={4} borderTop="1px solid" borderColor="gray.100">
                <Flex gap={2}>
                    <Button
                        variant="ghost"
                        size="sm"
                        flex={1}
                        color="gray.600"
                        onClick={() => router.back()}
                    >
                        Exit
                    </Button>

                    {exportOption === "excel" ? (
                        <Button
                            size="sm"
                            flex={2}
                            colorPalette="green"
                            onClick={() =>
                                exportToStyledExcel(
                                    resolvedPrintData(),
                                    visibleColumns,
                                    settings,
                                    settings.title ?? "Report",
                                    rowStyleGetter
                                )
                            }
                        >
                            Export Excel
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            flex={2}
                            colorPalette="blue"
                            onClick={handlePrint}
                        >
                            Print
                        </Button>
                    )}
                </Flex>
            </Box>
        </Stack>
    );

    // ─────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────
    return (
        <Flex direction="column" bg="gray.50">
            {/* Mobile / tablet top bar */}
            {layout !== "desktop" && (
                <Flex
                    p={1}
                    bg="white"
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    align="center"
                    justify="space-between"
                    shadow="xs"
                >
                    <Box>
                        <Text fontWeight="700" fontSize="sm" color="gray.800">
                            {settings.title ?? "Print Preview"}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                            {data.length} records • {settings.visibleColumns.length} columns selected
                        </Text>
                    </Box>
                    <Button size="sm" variant="outline" onClick={() => setOpenDrawer(true)}>
                        Settings
                    </Button>
                </Flex>
            )}

            <Flex flex={1} overflow="hidden">
                {/* Desktop sidebar */}
                {layout === "desktop" && (
                    <Flex
                        direction="column"
                        w="320px"
                        minW="320px"
                        bg="white"
                        borderRight="1px solid"
                        borderColor="gray.150"
                        shadow="sm"
                    >
                        <SettingsPanel />
                    </Flex>
                )}

                {/* Preview area */}
                <Box flex={1} overflow="auto" p={{ base: 2, md: 3, lg: 4 }}>
                    {/* Preview label */}
                    <Flex align="center" justify="space-between" mb={2}>
                        <Text
                            fontSize="xs"
                            fontWeight="600"
                            color="gray.400"
                            letterSpacing="wider"
                            textTransform="uppercase"
                        >
                            Preview
                        </Text>
                        <Badge 
                            fontSize="xs"
                            fontWeight="700"
                            color="black"
                            letterSpacing="wider"
                            textTransform="uppercase"
                        >
                            {settings.title}
                        </Badge>

                        <Badge
                            colorScheme="blue"
                            variant="subtle"
                            fontSize="xs"
                            px={2}
                        >
                            {data.length} rows • {settings.visibleColumns.length} cols
                        </Badge>
                    </Flex>

                    {/* Table wrapper */}
                    <Box
                        bg="white"
                        borderRadius="xl"
                        shadow="md"
                        border="1px solid"
                        borderColor="gray.200"
                        overflow="auto"
                        minW="fit-content"
                    >
                        <PrintPreviewTable
                            data={data}
                            columns={visibleColumns}
                            customization={settings}
                            showSno={showSno}
                            ref={printRef}
                            rowStyleGetter={rowStyleGetter}
                        />
                    </Box>
                </Box>
            </Flex>

            {/* Mobile drawer */}
            <Drawer.Root open={openDrawer} onOpenChange={(e) => setOpenDrawer(e.open)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content maxW="320px">
                            <Drawer.Body p={0}>
                                <SettingsPanel />
                            </Drawer.Body>
                            <Drawer.CloseTrigger asChild>
                                <CloseButton size="sm" position="absolute" top={3} right={3} />
                            </Drawer.CloseTrigger>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </Flex>
    );
}