import { useState } from "react";
import { TransactionStatus } from "@/component/loader/Transactionloader";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type LoaderMode = "save" | "update";

export interface TransactionLoaderState {
    isOpen: boolean;
    status: TransactionStatus;
    title: string | undefined;
    description: string | undefined;
    openLoader: (mode: LoaderMode) => void;
    resolveLoader: (outcome: "success" | "error", mode: LoaderMode, errorMessage?: string) => void;
    closeLoader: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Messages config — centralised so you only edit one place
// ─────────────────────────────────────────────────────────────────────────────
const MESSAGES: Record<
    LoaderMode,
    Record<"saving" | "success" | "error", { title: string; description: string }>
> = {
    save: {
        saving:  { title: "Saving Transaction",  description: "Please wait while your transaction is being saved…"    },
        success: { title: "Transaction Saved!",   description: "Your transaction has been saved successfully."         },
        error:   { title: "Save Failed",          description: "Something went wrong. Please try again."              },
    },
    update: {
        saving:  { title: "Updating Transaction", description: "Please wait while your transaction is being updated…" },
        success: { title: "Transaction Updated!", description: "Your transaction has been updated successfully."       },
        error:   { title: "Update Failed",        description: "Something went wrong. Please try again."              },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export const useTransactionLoader = (): TransactionLoaderState => {
    const [isOpen,      setIsOpen]      = useState(false);
    const [status,      setStatus]      = useState<TransactionStatus>("saving");
    const [title,       setTitle]       = useState<string | undefined>(undefined);
    const [description, setDescription] = useState<string | undefined>(undefined);

    const openLoader = (mode: LoaderMode) => {
        const { title, description } = MESSAGES[mode].saving;
        setStatus("saving");
        setTitle(title);
        setDescription(description);
        setIsOpen(true);
    };

    const resolveLoader = (
        outcome: "success" | "error",
        mode: LoaderMode,
        errorMessage?: string
    ) => {
        const msg = MESSAGES[mode][outcome];
        setStatus(outcome);
        setTitle(msg.title);
        setDescription(outcome === "error" && errorMessage ? errorMessage : msg.description);
        // TransactionLoader's internal 500ms useEffect calls closeLoader via onClose
    };

    const closeLoader = () => setIsOpen(false);

    return { isOpen, status, title, description, openLoader, resolveLoader, closeLoader };
};