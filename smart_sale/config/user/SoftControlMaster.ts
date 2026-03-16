import { FormField } from "@/types/form/form";

export const getSoftControlFormFields = (editId?: string | null): FormField[] => [
    {
        name: "CTLID",
        label: "ID",
        type: "text",
        required: true,
        size: "xs",
        rounded: "sm",
        disabled: !!editId,
        autoFocus: true,
    },
    {
        name: "CTLNAME",
        label: "NAME",
        type: "text",
        required: true,
        size: "xs",
        rounded: "sm",
    },
    {
        name: "CTLTEXT",
        label: "VALUE",
        type: "text",
        size: "xs",
        rounded: "sm",
    },
];