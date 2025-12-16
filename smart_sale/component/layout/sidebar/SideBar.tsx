"use client";
import React,{useState} from 'react';
import { Box, VStack, Text, Collapsible, Drawer, useMediaQuery } from "@chakra-ui/react";
import { useSidebar } from "@/context/layout/SideBarContext";
import { useRouter ,usePathname } from "next/navigation";


const Sidebar = ({ isOpen, onClose }: any) => {
    const { currentSection, menuData } = useSidebar();
    const router = useRouter();
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);
    const [expandedNode, setExpandedNode] = useState<string | null>(null);
    const sectionData = menuData[currentSection] || {};
    const pathname =usePathname();
    const Content = (
        <Box w="250px" p={4} bg="#FDFAF6" h="100%" overflowY="auto">
            <VStack align="start">
                {Object.keys(sectionData).map((key) => (
                    <Collapsible.Root
                        key={key}
                        open={expandedNode === key}
                        onOpenChange={() =>
                            setExpandedNode(prev => (prev === key ? null : key))
                        }
                    >

                        <Collapsible.Trigger asChild>
                            <Box
                                px={3}
                                py={2}
                                cursor="pointer"
                                borderRadius="md"
                                bg={expandedNode === key ? "#F4F1EE" : "transparent"}
                                _hover={{ bg: "#F4F1EE" }}
                            >
                                <Text fontWeight={600} fontSize="sm">
                                    {key}
                                </Text>
                            </Box>
                        </Collapsible.Trigger>

                        {/* 👇 THIS IS REQUIRED */}
                        <Collapsible.Content>
                            <Box>
                                <VStack align="stretch" pl={4} pt={2} >
                                    {sectionData[key].map((subItem: any) => {
                                        const isActive = pathname === subItem.route;

                                        return (
                                            <Box
                                                key={subItem.label}
                                                px={2}
                                                py={1}
                                                borderRadius="md"
                                                cursor="pointer"
                                                bg={isActive ? "#EDE6F7" : "transparent"}
                                                _hover={{ bg: "#F1ECFA" }}
                                                onClick={() => {
                                                    router.push(subItem.route);
                                                    if (!isDesktop) onClose();
                                                }}
                                            >
                                                <Text
                                                    fontSize="sm"
                                                    fontWeight={isActive ? 600 : 400}
                                                >
                                                    {subItem.label}
                                                </Text>
                                            </Box>
                                        );
                                    })}
                                </VStack>
                            </Box>
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