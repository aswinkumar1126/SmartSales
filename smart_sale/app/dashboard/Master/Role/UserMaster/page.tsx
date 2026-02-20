"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Input,
    VStack,
    Text,
    Grid,
    GridItem,
    Flex,
    InputGroup,
    IconButton,
    HStack,
    Portal,
    createListCollection,
    For,
    Stack,
    Fieldset,
    Field,
    NativeSelect,
} from "@chakra-ui/react";
import { } from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { PasswordInput } from "@/components/ui/password-input";
import Image from "next/image";
import { useTheme } from "@/context/theme/themeContext";
import { fontVariables } from "@/context/theme/font";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { LuUser } from "react-icons/lu";
import { RiLockPasswordLine } from 'react-icons/ri'
import { useAuth } from "@/hooks/auth/useAuth";
import { useUsers } from "@/hooks/user/useUsers";
import { useCreateUser } from "@/hooks/user/useCreateUser";
import { usePatchUser } from "@/hooks/user/usePatchUser";
import { UserMaster } from "@/types/user/user";
import { FiEdit } from "react-icons/fi";
import { useUserById } from "@/hooks/user/useUserById";
import { toastLoaded } from "@/component/toast/toast";
import { Toaster } from "@/components/ui/toaster";
import { CustomTable } from "@/component/table/CustomTable";
import { getImage } from "@/utils/image/getImage";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint ,FaFileExcel } from "react-icons/fa";


export default function UserMasters() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
   
    const {setData ,setColumns , title } = usePrint();

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
 

    const costCenters = [
        { id: 1, value: "SJ", label: "Head Office" },
        { id: 2, value: "DG", label: "Showroom 1" },
        { id: 3, value: "SM", label: "Showroom 2" },
    ];


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


    const { data: userByIdData, isLoading: loadingUser } = useUserById(editingUserId ?? undefined);

    const { mutate: createUser, isPending: creating } = useCreateUser();
    const { mutate: patchUser, isPending: updating } = usePatchUser();

    const onChange = (field: keyof UserMaster, value: any) => {
        setForm(prev => ({
            ...prev,
            [field]: value,
        }));
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
        if (!highlightId) {
            return;
        }
        const timer = setTimeout(() => {
            setHighlightedId(undefined);
        }, 3000);
        return () => clearTimeout(timer);
    })


    const handleSave = () => {
        setError(null);

        if (!form.username.trim()) {
            setError("Username is required");
            return;
        }

        // CREATE MODE → password mandatory
        if (!editingUserId) {
            if (!form.pwd?.toLowerCase() || !confirmPwd.toLowerCase()) {
                setError("Password and Confirm Password are required");
                return;
            }

            if (form.pwd.toLowerCase() !== confirmPwd.toLowerCase()) {
                setError("Password and Confirm Password do not match");
                return;
            }
        }

        // EDIT MODE → password optional, but must match if entered
        if (editingUserId && form.pwd) {
            if (form.pwd.toLowerCase() !== confirmPwd.toLowerCase()) {
                setError("Password and Confirm Password do not match");
                return;
            }
        }

        if(form.username){
            const isDuplicate = users.some((u)=>u.username.toUpperCase() === form.username.toUpperCase()) ;
            if(isDuplicate){
                setError("Username already exists");
                return;
            }
        }

        const payload: any = { ...form };

        // Remove empty password on edit
        if (editingUserId && !payload.pwd) {
            delete payload.pwd;
        }

        if (editingUserId) {
            const formData = new FormData();

            formData.append(
                "updatedUser",
                new Blob([JSON.stringify(payload)], {
                    type: "application/json",
                })
            );

            if (selectedImage) {
                formData.append("image", selectedImage);
            }

            patchUser(
                { userId: editingUserId, formData },
                {
                    onSuccess: () => {
                        resetForm();
                        setHighlightedId(editingUserId);
                    },
                }
            );
        }
        else {
            createUser(

                { user: payload, image: selectedImage },
                {
                    onSuccess: () => {
                        resetForm;
                        setEditingUserId(payload.USERID)
                    }
                }
            );
        }
    };

    const resetForm = () => {
        setEditingUserId(null);
        setForm({
            username: "",
            pwd: "",
            active: "Y",
            userCostId: "",
            billing: false,
        });
        setConfirmPwd("");
        setSelectedImage(undefined);
        setImagePreview(null);
        setError(null);
    };




    const loadUserIntoForm = (item: UserMaster) => {
        setEditingUserId(item.userId!);

        setForm({
            username: item.username,
            pwd: "", // never preload password
            active: item.active,
            userCostId: item.costId ?? "",
            billing: item.billing ?? false,
        });

        setImagePreview(getImage(item?.userImage));
        setSelectedImage(undefined);
    };

    // Dummy table data
    // const dummyUsers = [
    //     { id: 1, name: "Admin", centre: "Head Office", active: "YES" },
    //     { id: 2, name: "Ravi", centre: "Showroom 1", active: "YES" },
    //     { id: 3, name: "Kumar", centre: "Factory", active: "NO" },
    // ];

    // ACTIVE STATUS SELECT LIST
    const activeStatus = createListCollection({
        items: [
            { label: "YES", value: "Y" },
            { label: "NO", value: "N" }
        ]
    });

    const UserMasterColumn = [
        { key: "userId", label: "User Id" },
        { key: "username", label: "User Name" },
        // {key: "costId", label: "Cost Id"},
        { key: "active", label: "Active", align: 'center' as const },
        { key: "action", label: "Actions", align: 'center' as const },

    ]


        const handleExport = (option: string) => {
            setData(users);
            setColumns([
                { key: "userId", label: "User Id" },
                { key: "username", label: "User Name" },
                // {key: "costId", label: "Cost Id"},
                { key: "active", label: "Active", align: 'center' as const },
            ]);
          
            router.push(`/print?export=${option}`);
            title?.("User List")

        };
    

    return (
        <Box
            fontWeight='semibold'
            bg={theme.colors.primary}
            color={theme.colors.secondary}

        >
            <Toaster />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1.5fr" }} gap={2}>

                {/* LEFT SECTION – USER FORM */}

                <GridItem display="flex" justifyContent="center">
                    <VStack
                        w="full"
                        bg={theme.colors.formColor}
                        p={4}
                        borderRadius="xl"
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >

                        <Text fontSize="small" fontWeight="seminbold" >
                            {editingUserId ? "EDIT USER" : "USER MASTER"}
                        </Text>



                        {/* -------------------- USER SECTION -------------------- */}
                        <Fieldset.Root size="lg" width="100%">
                            <Fieldset.Content>
                                <Box display='flex' flexDirection='column'  gap={2}>
                                    
                                        <Box display="flex" gap={2} justifyContent="space-between">
                                            <Box minW="120px" fontSize="2xs">USER NAME :</Box>
                                            <InputGroup startElement={<LuUser color="#4A90E2" />}>
                                                <CapitalizedInput
                                                    field="username"
                                                    placeholder="Enter user name"
                                                    value={form.username}
                                                    onChange={onChange}
                                                    icon
                                                    size="2xs"
                                                    inputModeType="text"
                                                />
                                            </InputGroup>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="120px" fontSize="2xs">PASSWORD :</Box>
                                            <InputGroup startElement={<RiLockPasswordLine color="#4A90E2" />}>
                                                <CapitalizedInput
                                                    field="pwd"
                                                    placeholder="Enter your password"
                                                    value={form.pwd ?? ""}
                                                    onChange={onChange}
                                                    type="password"
                                                    icon
                                                    size="2xs"
                                                   
                                                />
                                            </InputGroup>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Box minW="120px" fontSize="2xs">CONFIRM PASSWORD :</Box>
                                            <InputGroup startElement={<RiLockPasswordLine color="#4A90E2" />}>
                                            <CapitalizedInput
                                                field="confirmPwd"
                                                placeholder="Re-enter password"
                                                value={confirmPwd}
                                                onChange={(f, v) => setConfirmPwd(v)}
                                                type="password"
                                                icon
                                                    size="2xs"
                                            />
                                            </InputGroup>
                                        </Box>

                                    <Box display='flex' gap={5} justifyContent='space-between'>
                                        {/* COST CENTER + ACTIVE */}
                                        <Box display="flex" alignItems="center" gap={2}>
                                            {/* Active */}
                                            <Box minW="120px" fontSize="2xs">ACTIVE :</Box>
                                            <NativeSelect.Root minW='80px' maxW='100px' fontSize='2xs'>
                                                <NativeSelect.Field
                                                    value={form.active || "Y"}
                                                    onChange={(e) => onChange("active", e.target.value)}
                                                    fontSize='2xs'
                                                    css={{
                                                        backgroundColor: "#eee",
                                                        color: "#222",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "full",
                                                        height: "30px",

                                                    }}

                                                >
                                                    <For each={activeStatus.items} >
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
                                                <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
                                            </Button>
                                        </Box>
                                        

                                    </Box>
                                   
                                </Box>

                              

                                {error && (
                                    <Text color="red.500" fontSize="sm" textAlign="center">
                                        {error}
                                    </Text>
                                )}

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

                                    <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                        Clear <IoIosExit />
                                    </Button>
                                </HStack>
                            </Fieldset.Content>
                        </Fieldset.Root>
                    </VStack>
                </GridItem>

                {/* RIGHT SECTION – TABLE */}
                <GridItem>
                    <Box
                        p={3}
                        borderRadius="xl"
                        bg={theme.colors.formColor}
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >
                        <Box display='flex' alignItems='center' justifyContent='space-between'>
                        <Text  fontWeight="semibold" fontSize="small" >
                            USER LIST
                        </Text>
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
                                bodyBg={theme.colors.primary}
                                headerColor='white'
                                emptyText="No parties available"
                                rowIdKey="userId"
                                highlightRowId={highlightId ? Number(highlightId) : null}
                                renderRow={(user, i) => (
                                    <>
                                        {/* <Table.Cell>{i + 1}</Table.Cell> */}
                                        <Table.Cell>{user.userId}</Table.Cell>
                                        <Table.Cell>{user.username}</Table.Cell>
                                        {/* <Table.Cell >{user.costId}</Table.Cell> */}
                                        <Table.Cell textAlign="center">{user.active}</Table.Cell>
                                        <Table.Cell>
                                            <Box display="flex" justifyContent="center">
                                                <FiEdit onClick={() => loadUserIntoForm(user)} cursor="pointer" />
                                            </Box>
                                        </Table.Cell>
                                    </>
                                )}

                            />
                        </Stack>
                    </Box>
                </GridItem>

            </Grid>
        </Box>
    );
}
