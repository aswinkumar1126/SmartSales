"use client";

import { useState } from "react";
import { Box } from "@chakra-ui/react";
import Header from "./header/Header";
import Sidebar from "./sidebar/SideBar";
import { useMediaQuery } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/theme/themeContext";
import { useSidebar } from "@/context/layout/SideBarContext";

const noLayoutRoutes = ["/login"];


const normalizePath = (path?: string) =>
    path?.replace(/\/$/, "") || "";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const { theme } = useTheme();
    const { sidebarConfig, sidebarCollapsed } = useSidebar();
    const [isOpen, setIsOpen] = useState(false);
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);

    let pathname = usePathname();
    pathname = normalizePath(pathname);
    const noLayout = pathname ? noLayoutRoutes.includes(pathname) : false;

    if (noLayout) return children;

    // Calculate the margin-left based on sidebar state
    const getMainContentMargin = () => {
        if (!isDesktop) return "0";
        // When sidebar is collapsed, use collapsed width
        // When sidebar is expanded, use expanded width
        return sidebarCollapsed ? sidebarConfig.collapsedWidth : sidebarConfig.expandedWidth;
    };

    return (
        <Box>
            <Header onOpenMenu={() => setIsOpen(true)} />
            <Sidebar
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}

            />

            
            {/* Main content area */}
            <Box
                ml={getMainContentMargin()}
                transition="margin-left 0.25s ease"
                p={2}
                bg={theme.colors.primary}
            >
                {children}
            </Box>
        </Box>
    );
};

export default DashboardLayout;