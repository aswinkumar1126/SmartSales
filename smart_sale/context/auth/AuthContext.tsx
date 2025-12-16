"use client";

import React, { createContext } from "react";
import { Company } from "@/service/CompanyService";
import { LoginPayload } from "@/service/AuthService";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    mobile: string;
}

export interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    logout: () => void;
    refreshUser: (uid: number) => Promise<void>;
    company: () => Promise<void>;
    companiesData: Company[];
}

export const AuthContext = createContext<AuthContextType | null>(null);
