"use client";

import { useState, useRef, useEffect } from "react";
import {
    Box,
    Table,
    Grid,
    GridItem,
    Text,
    NativeSelect,
    Button,
    Input,
    HStack,
    IconButton,
} from "@chakra-ui/react";
import { LuX } from "react-icons/lu";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { SelectCombobox, SelectItem } from "@/components/ui/selectComboBox";

type StoneRow = {
    id: string;
    stone: string;
    subStone: string;
    pcs: number;
    weight: number;
    unit: "g" | "c";
    cal: "w" | "p";
    rate: number;
    amount: number;
};

type Props = {
    netWeight?: number;
    onClose: () => void;
    onSave: (rows: StoneRow[]) => void;
    initialRows?: StoneRow[];
    stoneItems?: SelectItem[];  // Dynamic stone items from parent
    subStoneItems?: SelectItem[]; // Dynamic substone items from parent
};

export default function StoneEnterMaster({
    netWeight = 50.000,
    onClose,
    onSave,
    initialRows = [],
    stoneItems = [],  // Default to empty array
    subStoneItems = [] // Default to empty array
}: Props) {
    /* ---------------- STATE ---------------- */

    const emptyForm = {
        stone: "",
        subStone: "",
        pcs: 0,
        weight: 0,
        unit: "g" as "g",
        cal: "w" as "w",
        rate: 0,
    };

    const [form, setForm] = useState<Omit<StoneRow, "id" | "amount">>(emptyForm);
    const [rows, setRows] = useState<StoneRow[]>(initialRows);
    const [editId, setEditId] = useState<string | null>(null);

    // Create refs for each field
    const stoneRef = useRef<any>(null);
    const subStoneRef = useRef<any>(null);
    const pcsRef = useRef<HTMLInputElement>(null);
    const weightRef = useRef<HTMLInputElement>(null);
    const unitRef = useRef<HTMLSelectElement>(null);
    const calRef = useRef<HTMLSelectElement>(null);
    const rateRef = useRef<HTMLInputElement>(null);

    // Array of refs for focus navigation
    const refs = [stoneRef, subStoneRef, pcsRef, weightRef, unitRef, calRef, rateRef];

    /* ---------------- CALCULATION ---------------- */

    const calculateAmount = (data: any) => {
        let weight = Number(data.weight) || 0;
        const pcs = Number(data.pcs) || 0;
        const rate = Number(data.rate) || 0;

        if (data.unit === "c") weight = weight / 5;

        if (data.cal === "w") return weight * rate;
        if (data.cal === "p") return pcs * weight * rate;

        return 0;
    };

    /* ---------------- TOTAL USED ---------------- */

    const totalUsedWeight = rows.reduce((sum, r) => {
        const w = r.unit === "c" ? Number(r.weight) / 5 : Number(r.weight);
        return sum + w;
    }, 0);

    /* ---------------- VALIDATION ---------------- */

    const isFormValid =
        form.stone.trim() !== "" &&
        form.subStone.trim() !== "" &&
        Number(form.pcs) > 0 &&
        Number(form.weight) > 0 &&
        Number(form.rate) > 0;

    /* ---------------- HANDLERS ---------------- */

    const setField = (field: keyof typeof form, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddOrUpdate = () => {
        if (!isFormValid) {
            alert("Fill all fields properly.");
            return;
        }

        const currentWeight =
            form.unit === "c" ? Number(form.weight) / 5 : Number(form.weight);

        // Calculate base weight excluding current edit row
        const baseWeight = editId
            ? rows
                .filter((r) => r.id !== editId)
                .reduce(
                    (sum, r) =>
                        sum + (r.unit === "c" ? Number(r.weight) / 5 : Number(r.weight)),
                    0
                )
            : rows.reduce(
                (sum, r) =>
                    sum + (r.unit === "c" ? Number(r.weight) / 5 : Number(r.weight)),
                0
            );

        if (baseWeight + currentWeight > Number(netWeight)) {
            alert(`Weight exceeded! Maximum available: ${netWeight.toFixed(3)}g`);
            return;
        }

        const newRow = {
            id: editId ?? Date.now().toString(),
            ...form,
            pcs: Number(form.pcs),
            weight: Number(form.weight),
            rate: Number(form.rate),
            amount: calculateAmount(form),
        };

        if (editId) {
            setRows((prev) => prev.map((r) => (r.id === editId ? newRow : r)));
            setEditId(null);
        } else {
            setRows((prev) => [...prev, newRow]);
        }

        setForm(emptyForm);
        // Focus back to first field after adding
        setTimeout(() => {
            stoneRef.current?.focus();
        }, 100);
    };

    const handleEdit = (row: StoneRow) => {
        setForm({
            stone: row.stone,
            subStone: row.subStone,
            pcs: row.pcs,
            weight: row.weight,
            unit: row.unit,
            cal: row.cal,
            rate: row.rate,
        });
        setEditId(row.id);
        setTimeout(() => {
            stoneRef.current?.focus();
        }, 100);
    };

    const handleDelete = (id: string) => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    const focusNext = (currentIndex: number) => {
        if (currentIndex < refs.length - 1) {
            const nextRef = refs[currentIndex + 1];
            if (nextRef?.current) {
                setTimeout(() => {
                    nextRef.current.focus();
                    if (nextRef.current.select && typeof nextRef.current.select === 'function') {
                        nextRef.current.select();
                    }
                }, 50);
            }
        } else {
            // Last field, trigger add
            handleAddOrUpdate();
        }
    };

    const handleSaveAndClose = () => {
        onSave(rows);
        onClose();
    };
    console.log(stoneItems,subStoneItems ,'stoneItems')
    /* ---------------- UI ---------------- */

    return (
        <Box p={4}>
            {/* Header with Close Button */}
            <HStack justify="space-between" mb={4}>
                <Text fontSize="lg" fontWeight="bold">
                    Stone Entry - Available Weight: {Number(netWeight).toFixed(3)}g
                </Text>
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    size="sm"
                >
                    <LuX />
                </IconButton>
            </HStack>

            {/* ================= FORM ================= */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleAddOrUpdate();
                }}
            >
                <Box borderWidth="1px" rounded="md" p={3} mb={5} bg="#FFF1F5">
                    <Grid
                        templateColumns="repeat(8, 1fr) 100px"
                        gap={2}
                        alignItems="end"
                    >
                        <GridItem>
                            <Text fontSize="sm">Stone</Text>
                            <SelectCombobox
                                value={form.stone}
                                items={stoneItems}
                                onChange={(val) => setField("stone", val)}
                                ref={stoneRef}
                                onEnter={() => focusNext(0)}
                                rounded="sm"
                                placeholder="Select Stone"
                            />
                        </GridItem>

                        <GridItem>
                            <Text fontSize="sm">Sub</Text>
                            <SelectCombobox
                                value={form.subStone}
                                items={subStoneItems}
                                onChange={(val) => setField("subStone", val)}
                                ref={subStoneRef}
                                onEnter={() => focusNext(1)}
                                rounded="sm"
                                placeholder="Select Sub Stone"
                            />
                        </GridItem>

                        <GridItem>
                            <Text fontSize="sm">Pcs</Text>
                            <CapitalizedInput
                                value={form.pcs?.toString()}
                                field="pcs"
                                type="number"
                                onChange={(field, value) => setField("pcs", value)}
                                inputRef={pcsRef}
                                onEnter={() => focusNext(2)}
                                size="xs"
                                rounded="sm"
                            />
                        </GridItem>

                        <GridItem>
                            <Text fontSize="sm">Weight</Text>
                            <CapitalizedInput
                                value={form.weight?.toString()}
                                field="weight"
                                type="number"
                                allowDecimal
                                onChange={(field, value) => setField("weight", value)}
                                inputRef={weightRef}
                                onEnter={() => focusNext(3)}
                                size="xs"
                                rounded="sm"
                            />
                        </GridItem>

                        <GridItem>
                            <Text fontSize="sm">Unit</Text>
                            <NativeSelect.Root size="sm">
                                <NativeSelect.Field
                                    ref={unitRef}
                                    value={form.unit}
                                    onChange={(e) => setField("unit", e.target.value as "g" | "c")}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            focusNext(4);
                                        }
                                    }}
                                    css={{ height: '32px' }}
                                >
                                    <option value="g">Gram</option>
                                    <option value="c">Carat</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </GridItem>

                        <GridItem>
                            <Text fontSize="sm">Cal</Text>
                            <NativeSelect.Root size="sm">
                                <NativeSelect.Field
                                    ref={calRef}
                                    value={form.cal}
                                    onChange={(e) => setField("cal", e.target.value as "w" | "p")}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            focusNext(5);
                                        }
                                    }}
                                    css={{ height: '32px' }}
                                >
                                    <option value="w">Weight</option>
                                    <option value="p">Piece</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </GridItem>

                        <GridItem>
                            <Text fontSize="sm">Rate</Text>
                            <CapitalizedInput
                                value={form.rate?.toString()}
                                field="rate"
                                type="number"
                                allowDecimal
                                onChange={(field, value) => setField("rate", value)}
                                inputRef={rateRef}
                                onEnter={() => handleAddOrUpdate()}
                                size="xs"
                                rounded="sm"
                            />
                        </GridItem>

                        <GridItem>
                            <Text fontSize="sm">Amount</Text>
                            <Input
                                value={calculateAmount(form).toFixed(2)}
                                disabled
                                css={{ height: '32px' }}
                            />
                        </GridItem>

                        <GridItem>
                            <Button
                                colorScheme="blue"
                                size="sm"
                                onClick={handleAddOrUpdate}
                                disabled={!isFormValid}
                            >
                                {editId ? "Update" : "Add"}
                            </Button>
                        </GridItem>
                    </Grid>
                </Box>
            </form>

            {/* ================= TABLE ================= */}

            <Text mb={2} fontWeight="600">
                Total Used: {Number(totalUsedWeight).toFixed(3)} / {Number(netWeight).toFixed(3)} g
            </Text>

            <Table.Root size="sm" variant="outline" mb={4}>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader textAlign="left">Sno</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Stone</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Sub</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Pcs</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Weight</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Unit</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Cal</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Rate</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Amount</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>

                <Table.Body>
                    {rows.map((row, index) => (
                        <Table.Row key={row.id}>
                            <Table.Cell>{index + 1}</Table.Cell>
                            <Table.Cell>{row.stone}</Table.Cell>
                            <Table.Cell>{row.subStone}</Table.Cell>
                            <Table.Cell>{row.pcs}</Table.Cell>
                            <Table.Cell textAlign="end">{Number(row.weight || 0).toFixed(3)}</Table.Cell>
                            <Table.Cell textAlign="center">{row.unit}</Table.Cell>
                            <Table.Cell textAlign="center">{row.cal}</Table.Cell>
                            <Table.Cell textAlign="end">{row.rate}</Table.Cell>
                            <Table.Cell textAlign="end">{row.amount.toFixed(2)}</Table.Cell>
                            <Table.Cell textAlign='center'>
                                <Button
                                    size="xs"
                                    mr={2}
                                    onClick={() => handleEdit(row)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="xs"
                                    colorScheme="red"
                                    onClick={() => handleDelete(row.id)}
                                >
                                    Remove
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>

            {/* Save and Close Buttons */}
            <HStack justify="flex-end" gap={2}>
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSaveAndClose}>
                    Save & Close
                </Button>
            </HStack>
        </Box>
    );
}