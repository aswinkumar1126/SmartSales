"use client";

import { useEffect, useState ,useRef} from "react";
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
} from "@chakra-ui/react";

import { PrintPreviewTable } from "@/component/printing/PrintPreviewTable";
import { useTheme } from "@/context/theme/themeContext";
import { useRouter } from "next/navigation";
import { exportToStyledExcel } from "@/utils/export/exportToExcel";

type PrintPreviewScreenProps = {
    data: any[];
    columns: {
        key: string;
        label: string;
        allowTotal?: boolean;
        align?: "end" | "start" | "center";
        isNumeric?: boolean;
    }[];
    exportOption?: string | null;
    showSno?: boolean;
    title?: string;
};

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

    /* responsive layout */
    const layout = useBreakpointValue({
        base: "mobile",
        md: "tablet",
        lg: "desktop",
    });

    const [openDrawer, setOpenDrawer] = useState(false);

    const [settings, setSettings] = useState({
        fontSize: "md" as "sm" | "md" | "lg",
        headerBg: "#e5e7eb",
        headerColor: "#222",
        title: title,
        showTotals: false,
        totalColumns: [] as string[],
    });

    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) router.back();
    }, [data]);

    const fontSizes = createListCollection({
        items: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
        ],
    });

    const totalableColumns = columns.filter((c) => c.allowTotal);

    /* ================= PRINT ================= */

    const columnAlignCSS = columns
        .map((col, index) => {
            const align = col.align ?? (col.isNumeric ? "right" : "left");
            const nthIndex = showSno ? index + 2 : index + 1;

            return `
      th:nth-child(${nthIndex}),
      td:nth-child(${nthIndex}) { text-align:${align}; }
    `;
        })
        .join("\n");

    const handlePrint = () => {

        const tableContainer = printRef.current;
        if (!tableContainer) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const fontSizeMap = { sm: "12px", md: "14px", lg: "16px" };
        const fontSize = fontSizeMap[settings.fontSize] || "14px";

        printWindow.document.write(`
        <html>
        <head>
            <title>Print</title>
            <style>
                body{
                    font-family: Arial, sans-serif;
                    font-size: ${fontSize};
                    margin: 10mm;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                table{
                    border-collapse: collapse;
                    width: 100%;
                }

                th, td{
                    border: 1px solid #ccc;
                    padding: 6px;
                }

                th{
                    background: ${settings.headerBg};
                    color: ${settings.headerColor};
                    font-weight: bold;
                }

                ${columnAlignCSS}

                @page{
                    size: auto;
                    margin: 10mm;
                }

                tr{
                    page-break-inside: avoid;
                }
            </style>
        </head>
        <body>
            ${tableContainer.outerHTML}
        </body>
        </html>
    `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    /* ================= SETTINGS PANEL ================= */

    const SettingsPanel = () => (
        <Stack p={5} gap={5}>
            <Heading size="sm">Print Settings</Heading>

            {/* FONT */}
            <Box>
                <Text fontSize="xs">Font Size</Text>
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
                    <Select.Trigger>
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

            {/* HEADER COLOR */}
            <Box>
                <Text fontSize="xs">Header Background</Text>
                <Input
                    type="color"
                    value={settings.headerBg}
                    onChange={(e) =>
                        setSettings((p) => ({ ...p, headerBg: e.target.value }))
                    }
                />
            </Box>

            <Box>
                <Text fontSize="xs">Header Text</Text>
                <Input
                    type="color"
                    value={settings.headerColor}
                    onChange={(e) =>
                        setSettings((p) => ({ ...p, headerColor: e.target.value }))
                    }
                />
            </Box>

            {/* TOTALS */}
            <Checkbox.Root
                checked={settings.showTotals}
                onCheckedChange={(v) =>
                    setSettings((p) => ({
                        ...p,
                        showTotals: !!v,
                        totalColumns: !!v ? p.totalColumns : [],
                    }))
                }
            >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Show Totals</Checkbox.Label>
            </Checkbox.Root>

            {settings.showTotals && (
                <Stack pl={4}>
                    {totalableColumns.map((col) => (
                        <Checkbox.Root
                            key={col.key}
                            checked={settings.totalColumns.includes(col.key)}
                            onCheckedChange={(v) =>
                                setSettings((p) => ({
                                    ...p,
                                    totalColumns: v
                                        ? [...p.totalColumns, col.key]
                                        : p.totalColumns.filter((c) => c !== col.key),
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

            <Flex gap={3} pt={4}>
                <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>

                {exportOption === "excel" ? (
                    <Button
                        colorScheme="green"
                        onClick={() =>
                            exportToStyledExcel(data, columns, settings, settings.title || "Report")
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
        </Stack>
    );

    /* ================= UI ================= */

    return (
        <Flex direction="column" h="100vh" bg="gray.50">
            {/* MOBILE HEADER */}
            {layout !== "desktop" && (
                <Flex
                    p={3}
                    bg="white"
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    justify="space-between"
                >
                    <Text fontWeight="bold">Print Preview</Text>
                    <Button size="sm" onClick={() => setOpenDrawer(true)}>
                        Settings
                    </Button>
                </Flex>
            )}

            <Flex flex={1} overflow="hidden">
                {/* DESKTOP SIDEBAR */}
                {layout === "desktop" && (
                    <Box
                        w="340px"
                        minW="340px"
                        bg="white"
                        borderRight="1px solid"
                        borderColor="gray.200"
                        overflowY="auto"
                    >
                        <SettingsPanel />
                    </Box>
                )}

                {/* PREVIEW */}
                <Box flex={1} overflow="auto" p={{ base: 2, md: 4, lg: 6 }}>
                    <Box minW="fit-content">
                        <PrintPreviewTable
                            data={data}
                            columns={columns}
                            customization={settings}
                            showSno={showSno}
                            ref={printRef}
                        />
                    </Box>
                </Box>
            </Flex>

            {/* DRAWER FOR MOBILE/TABLET */}
            <Drawer.Root open={openDrawer} onOpenChange={(e) => setOpenDrawer(e.open)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content maxW="380px">
                            <Drawer.Header>
                                <Drawer.Title>Print Settings</Drawer.Title>
                            </Drawer.Header>

                            <Drawer.Body>
                                <SettingsPanel />
                            </Drawer.Body>

                            <Drawer.CloseTrigger asChild>
                                <CloseButton size="sm" />
                            </Drawer.CloseTrigger>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </Flex>
    );
}
