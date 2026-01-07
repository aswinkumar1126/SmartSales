"use client";

import React, {
    useEffect,
    useMemo,
    useState,
    useCallback,
} from "react";

import {
    Text,
    Box,
    Button,
    Flex,
    Combobox,
    Portal,
    Input,
    useListCollection,
    useFilter,
} from "@chakra-ui/react";

import EditableTable from "@/component/table/EditableTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";

import { useIssues, usePatchIssue, useCreateIssue } from "@/hooks/issue/useIssue";
import { useItems } from "@/hooks/item/useItems";
import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";

import { issueColumns } from "./isseColumns";
import { TRANSACTIONTYPES } from "@/data/Transaction/TransactionType";
import { useTheme } from "@/context/theme/themeContext";
import { formatDateForShow } from "@/utils/format/formatDateForAPI";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toaster, Toaster } from "@/components/ui/toaster";
import { useTransactions } from "@/hooks/transaction/useTransactions";
import { Opening } from "@/data/Transaction/Opening";
import { formatToFixed } from "@/utils/format/numberFormat";


/* ================================
   Component
================================ */

export default function IssuePage() {
    const { theme } = useTheme();

    const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());

    const [transcationTitle, setTransactionTitle] = useState("");
    const [activeButton, setActiveButton] = useState("");

    console.log(activeButton ,'activeButton')

    const [transactionType , setTransactionType] = useState("");

    const [form, setForm] = useState({
        ENTRYNO: "1",
        BILLNO: "1",
        DATE: "",
        RATEGM: "",
        CUSTOMER: "",
    });

    const handleChange = (field: string, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const TXN_KEY = "activeTransaction";
    const TXN_TITLE_KEY = "transactionTitle";


    /* ================================
       Data hooks
    ================================ */

    const { data: issue, isLoading } = useIssues();
    const { data: itemsData } = useItems();
    const { data: allCustomer } = useAllAccountHead();


    const { data: transactionData } = useTransactions(String(activeButton));
    console.log(transactionData, 'transactionData')

    const patchIssue = usePatchIssue();
    const createIssue = useCreateIssue();

    const { contains } = useFilter({ sensitivity: "base" });

    /* ================================
       Item Combobox
    ================================ */

    const mappedItems = useMemo(
        () =>
            itemsData?.items?.map((item: any) => ({
                label: item.itemName,
                value: item.itemId.toString(),
            })) ?? [],
        [itemsData]
    );

    const { collection: comboboxCollection, filter: comboboxFilter, set } = useListCollection({
        initialItems: mappedItems,
        filter: contains,
    });

    useEffect(() => {
        set(mappedItems);
    }, [mappedItems, set]);

    useEffect(() => {
        if (!form.DATE) {
            handleChange(
                "DATE",
                new Date().toISOString().split("T")[0] // today
            );
        }
    }, []);

    const getLabelByValueWithFallback = useCallback((collection: any, value: any) => {
        if (!collection?.items?.length) return value ?? "";
        const found = collection.items.find(
            (i: any) => i.value === value?.toString()
        );
        return found?.label ?? value ?? "";
    }, []);


    useEffect(() => {
        const savedTxn = localStorage.getItem(TXN_KEY);
        const savedTitle = localStorage.getItem(TXN_TITLE_KEY);

        if (savedTxn && savedTitle) {
            setActiveButton(savedTxn);
            setTransactionTitle(savedTitle);
        }
    }, []);

    useEffect(() => {
        if (activeButton) {
            localStorage.setItem(TXN_KEY, activeButton);
            localStorage.setItem(TXN_TITLE_KEY, transcationTitle);
        }
    }, [activeButton, transcationTitle]);

    useEffect(() => {
        return () => {
            localStorage.removeItem(TXN_KEY);
            localStorage.removeItem(TXN_TITLE_KEY);
        };
    }, []);


    /* ================================
       Customer Combobox
    ================================ */

    const customerList = Array.isArray(allCustomer?.data)
        ? allCustomer.data
        : [];

    const CustomerList = useMemo(() => {
        return customerList.map((c: any) => ({
            label: c.ACNAME,
            value: String(c.ACCODE),
        }));
    }, [customerList]);

    const {
        collection: customerCollection,
        filter: customerFilter,
        set:customerListSet
    } = useListCollection({
        initialItems: CustomerList,
        filter: contains,
        
    });
    useEffect(() => {
        customerListSet(CustomerList);
    }, [CustomerList, customerListSet]);

    const getLabelByValue = useCallback((collection: any, value: any) => {
        if (!collection?.items?.length) return value ?? "";
        const found = collection.items.find(
            (i: any) => i.value === value?.toString()
        );
        return found?.label ?? value ?? "";
    }, []);

    /* ================================
       Table State
    ================================ */

    const backendRows = transactionData?.data ?? [];

   

    const backendNextSno =  1;

    const [rows, setRows] = useState<any[]>([]);
    const [editingRowId, setEditingRowId] = useState<string | number | null>(null);
    const [previewSno, setPreviewSno] = useState<number>(backendNextSno);

    const mappedBackendRows = useMemo(
        
        () =>
            backendRows.map((r: any) => ({
                ...r,
                __rowId: r.SNO,
            })),
        [backendRows]
    );

    useEffect(() => {
        setRows(mappedBackendRows);
        setPreviewSno(backendNextSno);
    }, [mappedBackendRows, backendNextSno]);

    /* ================================
       Row handlers
    ================================ */

    const handleUpdateRow = (rowIndex: number, updatedRow: any) => {
        setRows((prev) =>
            prev.map((row, i) => (i === rowIndex ? updatedRow : row))
        );
    };

    const handleAddNew = () => {
        const rowId = `new-${Date.now()}`;

        const newRow = {
            __rowId: rowId,
            __isNew: true,
            __previewSno: previewSno,

            SNO: undefined,
            ITEMID: "",
            PCS: 0,
            GRSWT: 0,
            LESSWT: 0,
            NETWT: 0,
            PURITY: 0,
            PUREWT: 0,
            RATE: 0,
            MCHARGE: 0,
            WASTAGE: 0,
        };

        setRows((prev) => [newRow, ...prev]);

        setTimeout(() => setEditingRowId(rowId), 0);
      
        setNewRowIds((prev) => new Set(prev).add(rowId));

        setPreviewSno((p) => p + 1);
        toaster.create({
            title: "New Row Added",
            description: "Please select an Item and fill required fields before saving.",
            type: "info",
            duration: 5000,
        });
    };

    const handleSaveRow = async (row: any) => {
        try {
            // 🔥 VALIDATION: Item must be selected
            if (!row.ITEMID || row.ITEMID === "" || row.ITEMID === null) {
                toaster.create({
                    title: "Item Required",
                    description: "Please select an item before saving.",
                    type: "error",
                    duration: 3000,
                });
                return; // Stop saving
            }

            // Optional: You can add more validations here later
            // e.g., if (!row.PCS || row.PCS <= 0) { ... }

            if (row.__isNew) {
                const { __rowId, __isNew, __previewSno, SNO, ...payload } = row;

                await createIssue.mutateAsync(payload);
            } else {
                await patchIssue.mutateAsync({
                    sno: row.SNO,
                    payload: row,
                });
            }

            // Success → exit editing mode
            setEditingRowId(null);

            // Optional success toast
            toaster.create({
                title: "Saved Successfully",
                description: row.__isNew ? "New issue added." : "Issue updated.",
                type: "success",
            });
        } catch (e: any) {
            console.error("Save failed", e);

            toaster.create({
                title: "Save Failed",
                description: e?.message || "Something went wrong. Please try again.",
                type: "error",
                duration: 3000,
            });
        }
    };
    const handleCancelEdit = (rowId?: string | number) => {
        setRows((prev) =>
            prev.filter((r) => !(r.__isNew && r.__rowId === rowId))
        );
        setEditingRowId(null);
    };

    /* ================================
       Columns
    ================================ */

    const columns = useMemo(() => {
        const numeric = [
            "PCS",
            "GRSWT",
            "LESSWT",
            "NETWT",
            "PURITY",
            "PUREWT",
            "RATE",
            "MCHARGE",
            "WASTAGE",
        ];

        return issueColumns.map((col) => {
            if (col.key === "SNO") {
                return {
                    ...col,
                    editable: false,
                    render: (_: any, row: any) =>
                        row.SNO ?? row.__previewSno,
                };
            }

            if (col.key === "ITEMID") {
                return {
                    ...col,
                    type: "combobox" as const,
                    collection: comboboxCollection,
                    getLabelByValue: getLabelByValueWithFallback,
                    editable: true,
                    align: "left" as const,
                    headalign: "left" as const,
                    onInputValueChange: comboboxFilter,  // ✅ THIS IS THE KEY
                };
            }

            return {
                ...col,
                editable: true,
                type: numeric.includes(col.key) ? "number" as const: "text" as const,
                align: numeric.includes(col.key) ? "right" as const : "center"as const ,
                headalign: numeric.includes(col.key) ? "right" as const : "center" as const,
                sum: numeric.includes(col.key),
            };
        });
    }, [comboboxCollection, getLabelByValueWithFallback]);


    // const totals = useMemo(() => {
    //     return columns.reduce((acc: any, col) => {
    //         if (col.sum) {
    //             acc[col.key] = rows.reduce(
    //                 (sum: number, row: any) => sum + Number(row[col.key] || 0),
    //                 0
    //             );
    //         }
    //         return acc;
    //     }, {});
    // }, [rows, columns]);

    /* ================================
       Date helpers
    ================================ */

    const parseISOToDate = (iso?: string) => {
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    };

    const formatDateToISO = (date: Date | null) => {
        if (!date) return "";
        return date.toISOString().split("T")[0]; // yyyy-MM-dd
    };
    /* ================================
       Render
    ================================ */
    const openingItems = useMemo(() => {
        return Opening
            .filter(o => o.value !== 0)
            .map(o => (
                <Box
                    key={o.label}
                    display="flex"
                    alignItems="center"
                    bg={theme.colors.formColor}
                    p={2}
                    gap={1}
                    rounded="sm"
                    justifyContent="space-between"
                >
                    <Text fontSize="2xs" fontWeight="bold">
                        {o.label} :
                    </Text>
                    <Text
                        fontSize="2xs"
                        bg={theme.colors.accient}
                        fontWeight="semibold"
                        p={1}
                        rounded="sm"
                        color={theme.colors.whiteColor}
                    >
                        {formatToFixed(o.value, 2)}
                    </Text>
                </Box>
            ));
    }, [Opening, theme]);

    return (

        <Flex gap={3} align="stretch" fontFamily={theme.fonts.body2}>
    {/* LEFT – 60% */}
    <Box w="70%">
                <Box display='flex' flexDirection='column' gap={2} >
                    <Toaster />
                    <Text fontWeight="bold" fontSize="lg">
                        Transaction Master
                    </Text>

                    {/* Header Form */}
                    <Flex gap={2} wrap="wrap" align="flex-end" bg={theme.colors.formColor} p={3} rounded='xl'>

                        {/* ENTRY NO */}
                        <Box w="100px">
                            <Text fontSize="xs" mb={1}>Entry No</Text>
                            <CapitalizedInput
                                value={form.ENTRYNO}
                                field="ENTRYNO"
                                onChange={() => { }}
                                disabled
                                size="xs"

                            />
                        </Box>

                        {/* BILL NO */}
                        <Box w="100px">
                            <Text fontSize="sm" mb={1}>Bill No</Text>
                            <CapitalizedInput
                                value={form.BILLNO}
                                field="BILLNO"
                                onChange={() => { }}
                                disabled
                                size="xs"
                            />
                        </Box>

                        {/* DATE (Picker + Typing enabled) */}
                        <Box w="120px">
                            <Text fontSize="sm" mb={1}>Date</Text>

                            <DatePicker
                                selected={parseISOToDate(form.DATE)}

                                onChange={(date: Date | null) => {
                                    if (!date) return;

                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);


                                    handleChange("DATE", formatDateToISO(date));
                                }}

                                onChangeRaw={(e) => {
                                    if (!e) return;
                                    const value = (e.target as HTMLInputElement).value;

                                    // allow partial typing
                                    if (!value || value.length < 10) return;

                                    const [dd, mm, yyyy] = value.split("-");
                                    const typedDate = new Date(`${yyyy}-${mm}-${dd}`);

                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);

                                    if (typedDate > today) {
                                        e.preventDefault(); // ⛔ block typing future date
                                    }
                                }}

                                dateFormat="dd-MM-yyyy"
                                placeholderText="dd-mm-yyyy"

                                maxDate={new Date()}     // ⛔ no future dates
                                showPopperArrow={false}
                                 

                                className="w-full px-2 py-1 text-xs border border-gray-400 rounded input-date"
                                
                            />
                        </Box>

                        {/* RATE / GM */}
                        <Box w="100px">
                            <Text fontSize="sm" mb={1}>Rate / GM</Text>
                            <CapitalizedInput
                                value={form.RATEGM}
                                field="RATEGM"
                                onChange={() => { }}
                                type="number"
                                size="xs"
                            />
                        </Box>

                        {/* CUSTOMER (Search FIXED) */}
                        <Box w="300px">
                            <Combobox.Root
                                collection={customerCollection}
                                openOnClick
                                value={form.CUSTOMER ? [form.CUSTOMER] : []}
                                inputValue={getLabelByValue(
                                    customerCollection,
                                    form.CUSTOMER
                                )}
                                onValueChange={(details) => {
                                    const selectedValue = details.value[0] ?? "";

                                    setForm((prev) => ({
                                        ...prev,
                                        CUSTOMER: selectedValue, // ✅ store VALUE
                                    }));
                                }}
                                onInputValueChange={(e) => customerFilter(e.inputValue)}
                                size='xs'


                            >
                                <Combobox.Label>Customer</Combobox.Label>

                                <Combobox.Control>
                                    <Combobox.Input placeholder="Type to search" />
                                    <Combobox.IndicatorGroup>
                                        <Combobox.ClearTrigger />
                                        <Combobox.Trigger />
                                    </Combobox.IndicatorGroup>
                                </Combobox.Control>

                                <Portal>
                                    <Combobox.Positioner>
                                        <Combobox.Content>
                                            <Combobox.Empty>No customer found</Combobox.Empty>

                                            {customerCollection.items.map((item: any) => (
                                                <Combobox.Item
                                                    key={item.value}
                                                    item={item}
                                                >
                                                    {item.label}
                                                    <Combobox.ItemIndicator />
                                                </Combobox.Item>
                                            ))}
                                        </Combobox.Content>
                                    </Combobox.Positioner>
                                </Portal>
                            </Combobox.Root>
                        </Box>



                    </Flex>

                    <Flex justifyContent="end" align="center">
                        {openingItems}
                    </Flex>

                    {/* Transaction buttons */}
                    <Flex
                        gap={2}
                        wrap="wrap"
                        align="flex-end"
                        bg={theme.colors.formColor}
                        p={2}
                        rounded="md"
                    >
                        {TRANSACTIONTYPES.map((btn) => {
                            const Icon = btn.icon;

                            return (
                                <Button
                                    key={btn.value}
                                    size="xs"
                                    variant={activeButton === btn.value ? "solid" : "outline"}
                                    bg={
                                        activeButton === btn.value
                                            ? theme.colors.accient
                                            : theme.colors.primary
                                    }
                                    px={2}

                                    onClick={() => {
                                        if (!form.CUSTOMER) {
                                            toaster.create({
                                                title: "Customer Required",
                                                description: "Select customer before transaction.",
                                            });
                                            return;
                                        }

                                        setTransactionTitle(btn.label);
                                        setActiveButton(btn.value);
                                        handleAddNew
                                    }}
                                >
                                    <Icon size={12} />{btn.label}
                                </Button>
                            );
                        })}
                    </Flex>

                    <EditableTable
                        columns={columns}
                        data={rows}
                        loading={isLoading}
                        // rowKey="__rowId"
                        editingRowId={editingRowId}
                        enableInlineEditing
                        striped
                        hoverable
                        showAddButton
                        addButtonText="Add New Issue"
                        onAddNew={handleAddNew}
                        onUpdateRow={handleUpdateRow}
                        onSaveRow={handleSaveRow}
                        onCancelEdit={handleCancelEdit}
                        onRowClick={(row) => {
                            if (!editingRowId) {
                                setEditingRowId(row.__rowId);

                            }
                        }}
                        fixedHeight="400px"
                        // renderFooter={
                        //     rows.length > 0
                        //         ? () => (
                        //             <tfoot className="sticky bottom-0 bg-gray-500 dark:bg-gray-800 border-t border-[#555]">
                        //                 <tr>
                        //                     {columns.map((column, index) => (
                        //                         <td
                        //                             key={column.key}
                        //                             className={`
                        //               px-2 py-2 font-semibold
                        //               ${column.align === "right" ? "text-right" : "text-left"}
                        //               border-r border-[#555]
                        //               last:border-r-0
                        //               text-white
                        //               table-footer-10
                        //           `}
                        //                         >
                        //                             {index === 0
                        //                                 ? "TOTAL"
                        //                                 : totals[column.key] != null
                        //                                     ? Number(totals[column.key]).toFixed(2)
                        //                                     : ""}
                        //                         </td>
                        //                     ))}
                        //                 </tr>
                        //             </tfoot>
                        //         )
                        //         : undefined
                        // }

                    />

                    {/* Table */}
                    {activeButton && (
                        <Box >
                            <EditableTable
                                columns={columns}
                                data={rows}
                                loading={isLoading}
                                // rowKey="__rowId"
                                editingRowId={editingRowId}
                                enableInlineEditing
                                striped
                                hoverable
                                // showAddButton
                                // addButtonText="Add New Issue"
                                // onAddNew={handleAddNew}
                                onUpdateRow={handleUpdateRow}
                                onSaveRow={handleSaveRow}
                                onCancelEdit={handleCancelEdit}
                                onRowClick={(row) => {
                                    if (!editingRowId) {
                                        setEditingRowId(row.__rowId);

                                    }
                                }}
                                fixedHeight="400px"
                                // renderFooter={
                                //     rows.length > 0
                                //         ? () => (
                                //             <tfoot className="sticky bottom-0 bg-gray-500 dark:bg-gray-800 border-t border-[#555]">
                                //                 <tr>
                                //                     {columns.map((column, index) => (
                                //                         <td
                                //                             key={column.key}
                                //                             className={`
                                //       px-2 py-2 font-semibold
                                //       ${column.align === "right" ? "text-right" : "text-left"}
                                //       border-r border-[#555]
                                //       last:border-r-0
                                //       text-white
                                //       table-footer-10
                                //   `}
                                //                         >
                                //                             {index === 0
                                //                                 ? "TOTAL"
                                //                                 : totals[column.key] != null
                                //                                     ? Number(totals[column.key]).toFixed(2)
                                //                                     : ""}
                                //                         </td>
                                //                     ))}
                                //                 </tr>
                                //             </tfoot>
                                //         )
                                //         : undefined
                                // }
                                
                            />
                        </Box>
                    )}
                </Box>
    </Box>

    {/* RIGHT – 40% */}
    <Box w="30%" bg={theme.colors.formColor} p={3} rounded="xl">
        {/* Other fields go here */}
        <Text fontWeight="bold" fontSize="md" mb={2}>
            Additional Details
        </Text>

        {/* Example fields */}
        <Box mb={2}>
            <Text fontSize="xs" mb={1}>Remarks</Text>
           
        </Box>

        <Box mb={2}>
            <Text fontSize="xs" mb={1}>Reference No</Text>
            
        </Box>
    </Box>
</Flex>

        
    );
}
