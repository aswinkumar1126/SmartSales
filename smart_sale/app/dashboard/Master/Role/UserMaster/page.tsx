"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Button,
    VStack,
    Text,
    Grid,
    GridItem,
    Flex,
    InputGroup,
    HStack,
    Stack,
    Fieldset,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";

import Image from "next/image";
import { useTheme } from "@/context/theme/themeContext";

import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { LuUser } from "react-icons/lu";
import { RiLockPasswordLine } from 'react-icons/ri';

import { useAuth } from "@/hooks/apiHooks/auth/useAuth";
import { useUsers } from "@/hooks/apiHooks/user/useUsers";
import { useCreateUser } from "@/hooks/apiHooks/user/useCreateUser";
import { usePatchUser } from "@/hooks/apiHooks/user/usePatchUser";
import { UserMaster } from "@/types/user/user";
import { FiEdit } from "react-icons/fi";
import { useUserById } from "@/hooks/apiHooks/user/useUserById";
import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { getImage } from "@/utils/image/getImage";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";

import { useGlobalKey } from "@/components/key/useGlobalKey";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import TransactionLoader from "@/component/loader/Transactionloader";

import type { PrintColumn } from "@/component/screens/PrintPreviewScreen";


export default function UserMasters() {

    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const { setData, setColumns, title } = usePrint();
    const {isOpen, status, title:loaderTitle, description, openLoader, resolveLoader, closeLoader} = useTransactionLoader();

    const [imagePreview, setImagePreview] = useState<string | undefined | null>(null);
    const [confirmPwd, setConfirmPwd] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<UserMaster>({
        username: "",
        pwd: "",
        active: "Y",
        userCostId: "",
        billing: false,
    });

    const [selectedImage, setSelectedImage] = useState<File | undefined>();
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [highlightId, setHighlightedId] = useState<Number>();

    const { data, isLoading } = useUsers();

    // ─── Refs ───────────────────────────────────────────────────────────────
    const userNameRef = useRef<HTMLInputElement | null>(null);
    const pwdRef = useRef<HTMLInputElement | null>(null);
    const confirmPwdRef = useRef<HTMLInputElement | null>(null);
    const activeSelectRef = useRef<HTMLSelectElement | null>(null);

    // ─── Helpers ────────────────────────────────────────────────────────────
    const normalizeUser = (u: any): UserMaster => ({
        userId: u.USERID,
        username: u.USERNAME,
        pwd: u.PWD,
        active: u.ACTIVE,
        costId: u.COSTID,
        userCostId: u.USERCOSTID,
        billing: u.BILLING,
        userImage: u.USERIMAGE,
    });

    const users: UserMaster[] = (data?.data ?? []).map(normalizeUser);

    const { data: userByIdData } = useUserById(editingUserId ?? undefined);
    const { mutate: createUser, isPending: creating } = useCreateUser();
    const { mutate: patchUser, isPending: updating } = usePatchUser();

    const onChange = (field: keyof UserMaster, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    useEffect(() => {
        if (!userByIdData?.data) return;
        const { pwd, ...formData } = normalizeUser(userByIdData.data);
        setForm({ ...formData, pwd: "" });
        setImagePreview(getImage(formData?.userImage));
        setConfirmPwd("");
    }, [userByIdData]);

    useEffect(() => {
        if (!highlightId) return;
        const timer = setTimeout(() => setHighlightedId(undefined), 3000);
        return () => clearTimeout(timer);
    });

    // ─── Save ───────────────────────────────────────────────────────────────
    const handleSave = () => {
        setError(null);

        const username = form.username?.trim();

        if (!username) {
            setError("Username is required");
            userNameRef.current?.focus();
            return;
        }

        // CREATE: both pwd fields required
        if (!editingUserId) {
            if (!form.pwd || !confirmPwd) {
                setError("Password and Confirm Password are required");
                pwdRef.current?.focus();
                return;
            }
            if (form.pwd !== confirmPwd) {
                setError("Password and Confirm Password do not match");
                confirmPwdRef.current?.focus();
                return;
            }
        }

        // EDIT: if pwd entered it must match
        if (editingUserId && form.pwd) {
            if (form.pwd !== confirmPwd) {
                setError("Password and Confirm Password do not match");
                confirmPwdRef.current?.focus();
                return;
            }
        }

        const isDuplicate = users.some(
            (u) =>
                u.username?.toUpperCase() === username.toUpperCase() &&
                u.userId !== editingUserId
        );
        if (isDuplicate) {
            setError("Username already exists");
            userNameRef.current?.focus();
            return;
        }

        const payload: any = { ...form, username };
        if (editingUserId && !payload.pwd) delete payload.pwd;

        if (editingUserId) {
            openLoader('update', true)
            const formData = new FormData();
            formData.append(
                "updatedUser",
                new Blob([JSON.stringify(payload)], { type: "application/json" })
            );
            if (selectedImage) formData.append("image", selectedImage);

            patchUser(
                { userId: editingUserId, formData },
                {
                    onSuccess: () => {
                        resetForm();
                        setHighlightedId(editingUserId);
                        resolveLoader("success", "update", "", true)
                    },
                    onError: () => {
                        resolveLoader("error", "update", "", true)
                    }
                }
            );
        } else {
            openLoader('save', true)
            createUser(
                { user: payload, image: selectedImage },
                { onSuccess: () => {resetForm();
                    resolveLoader("success", "save", "", true)
                }, 
                onError: () => {
                        resolveLoader("error", "save", "", true)
                    }
}
               
            );
        }
    };

    const resetForm = () => {
        setEditingUserId(null);
        setForm({ username: "", pwd: "", active: "Y", userCostId: "", billing: false });
        setConfirmPwd("");
        setSelectedImage(undefined);
        setImagePreview(null);
        setError(null);
        userNameRef.current?.focus();
    };

    const loadUserIntoForm = (item: UserMaster) => {
        setEditingUserId(item.userId!);
        setForm({
            username: item.username,
            pwd: "",
            active: item.active,
            userCostId: item.costId ?? "",
            billing: item.billing ?? false,
        });
        setImagePreview(getImage(item?.userImage));
        setSelectedImage(undefined);
    };

    const activeStatus = [
        { label: "YES", value: "Y" },
        { label: "NO", value: "N" },
    ];

    const UserMasterColumn = [
        { key: "userId", label: "User Id" },
        { key: "username", label: "User Name" },
        { key: "active", label: "Active", align: 'center' as const },
        // { key: "action", label: "Actions", align: 'center' as const },
    ];

    const handleExport = (option: string) => {
        setData(users);
        const columns: PrintColumn[] = [
            { key: "userId", label: "User Id" },
            { key: "username", label: "User Name" },
            { key: "active", label: "Active", align: 'center' as const },
        ]
        setColumns(columns);
        router.push(`/print?export=${option}`);
        title?.("User List");
    };
    useGlobalKey("Alt+s" , ()=>handleSave() , "saveTransaction");
    useGlobalKey("Alt+r", () => resetForm() ,"Reset");
    useGlobalKey("Alt+e", () => router.back(), "exit");
    useGlobalKey("Alt+u", () => handleSave(), "update");

    return (
        <Box
            fontWeight='semibold'
            bg={theme.colors.bg}
            color={theme.colors.secondary}
        >
            <TransactionLoader
                isOpen={isOpen}
                status={status}
                title={loaderTitle}
                description={description}
                onClose={closeLoader}
            />
         
            <ShortcutDialog />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>

                {/* ── LEFT: FORM ─────────────────────────────────────────── */}
                <GridItem display="flex" justifyContent="center">
                    <VStack
                        w="full"
                        bg={theme.colors.formColor}
                        p={4}
                        borderRadius="xl"
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >
                        <Text fontSize="small" fontWeight="semibold">
                            {editingUserId ? "EDIT USER" : "USER MASTER"}
                        </Text>

                        <Fieldset.Root size="lg" width="100%">
                            <Fieldset.Content>
                                <Box display='flex' flexDirection='column' gap={2}>

                                    {/* ── USERNAME ── */}
                                    <Box display="flex" gap={2} justifyContent="space-between">
                                        <Box minW="120px" fontSize="2xs">USER NAME :</Box>
                                        <InputGroup startElement={<LuUser color="#4A90E2" />}>
                                            <CapitalizedInput
                                                inputRef={userNameRef}
                                                field="username"
                                                placeholder="Enter user name"
                                                value={form.username}
                                                onChange={onChange}
                                                icon
                                                size="2xs"
                                                type="text"
                                                onEnter={() => pwdRef.current?.focus()}
                                            />
                                        </InputGroup>
                                    </Box>

                                    {/* ── PASSWORD ── */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="120px" fontSize="2xs">PASSWORD :</Box>
                                        <InputGroup startElement={<RiLockPasswordLine color="#4A90E2" />}>
                                            <CapitalizedInput
                                                inputRef={pwdRef}
                                                field="pwd"
                                                placeholder="Enter your password"
                                                value={form.pwd ?? ""}
                                                onChange={onChange}
                                                type="password"
                                                icon
                                                size="2xs"
                                                onEnter={() => confirmPwdRef.current?.focus()}
                                            />
                                        </InputGroup>
                                    </Box>

                                    {/* ── CONFIRM PASSWORD ── */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="120px" fontSize="2xs">CONFIRM PASSWORD :</Box>
                                        <InputGroup startElement={<RiLockPasswordLine color="#4A90E2" />}>
                                            <CapitalizedInput
                                                inputRef={confirmPwdRef}
                                                field="confirmPwd"
                                                placeholder="Re-enter password"
                                                value={confirmPwd}
                                                onChange={(_f, v) => setConfirmPwd(v)}
                                                type="password"
                                                icon
                                                size="2xs"
                                                onEnter={() => activeSelectRef.current?.focus()}
                                            />
                                        </InputGroup>
                                    </Box>

                                    <Box display='flex' gap={5} justifyContent='space-between'>

                                        {/* ── ACTIVE ── */}
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Box minW="120px" fontSize="2xs">ACTIVE :</Box>
                                            <NativeSelectWrapper
                                                ref={activeSelectRef}
                                                items={activeStatus}
                                                value={form.active || "Y"}
                                                onChange={(e) => onChange("active", e.target.value)}
                                                fontSize='2xs'
                                                onEnter={() => handleSave()}
                                            />
                                        </Box>

                                        {/* ── IMAGE ── */}
                                        <Box textAlign="center" mt={4}>
                                            <Box
                                                w="80px"
                                                h="80px"
                                                border="1px solid #ddd"
                                                mx="auto"
                                                mb={3}
                                                borderRadius="md"
                                                overflow="hidden"
                                            >
                                                <Image
                                                    src={imagePreview || "/favicon.ico"}
                                                    width={80}
                                                    height={80}
                                                    alt="User"
                                                    style={{ objectFit: "cover" }}
                                                />
                                            </Box>
                                            <Button size="2xs" as="label" cursor="pointer">
                                                <Text fontSize='2xs'>SELECT IMAGE</Text>
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept="image/*"
                                                    onChange={handleImageSelect}
                                                />
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>

                                {error && (
                                    <Text color="red.500" fontSize="sm" textAlign="center">
                                        {error}
                                    </Text>
                                )}

                                {/* ── BUTTONS ── */}
                                <HStack pt={2} justifyContent="center" gap={2}>
                                    <Button
                                        size="xs"
                                        loading={creating || updating}
                                        loadingText="Saving"
                                        onClick={handleSave}
                                        colorPalette="blue"
                                    >
                                        <AiOutlineSave /> {editingUserId ? "Update" : "Save"}
                                    </Button>

                                    <Button
                                        size="xs"
                                        colorPalette="blue"
                                        onClick={resetForm}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') resetForm();
                                        }}
                                    >
                                        Reset <IoIosExit />
                                    </Button>

                                    <Button
                                        size="xs"
                                        colorPalette="blue"
                                        onClick={()=>router.back()}
                                    >
                                        Exit <IoIosExit />
                                    </Button>
                                </HStack>
                            </Fieldset.Content>
                        </Fieldset.Root>
                    </VStack>
                </GridItem>

                {/* ── RIGHT: TABLE ────────────────────────────────────────── */}
                <GridItem>
                    <Box
                        p={3}
                        borderRadius="xl"
                        bg={theme.colors.formColor}
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >
                        <Box display='flex' alignItems='center' justifyContent='space-between'>
                            <Text fontWeight="semibold" fontSize="small">USER LIST</Text>
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

                        <Stack>
                            <CustomTable
                                columns={UserMasterColumn}
                                data={users}
                                size="sm"
                                headerBg='blue.800'
                                bodyBg={theme.colors.bg}
                                headerColor='white'
                                emptyText="No parties available"
                                rowIdKey="userId"
                                highlightRowId={highlightId ? Number(highlightId) : null}
                                renderRow={(user, i) => (
                                    <>
                                        <Table.Cell>{user.userId}</Table.Cell>
                                        <Table.Cell>{user.username}</Table.Cell>
                                        <Table.Cell textAlign="center">{user.active}</Table.Cell>
                                        {/* <Table.Cell>
                                            <Box display="flex" justifyContent="center">
                                                <FiEdit
                                                    onClick={() => loadUserIntoForm(user)}
                                                    cursor="pointer"
                                                />
                                            </Box>
                                        </Table.Cell> */}
                                    </>
                                )}
                                onRowClick={(user) => loadUserIntoForm(user)}
                            />
                        </Stack>
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}