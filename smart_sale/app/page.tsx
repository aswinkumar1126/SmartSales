"use client";

import DataTable, { ColumnDef } from "@/component/table/ExcelReportTable";

// ─── Column definitions with sub-columns ──────────────────────────────────────

const columnDefs: ColumnDef[] = [
  // Standalone column (no sub-columns)
  {
    data: "id",
    title: "ID",
    type: "numeric",
    width: 55,
    readOnly: true,
    align: "center",
  },
  // Standalone column
  {
    data: "product",
    title: "Product",
    type: "text",
    width: 180,
    align: "left",
  },
  {
    data: "category",
    title: "Category",
    type: "dropdown",
    width: 130,
    source: ["Electronics", "Apparel", "Food", "Software"],
    align: "left",
  },
  // Group header with sub-columns
  {
    data: "sales_group",
    title: "Sales",
    align: "center",
    subColumns: [
      { data: "qty", title: "Qty", type: "numeric", width: 75, align: "right", showTotal: true },
      { data: "price", title: "Price", type: "numeric", width: 90, align: "right", showTotal: false },
      {
        data: "revenue", title: "Revenue", type: "numeric", width: 100, align: "right", showTotal: true,
        renderTotal: (rows) => {
          const sum = rows.reduce((acc, r) => acc + (Number(r.revenue) || 0), 0);
          return `$${sum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      },
    ],
  },
  // Group header with sub-columns
  {
    data: "status_group",
    title: "Status",
    align: "center",
    subColumns: [
      { data: "active", title: "Active", type: "checkbox", width: 70, align: "center" },
      { data: "inStock", title: "In Stock", type: "checkbox", width: 80, align: "center" },
    ],
  },
  // Standalone column
  {
    data: "notes",
    title: "Notes",
    type: "text",
    width: 200,
    align: "left",
  },
  // Hidden audit columns
  { data: "createdBy", title: "Created By", hidden: true },
  { data: "updatedAt", title: "Updated At", hidden: true },
];

// ─── Sample data ───────────────────────────────────────────────────────────────

function makeRow(
  id: number,
  product: string,
  category: string,
  qty: number,
  price: number,
  active: boolean,
  inStock: boolean,
  notes = ""
) {
  return {
    id,
    product,
    category,
    qty,
    price,
    revenue: qty * price,
    active,
    inStock,
    notes,
    createdBy: "admin",
    updatedAt: "2025-01-15",
  };
}

const sampleData = [
  makeRow(1, "Wireless Headphones", "Electronics", 42, 89.99, true, true, "Top seller Q3"),
  makeRow(2, "Running Shoes", "Apparel", 130, 59.50, true, true),
  makeRow(3, "Coffee Beans 1kg", "Food", 250, 14.99, false, false, "Low stock soon"),
  makeRow(4, "Antivirus Suite", "Software", 999, 29.00, true, true, "Annual licence"),
  makeRow(5, "Desk Lamp", "Electronics", 18, 34.99, true, true, "Reorder soon"),
  makeRow(6, "Yoga Mat", "Apparel", 75, 24.99, true, true),
  makeRow(7, "Green Tea 50-pack", "Food", 300, 8.49, true, true),
  makeRow(8, "Cloud Storage Plan", "Software", 450, 9.99, true, true),
  makeRow(9, "USB-C Hub", "Electronics", 200, 44.99, true, false, "Restock pending"),
  makeRow(10, "Organic Honey 500g", "Food", 90, 12.99, false, true),
  makeRow(11, "Password Manager", "Software", 600, 19.99, true, true),
  makeRow(12, "Noise-Cancelling Mic", "Electronics", 55, 79.99, true, true),
  makeRow(13, "Compression Socks", "Apparel", 220, 14.50, true, true),
  makeRow(14, "Dark Roast Blend", "Food", 180, 11.25, true, false),
  makeRow(15, "Project Mgmt SaaS", "Software", 120, 49.00, true, true),
];

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <DataTable
        title="Product Inventory"
        data={sampleData}
        columnDefs={columnDefs}
        height="380px"
        onChange={(rows) => console.log("changed:", rows)}

        /* Totals row */
        totals={{
          enabled: true,
          label: "Total",
          bg: "#f0f4ff",
          color: "#1e3a5f",
        }}

        /* Pagination */
        pagination={{
          enabled: true,
          pageSize: 10,
          pageSizeOptions: [
            { label: "5", value: "5" },
            { label: "10", value: "10" },
            { label: "25", value: "25" },
            { label: "All", value: "999" },
          ],
          showPageSizeSelector: true,
          showPageNumbers: true,
          showTotalCount: true,
          onPageChange: (page, size) => console.log("page:", page, "size:", size),
        }}

        showRowControls
        showExport
        showSearch
      />
    </div>
  );
}