"use client";

import { useState } from "react";
import { Box, Text, Button } from "@chakra-ui/react";
import EditableTable from "@/component/table/EditableTable";
import EditableCell from "@/component/table/EditableCell";
import PdfBuilder from "./print/PDFBuilder/page";
import type { PdfField } from "@/component/pdfTemplate/PdfTemplateBuilder";

export default function Home() {
  const [pdfOpen, setPdfOpen] = useState(false);

  // ── Invoice data ─────────────────────────────────────────────────────────────
  const invoiceData = {
    invoiceNo: "INV-2024-0042",
    date: "04 Apr 2026",
    dueDate: "18 Apr 2026",
    billTo: "Acme Corp Pvt. Ltd.",
    address: "12, Anna Salai, Chennai - 600 002",
    total: "₹ 14,750.00",
    logo: "https://via.placeholder.com/120x40.png?text=LOGO",
    lineItems: [
      { desc: "Web Design", qty: 2, rate: 3500, amount: 7000 },
      { desc: "Backend API", qty: 1, rate: 5250, amount: 5250 },
      { desc: "Hosting (1 yr)", qty: 1, rate: 2500, amount: 2500 },
    ],
  };

  const invoiceFields: PdfField[] = [
    {
      id: "logo", type: "image",
      x: 20, y: 20, width: 120, height: 40,
      label: "Logo",
      image: { dataKey: "logo", fit: "contain" },
    },
    {
      id: "invoiceNo", type: "text",
      x: 350, y: 20, width: 220, height: 24,
      label: "Invoice #", dataKey: "invoiceNo",
      fontSize: 14, fontStyle: "bold", align: "right",
    },
    {
      id: "date", type: "text",
      x: 350, y: 48, width: 220, height: 20,
      label: "Date", dataKey: "date",
      fontSize: 10, align: "right", color: "#64748b",
    },
    {
      id: "dueDate", type: "text",
      x: 350, y: 68, width: 220, height: 20,
      label: "Due Date", dataKey: "dueDate",
      fontSize: 10, align: "right", color: "#ef4444",
    },
    {
      id: "billTo", type: "text",
      x: 20, y: 80, width: 200, height: 20,
      label: "Bill To", dataKey: "billTo",
      fontSize: 11, fontStyle: "bold",
    },
    {
      id: "address", type: "text",
      x: 20, y: 98, width: 240, height: 18,
      label: "Address", dataKey: "address",
      fontSize: 10, color: "#64748b",
    },
    {
      id: "div1", type: "divider",
      x: 20, y: 130, width: 555, height: 4,
      dashed: false, thickness: 1, color: "#cbd5e1",
    },
    {
      id: "lineItems", type: "table",
      x: 20, y: 140, width: 555, height: 200,
      label: "Line Items",
      table: {
        dataKey: "lineItems",
        showHeader: true,
        showFooterTotals: true,
        stripedRows: true,
        headerBgColor: "#0f172a",
        headerTextColor: "#ffffff",
        fontSize: 10,
        columns: [
          { key: "desc", header: "Description", dataKey: "desc", align: "left" },
          { key: "qty", header: "Qty", dataKey: "qty", align: "center" },
          {
            key: "rate", header: "Rate (₹)", dataKey: "rate", align: "right",
            format: (v) => `₹ ${Number(v).toLocaleString()}`
          },
          {
            key: "amount", header: "Amount (₹)", dataKey: "amount", align: "right",
            showTotal: true,
            format: (v) => `₹ ${Number(v).toLocaleString()}`
          },
        ],
        footerSummaryRows: [
          { label: "GST 18%", value: "₹ 2,655.00" },
          { label: "Grand Total", value: "₹ 17,405.00" },
        ],
      },
    },
    {
      id: "total", type: "text",
      x: 350, y: 370, width: 220, height: 28,
      label: "Grand Total", dataKey: "total",
      fontSize: 15, fontStyle: "bold", align: "right", color: "#2563eb",
    },
    {
      id: "footerDiv", type: "divider",
      x: 20, y: 810, width: 555, height: 4,
      dashed: true, thickness: 1, color: "#94a3b8",
    },
  ];

  // ── Table helpers ─────────────────────────────────────────────────────────────
  const handleCashSave = async (_row: any, _key: string, _value: any) => {
    await new Promise((res) => setTimeout(res, 500));
  };

  const dummycolumn = [
    {
      key: "id",
      label: "Date",
      render: (value: any, row: any) => (
        <EditableCell value={value} type="date"
          onSave={(v) => handleCashSave(row, "id", v)} />
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (value: any, row: any) => (
        <EditableCell value={value} type="text"
          onSave={(v) => handleCashSave(row, "name", v)} />
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (value: any, row: any) => (
        <EditableCell value={value} type="text"
          onSave={(v) => handleCashSave(row, "email", v)} />
      ),
    },
  ];

  return (
    <>
      {/* ── Page content ────────────────────────────────────────── */}
      <Box mb={4} display="flex" alignItems="center" justifyContent="space-between">
        <Text fontSize="lg" fontWeight="bold">Dummy Editable Table</Text>

        {/* ← The ONLY thing you need to add */}
        <Button
          colorScheme="blue"
          size="sm"
          onClick={() => setPdfOpen(true)}
        >
          🖨️ Print / Preview PDF
        </Button>
      </Box>

      <EditableTable
        columns={dummycolumn}
        data={[
          { id: "2024-01-01", name: "John Doe", email: "john@example.com" },
          { id: "2024-01-05", name: "Jane Smith", email: "jane@example.com" },
        ]}
      />

      {/* ── PDF full-screen overlay ─────────────────────────────── */}
      {/* Renders on TOP of this page. No routing. No new pages. */}
      <PdfBuilder
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        paperType="a4"
        title="Invoice Builder"
        data={invoiceData}
        fields={invoiceFields}
        showDownload
      />
    </>
  );
}