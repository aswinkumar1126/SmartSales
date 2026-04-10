// hooks/useRouteGuard.ts
"use client";

import { useAuth } from "./useAuth";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useRouteGuard(publicRoutes: string[] = ["/login"]) {
    const { user, loading, } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const previousPathname = useRef(pathname);

    useEffect(() => {
        // Check if pathname changed
        if (previousPathname.current !== pathname) {
            console.log("Route changed from", previousPathname.current, "to", pathname);
            previousPathname.current = pathname;

           
        }
    }, [pathname, loading]);

    useEffect(() => {
        if (loading) return;

        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

        console.log("Auth check on:", pathname, "User:", !!user, "Public:", isPublicRoute);

        if (!user && !isPublicRoute) {
            console.log("Redirecting to login from:", pathname);
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        if (user && isPublicRoute && pathname !== "/login") {
            router.replace("/dashboard");
            return;
        }
    }, [loading, user, pathname, router, publicRoutes]);

    return { user, loading };
}