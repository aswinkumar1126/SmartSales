"use client";

import { useState } from "react";
import { Box, Text, Button } from "@chakra-ui/react";
import EditableTable from "@/component/table/EditableTable";
import EditableCell from "@/component/table/EditableCell";
import PdfBuilder from "./print/PDFBuilder/page";
import type { PdfField } from "@/component/pdfTemplate/PdfTemplateBuilder";

import { ExcelGrid } from "@/component/table/ExcelTable";

export default function Home() {

  // ── Table helpers ─────────────────────────────────────────────────────────────
  const handleCashSave = async (_row: any, _key: string, _value: any) => {
    await new Promise((res) => setTimeout(res, 500));
  };

  const columns = [
    {
      key: "item",
      label: "Item Name",
      align: "left",
      headerBg: "#2D3748",
      headerColor: "white",
      editable: true,
    },
    {
      key: "qty",
      label: "Qty",
      align: "right",
    },
    {
      key: "rate",
      label: "Rate",
      align: "right",
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
    },
  ];

  const rows = [
    { id: "1", item: "", qty: "", rate: "", amount: "" },
    { id: "2", item: "", qty: "", rate: "", amount: "" },
  ];

  const footer = {
    item: "Total",
    amount: "1000",
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
      
    

     
      <EditableTable
        columns={dummycolumn}
        data={[
          { id: "2024-01-01", name: "John Doe", email: "john@example.com" },
          { id: "2024-01-05", name: "Jane Smith", email: "jane@example.com" },
        ]}
      />

      {/* <ExcelGrid
        columns={columns}
        rows={rows}
        footer={footer}
      /> */}
     
    </>
  );
}