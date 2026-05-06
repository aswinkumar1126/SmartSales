"use client";

import { ColDef } from "@/component/table/ResponsiveTable";
import ExcelTable from "@/component/table/ResponsiveTable";

export default function Home() {

  const initialRows = [
    {
      item: "Gold",
      subItem: "Ring",
      purity: "22K",
      pcs: 1,
      grossWt: 10,
      lessWt: 1,
      rate: 6000,
    },
  ];

  const columns: ColDef[] = [
    {
      key: "item",
      label: "Item",
      type: "select",
      required: true,
      options: ["Gold", "Silver"],
    },
    {
      key: "subItem",
      label: "Sub Item",
      type: "select",
      dependsOn: "item",
      dependencyOptions: {
        Gold: {
          allowedValues: ["Ring", "Chain"],
        },
        Silver: {
          allowedValues: ["Anklet", "Bracelet"],
        },
      },
    },
    {
      key: "purity",
      label: "Purity",
      type: "select",
      dependsOn: "item",
      dependencyOptions: {
        Gold: {
          allowedValues: ["22K", "18K"],
        },
        Silver: {
          allowedValues: ["999", "925"],
        },
      },
    },
    {
      key: "pcs",
      label: "Pieces",
      type: "number",
      required: true,
    },
    {
      key: "grossWt",
      label: "Gross Wt",
      type: "number",
      decimalScale: 3,
    },
    {
      key: "lessWt",
      label: "Less Wt",
      type: "number",
      decimalScale: 3,
    },
    {
      key: "netWt",
      label: "Net Wt",
      type: "number",
      computed: true,
      decimalScale: 3,
      compute: (row) =>
        (row.grossWt || 0) - (row.lessWt || 0),
    },
    {
      key: "rate",
      label: "Rate",
      type: "number",
    },
    {
      key: "amount",
      label: "Amount",
      type: "number",
      computed: true,
      compute: (row) =>
        (row.netWt || 0) * (row.rate || 0),
    },
  ];

  return (
    <>
      <ExcelTable
        columns={columns}
        initialRows={initialRows}
        title="Stock Entry"
        showTotals
        maxVisibleRows={10}
        accentColor="#1976d2"
        onSave={(rows) => {
          console.log("Saved Data:", rows);
        }}
        enterNavigate="column"
        // Option 1: Don't provide renderRow (uses default rendering)
        // renderRow={undefined}

        // Option 2: Custom renderRow function
        renderRow={({
          row,
          rowIndex,
          columns,
          editMode,
          errors,
          touched,
          rowBg,
          onCellChange,
          onCellBlur,
          onCellEnter,
          onDeleteRow,
          inputRefs,
          isLastRow,
        }) => {
          // You can customize the rendering here
          // For example, add custom styling or behavior
          return (
            <tr key={row.__id} style={{ background: rowBg }}>
              <td style={{
                width: 36,
                textAlign: 'center',
                fontSize: 11,
                color: '#adb5bd',
                borderBottom: '1px solid #e9ecef',
                borderRight: '1px solid #e9ecef',
              }}>
                {isLastRow ? (
                  <span style={{ color: '#1976d2', fontWeight: 700 }}>+</span>
                ) : (
                  rowIndex + 1
                )}
              </td>

              {columns.map((col, ci) => {
                const errKey = `${rowIndex}_${col.key}`;
                const hasErr = !!errors[errKey] && !!touched[errKey];
                const val = row[col.key] ?? '';

                // Render computed or non-edit mode cells
                if (col.computed || !editMode) {
                  return (
                    <td key={col.key} style={{
                      borderBottom: '1px solid #e9ecef',
                      borderRight: ci === columns.length - 1 ? 'none' : '1px solid #e9ecef',
                      padding: '0 6px',
                      height: 32,
                      fontSize: 12,
                      textAlign: col.align || 'left',
                    }}>
                      {col.type === 'number' && val !== ''
                        ? (parseFloat(val).toFixed(col.decimalScale || 2))
                        : val}
                    </td>
                  );
                }

                // Render editable cells
                return (
                  <td key={col.key} style={{
                    borderBottom: '1px solid #e9ecef',
                    borderRight: ci === columns.length - 1 ? 'none' : '1px solid #e9ecef',
                    padding: 0,
                    position: 'relative',
                  }}>
                    {col.type === 'select' ? (
                      <select
                        value={val}
                        onChange={(e) => onCellChange(col.key, e.target.value)}
                        onBlur={() => onCellBlur(col.key)}
                        style={{
                          width: '100%',
                          height: 32,
                          border: 'none',
                          outline: 'none',
                          padding: '0 6px',
                          fontSize: 12,
                          background: hasErr ? '#fff5f5' : 'transparent',
                        }}
                      >
                        <option value="">— select —</option>
                        {(col.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={val}
                        onChange={(e) => onCellChange(col.key, e.target.value)}
                        onBlur={() => onCellBlur(col.key)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            onCellEnter(col.key);
                          }
                        }}
                        placeholder={col.placeholder}
                        style={{
                          width: '100%',
                          height: 32,
                          border: 'none',
                          outline: 'none',
                          padding: '0 6px',
                          fontSize: 12,
                          background: hasErr ? '#fff5f5' : 'transparent',
                          textAlign: col.align || 'left',
                        }}
                      />
                    )}
                    {hasErr && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        background: '#c0392b',
                        color: 'white',
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 3,
                        zIndex: 20,
                      }}>
                        {errors[errKey]}
                      </div>
                    )}
                  </td>
                );
              })}

              {editMode && (
                <td style={{
                  width: 44,
                  textAlign: 'center',
                  borderBottom: '1px solid #e9ecef',
                  padding: '0 4px',
                }}>
                  <button
                    onClick={onDeleteRow}
                    style={{
                      padding: '2px 7px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: '1px solid #c0392b',
                      background: '#c0392b',
                      color: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          );
        }}
      />
    </>
  );
}