"use client";

import React, { useEffect, useState } from "react";
import { AuthContext, AuthUser } from "./AuthContext";
import { authService, LoginPayload } from "@/service/AuthService";
import { CompanyService , Company } from "@/service/CompanyService";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [companiesData, setCompaniesData] = useState<Company[]>([]);
    const [useUserId ,setUseUserId]  = useState();

    // Fetch user after token exists
    const refreshUser = async (uid: number) => {
        if (!token) return;

        setLoading(true);
        const res = await authService.me(uid);

        if (res.success) {
            setUser(res.data);
        } else {
            setUser(null);
            localStorage.removeItem("token");
        }

        setLoading(false);
    };
    const company = async () => {
        setLoading(true);
        try {
            const res = await CompanyService.getAll();
            setCompaniesData(res.data || []);
        } catch (e) {
            console.error("Company fetch failed", e);
            setCompaniesData([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ AUTO CALL ON MOUNT
    useEffect(() => {
        company();
    }, []);
    // When user logs in
    const login = async (payload: LoginPayload) => {
        setLoading(true);

        const res = await authService.login(payload);
        console.log("Login service result 👉", res);

        if (!res.success || !res.data) {
            setLoading(false);
            return;
        }

        const { userId, token } = res.data;

        // 🔐 Save session
        localStorage.setItem("token", token);
        localStorage.setItem("userId", String(userId));

        setToken(token);
        setUseUserId(userId);

        // 👤 Load user + company
        await refreshUser(userId);

        setLoading(false);
    };


    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    // Load token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) setToken(storedToken);
    }, []);

    // Fetch user when token loads
    useEffect(() => {
        if (token) {
            const storedUserId = localStorage.getItem("userId");
            if (storedUserId) {
                refreshUser(Number(storedUserId));
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [token]);

    return (
        <AuthContext.Provider
            value={{ user, token, loading, login, logout, refreshUser, company, companiesData }}
        >
            {children}
        </AuthContext.Provider>
    );
}
