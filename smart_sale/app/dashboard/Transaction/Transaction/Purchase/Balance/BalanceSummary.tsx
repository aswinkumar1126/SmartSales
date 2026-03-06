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
    convType: "P" | "C" | "";
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
    isEditing?: boolean;
    closingDetails?: ClosingFormDetails;
    onClosingDetailsChange?: (details: ClosingFormDetails) => void;
    storageKey?: string;
    editingState?: { rowId: string | null; transactionType: string | null };
    transactionType?: string;
    accCode: number | string | null | undefined;
};

const BalanceSummary = ({
    theme,
    openBalance,
    isEditing = false,
    closingDetails,
    onClosingDetailsChange,
    storageKey = "CLOSING_DETAILS",
    editingState,
    transactionType,
    accCode
}: BalanceSummaryProps) => {


    // Initialize state from props or localStorage
    const [details, setDetails] = useState<ClosingFormDetails>(() => {
        if (closingDetails) return closingDetails;

        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse closing details:", e);
            }
        }

        return {
            convType: "",
            convAmt: "",
            convWt: "",
            discAmt: "",
            discWt: "",
            cashPaid: "",
            cashRcvd: "",
            bankPaid: "",
            bankRcvd: "",
            bankPaidDetails: [],
            bankRcvdDetails: []
        };
    });

    const [conversionType, setConversionType] = useState<"C" | "P" | "">(details.convType);
    const [closingCash, setClosingCash] = useState(0);
    const [closingPure, setClosingPure] = useState(0);
    const rate =16000;

    console.log(conversionType,'conversionType')

    // Modal open states
    const [isBankPaidModalOpen, setIsBankPaidModalOpen] = useState(false);
    const [isBankRcvdModalOpen, setIsBankRcvdModalOpen] = useState(false);

    // Draft row ID states for bank transactions - FIXED: Use a stable ID based on accCode
    const [bankPaidDraftRowId, setBankPaidDraftRowId] = useState<string>(() => {
        return accCode ? `bank-paid-${accCode}` : "";
    });
    const [bankRcvdDraftRowId, setBankRcvdDraftRowId] = useState<string>(() => {
        return accCode ? `bank-rcvd-${accCode}` : "";
    });

    console.log(bankPaidDraftRowId,'bankPaidDraftRowId')

    // Refs to prevent multiple modal openings
    const bankPaidModalOpenedRef = useRef(false);
    const bankRcvdModalOpenedRef = useRef(false);

    const openingPure = openBalance.openPure ? formatToFixed(openBalance.openPure, 3) : "";
    const openingCash = openBalance.openCash ? formatToFixed(openBalance.openCash, 2) : "";

    // Get current editing row info
    const currentEditingRowId = editingState?.rowId;
    const currentEditingTransactionType = editingState?.transactionType;

    // Load bank transactions from localStorage when accCode changes or component mounts
    useEffect(() => {
        if (!accCode) {
            setDetails(prev => ({
                ...prev,
                bankPaid: "",
                bankRcvd: "",
                bankPaidDetails: [],
                bankRcvdDetails: []
            }));
            localStorage.removeItem(`BANK_PAID_${bankPaidDraftRowId}`);
            localStorage.removeItem(`BANK_RECEIVED_${bankRcvdDraftRowId}`);
            setBankPaidDraftRowId("");
            setBankRcvdDraftRowId("");
            return;
        }

        const paidId = `bank-paid-${accCode}`;
        const rcvdId = `bank-rcvd-${accCode}`;

        setBankPaidDraftRowId(paidId);
        setBankRcvdDraftRowId(rcvdId);

        // ─────────────── Load paid ───────────────
        const paidKey = `BANK_PAID_${paidId}`;
        const paidRaw = localStorage.getItem(paidKey);
        let paidTxs: BankTransaction[] = [];
        if (paidRaw) {
            try {
                paidTxs = JSON.parse(paidRaw);
            } catch { }
        }

        // ─────────────── Load received ───────────────
        const rcvdKey = `BANK_RECEIVED_${rcvdId}`;
        const rcvdRaw = localStorage.getItem(rcvdKey);
        let rcvdTxs: BankTransaction[] = [];
        if (rcvdRaw) {
            try {
                rcvdTxs = JSON.parse(rcvdRaw);
            } catch { }
        }

        setDetails(prev => ({
            ...prev,
            bankPaid: paidTxs.reduce((sum, t) => sum + t.amount, 0).toString(),
            bankPaidDetails: paidTxs,
            bankRcvd: rcvdTxs.reduce((sum, t) => sum + t.amount, 0).toString(),
            bankRcvdDetails: rcvdTxs,
        }));

    }, [accCode]);


    // Closing calculation effect
    useEffect(() => {
        const cashRcvd = parseFloat(details.cashRcvd || "0");
        const cashPaid = parseFloat(details.cashPaid || "0");
        const bankRcvd = details.bankRcvdDetails.reduce((sum, t) => sum + t.amount, 0);
        const bankPaid = details.bankPaidDetails.reduce((sum, t) => sum + t.amount, 0);

        let convAmt = parseFloat(details.convAmt || "0");
        let convWt = parseFloat(details.convWt || "0");

        // Auto-calculate the other field for display only
        if (conversionType === "P") {
            convAmt = convWt * rate;  // just for display
            setDetails(prev => ({ ...prev, convAmt: convAmt.toFixed(2) }));
        } else if (conversionType === "C") {
            convWt = convAmt / rate;  // just for display
            setDetails(prev => ({ ...prev, convWt: convWt.toFixed(3) }));
        }

        // Closing calculations
        // Only opening balances + received - paid

        // const newClosingCash = conversionType === "C" ? openBalance.openCash + cashRcvd + bankRcvd - ( cashPaid + bankPaid ) - convAmt: openBalance.openCash + cashRcvd + bankRcvd - cashPaid - bankPaid + convAmt;
        // const newClosingPure = conversionType === "P" ? openBalance.openPure - convWt : openBalance.openPure + convWt; // don't add convWt or convAmt to opening


        const newClosingCash = conversionType === "C" ? openBalance.openCash + (cashRcvd + bankRcvd) - (cashPaid + bankPaid) - convAmt : openBalance.openCash + cashRcvd + bankRcvd - cashPaid - bankPaid + convAmt;
        const newClosingPure = conversionType === "P" ? ( ((cashRcvd + bankRcvd) - (cashPaid + bankPaid)) /rate ): openBalance.openPure + convWt; // don't add convWt or convAmt to opening

        setClosingCash(parseFloat(newClosingCash.toFixed(2)));
        setClosingPure(parseFloat(newClosingPure.toFixed(3)));

    }, [
        details.cashRcvd,
        details.cashPaid,
        details.bankRcvdDetails,
        details.bankPaidDetails,
        details.convAmt,
        details.convWt,
        conversionType,
        openBalance,
        rate
    ]);

    // Update parent when details change
    // useEffect(() => {
    //     // Save to localStorage
    //     localStorage.setItem(storageKey, JSON.stringify(details));
    // }, [details, storageKey]);

    // Separate effect for notifying parent
    useEffect(() => {
        onClosingDetailsChange?.(details);
    }, [details]);

    // Update internal state when parent props change
    useEffect(() => {
        if (closingDetails) {
            setDetails(closingDetails);
            setConversionType(closingDetails.convType);
        }
    }, [closingDetails]);

    const handleChange = (field: keyof ClosingFormDetails, value: string) => {
        setDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleBankPaidSave = (transactions: BankTransaction[], total: number) => {
        setDetails(prev => ({
            ...prev,
            bankPaid: total.toString(),
            bankPaidDetails: transactions
        }));
    };

    const handleBankRcvdSave = (transactions: BankTransaction[], total: number) => {
        console.log("Received transactions saved:", transactions, total)
        setDetails(prev => ({
            ...prev,
            bankRcvd: total.toString(),
            bankRcvdDetails: transactions
        }));
    };

    // Handle conversion type change
    const handleConvTypeChange = (type: "P" | "C" | "") => {
        setConversionType(prev => prev === type ? "" : type);

        // Clear both fields when type changes
        setDetails(prev => ({
            ...prev,
            convType: prev.convType === type ? "" : type,
            convAmt: "",
            convWt: ""
        }));
    };
    
    // Handler for opening Bank Paid modal
    const handleOpenBankPaidModal = () => {
        if (bankPaidModalOpenedRef.current) return;
        bankPaidModalOpenedRef.current = true;

        let idToUse: string;

        // Use current editing row ID if available
        if (currentEditingRowId && currentEditingTransactionType === transactionType) {
            idToUse = currentEditingRowId;
            console.log("Opening bank paid modal for existing row:", idToUse);
        } else if (bankPaidDraftRowId) {
            // Use the stable ID based on accCode
            idToUse = bankPaidDraftRowId;
            console.log("Using stable bank paid ID:", idToUse);
        } else {
            // Fallback (should not happen)
            idToUse = `bank-paid-${Date.now()}`;
        }

        setIsBankPaidModalOpen(true);
        setTimeout(() => { bankPaidModalOpenedRef.current = false; }, 500);
    };

    // Handler for opening Bank Received modal
    const handleOpenBankRcvdModal = () => {
        if (bankRcvdModalOpenedRef.current) return;
        bankRcvdModalOpenedRef.current = true;

        let idToUse: string;

        // Use current editing row ID if available
        if (currentEditingRowId && currentEditingTransactionType === transactionType) {
            idToUse = currentEditingRowId;
            console.log("Opening bank received modal for existing row:", idToUse);
        } else if (bankRcvdDraftRowId) {
            // Use the stable ID based on accCode
            idToUse = bankRcvdDraftRowId;
            console.log("Using stable bank received ID:", idToUse);
        } else {
            // Fallback (should not happen)
            idToUse = `bank-rcvd-${Date.now()}`;
        }

        setIsBankRcvdModalOpen(true);
        setTimeout(() => { bankRcvdModalOpenedRef.current = false; }, 500);
    };

    // Close handlers
    const closeBankPaidModal = () => {
        setIsBankPaidModalOpen(false);
    };

    const closeBankRcvdModal = () => {
        setIsBankRcvdModalOpen(false);
    };

    return (
        <Box p={2} bg={theme.colors.formColor} borderRadius="md">
            <Grid templateColumns="100px 1fr 1fr" gap={2} alignItems="center">
                {/* Header */}
                <GridItem />
                <Text textAlign="center" fontSize="xs" fontWeight="semibold">
                    Pure
                </Text>
                <Text textAlign="center" fontSize="xs" fontWeight="semibold">
                    Cash
                </Text>

                {/* Opening Balance */}
                <Text fontSize="xs" fontWeight="semibold">
                    Opening Balance
                </Text>
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

                {/* Conversion Type Selection */}
                <Text fontSize="xs" fontWeight="semibold">
                    Convert By
                </Text>
                <HStack>
                    <Checkbox.Root
                        size="xs"
                        checked={conversionType === "P"}
                        onCheckedChange={() => handleConvTypeChange("P")}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                            <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label fontSize="2xs">Pure</Checkbox.Label>
                    </Checkbox.Root>
                </HStack>
                <HStack>
                    <Checkbox.Root
                        size="xs"
                        checked={conversionType === "C"}
                        onCheckedChange={() => handleConvTypeChange("C")}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                            <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label fontSize="2xs">Cash</Checkbox.Label>
                    </Checkbox.Root>
                </HStack>

                {/* Conversion Values */}
                <Text fontSize="xs" fontWeight="semibold">
                    Conversion
                </Text>
                <CapitalizedInput
                    value={details.convWt}
                    field="convValue"
                    onChange={(_, v) => handleChange("convWt", v)}
                    type="number"
                    allowDecimal
                    decimalScale={3}
                    size="xs"
                    rounded="sm"
                    disabled={!accCode || conversionType === "C"}
                />
                <CapitalizedInput
                    value={details.convAmt}
                    field="convValue"
                    onChange={(_, v) => handleChange("convAmt" , v)}
                    type="number"
                    allowDecimal
                    decimalScale={2}
                    size="xs"
                    rounded="sm"
                    disabled={!accCode || conversionType === "P"}
                />

                <Box />
                <Box />
                <Box />

                {/* Discount */}
                {/* <Text fontWeight="semibold" fontSize='xs'>Discount</Text>
                <CapitalizedInput
                    value={details.discWt}
                    field="discWt"
                    onChange={(_, v) => handleChange("discWt", v)}
                    type="number"
                    allowDecimal
                    decimalScale={3}
                    size="xs"
                    rounded="sm"
                />
                <CapitalizedInput
                    value={details.discAmt}
                    field="discAmt"
                    onChange={(_, v) => handleChange("discAmt", v)}
                    type="number"
                    decimalScale={2}
                    size="xs"
                    rounded="sm"
                    disabled={!accCode}
                /> */}

                {/* Bank Received */}
                <Text />
                <Text />
                <VStack align="start" gap={0}>
                    <HStack justify="space-between" width="100%">
                        <Text fontSize="2xs" fontWeight="medium">
                            Bank Received
                        </Text>
                    </HStack>
                    <Box
                        onClick={handleOpenBankRcvdModal}
                        cursor="pointer"
                        width="100%"
                    >
                        <CapitalizedInput
                            value={details.bankRcvd}
                            field="bankRcvd"
                            onChange={() => { }}
                            type="number"
                            decimalScale={2}
                            size="xs"
                            rounded="sm"
                            disabled={!accCode}
               
                        />
                    </Box>

                    {details.bankRcvdDetails.length > 0 && (
                        <Badge size="xs" colorPalette="blue" fontSize="2xs">
                            {details.bankRcvdDetails.length} transaction(s)
                        </Badge>
                    )}
                </VStack>

                {/* Cash Received */}
                <Text />
                <Text />
                <VStack align="start" gap={0}>
                    <Text fontSize="2xs" fontWeight="medium">
                        Cash Received
                    </Text>
                    <CapitalizedInput
                        value={details.cashRcvd}
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
                <Text />
                <Text />
                <VStack align="start" gap={0}>
                    <HStack justify="space-between" width="100%">
                        <Text fontSize="2xs" fontWeight="medium">
                            Bank Paid
                        </Text>
                    </HStack>
                    <Box
                        onClick={handleOpenBankPaidModal}
                        cursor="pointer"
                        width="100%"
                    >
                        <CapitalizedInput
                            value={details.bankPaid}
                            field="bankPaid"
                            onChange={() => { }}
                            type="number"
                            decimalScale={2}
                            size="xs"
                            rounded="sm"
                            disabled={!accCode}
                
                        />
                    </Box>

                    {details.bankPaidDetails.length > 0 && (
                        <Badge size="xs" colorPalette="red" fontSize="2xs">
                            {details.bankPaidDetails.length} transaction(s)
                        </Badge>
                    )}
                </VStack>

                {/* Cash Paid */}
                <Text />
                <Text />
                <VStack align="start" gap={0}>
                    <Text fontSize="2xs" fontWeight="medium">
                        Cash Paid
                    </Text>
                    <CapitalizedInput
                        value={details.cashPaid}
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
                    value={formatToFixed(closingPure.toString() ,3)}
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
                    value={formatToFixed(closingCash.toString(),2)}
                    field="closeCash"
                    onChange={() => { }}
                    type="number"
                    size="xs"
                    rounded="sm"
                    disabled
                />
            </Grid>

            {/* Bank Transaction Modals */}
            <BankTransactionModal
                draftRowId={bankPaidDraftRowId}
                isOpen={isBankPaidModalOpen}
                onClose={closeBankPaidModal}
                onSave={handleBankPaidSave}
                type="paid"
                theme={theme}
                initialTransactions={details.bankPaidDetails}
                accCode={accCode}
                escapeId="paidModal"
            />

            <BankTransactionModal
                draftRowId={bankRcvdDraftRowId}
                isOpen={isBankRcvdModalOpen}
                onClose={closeBankRcvdModal}
                onSave={handleBankRcvdSave}
                type="received"
                theme={theme}
                initialTransactions={details.bankRcvdDetails}
                accCode={accCode}
                escapeId="receivedModal"
            />
        </Box>
    );
};

export default BalanceSummary;