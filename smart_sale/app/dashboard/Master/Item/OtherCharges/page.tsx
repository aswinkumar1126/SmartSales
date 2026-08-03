"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Field,
    Input,
    Grid,
    GridItem,
    Button,
    Table,
    Heading,
    HStack,
    Flex,
    Text,
    NativeSelect,
    For,
    createListCollection
} from "@chakra-ui/react";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { IoIosAdd, IoIosExit } from "react-icons/io";

import { useTheme } from "@/context/theme/themeContext";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { toastError, toastLoaded } from "@/component/toast/toast";

import { CustomTable } from "@/component/table/CustomTable";
import { usePrint } from "@/context/print/usePrintContext";
import { OtherChargeForm, OtherChargeStateForm } from "@/types/others/OtherCharges";
import { useOtherCharges, useOtherChargeById, useUpdateOtherCharges, useCreateOtherCharges, useDeleteOtherCharges } from "@/hooks/apiHooks/otherCharges/useOtherCharges";
import { AiOutlineSave } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { useAllMetals } from "@/hooks/apiHooks/metal/useMetals";
import SearchBar from "@/component/search/SearchBar";

import { DynamicForm } from "@/component/form/DynamicForm";
import { OtherMasterFields } from "@/config/master/OtherChargesMaster";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";

import { useGlobalKey } from "@/components/key/useGlobalKey";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import TransactionLoader from "@/component/loader/Transactionloader";

/* ---------------- Initial Form State ---------------- */

const initialFormState: OtherChargeStateForm = {
    chargeName: "",
    chargeAmount: "",
    active: "Y",
};

/* ---------------- Table Row Type ---------------- */

export type TouchTableRow = {
    chargeId: number,
    chargeName: "",
    chargeAmount: "",
    active: "Y",
};

/* ---------------- Component ---------------- */

const OtherCharges = () => {
    /* ---------------- State ---------------- */

    const [form, setForm] = useState<OtherChargeStateForm>(initialFormState);
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);
    const [originalName, setOriginalName] = useState<string | null>(null);
    
    type FormErrors = Partial<Record<keyof OtherChargeForm, string>>;
    const [errors, setErrors] = useState<FormErrors>({});

    const [filter, setFilter] = useState<string>('')
    /* ---------------- Hooks ---------------- */
    const router = useRouter();

    const {isOpen, status, title:loaderTitle, description, openLoader, resolveLoader, closeLoader} = useTransactionLoader();
    const { theme } = useTheme();
    const { setData, setColumns, title } = usePrint();


    const { data: otherCharges, refetch } = useOtherCharges(filter);


    const otherChargesData = otherCharges?.data ?? [];


    const activeStatus = [
        { label: "YES", value: "Y" },
        { label: "NO", value: "N" },
    ]

    const getOtherChargesFields = OtherMasterFields({ active: activeStatus })


    const { data: metalsData } = useAllMetals();


    const createMutation = useCreateOtherCharges();
    const updateMutation = useUpdateOtherCharges();



    /* ---------------- Helpers ---------------- */


    const handleChange = (key: keyof OtherChargeForm, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const resetForm = () => {
        setForm(initialFormState);
        setEditId(null);
        setErrors({});
    };

    /* ---------------- Edit Handler ---------------- */

    const handleEdit = (row: TouchTableRow) => {
        console.log(row, 'row')
        setEditId(row.chargeId ?? null);
        scrollToTop();
        setOriginalName(row.chargeName); // store original

        setForm({
            chargeName: row.chargeName,
            chargeAmount: row.chargeAmount,
            active: row.active,
        });

        toastLoaded("Other charges");
    };

    /* ---------------- Validation ---------------- */

    const validateForm = (
        form: OtherChargeStateForm,
        otherChargesData: any[],
        editId?: number | null,
        originalName?: string
    ): FormErrors => {

      
        const errors: FormErrors = {};

        const normalize = (v?: string) => v?.trim().toLowerCase();

        if (!form.chargeName?.trim()) {
            errors.chargeName = "charge Name is required";
        }

        if (!Number(form.chargeAmount)) {
            errors.chargeAmount = "Amount is required";
        }

        // 🔥 Duplicate validation
        if (form.chargeName?.trim()) {

            const nameChanged =
                editId &&
                normalize(originalName) !== normalize(form.chargeName);

            const exists = otherChargesData.some((p: any) =>
                normalize(p.chargeName) === normalize(form.chargeName) &&
                p.id !== editId
            );

            if ((!editId && exists) || (editId && nameChanged && exists)) {
                errors.chargeName = "Charge Name already exists";
            }
        }

        return errors;
    };

    /* ---------------- Submit Handler ---------------- */

    const handleSubmit = () => {

        const validationErrors = validateForm(
            form,
            otherChargesData,
            editId,
            originalName ?? undefined
        );

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const payload = {
            chargeName: form.chargeName,
            chargeAmount: Number(form.chargeAmount),
            active: form.active
        };

        if (editId) {
            openLoader('update', true)
            updateMutation.mutate(
                { id: editId, data: payload },
                {
                    onSuccess: () => {
                        setHighlightRowId(editId);
                        resetForm();
                        refetch();
                        resolveLoader("success", "update", "", true)
                    },
                    onError: () => {
                        resolveLoader("error", "update", "", true)
                    }
                }
            );
        } else {
            openLoader('save', true)
            createMutation.mutate(payload, {
                onSuccess: (res: any) => {
                    setHighlightRowId(res?.data?.id);
                    resetForm();
                    refetch();
                    resolveLoader("success", "save", "", true)
                },
                onError: () => {
                    resolveLoader("error", "save", "", true)
                }
            });
        }
    };



    /* ---------------- Table Columns ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },
        { key: "chargeName", label: "Charge Name" },
        { key: "chargeAmount", label: "Amount" },
        { key: "active", label: "Active" },
        // { key: "action", label: "Action", align: "center" as const },
    ];

    /* ---------------- Row Highlight Animation ---------------- */

    useEffect(() => {
        if (!highlightRowId) return;

        const timer = setTimeout(() => setHighlightRowId(null), 2500);
        return () => clearTimeout(timer);
    }, [highlightRowId]);

    /* ---------------- Export ---------------- */
    const handleExport = (option: string) => {
        setData(Array.isArray(otherChargesData) ? otherChargesData : otherChargesData || []);
        setColumns([
            { key: "chargeName", label: "Charge Name" },
            { key: "chargeAmount", label: "Amount" },
            { key: "active", label: "Active" },
        ]);
        router.push(`/print?export=${option}`);
        title?.("Other Charges List")
    }

    const otherChargesFields = getOtherChargesFields.map(f => f.name);

    const { register, focusNext, focusFirst } = useEnterNavigation(
        otherChargesFields,
        handleSubmit
    );
    useEffect(() => {
        focusFirst()
    }, []);


    useGlobalKey("Alt+s" , ()=>handleSubmit() , "saveTransaction");
    useGlobalKey("Alt+r", () => resetForm() ,"Reset");
    useGlobalKey("Alt+e", () => router.back(), "exit");
    useGlobalKey("Alt+u", () => handleSubmit(), "update");

    /* ---------------- UI ---------------- */

    return (
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} p={2} fontWeight='semibold' gap={4}>
            <TransactionLoader
                isOpen={isOpen}
                status={status}
                title={loaderTitle}
                description={description}
                onClose={closeLoader}
            />
            <Toaster />
            <ShortcutDialog />

            {/* -------- Form Section -------- */}
            <GridItem>
                <Box p={2} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    <Heading
                        display="flex"
                        mx="auto"
                        alignItems="center"
                        justifyContent="center"
                        mb={2}
                    >
                    </Heading>
                    <DynamicForm
                        fields={getOtherChargesFields}
                        formData={form}
                        focusNext={focusNext}
                        register={register}
                        minLabelWidth="100px"
                        onChange={handleChange}
                        layout="vertical"
                        errors={errors}
                    />


                    {/* ================= ACTION BUTTONS ================= */}
                    <Box mt={2}>
                        <HStack pt={2} justifyContent="center" gap={2}>
                            <Button
                                colorPalette="blue"
                                onClick={handleSubmit}
                                size="xs"
                                loading={createMutation.isPending || updateMutation.isPending}
                            >
                                <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>

                            <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                Reset <IoIosExit />
                            </Button>
                            <Button size="xs" colorPalette="blue" onClick={() => router.back()}>
                                Exit <IoIosExit />
                            </Button>
                        </HStack>
                    </Box>
                </Box>
            </GridItem>

            {/* -------- Table Section -------- */}
            <GridItem minW={0}>
                <Box p={3} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">

                    <Box display="flex" mb={2} gap={2} alignItems="center" justifyContent="space-between">

                        <Heading fontSize="small" >
                            OTHER CHARGES LIST
                        </Heading>
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
                    </Box>
                    <CustomTable
                        columns={columns}
                        data={otherChargesData as any[]}
                        rowIdKey="sno"
                        highlightRowId={highlightRowId}
                        emptyText="No data available"
                        bodyBg={theme.colors.bg}
                        headerBg="blue.800"
                        headerColor="white"
                        renderRow={(row, i) => (
                            <>
                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>{row.chargeName}</Table.Cell>
                                <Table.Cell>{row.chargeAmount}</Table.Cell>
                                <Table.Cell>{row.active}</Table.Cell>
                                {/* <Table.Cell align="center">
                                    <Box display="flex" justifyContent="center">
                                        <FiEdit
                                            cursor="pointer"
                                            onClick={() => handleEdit(row)}
                                        />
                                    </Box>

                                </Table.Cell> */}
                            </>
                        )}
                    />
                </Box>
            </GridItem>
        </Grid>
    );
};

export default OtherCharges;
