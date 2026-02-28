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
import { useOtherCharges, useOtherChargeById, useUpdateOtherCharges, useCreateOtherCharges, useDeleteOtherCharges } from "@/hooks/otherCharges/useOtherCharges";
import { AiOutlineSave } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { useAllMetals } from "@/hooks/metal/useMetals";
import SearchBar from "@/component/search/SearchBar";

/* ---------------- Initial Form State ---------------- */

const initialFormState: OtherChargeStateForm = {
    chargeName: "",
    amount:"",
    active:"Y",
};

/* ---------------- Table Row Type ---------------- */

export type TouchTableRow = {
    sno:number,
    chargeName: "",
    amount: "",
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
    const [metalData, setMetalData] = useState<{ label: string, value: string }[]>([])

    const [filter ,setFilter] =useState<string>('')
    /* ---------------- Hooks ---------------- */
    const router = useRouter();
    const { theme } = useTheme();
     const {setData ,setColumns ,title} = usePrint();


    const { data: otherCharges , refetch } = useOtherCharges(filter);


    const otherChargesData = otherCharges?.data ?? [];


const activeStatus = createListCollection({
        items: [
            { label: "YES", value: "Y" },
            { label: "NO", value: "N" },
        ],
    });


    const { data: metalsData } = useAllMetals();


    const createMutation = useCreateOtherCharges();
    const updateMutation = useUpdateOtherCharges();


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
        setEditId(row.sno ?? null);
        scrollToTop();
        setOriginalName(row.chargeName); // store original

        setForm({
            chargeName: row.chargeName,
            amount: row.amount,
            active:row.active,
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
    
        if (!Number(form.amount)) {
            errors.amount = "Amount is required";
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
            amount:Number(form.amount),
            active:form.active
        };

        if (editId) {
            updateMutation.mutate(
                { id: editId, data: payload },
                {
                    onSuccess: () => {
                        setHighlightRowId(editId);
                        resetForm();
                        refetch();
                    },
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: (res: any) => {
                    setHighlightRowId(res?.data?.id);
                    resetForm();
                    refetch();
                },
            });
        }
    };



    /* ---------------- Table Columns ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },
        { key: "chargeName", label: "Charge Name" },
        { key: "amount", label: "Amount" },
        { key: "active", label: "Active" },
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
        setData(Array.isArray(otherChargesData) ? otherChargesData : otherChargesData || []);
        setColumns([
            { key: "chargeName", label: "Charge Name" },
            { key: "amount", label: "Amount" },
            { key: "active", label: "Active" },
        ]);
        router.push(`/print?export=${option}`);
        title?.("Other Charges List")
    }


    /* ---------------- UI ---------------- */

    return (
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} p={2} fontWeight='semibold' gap={4}>
            <Toaster />

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
                    OTHER CHARGES
                    
                    </Text>
                    </Heading>
                  <Grid gap={2}>
                      
                        {/* CHARGE NAME */}
                        <Field.Root invalid={!!errors.chargeName}>
                            <HStack>
                                <Box minW="100px">
                                    <Field.Label fontSize="2xs">CHARGE NAME :</Field.Label>
                                </Box>
                                <Box >
                                    <CapitalizedInput
                                        field="chargeName"
                                        value={form.chargeName}
                                        onChange={handleChange}
                                        placeholder="Enter charge Name"
                                        size="2xs"
                                        maxWidth="100%"
                                        
                                    />
                                    <Field.ErrorText>{errors.chargeName}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root>

                        {/* AMOUNT */}
                        <Field.Root invalid={!!errors.chargeName}>
                            <HStack>
                                <Box minW="100px">
                                    <Field.Label fontSize="2xs">AMOUNT :</Field.Label>
                                </Box>
                                <Box >
                                    <CapitalizedInput
                                        field="amount"
                                        value={form.amount}
                                        onChange={handleChange}
                                        placeholder="Enter Amount"
                                        size="2xs"
                                        type="number"

                                    />
                                    <Field.ErrorText>{errors.amount}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root>

                                    {/* ACTIVE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">ACTIVE :</Box>
                                        <NativeSelect.Root size="xs" maxW="80px" fontSize="2xs" >
                                            <NativeSelect.Field
                                                value={form.active || "Y"}
                                                onChange={(e) => handleChange("active", e.target.value)}
                                                css={{
                                                    backgroundColor: "#eee",
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "20px",
                                                    height: "30px",
                                                    fontSize: "10px",
                                                   
                                                }}
                                            >
                                                <For each={activeStatus.items}>
                                                    {(item) => (
                                                        <option key={item.value} value={item.value}>
                                                            {item.label}
                                                        </option>
                                                    )}
                                                </For>
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Box>

                        
                        </Grid>

                       
            
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
                                Clear <IoIosExit />
                            </Button>
                        </HStack>
                    </Box>
                </Box>
            </GridItem>

            {/* -------- Table Section -------- */}
            <GridItem minW={0}>
                <Box  p={3} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    
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
                                                    color= {theme.colors.green}
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
                        bodyBg={theme.colors.primary}
                        headerBg="blue.800"
                        headerColor="white"
                        renderRow={(row, i) => (
                            <>
                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>{row.chargeName}</Table.Cell>
                                <Table.Cell>{row.amount}</Table.Cell>
                                <Table.Cell>{row.active}</Table.Cell>
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

export default OtherCharges;
