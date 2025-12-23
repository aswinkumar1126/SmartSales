"use client";

import React, { useEffect, useState } from "react";
import { AuthContext, AuthUser } from "./AuthContext";
import { authService, LoginPayload } from "@/service/AuthService";
import { CompanyService, Company } from "@/service/CompanyService";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [companiesData, setCompaniesData] = useState<Company[]>([]);

    // 🔄 fetch user
    const refreshUser = async (uid: number) => {
        setLoading(true);
        const res = await authService.me(uid);

        if (res.success) {
            setUser(res.data);
        } else {
            logout();
        }
        setLoading(false);
    };

    // 🏢 company list
    const company = async () => {
        try {
            const res = await CompanyService.getAll();
            setCompaniesData(res.data || []);
        } catch {
            setCompaniesData([]);
        }
    };

    useEffect(() => {
        company();
    }, []);

    // 🔐 LOGIN
    const login = async (payload: LoginPayload): Promise<boolean> => {
        setLoading(true);

        const res = await authService.login(payload);


        if (!res.success || !res.data?.userId) {
            setLoading(false);
            return false;
        }

        const uid = res.data.userId;

        // 🔐 secure session
        sessionStorage.setItem("userId", String(uid));
        setUserId(uid);

        await refreshUser(uid);

        setLoading(false);
        return true; // ✅ IMPORTANT
    };

    // 🚪 LOGOUT
    const logout = () => {
        setUser(null);
        setUserId(null);
        sessionStorage.removeItem("userId");
        window.location.href = "/login";
    };

    // ♻ restore session
    useEffect(() => {
        const storedUserId = sessionStorage.getItem("userId");
        if (storedUserId) {
            const uid = Number(storedUserId);
            setUserId(uid);
            refreshUser(uid);
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                userId,
                loading,
                login,
                logout,
                refreshUser,
                company,
                companiesData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
