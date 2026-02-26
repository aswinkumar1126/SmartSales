"use client";

import { Box, HStack, Button, IconButton, Group, Text, Icon } from "@chakra-ui/react";
import { FiMenu, FiEye, FiEyeOff, FiSun, FiMoon } from "react-icons/fi";
import { useMediaQuery } from "@chakra-ui/react";
import { useSidebar } from "@/context/layout/SideBarContext";
import { useTheme } from "@/context/theme/themeContext";
import { Tooltip } from "@/components/ui/tooltip";
import {
    ChevronsLeft,
    ChevronsRight,
    Menu,
    X,
} from "lucide-react";

const Header = ({ onOpenMenu }: any) => {
    const { theme, mode, toggleTheme } = useTheme();
    const {
        sidebarCollapsed,
        toggleSidebar
    } = useSidebar();

    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);
    const now = new Date();

    const formatDate = (date: Date) => {
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yyyy = date.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    };

    const timeNow = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    return (
        <Box
            bg={theme.colors.accient}
            borderBottom="1px solid"
            borderColor="gray.200"
            color={theme.colors.whiteColor}
            p={2}
            position="sticky"
            top="0"
            zIndex={20}
            width="100%"
        >
            <Box
                display="flex"
                flexDirection={{ base: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems="center"
                gap={2}
            >
                {/* Left section with sidebar controls */}
                <HStack width={{ base: "100%", sm: "auto" }} justify="space-between">
                    <HStack>
                        {/* Mobile menu button */}
                        {!isDesktop && (
                            <Tooltip content="Open Menu" showArrow>
                                <IconButton
                                    aria-label="Open menu"
                                    variant="ghost"
                                    onClick={onOpenMenu}
                                    color="inherit"
                                    _hover={{
                                        bg: "gray.100",
                                        color: "#222",
                                    }}
                                    size="sm"
                                >
                                    <Menu size={18} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {isDesktop && (
                            <Text
                                fontSize="md"
                                fontWeight="600"
                                cursor="pointer"
                                onClick={onOpenMenu}
                             
                            >
                                Dashboard
                            </Text>
                        )}

                        {/* Desktop sidebar toggle */}
                        {isDesktop && (


                            <Tooltip content={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} showArrow>
                                <IconButton
                                    aria-label={sidebarCollapsed ? "Expand" : "Collapse"}
                                    variant="ghost"
                                    onClick={toggleSidebar}
                                    color="inherit"
                                    _hover={{
                                        bg: "gray.100",
                                        color: "#222",
                                    }}
                                    size="sm"
                                >
                                    {sidebarCollapsed ? <Menu size={18} /> : <X size={18} />}
                                </IconButton>
                            </Tooltip>
                        )}
                    </HStack>

                   
                </HStack>

                {/* Right section with theme toggle */}
                <HStack
                    width={{ base: "100%", sm: "auto" }}
                    justify={{ base: "flex-end", sm: "flex-start" }}
                >
                    {/* Date and Time - visible on all screens */}
                    <HStack
                        display="flex"
                        flexDirection="row"
                        gap={2}
                        bg="gray.100"
                        px={3}
                        py={1}
                        borderRadius="full"
                    >
                        <Text fontSize="xs" fontWeight="bold" color="gray.700">
                            📅 {formatDate(now)}
                        </Text>
                        <Text fontSize="xs" fontWeight="bold" color="gray.700">
                            ⏰ {timeNow}
                        </Text>
                    </HStack>
                    <Tooltip content={mode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"} showArrow>
                        <IconButton
                            aria-label="Toggle theme"
                            variant="ghost"
                            onClick={toggleTheme}
                            color="inherit"
                            _hover={{
                                bg: "gray.100",
                                color: "#222",
                            }}
                            size="sm"
                        >
                            {mode === "light" ? <FiMoon size={16} /> : <FiSun size={16} />}
                        </IconButton>
                    </Tooltip>
                </HStack>
            </Box>
        </Box>
    );
};

export default Header;