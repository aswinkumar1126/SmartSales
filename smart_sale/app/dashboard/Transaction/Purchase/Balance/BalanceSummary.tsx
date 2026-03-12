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
    accCode: number;
    rate: number;
    transactionResetSignal?: boolean;
};

const resetDetails: ClosingFormDetails = {
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
    bankRcvdDetails: [],
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
    accCode,
    rate,
    transactionResetSignal
}: BalanceSummaryProps) => {

    const prevAccCodeRef = useRef<number | null>(null);

    const [details, setDetails] = useState<ClosingFormDetails>(() => {
        if (closingDetails) return closingDetails;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try { return JSON.parse(saved); }
            catch (e) { console.error("Failed to parse closing details:", e); }
        }
        return { ...resetDetails };
    });

    const [conversionType, setConversionType] = useState<"" | "C" | "P">(details.convType);
    const [closingCash, setClosingCash] = useState(0);
    const [closingPure, setClosingPure] = useState(0);
    const [activeBankModal, setActiveBankModal] = useState<"paid" | "received" | null>(null);

    const [bankPaidDraftRowId, setBankPaidDraftRowId] = useState<string>(() =>
        accCode ? `bank-paid-${accCode}` : ""
    );
    const [bankRcvdDraftRowId, setBankRcvdDraftRowId] = useState<string>(() =>
        accCode ? `bank-rcvd-${accCode}` : ""
    );

    const bankPaidModalOpenedRef = useRef(false);
    const bankRcvdModalOpenedRef = useRef(false);

    // ✅ detailsRef — always mirrors latest details, safe to read in handlers
    const detailsRef = useRef(details);

    // ✅ pendingParentUpdateRef — event handlers write here, notify effect reads it
    // This breaks the "setState during render" chain by deferring parent calls
    // to AFTER React finishes rendering BalanceSummary
    const pendingParentUpdateRef = useRef<ClosingFormDetails | null>(null);

    const openingPure = openBalance.openPure ? formatToFixed(openBalance.openPure, 3) : "0.000";
    const openingCash = openBalance.openCash ? formatToFixed(openBalance.openCash, 2) : "0.00";

    // ─────────────────────────────────────────
    // Sync detailsRef after every render
    // ─────────────────────────────────────────
    useEffect(() => {
        detailsRef.current = details;
    }, [details]);

    // ─────────────────────────────────────────
    // ✅ KEY FIX: Notify parent AFTER render completes
    //
    // Runs after every render (no deps array).
    // Checks pendingParentUpdateRef — if an event handler queued an update,
    // send it to parent now (we are safely outside React's render phase).
    // Parent's setClosingDetails() is allowed here — no "setState during render".
    // ─────────────────────────────────────────
    useEffect(() => {
        if (pendingParentUpdateRef.current !== null) {
            onClosingDetailsChange?.(pendingParentUpdateRef.current);
            pendingParentUpdateRef.current = null;
        }
    }); // intentionally no deps — runs after every render

    // ─────────────────────────────────────────
    // accCode / transactionResetSignal effect
    // ─────────────────────────────────────────
    useEffect(() => {
        const isInitialMount = prevAccCodeRef.current === null;
        const prevAccCode = prevAccCodeRef.current;
        const wasValidBefore = prevAccCode !== null && prevAccCode !== 0;

        prevAccCodeRef.current = accCode;

        // Handle reset signal — fires even when accCode is valid
        if (transactionResetSignal) {
            const paidId = accCode
                ? `bank-paid-${accCode}`
                : prevAccCode ? `bank-paid-${prevAccCode}` : "";
            const rcvdId = accCode
                ? `bank-rcvd-${accCode}`
                : prevAccCode ? `bank-rcvd-${prevAccCode}` : "";

            const next = { ...resetDetails };
            setDetails(next);
            detailsRef.current = next;
            setConversionType("");
            setBankPaidDraftRowId("");
            setBankRcvdDraftRowId("");
            setActiveBankModal(null);
            localStorage.removeItem(storageKey);
            if (paidId) localStorage.removeItem(`BANK_PAID_${paidId}`);
            if (rcvdId) localStorage.removeItem(`BANK_RECEIVED_${rcvdId}`);
            pendingParentUpdateRef.current = next; // queued for post-render notify
            return;
        }

        const accCodeBecameInvalid =
            !isInitialMount && wasValidBefore && (!accCode || accCode === 0);

        if (!accCode || accCode === 0) {
            if (accCodeBecameInvalid) {
                const oldPaidId = `bank-paid-${prevAccCode}`;
                const oldRcvdId = `bank-rcvd-${prevAccCode}`;

                const next = { ...resetDetails };
                setDetails(next);
                detailsRef.current = next;
                setConversionType("");
                setBankPaidDraftRowId("");
                setBankRcvdDraftRowId("");
                setActiveBankModal(null);
                localStorage.removeItem(storageKey);
                localStorage.removeItem(`BANK_PAID_${oldPaidId}`);
                localStorage.removeItem(`BANK_RECEIVED_${oldRcvdId}`);
                pendingParentUpdateRef.current = next; // queued for post-render notify
            }
            return;
        }

        // Valid accCode — load from localStorage
        const paidId = `bank-paid-${accCode}`;
        const rcvdId = `bank-rcvd-${accCode}`;

        setBankPaidDraftRowId(paidId);
        setBankRcvdDraftRowId(rcvdId);

        const paidRaw = localStorage.getItem(`BANK_PAID_${paidId}`);
        let paidTxs: BankTransaction[] = [];
        if (paidRaw) { try { paidTxs = JSON.parse(paidRaw); } catch { } }

        const rcvdRaw = localStorage.getItem(`BANK_RECEIVED_${rcvdId}`);
        let rcvdTxs: BankTransaction[] = [];
        if (rcvdRaw) { try { rcvdTxs = JSON.parse(rcvdRaw); } catch { } }

        const next: ClosingFormDetails = {
            ...resetDetails,
            bankPaid: paidTxs.reduce((sum, t) => sum + t.amount, 0).toString(),
            bankPaidDetails: paidTxs,
            bankRcvd: rcvdTxs.reduce((sum, t) => sum + t.amount, 0).toString(),
            bankRcvdDetails: rcvdTxs,
        };

        setDetails(next);
        detailsRef.current = next;
        pendingParentUpdateRef.current = next; // queued for post-render notify

    }, [accCode, transactionResetSignal]);

    // ─────────────────────────────────────────
    // Closing balance calculation
    // Pure derived state — no parent calls here
    // ─────────────────────────────────────────
    useEffect(() => {
        const cashRcvd = parseFloat(details.cashRcvd || "0") || 0;
        const cashPaid = parseFloat(details.cashPaid || "0") || 0;
        const bankRcvd = details.bankRcvdDetails.reduce((sum, t) => sum + (t.amount || 0), 0);
        const bankPaid = details.bankPaidDetails.reduce((sum, t) => sum + (t.amount || 0), 0);

        let convAmt = parseFloat(details.convAmt || "") || 0;
        let convWt = parseFloat(details.convWt || "") || 0;

        if (rate > 0) {
            if (conversionType === "P") {
                const calculatedAmt = convWt * rate;
                if (calculatedAmt.toFixed(2) !== details.convAmt) {
                    // ✅ Update ref immediately so next handler reads correct value
                    const next = { ...detailsRef.current, convAmt: calculatedAmt.toFixed(2) };
                    detailsRef.current = next;
                    setDetails(next);
                    pendingParentUpdateRef.current = next;
                }
                convAmt = calculatedAmt;
            } else if (conversionType === "C") {
                const calculatedWt = convAmt / rate;
                if (calculatedWt.toFixed(3) !== details.convWt) {
                    const next = { ...detailsRef.current, convWt: calculatedWt.toFixed(3) };
                    detailsRef.current = next;
                    setDetails(next);
                    pendingParentUpdateRef.current = next;
                }
                convWt = calculatedWt;
            }
        }

        let newClosingCash = openBalance.openCash + cashRcvd + bankRcvd - cashPaid - bankPaid;
        let newClosingPure = openBalance.openPure;

        if (conversionType === "C") { newClosingCash -= convAmt; newClosingPure += convWt; }
        if (conversionType === "P") { newClosingCash += convAmt; newClosingPure -= convWt; }

        if (!isFinite(newClosingCash)) newClosingCash = 0;
        if (!isFinite(newClosingPure)) newClosingPure = 0;

        setClosingCash(Number(newClosingCash.toFixed(2)));
        setClosingPure(Number(newClosingPure.toFixed(3)));

    }, [
        details.cashRcvd, details.cashPaid,
        details.bankRcvdDetails, details.bankPaidDetails,
        details.convAmt, details.convWt,
        conversionType, openBalance, rate
    ]);

    // ─────────────────────────────────────────
    // Event handlers — all build `updated` locally,
    // set state, sync ref, and queue parent notify.
    // Never call onClosingDetailsChange directly.
    // ─────────────────────────────────────────

    const handleChange = (field: keyof ClosingFormDetails, value: string) => {
        const updated = { ...detailsRef.current, [field]: value };
        detailsRef.current = updated;
        setDetails(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        pendingParentUpdateRef.current = updated;
    };

    const handleBankPaidSave = (transactions: BankTransaction[], total: number) => {
        const updated = {
            ...detailsRef.current,
            bankPaid: total.toString(),
            bankPaidDetails: transactions
        };
        detailsRef.current = updated;
        setDetails(updated);
        pendingParentUpdateRef.current = updated;
    };

    const handleBankRcvdSave = (transactions: BankTransaction[], total: number) => {
        const updated = {
            ...detailsRef.current,
            bankRcvd: total.toString(),
            bankRcvdDetails: transactions
        };
        detailsRef.current = updated;
        setDetails(updated);
        pendingParentUpdateRef.current = updated;
    };

    const handleConvTypeChange = (type: "P" | "C" | "") => {
        const newConvType = conversionType === type ? "" : type;
        setConversionType(newConvType);
        const updated = { ...detailsRef.current, convType: newConvType, convAmt: "", convWt: "" };
        detailsRef.current = updated;
        setDetails(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        pendingParentUpdateRef.current = updated;
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
                    value={openingPure} field="openPure" onChange={() => { }}
                    type="number" allowDecimal decimalScale={3} size="xs" rounded="sm" disabled
                />
                <CapitalizedInput
                    value={openingCash} field="openCash" onChange={() => { }}
                    type="number" size="xs" rounded="sm" disabled
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
                    value={details.convWt} field="convValue"
                    onChange={(_, v) => handleChange("convWt", v)}
                    type="number" allowDecimal decimalScale={3} size="xs" rounded="sm"
                    disabled={!accCode || conversionType === "C" || conversionType === ""}
                />
                <CapitalizedInput
                    value={details.convAmt} field="convValue"
                    onChange={(_, v) => handleChange("convAmt", v)}
                    type="number" allowDecimal decimalScale={2} size="xs" rounded="sm"
                    disabled={!accCode || conversionType === "P" || conversionType === ""}
                />

                <Box /><Box /><Box />

                {/* Bank Received */}
                <Text /><Text />
                <VStack align="start" gap={0}>
                    <HStack justify="space-between" width="100%">
                        <Text fontSize="2xs" fontWeight="medium">Bank Received</Text>
                    </HStack>
                    <Box onClick={handleOpenBankRcvdModal} cursor={accCode ? "pointer" : "not-allowed"} width="100%">
                        <CapitalizedInput
                            value={details.bankRcvd} field="bankRcvd" onChange={() => { }}
                            type="number" decimalScale={2} size="xs" rounded="sm" disabled={!accCode}
                        />
                    </Box>
                    {details.bankRcvdDetails.length > 0 && (
                        <Badge size="xs" colorPalette="blue" fontSize="2xs">
                            {details.bankRcvdDetails.length} transaction(s)
                        </Badge>
                    )}
                </VStack>

                {/* Cash Received */}
                <Text /><Text />
                <VStack align="start" gap={0}>
                    <Text fontSize="2xs" fontWeight="medium">Cash Received</Text>
                    <CapitalizedInput
                        value={details.cashRcvd} field="cashRcvd"
                        onChange={(_, v) => handleChange("cashRcvd", v)}
                        type="number" decimalScale={2} size="xs" rounded="sm" disabled={!accCode}
                    />
                </VStack>

                {/* Bank Paid */}
                <Text /><Text />
                <VStack align="start" gap={0}>
                    <HStack justify="space-between" width="100%">
                        <Text fontSize="2xs" fontWeight="medium">Bank Paid</Text>
                    </HStack>
                    <Box onClick={handleOpenBankPaidModal} cursor={accCode ? "pointer" : "not-allowed"} width="100%">
                        <CapitalizedInput
                            value={details.bankPaid} field="bankPaid" onChange={() => { }}
                            type="number" decimalScale={2} size="xs" rounded="sm" disabled={!accCode}
                        />
                    </Box>
                    {details.bankPaidDetails.length > 0 && (
                        <Badge size="xs" colorPalette="red" fontSize="2xs">
                            {details.bankPaidDetails.length} transaction(s)
                        </Badge>
                    )}
                </VStack>

                {/* Cash Paid */}
                <Text /><Text />
                <VStack align="start" gap={0}>
                    <Text fontSize="2xs" fontWeight="medium">Cash Paid</Text>
                    <CapitalizedInput
                        value={details.cashPaid} field="cashPaid"
                        onChange={(_, v) => handleChange("cashPaid", v)}
                        type="number" decimalScale={2} size="xs" rounded="sm" disabled={!accCode}
                    />
                </VStack>

                {/* Closing Balance */}
                <Text fontWeight="semibold" fontSize='xs'>Closing Balance</Text>
                <CapitalizedInput
                    value={formatToFixed(closingPure.toString(), 3)} field="closePure"
                    onChange={() => { }} type="number" allowDecimal decimalScale={3}
                    size="xs" rounded="sm" disabled
                />
                <CapitalizedInput
                    value={formatToFixed(closingCash.toString(), 2)} field="closeCash"
                    onChange={() => { }} type="number" size="xs" rounded="sm" disabled
                />
            </Grid>

            {/* Single modal instance — switches between paid/received */}
            <BankTransactionModal
                key={activeBankModal ?? "none"}
                draftRowId={
                    activeBankModal === "paid" ? bankPaidDraftRowId : bankRcvdDraftRowId
                }
                isOpen={activeBankModal !== null}
                onClose={closeActiveModal}
                onSave={activeBankModal === "paid" ? handleBankPaidSave : handleBankRcvdSave}
                type={activeBankModal ?? "paid"}
                theme={theme}
                initialTransactions={
                    !accCode ? [] :
                        activeBankModal === "paid" ? details.bankPaidDetails : details.bankRcvdDetails
                }
                accCode={accCode}
                escapeId="bankModal"
            />
        </Box>
    );
};

export default BalanceSummary;