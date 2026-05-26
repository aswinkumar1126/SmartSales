"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

export type PrintColumn = {
    key: string;
    label: string;
    allowTotal?: boolean;
    align?: "end" | "start" | "center";
    isNumeric?: boolean;
    /**
     * Custom renderer shown in the live preview table.
     * Return JSX for badges, icons, formatted values, etc.
     */
    renderCell?: (value: any, row: any) => React.ReactNode;
    /**
     * Extracts a plain string/number for print & Excel export.
     * Falls back to `row[key]` if omitted.
     */
    printValue?: (value: any, row: any) => string | number;
};

type PrintPreviewScreenProps = {
    data: any[];
    columns: PrintColumn[];
    exportOption?: string | null;
    showSno?: boolean;
    title?: string;
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
        headerBg: "#1e293b",
        headerColor: "#f8fafc",
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

    const totalableColumns = columns.filter((c) => c.allowTotal);

    // Get visible columns based on settings
    const visibleColumns = columns.filter(col => settings.visibleColumns.includes(col.key));

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

    // Handle deselect all columns
    const deselectAllColumns = () => {
        setSettings(prev => ({
            ...prev,
            visibleColumns: []
        }));
    };

    // ── Resolved print data (plain values only) ──────────────
    const resolvedPrintData = useCallback(
        () =>
            data.map((row) => {
                const resolved: Record<string, any> = {};
                visibleColumns.forEach((col) => {
                    resolved[col.key] = col.printValue
                        ? col.printValue(row[col.key], row)
                        : row[col.key];
                });
                return resolved;
            }),
        [data, visibleColumns]
    );

    // ── Column-align CSS for print window ────────────────────
    const columnAlignCSS = visibleColumns
        .map((col, index) => {
            const align = col.align ?? (col.isNumeric ? "right" : "left");
            const nth = showSno ? index + 2 : index + 1;
            return `th:nth-child(${nth}), td:nth-child(${nth}) { text-align:${align}; }`;
        })
        .join("\n");

    // ─────────────────────────────────────────────────────────
    // Print handler
    // ─────────────────────────────────────────────────────────
    const handlePrint = () => {
        const tableContainer = printRef.current;
        if (!tableContainer) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const fontSizeMap = { xs: "8px", sm: "10px", md: "12px", lg: "14px" };
        const fontSize = fontSizeMap[settings.fontSize] || "10px";
        const stripedRule = settings.rowStriped
            ? "tbody tr:nth-child(even) { background: #f8fafc; }"
            : "";

        // Add scale factor based on fontSize
        const scaleMap = { xs: "0.85", sm: "0.95", md: "1", lg: "1.15" };
        const scale = scaleMap[settings.fontSize] || "1";

        printWindow.document.write(`
    <html>
    <head>
        <title>${settings.title} </title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: ${fontSize};
                margin: 5mm;
                color: #2222;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .printer-title {
                fontS-size : 12px;
                color: #222;
            }
            
            .print-container {
                transform: scale(${scale});
                transform-origin: top left;
                width: ${100 / parseFloat(scale)}%;
            }
            h2 {
                margin-bottom: 12px;
                font-size:${fontSize};
                letter-spacing: 0.02em;
                color: #0f172a;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                font-size: ${fontSize};
            }
            th, td {
                border: 1px solid #e2e8f0;
                padding: 7px 10px;
            }
            th {
                background: ${settings.headerBg};
                color: ${settings.headerColor};
                font-weight: 600;
                letter-spacing: 0.03em;
                font-size:${fontSize};
                text-transform: uppercase;
            }
            tfoot td {
                font-weight: 700;
                background: #f1f5f9;
                border-top: 2px solid #cbd5e1;
            }
            ${stripedRule}
            ${columnAlignCSS}
            @page { size: auto; margin: 10mm; }
            tr { page-break-inside: avoid; }
        </style>
    </head>
    <body>
     
        <div class="print-container">
            ${tableContainer.outerHTML}
        </div>
    </body>
    </html>`);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
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
                                size="xs"
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

                        {settings.showTotals && (
                            <Stack pl={4} gap={2}>
                                {totalableColumns
                                    .filter(col => settings.visibleColumns.includes(col.key))
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
                            colorScheme="green"
                            onClick={() =>
                                exportToStyledExcel(
                                    resolvedPrintData(),
                                    visibleColumns,
                                    settings,
                                    settings.title ?? "Report"
                                )
                            }
                        >
                            Export Excel
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            flex={2}
                            colorScheme="blue"
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