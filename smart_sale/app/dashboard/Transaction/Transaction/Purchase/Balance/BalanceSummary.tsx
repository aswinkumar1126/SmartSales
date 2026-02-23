"use client";

import React,{useState} from "react";
import {
    Box,
    Grid,
    GridItem,
    Text,
    VStack,
    HStack,
    Checkbox,
} from "@chakra-ui/react";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";

type DummyType = {
    pure: string;
    cash: string;
};

type BalanceSummaryProps = {
    theme: any;
};

const BalanceSummary = ({ theme }: BalanceSummaryProps) => {

    const [conversionType, setConversionType] = useState<"pure" | "cash">("cash");
    const handleChange = () => { }; // replace with real handler

    return (
        <Box p={2} bg={theme.colors.formColor} borderRadius="md">
            <Grid templateColumns="75px 1fr 1fr" gap={2} alignItems="center">
                {/* Header */}
                <GridItem />
                <Text textAlign="center" fontSize="xs" fontWeight="semibold">
                    Pure
                </Text>
                <Text textAlign="center" fontSize="xs" fontWeight="semibold">
                    Cash
                </Text>

                {/* Total Balance */}
                <Text fontSize="xs" fontWeight="semibold">
                    Total Balance
                </Text>
                <CapitalizedInput<DummyType>
                    value="55.631"
                    field="pure"
                    onChange={handleChange}
                    type="number"
                    allowDecimal
                    decimalScale={3}
                    size="xs"
                    rounded="sm"
                />
                <CapitalizedInput<DummyType>
                    value="510"
                    field="cash"
                    onChange={handleChange}
                    type="number"
                    size="xs"
                    rounded="sm"
                />
                {/* Conversion Input Row */}
                <Text /> {/* empty label column */}
               

                {/* Pure Checkbox */}
                <Checkbox.Root
                    size="sm"
                    checked={conversionType === "pure"}
                    onCheckedChange={() => setConversionType("pure")}
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control>
                        <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Label fontSize="2xs">Pure</Checkbox.Label>
                </Checkbox.Root>

                {/* Cash Checkbox */}
                <Checkbox.Root
                    size="sm"
                    checked={conversionType === "cash"}
                    onCheckedChange={() => setConversionType("cash")}
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control>
                        <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Label fontSize="2xs">Cash</Checkbox.Label>
                </Checkbox.Root>

            
                {/* Conversion Label Row */}
                <Text fontSize="xs" fontWeight="semibold">
                    Conversion
                </Text>
                <CapitalizedInput<DummyType>
                    value="-26.250"
                    field="pure"
                    onChange={handleChange}
                    type="number"
                    allowNegative
                    allowDecimal
                    decimalScale={3}
                    size="xs"
                    rounded="sm"
                    disabled={conversionType !== "pure"}
                />

                <CapitalizedInput<DummyType>
                    value="420000"
                    field="cash"
                    onChange={handleChange}
                    type="number"
                    size="xs"
                    rounded="sm"
                    disabled={conversionType !== "cash"}
                />
                {/* Parcel Charge */}
                <Text fontWeight="semibold" fontSize='xs'>Parcel Charge</Text>
                <CapitalizedInput<DummyType>
                    value=""
                    placeholder="0.000"
                    field="pure"
                    onChange={handleChange}
                    type="number"
                    allowDecimal
                    size="xs"
                    rounded="sm"
                />
                <CapitalizedInput<DummyType>
                    value=""
                    placeholder="0.0"
                    field="cash"
                    onChange={handleChange}
                    type="number"
                    size="xs"
                    rounded="sm"
                />

                {/* Discount */}
                <Text fontWeight="semibold" fontSize='xs'>Discount</Text>
                <CapitalizedInput<DummyType>
                    value="0.000"
                    field="pure"
                    onChange={handleChange}
                    type="number"
                    allowDecimal
                    size="xs"
                    rounded="sm"
                />
                <CapitalizedInput<DummyType>
                    value="0"
                    field="cash"
                    onChange={handleChange}
                    type="number"
                    size="xs"
                    rounded="sm"
                />

                {/* Right Side Extra Fields */}
                <Text />
                <Text />
                <VStack align="start" spaceX={1}>
                    <Text fontSize="2xs" fontWeight="medium">
                        Bank Received
                    </Text>
                    <CapitalizedInput<DummyType>
                        value="0"
                        field="cash"
                        onChange={handleChange}
                        type="number"
                        size="xs"
                        rounded="sm"
                    />
                </VStack>

                <Text />
                <Text />
                <VStack align="start" spaceX={1}>
                    <Text fontSize="2xs" fontWeight="medium">
                        Cash Received
                    </Text>
                    <CapitalizedInput<DummyType>
                        value="420000"
                        field="cash"
                        onChange={handleChange}
                        type="number"
                        size="xs"
                        rounded="sm"
                    />
                </VStack>

                <Text />
                <Text />
                <VStack align="start" spaceX={1}>
                    <Text fontSize="2xs" fontWeight="medium">
                        Bank Paid
                    </Text>
                    <CapitalizedInput<DummyType>
                        value="0"
                        field="cash"
                        onChange={handleChange}
                        type="number"
                        size="xs"
                        rounded="sm"
                    />
                </VStack>

                <Text />
                <Text />
                <VStack align="start" spaceX={1}>
                    <Text fontSize="2xs" fontWeight="medium">
                        Cash Paid
                    </Text>
                    <CapitalizedInput<DummyType>
                        value="0"
                        field="cash"
                        onChange={handleChange}
                        type="number"
                        size="xs"
                        rounded="sm"
                    />
                </VStack>

                {/* Closing Balance */}
                <Text fontWeight="semibold" fontSize='xs'>Closing Balance</Text>
                <CapitalizedInput<DummyType>
                    value="81.881"
                    field="pure"
                    onChange={handleChange}
                    type="number"
                    allowDecimal
                    size="xs"
                    rounded="sm"
                />
                <CapitalizedInput<DummyType>
                    value="510"
                    field="cash"
                    onChange={handleChange}
                    type="number"
                    size="xs"
                    rounded="sm"
                    
                />
            </Grid>
        </Box>
    );
};

export default BalanceSummary;