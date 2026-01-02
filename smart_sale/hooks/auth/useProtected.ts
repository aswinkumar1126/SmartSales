"use client";

import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const normalizePath = (path?: string) =>
    path?.replace(/\/$/, "") || "";

const useProtected = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ["/login"];

    useEffect(() => {
        if (loading) return;

        const cleanPath = normalizePath(pathname);

        //✅ Allow public routes
        if (publicRoutes.includes(cleanPath)) return;

        // 🔄 Redirect unauthenticated users
        if (!user) {
            router.replace("/login/");
        }
    }, [loading, user, pathname, router]);

    return { user, loading };
};

export default useProtected;



