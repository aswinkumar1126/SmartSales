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
    Button,
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import {
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    LayoutDashboard,
    Settings,
    HelpCircle,
    UserCircle,
    Search,
    X,
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
import { useSessionStorage } from "@/hooks/apiHooks/storage/useSessionStorage";
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
// Shared animation variants
// ─────────────────────────────────────────────────────────────────────────────

const expandVariants = {
    hidden: { opacity: 0, y: -6 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.18, ease: "easeOut" as const },
    },
    exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};


const parentHasActiveChild = (item: ParentMenuItem, pathname: string): boolean =>
    item.children.some((c) => c.route === pathname);

/**
 * Type guard to check if content is a MenuGroup
 */
const isMenuGroup = (content: SectionContent): content is MenuGroup => {
    return 'icon' in content && 'items' in content;
};

/**
 * Type guard to check if content is a SectionDirectItem
 */
const isSectionDirectItem = (content: SectionContent): content is SectionDirectItem => {
    return 'type' in content && content.type === 'direct';
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    // ── Context ────────────────────────────────────────────────────────────────
    const {
        menuData,
        currentSection,
        setCurrentSection,
        expandedNodes,
        toggleNode,
        sidebarConfig,
        sidebarCollapsed,
        toggleSidebar,
        multiWindow
    } = useSidebar();

    const { user, logout } = useAuth();
    const {setPageName  , setDescription} =usePageName();

    const router = useRouter();
    const rawPathname = usePathname();
    const pathname = normalizePath(rawPathname);
    console.log(pathname,'pathname')
    const { theme } = useTheme();

    // ── Local UI state ─────────────────────────────────────────────────────────
    const [title, setTitle] = useSessionStorage<string| null>("PAGE",null);
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);
    const [isHovered, setIsHovered] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    const [logoutOpen,setLogoutOpen] = useState(false);

    const { collapsedWidth, expandedWidth } = sidebarConfig;

    // ── Derived display flags ──────────────────────────────────────────────────
    const sidebarWidth = useMemo(() => {
        if (!isDesktop) return expandedWidth;
        return sidebarCollapsed && !isHovered ? collapsedWidth : expandedWidth;
    }, [isDesktop, sidebarCollapsed, isHovered, collapsedWidth, expandedWidth]);

    const isExpanded = useMemo(
        () => !isDesktop || !sidebarCollapsed || isHovered,
        [isDesktop, sidebarCollapsed, isHovered]
    );

    // Auto-hide the search bar when sidebar collapses to icon-only mode
    useEffect(() => {
        if (!isExpanded) {
            setShowSearch(false);
            setSearchQuery("");
        }
    }, [isExpanded]);

    useEffect(() => setPageName(title),[title])

    // ── Search filtering ───────────────────────────────────────────────────────
    const filteredMenuData = useMemo(() => {
        if (!searchQuery.trim()) return menuData;
        const q = searchQuery.toLowerCase();
        const result: typeof menuData = {};

        Object.entries(menuData).forEach(([sectionKey, groups]) => {
            const filteredGroups: (typeof menuData)[string] = {};

            Object.entries(groups).forEach(([groupKey, content]) => {
                // Handle SectionDirectItem
                if (isSectionDirectItem(content)) {
                    if (content.label.toLowerCase().includes(q)) {
                        filteredGroups[groupKey] = content;
                    }
                }
                // Handle MenuGroup
                else if (isMenuGroup(content)) {
                    const filteredItems = content.items.filter((item) => {
                        if (item.type === "direct")
                            return item.label.toLowerCase().includes(q);
                        return (
                            item.label.toLowerCase().includes(q) ||
                            item.children.some((c) => c.label.toLowerCase().includes(q))
                        );
                    });

                    if (filteredItems.length > 0)
                        filteredGroups[groupKey] = { ...content, items: filteredItems };
                }
            });

            if (Object.keys(filteredGroups).length > 0)
                result[sectionKey] = filteredGroups;
        });

        return result;
    }, [menuData, searchQuery]);


    // ── Navigation ─────────────────────────────────────────────────────────────
    const navigate = useCallback(
        (route: string, meta?: any) => {

            console.log("Navigating to:", route, meta);

            if (multiWindow) {
                const userId = user?.USERID;

                if (userId) {
                    setStorage(`userId`, true )
                }

                const url = `${window.location.origin}${route}`;

                window.open(url, "_blank", "noopener,noreferrer");
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


    // ── Item renderers ─────────────────────────────────────────────────────────
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
                        bg={isActive ? `${theme.colors.primary}15` : "transparent"}
                        borderLeft="3px solid"
                        borderLeftColor={isActive ? theme.colors.primary : "transparent"}
                        color={isActive ? theme.colors.primary : "gray.500"}
                        _hover={{ bg: isActive ? `${theme.colors.primary}20` : "gray.100" }}
                        onClick={() => navigate(item.route , item)}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        justifyContent={isExpanded ? "flex-start" : "center"}
                        width="100%"
                    >
                        <Icon as={ItemIcon} boxSize={4} />
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

    const renderParentItem = useCallback(
        (item: ParentMenuItem, sectionKey: string, groupKey: string) => {
            const nodeId = `${sectionKey}__${groupKey}__${item.label}`;
            const isNodeOpen = !!expandedNodes[nodeId];
            const hasActive = parentHasActiveChild(item, pathname);
            const ItemIcon = item.icon;

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
                            bg={hasActive ? `${theme.colors.primary}15` : "transparent"}
                            borderLeft="3px solid"
                            borderLeftColor={hasActive ? theme.colors.primary : "transparent"}
                            color={hasActive ? theme.colors.primary : "gray.500"}
                            _hover={{ bg: hasActive ? `${theme.colors.primary}20` : "gray.100" }}
                            onClick={() => isExpanded && toggleNode(nodeId)}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            justifyContent={isExpanded ? "flex-start" : "center"}
                            width="100%"
                        >
                            <Icon as={ItemIcon} boxSize={4} />
                            {isExpanded && (
                                <>
                                    <Text fontSize="sm" fontWeight={hasActive ? 600 : 400} flex={1}>
                                        {item.label}
                                    </Text>
                                    <Icon
                                        as={ChevronDown}
                                        boxSize={3.5}
                                        transform={isNodeOpen ? "rotate(0deg)" : "rotate(-90deg)"}
                                        transition="transform 0.2s ease"
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
                                ml={5}
                                borderLeft="1px solid"
                                borderColor="gray.200"
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
                                            px={2}
                                            py={2}
                                            gap={2}
                                            cursor="pointer"
                                            borderRadius="md"
                                            bg={isChildActive ? `${theme.colors.primary}15` : "transparent"}
                                            color={isChildActive ? theme.colors.primary : "gray.400"}
                                            _hover={{ bg: "gray.100", color: theme.colors.primaryText }}
                                            onClick={() => navigate(child.route ,child)}
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <Icon as={ChildIcon} boxSize={3.5} />
                                            <Text fontSize="xs" fontWeight={isChildActive ? 600 : 400}>
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

    // ── Render Section Content ─────────────────────────────────────────────────
    const renderSectionContent = useCallback(
        (content: SectionContent, groupKey: string, sectionKey: string) => {
            // Handle direct item (like Purchase)
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
                            bg={isActive ? `${theme.colors.primary}15` : "transparent"}
                            borderLeft="3px solid"
                            borderLeftColor={isActive ? theme.colors.primary : "transparent"}
                            color={isActive ? theme.colors.primary : "gray.500"}
                            _hover={{ bg: isActive ? `${theme.colors.primary}20` : "gray.100" }}
                            onClick={() => navigate(item.route ,item)}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            justifyContent={isExpanded ? "flex-start" : "center"}
                            width="100%"
                        >
                            <Icon as={ItemIcon} boxSize={4} />
                            {isExpanded && (
                                <Text fontSize="sm" fontWeight={isActive ? 600 : 400} flex={1}>
                                    {item.label}
                                </Text>
                            )}
                        </MotionHStack>
                    </Tooltip>
                );
            }

            // Handle MenuGroup
            if (isMenuGroup(content)) {
                const group = content;
                const GroupIcon = group.icon;
                const groupNodeId = `${sectionKey}__${groupKey}`;
                const isGroupOpen = !!expandedNodes[groupNodeId];

                const groupIsActive = group.items.some((item) => {
                    if (item.type === "direct")
                        return item.route === pathname;
                    if (item.type === "parent")
                        return parentHasActiveChild(item, pathname);
                    return false;
                });

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
                                _hover={{ bg: "gray.100", color: theme.colors.primaryText }}
                                onClick={() => isExpanded && toggleNode(groupNodeId)}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                width="100%"
                            >
                                <HStack gap={2} w={isExpanded ? "auto" : "100%"} justify="center">
                                    <Icon as={GroupIcon as React.ElementType} boxSize={4.5} />
                                    {isExpanded && (
                                        <Text fontWeight="600" fontSize="sm" flex={1}>
                                            {groupKey}
                                        </Text>
                                    )}
                                </HStack>
                                {isExpanded && (
                                    <Icon
                                        as={ChevronDown}
                                        boxSize={3.5}
                                        transform={isGroupOpen ? "rotate(0deg)" : "rotate(-90deg)"}
                                        transition="transform 0.2s ease"
                                    />
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

    // ── Sidebar JSX ────────────────────────────────────────────────────────────
    const Content = (
        <MotionBox
            w={sidebarWidth}
            onMouseEnter={() => isDesktop && setIsHovered(true)}
            onMouseLeave={() => isDesktop && setIsHovered(false)}
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
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] } as any}
        >
            {/* Header */}
            <Box
                borderBottom="1px solid"
                borderColor="gray.200"
                bg={theme.colors.sideBar}
                backdropFilter="blur(8px)"
                zIndex={10}
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
                                <Icon as={LayoutDashboard} boxSize={5} color={theme.colors.primary} />
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
                                <Box
                                    p={1.5}
                                    borderRadius="md"
                                    cursor="pointer"
                                    title="Toggle search"
                                    onClick={() => setShowSearch((s) => !s)}
                                >
                                    <Icon as={Search} boxSize={4} color="gray.100" />
                                </Box>

                                {isDesktop && (
                                    <Tooltip
                                        content={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                        showArrow
                                    >
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
                        <Icon as={LayoutDashboard} boxSize={5} color={theme.colors.primary} />
                    )}
                </HStack>

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
                                    autoFocus
                                    type="text"
                                    placeholder="Search menu…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 36px",
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

            {/* Scrollable navigation body */}
            <Box
                h="calc(100% - 64px - 110px)"
                overflowY="auto"
                overflowX="hidden"
                css={{
                    "&::-webkit-scrollbar": { width: "4px" },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": {
                        background: "rgba(0,0,0,0.15)",
                        borderRadius: "4px",
                    },
                }}
            >
                <VStack align="stretch" gap={1} p={3}>
                    {Object.keys(filteredMenuData).length > 0 ? (
                        Object.entries(filteredMenuData).map(([sectionKey, groups]) => {
                            const isSectionOpen = currentSection === sectionKey;

                            return (
                                <Box key={sectionKey} width="100%">
                                    {isExpanded && (
                                        <HStack
                                            px={3}
                                            py={2}
                                            cursor="pointer"
                                            borderRadius="lg"
                                            justify="space-between"
                                            color={
                                                isSectionOpen
                                                    ? theme.colors.primary
                                                    : theme.colors.sideBarFont
                                            }
                                            bg={isSectionOpen ? `${theme.colors.primary}10` : "transparent"}
                                            _hover={{ bg: "gray.100", color: theme.colors.primaryText }}
                                            onClick={() => setCurrentSection(sectionKey)}
                                            transition="all 0.15s ease"
                                        >
                                            <Text
                                                fontSize="xs"
                                                fontWeight="700"
                                                textTransform="uppercase"
                                                letterSpacing="wider"
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
                                                gap={2}
                                                mt={1}
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
                        })
                    ) : (
                        <VStack py={8} gap={3}>
                            <Icon as={Search} boxSize={8} color="gray.300" />
                            <Text color="gray.400" fontSize="sm">
                                No menu items found
                            </Text>
                        </VStack>
                    )}

                    <Separator my={2} borderColor="gray.200" />

                    <VStack align="stretch" gap={1}>
                        {[
                            { label: "Help & Support", icon: HelpCircle },
                            { label: "Settings", icon: Settings },
                        ].map(({ label, icon: UtilIcon }) => (
                            <Tooltip
                                key={label}
                                content={label}
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
                                    color={theme.colors.sideBarFont}
                                    _hover={{ bg: "gray.100", color: theme.colors.primaryText }}
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                    justify={isExpanded ? "flex-start" : "center"}
                                    width="100%"
                                >
                                    <Icon as={UtilIcon} boxSize={4} />
                                    {isExpanded && <Text fontSize="sm">{label}</Text>}
                                </MotionHStack>
                            </Tooltip>
                        ))}
                    </VStack>
                </VStack>
            </Box>

            {/* User profile footer */}
            <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                borderTop="1px solid"
                borderColor="gray.200"
                bg={theme.colors.sideBar}
                backdropFilter="blur(8px)"
                p={2}
         
            >
                <Tooltip content="User Profile" disabled={isExpanded} showArrow>
                    <MotionHStack
                        gap={3}
                        cursor="pointer"
                        p={2}
                        borderRadius="lg"
                        color={theme.colors.sideBarFont}
                        _hover={{ bg: "gray.100", color: theme.colors.primaryText }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        justify={isExpanded ? "flex-start" : "center"}
                        width="100%"
                        onClick={() => setLogoutOpen(true)}
                 
                    >
                        <Box
                            position="relative"
                            w={8}
                            h={8}
                            borderRadius="full"
                            bg="gray.200"
                            flexShrink={0}
                           
                        >
                            <Icon as={UserCircle} w="full" h="full" />
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
                            <Box display={'flex'} alignItems={'center'} >
                                <Text fontSize="sm" fontWeight="500">
                                    {user?.USERNAME ?? "ADMIN"}
                                </Text>

                            </Box>
                        )}

                    </MotionHStack>

                </Tooltip>
                <Logout isOpen={logoutOpen}  onClose={()=>setLogoutOpen(false)}/>       
            </Box>
            
        </MotionBox>
    );

    // Mobile: Chakra Drawer
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

    // Desktop: fixed sidebar rail
    return (
        <Box
            position="fixed"
            left={0}
            sm={{ h: '100vh' }}
            md={{ h: '93vh' }}
            zIndex={9999}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {Content}
        </Box>
    );
};

export default Sidebar;