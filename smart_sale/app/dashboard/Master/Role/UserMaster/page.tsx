"use client";

import React, { useState ,useEffect } from "react";
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


export default function UserMasters() {
    const { theme } = useTheme();
    const {user} = useAuth();
    //console.log(user ,'user');


    const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    const [highlightId ,setHighlightedId] = useState<Number > ();

    const { data, isLoading } = useUsers();

    const costCenters = [
        { id: 1, value: "SJ", label: "Head Office" },
        { id: 2, value: "DG", label: "Showroom 1" },
        { id: 3, value: "SM", label: "Showroom 2" },
    ];
    //console.log(data?.data ,'user');

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

    const onChange =
        (key: keyof UserMaster) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                setForm((prev) => ({ ...prev, [key]: e.target.value }));
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
        //console.log(formData)
        setForm({ ...formData, pwd: "" });
        setImagePreview(formData.userImage ?? null);
        setConfirmPwd("");
    }, [userByIdData]);

    useEffect(()=>{
        if(!highlightId) {
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
            if (!form.pwd || !confirmPwd) {
                setError("Password and Confirm Password are required");
                return;
            }

            if (form.pwd !== confirmPwd) {
                setError("Password and Confirm Password do not match");
                return;
            }
        }

        // EDIT MODE → password optional, but must match if entered
        if (editingUserId && form.pwd) {
            if (form.pwd !== confirmPwd) {
                setError("Password and Confirm Password do not match");
                return;
            }
        }

        const payload: any = { ...form };

        // Remove empty password on edit
        if (editingUserId && !payload.pwd) {
            delete payload.pwd;
        }

        if (editingUserId) {
            patchUser(
                { userId: editingUserId, updates: payload },
                { onSuccess:()=>{
                    resetForm;
                    setHighlightedId(editingUserId);
                }  }
            );
        } else {
            createUser(
                
                { user: payload, image: selectedImage },
                { onSuccess:()=>{
                    resetForm;
                    setEditingUserId(payload.USERID)
                }  }
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
            userCostId: item.costId,
            billing: item.billing ?? false,
        });

        setImagePreview(item.userImage ?? "");
        setSelectedImage(undefined);
    };

    // Dummy table data
    const dummyUsers = [
        { id: 1, name: "Admin", centre: "Head Office", active: "YES" },
        { id: 2, name: "Ravi", centre: "Showroom 1", active: "YES" },
        { id: 3, name: "Kumar", centre: "Factory", active: "NO" },
    ];

    // ACTIVE STATUS SELECT LIST
    const activeStatus = createListCollection({
        items: [
            { label: "YES", value: "Y" },
            { label: "NO", value: "N" }
        ]
    });

    const UserMasterColumn = [
        {key: "userId", label: "User Id"},
        { key: "username", label: "User Name"},
        {key: "costId", label: "Cost Id"},
        {key: "active", label: "Active" ,align:'center' as const},
        {key: "action", label: "Actions" ,align:'center' as const},

    ]
   
    return (
        <Box
            className={fontVariables}
            fontFamily="var(--font-lustria)"
            bg={theme.colors.primary}
            color={theme.colors.secondary}
         
        >
            <Toaster />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={2}>

                {/* LEFT SECTION – USER FORM */}
                
                <GridItem display="flex" justifyContent="center">
                    <VStack
                        w="full"
                        maxW="500px"
                        bg={theme.colors.formColor}
                        p={4}
                        borderRadius="xl"
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >
                       
                            <Text fontSize="20px" fontWeight="600" >
                                {editingUserId ? "Edit User" : "User Master"}
                            </Text>

               

                        <Fieldset.Root size="lg" width="100%">
                            <Fieldset.Content>
                                {/* USER NAME */}
                                <Box display="flex" gap={2} justifyContent="space-between">
                                <Box>
                                <Field.Root>
                                    <Field.Label>User Name</Field.Label>
                                            <InputGroup startElement={<LuUser color={theme.colors.secondary} />}> 
                                                <Input
                                                    placeholder="Enter user name"
                                                    value={form.username}
                                                    onChange={onChange("username")}
                                                />

                                            </InputGroup>
                                  
                                </Field.Root>

                                {/* PASSWORD */}
                                <Field.Root>
                                    <Field.Label>Password</Field.Label>
                                            <InputGroup startElement={<RiLockPasswordLine color={theme.colors.secondary} />}>
                                                <PasswordInput
                                                    placeholder="Enter your password"
                                                    value={form.pwd}
                                                    onChange={onChange("pwd")}
                                                />

                                    </InputGroup>
                                </Field.Root>

                                {/* CONFIRM PASSWORD */}
                                <Field.Root>
                                    <Field.Label>Confirm Password</Field.Label>
                                            <Input
                                                type="password"
                                                placeholder="Re-enter password"
                                                value={confirmPwd}
                                                onChange={(e) => setConfirmPwd(e.target.value)}
                                            />

                                </Field.Root>
                                </Box>
                                    <Box textAlign="center" mt={4}>
                                        <Box
                                            w="120px"
                                            h="120px"
                                            border="1px solid #ddd"
                                            mx="auto"
                                            mb={3}
                                            borderRadius="md"
                                            overflow="hidden"
                                        >
                                            <Image
                                                src={imagePreview || "/favicon.ico"}
                                                width={120}
                                                height={120}
                                                alt="User"
                                                style={{ objectFit: "cover" }}
                                            />
                                        </Box>

                                        <Button size="sm" as="label" cursor="pointer">
                                            Select Image
                                            <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
                                        </Button>
                                    </Box>
                                </Box>

                                {/* COST CENTRE */}
                                <Box css={{display:'flex' ,justifyContent:'space-between' ,gap:2 }}>

                                    <Field.Root>
                                        <Field.Label>Cost Center</Field.Label>

                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.costId}
                                                onChange={onChange("costId")}
                                                css={{
                                                    backgroundColor: "#eee",
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    height: "42px",
                                                }}
                                            >
                                          

                                                <For each={costCenters}>
                                                    {(item) => (
                                                        <option key={item.id} value={item.value}>
                                                            {item.label}
                                                        </option>
                                                    )}
                                                </For>
                                            </NativeSelect.Field>

                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Field.Root>


                                {/* ACTIVE STATUS — USING CHAKRA SELECT v3 */}
                                <Field.Root>
                                    <Field.Label>Active</Field.Label>

                                    <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.active}
                                                onChange={onChange("active")}
                                                css={{
                                                    backgroundColor: '#eee',
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    height: "42px",
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
                                </Field.Root>
                                </Box>
                                {/* IMAGE UPLOAD */}
                                
                                {error && (
                                    <Text color="red.500" fontSize="sm" textAlign="center">
                                        {error}
                                    </Text>
                                )}

                                {/* ACTION BUTTONS */}
                                <HStack pt={2} justifyContent="center">
                                    <Button
                                        size="sm"
                                        loading={creating || updating}
                                        loadingText="Saving"
                                        onClick={handleSave}
                                        colorPalette="blue"
                                    >
                                        <AiOutlineSave /> {editingUserId ? "Update" : "Save"}
                                    </Button>

                                    {/* <Button size="sm" colorPalette="yellow">Open</Button>
                                    <Button size="sm"  colorPalette="blue" >New</Button> */}
                                    <Button size="sm" colorPalette="blue" onClick={resetForm} >Clear <IoIosExit /> </Button>
                                </HStack>
                            </Fieldset.Content>
                        </Fieldset.Root>
                    </VStack>
                </GridItem>

                {/* RIGHT SECTION – TABLE */}
                <GridItem>
                    <Box
                        p={4}
                        borderRadius="xl"
                        bg={theme.colors.formColor}
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >
                        <Text mb={2} fontWeight="bold" fontSize="lg" >
                            User List
                        </Text>

                        <Stack gap="10">
                            
                        <CustomTable 
                            columns={UserMasterColumn}
                            data={users}
                            size="sm"
                                                   headerBg='blue.800'
                                                   bodyBg = {theme.colors.primary}
                                                   headerColor='white'
                                                   emptyText="No parties available"
                                                   rowIdKey="userId"
                                                    highlightRowId={highlightId ? Number(highlightId) : null}
                                                   renderRow={(user, i) => (
                                                       <>
                                                           {/* <Table.Cell>{i + 1}</Table.Cell> */}
                                                           <Table.Cell>{user.userId}</Table.Cell>
                                                           <Table.Cell>{user.username}</Table.Cell>
                                                           <Table.Cell >{user.costId}</Table.Cell>
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
