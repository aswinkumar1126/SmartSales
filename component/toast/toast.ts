import { toaster } from "@/components/ui/toaster";

type ToastType = "success" | "error" | "warning" | "info";

type Entity = string;

const showToast = (
    type: ToastType,
    title: string,
    description?: string
) => {
    toaster.create({
        type,
        title,
        description,
    });
};

/* ===================== GENERIC ENTITY TOASTS ===================== */

export const toastLoaded = (entity: Entity) =>
    showToast("success", `${entity} loaded successfully`);

export const toastCreated = (entity: Entity) =>
    showToast("success", `${entity} created successfully`);

export const toastUpdated = (entity: Entity) =>
    showToast("success", `${entity} updated successfully`);

export const toastDeleted = (entity: Entity) =>
    showToast("success", `${entity} deleted successfully`);

export const toastUploaded = (entity: Entity) =>
    showToast("success", `${entity} uploaded successfully`);

export const toastError = (entity: Entity, msg?: string) =>
    showToast("error", `${entity} failed`, msg ?? "Please try again");
