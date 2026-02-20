"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Button,
    VStack,
    Text,
    Grid,
    GridItem,
    HStack,
    Stack,
    Fieldset,
    NativeSelect,
    createListCollection,
    For,
    Flex
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { IoIosExit } from "react-icons/io";

import { fontVariables } from "@/context/theme/font";
import { useTheme } from "@/context/theme/themeContext";

import { useAllMetals, useMetalBySno } from "@/hooks/metal/useMetals";
import { useUpdateMetal } from "@/hooks/metal/useUpdateMetal";
import { useCreateMetal } from "@/hooks/metal/useCreateMetal";
import { Metal } from "@/service/metalService";
import { toastError } from '@/component/toast/toast'
import { Toaster } from "@/components/ui/toaster";

import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { usePureGoldData } from "@/hooks/pureGoldMast/usePureGoldMastData";

function MetalMaster() {
    const { theme } = useTheme();
    const router = useRouter();

    // Create refs for each input field
    const metalIdRef = useRef<HTMLInputElement>(null);
    const metalNameRef = useRef<HTMLInputElement>(null);
    const displayOrderRef = useRef<HTMLInputElement>(null);
    const activeRef = useRef<HTMLSelectElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);

    // Form state
    const [form, setForm] = useState<Partial<Metal>>({
        metalId: "",
        metalName: "",
        metalType: "M",
        displayOrder: 1,
        active: "Y",
        weight: "",
        touch: "",
        pure: ""
    });
    const [metalIdManuallyChanged, setMetalIdManuallyChanged] = useState(false);

    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightId, setHighLightedId] = useState<String>();
    const [pureGoldCollection, setPureGoldCollection] = useState<any[]>([]);

    const { data: metals = [] } = useAllMetals();
    const [filter, setFilter] = useState<string>('')
    const { data: pureGold } = usePureGoldData(filter);

    // Function to move to next field on Enter
    const moveToNextField = (nextRef: React.RefObject<any>) => {
        if (nextRef?.current) {
            nextRef.current.focus();
            if (nextRef.current.select) {
                nextRef.current.select();
            }
        }
    };

    useEffect(() => {
        if (!pureGold?.length) return;

        const mapped = pureGold.map((p: any) => ({
            label: p.pureGoldName,
            value: String(p.sno),
        }));

        setPureGoldCollection(mapped);
    }, [pureGold]);

    useEffect(() => {
        if (!metals || metals.length === 0) return;

        setForm(prev => ({
            ...prev,
            displayOrder: metals.length + 1,
        }));
    }, [metals]);

    const { data: metalBySno, refetch: refetchMetalBySno } = useMetalBySno(editId);

    const { setData, setColumns, setShowSno, title } = usePrint();

    const createMutation = useCreateMetal();
    const updateMutation = useUpdateMetal();

    const activeStatus = createListCollection({
        items: [
            { label: "YES", value: "Y" },
            { label: "NO", value: "N" },
        ],
    });

    const handleChange = (field: keyof Metal, value: any) => {
        setForm((prev) => {
            let updated = { ...prev, [field]: value };

            // 🔹 If user edits metalId manually → stop auto-sync
            if (field === "metalId") {
                setMetalIdManuallyChanged(true);
            }

            // 🔹 Auto-fill metalId from metalName (only if not manually changed & not edit mode)
            if (field === "metalName" && !metalIdManuallyChanged && !isEdit) {
                if (value && value.trim().length > 0) {
                    updated.metalId = value.trim().charAt(0).toUpperCase();
                } else {
                    updated.metalId = "";
                }
            }

            return updated;
        });
    };

    useEffect(() => {
        if (!highlightId) return;

        const timer = setTimeout(() => {
            setHighLightedId(undefined);
        }, 3000);

        return () => clearTimeout(timer);
    }, [highlightId]);

    const handleSave = () => {
        if (!form.metalId) {
            toastError("Metal ID is required");
            metalIdRef.current?.focus();
            return;
        }

        if (!form.metalName?.trim()) {
            toastError("Metal name is required");
            metalNameRef.current?.focus();
            return;
        }

        if (isEdit && form.metalId) {
            updateMutation.mutate(
                { sno: Number(form.sno), metal: form as Metal },
                {
                    onSuccess: () => {
                        setHighLightedId(String(form.sno))
                        resetForm();
                    }
                }
            );
        } else {
            createMutation.mutate(form as Metal, {
                onSuccess: () => {
                    resetForm();
                    setHighLightedId(String(form.metalId));
                }
            });
        }
    };

    const handleEdit = (metal: Metal) => {
        setIsEdit(true);
        setEditId(metal.sno || null);
        refetchMetalBySno();
    };

    useEffect(() => {
        if (metalBySno?.data && Object.keys(metalBySno?.data).length > 0) {
            setForm({
                ...metalBySno?.data,
                metalType: metalBySno?.data?.metalType || "",
            });
        }
    }, [metalBySno]);

    const resetForm = () => {
        setIsEdit(false);
        setMetalIdManuallyChanged(false);

        setForm({
            metalId: "",
            metalName: "",
            metalType: "M",
            displayOrder: Number(metals.length + 1),
            active: "Y",
            weight: "",
            touch: "",
            pure: ""
        });

        setEditId(null);
        // Focus to Metal Name after save
        setTimeout(() => metalNameRef.current?.focus(), 100); // ← Changed to metalNameRef
    };

    const metalColumns = [
        { key: "sno", label: "Sno" },
        { key: "metalId", label: "Metal Id" },
        { key: "metalName", label: "Metal Name" },
        { key: "displayOrder", label: "Order", align: "center" as const },
        { key: "active", label: "Active", align: "center" as const },
        { key: "actions", label: "Action", align: "center" as const },
    ];

    const handleExport = (option: string) => {
        setData(metals);
        setColumns([
            { key: 'metalId', label: 'Metal Id' },
            { key: 'metalName', label: 'Metal Name' },
            { key: 'displayOrder', label: 'Order' },
        ]);
        setShowSno(true);
        router.push(`/print?export=${option}`);
        title?.("Metal List")
    };

    return (
        <Box
            className={fontVariables}
            bg={theme.colors.primary}
            color={theme.colors.secondary}
            fontWeight='semibold'
        >
            <Toaster />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>
                {/* LEFT – Form */}
                <GridItem>
                    <VStack
                        w="full"
                        bg={theme.colors.formColor}
                        p={2}
                        borderRadius="xl"
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >
                        <Text fontSize="small" fontWeight="600">METAL MASTER</Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <Grid gap={2}>
                                    {/* METAL ID */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">METAL ID :</Box>
                                        <CapitalizedInput
                                            type="text"
                                            field="metalId"
                                            placeholder="Enter Id"
                                            value={form.metalId || ""}
                                            onChange={handleChange}
                                            disabled={isEdit}
                                            max={1}
                                            size="2xs"
                                            maxWidth="120px"
                                            inputRef={metalIdRef}
                                            onEnter={() => moveToNextField(metalNameRef)}
                                        />
                                    </Box>

                                    {/* METAL NAME */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">METAL NAME :</Box>
                                        <CapitalizedInput
                                            field="metalName"
                                            placeholder="Enter Metal Name"
                                            value={form.metalName || ""}
                                            onChange={handleChange}
                                            size="2xs"
                                            maxWidth="100%"
                                            inputRef={metalNameRef}
                                            onEnter={() => moveToNextField(displayOrderRef)}
                                        />
                                    </Box>

                                    {/* DISPLAY ORDER */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">DISPLAY ORDER :</Box>
                                        <CapitalizedInput
                                            field="displayOrder"
                                            placeholder="Enter displayOrder"
                                            value={String(form.displayOrder || "")}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            maxWidth="100%"
                                            inputRef={displayOrderRef}
                                            onEnter={() => moveToNextField(activeRef)}
                                        />
                                    </Box>

                                    {/* ACTIVE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">ACTIVE :</Box>
                                        <NativeSelect.Root size="xs" minW="50px" fontSize="2xs">
                                            <NativeSelect.Field
                                                ref={activeRef}
                                                value={form.active || "Y"}
                                                onChange={(e) => handleChange("active", e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        moveToNextField(saveButtonRef);
                                                    }
                                                }}
                                                css={{
                                                    backgroundColor: "#eee",
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "20px",
                                                    height: "30px",
                                                    fontSize: "10px",
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
                                    </Box>
                                </Grid>

                                {/* BUTTONS */}
                                <HStack pt={4} justifyContent="center">
                                    <Button
                                        size="xs"
                                        colorPalette="blue"
                                        onClick={handleSave}
                                        ref={saveButtonRef}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleSave();
                                            }
                                        }}
                                    >
                                        <AiOutlineSave /> {isEdit ? "Update" : "Save"}
                                    </Button>
                                    <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                        Exit <IoIosExit />
                                    </Button>
                                </HStack>
                            </Fieldset.Content>
                        </Fieldset.Root>
                    </VStack>
                </GridItem>

                {/* RIGHT – Table */}
                <GridItem minW={0}>
                    <Box
                        p={4}
                        borderRadius="xl"
                        bg={theme.colors.formColor}
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >
                        <Box display='flex' mb={2} gap={2} justifyContent='space-between' alignItems='center'>
                            <Text fontWeight="semi-bold" fontSize="small">METAL LIST </Text>
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
                                columns={metalColumns}
                                data={metals}
                                size="sm"
                                headerBg='blue.800'
                                bodyBg={theme.colors.primary}
                                headerColor='white'
                                rowIdKey="sno"
                                highlightRowId={highlightId ? Number(highlightId) : null}
                                emptyText="No parties available"
                                renderRow={(metal, i) => (
                                    <>
                                        <Table.Cell>{metal.sno}</Table.Cell>
                                        <Table.Cell>{metal.metalId}</Table.Cell>
                                        <Table.Cell>{metal.metalName}</Table.Cell>
                                        <Table.Cell textAlign="center">{metal.displayOrder}</Table.Cell>
                                        <Table.Cell textAlign="center">{metal.active}</Table.Cell>
                                        <Table.Cell>
                                            <Box display="flex" justifyContent="center">
                                                <FaEdit onClick={() => handleEdit(metal)} cursor="pointer" />
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

export default MetalMaster;