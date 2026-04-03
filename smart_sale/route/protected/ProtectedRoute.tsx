// hooks/ProtectedRoute.tsx
"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Loader from "@/component/loader/Loader";

const normalizePath = (path?: string) => path?.replace(/\/$/, "") || "";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ["/login"];

    useEffect(() => {
        // Don't do anything while loading
        if (loading) return;

        const cleanPath = normalizePath(pathname);

        // Check if current path is public
        const isPublicRoute = publicRoutes.includes(cleanPath);

        // If not authenticated and trying to access protected route
        if (!user && !isPublicRoute) {
            console.log("Unauthorized access to:", cleanPath);
            router.replace("/login");
            return;
        }

        // If authenticated and trying to access login page
        if (user && isPublicRoute) {
            router.replace("/");
            return;
        }
    }, [loading, user, pathname, router]); // ✅ pathname is in dependencies - runs on every route change

    // Show loading while checking auth
    if (loading) {
        return <div>
            <Loader isLoading fullscreen/>
        </div>;
    }

    // For public routes, always render
    if (publicRoutes.includes(normalizePath(pathname))) {
        return <>{children}</>;
    }

    // For protected routes, only render if authenticated
    return user ? <>{children}</> : null;
};

export default ProtectedRoute;