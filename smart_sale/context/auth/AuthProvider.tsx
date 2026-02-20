"use client";

import React, { useEffect, useState } from "react";
import { AuthContext, AuthUser } from "./AuthContext";
import { authService, LoginPayload, ApiResponse as AuthApiResponse } from "@/service/AuthService";
import { CompanyService, Company, ApiResponse } from "@/service/CompanyService";
import { getStorage, removeStorage, setStorage } from "@/utils/storage/storage";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [companiesData, setCompaniesData] = useState<Company[]>([]);

    // 🔄 fetch user
    const refreshUser = async (uid: number) => {
        setLoading(true);
        const res = await authService.me(uid);
        console.log(res, 'fetching user data')

        if (res.success) {
            setUser(res.data);
        }
        //  else {
        //     logout();
        // }
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
    const login = async (payload: LoginPayload) => {
        setLoading(true);
        
        const res = await authService.login(payload);
        console.log("Login result", res);

        // ❌ LOGIN FAILED
        if (res.status !== "success" || !res.data) {
            setLoading(false);
            return {
                success: false,
                message: res.message,
            };
        }

        // ✅ SAFE ACCESS
        const userId = res.data.USERID;
        const isAdmin = res.data.ISADMIN;

        setStorage("userId", String(userId));
        setStorage("admin" ,isAdmin)
        setUserId(userId);

        await refreshUser(userId);

        setLoading(false);
        return {
            success: true,
            message: res.message,
        };
    };



    // 🚪 LOGOUT
    const logout = () => {
        setUser(null);
        setUserId(null);
        removeStorage("userId");
        removeStorage("admin");
        window.location.href = "/login";
    };

    // ♻ restore session
    useEffect(() => {
        const storedUserId = getStorage("userId");
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
