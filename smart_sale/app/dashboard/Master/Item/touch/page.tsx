"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Box,
    Field,
    Grid,
    GridItem,
    Button,
    Table,
    Heading,
    HStack,
    Text,
    Flex,
} from "@chakra-ui/react";

import { useItems, useStoneItems } from "@/hooks/apiHooks/item/useItems";
import useTouchMastCreate from "@/hooks/apiHooks/touch/useTouchMastCreate";
import { useModifyTouchMasterById } from "@/hooks/apiHooks/touch/useTouchMastModify";
import { useTouchMastData } from "@/hooks/apiHooks/touch/useTouchMastData";

import { TouchMaster } from "@/types/touch/touch";
import { CustomTable } from "@/component/table/CustomTable";
import { FiEdit } from "react-icons/fi";
import { useTheme } from "@/context/theme/themeContext";
import { toastLoaded } from "@/component/toast/toast";
import { Toaster } from "@/components/ui/toaster";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { formatToFixed } from "@/utils/format/numberFormat";
import { FaPrint } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { FaFileExcel } from "react-icons/fa";

import { AccountTypeList } from "@/data/ACCOUNTtYPE/AccountType";

import { useAllAccountHead } from "@/hooks/apiHooks/accountHead/useAccountHead";

import { useTouchMasterDataById } from "@/hooks/apiHooks/touch/useTouchMastById";

import { usePrint } from "@/context/print/usePrintContext";
import SearchBar from "@/component/search/SearchBar";

import { TouchMasterFormConfig } from "@/config/master/TouchMaster";
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { IoIosExit } from "react-icons/io";
import { AiOutlineSave } from "react-icons/ai";

/* ---------------- Initial State ---------------- */

const initialFormState: TouchMaster = {
    actype: "",
    accode: "",
    itemId: "",
    touch: "",
    calmode: "",
};

export type TouchTableRow = {
    sno: number;
    acname: string;
    actype: string;
    itemName: string;
    touch: number;
    calmode : string;
};

/* ---------------- Component ---------------- */

const TouchMasterForm = () => {

    const [form, setForm] = useState<TouchMaster>(initialFormState);
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof TouchMaster, string>>>({});
    const [filter, setFilter] = useState<string>('');

    const { theme } = useTheme();
    const router = useRouter();
    const { setData, setColumns, setShowSno, title } = usePrint();

    /* ---------------- Hooks ---------------- */

    const { data: touchData = [], refetch } = useTouchMastData(filter);
    const { data: touchDatabyId, refetch: touchDataRefetch } = useTouchMasterDataById(editId);

    const accountType = form.actype?.trim().toUpperCase() || undefined;
  
    console.log(touchData,'touchData')

    const { data: allAccounts, refetch: accountRefetch } = useAllAccountHead(accountType);
    const { data: items } = useStoneItems();

    const createMutation = useTouchMastCreate();
    const updateMutation = useModifyTouchMasterById();

    /* ---------------- Memoized Lists ---------------- */

    const allAccountsList = useMemo(() => {
        const accounts = Array.isArray(allAccounts?.data?.acheads) ? allAccounts.data.acheads : [];
        return accounts.map((acc: any) => ({
            label: acc.ACNAME,
            value: String(acc.ACCODE),
        }));
    }, [allAccounts]);

    const allItemsList = useMemo(() => {
        return (items ?? []).map((item: any) => ({
            label: item.itemName,
            value: String(item.itemId),
        }));
    }, [items]);

    /* ---------------- FORM CONFIG ---------------- */
   

    const formConfig = TouchMasterFormConfig({
        collection: {
            actype: AccountTypeList,
            accode: allAccountsList,
            itemId: allItemsList,
            calMode: [
                { label: "GRS WT", value: "GRSWT" },
                { label: "NET WT", value: "NETWT" },
            ]
        },
        disabled: {
            isAccode: form.actype ? false : true,
        }
    }
    );

    /* ---------------- Form Handlers ---------------- */

    const handleChange = (key: keyof TouchMaster, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleEdit = (row: any) => {
        setEditId(row.sno);
        scrollToTop();
        toastLoaded("Touch Master");
    };

    const resetForm = () => {
        setForm(initialFormState);
        setEditId(null);
        setErrors({});
        setTimeout(()=>focusFirst(),50);
    };

    /* ---------------- Sync Edit Data ---------------- */

    useEffect(() => {
        if (!touchDatabyId || editId === null) return;

        setForm((prev) => {
            const next = {
                accode: touchDatabyId.accode ?? "",
                actype: touchDatabyId.actype ?? "",
                itemId: touchDatabyId.itemId ?? "",
                touch: String(touchDatabyId.touch ?? ""),
                calmode: touchDatabyId.calmode ?? "",
            };

            // Prevent unnecessary update → helps avoid loops
            if (
                prev.accode === next.accode &&
                prev.actype === next.actype &&
                prev.itemId === next.itemId &&
                prev.touch === next.touch &&
                prev.calmode === next.calmode
            ) {
                return prev;
            }

            return next;
        });
    }, [touchDatabyId, editId]);

    useEffect(() => {
        if (editId !== null) {
            touchDataRefetch();
        }
    }, [editId, touchDataRefetch]);

    /* ---------------- Validation & Submit ---------------- */

    const payload = {
        actype: form.actype,
        accode: form.accode,
        itemId: Number(form.itemId),
        touch: Number(form.touch),
        calmode: form.calmode,
    };

    const validateForm = (form: TouchMaster): Partial<Record<keyof TouchMaster, string>> => {
        const errs: Partial<Record<keyof TouchMaster, string>> = {};

        if (!form.actype) errs.actype = "Company type is required";
        if (!form.accode) errs.accode = "Company is required";
        if (!form.itemId) errs.itemId = "Item is required";
        // if (!form.calmode) errs.calmode = "Calculation Mode is required";

        if (!form.touch) {
            errs.touch = "Touch is required";
        } else if (Number(form.touch) <= 0) {
            errs.touch = "Touch must be greater than 0";
        }

        const isDuplicate = touchData?.some(
            (item: any) =>
                form.actype?.toLowerCase() === item.actype?.toLowerCase() &&
                Number(form.accode) === Number(item.accode) &&
                Number(form.itemId) === Number(item.itemId) &&
                Number(item.sno) !== Number(editId)
        );

        if (isDuplicate) {
            errs.itemId = "Duplicate entry already exists";
        }

        return errs;
    };

    const handleSubmit = () => {

        console.log("triggers");
        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});

        if (editId) {
            updateMutation.mutate(
                { id: editId, formData: payload },
                {
                    onSuccess: () => {
                        setHighlightRowId(editId);
                        resetForm();
                        refetch();

                    },
                }
            );
        } else {
            console.log(payload,'payload')
            createMutation.mutate(payload, {
                onSuccess: (res: any) => {
                    const createdId = res?.data?.id;
                    setHighlightRowId(createdId);
                    resetForm();
                    refetch();
                },
            });
        }
    };

    /* ---------------- Table Columns ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },
        { key: "acname", label: "Company Name" },
        { key: "actype", label: "Company Type" },
        { key: "itemName", label: "Item Name" },
        { key: "touch", label: "Touch", align: "center" as const },
        { key: "calmode", label: "Cal Mode", align: "center" as const },

        { key: "action", label: "Action", align: "center" as const },
    ];

    const handleExport = (option: string) => {
        setData(touchData);
        setColumns([
            { key: "acname", label: "Company Name" },
            { key: "actype", label: "Company Type" },
            { key: "itemName", label: "Item Name" },
            { key: "touch", label: "Touch", align: "center" as const },
            { key: "calmode", label: "Cal Mode", align: "center" as const },
            { key: "active", label: "Active" },
        ]);
        setShowSno(true)
        title?.("Touch Master List")
        router.push(`/print?export=${option}`);
    }


    /* ------------ Highlight Timeout ---------------- */

    useEffect(() => {
        if (!highlightRowId) return;
        const timer = setTimeout(() => setHighlightRowId(null), 2500);
        return () => clearTimeout(timer);
    }, [highlightRowId]);

    
    const formFieldName = formConfig.map(field => field.name);

    const { focusFirst, focusNext, register } = useEnterNavigation(formFieldName , ()=>handleSubmit());

    useEffect(()=>{
        
            focusFirst();
        
    }, [focusFirst]) ;
    /* ---------------- UI ---------------- */

    return (
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>
            <Toaster />

            {/* FORM */}
            <GridItem bg={theme.colors.formColor} p={2} rounded={'xl'} gap={2}>
                <DynamicForm 
                    formData={form}
                    onChange={handleChange}
                    register={register}
                    focusNext={focusNext}
                    fields={formConfig}
                    layout="vertical"
                    errors={errors}


                />
                <Box mt={2}>
                <Flex justify={'center'} gap={2}>
                  
                    <Button
                        size="xs"   
                        colorPalette={'blue'}
                        onClick={()=>handleSubmit()}
                       
                    >
                           <AiOutlineSave /> {editId ? "Update" : "Save"}
                    </Button>
                        <Button

                            size="xs"
                            colorPalette={'blue'}
                            onClick={() => resetForm()}

                        >
                            <IoIosExit /> Exit
                        </Button>
                </Flex>
                </Box>
            </GridItem>

            {/* TABLE */}
            <GridItem minW={0}>
                <Box p={5} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    <Heading
                        display="flex"

                        mb={2}
                        gap={3}
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Text fontSize='small'>TOUCH MASTER LIST</Text>

                        <Box display='flex' gap={1}>


                            <Box >
                                <SearchBar
                                    searchTerm={filter}
                                    onChange={setFilter}
                                    placeholder="Search account masters"
                                    size="2xs"

                                />
                            </Box>
                            <Flex>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    color={theme.colors.green}
                                    _hover={{ color: "black" }}
                                    onClick={() => handleExport("excel")}
                                    aria-label="Export Excel"
                                >
                                    <FaFileExcel />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    color={theme.colors.primaryText}
                                    _hover={{ color: "black" }}
                                    onClick={() => handleExport("pdf")}
                                    aria-label="Export PDF"
                                >
                                    <FaPrint />
                                </Button>
                            </Flex>
                        </Box>
                    </Heading>

                    <CustomTable<TouchTableRow>
                        columns={columns}
                        data={touchData as TouchTableRow[]}
                        renderRow={(row: any, i: number) => (
                            <>
                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>{row.acname}</Table.Cell>
                                <Table.Cell>
                                    {AccountTypeList.find((item) => item.value === row.actype)?.label || row.actype}
                                </Table.Cell>
                                <Table.Cell>{row.itemName}</Table.Cell>
                                <Table.Cell textAlign="right">{formatToFixed(row.touch, 1)}</Table.Cell>
                                <Table.Cell textAlign="left">{row.calmode}</Table.Cell>
                                <Table.Cell align="center">
                                    <Box display="flex" justifyContent="center" alignItems="center">
                                        <FiEdit cursor="pointer" onClick={() => handleEdit(row)} />
                                    </Box>
                                </Table.Cell>
                            </>
                        )}
                        emptyText="No data available"
                        bodyBg={theme.colors.primary}
                        size="sm"
                        headerBg="blue.800"
                        headerColor="white"
                        rowIdKey="sno"
                        highlightRowId={highlightRowId}
                    />
                </Box>
            </GridItem>
        </Grid>
    );
};

export default TouchMasterForm;