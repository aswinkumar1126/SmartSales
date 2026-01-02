"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Button,
    Input,
    VStack,
    Text,
    Grid,
    GridItem,
    HStack,
    Stack,
    Fieldset,
    Field,
    NativeSelect,
    Textarea,
    createListCollection,
    For,
    Select,
    Portal,
    RadioGroup,
    Combobox,
    useFilter,
    useListCollection
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useTheme } from "@/context/theme/themeContext";
import { fontVariables } from "@/context/theme/font";
import {
    useAllCompanies,
    useCompanyById,
    useCreateCompany,
    useUpdateCompany,
} from "@/hooks/company/useCompany";

import ScrollToTop from "@/component/scroll/ScrollToTop";
import { CreateCompanyPayload, Company } from "@/service/CompanyService";
import { toastCreated, toastError, toastLoaded, toastUpdated, toastUploaded } from "@/component/toast/toast";
import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { useItems } from "@/hooks/item/useItems";

function OpeningMaster() {
    const { theme } = useTheme();

    /* -------------------- API HOOKS -------------------- */
    const { data:companies, isLoading: companiesLoading, isError: companiesError } = useAllCompanies();


    const companiesData = companies?.data ?? [];


    const { mutate: createCompany, isPending } = useCreateCompany();
    const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany();
    const { data: items ,isLoading:itemsLoading ,isError:itemsError } = useItems();


 
    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<CreateCompanyPayload>({
        COMPANYID: "",
        COMPANYNAME: "",
        // costid: "",
        ADDRESS1: "",
        ADDRESS2: "",
        ADDRESS3: "",
        AREACODE: "",
        PHONE: "",
        EMAIL: "",
        GSTNO: "",
        ACTIVE: "Y",
        STATEID: 1,
    });
    const [highlightedId, setHighlightedId] = useState<Number>()

    const [logoFile, setLogoFile] = useState<File>();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);

    /* -------------------- SELECT OPTIONS -------------------- */
    const activeStatus = createListCollection({
        items: [
            { label: "YES", value: "Y" },
            { label: "NO", value: "N" },
        ],
    });

    const stateItems = createListCollection({
        items: [
            { label: "TAMILNADU", value: 'TAMILNADU' },

        ],
    });
    const { contains } = useFilter({ sensitivity: "base" })
    // const itemsCollection = useMemo(
    //     () =>
    //         createListCollection({
    //             items:
    //                 items?.items?.map((i: any) => ({
    //                     value: i.itemId,
    //                     label: i.itemName,
    //                 })) ?? [],
    //         }),
    //     [items]
    // );

    const listItems = useMemo(() => {
        return (
            items?.items?.map((i: any) => ({
                label: i.itemName ?? "Unnamed",
                value: String(i.itemId),
            })) ?? []
        );
    }, [items]);

    const {
        collection: itemCollection,
        filter: itemsFilter,
        set: setItems,          // ✅ IMPORTANT
    } = useListCollection({
        initialItems: [],
        filter: contains,
    });

    useEffect(() => {
        if (!listItems.length) return;

        setItems(listItems);    // ✅ CORRECT
        itemsFilter("");        // optional reset
    }, [listItems, setItems, itemsFilter]);

   

    const transList = [
        { label: 'ISSUE', value: 'ISS' },
        { label: 'RECEIPT', value: 'RET' },
        { label: 'PURCHASE RETURN', value: 'PR' }];


    const { collection: transCollection, filter:tranFilter } = useListCollection({
        initialItems: transList,
        filter: contains,
    });


    const { data: companyById } = useCompanyById(editId ?? '');

    const company = companyById?.data;

    useEffect(() => {
        if (!company) return;

        setForm({
            COMPANYID: company.COMPANYID,
            COMPANYNAME: company.COMPANYNAME,
            // costid: company.COSTID ?? "",
            ADDRESS1: company.ADDRESS1 ?? "",
            ADDRESS2: company.ADDRESS2 ?? "",
            ADDRESS3: company.ADDRESS3 ?? "",
            AREACODE: company.AREACODE ?? "",
            PHONE: company.PHONE ?? "",
            EMAIL: company.EMAIL ?? "",
            GSTNO: company.GSTNO ?? "",
            ACTIVE: company.ACTIVE ?? "Y",
            STATEID: company.STATEID ?? 1,
        });
    }, [company]);

    useEffect(() => {
        if (!company) return;

        // ✅ AFTER render is fully committed
        setTimeout(() => {
            toastLoaded("Company");
            ScrollToTop();
        }, 0);


    }, [company]);

    useEffect(() => {
        if (!highlightedId) return;

        // ✅ AFTER render is fully committed
        const timer = setTimeout(() => {

            setHighlightedId(undefined);
        }, 3000);

        return () => clearTimeout(timer);

    }, [highlightedId]);


    /* -------------------- HANDLERS -------------------- */
    const handleChange = (field: keyof CreateCompanyPayload, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setEditId(null);
        setLogoFile(undefined);
        setImagePreview(null);
        setForm({
            COMPANYID: "",
            COMPANYNAME: "",
            // costid: "",
            ADDRESS1: "",
            ADDRESS2: "",
            ADDRESS3: "",
            AREACODE: "",
            PHONE: "",
            EMAIL: "",
            GSTNO: "",
            ACTIVE: "Y",
            STATEID: 1,
        });
    };


    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = () => {
        if (!form.COMPANYID) {
            toastError("Company ID is required");
            return;
        }

        if (form.COMPANYID.length > 4) {
            toastError("Company ID must be at most 3 characters long");
            return;
        }

        if (!form.COMPANYNAME?.trim()) {
            toastError("Company Name is required");
            return;
        }
        if (!form.ADDRESS1?.trim()) {
            toastError("Address is required");
            return;
        }
        if (!form.ADDRESS2?.trim()) {
            toastError("Area is required");
            return;
        }
        if (!form.ADDRESS3?.trim()) {
            toastError("City is required");
            return;
        }
        if (!form.AREACODE?.trim()) {
            toastError("Pincode is required");
            return;
        }

        if (form.AREACODE) {
            const pinRegex = /^[0-9]{6}$/;
            if (!pinRegex.test(form.AREACODE)) {
                toastError("Pincode must be exactly 6 digits");
                return;
            }
        }
        if (!form.PHONE?.trim()) {
            toastError("Mobile Number is required");
            return;
        }
        if (!form.EMAIL?.trim()) {
            toastError("Email is required");
            return;
        }


        if (editId) {
            updateCompany({
                id: editId,
                payload: form,
                logo: logoFile,
            }, {
                onSuccess: () => {
                    resetForm;
                    setHighlightedId(Number(editId));
                }
            })
                ;

        } else {
            createCompany({
                payload: form,
                logo: logoFile,
            });

        }

        resetForm();
    };


    const handleEdit = (company: Company) => {
        setEditId(company.COMPANYID); // 🔥 trigger useCompanyById
    };

    const CompanyColumn = [
        { key: 'companyId', label: 'Company Id' },
        { key: 'companyName', label: 'Company Name' },
        // {key:'costId' , label:'Cost Id' },
        { key: 'active', label: 'Active' },
        { key: 'actions', label: 'Actions' },
    ];

    const choices = [
        { label: "METAL", value: "M" },
        { label: "ORNAMENT", value: "O" },
    ]


    /* -------------------- UI -------------------- */
    return (
        <Box
            className={fontVariables}
            fontFamily="var(--font-lustria)"
            bg={theme.colors.primary}
            color={theme.colors.secondary}

        >
            <Toaster />
            <Grid templateColumns={{ base: "1fr" }} gap={4}>
                {/* ---------------- FORM ---------------- */}

                <GridItem>
                    <VStack bg={theme.colors.formColor} p={4} borderRadius="xl" border="1px solid #eef">
                        <Text fontSize="lg" fontWeight="600" >

                        </Text>
                        <Box >
                            <RadioGroup.Root defaultValue="M" size="xs" >
                                <HStack gap="4">
                                    {choices.map((item) => (
                                        <RadioGroup.Item key={item.value} value={item.value}>
                                            <RadioGroup.ItemHiddenInput />
                                            <RadioGroup.ItemIndicator />
                                            <RadioGroup.ItemText>{item.label}</RadioGroup.ItemText>
                                        </RadioGroup.Item>
                                    ))}
                                </HStack>
                            </RadioGroup.Root>
                        </Box>
                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <Grid templateColumns="repeat(7,1fr)" gap={2} minW={0}>


                                    <Field.Root >
                       
                                        <Combobox.Root
                                            collection={itemCollection}
                                            onInputValueChange={(e) => itemsFilter(e.inputValue)}
                                        
                                        >
                                            <Combobox.Label>Item</Combobox.Label>
                                            <Combobox.Control>
                                                <Combobox.Input placeholder="Type to Search Items" />
                                                <Combobox.IndicatorGroup>
                                                    <Combobox.ClearTrigger />
                                                    <Combobox.Trigger />
                                                </Combobox.IndicatorGroup>
                                            </Combobox.Control>
                                            <Portal>
                                                <Combobox.Positioner>
                                                    <Combobox.Content>
                                                        <Combobox.Empty>No items found</Combobox.Empty>
                                                        {itemCollection.items.map((item: any) => (
                                                            <Combobox.Item item={item} key={item.value}>
                                                                {item.label}
                                                                <Combobox.ItemIndicator />
                                                            </Combobox.Item>
                                                        ))}
                                                    </Combobox.Content>
                                                </Combobox.Positioner>
                                            </Portal>
                                        </Combobox.Root>
                                        {/* <Field.ErrorText>{errors.itemId}</Field.ErrorText> */}
                                    </Field.Root>


                                    <Field.Root >
                                  

                                        <Combobox.Root
                                            collection={transCollection}
                                            onInputValueChange={(e) => tranFilter(e.inputValue)}
                                       
                                        >
                                            <Combobox.Label>Transaction Type</Combobox.Label>
                                            <Combobox.Control>
                                                <Combobox.Input placeholder="Type to Search Items" />
                                                <Combobox.IndicatorGroup>
                                                    <Combobox.ClearTrigger />
                                                    <Combobox.Trigger />
                                                </Combobox.IndicatorGroup>
                                            </Combobox.Control>
                                            <Portal>
                                                <Combobox.Positioner>
                                                    <Combobox.Content>
                                                        <Combobox.Empty>No items found</Combobox.Empty>
                                                        {transCollection.items.map((item: any) => (
                                                            <Combobox.Item item={item} key={item.value}>
                                                                {item.label}
                                                                <Combobox.ItemIndicator />
                                                            </Combobox.Item>
                                                        ))}
                                                    </Combobox.Content>
                                                </Combobox.Positioner>
                                            </Portal>
                                        </Combobox.Root>
                                        {/* <Field.ErrorText>{errors.itemId}</Field.ErrorText> */}
                                    </Field.Root>

                                    
                                    <Field.Root>
                                        <Field.Label>Pieces</Field.Label>
                                        <CapitalizedInput<CreateCompanyPayload>
                                            field="COMPANYID"
                                            value={form.COMPANYID}
                                            disabled={!!editId}   // ✅ lock during edit
                                            onChange={handleChange}
                                            
                                            type="number"   

                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Gross Weight</Field.Label>
                                        <CapitalizedInput<CreateCompanyPayload>
                                            field="COMPANYNAME"
                                            value={form.COMPANYNAME}
                                            onChange={handleChange}
                                     
                                            type="number"
                                        />
                                    </Field.Root>

                                    {/* <Field.Root>
                                        <Field.Label>Cost Id</Field.Label>
                                        <Input
                                            value={form.costid}
                                            onChange={(e) => handleChange("costid", e.target.value)}
                                        />
                                    </Field.Root> */}



                                    <Field.Root gridColumn="span ">
                                        <Field.Label>Less Weight</Field.Label>
                                        <CapitalizedInput
                                            field="ADDRESS1"
                                            value={form.ADDRESS1}
                                            onChange={handleChange}
                                            type="number"
                                            max={999.999}
                                        />
                                    </Field.Root>

                                    <Field.Root gridColumn="span">
                                        <Field.Label>Purity</Field.Label>
                                        <CapitalizedInput
                                            field="ADDRESS2"
                                            value={form.ADDRESS2}
                                            onChange={handleChange}
                                            type="number"   
                                            max={999.999}
                                            
                                        />
                                    </Field.Root>

                                    <Field.Root gridColumn="span">
                                        <Field.Label>PureWeight</Field.Label>
                                        <CapitalizedInput
                                            field="ADDRESS3"
                                            value={form.ADDRESS3}
                                            onChange={handleChange}
                                            type="number"
                                            max={999.999}
                                        />
                                    </Field.Root>



                                    <Field.Root>

                                        <Field.Label>Rate</Field.Label>
                                        <CapitalizedInput
                                            field="AREACODE"
                                            value={form.AREACODE}
                                            onChange={handleChange}
                                            max={999999}
                                            type="number"

                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Making Cost</Field.Label>
                                        <CapitalizedInput
                                            field="PHONE"
                                            value={form.PHONE}
                                            onChange={handleChange}
                                            max={9999999999}
                                            type="number"

                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Wastage</Field.Label>
                                        <Input
                                            value={form.EMAIL}
                                            onChange={(e) => handleChange("EMAIL", e.target.value)}
                                            type="number"
                                        />
                                    </Field.Root>




                                </Grid>
                            </Fieldset.Content>
                        </Fieldset.Root>

                        <HStack pt={3}>
                            <Button
                                size="sm"
                                colorPalette="blue"
                                loading={isPending}
                                onClick={handleSave}
                            >
                                <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>
                            <Button size="sm" colorPalette="blue" onClick={resetForm}>
                                <IoIosExit /> Exit
                            </Button>
                        </HStack>
                    </VStack>
                </GridItem>

            </Grid>
        </Box>
    );
}

export default OpeningMaster;
