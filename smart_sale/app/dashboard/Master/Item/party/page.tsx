"use client";

import React, { useEffect, useState } from "react";
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
    createListCollection
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
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
    const { theme } = useTheme();

    const [form, setForm] = useState<PartyForm>(initialFormState);
    const [isEdit, setIsEdit] = useState(false);
    const [id, setId] = useState<number | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);

    const { data: companiesData} = useAllCompanies();
    const { data: partyData = [], refetch } = useAllParties();
    const { data: partyById } = usePartyById(id ? String(id) : "");
    const createParty = useCreateParty();
    const updateParty = useUpdateParty();

    /** Map API → Form on edit */
    useEffect(() => {
        if (partyById) {
            setForm({
                companyType: partyById.companyType,
                companyId: partyById.companyId,
                bookName: partyById.bookName,
                slipNo: String(partyById.slipNo),
                openWeight: String(partyById.openWeight),
                openPure: String(partyById.openPure),
                openCash: String(partyById.openCash),
                userId: String(partyById.userId),
            });
        }
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
        slipNo: Number(form.slipNo),
        openWeight: Number(form.openWeight),
        openPure: Number(form.openPure),
        openCash: Number(form.openCash),
        userId: Number(form.userId),
    });

    const handleSave = () => {
        if (!form.companyId) {
            toastError("Company name is required");
            return;
        }

        if (!form.slipNo) {
            toastError("Slip number is required");
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
        { key: "weight", label: "Open Wt", align: "end" as const },
        { key: "cash", label: "Cash", align: "end" as const },
        { key: "action", label: "Action", align: "center" as const },
    ];

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


                        <Fieldset.Root>
                            <Fieldset.Content>
                                {[
                                    ["Company Type", "companyType"],
                                    ["Slip No", "slipNo"],
                                    ["Open Weight", "openWeight"],
                                    ["Open Pure", "openPure"],
                                    ["Open Cash", "openCash"],
                                ].map(([label, key]) => {
                                    const isNumber = numberFields.includes(
                                        key as keyof PartyForm
                                    );

                                    return (
                                        <Field.Root key={key}>
                                            <Field.Label>{label}</Field.Label>

                                            <Input
                                                type={isNumber ? "number" : "text"}
                                                inputMode={isNumber ? "numeric" : "text"}
                                                value={form[key as keyof PartyForm]}
                                                onChange={(e) => {
                                                    const value = e.target.value;

                                                    // ⛔ Block non-numeric input
                                                    if (isNumber && value !== "" && !/^\d*\.?\d*$/.test(value)) {
                                                        return;
                                                    }

                                                    handleChange(
                                                        key as keyof PartyForm,
                                                        value
                                                    );
                                                }}
                                            />
                                        </Field.Root>
                                    );
                                })}

                                <HStack pt={4} justifyContent="center">
                                    <Button size="sm" onClick={handleSave} colorPalette="blue">
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
                    <Text fontSize='18px' fontWeight="bold">
                        Party List 
                    </Text>
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
                                <Table.Cell>{party.companyId}</Table.Cell>
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
