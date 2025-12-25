"use client";

import React, { createContext } from "react";
import { ApiResponse, Company } from "@/service/CompanyService";
import { LoginPayload } from "@/service/AuthService";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    mobile: string;
}

export interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    userId: number |string | null;
    login: (payload: LoginPayload) => Promise<ApiResponse>;
    logout: () => void;
    refreshUser: (uid: number) => Promise<void>;
    company: () => Promise<void>;
    companiesData: Company[];
}

export const AuthContext = createContext<AuthContextType | null>(null);
