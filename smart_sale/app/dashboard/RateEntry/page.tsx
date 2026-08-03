"use client";

import React, { useState, useEffect } from "react";
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
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { Toaster } from "@/components/ui/toaster";
import { useTheme } from "@/context/theme/themeContext";
import { useRouter } from "next/navigation";

import { toastError, toastLoaded } from "@/component/toast/toast";

import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { DynamicForm } from "@/component/form/DynamicForm";
import { useCreateRate, useRates, useAllRates } from "@/hooks/apiHooks/rate/useRate";
import { RateForm } from "@/types/rate/rate";
import { RateEntryForm } from "@/config/master/RateEntry";

import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import TransactionLoader from "@/component/loader/Transactionloader";
import { useGlobalKey } from "@/components/key/useGlobalKey";


function RateEntry() {

    const { theme } = useTheme();
    const router =useRouter();
    const {isOpen, status, title:loaderTitle, description, openLoader, resolveLoader, closeLoader} = useTransactionLoader();
    /* -------------------- API HOOKS -------------------- */

    const { mutate: createRate, isPending } = useCreateRate();

    const { data: LatestRate } = useRates();

    const { data: AllRate } = useAllRates();
    // const { mutate: updateCompany } = useUpdateCompany();

    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<RateForm>({
        "GOLD 100": "",
        "GOLD 916": "",
        "SILVER 100": "",
        "SILVER 916": "",
    });


    const [errors, setErrors] = useState<Record<string, string>>({});


    /* -------------------- HANDLERS -------------------- */
    const handleChange = (field: any, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setForm({
            "GOLD 100": "",
            "GOLD 916": "",
            "SILVER 100": "",
            "SILVER 916": "",
        });
        focusFirst();
        setErrors({});
    };


    const validateField = (field: string, value: any): string | undefined => {
        switch (field) {
            case 'GOLD 100':
                if (!value) return "Gold 24K rate is required";
                break;
            case 'GOLD 916':
                if (!value) return "Gold 916 rate  is required";
                break;
            // case 'SILVER 100':
            //     if (!value) return "Silv is required";
            //     break;
        }
        return undefined;
    };


    // Validate all fields
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        rateFormFields.forEach(field => {
            if (field.required) {
                const error = validateField(field.name, form[field.name as keyof RateForm]);
                if (error) newErrors[field.name] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };




    const handleSave = () => {
        // Validation
        if (!validateForm()) {
            toastError("Please fix the errors in the form");
            return;
        }
        const payload = {
            "GOLD 100": Number(form["GOLD 100"]),
            "GOLD 916": Number(form["GOLD 916"]),
            "SILVER 100": Number(form["SILVER 100"]),
            "SILVER 916": Number(form["SILVER 916"]),
        }
        openLoader('save', true)

        createRate(payload, {
            onSuccess: () => {
                toastLoaded("Rate Created Successfully");
                resetForm();
                resolveLoader("success", "save", "", true)
            },
            onError: () => {
                resolveLoader("error", "save", "Failed to create rate", true)
            }

        });

    }
    /* -------------------- TABLE COLUMNS -------------------- */
    // const CompanyColumn = [
    //     { key: 'index', label: 'Sno' },
    //     { key: 'COMPANYID', label: 'Company Id' },
    //     { key: 'COMPANYNAME', label: 'Company Name' },
    //     { key: 'ACTIVE', label: 'Active' },
    //     { key: 'actions', label: 'Actions' },
    // ];

    /* -------------------- FORM CONFIG -------------------- */
    const rateFormFields = RateEntryForm();
    const fieldSequence = rateFormFields.map(f => f.name);

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
        <Box fontWeight="semibold" bg={theme.colors.bg} color={theme.colors.secondary}>
            <TransactionLoader
                isOpen={isOpen}
                status={status}
                title={loaderTitle}
                description={description}
                onClose={closeLoader}
            />
            <Toaster />
            <ShortcutDialog />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1.5fr" }} gap={2}>
                {/* FORM SECTION */}
                <GridItem>
                    <VStack bg={theme.colors.formColor} p={4} borderRadius="xl" border="1px solid #eef">
                        <Text fontSize="small" fontWeight="600">RATE ENTRY </Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <DynamicForm
                                    fields={rateFormFields}
                                    formData={form}
                                    onChange={handleChange}
                                    register={register}
                                    focusNext={focusNext}
                                    errors={errors}
                                    layout="vertical"
                                />
                            </Fieldset.Content>
                        </Fieldset.Root>

                        <HStack>
                            <Button size="xs" colorPalette="blue" loading={isPending} onClick={handleSave}>
                                <AiOutlineSave /> Save
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
                    {/* <Box bg={theme.colors.formColor} p={2} borderRadius="xl" border="1px solid #eef">
                        <Box display='flex' mb={2} gap={2} justifyContent='space-between' alignItems='center'>
                            <Text fontWeight="semibold" fontSize="small">COMPANY DETAILS</Text>
                            <Flex>
                                <Button variant="ghost" size="xs" color={theme.colors.green} onClick={() => handleExport("excel")}>
                                    <FaFileExcel />
                                </Button>
                                <Button variant="ghost" size="xs" color={theme.colors.primaryText} onClick={() => handleExport("pdf")}>
                                    <FaPrint />
                                </Button>
                            </Flex>
                        </Box>

                        <CustomTable
                            columns={CompanyColumn}
                            data={companies}
                            renderRow={(company, index) => (
                                <>
                                    <Table.Cell>{index + 1}</Table.Cell>
                                    <Table.Cell>{company.COMPANYID}</Table.Cell>
                                    <Table.Cell>{company.COMPANYNAME}</Table.Cell>
                                    <Table.Cell textAlign="center">{company.ACTIVE}</Table.Cell>
                                    <Table.Cell>
                                        <Box display="flex" justifyContent="center">
                                            <FaEdit onClick={() => handleEdit(company)} cursor="pointer" />
                                        </Box>
                                    </Table.Cell>
                                </>
                            )}
                            headerBg="blue.800"
                            headerColor="white"
                            borderColor="white"
                            bodyBg={theme.colors.bg}
                            highlightRowId={highlightedId ? Number(highlightedId) : null}
                            rowIdKey="COMPANYID"
                            emptyText="No companies available"
                        />
                    </Box> */}
                </GridItem>
            </Grid>
        </Box>
    );
}

export default RateEntry;