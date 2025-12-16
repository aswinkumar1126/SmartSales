"use client";

import { Box, HStack, Button, IconButton, Group } from "@chakra-ui/react";
import { FiMenu, FiEye, FiEyeOff } from "react-icons/fi";
import { useMediaQuery } from "@chakra-ui/react";
import { useSidebar } from "@/context/layout/SideBarContext";
 const Header = ({ onOpenMenu }: any) => {
    const { menuData, setCurrentSection } = useSidebar();
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);

    const sections = Object.keys(menuData); // 👈 Auto-generate

    return (
        <Box bg="#FDFAF6" borderBottom="1px solid" borderColor="gray.200" p={4} position="sticky" top="0" zIndex={1} >
            <HStack >
                {!isDesktop && (
                    <IconButton aria-label="Open Menu" onClick={onOpenMenu}>
                        <FiMenu />
                    </IconButton>
                )}
                <Group attached>
                {sections.map((section) => (
            
                    <Button
                        key={section}
                        onClick={() => {
                            setCurrentSection(section);
                            !isDesktop && onOpenMenu();
                        }}
                        variant="outline"
                 
                    >
                        {section}
                    </Button>
                  
                ))}
                </Group>
            </HStack>
        </Box>
    );
};
export default Header;
