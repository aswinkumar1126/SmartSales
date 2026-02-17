"use client";

import React, { useEffect, useState ,useMemo } from "react";
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
    Select,
    Portal ,
    createListCollection,
    Flex
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { FaEdit ,FaPrint ,FaFileExcel } from "react-icons/fa";
import { IoIosExit } from "react-icons/io";
import { fontVariables } from "@/context/theme/font";
import { useTheme } from "@/context/theme/themeContext";

import { useAllParties } from "@/hooks/party/useGetParty";
import { usePartyById } from "@/hooks/party/useGetPartyById";
import { useCreateParty } from "@/hooks/party/useCreateParty";
import { useUpdateParty } from "@/hooks/party/useUpdateParty";

import { PartyForm, CreateParty, GetParty } from "@/types/party/party";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { toastError, toastLoaded } from "@/component/toast/toast";
import { Toaster } from "@/components/ui/toaster";
import { FiEdit } from "react-icons/fi";
import { CustomTable } from "@/component/table/CustomTable";
import { useAllCompanies } from "@/hooks/company/useCompany";
import { formatToFixed } from "@/utils/format/numberFormat";

import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";

const initialFormState: PartyForm = {
    companyType: "",
    companyId: "",
    bookName: "",
    slipNo: "",
    openWeight: "",
    openPure: "",
    openCash: "",
    userId: "",
};

function PartyMaster() {

    //---------------State ManageMent---------------------
   

    const [form, setForm] = useState<PartyForm>(initialFormState);
    const [isEdit, setIsEdit] = useState(false);
    const [id, setId] = useState<number | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);

    //------------------------ Hooks-------------------------
    const { theme } = useTheme();
    const router = useRouter();
    const { setData, setColumns ,title } = usePrint();
    const { data: companiesData} = useAllCompanies();
    const { data: partyData = [], refetch } = useAllParties();
    const { data: partyById } = usePartyById(id ? String(id) : "");
    const createParty = useCreateParty();
    const updateParty = useUpdateParty();

 

    /* Map API → Form on edit */
    useEffect(() => {
        if (!partyById) return;

        setForm({
            companyType: partyById.companyType ?? "",
            companyId: partyById.companyId ?? "",
            bookName: partyById.bookName ?? "",  
            slipNo: partyById.slipNo ? String(partyById.slipNo) : "",
            openWeight: partyById.openWeight ? String(partyById.openWeight) : "",
            openPure: partyById.openPure ? String(partyById.openPure) : "",
            openCash: partyById.openCash ? String(partyById.openCash) : "",
            userId: partyById.userId ? String(partyById.userId) : "",
        });
    }, [partyById]);

    const handleChange = (field: keyof PartyForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };


    const companies = companiesData?.data || [];

    const companyCollection = React.useMemo(
        () =>
            createListCollection({
                items: companies.map((company) => ({
                    label: company.COMPANYNAME || company.COMPANYID, // adjust API key
                    value: company.COMPANYID,                  // MUST be string
                })),
            }),
        [companies]
    );
     const companyTypeCollection = useMemo(
            () =>
                createListCollection({
                    items: [
                        { value: "CUS", label: "CUSTOMER" },
                        { value: "SEL", label: "SELLER" },
                    ],
                }),
            []
        );

    const resetForm = () => {
        setForm(initialFormState);
        setIsEdit(false);
        setId(null);
    };
      useEffect(()=>{
        if(!highlightRowId) {
            return;
        }
        const timer = setTimeout(() => {
            setHighlightRowId(null);
        }, 3000);
        return () => clearTimeout(timer);
       })

    /** Convert Form → API Payload */
    const buildPayload = (): CreateParty => ({
        companyType: form.companyType,
        companyId: form.companyId,
        bookName: form.bookName,
        slipNo: Number(form.slipNo),
        openWeight: Number(form.openWeight),
        openPure: Number(form.openPure),
        openCash: Number(form.openCash),
        userId: Number(form.userId),
    });

    //-------------- Handle Submit -----------------------

    const handleSave = () => {
        if (!form.companyId) {
            toastError("Company name is required");
            return;
        }
        if(!form.companyType){
            toastError("Company type is required");
            return;
        }

        if (!form.slipNo) {
            toastError("Slip number is required");
            return;
        }
        if (!form.openWeight) {
            toastError("Open weight is required");
            return;
        }
        if (!form.openPure) {
            toastError("Open cash is required");
            return;
        }
        if(!form.openCash){
            toastError("Open cash is required");
            return;
        }

        const payload = buildPayload();

        if (isEdit && id !== null) {
            updateParty.mutate(
                {
                    id: id,              
                    payload: payload,
                },
                {
                    onSuccess: () => {
                        setHighlightRowId(id);
                        toastLoaded("Party updated successfully");
                        resetForm();
                        refetch();
                    },
                }
            );

        } else {
            createParty.mutate(payload, {
                onSuccess: (res) => {
                   
                    toastLoaded("Party created successfully");
                    resetForm();
                    refetch();
                },
            });
        }
    };

    const handleEdit = (party: GetParty) => {
        toastLoaded("Editing party");
        setIsEdit(true);
        setId(party.sno);
        scrollToTop();
    };
    const numberFields: (keyof PartyForm)[] = [
        "slipNo",
        "openWeight",
        "openPure",
        "openCash",
    ];

    const partyColumns = [
        { key: "sno", label: "S.No" },
        { key: "company", label: "Company" },
        { key: "slip", label: "Slip", align: "end" as const },
        { key: "weight", label: "Open Wt", align: "end" as const ,showTotal:true },
        { key: "cash", label: "Cash", align: "end" as const },
        { key: "action", label: "Action", align: "center" as const },
    ];

    const handleExport = (option: string) => {

        setData(partyData);
        setColumns([
            { key: "sno", label: "S.No" },
            { key: "COMPANYNAME", label: "Company" },
            { key: "slipNo", label: "Slip"},
            { key: "openWeight", label: "Open Wt", align: "end" as const, allowTotal: true },
            { key: "openCash", label: "Open Cash", align: "end" as const, allowTotal: true },
        ]);
        router.push(`/print?export=${option}`);
        title?.("Party Master ")

    }

    return (
        <Box
            className={fontVariables}
            fontFamily="var(--font-lustria)"
            bg={theme.colors.primary}
            color={theme.colors.secondary}
        >
            <Toaster />

            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
                {/* FORM */}
                <GridItem display="flex" justifyContent="center">
                    <VStack
                        w="full"
                        maxW="500px"
                        bg={theme.colors.formColor}
                        p={4}
                        borderRadius="xl"
                    >
                        <Text fontSize="20px" fontWeight="bold" >
                            Party Master
                        </Text>
                        <Field.Root>
                            <Field.Label>Company</Field.Label>

                            <Select.Root
                                collection={companyCollection}
                                size="sm"
                                value={[form.companyId]} // ✅ must be array
                                onValueChange={(details) =>
                                    handleChange("companyId", details.value[0])
                                }
                            >
                                <Select.HiddenSelect />

                                <Select.Control>
                                    <Select.Trigger>
                                        <Select.ValueText placeholder="Select company" />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                        <Select.Indicator />
                                    </Select.IndicatorGroup>
                                </Select.Control>

                                <Portal>
                                    <Select.Positioner>
                                        <Select.Content>
                                            {companyCollection.items.map((company:any) => (
                                                <Select.Item item={company} key={company.value}>
                                                    {company.label}
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                            ))}
                                        </Select.Content>
                                    </Select.Positioner>
                                </Portal>
                            </Select.Root>
                        </Field.Root>
                             <Field.Root >
                                                    <Field.Label>Company Type</Field.Label>
                                                    <Select.Root
                                                        collection={companyTypeCollection}
                                                        value={[form.companyType]}
                                                        onValueChange={(e) =>
                                                            handleChange("companyType", e.value[0])
                                                        }
                                                    >
                                                        <Select.HiddenSelect />
                                                      
                                                        <Select.Control>
                                                            <Select.Trigger>
                                                                <Select.ValueText placeholder="Select Type" />
                                                            </Select.Trigger>
                                                            <Select.IndicatorGroup>
                                                                <Select.Indicator />
                                                            
                                                            </Select.IndicatorGroup>
                                                        </Select.Control>
                                                     
                                                        <Portal>
                                                            <Select.Positioner>
                                                                <Select.Content>
                                                                    {companyTypeCollection.items.map((item:any) => (
                                                                        <Select.Item key={item.value} item={item}>
                                                                            <Select.ItemText>
                                                                                {item.label}
                                                                            </Select.ItemText>
                                                                            <Select.ItemIndicator />
                                                                        </Select.Item>
                                                                    ))}
                                                                </Select.Content>
                                                            </Select.Positioner>
                                                        </Portal>
                                                    </Select.Root>
                                                    {/* <Field.ErrorText>{errors.companyType}</Field.ErrorText> */}
                                                </Field.Root>


                        <Fieldset.Root>

                            <Field.Root>
                                <Field.Label>
                                           Book Name                          
                                </Field.Label>
                                <CapitalizedInput 
                                    field="bookName"
                                    type="text" 
                                    value={form.bookName}
                                    onChange={handleChange}
                                    placeholder="enter your book name"
                                />                                   

                            </Field.Root>
                            <Fieldset.Content>
                                {[
                                 
                                    ["Slip No", "slipNo"],
                                  
                                    ["Open Weight", "openWeight"],
                                    ["Open Pure", "openPure"],
                                    ["Open Cash", "openCash"],
                                ].map(([label, key]) => {
                                    const typedKey = key as keyof PartyForm;

                                    const isNumber = numberFields.includes(typedKey);

                                    return (
                                        <Field.Root key={key}>
                                            <Field.Label>{label}</Field.Label>
                                            <CapitalizedInput<PartyForm>
                                                field={typedKey}                      // ✅ FIX
                                                type={isNumber ? "number" : "text"}
                                                value={form[typedKey]}
                                                onChange={handleChange}
                                            />
                                        </Field.Root>
                                    );
                                })}

                                <HStack pt={4} justifyContent="center">
                                    <Button size="sm" onClick={handleSave} colorPalette="blue" >
                                        <AiOutlineSave /> {isEdit ? "Update" : "Save"}
                                    </Button>
                                    <Button size="sm" onClick={resetForm} colorPalette="blue">
                                        Exit <IoIosExit />
                                    </Button>
                                </HStack>
                            </Fieldset.Content>
                        </Fieldset.Root>

                    </VStack>
                </GridItem>

                {/* TABLE */}
                <GridItem gap={2} minW={0}>
                    <Box
                        p={4}
                        borderRadius="xl"
                        bg={theme.colors.formColor}
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                       
                    >
                      <Box display="flex" justifyContent="space-between" gap={2}>
                            <Text fontSize='18px' fontWeight="bold">
                                Party List
                            </Text>
                              <Flex gap={1}>
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
                 
                    <CustomTable
                        columns={partyColumns}
                        data={partyData}
                        size="sm"
                        headerBg='blue.800'
                        bodyBg = {theme.colors.primary}
                        headerColor='white'
                        emptyText="No parties available"
                        rowIdKey="sno"
                        highlightRowId={highlightRowId}
                        renderRow={(party, i) => (
                            <>
                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>{party.COMPANYNAME}</Table.Cell>
                                <Table.Cell textAlign="end">{party.slipNo}</Table.Cell>
                                <Table.Cell textAlign="end">{formatToFixed(party.openWeight,3)}</Table.Cell>
                                <Table.Cell textAlign="end">{formatToFixed(party.openCash ,2) }</Table.Cell>
                                <Table.Cell>
                                    <Box display="flex" justifyContent="center">
                                        <FiEdit onClick={() => handleEdit(party)} cursor="pointer" />
                                    </Box>
                                </Table.Cell>
                            </>
                        )}

                    />
                    </Box>
                </GridItem>

            </Grid>
        </Box>
    );
}

export default PartyMaster;
