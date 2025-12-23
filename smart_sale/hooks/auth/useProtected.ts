"use client";

import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const useProtected = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ["/login"];

    useEffect(() => {
     

        // ⛔ Don't redirect while loading
        if (loading) return;

        // ✅ Allow public routes
        if (pathname && publicRoutes.includes(pathname)) {
            return;
        }

        // 🔄 Redirect unauthenticated users
        if (!user) {
            console.warn("🚫 No user detected — redirecting to /login");
            router.replace("/login"); // replace prevents back-navigation
        }
    }, [loading, user, pathname, router]);

    return { user, loading };
};

export default useProtected;
