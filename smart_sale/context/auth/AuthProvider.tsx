"use client";

import React, { useEffect, useState } from "react";
import { AuthContext, AuthUser } from "./AuthContext";
import { authService } from "@/service/AuthService";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user after token exists
    const refreshUser = async () => {
        if (!token) return;

        setLoading(true);
        const res = await authService.me();

        if (res.success) {
            setUser(res.data);
        } else {
            setUser(null);
            localStorage.removeItem("token");
        }

        setLoading(false);
    };

    // When user logs in
    const login = async (newToken: string) => {
   
        setUser({ token: newToken } as unknown as AuthUser);
        localStorage.setItem("token", newToken);
        setToken(newToken);
        await refreshUser();
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
        if (token) refreshUser();
        else setLoading(false);
    }, [token]);

    return (
        <AuthContext.Provider
            value={{ user, token, loading, login, logout, refreshUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}
