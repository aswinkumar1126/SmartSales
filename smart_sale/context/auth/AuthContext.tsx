"use client";

import React, { createContext } from "react";

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

    login: (token: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
