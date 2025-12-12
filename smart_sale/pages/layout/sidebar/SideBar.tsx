"use client";

import { Box, VStack, Text, Collapsible, Drawer, useMediaQuery } from "@chakra-ui/react";
import { useSidebar } from "@/context/layout/SideBarContext";
import { useRouter } from "next/navigation";

const Sidebar = ({ isOpen, onClose }: any) => {
    const { currentSection, expandedNodes, toggleNode, menuData } = useSidebar();
    const router = useRouter();
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);

    const sectionData = menuData[currentSection] || {};

    const Content = (
        <Box w="250px" p={4} bg="#FDFAF6" h="100%" overflowY="auto">
            <VStack align="start">
                {Object.keys(sectionData).map((key) => (
                    <Collapsible.Root
                        key={key}
                        open={!!expandedNodes[key]}
                        onOpenChange={() => toggleNode(key)}
                    >
                        <Collapsible.Trigger asChild>
                            <Box p={2} cursor="pointer" w="100%">
                                <Text fontWeight="bold">{key}</Text>
                            </Box>
                        </Collapsible.Trigger>

                        <Collapsible.Content>
                            <VStack pl={4} align="start">
                                {sectionData[key].map((subItem:any) => (
                                    <Text
                                        key={subItem.label}
                                        cursor="pointer"
                                        onClick={() => {
                                            router.push(subItem.route);
                                            if (!isDesktop) onClose();
                                        }}
                                        p={1}
                                        _hover={{ textDecoration: "underline" }}
                                    >
                                        {subItem.label}
                                    </Text>
                                ))}
                            </VStack>
                        </Collapsible.Content>
                    </Collapsible.Root>
                ))}
            </VStack>
        </Box>
    );

    return isDesktop ? (
        <Box w="250px" position="fixed" left={0} h="100%" bg="gray.50">
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
export default  Sidebar;