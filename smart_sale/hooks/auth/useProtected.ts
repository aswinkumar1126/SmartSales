"use client";

import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const useProtected = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ["/login"]; // Add more public routes if needed

    useEffect(() => {
        // Skip redirect if route is public
     
       if (!loading && !user && pathname && !publicRoutes.includes(pathname)) {
            router.push("/login");
        } 
    }, [loading, user, pathname]);

    return { user, loading };
};

export default useProtected;
