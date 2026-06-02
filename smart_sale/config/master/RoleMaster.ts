import { FormField } from "@/types/form/form";

type RoleMasterFormConfing = {
    yesOrNo : {label:string ; value :string}[]
}

export const RoleMaster = (prop:RoleMasterFormConfing):FormField[]  => [
    {
        name: "ROLENAME",
        label: "ROLE NAME",
        type: "text",
        size: "sm",
        rounded: "sm",
    },
    {
        name: "ACTIVE",
        label: "ACTIVE",
        type: "select",
        size: "sm",
        rounded: "sm",
        items: prop.yesOrNo

    },
    {
        name: "PWDACCESS",
        label: "PASSWORD ACCESS",
        type: "select",
        size: "sm",
        rounded: "sm",
        items: prop.yesOrNo
  
    },
    {
        name: "ADMINACCESS",
        label: "ADMINACCESS",
        type: "select",
        size: "sm",
        rounded:"sm",
        items: prop.yesOrNo
    },
];