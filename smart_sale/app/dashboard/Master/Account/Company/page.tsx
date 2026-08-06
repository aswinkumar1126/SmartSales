"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { CreateCompanyPayload, Company } from "@/service/CompanyService";
import { toastError, toastLoaded } from "@/component/toast/toast";
import { DataTable, createDataTableColumns } from "@/component/table/DataTable";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { DynamicForm } from "@/component/form/DynamicForm";
import { getCompanyFormFields } from "@/config/master/CompanyMaster";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import TransactionLoader from "@/component/loader/Transactionloader";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import { FiRefreshCw } from "react-icons/fi";
import { Tooltip } from "@/components/ui/tooltip";

const companyHelper = createDataTableColumns<Company>();

function CompanyMaster() {

    const { theme } = useTheme();
    const { isOpen, status, title: loaderTitle, description, openLoader, resolveLoader, closeLoader } = useTransactionLoader();

    const router = useRouter();

    const { setData, setColumns, setShowSno, title } = usePrint();

    /* -------------------- API HOOKS -------------------- */
    const { data, isLoading: companyLoading, refetch: companyRefetch } = useAllCompanies();
    const companies = data?.data ?? [];

    const { data: allStates } = useAllStates();
    const { data: showEditIcon } = useSoftControlById('EDIT_ICON');
    const showEditIcons = showEditIcon?.CTLTEXT === "Y";
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
            openLoader('update', true);
            updateCompany({
                id: editId,
                payload: form,
                logo: logoFile, // Pass the file separately
            }, {
                onSuccess: () => {
                    companyRefetch();
                    resetForm();
                    setHighlightedId(Number(editId));
                    setTimeout(() => resolveLoader("success", "update", "", true), 500);
                },
                onError: () => {
                    setTimeout(() => resolveLoader("error", "update", "", true), 500);
                }
            });
        } else {
            openLoader('save', true);
            createCompany({
                payload: form,
                logo: logoFile,
            }, {
                onSuccess: () => {
                    companyRefetch();
                    resetForm();
                    setTimeout(() => resolveLoader("success", "save", "", true), 500);
                },
                onError: (err: any) => {
                    if (err) {
                        const message = err.response.data.message;
                        toastError(message ?? "Something went wrong")
                    }
                    setTimeout(() => resolveLoader("error", "save", "", true), 500);
                }
            });
        }
    };

    const handleEdit = (company: Company) => {
        setEditId(company.COMPANYID);
        if (focusFirst) focusFirst();
    };

    /* -------------------- TABLE COLUMNS -------------------- */
    const companyColumns = useMemo(() => {
        const cols = [
            companyHelper.display({
                id: "sno",
                header: "Sno",
                cell: ({ row }) => row.index + 1,
            }),
            companyHelper.accessor("COMPANYID", { header: "Company Id" }),
            companyHelper.accessor("COMPANYNAME", { header: "Company Name" }),
            companyHelper.accessor("ADDRESS1", { header: "Flat" }),
            companyHelper.accessor("ADDRESS2", { header: "Street" }),
            companyHelper.accessor("ADDRESS3", { header: "Area" }),
            companyHelper.accessor("ADDRESS4", { header: "City" }),
            companyHelper.accessor("AREACODE", { header: "Pincode" }),
            companyHelper.accessor("STATE", { header: "State" }),
            companyHelper.accessor("PHONE", { header: "Mobile No" }),
            companyHelper.accessor("GSTNO", { header: "GST No" }),
            companyHelper.accessor("EMAIL", { header: "Email" }),
            companyHelper.accessor("PANNO", { header: "Pan No" }),
       
            companyHelper.accessor("ACTIVE", {
                header: "Active",
                meta: { align: "center" },
            }),
        ];

        if (showEditIcons) {
            cols.push(
                companyHelper.display({
                    id: "actions",
                    header: "Actions",
                    meta: { align: "center" },
                    cell: ({ row }) => (
                        <Box display="flex" justifyContent="center">
                            <FaEdit onClick={() => handleEdit(row.original)} cursor="pointer" />
                        </Box>
                    ),
                })
            );
        }

        return cols;
    }, [showEditIcons]);

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

    useGlobalKey("Alt+s", () => handleSave(), "saveTransaction");
    useGlobalKey("Alt+r", () => resetForm(), "Reset");
    useGlobalKey("Alt+e", () => router.back(), "Exit");
    useGlobalKey("Alt+u", () => handleSave(), "updateform");
    /* -------------------- UI -------------------- */
    return (
        <Box fontWeight="semibold" bg={theme.colors.bg} color={theme.colors.primary}>
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
                            <Text fontWeight="semibold" fontSize="small">COMPANY DETAILS</Text>
                            <Flex alignItems={"center"} gap={2}>
                                <Tooltip content="Refresh" >
                                    <Button
                                        variant="ghost"
                                        size="2xs"
                                        color={theme.colors.primaryText}
                                        _hover={{ color: "black" }}
                                        onClick={() => companyRefetch()}
                                        aria-label="Refresh"
                                        loading={companyLoading}
                                    >
                                        <FiRefreshCw />
                                    </Button>
                                </Tooltip>
                                <Button variant="ghost" size="xs" color={theme.colors.green} onClick={() => handleExport("excel")}>
                                    <FaFileExcel />
                                </Button>
                                <Button variant="ghost" size="xs" color={theme.colors.primaryText} onClick={() => handleExport("pdf")}>
                                    <FaPrint />
                                </Button>
                            </Flex>
                        </Box>

                        <DataTable<Company>
                            columns={companyColumns}
                            data={companies}
                            onRowClick={(company) => handleEdit(company)}
                            headerBg={theme.colors.primary}
                            headerColor="white"
                            borderColor="white"
                            bodyBg={theme.colors.bg}
                            editingRowId={editId ?? (highlightedId != null ? String(highlightedId) : null)}
                            rowIdKey="COMPANYID"
                            emptyText="No companies available"
                            // pagination={{ enabled: true, pageSize: 10, color: theme.colors.whiteColor }}
                        />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default CompanyMaster;
