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
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { Toaster } from "@/components/ui/toaster";
import { useTheme } from "@/context/theme/themeContext";
import {
    useAllCompanies,
    useCompanyById,
    useCreateCompany,
    useUpdateCompany,
} from "@/hooks/apiHooks/company/useCompany";
import { useAllStates } from "@/hooks/apiHooks/state/useStates";
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { CreateCompanyPayload, Company } from "@/service/CompanyService";
import { toastError, toastLoaded } from "@/component/toast/toast";
import { CustomTable } from "@/component/table/CustomTable";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { DynamicForm } from "@/component/form/DynamicForm";
import { getCompanyFormFields } from "@/config/master/CompanyMaster";

function CompanyMaster() {
    const { theme } = useTheme();
    const router = useRouter();
    const { setData, setColumns, setShowSno, title } = usePrint();

    /* -------------------- API HOOKS -------------------- */
    const { data, refetch: companyRefetch } = useAllCompanies();
    const companies = data?.data ?? [];

    const { data: allStates } = useAllStates();
    const { mutate: createCompany, isPending } = useCreateCompany();
    const { mutate: updateCompany } = useUpdateCompany();

    const stateOptions = (allStates || []).map((s: any) => ({
        label: s.stateName,
        value: String(s.stateId),
    }));

    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<CreateCompanyPayload>({
        COMPANYID: "",
        COMPANYNAME: "",
        ADDRESS1: "",
        ADDRESS2: "",
        ADDRESS3: "",
        ADDRESS4: "",
        AREACODE: "",
        PANNO: "",
        PHONE: "",
        EMAIL: "",
        GSTNO: "",
        ACTIVE: "Y",
        STATEID: "24",
        LOGO: null, // Changed to null for image
    });

    const [highlightedId, setHighlightedId] = useState<number>();
    const [logoFile, setLogoFile] = useState<File | null>(null); // Store file separately
    const [editId, setEditId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    /* -------------------- FETCH COMPANY FOR EDIT -------------------- */
    const { data: companyById } = useCompanyById(editId ?? '');
    const company = companyById?.data;

    useEffect(() => {
        if (!company) return;
        setForm({
            COMPANYID: company.COMPANYID,
            COMPANYNAME: company.COMPANYNAME,
            ADDRESS1: company.ADDRESS1 ?? "",
            ADDRESS2: company.ADDRESS2 ?? "",
            ADDRESS3: company.ADDRESS3 ?? "",
            ADDRESS4: company.ADDRESS4 ?? "",
            AREACODE: company.AREACODE ?? "",
            PANNO: company.PANNO ?? "",
            PHONE: company.PHONE ?? "",
            EMAIL: company.EMAIL ?? "",
            GSTNO: company.GSTNO ?? "",
            ACTIVE: company.ACTIVE ?? "Y",
            STATEID: String(company.STATEID) ?? "24",
            LOGO: company.LOGO ?? null, // Set existing logo
        });

        // If there's an existing logo URL, we might want to show preview
        if (company.LOGO) {
            setLogoFile(null); // Reset file, but keep the URL in form.LOGO
        }

        setTimeout(() => {
            toastLoaded("Company");
            ScrollToTop();
        }, 0);
    }, [company]);

    useEffect(() => {
        if (!highlightedId) return;
        const timer = setTimeout(() => setHighlightedId(undefined), 3000);
        return () => clearTimeout(timer);
    }, [highlightedId]);

    /* -------------------- HANDLERS -------------------- */
    const handleChange = (field: any, value: any) => {
        // Handle image/logo change
        if (field === 'LOGO') {
            // Value will be the image object from CapitalizedInput
            if (value && value.file) {
                setLogoFile(value.file);
                setForm((prev) => ({ ...prev, [field]: value.base64 }));
            } else {
                setLogoFile(null);
                setForm((prev) => ({ ...prev, [field]: null }));
            }
        } else {
            setForm((prev) => ({ ...prev, [field]: value }));
        }
    };

    const resetForm = () => {
        setEditId(null);
        setLogoFile(null);
        setForm({
            COMPANYID: "",
            COMPANYNAME: "",
            ADDRESS1: "",
            ADDRESS2: "",
            ADDRESS3: "",
            ADDRESS4: "",
            AREACODE: "",
            PANNO: "",
            PHONE: "",
            EMAIL: "",
            GSTNO: "",
            ACTIVE: "Y",
            STATEID: "24",
            LOGO: null,
        });
        if (focusFirst) focusFirst();
        setErrors({});
    };

    const validateField = (field: string, value: any): string | undefined => {
        switch (field) {
            case 'COMPANYID':
                if (!value) return "Company ID is required";
                if (value.length > 3) return "Company ID must be at most 3 characters";
                break;
            case 'COMPANYNAME':
                if (!value?.trim()) return "Company Name is required";
                break;
            case 'STATEID':
                if (!value) return "State is required";
                break;
        }
        return undefined;
    };

    // Validate all fields
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        const companyFormFields = getCompanyFormFields(stateOptions, editId);

        companyFormFields.forEach(field => {
            if (field.required) {
                const error = validateField(field.name, form[field.name as keyof CreateCompanyPayload]);
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

        if (editId) {
            updateCompany({
                id: editId,
                payload: form,
                logo: logoFile, // Pass the file separately
            }, {
                onSuccess: () => {
                    companyRefetch();
                    resetForm();
                    setHighlightedId(Number(editId));
                }
            });
        } else {
            createCompany({
                payload: form,
                logo: logoFile, // Pass the file separately
            }, {
                onSuccess: () => {
                    companyRefetch();
                    resetForm();
                }
            });
        }
    };

    const handleEdit = (company: Company) => {
        setEditId(company.COMPANYID);
        if (focusFirst) focusFirst();
    };

    /* -------------------- TABLE COLUMNS -------------------- */
    const CompanyColumn = [
        { key: 'index', label: 'Sno' },
        { key: 'COMPANYID', label: 'Company Id' },
        { key: 'COMPANYNAME', label: 'Company Name' },
        { key: 'ACTIVE', label: 'Active' },
        { key: 'actions', label: 'Actions' },
    ];

    /* -------------------- EXPORT -------------------- */
    const handleExport = (option: string) => {
        setData(companies);
        setColumns([
            { key: "COMPANYID", label: "Company Id" },
            { key: "COMPANYNAME", label: "Company Name" },
            { key: 'ACTIVE', label: 'Active' },
        ]);
        setShowSno(true);
        title?.("Company Master");
        router.push(`/print?export=${option}`);
    };

    /* -------------------- FORM CONFIG -------------------- */
    const companyFormFields = getCompanyFormFields(stateOptions, editId);
    const fieldSequence = companyFormFields.map(f => f.name);

    const { register, focusNext, focusFirst } = useEnterNavigation(fieldSequence, () => {
        handleSave();
    });

    /* -------------------- UI -------------------- */
    return (
        <Box fontWeight="semibold" bg={theme.colors.primary} color={theme.colors.secondary}>
            <Toaster />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>
                {/* FORM SECTION */}
                <GridItem>
                    <VStack bg={theme.colors.formColor} p={4} borderRadius="xl" border="1px solid #eef">
                        <Text fontSize="small" fontWeight="600">COMPANY CREATION</Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <DynamicForm
                                    fields={companyFormFields}
                                    formData={form}
                                    onChange={handleChange}
                                    register={register}
                                    focusNext={focusNext}
                                    disabled={{ COMPANYID: !!editId }}
                                    errors={errors}
                                    layout="vertical"
                                    gap={2}
                                />
                            </Fieldset.Content>
                        </Fieldset.Root>

                        <HStack>
                            <Button size="xs" colorPalette="blue" loading={isPending} onClick={handleSave}>
                                <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>
                            <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                <IoIosExit /> Exit
                            </Button>
                        </HStack>
                    </VStack>
                </GridItem>

                {/* TABLE SECTION */}
                <GridItem minW={0}>
                    <Box bg={theme.colors.formColor} p={2} borderRadius="xl" border="1px solid #eef">
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
                            bodyBg={theme.colors.primary}
                            highlightRowId={highlightedId ? Number(highlightedId) : null}
                            rowIdKey="COMPANYID"
                            emptyText="No companies available"
                        />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default CompanyMaster;