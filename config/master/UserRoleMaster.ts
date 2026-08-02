import { FormField } from "@/types/form/form";

type UserRoleMasterFormConfig = {
    users: { label: string; value: string }[];
    roles: { label: string; value: string }[];
};

export const UserRoleMaster = (
    prop: UserRoleMasterFormConfig
): FormField[] => [
        {
            name: "USERID",
            label: "USERNAME",
        type: 'combobox',
        required: true,
        options: prop.users,
        placeholder: 'Select State',
        size: 'xs',
        },
        {
            name: "ROLEID",
            label: "ROLE NAME",
            type: 'combobox',
            required: true,
            options: prop.roles,
            placeholder: 'Select State',
            size: 'xs',
        },
    ];