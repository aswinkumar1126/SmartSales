"use client";

import React, { useEffect, useState } from "react";
import { Box, Flex, Text, VStack, HStack, Icon } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Motion primitives
// ─────────────────────────────────────────────────────────────────────────────
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
export type TransactionStatus = "saving" | "success" | "error";

interface TransactionLoaderProps {
    /** Controls visibility */
    isOpen: boolean;
    /** Current status of the transaction */
    status?: TransactionStatus;
    /** Primary message — e.g. "Saving your transaction" */
    title?: string;
    /** Subtitle / description */
    description?: string;
    /** Called when the dialog auto-dismisses or user closes after success/error */
    onClose?: () => void;
    /** Auto-dismiss after success/error (ms). Set to 0 to disable. Default: 2200 */
    autoDismissMs?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Animated ring spinner */
const RingSpinner = ({ color }: { color: string }) => (
    <Box position="relative" w="56px" h="56px">
        {/* Track ring */}
        <Box
            position="absolute"
            inset={0}
            borderRadius="full"
            border="3px solid"
            borderColor="gray.100"
        />
        {/* Spinning arc */}
        <MotionBox
            position="absolute"
            inset={0}
            borderRadius="full"
            border="3px solid transparent"
            borderTopColor={color}
            borderRightColor={color}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: "linear" } as any}
        />
        {/* Center dot pulse */}
        <MotionBox
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            w="8px"
            h="8px"
            borderRadius="full"
            bg={color}
            animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" } as any}
        />
    </Box>
);

/** Animated progress bar (indeterminate) */
const ProgressBar = ({ color }: { color: string }) => (
    <Box
        w="100%"
        h="3px"
        bg="gray.100"
        borderRadius="full"
        overflow="hidden"
        position="relative"
    >
        <MotionBox
            position="absolute"
            top={0}
            left={0}
            h="100%"
            w="45%"
            borderRadius="full"
            bg={color}
            animate={{ x: ["-45%", "222%"] }}
            transition={{
                repeat: Infinity,
                duration: 1.4,
                ease: "easeInOut",
                repeatType: "loop",
            } as any}
        />
    </Box>
);

/** Dot bounce row */
const DotRow = ({ color }: { color: string }) => (
    <HStack gap={1.5} justify="center">
        {[0, 1, 2].map((i) => (
            <MotionBox
                key={i}
                w="5px"
                h="5px"
                borderRadius="full"
                bg={color}
                animate={{ y: [0, -6, 0] }}
                transition={{
                    repeat: Infinity,
                    duration: 0.9,
                    ease: "easeInOut",
                    delay: i * 0.15,
                } as any}
            />
        ))}
    </HStack>
);

/** Success checkmark circle (SVG draw-on) */
const SuccessMark = ({ color }: { color: string }) => (
    <MotionBox
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 } as any}
    >
        <Box
            w="56px"
            h="56px"
            borderRadius="full"
            bg={`${color}15`}
            border="2px solid"
            borderColor={`${color}40`}
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Icon as={CheckCircle} boxSize={6} color={color} />
        </Box>
    </MotionBox>
);

/** Error mark */
const ErrorMark = () => (
    <MotionBox
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 } as any}
    >
        <Box
            w="56px"
            h="56px"
            borderRadius="full"
            bg="red.50"
            border="2px solid"
            borderColor="red.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Icon as={AlertCircle} boxSize={6} color="red.500" />
        </Box>
    </MotionBox>
);

// ─────────────────────────────────────────────────────────────────────────────
// Step messages cycle (while saving)
// ─────────────────────────────────────────────────────────────────────────────
const SAVING_STEPS = [
    "Validating your data…",
    "Processing transaction…",
    "Saving to the server…",
    "Almost done…",
];

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const TransactionLoader = ({
    isOpen,
    status = "saving",
    title,
    description,
    onClose,
    autoDismissMs = 2200,
}: TransactionLoaderProps) => {
    const [stepIndex, setStepIndex] = useState(0);

    // Cycle through step messages while saving
    useEffect(() => {
        if (status !== "saving") return;
        const interval = setInterval(() => {
            setStepIndex((i) => (i + 1) % SAVING_STEPS.length);
        }, 1600);
        return () => clearInterval(interval);
    }, [status]);

    // Auto-dismiss on success / error — always after 500ms so the user
    // briefly sees the outcome before the dialog disappears.
    useEffect(() => {
        if ((status === "success" || status === "error") && onClose) {
            const t = setTimeout(onClose, 500);
            return () => clearTimeout(t);
        }
    }, [status, onClose]);

    // Derived content
    const accentColor =
        status === "success" ? "#22c55e" : status === "error" ? "#ef4444" : "#3b82f6";

    const displayTitle =
        title ??
        (status === "saving"
            ? "Saving Transaction"
            : status === "success"
            ? "Saved Successfully"
            : "Something went wrong");

    const displayDescription =
        description ??
        (status === "saving"
            ? SAVING_STEPS[stepIndex]
            : status === "success"
            ? "Your transaction has been saved."
            : "Please try again or contact support.");

    return (
        <AnimatePresence>
            {isOpen && (
                /* Backdrop */
                <MotionFlex
                    position="fixed"
                    inset={0}
                    bg="rgba(15, 20, 35, 0.45)"
                    backdropFilter="blur(8px)"
                    css={{ WebkitBackdropFilter: "blur(8px)" }}
                    align="center"
                    justify="center"
                    zIndex={9999}
                    pointerEvents="all"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 } as any}
                    onClick={status !== "saving" ? onClose : undefined}
                >
                    {/* Dialog card */}
                    <MotionBox
                        bg="white"
                        borderRadius="2xl"
                        boxShadow="0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)"
                        p={8}
                        w="340px"
                        maxW="90vw"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={5}
                        initial={{ opacity: 0, y: 24, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] } as any}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        position="relative"
                        overflow="hidden"
                    >
                        {/* Top accent bar */}
                        <MotionBox
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            h="3px"
                            bg={accentColor}
                            initial={{ scaleX: 0, originX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 } as any}
                        />

                        {/* Icon area */}
                        <Box mt={2}>
                            {status === "saving" && <RingSpinner color={accentColor} />}
                            {status === "success" && <SuccessMark color={accentColor} />}
                            {status === "error" && <ErrorMark />}
                        </Box>

                        {/* Text */}
                        <VStack gap={1.5} textAlign="center" w="100%">
                            <Text
                                fontSize="16px"
                                fontWeight="700"
                                color="gray.800"
                                letterSpacing="-0.01em"
                                lineHeight="1.25"
                            >
                                {displayTitle}
                            </Text>

                            {/* Animated step description */}
                            <Box h="20px" position="relative" w="100%" overflow="hidden">
                                <AnimatePresence mode="wait">
                                    <MotionBox
                                        key={`${status}-${stepIndex}`}
                                        position="absolute"
                                        left={0}
                                        right={0}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.22 } as any}
                                    >
                                        <Text
                                            fontSize="13px"
                                            color="gray.500"
                                            fontWeight="400"
                                            textAlign="center"
                                        >
                                            {displayDescription}
                                        </Text>
                                    </MotionBox>
                                </AnimatePresence>
                            </Box>
                        </VStack>

                        {/* Progress bar / dots — only while saving */}
                        {status === "saving" && (
                            <VStack w="100%" gap={3}>
                                <ProgressBar color={accentColor} />
                                <DotRow color={accentColor} />
                            </VStack>
                        )}

                        {/* Dismiss hint for success / error */}
                        {status !== "saving" && (
                            <MotionBox
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 } as any}
                            >
                                <Text fontSize="11px" color="gray.300" textAlign="center">
                                    Closing automatically…
                                </Text>
                            </MotionBox>
                        )}
                    </MotionBox>
                </MotionFlex>
            )}
        </AnimatePresence>
    );
};

export default TransactionLoader;