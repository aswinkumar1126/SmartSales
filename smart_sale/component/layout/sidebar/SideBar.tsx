"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Box,
    VStack,
    Text,
    Drawer,
    HStack,
    Icon,
    useMediaQuery,
    Badge,
    Separator,
    Kbd,
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import {
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    LayoutDashboard,
    Settings,
    Users,
    HelpCircle,
    UserCircle,
    Search,
    X,
} from "lucide-react";
import { useSidebar } from "@/context/layout/SideBarContext";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/context/theme/themeContext";
import { normalizePath } from "@/utils/path/normalizePath";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MenuItem {
    label: string;
    route: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
}

interface MenuGroup {
    icon: any;
    items: MenuItem[];
}

type SectionData = Record<string, MenuGroup>;

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);
const MotionHStack = motion(HStack);

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const {
        menuData,
        sidebarConfig,
        sidebarCollapsed,
        toggleSidebar
    } = useSidebar();

    const router = useRouter();
    let pathname = usePathname();
    pathname = normalizePath(pathname);

    const { theme, mode } = useTheme();

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);
    const [isHovered, setIsHovered] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    const { collapsedWidth, expandedWidth } = sidebarConfig;

    // Memoized values
    const sidebarWidth = useMemo(() => {
        if (!isDesktop) return expandedWidth;
        if (sidebarCollapsed && !isHovered) return collapsedWidth;
        return expandedWidth;
    }, [isDesktop, sidebarCollapsed, isHovered, collapsedWidth, expandedWidth]);

    const isExpanded = useMemo(() => {
        if (!isDesktop) return true;
        return !sidebarCollapsed || isHovered;
    }, [isDesktop, sidebarCollapsed, isHovered]);

    // Toggle section
    const toggleSection = useCallback((section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    // Toggle group
    const toggleGroup = useCallback((group: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    }, []);

    // Check if any item in a group is active
    const isGroupActive = useCallback((items: MenuItem[]): boolean => {
        return items.some(item => item.route === pathname);
    }, [pathname]);

    // Get active item count in group
    const getActiveCount = useCallback((items: MenuItem[]): number => {
        return items.filter(item => item.route === pathname).length;
    }, [pathname]);

    // Filter menu items based on search
    const filterMenuItems = useCallback((items: MenuItem[], query: string): MenuItem[] => {
        if (!query) return items;
        return items.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase())
        );
    }, []);

    // Filter menu data based on search
    const filteredMenuData = useMemo(() => {
        if (!searchQuery) return menuData;

        const filtered: typeof menuData = {};

        Object.entries(menuData).forEach(([sectionName, sectionGroups]) => {
            const filteredSection: SectionData = {};

            Object.entries(sectionGroups).forEach(([groupName, groupData]) => {
                const filteredItems = filterMenuItems(groupData.items, searchQuery);
                if (filteredItems.length > 0) {
                    filteredSection[groupName] = {
                        ...groupData,
                        items: filteredItems
                    };
                }
            });

            if (Object.keys(filteredSection).length > 0) {
                filtered[sectionName] = filteredSection;
            }
        });

        return filtered;
    }, [menuData, searchQuery, filterMenuItems]);

    // Render menu item
    const renderMenuItem = useCallback((item: MenuItem) => {
        const isActive = pathname === item.route;
        const ItemIcon = item.icon;

        return (
            <Tooltip
                key={item.route}
                content={item.label}
                disabled={isExpanded}
                showArrow
                positioning={{ placement: "right" }}
            >
                <MotionHStack
                    px={3}
                    py={2.5}
                    gap={3}
                    cursor="pointer"
                    borderRadius="lg"
                    bg={isActive ? `${theme.colors.primary}15` : "transparent"}
                    borderLeft="3px solid"
                    borderLeftColor={isActive ? theme.colors.primary : "transparent"}
                    _hover={{
                        bg: isActive ? `${theme.colors.primary}20` : "gray.100",
                    }}
                    onClick={() => {
                        router.push(item.route);
                        if (!isDesktop) onClose();
                    }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    justifyContent={isExpanded ? "flex-start" : "center"}
                    position="relative"
                    width="100%"
                    color={isActive ? theme.colors.primary : "gray.500"}
                >
                    <Box position="relative">
                        <Icon
                            as={ItemIcon}
                            boxSize={4}
                           
                        />
                        {item.badge && !isExpanded && (
                            <Badge
                                position="absolute"
                                top="-2"
                                right="-2"
                                bg={item.badgeColor || "red.500"}
                              
                                fontSize="2xs"
                                boxSize={3}
                                borderRadius="full"
                                p={0}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {item.badge}
                            </Badge>
                        )}
                    </Box>

                    {isExpanded && (
                        <>
                            <Text
                                fontSize="sm"
                                fontWeight={isActive ? 600 : 400}
                          
                                flex={1}
                             
                            >
                                {item.label}
                            </Text>

                            {item.badge && (
                                <Badge
                                    bg={item.badgeColor || "red.500"}
                              
                                    fontSize="2xs"
                                    borderRadius="full"
                                    px={1.5}
                                    py={0.5}
                                >
                                    {item.badge}
                                </Badge>
                            )}
                        </>
                    )}
                </MotionHStack>
            </Tooltip>
        );
    }, [pathname, isExpanded, router, isDesktop, onClose, theme.colors.primary]);

    // Sidebar content
    const Content = (
        <MotionBox
            role="group"
            w={sidebarWidth}
            onMouseEnter={() => isDesktop && setIsHovered(true)}
            onMouseLeave={() => isDesktop && setIsHovered(false)}
            // transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            bg={theme.colors.sideBar}
            color={theme.colors.whiteColor}
            h="100%"
            borderRight="1px solid"
            borderColor="gray.200"
            overflow="hidden"
            position="relative"
            boxShadow="2px 0 8px rgba(0,0,0,0.05)"
            initial={false}
            animate={{ width: sidebarWidth }}
            
        >
            {/* Header with logo and toggle */}
            <Box
                position="relative"
                borderBottom="1px solid"
                borderColor="gray.200"
                bg={theme.colors.sideBar}
                backdropFilter="blur(8px)"
                zIndex={2}
            >
                <HStack
                    h="64px"
                    px={4}
                    justify={isExpanded ? "space-between" : "center"}
                    gap={2}
                >
                    {isExpanded ? (
                        <>
                            <HStack gap={2}>
                                <Icon
                                    as={LayoutDashboard}
                                    boxSize={5}
                                    color={theme.colors.primary}
                                />
                                <Text
                                    fontSize="base"
                                    fontWeight="semibold"
                                    color={theme.colors.whiteColor}
                                    letterSpacing="tight"
                                >
                                    Dashboard
                                </Text>
                            </HStack>

                            <HStack gap={1}>
                                {/* <Tooltip content="Search (Ctrl+K)" showArrow> */}
                                    <Box
                                        p={1.5}
                                        borderRadius="md"
                                        cursor="pointer"
                                        onClick={() => setShowSearch(!showSearch)}
                                        
                                    >
                                        <Icon as={Search} boxSize={4} color="gray.100" />
                                    </Box>
                                {/* </Tooltip> */}

                                {isDesktop && (
                                    <Tooltip content={sidebarCollapsed ? "Expand" : "Collapse"} showArrow>
                                        <Box
                                            p={1.5}
                                            borderRadius="md"
                                            cursor="pointer"
                                            onClick={toggleSidebar}
                                        >
                                            <Icon
                                                as={sidebarCollapsed ? ChevronsRight : ChevronsLeft}
                                                boxSize={4}
                                                color="gray.100"
                                            />
                                        </Box>
                                    </Tooltip>
                                )}
                            </HStack>
                        </>
                    ) : (
                        <Icon
                            as={LayoutDashboard}
                            boxSize={5}
                            color={theme.colors.primary}
                        />
                    )}
                </HStack>

                {/* Search bar */}
                <AnimatePresence>
                    {showSearch && isExpanded && (
                        <MotionBox
                            px={3}
                            pb={3}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Box
                                position="relative"
                                bg="gray.100"
                                borderRadius="lg"
                                overflow="hidden"
                            >
                                <Icon
                                    as={Search}
                                    position="absolute"
                                    left={3}
                                    top="50%"
                                    transform="translateY(-50%)"
                                    boxSize={4}
                                    color="gray.400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px 8px 36px",
                                        background: "transparent",
                                        border: "none",
                                        outline: "none",
                                        fontSize: "14px",
                                        color: theme.colors.primaryText,

                                    }}
                                />
                                {searchQuery && (
                                    <Icon
                                        as={X}
                                        position="absolute"
                                        right={3}
                                        top="50%"
                                        transform="translateY(-50%)"
                                        boxSize={4}
                                        color="gray.400"
                                        cursor="pointer"
                                        onClick={() => setSearchQuery("")}
                                    />
                                )}
                            </Box>
                            
                        </MotionBox>
                    )}
                </AnimatePresence>
            </Box>

            {/* Menu items with scroll */}
            <Box
                h="calc(100% - 64px)"
                overflowY="auto"
                overflowX="hidden"
                css={{
                    "&::-webkit-scrollbar": {
                        width: "4px",
                    },
                    "&::-webkit-scrollbar-track": {
                        background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: "gray.300",
                        borderRadius: "4px",
                    },
                }}
            >
                <VStack align="stretch" gap={2} p={3}>
                    {Object.entries(filteredMenuData).length > 0 ? (
                        Object.entries(filteredMenuData).map(([sectionName, sectionGroups]) => {
                            const isSectionExpanded = expandedSections[sectionName];

                            return (
                                <Box key={sectionName} width="100%">
                                    {/* Section Header */}
                                    {isExpanded && (
                                        <HStack
                                            px={3}
                                            py={2}
                                            cursor="pointer"
                                            borderRadius="lg"
                                            justify="space-between"
                                            color={theme.colors.sideBarFont}
                                            _hover={{ bg: "gray.100" ,color:theme.colors.primaryText }}
                                            onClick={() => toggleSection(sectionName)}
                                           
                                        >
                                            <Text
                                                fontSize="xs"
                                                fontWeight="600"
                                            
                                                textTransform="uppercase"
                                                letterSpacing="wider"
                                            >
                                                {sectionName}
                                            </Text>
                                            <Icon
                                                as={ChevronDown}
                                                boxSize={3}
                                                color="gray.400"
                                                transform={isSectionExpanded ? "rotate(0deg)" : "rotate(-90deg)"}
                                                transition="transform 0.2s"
                                            />
                                        </HStack>
                                    )}

                                    {/* Groups */}
                                    {(isExpanded ? isSectionExpanded : true) && (
                                        <VStack align="stretch" gap={1} mt={1}>
                                            {Object.entries(sectionGroups).map(([groupName, groupData]) => {
                                                const GroupIcon = groupData.icon;
                                                const groupKey = `${sectionName}-${groupName}`;
                                                const isGroupExpanded = expandedGroups[groupKey];
                                                const activeCount = getActiveCount(groupData.items);

                                                return (
                                                    <Box key={groupName} width="100%">
                                                        {/* Group Header */}
                                                        <Tooltip
                                                            content={groupName}
                                                            disabled={isExpanded}
                                                            showArrow
                                                            positioning={{ placement: "right" }}
                                                        >
                                                            <MotionHStack
                                                                px={3}
                                                                py={2.5}
                                                                cursor="pointer"
                                                                borderRadius="lg"
                                                                justify={isExpanded ? "space-between" : "center"}
                                                                bg={isGroupActive(groupData.items as MenuItem[]) ? `${theme.colors.primary}10` : "transparent"}
                                                                color={isGroupActive(groupData.items as MenuItem[]) ? theme.colors.primary : "gray.500"}
                                                                 _hover={{ bg: 'gray.100', color: theme.colors.primaryText }}
                                                                onClick={() => isExpanded && toggleGroup(groupKey)}
                                                                whileHover={{ x: 2 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                width="100%"
                                                            >
                                                                <HStack gap={2} w={isExpanded ? "auto" : "100%"} justify="center" >
                                                                    <Box position="relative">
                                                                        <Icon
                                                                            as={GroupIcon as React.ElementType}
                                                                            boxSize={4.5}
                                                                         

                                                                        />
                                                                        {activeCount > 0 && !isExpanded && (
                                                                            <Badge
                                                                                position="absolute"
                                                                                top="-2"
                                                                                right="-2"
                                                                                color="white"
                                                                                fontSize="2xs"
                                                                                boxSize={3}
                                                                                borderRadius="full"
                                                                                p={0}
                                                                            />
                                                                        )}
                                                                    </Box>

                                                                    {isExpanded && (
                                                                        <>
                                                                            <Text
                                                                                fontWeight="600"
                                                                                fontSize="sm"
                                                                                flex={1}
                                                                            >
                                                                                {groupName}
                                                                            </Text>

                                                                            {activeCount > 0 && (
                                                                                <Badge
                                                                                    fontSize="2xs"
                                                                                    borderRadius="full"
                                                                                    px={1.5}
                                                                                    py={0.5}
                                                                                    bg={theme.colors.sideBarFont}
                                                                                >
                                                                                    {activeCount}
                                                                                </Badge>
                                                                            )}

                                                                            <Icon
                                                                                as={ChevronDown}
                                                                                boxSize={3.5}
                                                                                transform={isGroupExpanded ? "rotate(0deg)" : "rotate(-90deg)"}
                                                                                transition="transform 0.2s"
                                                                            />
                                                                        </>
                                                                    )}
                                                                </HStack>
                                                            </MotionHStack>
                                                        </Tooltip>

                                                        {/* Group Items */}
                                                        {isExpanded && isGroupExpanded && (
                                                            <MotionVStack
                                                                align="stretch"
                                                                pl={4}
                                                                mt={1}
                                                                gap={1}
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                {groupData.items.map(item => renderMenuItem(item))}
                                                            </MotionVStack>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </VStack>
                                    )}
                                </Box>
                            );
                        })
                    ) : (
                        <VStack py={8} gap={3}>
                            <Icon as={Search} boxSize={8} color="gray.300" />
                            <Text color="gray.400" fontSize="sm">
                                No menu items found
                            </Text>
                        </VStack>
                    )}

                    {/* Divider */}
                    <Separator my={2} borderColor="gray.200" />

                    {/* Bottom menu items */}
                    <VStack align="stretch" gap={1}>
                        <Tooltip content="Help & Support" disabled={isExpanded} showArrow>
                            <MotionHStack
                                px={3}
                                py={2.5}
                                gap={3}
                                cursor="pointer"
                                borderRadius="lg"
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                justify={isExpanded ? "flex-start" : "center"}
                                width="100%"
                                color={theme.colors.sideBarFont}
                                _hover={{ bg: "gray.100", color: theme.colors.primaryText }}
                            >
                                <Icon as={HelpCircle} boxSize={4} />
                                {isExpanded && (
                                    <Text fontSize="sm">Help & Support</Text>
                                )}
                            </MotionHStack>
                        </Tooltip>

                        <Tooltip content="Settings" disabled={isExpanded} showArrow>
                            <MotionHStack
                                px={3}
                                py={2.5}
                                gap={3}
                                cursor="pointer"
                                borderRadius="lg"
                              
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                justify={isExpanded ? "flex-start" : "center"}
                                width="100%"
                                color={theme.colors.sideBarFont}
                                _hover={{ bg: "gray.100", color: theme.colors.primaryText }}
                            >
                                <Icon as={Settings} boxSize={4}/>
                                {isExpanded && (
                                    <Text fontSize="sm" >Settings</Text>
                                )}
                            </MotionHStack>
                        </Tooltip>
                    </VStack>
                </VStack>
            </Box>

            {/* User profile section */}
            <Box
                position="absolute"
                bottom='50px'
                left={0}
                right={0}
                borderTop="1px solid"
                borderColor="gray.200"
                bg={theme.colors.sideBar}
                backdropFilter="blur(8px)"
                p={3}
            >
                <Tooltip content="User Profile" disabled={isExpanded} showArrow>
                    <MotionHStack
                        gap={3}
                        cursor="pointer"
                        p={2}
                        borderRadius="lg"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        justify={isExpanded ? "flex-start" : "center"}
                        width="100%"
                        color={theme.colors.sideBarFont}
                        _hover={{ bg: "gray.100", color: theme.colors.primaryText }}
                    >
                        <Box
                            position="relative"
                            w={8}
                            h={8}
                            borderRadius="full"
                            bg="gray.200"
                            overflow="hidden"
                        >
                            <Icon
                                as={UserCircle}
                                w="full"
                                h="full"
                            />
                            <Box
                                position="absolute"
                                bottom={0}
                                right={0}
                                w={2.5}
                                h={2.5}
                                bg="green.500"
                                borderRadius="full"
                                border="2px solid"
                                borderColor="white"
                            />
                        </Box>

                        {isExpanded && (
                            <Box flex={1}>
                                
                                <Text fontSize="sm" >
                                    Admin
                                </Text>
                            </Box>
                        )}
                    </MotionHStack>
                </Tooltip>
            </Box>
        </MotionBox>
    );

    // Mobile drawer
    if (!isDesktop) {
        return (
            <Drawer.Root open={isOpen} onOpenChange={onClose} size='xs'>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content width={sidebarWidth}>
                        <Drawer.Body p={0} >
                            {Content}
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>
        );
    }

    // Desktop sidebar
    return (
        <Box
            position="fixed"
            left={0}
            top='49px'
            h="100vh"
            
            zIndex={50}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {Content}
        </Box>
    );
};

export default Sidebar;