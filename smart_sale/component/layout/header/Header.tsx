"use client";

import { Box, HStack, Button, IconButton, Group ,Text } from "@chakra-ui/react";
import { FiMenu, FiEye, FiEyeOff } from "react-icons/fi";
import { useMediaQuery } from "@chakra-ui/react";
import { useSidebar } from "@/context/layout/SideBarContext";
import { useTheme } from "@/context/theme/themeContext";
import { FiSun, FiMoon } from "react-icons/fi";


 const Header = ({ onOpenMenu }: any) => {

     const { theme, mode, toggleTheme } = useTheme();
    const { menuData, setCurrentSection } = useSidebar();
    const [isDesktop] = useMediaQuery(["(min-width: 768px)"]);
     const now = new Date();
    const sections = Object.keys(menuData); // 👈 Auto-generate
     const formatDate = (date: Date) => {
         const dd = String(date.getDate()).padStart(2, "0");
         const mm = String(date.getMonth() + 1).padStart(2, "0");
         const yyyy = date.getFullYear();
         return `${dd}-${mm}-${yyyy}`;
     };
    return (
        <Box bg={theme.colors.accient} borderBottom="1px solid" borderColor="gray.200" color={theme.colors.whiteColor} p={4} position="sticky" top="0" zIndex={2} >
            <Box display="flex" justifyContent="space-between" alignItems="center" >
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
                        size="sm"
                        _hover={{
                            color: '#222',
                        }}
                        color='inherit'
                      
                 
                    >
                        {section}
                    </Button>
                  
                ))}
                </Group>
            </HStack>
          
            <HStack justify="space-between">
                {/* your menu buttons */}
                    <HStack>
                        <Text>  DATE : {formatDate(now)} </Text>
                    </HStack>
                <IconButton
                    aria-label="Toggle theme"
                    variant="ghost"
                    onClick={toggleTheme}
                    color='inherit'
                    _hover={{
                        color: '#222',
                    }}
                >
                    {mode === "light" ? <FiMoon /> : <FiSun />}
                </IconButton>
            </HStack>
            </Box>
        </Box>
    );
};
export default Header;
