"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Text,
  Button,
  HStack,
  VStack,
  Badge,
  Separator,
} from "@chakra-ui/react";
import { AiOutlinePrinter, AiOutlineFileText } from "react-icons/ai";
import { MdOutlineStorefront, MdOutlineInventory2 } from "react-icons/md";
import PurchaseReceipt40Col, {
  PurchaseReceiptProps,
} from "../../../component/PurchasePrint/PurchasePrint"; // adjust path

// ─── Demo data (replace with your API/state) ──────────────────────────────────

const DEMO_DATA: PurchaseReceiptProps = {
  companyName: "Sri Murugan Traders",
  companyAddress: [
    "123, Market Street, T.Nagar",
    "Chennai - 600 017",
    "Ph: 044-12345678",
  ],
  partyName: "Rajan Stores",
  partyAddress: ["45, Anna Salai", "Chennai - 600 002"],
  billNo: "PUR/2025-26/0042",
  billDate: "06-04-2025",
  operator: "Karthik",
  cashOpeningBefore: 15000.0,
  cashClosingBefore: 12500.0,
  weightOpeningBefore: 120.5,
  weightClosingBefore: 98.25,
  items: [
    { productName: "Coconut Oil 1L", qty: 10, rate: 180.0,  total: 1800.0 },
    { productName: "Rice 25kg Bag",  qty: 4,  rate: 950.0,  total: 3800.0 },
    { productName: "Toor Dal 1kg",   qty: 20, rate: 115.5,  total: 2310.0 },
    { productName: "Sugar",          qty: 15, rate: 42.0,   total: 630.0  },
  ],
  extraLines: [
    { label: "Loading Charge", value: 150.0  },
    { label: "Discount",       value: -200.0 },
  ],
  cashOpeningAfter:   12500.0,
  cashClosingAfter:   4060.0,
  weightOpeningAfter: 98.25,
  weightClosingAfter: 166.75,
  greeting: "Thank you for your purchase! Visit us again.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Small stat card ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Box
      bg="white"
      borderRadius="10px"
      border="1px solid"
      borderColor="gray.100"
      p={4}
      boxShadow="sm"
      flex="1"
      minW="140px"
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" color="gray.500" fontWeight="600" letterSpacing="0.5px" textTransform="uppercase">
          {label}
        </Text>
        <Box color={accent} fontSize="18px">{icon}</Box>
      </HStack>
      <Text fontSize="lg" fontWeight="700" color="gray.800" fontFamily="mono">
        {value}
      </Text>
    </Box>
  );
}

// ─── Summary row inside info panel ───────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderColor="gray.50">
      <Text fontSize="sm" color="gray.500">{label}</Text>
      <Text fontSize="sm" fontWeight="600" color="gray.800">{value}</Text>
    </Flex>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PurchasePrintPage() {
  // In your real page, replace DEMO_DATA with state from your API:
  // const { data } = useQuery(...)
  // const receiptData: PurchaseReceiptProps = { ... }
  const receiptData = DEMO_DATA;

  const [colSize, setColSize] = useState<"40" | "50">("40");

  const grandTotal = receiptData.items.reduce((s, i) => s + i.total, 0);
  const extraNet   = (receiptData.extraLines ?? []).reduce((s, e) => s + e.value, 0);
  const netTotal   = grandTotal + extraNet;
  const totalQty   = receiptData.items.reduce((s, i) => s + i.qty, 0);

  return (
    <Box minH="100vh" bg="gray.50">

      {/* ── Top bar ── */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.200" px={6} py={3} boxShadow="sm">
        <Flex justify="space-between" align="center">
          <HStack gap={3}>
            <Box
              bg="blue.600"
              color="white"
              borderRadius="8px"
              p={2}
              fontSize="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <MdOutlineInventory2 />
            </Box>
            <Box>
              <Text fontSize="lg" fontWeight="700" color="gray.800" lineHeight="1.2">
                Purchase Entry
              </Text>
              <HStack gap={2}>
                <Text fontSize="xs" color="gray.400">Bill No:</Text>
                <Text fontSize="xs" fontWeight="600" color="blue.600" fontFamily="mono">
                  {receiptData.billNo}
                </Text>
                <Badge colorPalette="green" size="sm">Active</Badge>
              </HStack>
            </Box>
          </HStack>

          {/* Column size toggle */}
          <HStack gap={2}>
            <Text fontSize="xs" color="gray.500">Print Width:</Text>
            <HStack gap={1}>
              {(["40", "50"] as const).map((size) => (
                <Button
                  key={size}
                  size="xs"
                  variant={colSize === size ? "solid" : "outline"}
                  colorPalette={colSize === size ? "blue" : "gray"}
                  onClick={() => setColSize(size)}
                  borderRadius="6px"
                >
                  {size === "40" ? "80mm" : "110mm"}
                </Button>
              ))}
            </HStack>
          </HStack>
        </Flex>
      </Box>

      {/* ── Body ── */}
      <Box px={6} py={5}>
        <Grid templateColumns={{ base: "1fr", lg: "1fr 340px" }} gap={5}>

          {/* ── LEFT: Info panels ── */}
          <GridItem>
            <VStack gap={4} align="stretch">

              {/* Stat cards */}
              <Flex gap={3} wrap="wrap">
                <StatCard
                  label="Net Total"
                  value={`₹ ${fmt(netTotal)}`}
                  icon={<AiOutlineFileText />}
                  accent="blue.500"
                />
                <StatCard
                  label="Total Items"
                  value={String(receiptData.items.length)}
                  icon={<MdOutlineInventory2 />}
                  accent="orange.500"
                />
                <StatCard
                  label="Total Qty"
                  value={String(totalQty)}
                  icon={<MdOutlineStorefront />}
                  accent="green.500"
                />
              </Flex>

              {/* Bill details */}
              <Box bg="white" borderRadius="10px" border="1px solid" borderColor="gray.100" p={5} boxShadow="sm">
                <Text fontSize="sm" fontWeight="700" color="gray.700" mb={3} textTransform="uppercase" letterSpacing="0.5px">
                  Bill Details
                </Text>
                <InfoRow label="Bill No"    value={receiptData.billNo ?? "—"} />
                <InfoRow label="Date"       value={receiptData.billDate ?? "—"} />
                <InfoRow label="Operator"   value={receiptData.operator ?? "—"} />
                <InfoRow label="Party"      value={receiptData.partyName} />
                <InfoRow label="Address"    value={receiptData.partyAddress.join(", ")} />
              </Box>

              {/* Before / After summary */}
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Box bg="white" borderRadius="10px" border="1px solid" borderColor="gray.100" p={4} boxShadow="sm">
                  <Text fontSize="xs" fontWeight="700" color="orange.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                    Before Purchase
                  </Text>
                  <InfoRow label="Cash Opening"  value={`₹ ${fmt(receiptData.cashOpeningBefore)}`} />
                  <InfoRow label="Cash Closing"  value={`₹ ${fmt(receiptData.cashClosingBefore)}`} />
                  <InfoRow label="Wt. Opening"   value={`${fmt(receiptData.weightOpeningBefore)} kg`} />
                  <InfoRow label="Wt. Closing"   value={`${fmt(receiptData.weightClosingBefore)} kg`} />
                </Box>
                <Box bg="white" borderRadius="10px" border="1px solid" borderColor="gray.100" p={4} boxShadow="sm">
                  <Text fontSize="xs" fontWeight="700" color="green.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                    After Purchase
                  </Text>
                  <InfoRow label="Cash Opening"  value={`₹ ${fmt(receiptData.cashOpeningAfter)}`} />
                  <InfoRow label="Cash Closing"  value={`₹ ${fmt(receiptData.cashClosingAfter)}`} />
                  <InfoRow label="Wt. Opening"   value={`${fmt(receiptData.weightOpeningAfter)} kg`} />
                  <InfoRow label="Wt. Closing"   value={`${fmt(receiptData.weightClosingAfter)} kg`} />
                </Box>
              </Grid>

              {/* Items table */}
              <Box bg="white" borderRadius="10px" border="1px solid" borderColor="gray.100" boxShadow="sm" overflow="hidden">
                <Box px={5} py={3} borderBottom="1px solid" borderColor="gray.100">
                  <Text fontSize="sm" fontWeight="700" color="gray.700" textTransform="uppercase" letterSpacing="0.5px">
                    Purchase Items
                  </Text>
                </Box>
                <Box overflowX="auto">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        {["#", "Product", "Qty", "Rate (₹)", "Total (₹)"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 16px",
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#6b7280",
                              textAlign: h === "#" || h === "Product" ? "left" : "right",
                              borderBottom: "1px solid #f3f4f6",
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {receiptData.items.map((item, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid #f3f4f6",
                            background: idx % 2 === 0 ? "#fff" : "#fafafa",
                          }}
                        >
                          <td style={{ padding: "10px 16px", fontSize: "13px", color: "#9ca3af" }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: "13px", fontWeight: 500, color: "#111827" }}>
                            {item.productName}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: "13px", textAlign: "right", color: "#374151" }}>
                            {item.qty}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: "13px", textAlign: "right", fontFamily: "monospace", color: "#374151" }}>
                            {fmt(item.rate)}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: "13px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: "#111827" }}>
                            {fmt(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {/* Extras */}
                      {(receiptData.extraLines ?? []).map((ex) => (
                        <tr key={ex.label} style={{ background: "#f9fafb" }}>
                          <td colSpan={4} style={{ padding: "8px 16px", fontSize: "12px", textAlign: "right", color: "#6b7280" }}>
                            {ex.label}
                          </td>
                          <td style={{ padding: "8px 16px", fontSize: "12px", textAlign: "right", fontFamily: "monospace", color: ex.value < 0 ? "#ef4444" : "#374151" }}>
                            {ex.value < 0 ? `- ${fmt(Math.abs(ex.value))}` : fmt(ex.value)}
                          </td>
                        </tr>
                      ))}
                      {/* Net total */}
                      <tr style={{ background: "#eff6ff", borderTop: "2px solid #bfdbfe" }}>
                        <td colSpan={4} style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, textAlign: "right", color: "#1e40af" }}>
                          NET TOTAL
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 700, textAlign: "right", fontFamily: "monospace", color: "#1e40af" }}>
                          ₹ {fmt(netTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </Box>
              </Box>

            </VStack>
          </GridItem>

          {/* ── RIGHT: Receipt preview ── */}
          <GridItem>
            <Box position="sticky" top="16px">
              <Box bg="white" borderRadius="10px" border="1px solid" borderColor="gray.100" boxShadow="sm" overflow="hidden">

                {/* Panel header */}
                <Flex
                  bg="blue.600"
                  color="white"
                  px={4}
                  py={3}
                  justify="space-between"
                  align="center"
                >
                  <HStack gap={2}>
                    <AiOutlinePrinter />
                    <Text fontSize="sm" fontWeight="700">Receipt Preview</Text>
                  </HStack>
                  <Badge
                    bg="blue.500"
                    color="white"
                    fontSize="10px"
                    px={2}
                    borderRadius="full"
                  >
                    {colSize === "40" ? "80 mm" : "110 mm"}
                  </Badge>
                </Flex>

                {/* Receipt */}
                <Box p={3} bg="#e5e7eb" overflowY="auto" maxH="calc(100vh - 200px)">
                  <PurchaseReceipt40Col {...receiptData} columnSize={colSize} />
                </Box>

              </Box>
            </Box>
          </GridItem>

        </Grid>
      </Box>
    </Box>
  );
}