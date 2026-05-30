import { useState } from "react";
import { TransactionStatus } from "@/component/loader/Transactionloader";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type LoaderMode = "save" | "update" | "get";

export interface TransactionLoaderState {
    isOpen: boolean;
    status: TransactionStatus;
    title: string | undefined;
    description: string | undefined;

    openLoader: (mode: LoaderMode, form?: boolean) => void;

    resolveLoader: (
        outcome: "success" | "error",
        mode: LoaderMode,
        errorMessage?: string,
        form?: boolean
    ) => void;

    closeLoader: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Messages
// ─────────────────────────────────────────────────────────────────────────────
const MESSAGES: Record<
    LoaderMode,
    Record<"saving" | "success" | "error", { title: string; description: string }>
> = {
    save: {
        saving: {
            title: "Saving Transaction",
            description: "Please wait while your transaction is being saved…",
        },
        success: {
            title: "Transaction Saved!",
            description: "Your transaction has been saved successfully.",
        },
        error: {
            title: "Save Failed",
            description: "Something went wrong. Please try again.",
        },
    },

    update: {
        saving: {
            title: "Updating Transaction",
            description: "Please wait while your transaction is being updated…",
        },
        success: {
            title: "Transaction Updated!",
            description: "Your transaction has been updated successfully.",
        },
        error: {
            title: "Update Failed",
            description: "Something went wrong. Please try again.",
        },
    },
    get: {
        saving: {
            title: "Loading Transaction",
            description: "Please wait while transaction is being loaded…",
        },
        success: {
            title: "Transaction Loaded!",
            description: "Transaction loaded successfully.",
        },
        error: {
            title: "Load Failed",
            description: "Unable to load transaction.",
        },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Form Messages
// ─────────────────────────────────────────────────────────────────────────────
const FORMMESSAGES: Record<
    LoaderMode,
    Record<"saving" | "success" | "error", { title: string; description: string }>
> = {
    save: {
        saving: {
            title: "Saving Form",
            description: "Please wait while your form is being saved…",
        },
        success: {
            title: "Form Saved!",
            description: "Your form has been saved successfully.",
        },
        error: {
            title: "Form Save Failed",
            description: "Unable to save the form. Please try again.",
        },
    },

    update: {
        saving: {
            title: "Updating Form",
            description: "Please wait while your form is being updated…",
        },
        success: {
            title: "Form Updated!",
            description: "Your form has been updated successfully.",
        },
        error: {
            title: "Form Update Failed",
            description: "Unable to update the form. Please try again.",
        },
    },
    get: {
        saving: {
            title: "Loading Form",
            description: "Please wait while form is being loaded…",
        },
        success: {
            title: "Form Loaded!",
            description: "Form loaded successfully.",
        },
        error: {
            title: "Load Failed",
            description: "Unable to load form.",
        },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export const useTransactionLoader = (): TransactionLoaderState => {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<TransactionStatus>("saving");
    const [title, setTitle] = useState<string | undefined>(undefined);
    const [description, setDescription] = useState<string | undefined>(undefined);

    const getMessages = (form?: boolean) => {
        return form ? FORMMESSAGES : MESSAGES;
    };

    const openLoader = (mode: LoaderMode, form = false) => {
        const messages = getMessages(form);
        const { title, description } = messages[mode].saving;

        setStatus("saving");
        setTitle(title);
        setDescription(description);
        setIsOpen(true);
    };

    const resolveLoader = (
        outcome: "success" | "error",
        mode: LoaderMode,
        errorMessage?: string,
        form = false
    ) => {
        const messages = getMessages(form);
        const msg = messages[mode][outcome];

        setStatus(outcome);
        setTitle(msg.title);

        setDescription(
            outcome === "error" && errorMessage
                ? errorMessage
                : msg.description
        );
    };

    const closeLoader = () => setIsOpen(false);

    return {
        isOpen,
        status,
        title,
        description,
        openLoader,
        resolveLoader,
        closeLoader,
    };
};