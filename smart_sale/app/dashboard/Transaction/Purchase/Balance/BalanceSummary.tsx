"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Grid,
    GridItem,
    Text,
    VStack,
    HStack,
    Checkbox,
    Badge,
} from "@chakra-ui/react";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { formatToFixed } from '@/utils/format/numberFormat';
import { BankTransactionModal } from "./BankTransactionModal";

interface BankTransaction {
    draftRowId: string;
    id: string;
    bankName: string;
    tranMode: "C" | "F" | "I" | "N" | "R" | "U";
    tranDate: string;
    chqNo: string;
    amount: number;
}

export interface ClosingFormDetails {
    convType: "P" | "C" | ""|string;
    convAmt: string;
    convWt: string;
    discAmt: string;
    discWt: string;
    cashPaid: string;
    cashRcvd: string;
    bankPaid: string;
    bankRcvd: string;
    bankPaidDetails: BankTransaction[];
    bankRcvdDetails: BankTransaction[];
}

type BalanceSummaryProps = {
    theme: any;
    openBalance: { openCash: number; openPure: number };
    closingDetails: ClosingFormDetails;
    onClosingDetailsChange: (field: string, value: any) => void;
    accCode: number;
    rate: number;
    closingCash: number;      // Calculated in parent
    closingPure: number;      // Calculated in parent
    transactionResetSignal?: boolean;
    onBankPaidSave: (transactions: BankTransaction[], total: number) => void; 
    onBankRcvdSave: (transactions: BankTransaction[], total: number) => void;  
};

const BalanceSummary = ({
    theme,
    openBalance,
    closingDetails,
    onClosingDetailsChange,
    accCode,
    rate,
    closingCash,
    closingPure,
    onBankPaidSave,
    onBankRcvdSave,
}: BalanceSummaryProps) => {

    const [conversionType, setConversionType] = useState<"" | "C" | "P"|string>(closingDetails.convType);
    const [activeBankModal, setActiveBankModal] = useState<"paid" | "received" | null>(null);

    const bankPaidModalOpenedRef = useRef(false);
    const bankRcvdModalOpenedRef = useRef(false);

    const openingPure = openBalance.openPure ? formatToFixed(openBalance.openPure, 3) : "0.000";
    const openingCash = openBalance.openCash ? formatToFixed(openBalance.openCash, 2) : "0.00";

    // Update conversion type when closingDetails changes from parent
    useEffect(() => {
        setConversionType(closingDetails.convType);
    }, [closingDetails.convType]);

    // Event handlers
    const handleChange = (field: keyof ClosingFormDetails, value: string) => {
        onClosingDetailsChange(field, value);
    };


    const handleConvTypeChange = (type: "P" | "C" | "") => {
        const newConvType = conversionType === type ? "" : type;
        setConversionType(newConvType);
        onClosingDetailsChange("convType", newConvType);
        // Reset conversion values when type changes
        onClosingDetailsChange("convAmt", "");
        onClosingDetailsChange("convWt", "");
    };

    const handleOpenBankPaidModal = () => {
        if (!accCode || bankPaidModalOpenedRef.current) return;
        bankPaidModalOpenedRef.current = true;
        setActiveBankModal("paid");
        setTimeout(() => { bankPaidModalOpenedRef.current = false; }, 500);
    };

    const handleOpenBankRcvdModal = () => {
        if (!accCode || bankRcvdModalOpenedRef.current) return;
        bankRcvdModalOpenedRef.current = true;
        setActiveBankModal("received");
        setTimeout(() => { bankRcvdModalOpenedRef.current = false; }, 500);
    };

    const closeActiveModal = () => setActiveBankModal(null);

    return (
        <Box p={2} bg={theme.colors.formColor} borderRadius="md">
            <Grid templateColumns="100px 1fr 1fr" gap={2} alignItems="center">
                <GridItem />
                <Text textAlign="center" fontSize="xs" fontWeight="semibold">Pure</Text>
                <Text textAlign="center" fontSize="xs" fontWeight="semibold">Cash</Text>

                {/* Opening Balance */}
                <Text fontSize="xs" fontWeight="semibold">Opening Balance</Text>
                <CapitalizedInput
                    value={openingPure}
                    field="openPure"
                    onChange={() => { }}
                    type="number"
                    allowDecimal
                    decimalScale={3}
                    size="xs"
                    rounded="sm"
                    disabled
                />
                <CapitalizedInput
                    value={openingCash}
                    field="openCash"
                    onChange={() => { }}
                    type="number"
                    size="xs"
                    rounded="sm"
                    disabled
                />

                {/* Conversion Type */}
                <Text fontSize="xs" fontWeight="semibold">Convert By</Text>
                <HStack>
                    <Checkbox.Root
                        disabled={!accCode} size="xs"
                        checked={conversionType === "P"}
                        onCheckedChange={() => handleConvTypeChange("P")}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                        <Checkbox.Label fontSize="2xs">Pure</Checkbox.Label>
                    </Checkbox.Root>
                </HStack>
                <HStack>
                    <Checkbox.Root
                        disabled={!accCode} size="xs"
                        checked={conversionType === "C"}
                        onCheckedChange={() => handleConvTypeChange("C")}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                        <Checkbox.Label fontSize="2xs">Cash</Checkbox.Label>
                    </Checkbox.Root>
                </HStack>

                {/* Conversion Values */}
                <Text fontSize="xs" fontWeight="semibold">Conversion</Text>
                <CapitalizedInput
                    value={closingDetails.convWt}
                    field="convWt"
                    onChange={(_, v) => handleChange("convWt", v)}
                    type="number"
                    allowDecimal
                    decimalScale={3}
                    size="xs"
                    rounded="sm"
                    disabled={!accCode || conversionType === "C" || conversionType === ""}
                />
                <CapitalizedInput
                    value={closingDetails.convAmt}
                    field="convAmt"
                    onChange={(_, v) => handleChange("convAmt", v)}
                    type="number"
                    allowDecimal
                    decimalScale={2}
                    size="xs"
                    rounded="sm"
                    disabled={!accCode || conversionType === "P" || conversionType === ""}
                />

                <Box /><Box /><Box />

                {/* Bank Received */}
                <Text /><Text />
                <VStack align="start" gap={0}>
                    <HStack justify="space-between" width="100%">
                        <Text fontSize="2xs" fontWeight="medium">Bank Received</Text>
                    </HStack>
                    <Box
                        onClick={handleOpenBankRcvdModal}
                        cursor={accCode ? "pointer" : "not-allowed"}
                        width="100%"
                    >
                        <CapitalizedInput
                            value={closingDetails.bankRcvd}
                            field="bankRcvd"
                            onChange={() => { }}
                            type="number"
                            decimalScale={2}
                            size="xs"
                            rounded="sm"
                            disabled={!accCode}
                        />
                    </Box>
                    {closingDetails.bankRcvdDetails?.length > 0 && (
                        <Badge size="xs" colorPalette="blue" fontSize="2xs">
                            {closingDetails.bankRcvdDetails.length} transaction(s)
                        </Badge>
                    )}
                </VStack>

                {/* Cash Received */}
                <Text /><Text />
                <VStack align="start" gap={0}>
                    <Text fontSize="2xs" fontWeight="medium">Cash Received</Text>
                    <CapitalizedInput
                        value={closingDetails.cashRcvd}
                        field="cashRcvd"
                        onChange={(_, v) => handleChange("cashRcvd", v)}
                        type="number"
                        decimalScale={2}
                        size="xs"
                        rounded="sm"
                        disabled={!accCode}
                    />
                </VStack>

                {/* Bank Paid */}
                <Text /><Text />
                <VStack align="start" gap={0}>
                    <HStack justify="space-between" width="100%">
                        <Text fontSize="2xs" fontWeight="medium">Bank Paid</Text>
                    </HStack>
                    <Box
                        onClick={handleOpenBankPaidModal}
                        cursor={accCode ? "pointer" : "not-allowed"}
                        width="100%"
                    >
                        <CapitalizedInput
                            value={closingDetails.bankPaid}
                            field="bankPaid"
                            onChange={() => { }}
                            type="number"
                            decimalScale={2}
                            size="xs"
                            rounded="sm"
                            disabled={!accCode}
                        />
                    </Box>
                    {closingDetails.bankPaidDetails?.length > 0 && (
                        <Badge size="xs" colorPalette="red" fontSize="2xs">
                            {closingDetails.bankPaidDetails.length} transaction(s)
                        </Badge>
                    )}
                </VStack>

                {/* Cash Paid */}
                <Text /><Text />
                <VStack align="start" gap={0}>
                    <Text fontSize="2xs" fontWeight="medium">Cash Paid</Text>
                    <CapitalizedInput
                        value={closingDetails.cashPaid}
                        field="cashPaid"
                        onChange={(_, v) => handleChange("cashPaid", v)}
                        type="number"
                        decimalScale={2}
                        size="xs"
                        rounded="sm"
                        disabled={!accCode}
                    />
                </VStack>

                {/* Closing Balance */}
                <Text fontWeight="semibold" fontSize='xs'>Closing Balance</Text>
                <CapitalizedInput
                    value={formatToFixed(closingPure.toString(), 3)}
                    field="closePure"
                    onChange={() => { }}
                    type="number"
                    allowDecimal
                    decimalScale={3}
                    size="xs"
                    rounded="sm"
                    disabled
                />
                <CapitalizedInput
                    value={formatToFixed(closingCash.toString(), 2)}
                    field="closeCash"
                    onChange={() => { }}
                    type="number"
                    size="xs"
                    rounded="sm"
                    disabled
                />
            </Grid>

            {/* Bank Transaction Modal */}
            <BankTransactionModal
                key={activeBankModal ?? "none"}
                draftRowId={
                    activeBankModal === "paid"
                        ? `bank-paid-${accCode}`
                        : `bank-rcvd-${accCode}`
                }
                isOpen={activeBankModal !== null}
                onClose={closeActiveModal}
                onSave={activeBankModal === "paid" ? onBankPaidSave : onBankRcvdSave}  // Use parent handlers
                type={activeBankModal ?? "paid"}
                theme={theme}
                initialTransactions={
                    !accCode ? [] :
                        activeBankModal === "paid"
                            ? closingDetails.bankPaidDetails || []
                            : closingDetails.bankRcvdDetails || []
                }
                accCode={accCode}
                escapeId="bankModal"
            />
        </Box>
    );
};

export default BalanceSummary;