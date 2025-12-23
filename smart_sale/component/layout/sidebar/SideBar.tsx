"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    VStack,
    Text,
    Collapsible,
    Drawer,
    HStack,
    Icon,
    useMediaQuery,
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";
import { useSidebar } from "@/context/layout/SideBarContext";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/context/theme/themeContext";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const {
        currentSection,
        menuData,
        sidebarConfig,
        sidebarCollapsed,
        toggleSidebar
    } = useSidebar();

    const router = useRouter();
    const pathname = usePathname();
    const { theme, mode } = useTheme();
    const [expandedNode, setExpandedNode] = useState<string | null>(null);
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);
    const [isHovered, setIsHovered] = useState(false);

    const sectionData = menuData[currentSection] || {};
    const { collapsedWidth, expandedWidth } = sidebarConfig;

    const getSidebarWidth = () => {
        if (!isDesktop) return expandedWidth;
        if (sidebarCollapsed && !isHovered) return collapsedWidth;
        return expandedWidth;
    };

    const isSidebarExpanded = () => {
        if (!isDesktop) return true;
        return !sidebarCollapsed || isHovered;
    };

    const Content = (
        <Box
            role="group"
            w={getSidebarWidth()}
            onMouseEnter={() => isDesktop && setIsHovered(true)}
            onMouseLeave={() => isDesktop && setIsHovered(false)}
            transition="width 0.25s ease"
            bg={theme.colors.accient}
            color={theme.colors.whiteColor}
            h="100%"
            borderRight="1px solid"
            borderColor="gray.200"
            overflow="hidden"
            position="relative"
        >
            {/* Collapse/Expand Toggle Button */}
            {isDesktop && (
                <Box
                    position="absolute"
                    top="5px"
                    right="5px"
                    zIndex={10}
                    bg={theme.colors.accient}
                    border="2px solid"
                    borderColor="gray.200"
                    borderRadius="full"
                    p={1}
                    cursor="pointer"
                    onClick={toggleSidebar}
                    _hover={{
                        bg: theme.colors.accient,
                        transform: "scale(1.1)",
                        boxShadow: "0 0 10px rgba(0,0,0,0.2)"
                    }}
                    transition="all 0.2s"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxSize="24px"
                >
                    <Icon
                        as={sidebarCollapsed ? ChevronsRight : ChevronsLeft}
                        boxSize={4}
                        color="white"
                        transition="transform 0.2s"
                        _hover={{ transform: sidebarCollapsed ? "translateX(2px)" : "translateX(-2px)" }}
                    />
                </Box>
            )}

            <VStack align="stretch" gap={2} p={3} pt="40px">
                {Object.entries(sectionData).map(([group, groupData]: any) => {
                    const GroupIcon = groupData.icon;
                    const isGroupActive = (groupItems: any[]) =>
                        groupItems.some((item) => pathname === item.route);

                    const showFullContent = isSidebarExpanded();

                    return (
                        <Collapsible.Root
                            key={group}
                            open={expandedNode === group && showFullContent}
                            onOpenChange={() =>
                                setExpandedNode((prev) => (prev === group ? null : group))
                            }
                        >
                            {/* ===== GROUP HEADER (WITH ICON) ===== */}
                            <Collapsible.Trigger asChild>
                                <Box>
                                    <Tooltip
                                        content={group}
                                      
                                        disabled={showFullContent}
                                        showArrow
                                    >
                                        <HStack
                                            px={3}
                                            py={2}
                                            cursor="pointer"
                                            borderRadius="lg"
                                            justify={showFullContent ? "space-between" : "center"}
                                            bg={
                                                isGroupActive(groupData.items) || expandedNode === group
                                                    ? "orange.50"
                                                    : "transparent"
                                            }
                                            color={
                                                isGroupActive(groupData.items) || expandedNode === group
                                                    ? "orange.700"
                                                    : mode === "light" ? "grey.600" : "gray.100"
                                            }
                                            _hover={{
                                                bg: "gray.200",
                                                color: "#444",
                                            }}
                                            transition="all 0.2s ease"
                                        >
                                            <HStack gap={2} w={showFullContent ? "auto" : "100%"} justify="center">
                                                <Icon
                                                    as={GroupIcon}
                                                    boxSize={4}
                                                    color={
                                                        isGroupActive(groupData.items) || expandedNode === group
                                                            ? "orange.600"
                                                            : "white.900"
                                                    }
                                                />
                                                {showFullContent && (
                                                    <Text fontWeight="600" fontSize="sm">
                                                        {group}
                                                    </Text>
                                                )}
                                            </HStack>

                                            {showFullContent && (
                                                <Icon
                                                    as={ChevronDown}
                                                    boxSize={4}
                                                    transform={
                                                        expandedNode === group ? "rotate(0deg)" : "rotate(-90deg)"
                                                    }
                                                    transition="0.2s"
                                                />
                                            )}
                                        </HStack>
                                    </Tooltip>
                                </Box>
                            </Collapsible.Trigger>

                            {/* ===== ITEMS ===== */}
                            {showFullContent && (
                                <Collapsible.Content>
                                    <VStack align="stretch" pl={4} pt={2} gap={1}>
                                        {groupData.items.map((item: any) => {
                                            const isActive = pathname === item.route;
                                            const ItemIcon = item.icon;

                                            return (
                                                <Tooltip
                                                    key={item.route}
                                                    content={item.label}
                                          
                                                    disabled={showFullContent}
                                                    showArrow
                                                >
                                                    <HStack
                                                        px={3}
                                                        py={2}
                                                        gap={3}
                                                        cursor="pointer"
                                                        borderRadius="20px"
                                                        bg={isActive ? "orange.50" : "transparent"}
                                                        border="1px solid"
                                                        borderColor={isActive ? "red.400" : "transparent"}
                                                        _hover={{ bg: "orange.50", color: "#444" }}
                                                        transition="all 0.2s ease"
                                                        onClick={() => {
                                                            router.push(item.route);
                                                            if (!isDesktop) onClose();
                                                        }}
                                                        justifyContent={showFullContent ? "flex-start" : "center"}
                                                    >
                                                        <Icon
                                                            as={ItemIcon}
                                                            boxSize={4}
                                                            color={isActive ? "blue.600" : "white.900"}
                                                        />
                                                        {showFullContent && (
                                                            <Text
                                                                fontSize="sm"
                                                                fontWeight={isActive ? 600 : 400}
                                                                color={isActive ? "#222" : undefined}
                                                                whiteSpace="nowrap"
                                                                overflow="hidden"
                                                                textOverflow="ellipsis"
                                                            >
                                                                {item.label}
                                                            </Text>
                                                        )}
                                                    </HStack>
                                                </Tooltip>
                                            );
                                        })}
                                    </VStack>
                                </Collapsible.Content>
                            )}
                        </Collapsible.Root>
                    );
                })}
            </VStack>
        </Box>
    );

    if (!isDesktop) {
        return (
            <Drawer.Root open={isOpen} onOpenChange={onClose}>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Body>{Content}</Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>
        );
    }

    return (
        <Box
            position="fixed"
            left={0}
            h="100%"
            zIndex={10}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {Content}
        </Box>
    );
};

export default Sidebar;