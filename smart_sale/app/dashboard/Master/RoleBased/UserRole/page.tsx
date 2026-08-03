"use client";

import React, { useState, useEffect } from "react";

/* ------------------ CHAKRA UI ------------------ */
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
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";

/* ------------------ ICONS ------------------ */
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit, FaTrash, FaPrint, FaFileExcel } from "react-icons/fa";

/* ------------------ COMPONENTS ------------------ */
import { Toaster, toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { CustomTable } from "@/component/table/CustomTable";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";
import SearchBar from "@/component/search/SearchBar";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { DynamicForm } from "@/component/form/DynamicForm";

/* ------------------ CONTEXT ------------------ */
import { useTheme } from "@/context/theme/themeContext";
import { usePrint } from "@/context/print/usePrintContext";

/* ------------------ ROUTER ------------------ */
import { useRouter } from "next/navigation";

/* ------------------ HOOKS ------------------ */
import { useUserRole } from "@/hooks/apiHooks/UserRole/useUserRole";

/* ------------------ SERVICES ------------------ */
import { fetchRoles } from "@/service/RoleMasterService";
import { OperatorService, Operator } from "@/service/OperatorService";

/* ------------------ TYPES ------------------ */
import { UserRole, UserRolePayload } from "@/types/UserRole/UserRole";
import { Role } from "@/types/RoleMaster/RoleMaster";

/* ------------------ CONFIG ------------------ */
import { UserRoleMaster as UserRoleMasterConfig } from "@/config/master/UserRoleMaster";



const UPUSERID = 1;

const emptyForm: UserRolePayload = {
    USERID: 0,
    ROLEID: 0,
    UPUSERID,
};

const userRoleColumns = [
    { key: "SNO", label: "S.No" },
    { key: "USERID", label: "User" },
    { key: "ROLEID", label: "Role" },
    { key: "actions", label: "Actions" },
];

export default function UserRoleMaster() {
    const { theme } = useTheme();
    const router = useRouter();
    const { setData, setColumns, setShowSno, title } = usePrint();
    const { userRoles, loading, addUserRole, editUserRole, removeUserRole } = useUserRole();


    const [form, setForm] = useState<UserRolePayload>(emptyForm);
    const [editId, setEditId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

    const [operators, setOperators] = useState<Operator[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const size = 10;

    // Load operators and roles for dropdowns
    useEffect(() => {
        OperatorService.getAll(0, 1000)
            .then((res) => setOperators(res?.content ?? []))
            .catch(console.error);
        fetchRoles()
            .then(setRoles)
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (editId !== null) {
            const ur = userRoles.find((r: UserRole) => r.USERID === editId);
            if (ur) {
                setForm({ USERID: ur.USERID, ROLEID: ur.ROLEID, UPUSERID });
                ScrollToTop();
            }
        }
    }, [editId]);

    useEffect(() => {
        if (!highlightedId) return;
        const t = setTimeout(() => setHighlightedId(null), 3000);
        return () => clearTimeout(t);
    }, [highlightedId]);

    useEffect(() => { setPage(0); }, [searchTerm]);

    const getOperatorName = (id: number) =>
        operators.find((o) => o.OPER_CODE === id)?.OPER_NAME ?? String(id);

    const getRoleName = (id: number) =>
        roles.find((r) => r.ROLEID === id)?.ROLENAME ?? String(id);

    const handleChange = (field: keyof UserRolePayload, value: any) => {
        const safeValue =
            value?.target?.value ??
            value?.value ??
            value;

        setForm((prev) => ({
            ...prev,
            [field]: Number(safeValue),
        }));
    };

    const resetForm = () => { setEditId(null); setForm(emptyForm); };


    const handleEdit = (userRole: UserRole) => {
        setEditId(userRole.USERID);
    };

    const validateForm = () => {
        if (!form.USERID || form.USERID === 0) {
            toaster.error({ title: "Error", description: "User is required" });
            return false;
        }
        if (!form.ROLEID || form.ROLEID === 0) {
            toaster.error({ title: "Error", description: "Role is required" });
            return false;
        }
        const exists = (userRoles as UserRole[]).some(
            (ur) => ur.USERID === form.USERID && ur.ROLEID === form.ROLEID && ur.USERID !== editId
        );
        if (exists) {
            const userName = operators.find((o) => o.OPER_CODE === form.USERID)?.OPER_NAME ?? String(form.USERID);
            const roleName = roles.find((r) => r.ROLEID === form.ROLEID)?.ROLENAME ?? String(form.ROLEID);
            toaster.error({ title: "Already Assigned", description: `"${roleName}" role is already assigned to "${userName}"` });
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const payload: UserRolePayload = {
                ...form,
                UPUSERID: 999,
            };

            if (editId !== null) {
                await editUserRole({
                    id: editId,
                    payload,
                });

                toaster.success({
                    title: "Success",
                    description: "User role updated successfully",
                });
            } else {
                const newUserRole = await addUserRole(payload);

                if ((newUserRole as any)?.USERID) {
                    setHighlightedId((newUserRole as any).USERID);
                }

                toaster.success({
                    title: "Success",
                    description: "User role created successfully",
                });
            }

            resetForm();
        } catch (error: any) {
            toaster.error({
                title: "Error",
                description: error?.message || "Failed to save user role",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this user role?")) return;
        try {
            await removeUserRole(id);
            toaster.success({ title: "Success", description: "User role deleted successfully" });
            if (paginatedUserRoles.length === 1 && page > 0) setPage(page - 1);
        } catch (error: any) {
            toaster.error({ title: "Error", description: error?.message || "Failed to delete user role" });
        }
    };

    const handleExport = (option: string) => {
        setData((userRoles as UserRole[]).map((ur) => ({
            USERID: getOperatorName(ur.USERID),
            ROLEID: getRoleName(ur.ROLEID),
        })));
        setColumns([
            { key: "USERID", label: "User" },
            { key: "ROLEID", label: "Role" },
        ]);
        setShowSno(true);
        title?.("User Role Master");
        router.push(`/print?export=${option}`);
    };

    const filteredUserRoles = (userRoles as UserRole[]).filter((ur) =>
        getOperatorName(ur.USERID).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getRoleName(ur.ROLEID).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalElements = filteredUserRoles.length;
    const paginatedUserRoles = filteredUserRoles.slice(page * size, (page + 1) * size);

    const operatorItems = operators.map((o) => ({ label: o.OPER_NAME, value: String(o.OPER_CODE) }));
    const roleItems = roles.map((r) => ({ label: r.ROLENAME, value: String(r.ROLEID) }));


    const UserRoleFields = UserRoleMasterConfig({ users: operatorItems , roles:roleItems });

    const formNames = UserRoleFields.map(f=>f.name);
    const { register, focusFirst, focusNext } = useEnterNavigation(formNames,handleSave);


    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minH="100vh" bg={theme.colors.bg}>
                <Spinner size="xl" color={theme.colors.accient} />
            </Box>
        );
    }

    return (
        <Box fontWeight="semibold" bg={theme.colors.bg} color={theme.colors.secondary}>
            <Toaster />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 2.5fr" }} gap={2}>

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
                                  fields={UserRoleFields}
                                  minLabelWidth="70px"
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

                {/* TABLE */}
                <GridItem minW={0}>
                    <Box bg={theme.colors.formColor} p={3} borderRadius="xl" border="1px solid #eef">
                        <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "start", sm: "center" }} mb={3} gap={2}>
                            <HStack gap={2}>
                                <Text fontWeight="semibold" fontSize="small">USER ROLE LIST</Text>
                                <Badge colorPalette="blue" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                                    {totalElements} Total
                                </Badge>
                            </HStack>
                            <Flex gap={2} align="center">
                                <SearchBar
                                    searchTerm={searchTerm}
                                    onChange={setSearchTerm}
                                    size="xs"
                                />
                                <Button variant="ghost" size="xs" color={theme.colors.green} onClick={() => handleExport("excel")}>
                                    <FaFileExcel />
                                </Button>
                                <Button variant="ghost" size="xs" color={theme.colors.primaryText} onClick={() => handleExport("pdf")}>
                                    <FaPrint />
                                </Button>
                            </Flex>
                        </Flex>

                        <CustomTable
                            columns={userRoleColumns}
                            data={paginatedUserRoles}
                     
                            renderRow={(ur: UserRole, index: number) => (
                                <>
                                    <Table.Cell>{page * size + index + 1}</Table.Cell>
                                    <Table.Cell>{getOperatorName(ur.USERID)}</Table.Cell>
                                    <Table.Cell>{getRoleName(ur.ROLEID)}</Table.Cell>
                                    <Table.Cell>
                                        <Box display="flex" gap={2}>
                                       
                                                <FaTrash
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(ur.USERID);
                                                    }}
                                                    cursor="pointer"
                                                    color="red"
                                                    size={14}
                                                />
                                           
                                        </Box>
                                    </Table.Cell>
                                </>
                            )}
                            headerBg="blue.800"
                            headerColor="white"
                            borderColor="white"
                            bodyBg={theme.colors.bg}
                            highlightRowId={highlightedId}
                            rowIdKey="USERID"
                            emptyText="No user role assignments available"
                            onRowClick={(row) => handleEdit(row)}
                        />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}
