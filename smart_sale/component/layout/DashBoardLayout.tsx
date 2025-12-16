"use client";

import { useState } from "react";
import { Box } from "@chakra-ui/react";
import Header from "./header/Header";
import Sidebar from "./sidebar/SideBar";
import { useMediaQuery } from "@chakra-ui/react";
import { usePathname } from "next/navigation";

const noLayoutRoutes = ["/login"]
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {


    const [isOpen, setIsOpen] = useState(false);
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);

    const pathname = usePathname();
    const noLayout = pathname ? noLayoutRoutes.includes(pathname) : false;

    if (noLayout) return children;

    return (
        <Box >
            <Header onOpenMenu={() => setIsOpen(true)} />

            <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

            <Box
                ml={isDesktop ? "250px" : "0"}
                p={4}
                bg="#FBFBFB"

            >
                {children}
            </Box>
        </Box>
    );
};
export default DashboardLayout;
