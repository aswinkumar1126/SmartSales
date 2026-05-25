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
    Text
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
import { pureGoldMastForm } from "@/types/pureGold/pureGold";
import { usePureGoldNames, usePureGoldNameById } from "@/hooks/apiHooks/pureGoldMast/usePureGoldMastData";
import { useCreatePureGoldNmae } from "@/hooks/apiHooks/pureGoldMast/usePureGoldMastCreate";
import { useUpdatePureGoldName } from "@/hooks/apiHooks/pureGoldMast/usePureGoldMastUpdate";
import { AiOutlineSave } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { formatToFixed } from "@/utils/format/numberFormat";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { useAllMetals } from "@/hooks/apiHooks/metal/useMetals";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { safeValue } from "@/utils/comboBox/safeValue";
import SearchBar from "@/component/search/SearchBar";

import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { DynamicForm } from "@/component/form/DynamicForm";
import { pureGoldNameFields } from "@/config/master/PureGoldMaster";

import { useGlobalKey } from "@/components/key/useGlobalKey";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import TransactionLoader from "@/component/loader/Transactionloader";

/* ---------------- Initial Form State ---------------- */

const initialFormState: pureGoldMastForm = {
    pureGoldName: "",
    metalId: "",
    // weight: "",
    // actualTouch: "",
    // actualPure: "",
};

/* ---------------- Table Row Type ---------------- */

export type TouchTableRow = {
    pureId?: number;
    sno: number;
    pureGoldName: string;
    metalId?: string;
    metalName?: string;
    // weight: number;
    // actualTouch: number;
    // actualPure: number;

};

/* ---------------- Component ---------------- */

const PureGoldMaster = () => {
    /* ---------------- State ---------------- */

    const [form, setForm] = useState<pureGoldMastForm>(initialFormState);
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);
    const [originalName, setOriginalName] = useState<string | null>(null);
    type FormErrors = Partial<Record<keyof pureGoldMastForm, string>>;
    const [errors, setErrors] = useState<FormErrors>({});
    const [metalData, setMetalData] = useState<{ label: string, value: string }[]>([])

    const [filter, setFilter] = useState<string>('');


    const {isOpen, status, title:loaderTitle, description, openLoader, resolveLoader, closeLoader} = useTransactionLoader();
    const getPureGoldFields = pureGoldNameFields({ metal: metalData });

    /* ---------------- Hooks ---------------- */
    const router = useRouter();
    const { theme } = useTheme();
    const { setData, setColumns, title } = usePrint();


    const { data: pureGoldData = [], refetch } = usePureGoldNames(filter);

    const { data: metalsData } = useAllMetals();


    const createMutation = useCreatePureGoldNmae();
    const updateMutation = useUpdatePureGoldName();


    /* --------------- ComboBox Data ------------- */
    useEffect(() => {
        if (!Array.isArray(metalsData)) return;
        if (!metalsData.length) return;

        const fetchedData = metalsData.map((m: any) => ({
            label: m.metalName,
            value: m.metalId,
        }));

        setMetalData(fetchedData);
    }, [metalsData]);

    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            metalId: metalData[0]?.value || ''

        }))
    }, [metalData]);
    console.log(form, 'formtoupdate')


    /* ---------------- Helpers ---------------- */



    const handleChange = (key: keyof pureGoldMastForm, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const resetForm = () => {
        setForm({ ...initialFormState, metalId: metalData[0]?.value || '' });
        setEditId(null);

        setErrors({});
    };

    /* ---------------- Edit Handler ---------------- */

    const handleEdit = (row: TouchTableRow) => {
        setEditId(row.pureId ?? null);
        scrollToTop();
        setOriginalName(row.pureGoldName); // store original

        setForm({
            pureGoldName: row.pureGoldName,
            metalId: row.metalId ?? '',
            // weight: row.weight?.toString() ?? "",
            // actualPure: row.actualPure?.toString() ?? "",
            // actualTouch: row.actualTouch?.toString() ?? ""
        });

        toastLoaded("Pure Gold Master");
    };

    /* ---------------- Validation ---------------- */

    const validateForm = (
        form: pureGoldMastForm,
        pureGoldData: any[],
        editId?: number | null,
        originalName?: string
    ): FormErrors => {

        const errors: FormErrors = {};

        const normalize = (v?: string) => v?.trim().toLowerCase();

        if (!form.pureGoldName?.trim()) {
            errors.pureGoldName = "Pure Gold Name is required";
        }

        if (!form.metalId) {
            errors.metalId = "Metal Name is required";
        }

        // 🔥 Duplicate validation
        if (form.pureGoldName?.trim()) {

            const nameChanged =
                editId &&
                normalize(originalName) !== normalize(form.pureGoldName);

            const exists = pureGoldData.some((p: any) =>
                normalize(p.pureGoldName) === normalize(form.pureGoldName) &&
                p.id !== editId
            );

            if ((!editId && exists) || (editId && nameChanged && exists)) {
                errors.pureGoldName = "Pure Gold Name already exists";
            }
        }

        return errors;
    };

    /* ---------------- Submit Handler ---------------- */

    const handleSubmit = () => {
        console.log('triggers')
        const validationErrors = validateForm(
            form,
            pureGoldData,
            editId,
            originalName ?? undefined
        );
        console.log(validationErrors, 'validationErrors')

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const payload = {
            pureGoldName: form.pureGoldName,
            metalId: form.metalId,
            // weight: form.weight ? parseFloat(form.weight) : undefined,
            // actualPure: form.actualPure ? parseFloat(form.actualPure) : undefined,
            // actualTouch: form.actualTouch ? parseFloat(form.actualTouch) : undefined,
        };
        console.log(payload, 'payload')

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
                        toastError("Error updating Pure Gold Name");
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
                    toastError("Error creating Pure Gold Name");
                    resolveLoader("error", "save", "", true)
                }
            });
        }
    };



    useGlobalKey("Alt+s" , ()=>handleSubmit() , "saveTransaction");
    useGlobalKey("Alt+r", () => resetForm() ,"Reset");
    useGlobalKey("Alt+e", () => router.back(), "exit");
    useGlobalKey("Alt+u", () => handleSubmit(), "update");

    /* ---------------- Table Columns ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },
        { key: "metalName", label: "Metal Type" },
        { key: "pureGoldName", label: "Pure Gold Name" },
        // { key: "weight", label: "Weight" ,align : "end" as const },
        // { key: "actualPure", label: "Actual Pure", align: "end" as const },
        // { key: "actualTouch", label: "Actual Touch", align: "center" as const },
        { key: "action", label: "Action", align: "center" as const },
    ];

    /* ---------------- Row Highlight Animation ---------------- */

    useEffect(() => {
        if (!highlightRowId) return;

        const timer = setTimeout(() => setHighlightRowId(null), 2500);
        return () => clearTimeout(timer);
    }, [highlightRowId]);

    /* ---------------- Export ---------------- */
    const handleExport = (option: string) => {
        setData(Array.isArray(pureGoldData) ? pureGoldData : pureGoldData || []);
        setColumns([
            { key: "metalName", label: "Metal Type" },
            { key: "pureGoldName", label: "Pure Gold Name" },
            // { key: "weight", label: "Weight", align: 'end' as const, allowTotal: true },
            // { key: "actualTouch", label: "Actual Touch", align: 'end' as const, },
            // { key: "actualPure", label: "Actual Pure", align: 'end' as const, allowTotal: true },
        ]);
        router.push(`/print?export=${option}`);
        title?.("Pure Gold Opening Master")
    }

    const formFieldName = getPureGoldFields.map(f => f.name);
    const { register, focusFirst, focusNext } = useEnterNavigation(formFieldName, () => handleSubmit())

    useEffect(() => {
        focusFirst();
    }, [])
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
                        <Text fontSize="small" fontWeight="semibold" >
                            PURE GOLD MASTER

                        </Text>
                    </Heading>
                    <Box display="grid" gap={2}>
                        <DynamicForm
                            fields={getPureGoldFields}
                            formData={form}
                            register={register}
                            onChange={handleChange}
                            focusNext={focusNext}
                            layout="vertical"
                            errors={errors}
                        />
                    </Box>
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
                            <Button size="xs" onClick={()=>router.back()} colorPalette="blue">
                                <IoIosExit /> Exit
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
                            PURE GOLD MASTER LIST
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
                    <CustomTable<TouchTableRow>
                        columns={columns}
                        data={pureGoldData as TouchTableRow[]}
                        rowIdKey="sno"
                        highlightRowId={highlightRowId}
                        emptyText="No data available"
                        bodyBg={theme.colors.primary}
                        headerBg="blue.800"
                        headerColor="white"
                        renderRow={(row, i) => (
                            <>
                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>{row.metalName}</Table.Cell>
                                <Table.Cell>{row.pureGoldName}</Table.Cell>
                                {/* <Table.Cell textAlign="end">{formatToFixed(row.weight ,2)} </Table.Cell>
                                <Table.Cell textAlign="end" >{formatToFixed(row.actualPure , 2) }</Table.Cell>
                                <Table.Cell textAlign="end">
                                    {formatToFixed(row.actualTouch,2)}
                                </Table.Cell> */}
                                <Table.Cell align="center">
                                    <Box display="flex" justifyContent="center">
                                        <FiEdit
                                            cursor="pointer"
                                            onClick={() => handleEdit(row)}
                                        />
                                    </Box>

                                </Table.Cell>
                            </>
                        )}
                    />
                </Box>
            </GridItem>
        </Grid>
    );
};

export default PureGoldMaster;
