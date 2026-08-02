"use client"
import  * as yup from "yup";

export const registerSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
    mobile: yup
        .string()
        .matches(/^[0-9]{10}$/, "Enter valid 10-digit mobile number")
        .required("Mobile is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup.string().min(6, "Min 6 characters").required("Password required"),
});

export const loginSchema = yup.object().shape({
    username: yup
        .string()
       // .matches(/^[0-9]{10}$/, "Enter valid 10-digit mobile number")
        .required("UserName is required"),
    password: yup.string().required("Password required"),
});

export type RegisterSchemaType = yup.InferType<typeof registerSchema>;
export type LoginSchemaType = yup.InferType<typeof loginSchema>;
