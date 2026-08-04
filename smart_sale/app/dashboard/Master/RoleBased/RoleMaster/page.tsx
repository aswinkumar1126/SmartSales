"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    Badge,
    Spinner,
    Table
} from "@chakra-ui/react";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit, FaTrash, FaPrint, FaFileExcel } from "react-icons/fa";
import { Toaster, toaster } from "@/components/ui/toaster";

/*------------------CONTEXT ------------------------------*/
import { useTheme } from "@/context/theme/themeContext";
import { usePrint } from "@/context/print/usePrintContext";

/*------------------HOOKS ------------------------------*/
import { useRole } from "@/hooks/apiHooks/RoleMaster/useRoleMaster";

/*------------------CONFIG ------------------------------*/
import { RoleMaster as RoleMasterConfig } from "@/config/master/RoleMaster";

/*------------------TYPES ------------------------------*/
import { Role, RolePayload } from "@/types/RoleMaster/RoleMaster";

/*------------------COMPONENTS ------------------------------*/
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { CustomTable } from "@/component/table/CustomTable";
import SearchBar from "@/component/search/SearchBar";
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";


const USERID = 1;

const emptyForm: RolePayload = {
    ROLENAME: "",
    ACTIVE: "Y",
    PWDACCESS: "Y",
    ADMINACCESS: "N",
    USERID,
};

const yesNoItems = [
    { label: "YES", value: "Y" },
    { label: "NO", value: "N" },
];

const roleColumns = [
    { key: "SNO", label: "S.No" },
    { key: "ROLEID", label: "Role Id" },
    { key: "ROLENAME", label: "Role Name" },
    { key: "ACTIVE", label: "Active" },
    { key: "PWDACCESS", label: "Password Access" },
    { key: "ADMINACCESS", label: "Admin Access" },

];

export default function RoleMaster() {

    const { theme } = useTheme();
    const router = useRouter();
    const { setData, setColumns, setShowSno, title } = usePrint();
    const { roles, loading, addRole, editRole, removeRole } = useRole();

    const roleMasterForm = RoleMasterConfig({ yesOrNo: yesNoItems })

    const [form, setForm] = useState<RolePayload>(emptyForm);
    const [editId, setEditId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);
    const size = 10;

    // Filter and pagination
    const filteredRoles = roles.filter((r) =>
        r.ROLENAME.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalElements = filteredRoles.length;
    const totalPages = Math.ceil(totalElements / size);
    const paginatedRoles = filteredRoles.slice(page * size, (page + 1) * size);

    // Effects
    useEffect(() => {
        if (editId !== null) {
            const r = roles.find((r) => r.ROLEID === editId);
            if (r) {
                setForm({
                    ROLENAME: r.ROLENAME,
                    ACTIVE: r.ACTIVE,
                    PWDACCESS: r.PWDACCESS,
                    ADMINACCESS: r.ADMINACCESS,
                    USERID: r.USERID,
                });
                ScrollToTop();
            }
        }
    }, [editId, roles]);

    useEffect(() => {
        if (!highlightedId) return;
        const t = setTimeout(() => setHighlightedId(null), 3000);
        return () => clearTimeout(t);
    }, [highlightedId]);

    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    // Handlers
    const handleChange = (field: keyof RolePayload, value: any) => {
        const safeValue =
            value?.target?.value ??  // native select
            value?.value ??          // custom select {label,value}
            value;                   // direct value

        setForm((prev) => ({
            ...prev,
            [field]: safeValue,
        }));
    };

    const resetForm = () => {
        setEditId(null);
        setForm(emptyForm);
    };

    const validateForm = () => {
        if (!form.ROLENAME?.trim()) {
            toaster.error({ title: "Error", description: "Role name is required" });
            return false;
        }
        const exists = roles.some(
            (r) =>
                r.ROLENAME.toLowerCase() === form.ROLENAME.trim().toLowerCase() &&
                r.ROLEID !== editId
        );
        if (exists) {
            toaster.error({ title: "Error", description: "Role name already exists" });
            return false;
        }
        return true;
    };
    const formNames = roleMasterForm.map(f => f.name);



    const handleSave = async () => {
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            if (editId !== null) {
                await editRole(editId, form);
                toaster.success({ title: "Success", description: "Role updated successfully" });
            } else {
                const newRole = (await addRole(form)) as unknown as Role;
                if (newRole?.ROLEID) setHighlightedId(newRole.ROLEID);
                toaster.success({ title: "Success", description: "Role created successfully" });
            }
            resetForm();
        } catch (error: any) {
            toaster.error({
                title: "Error",
                description: error?.message || "Failed to save role",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (role: Role) => {
        setEditId(role.ROLEID);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        try {
            await removeRole(id);
            toaster.success({ title: "Success", description: "Role deleted successfully" });
            if (paginatedRoles.length === 1 && page > 0) setPage(page - 1);
        } catch (error: any) {
            toaster.error({
                title: "Error",
                description: error?.message || "Failed to delete role",
            });
        }
    };

    // Export
    const handleExport = (option: string) => {
        setData(filteredRoles.map(({ ROLEID, ROLENAME, ACTIVE, PWDACCESS, ADMINACCESS }) => ({ ROLEID, ROLENAME, ACTIVE, PWDACCESS, ADMINACCESS })));
        setColumns([
            { key: "ROLEID", label: "Role Id" },
            { key: "ROLENAME", label: "Role Name" },
            { key: "ACTIVE", label: "Active" },
            { key: "PWDACCESS", label: "Password Access" },
            { key: "ADMINACCESS", label: "Admin Access" },
        ]);
        setShowSno(true);
        title?.("Role Master");
        router.push(`/print?export=${option}`);
    };

    const { register, focusFirst, focusNext } = useEnterNavigation(formNames, handleSave);


    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minH="100vh"
                bg={theme.colors.bg}
            >
                <Spinner size="xl" color={theme.colors.accient} />
            </Box>
        );
    }

    return (
        <Box
            fontWeight="semibold"
            bg={theme.colors.bg}
            color={theme.colors.primary}
        >
            <Toaster />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 2.5fr" }} gap={2}>
                {/* ---------------- FORM ---------------- */}
                <GridItem>
                    <VStack bg={theme.colors.formColor} p={4} borderRadius="xl" border="1px solid #eef">

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <DynamicForm
                                    register={register}
                                    formData={form}
                                    focusNext={focusNext}
                                    layout="vertical"
                                    onChange={handleChange}
                                    fields={roleMasterForm}
                                />
                            </Fieldset.Content>
                        </Fieldset.Root>

                        <HStack>
                            <Button size="xs" colorPalette="blue" onClick={handleSave}>
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

                {/* ---------------- TABLE ---------------- */}
                <GridItem minW={0}>
                    <Box
                        bg={theme.colors.formColor}
                        p={2}
                        borderRadius="xl"
                        border="1px solid #eef"
                    >
                        <Flex
                            direction={{ base: "column", sm: "row" }}
                            justify="space-between"
                            align={{ base: "start", sm: "center" }}
                            mb={2}

                        >
                            <HStack gap={2}>
                                <Text fontWeight="semibold" fontSize="small">
                                    ROLE LIST
                                </Text>
                                <Badge
                                    colorPalette="blue"
                                    fontSize="2xs"
                                    px={2}
                                    py={0.5}
                                    borderRadius="full"
                                >
                                    {totalElements} Total
                                </Badge>
                            </HStack>

                            <Flex gap={2} align="center">
                                <SearchBar searchTerm="" onChange={() => console.log("")} size="xs" />
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
                        </Flex>

                        <CustomTable
                            columns={roleColumns}
                            data={paginatedRoles}
                            renderRow={(role: Role, index: number) => (
                                <>
                                    <Table.Cell>{page * size + index + 1}</Table.Cell>
                                    <Table.Cell>{role.ROLEID}</Table.Cell>
                                    <Table.Cell>{role.ROLENAME}</Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorScheme={role.ACTIVE === "Y" ? "green" : "red"}
                                            fontSize="xs"
                                            px={2}
                                            py={0.5}
                                            borderRadius="full"
                                        >
                                            {role.ACTIVE === "Y" ? "Yes" : "No"}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorScheme={role.PWDACCESS === "Y" ? "green" : "red"}
                                            fontSize="xs"
                                            px={2}
                                            py={0.5}
                                            borderRadius="full"
                                        >
                                            {role.PWDACCESS === "Y" ? "Yes" : "No"}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorScheme={role.ADMINACCESS === "Y" ? "green" : "red"}
                                            fontSize="xs"
                                            px={2}
                                            py={0.5}
                                            borderRadius="full"
                                        >
                                            {role.ADMINACCESS === "Y" ? "Yes" : "No"}
                                        </Badge>
                                    </Table.Cell>

                                </>
                            )}
                            headerBg={theme.colors.primary}
                            headerColor="white"
                            borderColor="white"
                            bodyBg={theme.colors.bg}
                            highlightRowId={highlightedId?.toString()}
                            rowIdKey="ROLEID"
                            emptyText="No roles available"
                            onRowClick={(row) => handleEdit(row)}

                        />

                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}