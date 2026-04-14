"use client";
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { formatDateForAPI, formatDateForShow } from "@/utils/format/formatDateForAPI";
import { FaFileExcel, FaPrint, FaFilePdf } from "react-icons/fa";
import Loader from "@/component/loader/Loader";
import { useItemStockReport } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";
import { ItemStockEntry } from "@/types/SummaryReport/SummaryReport";
import { usePrint } from "@/context/print/usePrintContext";
import { useTheme } from "@/context/theme/themeContext";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────────────────────────────────
   Types & Constants
───────────────────────────────────────────────────────────────────────────── */
type WeightKey = "GRS" | "NET" | "STN";

const WEIGHT_OPTIONS: { value: WeightKey; label: string; sub: string }[] = [
  { value: "GRS", label: "Gross Wt", sub: "GRS.WT" },
  { value: "NET", label: "Net Wt", sub: "NET.WT" },
  { value: "STN", label: "Stone Wt", sub: "STN.WT" },
];

const GROUPS = [
  { label: "Opening", prefix: "OP", accent: "#385ba1", bg: "#bfdbfe", border: "#bfdbfe" },
  { label: "Receipt", prefix: "RE", accent: "#385ba1", bg: "#a7f3d0", border: "#a7f3d0" },
  { label: "Issue", prefix: "IS", accent: "#385ba1", bg: "#fecaca", border: "#fecaca" },
  { label: "Closing", prefix: "CL", accent: "#385ba1", bg: "#fde68a", border: "#fde68a" },
] as const;

const PRINT_COLUMNS = [
  { key: "ITEMNAME", label: "Item Name", align: "start" as const },
  { key: "OP_PCS", label: "OP PCS", align: "end" as const, allowTotal: true },
  { key: "OP_GRSWT", label: "OP Grs.Wt", align: "end" as const, allowTotal: true },
  { key: "OP_NETWT", label: "OP Net.Wt", align: "end" as const, allowTotal: true },
  { key: "OP_STNWT", label: "OP Stn.Wt", align: "end" as const, allowTotal: true },
  { key: "RE_PCS", label: "RE PCS", align: "end" as const, allowTotal: true },
  { key: "RE_GRSWT", label: "RE Grs.Wt", align: "end" as const, allowTotal: true },
  { key: "RE_NETWT", label: "RE Net.Wt", align: "end" as const, allowTotal: true },
  { key: "RE_STNWT", label: "RE Stn.Wt", align: "end" as const, allowTotal: true },
  { key: "IS_PCS", label: "IS PCS", align: "end" as const, allowTotal: true },
  { key: "IS_GRSWT", label: "IS Grs.Wt", align: "end" as const, allowTotal: true },
  { key: "IS_NETWT", label: "IS Net.Wt", align: "end" as const, allowTotal: true },
  { key: "IS_STNWT", label: "IS Stn.Wt", align: "end" as const, allowTotal: true },
  { key: "CL_PCS", label: "CL PCS", align: "end" as const, allowTotal: true },
  { key: "CL_GRSWT", label: "CL Grs.Wt", align: "end" as const, allowTotal: true },
  { key: "CL_NETWT", label: "CL Net.Wt", align: "end" as const, allowTotal: true },
  { key: "CL_STNWT", label: "CL Stn.Wt", align: "end" as const, allowTotal: true },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
function getKey(prefix: string, sub: string): keyof ItemStockEntry {
  const map: Record<string, string> = {
    "PCS": `${prefix}_PCS`,
    "GRS.WT": `${prefix}_GRSWT`,
    "NET.WT": `${prefix}_NETWT`,
    "STN.WT": `${prefix}_STNWT`,
  };
  return map[sub] as keyof ItemStockEntry;
}

function fmt(value: React.ReactNode): string {
  const num = Number(value ?? 0);
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/* ─────────────────────────────────────────────────────────────────────────────
   StatCard — summary metric at the top
───────────────────────────────────────────────────────────────────────────── */
function StatCard({
  label, value, sub, accent,
}: { label: string; value: React.ReactNode; sub: string; accent: string }) {
  return (
    <Box
      flex={1}
      minW="110px"
      bg="white"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="lg"
      p={3}
      borderBottom="3px solid"
      borderBottomColor={accent}
      transition="box-shadow 0.15s"
      _hover={{ boxShadow: "sm" }}
    >
      <Text
        fontSize="9px"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.08em"
        color={accent}
        mb="2px"
      >
        {label}
      </Text>
      <Text
        fontSize="18px"
        fontWeight="800"
        color={accent}
        fontFamily="'IBM Plex Mono', monospace"
        lineHeight={1.1}
      >
        {fmt(value)}
      </Text>
      <Text fontSize="10px" color="gray.400" mt="2px">{sub}</Text>
    </Box>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WeightSelector — dropdown checkbox
───────────────────────────────────────────────────────────────────────────── */
function WeightSelector({
  selectedWeights,
  toggleWeight,
  accentColor,
}: {
  selectedWeights: Set<WeightKey>;
  toggleWeight: (k: WeightKey) => void;
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Box ref={ref} position="relative">
      <Flex
        as="button"
        align="center"
        gap={2}
        px={3}
        py="6px"
        borderRadius="lg"
        bg="#f8fafc"
        border="1px solid"
        borderColor={open ? accentColor : "#e2e8f0"}
        fontSize="11px"
        fontWeight="600"
        color="#475569"
        cursor="pointer"
        userSelect="none"
        onClick={() => setOpen((o) => !o)}
        transition="border-color 0.15s"
        _hover={{ borderColor: accentColor }}
      >
        <Text fontSize="10px" fontWeight="700" color="#64748b" textTransform="uppercase" letterSpacing="0.05em">
          Weights
        </Text>
        <Box
          px="6px" py="1px" borderRadius="full"
          bg={accentColor} color="white" fontSize="10px" fontWeight="700"
        >
          {selectedWeights.size}
        </Box>
        <Box as="span" fontSize="9px" color="#94a3b8">{open ? "▲" : "▼"}</Box>
      </Flex>

      {open && (
        <Box
          position="absolute"
          top="calc(100% + 6px)"
          right={0}
          zIndex={100}
          bg="white"
          border="1px solid #e2e8f0"
          borderRadius="lg"
          boxShadow="0 8px 24px rgba(0,0,0,0.10)"
          minW="160px"
          py={2}
        >
          {/* PCS – locked */}
          <Flex align="center" gap={2} px={3} py="7px" opacity={0.7}>
            <Box
              w="15px" h="15px" borderRadius="4px"
              bg={accentColor} border="1px solid" borderColor={accentColor}
              display="flex" alignItems="center" justifyContent="center" flexShrink={0}
            >
              <Box as="span" color="white" fontSize="9px" fontWeight="800">✓</Box>
            </Box>
            <Text fontSize="11px" fontWeight="600" color="#475569">PCS</Text>
            <Text fontSize="9px" color="#cbd5e1" ml="auto">(fixed)</Text>
          </Flex>

          {WEIGHT_OPTIONS.map((opt) => {
            const active = selectedWeights.has(opt.value);
            return (
              <Flex
                key={opt.value}
                as="button"
                align="center"
                gap={2}
                px={3}
                py="7px"
                w="100%"
                cursor="pointer"
                onClick={() => toggleWeight(opt.value)}
                _hover={{ bg: "#f8fafc" }}
                transition="background 0.1s"
              >
                <Box
                  w="15px" h="15px" borderRadius="4px"
                  bg={active ? accentColor : "white"}
                  border="1.5px solid"
                  borderColor={active ? accentColor : "#cbd5e1"}
                  display="flex" alignItems="center" justifyContent="center"
                  flexShrink={0}
                  transition="all 0.15s"
                >
                  {active && (
                    <Box as="span" color="white" fontSize="9px" fontWeight="800">✓</Box>
                  )}
                </Box>
                <Text
                  fontSize="11px"
                  fontWeight={active ? "600" : "400"}
                  color={active ? "#1e293b" : "#94a3b8"}
                  transition="color 0.1s"
                >
                  {opt.label}
                </Text>
              </Flex>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ExportMenu
───────────────────────────────────────────────────────────────────────────── */
function ExportMenu({
  onExcel, onPdf, onPrint,
}: { onExcel: () => void; onPdf: () => void; onPrint: () => void }) {
  const btn = (
    color: string, borderColor: string, hoverBg: string,
    icon: React.ReactNode, label: string, onClick: () => void,
  ) => (
    <Box
      as="button"
      display="flex" alignItems="center" gap={1}
      px={3} py="6px"
      borderRadius="md"
      bg="white"
      border="1px solid"
      borderColor={borderColor}
      color={color}
      fontSize="11px"
      fontWeight="600"
      cursor="pointer"
      transition="all 0.15s"
      onClick={onClick}
      _hover={{ bg: hoverBg }}
    >
      {icon}
      <Box as="span" display={{ base: "none", md: "inline" }}>{label}</Box>
    </Box>
  );

  return (
    <Flex align="center" gap={1}>
      {btn("#059669", "#a7f3d0", "#ecfdf5", <FaFileExcel size={12} />, "Excel", onExcel)}
      {btn("#dc2626", "#fecaca", "#fef2f2", <FaFilePdf size={12} />, "PDF", onPdf)}
      {btn("#4f46e5", "#c7d2fe", "#eef2ff", <FaPrint size={12} />, "Print", onPrint)}
    </Flex>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GroupLegend
───────────────────────────────────────────────────────────────────────────── */
function GroupLegend() {
  return (
    <Flex align="center" gap="6px" flexWrap="wrap">
      {GROUPS.map((g) => (
        <Flex
          key={g.prefix}
          align="center" gap={1}
          px={2} py="3px"
          borderRadius="5px"
          bg={g.bg}
          border="1px solid" borderColor={g.border}
        >
          <Box w="6px" h="6px" borderRadius="full" bg={g.accent} />
          <Text fontSize="10px" fontWeight="600" color={g.accent}>{g.label}</Text>
        </Flex>
      ))}
    </Flex>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NumCell
───────────────────────────────────────────────────────────────────────────── */
const NumCell = React.memo(function NumCell({
  value, isSectionStart = false, isTotal = false, accent,
}: {
  value: React.ReactNode;
  isSectionStart?: boolean;
  isTotal?: boolean;
  accent?: string;
}) {
  return (
    <td
      style={{
        fontSize: "11px",
        padding: "5px 10px",
        whiteSpace: "nowrap",
        textAlign: "right",
        borderLeft: isSectionStart
          ? `2px solid ${accent ?? "#e2e8f0"}`
          : "1px solid #f1f5f9",
        color: isTotal ? "#0f172a" : "#475569",
        fontWeight: isTotal ? 700 : 400,
        backgroundColor: isTotal ? "#f8fafc" : undefined,
        fontVariantNumeric: "tabular-nums",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {fmt(value)}
    </td>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────────────────── */
function ItemStockReport() {
  const { theme } = useTheme();
  const today = formatDateForAPI(new Date());

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedWeights, setSelectedWeights] = useState<Set<WeightKey>>(
    new Set(["GRS", "NET", "STN"]),
  );

  const toggleWeight = useCallback((key: WeightKey) => {
    setSelectedWeights((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const { data, isLoading, isError } = useItemStockReport(selectedDate);
  const { setData, setColumns, setShowSno, title } = usePrint();
  const router = useRouter();

  /* ── derived data ── */
  const { tableData, totalRow } = useMemo(() => {
    const rows = data ?? [];
    return {
      tableData: rows.filter((r) => r.ITEMNAME !== "TOTAL"),
      totalRow: rows.find((r) => r.ITEMNAME === "TOTAL") ?? null,
    };
  }, [data]);

  const visibleSubs = useMemo(
    () => ["PCS", ...WEIGHT_OPTIONS.filter((o) => selectedWeights.has(o.value)).map((o) => o.sub)],
    [selectedWeights],
  );

  const totalCols = 2 + GROUPS.length * visibleSubs.length;

  const activeLabels = useMemo(
    () => ["PCS", ...WEIGHT_OPTIONS.filter((o) => selectedWeights.has(o.value)).map((o) => o.label)],
    [selectedWeights],
  );

  /* ── export handlers ── */
  const pushPrint = useCallback(
    (option: string) => {
      setData(data ?? []);
      setColumns(PRINT_COLUMNS);
      setShowSno(true);
      title?.(`Item Stock Report — As on ${formatDateForShow(selectedDate)}`);
      router.push(`/print?export=${option}`);
    },
    [data, selectedDate, setData, setColumns, setShowSno, title, router],
  );

  const handleExcel = useCallback(() => pushPrint("excel"), [pushPrint]);
  const handlePrint = useCallback(() => pushPrint("print"), [pushPrint]);

  const handlePdf = useCallback(() => {
    import("jspdf").then(({ default: jsPDF }) =>
      import("jspdf-autotable").then(({ default: autoTable }) => {
        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

        const hex2rgb = (h: string): [number, number, number] => [
          parseInt(h.slice(1, 3), 16),
          parseInt(h.slice(3, 5), 16),
          parseInt(h.slice(5, 7), 16),
        ];

        const dateLabel = formatDateForShow(selectedDate);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Item Stock Report — As on ${dateLabel}`, 40, 28);

        const subCount = visibleSubs.length;

        const headRow1: any[] = [
          { content: "#", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" } },
          { content: "Item Name", rowSpan: 2, styles: { halign: "left", valign: "middle", fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" } },
          ...GROUPS.map((g) => ({
            content: g.label.toUpperCase(),
            colSpan: subCount,
            styles: { halign: "center", fillColor: hex2rgb(g.accent), textColor: 255, fontStyle: "bold" },
          })),
        ];

        const headRow2: any[] = GROUPS.flatMap((g) =>
          visibleSubs.map((lbl) => ({
            content: lbl,
            styles: { halign: "right", fillColor: hex2rgb(g.bg), textColor: hex2rgb(g.accent), fontStyle: "bold", fontSize: 6.5 },
          }))
        );

        const body: any[][] = [
          ...tableData.map((row, idx) => [
            { content: idx + 1, styles: { halign: "center" } },
            { content: row.ITEMNAME, styles: { halign: "left" } },
            ...GROUPS.flatMap((g) =>
              visibleSubs.map((sub) => ({
                content: row[getKey(g.prefix, sub)] ?? 0,
                styles: { halign: "right" },
              }))
            ),
          ]),
          ...(totalRow ? [[
            { content: "", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
            { content: "TOTAL", styles: { halign: "left", fontStyle: "bold", fillColor: [241, 245, 249] } },
            ...GROUPS.flatMap((g) =>
              visibleSubs.map((sub) => ({
                content: totalRow[getKey(g.prefix, sub)] ?? 0,
                styles: { halign: "right", fontStyle: "bold", fillColor: [241, 245, 249] },
              }))
            ),
          ]] : []),
        ];

        autoTable(doc, {
          head: [headRow1, headRow2],
          body,
          startY: 40,
          columnStyles: Object.fromEntries(
            [22, 90, ...Array(GROUPS.length * subCount).fill(42)].map((w, i) => [i, { cellWidth: w }])
          ),
          styles: { fontSize: 7, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.3 },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          didDrawCell: (data: any) => {
            if (data.section === "body" || data.section === "head") {
              const colIdx = data.column.index;
              if (colIdx >= 2 && (colIdx - 2) % subCount === 0) {
                const gIdx = Math.floor((colIdx - 2) / subCount);
                const rgb = hex2rgb(GROUPS[gIdx].accent);
                doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
                doc.setLineWidth(1.2);
                doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
                doc.setLineWidth(0.3);
                doc.setDrawColor(226, 232, 240);
              }
            }
          },
        } as any);

        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
        doc.save(`ItemStockReport_${selectedDate.replace(/-/g, "")}.pdf`);
      })
    );
  }, [selectedDate, tableData, totalRow, visibleSubs]);

  /* ── loading / error states ── */
  if (isLoading)
    return <Loader isLoading fullscreen content="Loading Item Stock Report..." />;

  if (isError)
    return (
      <Box p={6} textAlign="center">
        <Text color="red.500" fontWeight={600}>
          Failed to load Item Stock Report. Please try again.
        </Text>
      </Box>
    );

  /* ── stats for summary bar ── */
  const STAT_CARDS = [
    { label: "Opening PCS", value: totalRow?.OP_PCS ?? 0, sub: "units in stock", accent: "#2563eb" },
    { label: "Received PCS", value: totalRow?.RE_PCS ?? 0, sub: "units added", accent: "#059669" },
    { label: "Issued PCS", value: totalRow?.IS_PCS ?? 0, sub: "units dispatched", accent: "#dc2626" },
    { label: "Closing PCS", value: totalRow?.CL_PCS ?? 0, sub: `across ${tableData.length} items`, accent: "#d97706" },
  ];

  /* ─────────────────────────────────────────────────────────────────────────
     Render
  ──────────────────────────────────────────────────────────────────────────── */
  return (
    <Box
      p={4}
      display="flex"
      flexDirection="column"
      h="100vh"
      bg={theme.colors.primary}
    >
      <Box
        bg={theme.colors.formColor}
        borderRadius="xl"
        border="1px solid"
        borderColor="gray.200"
        boxShadow="0 2px 16px rgba(0,0,0,0.06)"
        display="flex"
        flexDirection="column"
        flex={1}
        overflow="hidden"
      >

        {/* ── HEADER ── */}
        <Box px={4} pt={3} pb={2} borderBottom="1px solid" borderColor="#f1f5f9">
          <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={2}>

            {/* Title */}
            <Box>
              <Text
                fontWeight="800"
                fontSize="sm"
                color={theme.colors.accient}
                letterSpacing="0.06em"
                textTransform="uppercase"
                lineHeight={1.1}
              >
                Item Stock Report
              </Text>
              <Text fontSize="10px" color="#94a3b8" mt="2px">
                As on&nbsp;
                <Text as="span" fontWeight="700" color={theme.colors.accient}>
                  {formatDateForShow(selectedDate)}
                </Text>
              </Text>
            </Box>

            {/* Controls */}
            <Flex align="center" gap={3} wrap="wrap">

              {/* Weight selector */}
              <WeightSelector
                selectedWeights={selectedWeights}
                toggleWeight={toggleWeight}
                accentColor={theme.colors.accient}
              />

              {/* Date picker */}
              <Flex
                align="center" gap={2}
                bg="#f8fafc"
                border="1px solid" borderColor="#e2e8f0"
                borderRadius="lg"
                px={3} py="5px"
              >
                <Text fontSize="10px" fontWeight="700" color="#64748b" whiteSpace="nowrap" textTransform="uppercase" letterSpacing="0.05em">
                  Date
                </Text>
                <Box w="1px" h="14px" bg="#e2e8f0" />
                <DatePickerInput
                  value={selectedDate}
                  onChange={setSelectedDate}
                  maxWidth="110px"
                  maxDate={new Date()}
                />
              </Flex>

              {/* Exports */}
              <ExportMenu onExcel={handleExcel} onPdf={handlePdf} onPrint={handlePrint} />
            </Flex>
          </Flex>

          {/* Legend + active column badges */}
          <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
            <GroupLegend />
          </Flex>
        </Box>


        {/* ── TABLE ── */}
        <style>{`
          .isr-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
          .isr-scroll::-webkit-scrollbar-track { background: transparent; }
          .isr-scroll::-webkit-scrollbar-thumb { background: #d1d9e0; border-radius: 99px; }
        `}</style>
        <Box
          flex={1}
          overflow="auto"
          mx={4}
          mb={3}
          border="1px solid #d1d9e0"
          borderRadius="lg"
          className="isr-scroll"
        >
          <table
            style={{
              borderCollapse: "collapse",
              minWidth: "max-content",
              width: "100%",
            }}
          >
            {/* ── THEAD ── */}
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>

              {/* Row 1 – group bands */}
              <tr>
                <th
                  rowSpan={2}
                  style={{
                    fontSize: "10px", fontWeight: 700, padding: "9px 10px",
                    whiteSpace: "nowrap", color: "#fff",
                    textAlign: "center", width: "44px", verticalAlign: "middle",
                    backgroundColor: "#385ba1",
                    borderRight: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  S.No
                </th>
                <th
                  rowSpan={2}
                  style={{
                    fontSize: "11px", fontWeight: 700, padding: "9px 14px",
                    whiteSpace: "nowrap", color: "#fff",
                    textAlign: "left", minWidth: "170px", verticalAlign: "middle",
                    backgroundColor: "#385ba1",
                    borderRight: "2px solid rgba(255,255,255,0.2)",
                  }}
                >
                  ITEM NAME
                </th>
                {GROUPS.map((g) => (
                  <th
                    key={g.label}
                    colSpan={visibleSubs.length}
                    style={{
                      fontSize: "10px", fontWeight: 800,
                      padding: "8px 10px",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                      backgroundColor: g.accent,
                      color: "#fff",
                      borderLeft: "2px solid rgba(255,255,255,0.2)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {g.label}
                  </th>
                ))}
              </tr>

              {/* Row 2 – sub-column labels */}
              <tr>
                {GROUPS.map((g) =>
                  visibleSubs.map((lbl, i) => (
                    <th
                      key={`${g.label}-${lbl}`}
                      style={{
                        fontSize: "9px", fontWeight: 700, padding: "5px 10px",
                        whiteSpace: "nowrap",
                        textAlign: "right",
                        backgroundColor: g.bg,
                        color: g.accent,
                        borderLeft: i === 0 ? `2px solid ${g.accent}` : `1px solid ${g.border}`,
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {lbl}
                    </th>
                  ))
                )}
              </tr>
            </thead>

            {/* ── TBODY ── */}
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalCols}
                    style={{
                      fontSize: "13px", padding: "56px",
                      textAlign: "center", color: "#94a3b8",
                    }}
                  >
                    No data found for {formatDateForShow(selectedDate)}.
                  </td>
                </tr>
              ) : (
                tableData.map((row: ItemStockEntry, index: number) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#fafbfc",
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f7ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#fafbfc")}
                  >
                    <td
                      style={{
                        fontSize: "10px", padding: "6px 10px",
                        textAlign: "center", color: "#cbd5e1",
                        borderRight: "1px solid #f1f5f9", width: "44px",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td
                      style={{
                        fontSize: "11px", padding: "6px 14px",
                        fontWeight: 600,
                        color: theme.colors.primaryText,
                        borderRight: `2px solid ${GROUPS[0].border}`,
                        minWidth: "170px",
                      }}
                    >
                      {row.ITEMNAME}
                    </td>
                    {GROUPS.map((g) =>
                      visibleSubs.map((sub, i) => (
                        <NumCell
                          key={`${g.prefix}-${sub}`}
                          value={row[getKey(g.prefix, sub)]}
                          isSectionStart={i === 0}
                          accent={g.accent}
                        />
                      ))
                    )}
                  </tr>
                ))
              )}

              {/* ── Total row ── */}
              {totalRow && (
                <tr
                  style={{
                    backgroundColor: "#f8fafc",
                    borderTop: "2px solid #d1d9e0",
                    borderBottom: "2px solid #d1d9e0",
                  }}
                >
                  <td
                    style={{
                      fontSize: "10px", padding: "8px 10px",
                      textAlign: "center", color: "#cbd5e1",
                      borderRight: "1px solid #e2e8f0",
                    }}
                  />
                  <td
                    style={{
                      fontSize: "11px", padding: "8px 14px",
                      fontWeight: 800, color: "#0f172a",
                      borderRight: `2px solid ${GROUPS[0].accent}`,
                      letterSpacing: "0.07em", textTransform: "uppercase",
                    }}
                  >
                    Total
                  </td>
                  {GROUPS.map((g) =>
                    visibleSubs.map((sub, i) => (
                      <NumCell
                        key={`total-${g.prefix}-${sub}`}
                        value={totalRow[getKey(g.prefix, sub)]}
                        isSectionStart={i === 0}
                        isTotal
                        accent={g.accent}
                      />
                    ))
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      </Box>
    </Box>
  );
}

export default ItemStockReport;