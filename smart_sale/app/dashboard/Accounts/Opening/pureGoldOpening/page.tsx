"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Field,
    Input,
    Grid,
    GridItem,
    Button,
    Table,
    Heading,
    HStack,
    Flex,
    Text
} from "@chakra-ui/react";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { IoIosAdd, IoIosExit } from "react-icons/io";

import { useTheme } from "@/context/theme/themeContext";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { toastLoaded } from "@/component/toast/toast";

import { CustomTable } from "@/component/table/CustomTable";
import { usePrint } from "@/context/print/usePrintContext";
import { pureGoldMastForm, pureGoldMastOpenForm } from "@/types/pureGold/pureGold";

import { usePureGoldData ,usePureGoldNames} from "@/hooks/pureGoldMast/usePureGoldMastData";
import { useCreatePureGoldMast } from "@/hooks/pureGoldMast/usePureGoldMastCreate";
import { useUpdatePureGoldMast } from "@/hooks/pureGoldMast/usePureGoldMastUpdate";
import { AiOutlineSave } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { formatToFixed } from "@/utils/format/numberFormat";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { useAllMetals } from "@/hooks/metal/useMetals";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { safeValue } from "@/utils/comboBox/safeValue";
import SearchBar from "@/component/search/SearchBar";
/* ---------------- Initial Form State ---------------- */

const initialFormState: pureGoldMastOpenForm = {
    pureId: "",
    weight: "",
    actualTouch: "",
    actualPure: "",
    // metalId:""
};

/* ---------------- Table Row Type ---------------- */

export type TouchTableRow = {
    sno: number;
    pureId?:string;
    pureGoldName: string;
    weight: number;
    actualTouch: number;
    actualPure: number;
    // metalId ?: string

};

/* ---------------- Component ---------------- */

const PureGoldOpening = () => {
    /* ---------------- State ---------------- */

    const [form, setForm] = useState<pureGoldMastOpenForm>(initialFormState);
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);

    type FormErrors = Partial<Record<keyof pureGoldMastOpenForm, string>>;
    const [errors, setErrors] = useState<FormErrors>({});
    const [metalData, setMetalData] = useState<{ label: string, value: string }[]>([]);
    const [pureGoldName, setPureGoldName] = useState<{ label: string, value: string }[]>([]);

    const [filter,setFilter] = useState<string>('');
    /* ---------------- Hooks ---------------- */
    const router = useRouter();
    const { theme } = useTheme();
     const {setData ,setColumns ,title } = usePrint();
  
    const { data: pureGoldData = [], refetch } = usePureGoldData(filter);
    const { data: metalsData } = useAllMetals();
   
    const { data: allPureGoldNames = []} = usePureGoldNames();


    const createMutation = useCreatePureGoldMast();
    const updateMutation = useUpdatePureGoldMast();


    /* --------------- ComboBox Data ------------- */
    // useEffect(() => {
    //     if (!Array.isArray(metalsData)) return;
    //     if (!metalsData.length) return;

    //     const fetchedData = metalsData.map((m: any) => ({
    //         label: m.metalName,
    //         value: m.metalId,
    //     }));

    //     setMetalData(fetchedData);
    // }, [metalsData]);


    useEffect(() => {
        if (!Array.isArray(allPureGoldNames)) return;
        if (!allPureGoldNames.length) return;

        const fetchedData = allPureGoldNames.map((p: any) => ({
            label: p.pureGoldName,
            value: String(p.pureId),
        }));

        setPureGoldName(fetchedData);
    }, [allPureGoldNames]);

    /* ---------------- Helpers ---------------- */
    useEffect(() => {
        const weight = Number(form.weight);
        const touch = Number(form.actualTouch);

        if (!isNaN(weight) && !isNaN(touch)) {
            const pure = (weight * touch) / 100;
            setForm((prev) => ({
                ...prev,
                actualPure: pure ? pure.toFixed(3) : "",
            }));
        }
    }, [form.weight, form.actualTouch]);


    const handleChange = (key: keyof pureGoldMastOpenForm, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const resetForm = () => {
        setForm(initialFormState);
        setEditId(null);
        setErrors({});
    };

    /* ---------------- Edit Handler ---------------- */

    const handleEdit = (row: TouchTableRow) => {
        setEditId(row.sno);
        scrollToTop();

    

        setForm({
            pureId: String(row.pureId),
            weight: String(row.weight),
            actualPure: String(row.actualPure),
            actualTouch: String(row.actualTouch),
            // metalId: row.metalId ?? ''
        });

        toastLoaded("Pure Gold Master");
    };

    /* ---------------- Validation ---------------- */

    const validateForm = (form: pureGoldMastOpenForm): FormErrors => {
        const errors: FormErrors = {};

        if (!form.pureId) errors.pureId = "Pure Gold Name is required";
        if (!form.weight) errors.weight = "Weight is required";
        if (!form.actualPure) errors.actualPure = "Actual Pure is required";
        if (!form.actualTouch) errors.actualTouch = "Actual Touch is required";
        // if (!form.metalId) errors.metalId = "Metal Name is required";


        return errors;
    };

    /* ---------------- Submit Handler ---------------- */

    const isDuplicatePureForMetal = (
        pureId: any,
        // metalId: any,
        excludeSno?: number| null
    ) => {
        return pureGoldData.some((p: any) => {
          
            const samePure =
                Number(p.pureId) === Number(pureId);

            const notSameRow =
                excludeSno ? Number(p.sno) !== Number(excludeSno) : true;

            return samePure && notSameRow;
        });
    };

    const handleSubmit = () => {
        const validationErrors = validateForm(form);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const payload = {
            pureId: Number(form.pureId),
            weight: Number(form.weight),
            actualTouch: Number(form.actualTouch),
            // actualPure: Number(form.actualPure),
            // metalId: String(form.metalId),
        };

        // 🔒 duplicate check (common for create & edit)
        if (form.pureId) {
            const exists = isDuplicatePureForMetal(
                form.pureId,
                // form.metalId,
                editId 
            );

            if (exists) {
                setErrors((prev: any) => ({
                    ...prev,
                    pureId: 'This TOUCH already exists for the selected metal',
                }));
                return;
            }
        }

        if (editId) {
            updateMutation.mutate(
                { id: editId, data: payload },
                {
                    onSuccess: () => {
                        setHighlightRowId(editId);
                        resetForm();
                        refetch();
                    },
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: (res: any) => {
                    setHighlightRowId(res?.data?.id);
                    resetForm();
                    refetch();
                },
            });
        }
    };


    /* ---------------- Table Columns ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },
        { key: "pureGoldName", label: "Pure Gold Name" },
        { key: "weight", label: "Weight" ,align : "end" as const },
        { key: "actualTouch", label: "Actual Touch", align: "end" as const },
        { key: "actualPure", label: "Actual Pure", align: "end" as const },
        { key: "action", label: "Action", align: "center" as const },
    ];

    /* ---------------- Row Highlight Animation ---------------- */

    useEffect(() => {
        if (!highlightRowId) return;

        const timer = setTimeout(() => setHighlightRowId(null), 2500);
        return () => clearTimeout(timer);
    }, [highlightRowId]);

    /* ---------------- Export ---------------- */
    const handleExport = (option: string) => {
        setData(pureGoldData);
        title?.("Pure Gold Opening List")
        setColumns([
            { key: "sno", label: "S.No" },
            { key: "pureGoldName", label: "Pure Gold Name" },
            { key: "weight", label: "Weight", align: 'end' as const, allowTotal: true },
            { key: "actualTouch", label: "Actual Touch", align: 'end' as const, },
            { key: "actualPure", label: "Actual Pure", align: 'end' as const, allowTotal: true },
        ]);
        router.push(`/print?export=${option}`);
    }


    /* ---------------- UI ---------------- */

    return (
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }}  fontWeight='semibold' gap={2}>
            <Toaster />

            {/* -------- Form Section -------- */}
            <GridItem>
                <Box p={2} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    <Heading
                        display="flex"
                        mx="auto"
                        alignItems="center"
                        justifyContent="center"
                        mb={2}
                    >
                        <Text fontSize="small" fontWeight='semibold'  >
                       PURE GOLD OPENING
                    
                    </Text>
                    </Heading>
                    <Box display="grid"   gap={2}>
                        {/* PURE GOLD NAME */}
                        <Field.Root invalid={!!errors.pureId}>
                            <HStack>
                                <Box minW="100px">
                                    <Field.Label fontSize="2xs">PURE GOLD NAME :</Field.Label>
                                </Box>
                                <Box flex={1}>
                                    <SelectCombobox
                                        value={safeValue(form.pureId, pureGoldName)}
                                        onChange={(val) => {
                                            handleChange("pureId", val);
                                        }}
                                        editId={Number(editId)}
                                        items={pureGoldName}
                                        placeholder="SELECT NAME"

                                    />
                                    <Field.ErrorText>{errors.pureId}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root>

                        {/* METAL NAME */}
                        {/* <Field.Root invalid={!!errors.metalId}>
                            <HStack>
                                <Box minW="100px">
                                    <Field.Label fontSize="2xs">METAL :</Field.Label>
                                </Box>
                                <Box flex={1}>
                                    <SelectCombobox
                                        value={safeValue(form.metalId, metalData)}
                                        onChange={(val) => handleChange("metalId", val)}
                                        editId={Number(editId)}
                                        items={metalData}
                                        placeholder="SELECT METAL"


                                    />
                                    <Field.ErrorText>{errors.metalId}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root> */}


                        {/* WEIGHT */}
                        <Field.Root invalid={!!errors.weight}>
                            <HStack>
                                <Box minW="100px">
                                    <Field.Label fontSize="2xs">WEIGHT :</Field.Label>
                                </Box>
                                <Box flex={1}>
                                    <CapitalizedInput
                                        field="weight"
                                        type="number"
                                        value={form.weight}
                                        onChange={handleChange}
                                        placeholder="Enter weight"
                                        size="2xs"
                                        max={9999999999}
                                        decimalScale={3}
                                    
                                    />
                                    <Field.ErrorText>{errors.weight}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root>

                        {/* ACTUAL TOUCH */}
                        <Field.Root invalid={!!errors.actualTouch}>
                            <HStack>
                                <Box minW="100px">
                                    <Field.Label fontSize="2xs">TOUCH :</Field.Label>
                                </Box>
                                <Box flex={1}>
                                    <CapitalizedInput
                                        field="actualTouch"
                                        type="number"
                                        value={form.actualTouch}
                                        onChange={handleChange}
                                        placeholder="Enter actual touch"
                                        size="2xs"
                                        max={999}
                                        decimalScale={2}
                                    />
                                    <Field.ErrorText>{errors.actualTouch}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root>

                        {/* ACTUAL PURE */}
                        <Field.Root invalid={!!errors.actualPure}>
                            <HStack>
                                <Box minW="100px">
                                    <Field.Label fontSize="2xs">PURE :</Field.Label>
                                </Box>
                                <Box flex={1}>
                                    <CapitalizedInput
                                        field="actualPure"
                                        type="number"
                                        value={form.actualPure}
                                        onChange={handleChange}
                                        placeholder="see actual pure"
                                        size="2xs"
                                        max={999}
                                        decimalScale={3}
                                        disabled
                                    />
                                    <Field.ErrorText>{errors.actualPure}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root>
                       
                       
                    </Box>
                    {/* ================= ACTION BUTTONS ================= */}
                    <Box mt={2}>
                        <HStack pt={2} justifyContent="center" gap={2}>
                            <Button
                                colorPalette="blue"
                                onClick={handleSubmit}
                                size="xs"
                                loading={createMutation.isPending || updateMutation.isPending}
                            >
                                <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>

                            <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                Clear <IoIosExit />
                            </Button>
                        </HStack>
                    </Box>
                </Box>
            </GridItem>

            {/* -------- Table Section -------- */}
            <GridItem minW={0}>
                <Box  p={3} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    
                    <Box display="flex"  gap={2} alignItems="center" justifyContent="space-between">
        
                        <Heading fontSize="small" fontWeight='semibold' >
                 PURE GOLD OPENING LIST 
                    </Heading>
                        <Box display='flex' gap={1}>
                            <Box >
                                <SearchBar
                                    searchTerm={filter}
                                    onChange={setFilter}
                                    placeholder="Search pureGold Opening"
                                    size="2xs"

                                />
                            </Box>
                            <Flex>
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
                    
                    </Box>
                    <CustomTable<TouchTableRow>
                        columns={columns}
                        data={pureGoldData as TouchTableRow[]}
                        rowIdKey="sno"
                        highlightRowId={highlightRowId}
                        emptyText="No data available"
                        bodyBg={theme.colors.primary}
                        headerBg="blue.800"
                        headerColor="white"
                        renderRow={(row, i) => (
                            <>
                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>{row.pureGoldName}</Table.Cell>
                                <Table.Cell textAlign="end">{formatToFixed(row.weight ,2)} </Table.Cell>
                                <Table.Cell textAlign="end" >{formatToFixed(row.actualTouch , 2) }</Table.Cell>
                                <Table.Cell textAlign="end">
                                    {formatToFixed(row.actualPure,2)}
                                </Table.Cell>
                                <Table.Cell align="center">
                                    <Box display="flex" justifyContent="center">
                                        <FiEdit
                                            cursor="pointer"
                                            onClick={() => handleEdit(row)}
                                        />
                                    </Box>
                                  
                                </Table.Cell>
                            </>
                        )}
                    />
                </Box>
            </GridItem>
        </Grid>
    );
};

export default PureGoldOpening;
