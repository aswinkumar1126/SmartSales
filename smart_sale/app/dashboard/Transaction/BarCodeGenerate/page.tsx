
"use client";

import React, { useCallback, useState } from "react";
import {
  Box, Table, Text, Button, Portal, Drawer, Icon, Span, Spinner,
} from "@chakra-ui/react";
import Image from "next/image";
import { Printer } from "lucide-react";
import { FaDownload } from "react-icons/fa";

/* ── Components ── */
import { CustomTable } from "@/component/table/CustomTable";
import TransactionTable from "@/component/table/TransactionTable";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SingleCheckbox } from "@/components/ui/CheckBox";
import BarcodeHeaderForm from "./BarcodeHeaderForm/BarCodeHeaderForm";
import BarCodeExcel, { ExcelData } from "./excel/BarCodeExcel";
import { BarcodeTagListing } from "./BarcodeTagListing/BarcodeTagList";
import StockSummaryPanel from "./StockSummary/StockSummaryPanel";

/* ── Hook ── */
import { useBarcodeGenerate, FIELD_ORDER, type FieldKey } from  '@/hooks/barcode/useBarcodeGenerater';

/* ── Theme ── */
import { useTheme } from "@/context/theme/themeContext";

/* ── Assets ── */
import saveIcon from "@/asserts/icons/save.png";
import updateIcon from "@/asserts/icons/update.png";
import clearIcon from "@/asserts/icons/clear.jpeg";

/* ── Utils ── */
import { formatToFixed } from "@/utils/format/numberFormat";

import type { BarcodeTransactionRow } from "@/store/barcode/useBarcodeStore";



/* ============================================================
   STOCK TABLE HEADER (static config, fine to keep in UI file)
   ============================================================ */

const STOCK_TABLE_HEADER = [
  { key: "ITEMID",    label: "ITEM ID",    align: "start"  as const },
  { key: "PCS",       label: "PCS",        align: "center" as const },
  { key: "GRSWT",     label: "GROSS WT",   align: "end"    as const, decimalScale: 3 },
  { key: "STNWT",     label: "STONE WT",   align: "end"    as const, decimalScale: 3 },
  { key: "NETWT",     label: "NET WT",     align: "end"    as const, decimalScale: 3 },
  { key: "WASTYPE",   label: "WASTE TYPE", align: "center" as const },
  { key: "TOUCH",     label: "TOUCH",      align: "center" as const, decimalScale: 1 },
  { key: "STNPRESENT",label: "STONE",      align: "center" as const },
];

/* ============================================================
   COMPONENT
   ============================================================ */

function BarCodeGenerate() {
  const { theme } = useTheme();
const {
  // ...other values
  isretag,
  setIsRetag,
  // ...other values
} = useBarcodeGenerate();
  const {
    /* state */
    headerForm, 
    rows, 
    isEditing,
    printDetails,
    singleSearch, 
    tagFilterParams,
    transactionForm, 
    editRowId, 
    fieldErrors, 
    touched, 
    headerErrors,
    isSubmittingRow, 
    isSubmittingTag,
    excelDrawerOpen, 
    setExcelDrawerOpen,
    deselectFlag,
    excelData,
    setExcelData,
    handleExcelChange,
    /* collections */
    purchaserCollection, 
    inwardCollection, 
    itemCollection, 
    itemSizeCollection,
    stockTableData,

    /* stock summary */
    stockSummary, 
    remaining,

    /* table config */
    transactionFormFields, 
    allDisplayCols, 
    transactionTotals, 
    showTableForm,

    /* listing */
    tagItemList,

    /* refs */
    fieldRefs,

    /* handlers */
    handleHeaderChange, 
    handleFormChange, 
    resetForm,
    handleRowSubmit, 
    moveToNext,
    handleEditRow, 
    handleDeleteRow,
    handleExcelLoad,
    handleSave, 
    handleUpdate, 
    handleClear,
    handleSelectTag,
    setSingleSearch, 
    setTagFilterField,
    handlePrintAll, 
    handlePrintSingle, 
    handleDownloadSetup,

    /* cell helpers */
    getCellValue, 
    formatTotal,

  } = useBarcodeGenerate();
  
  console.log(stockSummary,'stockSummary')


  

  /* ── Stock row renderer ── */
  const renderStockRow = useCallback((row: any) => {
    if (!row) return (
      <Table.Cell colSpan={8} textAlign="center" color="gray.500">Invalid row</Table.Cell>
    );
    return (
      <>
        <Table.Cell textAlign="start">{row.ITEMID || "-"} - {row.ITEMNAME || "-"}</Table.Cell>
        <Table.Cell textAlign="center">{row.PCS ?? "0"}</Table.Cell>
        <Table.Cell textAlign="right">{formatToFixed(row.GRSWT, 3)}</Table.Cell>
        <Table.Cell textAlign="right">{formatToFixed(row.STNWT, 3)}</Table.Cell>
        <Table.Cell textAlign="right">{formatToFixed(row.NETWT, 3)}</Table.Cell>
        <Table.Cell textAlign="center">{row.WASTYPE || "-"}</Table.Cell>
        <Table.Cell textAlign="center">{formatToFixed(row.TOUCH, 1)}</Table.Cell>
        <Table.Cell textAlign="center">
          <Box
            bg={row.STNPRESENT === "Y" ? "green.100" : "red.100"}
            p={1} fontSize="2xs" rounded="xl"
          >
            {row.STNPRESENT === "Y" ? "Present" : "Not Present"}
          </Box>
        </Table.Cell>
      </>
    );
  }, []);

  /* ── Transaction cell renderer ── */
  const renderCellValue = useCallback((col: any, row: BarcodeTransactionRow) => {
    if (col.key === "__print") {
      return (
        <button onClick={() => handlePrintSingle(row.barcode)}>
          <Printer width={16} height={16} color="#3182CE" />
        </button>
      );
    }
    return getCellValue(col, row);
  }, [getCellValue, handlePrintSingle]);

  /* ── isNew badge in cell ── */
  const renderRowLabel = useCallback((row: BarcodeTransactionRow) => {
    if (!isEditing) return null;
    return row.isNew
      ? <Box as="span" ml={1} bg="blue.100" color="blue.700" fontSize="2xs" px={1} rounded="sm">new</Box>
      : <Box as="span" ml={1} bg="gray.100" color="gray.500" fontSize="2xs" px={1} rounded="sm">saved</Box>;
  }, [isEditing]);


  /* ── Form cell renderer (passed to TransactionTable) ── */
  const renderFormCell = useCallback((field: any) => {
    const key = field.key as FieldKey;
    const ref = fieldRefs.current[key];
    const value = transactionForm[field.key as keyof typeof transactionForm]?.toString() ?? "";

    if (field.type === "number") return (
      <CapitalizedInput
        field={key} value={value}
        onChange={(_: unknown, v: unknown) => handleFormChange(key, v)}
        type="number" isCapitalized={false} size="xs" rounded="sm"
        decimalScale={field.decimalScale ?? 3}
        inputRef={ref} onEnter={() => moveToNext(key)} noBorder
        allowFocus={field.allowFocus || false}
      />
    );

    if (field.key === "barcode") return (
      <CapitalizedInput
        field={key}
        value={value}
        onChange={(_: unknown, v: unknown) => handleFormChange(key, v)}
        type="text" 
        isCapitalized={false} 
        size="xs" 
        rounded="sm"
        inputRef={ref} 
        onEnter={handleRowSubmit} 
        noBorder 
        disabled
      />
    );

    if (field.type === "combobox") return (
      <SelectCombobox
        value={value}
        onChange={(v: string) => { handleFormChange(field.key, v); if (v) moveToNext(field.key); }}
        items={field.collection ?? []}
        placeholder={field.placeholder ?? `Select ${field.label}`}
        ref={ref as React.RefObject<HTMLInputElement>}
        rounded="sm" disable={field.disabled} onEnter={() => moveToNext(field.key)}
      />
    );

    return (
      <CapitalizedInput
        field={key} value={value}
        onChange={(_: unknown, v: unknown) => handleFormChange(key, v)}
        type="text" isCapitalized={false} size="xs" rounded="sm"
        inputRef={ref} onEnter={() => moveToNext(key)} noBorder disabled={field.disabled}
      />
    );
  }, [transactionForm, handleFormChange, moveToNext, handleRowSubmit, fieldRefs]);

  const getCellStyle = useCallback((col: any, extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "4px 6px", borderRight: "1px solid #E2E8F0",
    textAlign: col.align ?? (col.key === "size" || col.key === "barcode" ? "left" : "right"),
    fontSize: "12px",
    width: col.width || "50px", minWidth: col.width || "50px", maxWidth: col.width || "50px",
    ...extra,
  }), []);


  console.log(rows,'isSubmittingRow');

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <Box display="flex" flexDirection="row" width="100%" gap={2}>
      <Box display="flex" flexDirection="column" gap={2} width="100%">

        {/* ── Header form ── */}
        <Box
          bg={theme.colors.formColor} p={2} rounded="xl"
          display="flex" flexDirection="row" justifyContent="space-between" gap={4}
        >
          <BarcodeHeaderForm
            form={headerForm}
            onChange={handleHeaderChange}
            purchaserCollection={purchaserCollection}
            inwardCollection={inwardCollection}
            itemCollection={itemCollection}
            isDisabled={rows.length > 0}
            validationError={headerErrors}
          /> 
<SingleCheckbox
  label="RETAG"
  checked={isretag}
  onChange={() => setIsRetag((prev) => !prev)}
  size="sm"
  fontSize="xs"
/>
          <Box display="flex" alignItems="start" flexDirection="column" gap={2}>
            <SingleCheckbox
              label="EXCEL IMPORT"
              checked={excelDrawerOpen}
              onChange={() => setExcelDrawerOpen((p) => !p)}
              size="sm" fontSize="xs"
            />
            <Button onClick={handleDownloadSetup} variant="ghost" p={0}>
              <Box display="flex" alignItems="center" flexDirection="column">
                <Span fontSize="xs" display="flex" gap={1} alignItems="center">
                  <Icon as={FaDownload} w={5} h={5} />
                </Span>
                <Span fontSize="2xs">Download Printing Files</Span>
              </Box>
            </Button>
          </Box>
        </Box>

        {/* ── Stock table + summary (split with isNew/saved awareness) ── */}
        <Box
          display="flex" flexDirection={{ sm: "column", md: "row" }} gap={2}
          bg={theme.colors.formColor} p={2} justifyContent="space-between" rounded="xl"
        > 
        <Box>
            <Text fontSize="xs" fontWeight={600} mb={1} color="gray.600">
              SELECTED ITEM SUMMARY
            </Text>

            <CustomTable
              columns={STOCK_TABLE_HEADER}
              data={stockTableData}
              renderRow={renderStockRow}
              headerBg={theme.colors.accient}
              headerColor="white"
              bodyBg={theme.colors.formColor}
              borderColor="white"
              maxWidth="100%"
            />

        </Box>
         
          {/* StockSummaryPanel receives the new 4-column summary (lot/saved/new/balance) */}
          <StockSummaryPanel

            summary={stockSummary}
            headerBg={theme.colors.accient}
          />
        </Box>

        {/* ── Action bar ── */}
        <Box display="flex" flexDirection="row" gap={2} bg={theme.colors.formColor} rounded="xl">
          {isEditing && printDetails?.length > 0 && (
            <Box
              fontSize="xs" display="flex" alignItems="center"
              justifyContent="center" gap={2}
              onClick={handlePrintAll} p={2} cursor="pointer"
            >
              <Printer width={20} height={20} />
              <Text>Print All</Text>
            </Box>
          )}

          {rows.length > 0 && (
            <Box ml="auto" display="flex" alignItems="center" p={2}>
              <Button size="xs" onClick={handleClear} variant="ghost" bg={theme.colors.formColor} p={0}>
                <Image src={clearIcon} width={58} alt="CLEAR" />
              </Button>
              <Button
                size="xs" variant="ghost" p={0}
                bg={theme.colors.formColor}
                loading={isSubmittingTag}
                onClick={isEditing ? handleUpdate : handleSave}
              >
                <Image src={isEditing ? updateIcon : saveIcon} width={60} alt="save" />
              </Button>
            </Box>
          )}
        </Box>

        {/* ── Transaction table ── */}
        <TransactionTable
          theme={theme}
          tableCols={allDisplayCols}
          formFields={transactionFormFields}
          rows={rows}
          errors={fieldErrors}
          touched={touched}
          localEditId={editRowId}
          isSubmitting={isSubmittingRow}
          totals={transactionTotals}
          allDisplayCols={allDisplayCols}
          resetForm={resetForm}
          handleSubmit={handleRowSubmit}
          handleEditRow={handleEditRow}
          handleDeleteRow={handleDeleteRow}
          renderFormCell={renderFormCell}
          getCellValue={renderCellValue}
          formatTotal={formatTotal}
          getCellStyle={getCellStyle}
          transactionType="barcode"
          showTotal
          showTableForm={showTableForm}

          maxBodyHeight= "400px"
          
          /* isNew badge slot */
          // renderRowLabel={isEditing ? renderRowLabel : undefined}
        />

        {/* ── Excel drawer ── */}
        {excelDrawerOpen && (
          <Drawer.Root open={excelDrawerOpen} onOpenChange={() => setExcelDrawerOpen(false)}>
            <Portal>
              <Drawer.Backdrop />
              <Drawer.Positioner>
                <Drawer.Content maxWidth="4xl">
                  <Drawer.Header borderBottomWidth="1px" bg="cyan.50" fontSize="md">
                    Excel Import
                    <Drawer.CloseTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setExcelDrawerOpen(false)}>×</Button>
                    </Drawer.CloseTrigger>
                  </Drawer.Header>
                  <Drawer.Body p={0}>
                    <BarCodeExcel
                      data={excelData}
                      onChange={handleExcelChange}
                      onLoad={ handleExcelLoad }
                      onFileParsed={setExcelData}
                    />
                  </Drawer.Body>
                </Drawer.Content>
              </Drawer.Positioner>
            </Portal>
          </Drawer.Root>
        )}
      </Box>
 
      {/* ── Tag listing sidebar ── */}
      <Box width="15%">
        <BarcodeTagListing
          tagListItems={tagItemList}
          searchTerm={singleSearch}
          handleSearchChange={setSingleSearch}
          handleEditTagTransaction={handleSelectTag}
          handleDeselect={handleClear}
          deselectFlag={deselectFlag}
          onFilterChange={setTagFilterField}
          filterParams={tagFilterParams}
          collections={{ acCodeCollection: purchaserCollection }}
          isEditing={isEditing}
        />
      </Box>
    </Box>
  );
}

export default BarCodeGenerate;