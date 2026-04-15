"use client";
import React, { useState, useMemo } from "react";
import { ReportTable, ReportTableHeader, ReportSubHeader } from "@/component/table/ReportTable";
import { Box, Table, Button, VStack, Text, Spinner, HStack } from "@chakra-ui/react";
import { usePureStockReport } from "@/hooks/apiHooks/SummaryReport/useSummaryReport";
import { useTheme } from "@/context/theme/themeContext";

// Helper function to format column labels
const formatColumnLabel = (key: string): string => {
  // Remove prefix and format
  const withoutPrefix = key.replace(/^(OP_|CL_|IS_|RE_)/, '');

  // Convert to title case and add spaces
  return withoutPrefix
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Group columns by their prefix
const groupColumnsByPrefix = (columns: string[]) => {
  const groups: Record<string, string[]> = {
    'PURE': [], // Special group for PURE info
    'OP': [],   // Opening
    'IS': [],   // Issue
    'RE': [],   // Receive
    'CL': []    // Closing
  };

  columns.forEach(col => {
    if (col.startsWith('OP_')) {
      groups['OP'].push(col);
    } else if (col.startsWith('IS_')) {
      groups['IS'].push(col);
    } else if (col.startsWith('RE_')) {
      groups['RE'].push(col);
    } else if (col.startsWith('CL_')) {
      groups['CL'].push(col);
    } else if (col === 'PUREID' || col === 'PUREGOLDNAME') {
      groups['PURE'].push(col);
    }
  });

  return groups;
};

// Color palette for different header groups
const groupColors: Record<string, { bg: string; color: string; subBg: string; subColor: string }> = {
  'PURE': {
    bg: 'blue.50',
    color: 'blue.700',
    subBg: 'blue.100',
    subColor: 'blue.800'
  },
  'OP': {
    bg: 'green.50',
    color: 'green.700',
    subBg: 'green.100',
    subColor: 'green.800'
  },
  'IS': {
    bg: 'orange.50',
    color: 'orange.700',
    subBg: 'orange.100',
    subColor: 'orange.800'
  },
  'RE': {
    bg: 'purple.50',
    color: 'purple.700',
    subBg: 'purple.100',
    subColor: 'purple.800'
  },
  'CL': {
    bg: 'teal.50',
    color: 'teal.700',
    subBg: 'teal.100',
    subColor: 'teal.800'
  }
};

// Group labels
const groupLabels: Record<string, string> = {
  'PURE': 'PURE Information',
  'OP': 'Opening Balance',
  'IS': 'Issued',
  'RE': 'Received',
  'CL': 'Closing Balance'
};

function StockReport() {

  const {theme} =useTheme();
  const [showReport, setShowReport] = useState(false);
  const { data: reportData, isLoading, isError, refetch } = usePureStockReport();

  // Dynamically generate headers and sub-headers from data
  const { headers, subHeaders, tableData } = useMemo(() => {
    if (!reportData || reportData.length === 0) {
      return { headers: [], subHeaders: [], tableData: [] };
    }

    // Get all unique keys from the first data item
    const firstPURE = reportData[0];
    const allColumns = Object.keys(firstPURE);

    // Group columns by prefix
    const groupedColumns = groupColumnsByPrefix(allColumns);

    // Generate headers (only for groups that have data)
    const generatedHeaders: ReportTableHeader[] = [];
    const generatedSubHeaders: ReportSubHeader[] = [];

    // Always add ITEM group first if it exists
    if (groupedColumns['PURE'].length > 0) {
      generatedHeaders.push({
        key: 'PURE',
        label: groupLabels['PURE'],
        align: 'center' as const,
        bg: groupColors['PURE'].bg,
        color: groupColors['PURE'].color,
      });

      // Add sub-headers for PURE group
      groupedColumns['PURE'].forEach(col => {
        generatedSubHeaders.push({
          key: col,
          label: col === 'PUREID' ? 'PURE ID' : 'PUREGOLD Name',
          headerKey: 'PURE',
          align: 'start',
          bg: groupColors['PURE'].subBg,
          color: groupColors['PURE'].subColor
        });
      });
    }

    // Add other groups
    ['OP', 'IS', 'RE', 'CL'].forEach(groupKey => {
      if (groupedColumns[groupKey].length > 0) {
        generatedHeaders.push({
          key: groupKey,
          label: groupLabels[groupKey],
          align: 'center',
          bg: groupColors[groupKey].bg,
          color: groupColors[groupKey].color
        });

        // Sort columns for consistent order
        const sortedColumns = groupedColumns[groupKey].sort((a, b) => {
          // Custom sorting: GROSSWT first, then NETWT, then PUREWT, then STNWT
          const order = ['GRSWT', 'NETWT', 'PUREWT', 'STNWT'];
          const aType = a.split('_')[1];
          const bType = b.split('_')[1];
          return order.indexOf(aType) - order.indexOf(bType);
        });

        sortedColumns.forEach(col => {
          generatedSubHeaders.push({
            key: col,
            label: formatColumnLabel(col),
            headerKey: groupKey,
            align: groupKey === 'PURE' ? 'start' : 'end',
            bg: groupColors[groupKey].subBg,
            color: groupColors[groupKey].subColor
          });
        });
      }
    });

    // Format data for table
    const formattedData = reportData.map((PURE: any, index: number) => ({
      ...PURE,
      _id: PURE.PUREID || index // Ensure unique ID for each row
    }));

    return {
      headers: generatedHeaders,
      subHeaders: generatedSubHeaders,
      tableData: formattedData
    };
  }, [reportData]);

  // Render row function
  const renderStockRow = (row: any, index: number, isSelected: boolean) => {
    // Get all columns in the correct order (matching subHeaders)
    const orderedColumns = subHeaders.map(sh => sh.key);

    return (
      <>
        {orderedColumns.map(columnKey => {
          const value = row[columnKey];
          const isPUREColumn = columnKey === 'PUREID' || columnKey === 'PURENAME';
          const isNumeric = !isPUREColumn && typeof value === 'number';

          return (
            <Table.Cell
              key={columnKey}
              textAlign={isNumeric ? 'end' : 'start'}
              py={2}
            >
              {isNumeric ? (
                <Text fontSize="xs" fontWeight={value !== 0 ? 'medium' : 'normal'}>
                  {value.toFixed(3)}
                </Text>
              ) : (
                <Text fontSize="xs">
                  {value}
                </Text>
              )}
            </Table.Cell>
          );
        })}
      </>
    );
  };

  // Handle get report button click
  const handleGetReport = async () => {
    setShowReport(true);
    await refetch();
  };

  // Loading state
  if (isLoading && showReport) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading report data...</Text>
      </Box>
    );
  }

  // Error state
  if (isError && showReport) {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500" mb={4}>Error loading report data</Text>
        <Button onClick={() => refetch()}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box bg={theme.colors.formColor} p={2} rounded={'xl'}> 
      <VStack gap={4} align="stretch">
        {/* Report Header */}
        <HStack justify="end" align="center">
         
          <Button
            colorPalette="blue"
            
            onClick={handleGetReport}
            loadingText="Loading..."
            size="xs"
          >
            Get Report
          </Button>
        </HStack>

        {/* Show report only after button click */}
        {showReport && tableData.length > 0 && (
          <>
          

            {/* Report Table */}
            <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden">
              <ReportTable
                header={headers}
                subHeader={subHeaders}
                data={tableData}
                renderRow={renderStockRow}
                rowIdKey="PUREID"

              
                // selection={{
                //   enabled: true,
                //   selectionBgColor: "blue.50",
                //   showSelectAll: true,
                //   selectionColumnWidth: "50px"
                // }}

                // Totals configuration - STICKY AT BOTTOM
                totals={{
                  enabled: true,
                  totalLabel: "TOTAL",
                  totalBg: "gray.100",
                  totalColor: "gray.800",
                  sticky: true,
                  // Optional: Custom total calculation
                  calculateTotals: (data) => {
                    const totals: Record<string, number> = {};
                    subHeaders.forEach(sh => {
                      if (sh.key !== 'PUREID' && sh.key !== 'PURENAME') {
                        totals[sh.key] = data.reduce((sum, row) => {
                          return sum + (Number(row[sh.key]) || 0);
                        }, 0);
                      }
                    });
                    return totals;
                  }
                }}

                // Pagination enabled
                pagination={{
                  enabled: true,
                  pageSize: 10,
                  pageSizeOptions: [
                    { label: "10", value: "10" },
                    { label: "25", value: "25" },
                    { label: "50", value: "50" },
                    { label: "100", value: "100" }
                  ],
                  showPageSizeSelector: true,
                  showPageNumbers: true,
                  showTotalCount: true
                }}
                

                // Styling
                headerBg="white"
                borderColor="gray.200"
                size="sm"
                emptyText="No stock data available"
                maxWidth="100%"
                maxHeight="600px"
              />
            </Box>

            {/* Legend */}
            <HStack gap={2} p={2} fontSize="xs" color="gray.600">
              <HStack>
                <Box w={3} h={3} bg="green.50" border="1px solid" borderColor="green.200" />
                <Text>Opening</Text>
              </HStack>
              <HStack>
                <Box w={3} h={3} bg="orange.50" border="1px solid" borderColor="orange.200" />
                <Text>Issued</Text>
              </HStack>
              <HStack>
                <Box w={3} h={3} bg="purple.50" border="1px solid" borderColor="purple.200" />
                <Text>Received</Text>
              </HStack>
              <HStack>
                <Box w={3} h={3} bg="teal.50" border="1px solid" borderColor="teal.200" />
                <Text>Closing</Text>
              </HStack>
            </HStack>


            {/* Summary Stats */}
            <HStack gap={4} p={2} bg="gray.50" borderRadius="md">
              <Box>
                <Text fontSize="xs" color="gray.600">Total PUREs</Text>
                <Text fontSize="md" fontWeight="bold">{tableData.length}</Text>
              </Box>
              {tableData.length > 0 && (
                <>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Total Opening Gross Wt</Text>
                    <Text fontSize="md" fontWeight="bold">
                      {tableData.reduce((sum, PURE) => sum + (PURE.OP_GRSWT || 0), 0).toFixed(3)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Total Closing Gross Wt</Text>
                    <Text fontSize="md" fontWeight="bold">
                      {tableData.reduce((sum, PURE) => sum + (PURE.CL_GRSWT || 0), 0).toFixed(3)}
                    </Text>
                  </Box>
                </>
              )}
            </HStack>
          </>
        )}

        {/* Initial state - no report shown */}
        {!showReport && (
          <Box
            p={12}
            textAlign="center"
            bg="gray.50"
            borderRadius="lg"
            border="2px dashed"
            borderColor="gray.300"
          >
            <Text fontSize="lg" color="gray.600" mb={4}>
              Click "Get Report" to view the PURE-wise stock report
            </Text>
            <Text fontSize="sm" color="gray.500">
              The report will show opening, issued, received, and closing balances for all PUREs
            </Text>
          </Box>
        )}

        {/* No data state */}
        {showReport && tableData.length === 0 && !isLoading && (
          <Box p={8} textAlign="center" bg="gray.50" borderRadius="md">
            <Text>No stock data available for the selected period</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

export default StockReport;