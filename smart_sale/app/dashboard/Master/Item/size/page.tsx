"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Button,
    VStack,
    Text,
    Grid,
    GridItem,
    HStack,
    Fieldset,
    Flex,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit, FaPrint, FaFileExcel } from "react-icons/fa";

import { Toaster } from "@/components/ui/toaster";
import { CustomTable } from "@/component/table/CustomTable";
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { toastError, toastLoaded } from "@/component/toast/toast";
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/theme/themeContext";

import { useSize, useCreateSize, useUpdateSize, useDeleteSize } from "@/hooks/apiHooks/size/useSize";
import { useStoneItems } from "@/hooks/apiHooks/item/useItems";
import { getItemSizeFields } from "@/config/master/itemSize";

import { ItemSize, ItemSizePayload } from "@/types/size/Size";
import SearchBar from "@/component/search/SearchBar";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import TransactionLoader from "@/component/loader/Transactionloader";


function ItemSizeMaster() {

    const { theme } = useTheme();
    const router = useRouter();
    const { setData, setColumns, setShowSno, title } = usePrint();
    const {isOpen, status, title:loaderTitle, description, openLoader, resolveLoader, closeLoader} = useTransactionLoader();

    /* -------------------- API HOOKS -------------------- */




    const [filter, setFilter] = useState<string>('');
    const { data: itemCollection } = useStoneItems({ STUDDED: 'N' });
    const { data: itemSizeData, refetch: itemSizeRefetch } = useSize(filter);
    const { mutate: createItemSize, isPending } = useCreateSize();
    const { mutate: updateItemSize } = useUpdateSize();
    const { mutate: deleteItemSize } = useDeleteSize();

    const itemCollectionList = (Array.isArray(itemCollection) ? itemCollection : []).map(
        (item: any) => ({ label: item.itemName, value: String(item.itemId) })
    );

    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<ItemSize>({
        ITEMID: "",
        SIZENAME: "",
    });

    const [highlightedId, setHighlightedId] = useState<string | undefined>();
    console.log(highlightedId, 'highlightedId')
    const [editId, setEditId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    /* -------------------- REF HANDLERS -------------------- */
    const isSaving = useRef(false);

    /* -------------------- FORM HANDLERS -------------------- */
    const handleChange = (field: keyof ItemSizePayload, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setEditId(null);
        setForm({ ITEMID: "", SIZENAME: "" });
        focusFirst();
        setErrors({});
    };

    const validateField = (field: keyof ItemSizePayload, value: any): string | undefined => {
        switch (field) {
            case "ITEMID":
                if (!value) return "Item is required";
                break;
            case "SIZENAME":
                if (!value?.trim()) return "Size Name is required";
                break;
        }
        return undefined;
    };

    const validateForm = (existingSizes: ItemSize[], currentId?: number): boolean => {
        const newErrors: Record<string, string> = {};

        itemSizeFormFields.forEach((field) => {
            const value = form[field.name as keyof ItemSizePayload];
            console.log(value, 'value')

            // Required field validation
            if (field.required) {
                const error = validateField(field.name as keyof ItemSizePayload, value);
                if (error) newErrors[field.name] = error;
            }

            // Duplicate name check for "sizeName"
            if (field.name === "SIZENAME" && value) {
                const duplicate = existingSizes.find(
                    (size) =>
                        Number(size.ITEMID) === Number(form.ITEMID) && // ✅ same item
                        size.SIZENAME.toLowerCase() === value.toLowerCase() && // same size name
                        Number(size.SIZEID) !== Number(currentId) // ignore current row (update)
                );

                if (duplicate) {
                    newErrors[field.name] = "Size already exists for this item";
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (isSaving.current) return;
        const existingSizes = Array.isArray(itemSizeData) ? itemSizeData : [];
        const payload = {
            ITEMID: Number(form.ITEMID),
            SIZENAME: form.SIZENAME,
        };

        isSaving.current = true;

        const onDone = () => {
            isSaving.current = false;
        };
        if (editId) {
     
            // For update:
            if (!validateForm(existingSizes, Number(editId))) return;
            openLoader('update', true);
            // pass id separately for path variable
            updateItemSize({ ...payload, id: editId }, {
                onSuccess: () => {
                    resetForm();
                    itemSizeRefetch();
                    onDone();
                    setHighlightedId(editId);
                    resolveLoader("success", "update", "", true)
                },
                onError: ()=> {
                    onDone();
                    resolveLoader("error", "update", "", true)
                }
            });
        } else {
        
            if (!validateForm(existingSizes)) {
                // toastError("Please fix the errors in the form");
                return;
            }
            openLoader('save', true);
            createItemSize(payload, {
                onSuccess: () => {
                    resetForm();
                    itemSizeRefetch();
                    onDone();
                    resolveLoader("success", "save", "", true)

                },
                onError: (error) => {
                    toastError(error.message);
                    onDone();
                    resolveLoader("error", "save", "", true)
                }
            });
        }
    };

    const handleEdit = (size: ItemSize) => {

        setEditId(String(size.SIZEID) ?? null);
        // setHighlightedId( String(size.SIZEID) ?? undefined);
        console.log("Editing Item Size:", size);
        setForm({
            ITEMID: String(size.ITEMID),
            SIZENAME: size.SIZENAME,
        });
        // focusFirst();
        toastLoaded("Item Size loaded for editing");
        ScrollToTop();
    };

    /* -------------------- TABLE COLUMNS -------------------- */
    const sizeColumns = [
        { key: "index", label: "S.No" },
        { key: "ITEMID", label: "Item" },
        { key: "SIZENAME", label: "Size Name" },
        // { key: "actions", label: "Actions" },
    ];

    /* -------------------- EXPORT -------------------- */
    const handleExport = (option: string) => {
        setData(itemSizeData || []);
        setColumns([
            { key: "ITEMID", label: "Item" },
            { key: "SIZENAME", label: "Size Name" },
        ]);
        setShowSno(true);
        title?.("Item Size Master");
        router.push(`/print?export=${option}`);
    };

    /* -------------------- FORM CONFIG -------------------- */
    const itemSizeFormFields = getItemSizeFields({ itemCollection: itemCollectionList });
    const fieldSequence = itemSizeFormFields.map((f) => f.name);

    const { register, focusNext, focusFirst } = useEnterNavigation(fieldSequence, () => {
        handleSave();
    });

    useEffect(() => {
        focusFirst();
    }, []);

    useGlobalKey("Alt+s" , ()=>handleSave() , "saveTransaction");
    useGlobalKey("Alt+r", () => resetForm() ,"Reset");
    useGlobalKey("Alt+e", () => router.back(), "exit");
    useGlobalKey("Alt+u", () => handleSave(), "update");


    /* -------------------- UI -------------------- */
    return (
        <Box fontWeight="semibold" bg={theme.colors.primary} color={theme.colors.secondary}>
            <TransactionLoader
                isOpen={isOpen}
                status={status}
                title={loaderTitle}
                description={description}
                onClose={closeLoader}
            />
            <Toaster />
            <ShortcutDialog />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>
                {/* FORM SECTION */}
                <GridItem>
                    <VStack bg={theme.colors.formColor} p={4} borderRadius="xl" border="1px solid #eef">
                  

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <DynamicForm
                                    fields={itemSizeFormFields}
                                    formData={form}
                                    onChange={handleChange}
                                    register={register}
                                    focusNext={focusNext}
                                    // disabled={{ ITEMID: !!editId }}
                                    errors={errors}
                                    layout="vertical"
                                />
                            </Fieldset.Content>
                        </Fieldset.Root>

                        <HStack>
                            <Button size="xs" colorPalette="blue" loading={isPending} onClick={handleSave}>
                                <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>
                            <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                <IoIosExit /> Reset
                            </Button>
                            <Button size="xs" colorPalette="blue" onClick={() => router.back()}>
                                <IoIosExit /> Exit
                            </Button>
                        </HStack>
                    </VStack>
                </GridItem>

                {/* TABLE SECTION */}
                <GridItem minW={0}>

                    <Box bg={theme.colors.formColor} p={2} borderRadius="xl" border="1px solid #eef">
                        <Box display='flex' mb={2} gap={2} justifyContent='space-between' alignItems='center'>
                            <Text fontWeight="semibold" fontSize="small">ITEM SIZE DETAILS</Text>
                            <Flex>

                                <SearchBar
                                    searchTerm={filter}
                                    onChange={setFilter}
                                    placeholder="Search Size"
                                    size="2xs"

                                />

                                <Button variant="ghost" size="xs" color={theme.colors.green} onClick={() => handleExport("excel")}>
                                    <FaFileExcel />
                                </Button>
                                <Button variant="ghost" size="xs" color={theme.colors.primaryText} onClick={() => handleExport("pdf")}>
                                    <FaPrint />
                                </Button>
                            </Flex>
                        </Box>

                        <CustomTable
                            columns={sizeColumns}
                            data={itemSizeData || []}
                            renderRow={(size, index) => (
                                <>
                                    <Table.Cell>{index + 1}</Table.Cell>
                                    <Table.Cell>{size.ITEMNAME}</Table.Cell>
                                    <Table.Cell>{size.SIZENAME}</Table.Cell>
                                    {/* <Table.Cell>
                                        <Box display="flex" justifyContent="center">
                                            <FaEdit onClick={() => handleEdit(size)} cursor="pointer" />
                                        </Box>
                                    </Table.Cell> */}
                                </>
                            )}
                            onRowClick={(size) => handleEdit(size)}
                            headerBg="blue.800"
                            headerColor="white"
                            borderColor="white"
                            bodyBg={theme.colors.primary}
                            highlightRowId={highlightedId}
                            rowIdKey="SIZEID"
                            emptyText="No Sizes available"
                          
                        />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default ItemSizeMaster;