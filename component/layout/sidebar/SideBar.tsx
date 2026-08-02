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
    Separator,
    Badge,
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import {
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    LayoutDashboard,
    Search,
    X,
    UserCircle,
    ArrowRight,
    Layers,
} from "lucide-react";
import {
    useSidebar,
    type MenuItem,
    type DirectMenuItem,
    type ParentMenuItem,
    type SectionContent,
    type MenuGroup,
    type SectionDirectItem,
} from "@/context/layout/SideBarContext";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/context/theme/themeContext";
import { normalizePath } from "@/utils/path/normalizePath";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/apiHooks/auth/useAuth";
import { usePageName } from "@/context/header/PageNameContext";
import { useSessionStorage } from "@/utils/storage/useSessionStorage";
import Logout from "@/component/logout/Logout";
import { setStorage } from "@/utils/storage/storage";

// ─────────────────────────────────────────────────────────────────────────────
// Motion-wrapped Chakra primitives
// ─────────────────────────────────────────────────────────────────────────────
const MotionBox = motion(Box);
const MotionVStack = motion(VStack);
const MotionHStack = motion(HStack);

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────────────────────
const expandVariants = {
    hidden: { opacity: 0, y: -8, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.2, ease: "easeOut" as const },
    },
    exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.14 } },
};

const searchResultVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.04, duration: 0.18, ease: "easeOut" as const },
    }),
    exit: { opacity: 0, x: -4, transition: { duration: 0.1 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────────────────────────────────────
const parentHasActiveChild = (item: ParentMenuItem, pathname: string): boolean =>
    item.children.some((c) => c.route === pathname);

const isMenuGroup = (content: SectionContent): content is MenuGroup =>
    "icon" in content && "items" in content;

const isSectionDirectItem = (content: SectionContent): content is SectionDirectItem =>
    "type" in content && content.type === "direct";

// ─────────────────────────────────────────────────────────────────────────────
// Flat search result type
// ─────────────────────────────────────────────────────────────────────────────
interface FlatSearchResult {
    label: string;
    route: string;
    icon: React.ElementType;
    parentLabel?: string;
    sectionLabel?: string;
    meta?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Child count badge
// ─────────────────────────────────────────────────────────────────────────────
const ChildCountBadge = ({
    count,
    isActive,
    primaryColor,
}: {
    count: number;
    isActive: boolean;
    primaryColor: string;
}) => (
    <Box
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        minW="18px"
        h="18px"
        px="5px"
        borderRadius="full"
        fontSize="10px"
        fontWeight="700"
        letterSpacing="0.02em"
        bg={isActive ? primaryColor : "rgba(120,120,140,0.15)"}
        color={isActive ? "white" : "gray.500"}
        transition="all 0.2s ease"
        flexShrink={0}
    >
        {count}
    </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const {
        menuData,
        currentSection,
        setCurrentSection,
        expandedNodes,
        toggleNode,
        sidebarConfig,
        sidebarCollapsed,
        toggleSidebar,
        multiWindow,
    } = useSidebar();

    const { user, logout } = useAuth();
    const { setPageName, setDescription } = usePageName();

    const router = useRouter();
    const rawPathname = usePathname();
    const pathname = normalizePath(rawPathname);
    const { theme } = useTheme();

    const [title, setTitle] = useSessionStorage<string | null>("PAGE", null);
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);
    const [isHovered, setIsHovered] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const { collapsedWidth, expandedWidth } = sidebarConfig;

    const sidebarWidth = useMemo(() => {
        if (!isDesktop) return expandedWidth;
        return sidebarCollapsed && !isHovered ? collapsedWidth : expandedWidth;
    }, [isDesktop, sidebarCollapsed, isHovered, collapsedWidth, expandedWidth]);

    const isExpanded = useMemo(
        () => !isDesktop || !sidebarCollapsed || isHovered,
        [isDesktop, sidebarCollapsed, isHovered]
    );

    useEffect(() => {
        if (!isExpanded) {
            setShowSearch(false);
            setSearchQuery("");
        }
    }, [isExpanded]);

    useEffect(() => setPageName(title), [title]);

    // ── Flat search results ────────────────────────────────────────────────────
    const flatSearchResults = useMemo((): FlatSearchResult[] => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        const results: FlatSearchResult[] = [];

        Object.entries(menuData).forEach(([sectionKey, groups]) => {
            Object.entries(groups).forEach(([groupKey, content]) => {
                if (isSectionDirectItem(content)) {
                    if (content.label.toLowerCase().includes(q)) {
                        results.push({
                            label: content.label,
                            route: content.route,
                            icon: content.icon,
                            sectionLabel: sectionKey,
                            meta: content,
                        });
                    }
                } else if (isMenuGroup(content)) {
                    content.items.forEach((item) => {
                        if (item.type === "direct" && item.label.toLowerCase().includes(q)) {
                            results.push({
                                label: item.label,
                                route: item.route,
                                icon: item.icon,
                                parentLabel: groupKey,
                                sectionLabel: sectionKey,
                                meta: item,
                            });
                        } else if (item.type === "parent") {
                            // Always flatten children into results when they match
                            item.children.forEach((child) => {
                                if (
                                    child.label.toLowerCase().includes(q) ||
                                    item.label.toLowerCase().includes(q)
                                ) {
                                    results.push({
                                        label: child.label,
                                        route: child.route,
                                        icon: child.icon,
                                        parentLabel: item.label,
                                        sectionLabel: sectionKey,
                                        meta: child,
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });

        return results;
    }, [menuData, searchQuery]);

    const isSearching = searchQuery.trim().length > 0;

    // ── Navigation ─────────────────────────────────────────────────────────────
    const navigate = useCallback(
        (route: string, meta?: any) => {
            if (multiWindow) {
                const userId = user?.USERID;
                if (userId) setStorage(`userId`, true);
                window.open(`${window.location.origin}${route}`, "_blank", "noopener,noreferrer");
                return;
            }
            router.push(route);
            if (meta?.title) {
                setTitle(meta.title);
                setPageName(meta.title);
                setDescription(meta.description);
            }
            if (!isDesktop) onClose();
        },
        [router, isDesktop, onClose, multiWindow, user]
    );

    // ── Search Results Panel ───────────────────────────────────────────────────
    const renderSearchResults = () => {
        if (flatSearchResults.length === 0) {
            return (
                <VStack py={10} gap={3} align="center">
                    <Box
                        w={10}
                        h={10}
                        borderRadius="xl"
                        bg="gray.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Icon as={Search} boxSize={4} color="gray.300" />
                    </Box>
                    <Text color="gray.400" fontSize="sm" fontWeight="500">
                        No results for "{searchQuery}"
                    </Text>
                    <Text color="gray.300" fontSize="xs">
                        Try a different keyword
                    </Text>
                </VStack>
            );
        }

        return (
            <VStack align="stretch" gap={1} px={2} pt={1}>
                <Text
                    px={2}
                    pb={1}
                    fontSize="10px"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="0.1em"
                    color="gray.400"
                >
                    {flatSearchResults.length} result{flatSearchResults.length !== 1 ? "s" : ""}
                </Text>
                {flatSearchResults.map((result, i) => {
                    const isActive = pathname === result.route;
                    const ResultIcon = result.icon;
                    return (
                        <MotionHStack
                            key={`${result.route}-${i}`}
                            custom={i}
                            variants={searchResultVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            px={3}
                            py={2.5}
                            gap={3}
                            cursor="pointer"
                            borderRadius="lg"
                            bg={isActive ? `${theme.colors.primary}12` : "transparent"}
                            borderLeft="2px solid"
                            borderLeftColor={isActive ? theme.colors.primary : "transparent"}
                            color={isActive ? theme.colors.primary : "gray.600"}
                            _hover={{
                                bg: isActive ? `${theme.colors.primary}18` : "gray.50",
                                color: theme.colors.primaryText,
                                borderLeftColor: theme.colors.primary,
                            }}
                            onClick={() => {
                                navigate(result.route, result.meta);
                                setSearchQuery("");
                                setShowSearch(false);
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.12 } as any}
                            onMouseEnter={() => setHoveredItem(result.route)}
                            onMouseLeave={() => setHoveredItem(null)}
                            position="relative"
                            overflow="hidden"
                        >
                            {/* Icon */}
                            <Box
                                w={7}
                                h={7}
                                borderRadius="md"
                                bg={isActive ? `${theme.colors.primary}20` : "gray.100"}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                                transition="all 0.15s ease"
                            >
                                <Icon as={ResultIcon} boxSize={3.5} />
                            </Box>

                            {/* Labels */}
                            <Box flex={1} minW={0}>
                                <Text
                                    fontSize="sm"
                                    fontWeight={isActive ? 600 : 500}
                                    lineHeight="1.2"

                                >
                                    {result.label}
                                </Text>
                                {(result.parentLabel || result.sectionLabel) && (
                                    <HStack gap={1} mt={0.5}>
                                        {result.sectionLabel && (
                                            <Text
                                                fontSize="10px"
                                                color="gray.400"
                                                fontWeight="500"
                                                textTransform="uppercase"
                                                letterSpacing="0.05em"

                                            >
                                                {result.sectionLabel}
                                            </Text>
                                        )}
                                        {result.parentLabel && (
                                            <>
                                                <Text fontSize="10px" color="gray.300">›</Text>
                                                <Text fontSize="10px" color="gray.400" fontWeight="500">
                                                    {result.parentLabel}
                                                </Text>
                                            </>
                                        )}
                                    </HStack>
                                )}
                            </Box>

                            {/* Arrow indicator on hover */}
                            <AnimatePresence>
                                {hoveredItem === result.route && (
                                    <MotionBox
                                        initial={{ opacity: 0, x: -4 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -4 }}
                                        transition={{ duration: 0.12 } as any}
                                    >
                                        <Icon as={ArrowRight} boxSize={3.5} color="gray.400" />
                                    </MotionBox>
                                )}
                            </AnimatePresence>
                        </MotionHStack>
                    );
                })}
            </VStack>
        );
    };

    // ── Direct item renderer ───────────────────────────────────────────────────
    const renderDirectItem = useCallback(
        (item: DirectMenuItem) => {
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
                        bg={isActive ? `${theme.colors.primary}12` : "transparent"}
                        borderLeft="2px solid"
                        borderLeftColor={isActive ? theme.colors.primary : "transparent"}
                        color={isActive ? theme.colors.primary : "gray.500"}
                        _hover={{
                            bg: isActive ? `${theme.colors.primary}18` : "gray.50",
                            borderLeftColor: theme.colors.primary,
                            color: theme.colors.primaryText,
                        }}
                        onClick={() => navigate(item.route, item)}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        justifyContent={isExpanded ? "flex-start" : "center"}
                        width="100%"
                        transition={{ duration: 0.12 } as any}
                    >
                        <Box
                            w={isExpanded ? 7 : 8}
                            h={isExpanded ? 7 : 8}
                            borderRadius={isExpanded ? "md" : "lg"}
                            bg={isActive ? `${theme.colors.primary}20` : "transparent"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                            transition="all 0.15s ease"
                        >
                            <Icon as={ItemIcon} boxSize={4} />
                        </Box>
                        {isExpanded && (
                            <Text fontSize="sm" fontWeight={isActive ? 600 : 400} flex={1}>
                                {item.label}
                            </Text>
                        )}
                    </MotionHStack>
                </Tooltip>
            );
        },
        [pathname, isExpanded, navigate, theme.colors.primary]
    );

    // ── Parent item renderer ───────────────────────────────────────────────────
    const renderParentItem = useCallback(
        (item: ParentMenuItem, sectionKey: string, groupKey: string) => {
            const nodeId = `${sectionKey}__${groupKey}__${item.label}`;
            const isNodeOpen = !!expandedNodes[nodeId];
            const hasActive = parentHasActiveChild(item, pathname);
            const ItemIcon = item.icon;
            const childCount = item.children.length;

            return (
                <Box key={item.label} width="100%">
                    <Tooltip
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
                            bg={hasActive ? `${theme.colors.primary}12` : "transparent"}
                            borderLeft="2px solid"
                            borderLeftColor={hasActive ? theme.colors.primary : "transparent"}
                            color={hasActive ? theme.colors.primary : "gray.500"}
                            _hover={{
                                bg: hasActive ? `${theme.colors.primary}18` : "gray.50",
                                borderLeftColor: theme.colors.primary,
                                color: theme.colors.primaryText,
                            }}
                            onClick={() => isExpanded && toggleNode(nodeId)}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            justifyContent={isExpanded ? "flex-start" : "center"}
                            width="100%"
                            transition={{ duration: 0.12 } as any}
                        >
                            <Box
                                w={isExpanded ? 7 : 8}
                                h={isExpanded ? 7 : 8}
                                borderRadius={isExpanded ? "md" : "lg"}
                                bg={hasActive ? `${theme.colors.primary}20` : "transparent"}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                                transition="all 0.15s ease"
                            >
                                <Icon as={ItemIcon} boxSize={4} />
                            </Box>

                            {isExpanded && (
                                <>
                                    <Text
                                        fontSize="sm"
                                        fontWeight={hasActive ? 600 : 400}
                                        flex={1}
                                        lineHeight="1.2"
                                    >
                                        {item.label}
                                    </Text>

                                    {/* Child count badge */}
                                    <ChildCountBadge
                                        count={childCount}
                                        isActive={hasActive || isNodeOpen}
                                        primaryColor={theme.colors.primary}
                                    />

                                    <Icon
                                        as={ChevronDown}
                                        boxSize={3}
                                        transform={isNodeOpen ? "rotate(0deg)" : "rotate(-90deg)"}
                                        transition="transform 0.22s ease"
                                        color={hasActive ? theme.colors.primary : "gray.400"}
                                        ml={-1}
                                    />
                                </>
                            )}
                        </MotionHStack>
                    </Tooltip>

                    <AnimatePresence initial={false}>
                        {isExpanded && isNodeOpen && (
                            <MotionVStack
                                align="stretch"
                                pl={3}
                                mt={0.5}
                                gap={0.5}
                                ml={6}
                                borderLeft="1.5px solid"
                                borderColor="gray.150"
                                variants={expandVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {item.children.map((child) => {
                                    const isChildActive = pathname === child.route;
                                    const ChildIcon = child.icon;

                                    return (
                                        <MotionHStack
                                            key={child.route}
                                            px={2.5}
                                            py={2}
                                            gap={2.5}
                                            cursor="pointer"
                                            borderRadius="md"
                                            bg={isChildActive ? `${theme.colors.primary}10` : "transparent"}
                                            color={isChildActive ? theme.colors.primary : "gray.400"}
                                            _hover={{
                                                bg: "gray.50",
                                                color: theme.colors.primaryText,
                                            }}
                                            onClick={() => navigate(child.route, child)}
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.97 }}
                                            transition={{ duration: 0.1 } as any}
                                            position="relative"
                                        >
                                            {/* Dot indicator */}
                                            <Box
                                                w={1.5}
                                                h={1.5}
                                                borderRadius="full"
                                                bg={isChildActive ? theme.colors.primary : "gray.300"}
                                                flexShrink={0}
                                                transition="all 0.15s ease"
                                            />
                                            <Box
                                                w={6}
                                                h={6}
                                                borderRadius="md"
                                                bg={isChildActive ? `${theme.colors.primary}15` : "transparent"}
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                flexShrink={0}
                                            >
                                                <Icon as={ChildIcon} boxSize={3.5} />
                                            </Box>
                                            <Text fontSize="xs" fontWeight={isChildActive ? 600 : 400} flex={1}>
                                                {child.label}
                                            </Text>
                                        </MotionHStack>
                                    );
                                })}
                            </MotionVStack>
                        )}
                    </AnimatePresence>
                </Box>
            );
        },
        [expandedNodes, pathname, isExpanded, toggleNode, navigate, theme.colors]
    );

    const renderMenuItem = useCallback(
        (item: MenuItem, sectionKey: string, groupKey: string) => {
            if (item.type === "direct") return renderDirectItem(item);
            if (item.type === "parent") return renderParentItem(item, sectionKey, groupKey);
            return null;
        },
        [renderDirectItem, renderParentItem]
    );

    // ── Section content renderer ───────────────────────────────────────────────
    const renderSectionContent = useCallback(
        (content: SectionContent, groupKey: string, sectionKey: string) => {
            if (isSectionDirectItem(content)) {
                const item = content;
                const isActive = pathname === item.route;
                const ItemIcon = item.icon;

                return (
                    <Tooltip
                        key={groupKey}
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
                            bg={isActive ? `${theme.colors.primary}12` : "transparent"}
                            borderLeft="2px solid"
                            borderLeftColor={isActive ? theme.colors.primary : "transparent"}
                            color={isActive ? theme.colors.primary : "gray.500"}
                            _hover={{
                                bg: isActive ? `${theme.colors.primary}18` : "gray.50",
                                borderLeftColor: theme.colors.primary,
                                color: theme.colors.primaryText,
                            }}
                            onClick={() => navigate(item.route, item)}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            justifyContent={isExpanded ? "flex-start" : "center"}
                            width="100%"
                            transition={{ duration: 0.12 } as any}
                        >
                            <Box
                                w={isExpanded ? 7 : 8}
                                h={isExpanded ? 7 : 8}
                                borderRadius={isExpanded ? "md" : "lg"}
                                bg={isActive ? `${theme.colors.primary}20` : "transparent"}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                            >
                                <Icon as={ItemIcon} boxSize={4} />
                            </Box>
                            {isExpanded && (
                                <Text fontSize="sm" fontWeight={isActive ? 600 : 400} flex={1}>
                                    {item.label}
                                </Text>
                            )}
                        </MotionHStack>
                    </Tooltip>
                );
            }

            if (isMenuGroup(content)) {
                const group = content;
                const GroupIcon = group.icon;
                const groupNodeId = `${sectionKey}__${groupKey}`;
                const isGroupOpen = !!expandedNodes[groupNodeId];

                const groupIsActive = group.items.some((item) => {
                    if (item.type === "direct") return item.route === pathname;
                    if (item.type === "parent") return parentHasActiveChild(item, pathname);
                    return false;
                });

                // Count total items across the group (direct + children of parents)
                const totalItems = group.items.reduce((acc, item) => {
                    if (item.type === "direct") return acc + 1;
                    if (item.type === "parent") return acc + item.children.length;
                    return acc;
                }, 0);

                return (
                    <Box key={groupKey} width="100%">
                        <Tooltip
                            content={groupKey}
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
                                bg={groupIsActive ? `${theme.colors.primary}10` : "transparent"}
                                color={groupIsActive ? theme.colors.primary : "gray.500"}
                                _hover={{
                                    bg: "gray.50",
                                    color: theme.colors.primaryText,
                                }}
                                onClick={() => isExpanded && toggleNode(groupNodeId)}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                width="100%"
                                transition={{ duration: 0.12 } as any}
                            >
                                <HStack gap={2.5} w={isExpanded ? "auto" : "100%"} justify="center">
                                    <Box
                                        w={isExpanded ? 7 : 8}
                                        h={isExpanded ? 7 : 8}
                                        borderRadius={isExpanded ? "md" : "lg"}
                                        bg={groupIsActive ? `${theme.colors.primary}20` : "gray.100"}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        flexShrink={0}
                                        transition="all 0.15s ease"
                                    >
                                        <Icon as={GroupIcon as React.ElementType} boxSize={4} />
                                    </Box>
                                    {isExpanded && (
                                        <Text fontWeight="600" fontSize="sm" flex={1} lineHeight="1.2">
                                            {groupKey}
                                        </Text>
                                    )}
                                </HStack>

                                {isExpanded && (
                                    <HStack gap={2}>
                                        {/* Total item count badge */}
                                        <ChildCountBadge
                                            count={totalItems}
                                            isActive={groupIsActive || isGroupOpen}
                                            primaryColor={theme.colors.primary}
                                        />
                                        <Icon
                                            as={ChevronDown}
                                            boxSize={3}
                                            transform={isGroupOpen ? "rotate(0deg)" : "rotate(-90deg)"}
                                            transition="transform 0.22s ease"
                                            color={groupIsActive ? theme.colors.primary : "gray.400"}
                                        />
                                    </HStack>
                                )}
                            </MotionHStack>
                        </Tooltip>

                        <AnimatePresence initial={false}>
                            {isExpanded && isGroupOpen && (
                                <MotionVStack
                                    align="stretch"
                                    pl={2}
                                    mt={0.5}
                                    gap={0.5}
                                    variants={expandVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    {group.items.map((item) =>
                                        renderMenuItem(item, sectionKey, groupKey)
                                    )}
                                </MotionVStack>
                            )}
                        </AnimatePresence>
                    </Box>
                );
            }

            return null;
        },
        [pathname, isExpanded, navigate, theme.colors, expandedNodes, toggleNode, renderMenuItem]
    );

    // ── Sidebar content ────────────────────────────────────────────────────────
    const Content = (
        <MotionBox
            w={sidebarWidth}
            onMouseEnter={() => isDesktop && setIsHovered(true)}
            onMouseLeave={() => isDesktop && setIsHovered(false)}
            bg={theme.colors.sideBar}
            h="100%"
            borderRight="1px solid"
            borderColor="rgba(0,0,0,0.07)"
            overflow="hidden"
            position="relative"
            boxShadow="4px 0 24px rgba(0,0,0,0.06)"
            initial={false}
            animate={{ width: sidebarWidth }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] } as any}
        >
            {/* ── Header ── */}
            <Box
                borderBottom="1px solid"
                borderColor="rgba(0,0,0,0.07)"
                bg={theme.colors.sideBar}
                backdropFilter="blur(12px)"
                zIndex={10}
            >
                <HStack
                    h="64px"
                    px={isExpanded ? 4 : 3}
                    justify={isExpanded ? "space-between" : "center"}
                    gap={2}
                >
                    {isExpanded ? (
                        <>
                            <HStack gap={2.5}>
                                <Box
                                    w={8}
                                    h={8}
                                    borderRadius="lg"
                                    bg={`${theme.colors.primary}20`}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    flexShrink={0}
                                >
                                    <Icon as={LayoutDashboard} boxSize={4.5} color={theme.colors.primary} />
                                </Box>
                                <Text
                                    fontSize="sm"
                                    fontWeight="700"
                                    color={theme.colors.whiteColor}
                                    letterSpacing="-0.01em"
                                >
                                    Dashboard
                                </Text>
                            </HStack>

                            <HStack gap={0.5}>
                                <Tooltip content="Search menu" showArrow>
                                    <Box
                                        w={7}
                                        h={7}
                                        borderRadius="md"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        cursor="pointer"
                                        bg={showSearch ? `${theme.colors.primary}20` : "transparent"}
                                        _hover={{ bg: "rgba(255,255,255,0.1)" }}
                                        onClick={() => setShowSearch((s) => !s)}
                                        transition="all 0.15s ease"
                                    >
                                        <Icon
                                            as={showSearch ? X : Search}
                                            boxSize={3.5}
                                            color={showSearch ? theme.colors.primary : "gray.300"}
                                        />
                                    </Box>
                                </Tooltip>

                                {isDesktop && (
                                    <Tooltip
                                        content={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                        showArrow
                                    >
                                        <Box
                                            w={7}
                                            h={7}
                                            borderRadius="md"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            cursor="pointer"
                                            _hover={{ bg: "rgba(255,255,255,0.1)" }}
                                            onClick={toggleSidebar}
                                        >
                                            <Icon
                                                as={sidebarCollapsed ? ChevronsRight : ChevronsLeft}
                                                boxSize={3.5}
                                                color="gray.300"
                                            />
                                        </Box>
                                    </Tooltip>
                                )}
                            </HStack>
                        </>
                    ) : (
                        <Box
                            w={8}
                            h={8}
                            borderRadius="lg"
                            bg={`${theme.colors.primary}20`}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Icon as={LayoutDashboard} boxSize={4.5} color={theme.colors.primary} />
                        </Box>
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
                            transition={{ duration: 0.18 } as any}
                        >
                            <HStack
                                bg="rgba(255,255,255,0.08)"
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="rgba(255,255,255,0.12)"
                                px={3}
                                gap={2}
                                _focusWithin={{
                                    borderColor: theme.colors.primary,
                                    bg: "rgba(255,255,255,0.12)",
                                }}
                                transition="all 0.15s ease"
                            >
                                <Icon as={Search} boxSize={3.5} color="gray.400" flexShrink={0} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search menu…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: "9px 0",
                                        background: "transparent",
                                        border: "none",
                                        outline: "none",
                                        fontSize: "13px",
                                        color: theme.colors.whiteColor,
                                    }}
                                />
                                {searchQuery && (
                                    <Box
                                        cursor="pointer"
                                        onClick={() => setSearchQuery("")}
                                        flexShrink={0}
                                    >
                                        <Icon as={X} boxSize={3.5} color="gray.400" />
                                    </Box>
                                )}
                            </HStack>
                        </MotionBox>
                    )}
                </AnimatePresence>
            </Box>

            {/* ── Scrollable body ── */}
            <Box
                h="calc(100% - 64px - 72px)"
                overflowY="auto"
                overflowX="hidden"
                css={{
                    "&::-webkit-scrollbar": { width: "3px" },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": {
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "4px",
                    },
                }}
            >
                {/* Search results or normal nav */}
                <AnimatePresence mode="wait">
                    {isSearching && isExpanded ? (
                        <MotionBox
                            key="search-results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 } as any}
                            pt={2}
                            pb={4}
                        >
                            {renderSearchResults()}
                        </MotionBox>
                    ) : (
                        <MotionBox
                            key="nav-tree"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 } as any}
                        >
                            <VStack align="stretch" gap={1} p={3}>
                                {Object.entries(menuData).map(([sectionKey, groups]) => {
                                    const isSectionOpen = currentSection === sectionKey;

                                    return (
                                        <Box key={sectionKey} width="100%">
                                            {isExpanded && (
                                                <HStack
                                                    px={3}
                                                    py={1.5}
                                                    cursor="pointer"
                                                    borderRadius="lg"
                                                    justify="space-between"
                                                    color={
                                                        isSectionOpen
                                                            ? theme.colors.primary
                                                            : theme.colors.sideBarFont ?? "gray.400"
                                                    }
                                                    bg={isSectionOpen ? `${theme.colors.primary}10` : "transparent"}
                                                    _hover={{ bg: "rgba(255,255,255,0.06)", color: theme.colors.primary }}
                                                    onClick={() => setCurrentSection(sectionKey)}
                                                    transition="all 0.15s ease"
                                                >
                                                    <Text
                                                        fontSize="10px"
                                                        fontWeight="700"
                                                        textTransform="uppercase"
                                                        letterSpacing="0.1em"
                                                    >
                                                        {sectionKey}
                                                    </Text>
                                                    <Icon
                                                        as={ChevronDown}
                                                        boxSize={3}
                                                        transform={isSectionOpen ? "rotate(0deg)" : "rotate(-90deg)"}
                                                        transition="transform 0.2s ease"
                                                    />
                                                </HStack>
                                            )}

                                            <AnimatePresence initial={false}>
                                                {(isExpanded ? isSectionOpen : true) && (
                                                    <MotionVStack
                                                        align="stretch"
                                                        gap={0.5}
                                                        mt={isExpanded ? 1 : 2}
                                                        variants={expandVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="exit"
                                                    >
                                                        {Object.entries(groups).map(([groupKey, content]) =>
                                                            renderSectionContent(content, groupKey, sectionKey)
                                                        )}
                                                    </MotionVStack>
                                                )}
                                            </AnimatePresence>
                                        </Box>
                                    );
                                })}

                                <Box pt={2} pb={1}>
                                    <Separator borderColor="rgba(255,255,255,0.08)" />
                                </Box>
                            </VStack>
                        </MotionBox>
                    )}
                </AnimatePresence>
            </Box>

            {/* ── Footer / user profile ── */}
            <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                borderTop="1px solid"
                borderColor="rgba(0,0,0,0.07)"
                bg={theme.colors.sideBar}
                backdropFilter="blur(12px)"
                p={3}
            >
                <Tooltip content="User Profile" disabled={isExpanded} showArrow>
                    <MotionHStack
                        gap={2.5}
                        cursor="pointer"
                        p={2}
                        borderRadius="lg"
                        color={theme.colors.sideBarFont ?? "gray.400"}
                        _hover={{ bg: "rgba(255,255,255,0.08)", color: theme.colors.whiteColor }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        justify={isExpanded ? "flex-start" : "center"}
                        width="100%"
                        onClick={() => setLogoutOpen(true)}
                        transition={{ duration: 0.12 } as any}
                    >
                        {/* Avatar */}
                        <Box position="relative" flexShrink={0}>
                            <Box
                                w={8}
                                h={8}
                                borderRadius="full"
                                bg={`${theme.colors.primary}30`}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                border="1.5px solid"
                                borderColor={`${theme.colors.primary}40`}
                            >
                                <Icon
                                    as={UserCircle}
                                    boxSize={5}
                                    color={theme.colors.primary}
                                />
                            </Box>
                            <Box
                                position="absolute"
                                bottom="0"
                                right="0"
                                w="9px"
                                h="9px"
                                bg="green.400"
                                borderRadius="full"
                                border="1.5px solid"
                                borderColor={theme.colors.sideBar}
                            />
                        </Box>

                        {isExpanded && (
                            <Box flex={1} minW={0}>
                                <Text
                                    fontSize="sm"
                                    fontWeight="600"
                                    color={theme.colors.whiteColor}

                                >
                                    {user?.USERNAME ?? "Admin"}
                                </Text>
                                {/* <Text fontSize="10px" color="gray.500" >
                                    {user?.EMAIL ?? "Online"}
                                </Text> */}
                            </Box>
                        )}
                    </MotionHStack>
                </Tooltip>
                <Logout isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} />
            </Box>
        </MotionBox>
    );

    if (!isDesktop) {
        return (
            <Drawer.Root open={isOpen} onOpenChange={onClose} size="xs">
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content width={sidebarWidth}>
                        <Drawer.Body p={0}>{Content}</Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>
        );
    }

    return (
        <Box
            position="fixed"
            left={0}
            sm={{ h: "100vh" }}
            md={{ h: "93vh" }}
            zIndex={9999}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {Content}
        </Box>
    );
};

export default Sidebar;