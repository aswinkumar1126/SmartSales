"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Grid,
    GridItem,
    Button,
    Heading,
    HStack,
    Table,
    Text,
    Flex,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { FiEdit } from "react-icons/fi";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";

import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { CustomTable } from "@/component/table/CustomTable";
import SearchBar from "@/component/search/SearchBar";

import { getExpenseMasterFields } from "@/config/master/ExpenseMaster";
import { CreateExpenseMast } from "@/types/expense/ExpenseMast";

import {
    useAllExpenses,
    useUpdateExpenseName,
    useCreateExpenseNames,
} from "@/hooks/apiHooks/expenseMast/useExpenseMaster";

import { useTheme } from "@/context/theme/themeContext";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import TransactionLoader from "@/component/loader/Transactionloader";

type FormErrors = Partial<Record<keyof CreateExpenseMast, string>>;

const initialForm: CreateExpenseMast = {
    expName: "",
    active: "Y",
};

function ExpenseMaster() {

    const { theme } = useTheme();
    const router = useRouter();
    const { isOpen, status, title: loaderTitle, description, openLoader, resolveLoader, closeLoader } = useTransactionLoader();

    /* ---------------- STATE ---------------- */

    const [form, setForm] = useState<CreateExpenseMast>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [editId, setEditId] = useState<number | null>(null);
    const [originalName, setOriginalName] = useState<string | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);
    const [filter, setFilter] = useState("");

    /* ---------------- API ---------------- */

    const { data: expenses, refetch } = useAllExpenses();
    const expenseList = expenses ?? [];

    const createMutation = useCreateExpenseNames();
    const updateMutation = useUpdateExpenseName();

    /* ---------------- FORM FIELDS ---------------- */

    const ExpenseForm = getExpenseMasterFields([
        { label: "YES", value: "Y" },
        { label: "NO", value: "N" },
    ]);

    /* ---------------- HANDLERS ---------------- */

    const handleChange = (field: string, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditId(null);
        setErrors({});
    };

    /* ---------------- EDIT ---------------- */

    const handleEdit = (row: any) => {
        setEditId(row.expId);
        setOriginalName(row.expName);

        setForm({
            expName: row.expName,
            active: row.active,
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /* ---------------- VALIDATION ---------------- */

    const validateForm = (): FormErrors => {
        const errors: FormErrors = {};

        const normalize = (v?: string) => v?.trim().toLowerCase();

        if (!form.expName.trim()) {
            errors.expName = "Expense Name is required";
        }

        const nameChanged =
            editId && normalize(originalName!) !== normalize(form.expName);

        const exists = expenseList.some(
            (e: any) =>
                normalize(e.expName) === normalize(form.expName) &&
                e.expId !== editId
        );

        if ((!editId && exists) || (editId && nameChanged && exists)) {
            errors.expName = "Expense name already exists";
        }

        return errors;
    };

    /* ---------------- SUBMIT ---------------- */

    const handleSubmit = () => {
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const payload = {
            expName: form.expName,
            active: form.active,
        };

        console.log(payload, 'payload');

        if (editId) {
            openLoader("update", true);
            updateMutation.mutate(
                { id: editId, ...payload },
                {
                    onSuccess: () => {
                        setHighlightRowId(editId);
                        resetForm();
                        refetch();
                        resolveLoader("success", "update", "", true)
                    },
                    onError: (error: any) => {
                        console.log(error, 'ERROR')
                        const message =
                            error?.response?.data?.message ||

                            "Something went wrong";

                        console.log("API Error:", message, error.response);
                        resolveLoader("error", "update", message, true)
                    }
                }
            );
        } else {
            openLoader("save", true);
            createMutation.mutate(payload, {
                onSuccess: (res: any) => {
                    setHighlightRowId(res?.data?.expId);
                    resetForm();
                    refetch();
                    resolveLoader("success", "save", "", true)
                },
                onError:
                    (error: any) => {
                        console.log("Error", error)
                        console.log("Error creating expense:", error.message);
                        resolveLoader("error", "save", "Error creating expense", true)
                    }

            });
        }
    };

    /* ---------------- TABLE ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },
        { key: "expName", label: "Expense Name" },
        { key: "active", label: "Active" },
        { key: "action", label: "Action", align: "center" as const },
    ];

    /* ---------------- ENTER NAVIGATION ---------------- */

    const formFields = ExpenseForm.map((f) => f.name);

    const { register, focusNext, focusFirst } = useEnterNavigation(
        formFields,
        handleSubmit
    );

    useEffect(() => {
        focusFirst();
    }, []);

    useGlobalKey("Alt+s", () => handleSubmit(), "saveTransaction");
    useGlobalKey("Alt+r", () => resetForm(), "reset");
    useGlobalKey("Alt+e", () => router.back(), "exit");
    useGlobalKey("Alt+u", () => handleSubmit(), "update");

    /* ---------------- HIGHLIGHT EFFECT ---------------- */

    useEffect(() => {
        if (!highlightRowId) return;
        const timer = setTimeout(() => setHighlightRowId(null), 2500);
        return () => clearTimeout(timer);
    }, [highlightRowId]);

    /* ---------------- UI ---------------- */

    return (
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2} color={theme.colors.primary}>
            {/* -------- FORM -------- */}
            <GridItem>
                <TransactionLoader
                    isOpen={isOpen}
                    status={status}
                    title={loaderTitle}
                    description={description}
                    onClose={closeLoader}
                />
                <ShortcutDialog />
                <Box p={3} borderRadius="lg" boxShadow="sm" bg={theme.colors.formColor}>

                    <DynamicForm
                        fields={ExpenseForm}
                        formData={form}
                        focusNext={focusNext}
                        register={register}
                        onChange={handleChange}
                        layout="vertical"
                        errors={errors}
                    />

                    <HStack justifyContent="center" mt={3}>
                        <Button
                            size="xs"
                            colorPalette="blue"
                            onClick={handleSubmit}
                            loading={
                                createMutation.isPending ||
                                updateMutation.isPending
                            }
                        >
                            <AiOutlineSave /> {editId ? "Update" : "Save"}
                        </Button>

                        <Button size="xs" onClick={resetForm}>
                            Reset <IoIosExit />
                        </Button>
                        <Button size="xs" onClick={() => router.back()}>
                            Exit <IoIosExit />
                        </Button>
                    </HStack>
                </Box>
            </GridItem>

            {/* -------- TABLE -------- */}
            <GridItem>
                <Box p={3} borderRadius="lg" boxShadow="sm" bg={theme.colors.formColor}>
                    <Flex justify="space-between" mb={2}>
                        <Heading fontSize="sm">EXPENSE LIST</Heading>
                        <Flex>
                            <SearchBar
                                searchTerm={filter}
                                onChange={setFilter}
                                placeholder="Search expense"
                                size="2xs"
                                rounded="sm"
                                minWidth="250px"
                            />
                        </Flex>

                    </Flex>

                    <CustomTable
                        columns={columns}
                        data={expenseList}
                        rowIdKey="expId"
                        highlightRowId={highlightRowId}
                        emptyText="No data available"
                        bodyBg={theme.colors.bg}
                        headerBg={theme.colors.primary}
                        headerColor="white"
                        renderRow={(row, i) => (
                            <>
                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>{row.expName}</Table.Cell>
                                <Table.Cell>{row.active}</Table.Cell>
                                <Table.Cell align="center">
                                    <FiEdit
                                        cursor="pointer"
                                        onClick={() => handleEdit(row)}
                                    />
                                </Table.Cell>
                            </>
                        )}
                    />
                </Box>
            </GridItem>
        </Grid>
    );
}

export default ExpenseMaster;