"use client";

import React, { useState } from "react";
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
import { ChevronDown } from "lucide-react";
import { useSidebar } from "@/context/layout/SideBarContext";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/context/theme/themeContext";

const Sidebar = ({ isOpen, onClose }: any) => {
    const { currentSection, menuData } = useSidebar();
    const router = useRouter();
    const pathname = usePathname();
    const { theme ,mode } = useTheme();
    const [expandedNode, setExpandedNode] = useState<string | null>(null);
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);

    const sectionData = menuData[currentSection] || {};

    const Content = (
        <Box
            w="260px"
            p={4}
            bg={theme.colors.accient}   // ✅ FIXED
            color={theme.colors.whiteColor}
            h="100%"
            borderRight="1px solid"
            borderColor="gray.200"
        >
            <VStack align="stretch" gap={2}>
                {Object.entries(sectionData).map(([group, groupData]: any) => {
                    const GroupIcon = groupData.icon;
                    const isGroupActive = (groupItems: any[]) =>
                    groupItems.some((item) => pathname === item.route);

                    return (
                        <Collapsible.Root
                            key={group}
                            open={expandedNode === group}
                            onOpenChange={() =>
                                setExpandedNode((prev) => (prev === group ? null : group))
                            }
                        >
                            {/* ===== GROUP HEADER (WITH ICON) ===== */}
                            <Collapsible.Trigger asChild>
                                <HStack
                                    px={3}
                                    py={2}
                                    cursor="pointer"
                                    borderRadius="lg"
                                    justify="space-between"
                                    bg={
                                        isGroupActive(groupData.items) || expandedNode === group
                                            ? "orange.50"
                                            : "transparent"
                                    }
                                    color={
                                        isGroupActive(groupData.items) || expandedNode === group
                                            ? "orange.700"
                                            : mode === "light" ? "grey:600":"gray.100"
                                    }
                                    _hover={{
                                        bg: "gray.200",
                                        color: "#444",
                                    }}
                                    transition="all 0.2s ease"
                                >
                                    <HStack gap={2} >
                                        <Icon
                                            as={GroupIcon}
                                            boxSize={4}
                                            color={
                                                isGroupActive(groupData.items) || expandedNode === group
                                                    ? "orange.600"
                                                    : "white.900"
                                            }
                                            

                                        />
                                        <Text fontWeight="600" fontSize="sm" >
                                            {group}
                                        </Text>
                                    </HStack>

                                    <Icon
                                        as={ChevronDown}
                                        boxSize={4}
                                        transform={
                                            expandedNode === group ? "rotate(360deg)" : "rotate(270deg)"
                                        }
                                        transition="0.2s"
                                    />
                                </HStack>
                            </Collapsible.Trigger>

                            {/* ===== ITEMS ===== */}
                            <Collapsible.Content>
                                <VStack align="stretch" pl={4} pt={2} gap={1}>
                                    {groupData.items.map((item: any) => {
                                        const isActive = pathname === item.route;
                                        const ItemIcon = item.icon;

                                        return (
                                            <HStack
                                                key={item.route}
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
                                            >
                                                <Icon
                                                    as={ItemIcon}
                                                    boxSize={4}
                                                    color={isActive ? "blue.600" : "white.900"}
                                                />
                                                <Text
                                                    fontSize="sm"
                                                    fontWeight={isActive ? 600 : 400}
                                                    color={isActive ? "#222" : undefined}
                                                >
                                                    {item.label}
                                                </Text>
                                            </HStack>
                                        );
                                    })}
                                </VStack>
                            </Collapsible.Content>
                        </Collapsible.Root>
                    );
                })}
            </VStack>
        </Box>
    );

    return isDesktop ? (
        <Box position="fixed" left={0} h="100%">
            {Content}
        </Box>
    ) : (
        <Drawer.Root open={isOpen} onOpenChange={onClose}>
            <Drawer.Backdrop />
            <Drawer.Positioner>
                <Drawer.Content>
                    <Drawer.Body>{Content}</Drawer.Body>
                </Drawer.Content>
            </Drawer.Positioner>
        </Drawer.Root>
    );
};

export default Sidebar;
