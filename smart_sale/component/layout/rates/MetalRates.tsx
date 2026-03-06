"use client";
import React from "react";

import { Button, Menu, Portal, HStack, VStack, Text, Flex, Badge, Spinner, Box, Separator } from "@chakra-ui/react";
import { FaCoins, FaChartLine, FaCaretDown } from "react-icons/fa";
import { GiSilverBullet } from "react-icons/gi";
import { GiGoldBar } from "react-icons/gi";
import { useTheme } from "@/context/theme/themeContext";

interface MetalRatesMenuProps {
    rates: Record<string, number>;
    isLoading: boolean;
    isError: boolean;
    latestEntry?: string | null;
}

// Metal configuration with display names, priority, and icons
const METAL_CONFIG = {
    'GOLD 100.00': {
        displayName: 'GOLD 24K',
        priority: 1,
        icon: <GiGoldBar color="#FFD700" size="18px" />,
        bgColor: 'yellow.50',
        color: 'yellow.700'
    },
    'GOLD 916': {
        displayName: 'GOLD 22K',
        priority: 2,
        icon: <GiGoldBar color="#FDB931" size="18px" />,
        bgColor: 'yellow.50',
        color: 'yellow.700'
    },
    'SILVER 100': {
        displayName: 'SILVER Bar',
        priority: 3,
        icon: <GiSilverBullet color="#C0C0C0" size="18px" />,
        bgColor: 'gray.50',
        color: 'gray.700'
    },
    'SILVER 916': {
        displayName: 'SILVER 916',
        priority: 4,
        icon: <GiSilverBullet color="#A8A8A8" size="18px" />,
        bgColor: 'gray.50',
        color: 'gray.600'
    }
} as const;

// Professional Metal Rates Menu Component
export const MetalRatesMenu: React.FC<MetalRatesMenuProps> = ({ rates, isLoading, isError ,latestEntry }) => {
    const { theme, mode } = useTheme();
    console.log(rates ,'rates')

    // Format currency with Indian numbering system (₹)
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Get metal details - uses config for known metals, falls back to key for unknown
    const getMetalDetails = (key: string) => {
        const upperKey = key.toUpperCase();

        // Check if key matches any configured metal
        const matchedConfig = Object.entries(METAL_CONFIG).find(([configKey]) =>
            upperKey.includes(configKey)
        );

        if (matchedConfig) {
            const [_, config] = matchedConfig;
            return {
                icon: config.icon,
                bgColor: config.bgColor,
                color: config.color,
                label: config.displayName
            };
        }

        // Default for unknown metals - show the original key
        return {
            icon: <FaCoins color="#6B7280" size="16px" />,
            bgColor: 'gray.50',
            color: 'gray.600',
            label: key // Show original key for unknown metals
        };
    };

    // Sort metals based on priority
    const sortMetals = (entries: [string, number][]) => {
        return entries
            .filter(([key]) => key !== "LAST_UPDATED") // remove last array
            .sort(([keyA], [keyB]) => {
                const upperA = keyA.toUpperCase();
                const upperB = keyB.toUpperCase();

                const configA = Object.entries(METAL_CONFIG).find(([configKey]) =>
                    upperA.includes(configKey)
                );

                const configB = Object.entries(METAL_CONFIG).find(([configKey]) =>
                    upperB.includes(configKey)
                );

                const priorityA = configA ? configA[1].priority : 999;
                const priorityB = configB ? configB[1].priority : 999;

                return priorityA - priorityB;
            });
    };

    // Loading state
    if (isLoading) {
        return (
            <Button variant="outline" size="sm" disabled>
                <HStack spaceX={2}>
                    <Spinner size="xs" />
                    <Text>Loading Rates...</Text>
                </HStack>
            </Button>
        );
    }

    // Error state
    if (isError || !rates) {
        return (
            <Button variant="outline" size="sm" colorScheme="red">
                <HStack spaceX={2}>
                    <Text>Rates Unavailable</Text>
                    <FaCaretDown />
                </HStack>
            </Button>
        );
    }

    const metalEntries = Object.entries(rates);
    const sortedEntries = sortMetals(metalEntries as [string, number][]);
    const totalMetals = metalEntries.length;


    return (
        <Menu.Root>
            <Menu.Trigger asChild>
                <Button
                    variant="outline"
                    size="xs"
                    bg={theme.colors.formColor}
                    _hover={{ bg: theme.colors.yellow }}
                    borderColor="gray.200"
                    boxShadow="sm"
                >
                    <HStack spaceX={2}>
                        <FaChartLine color={theme.colors.green} size="14px" />
                        <Box display="flex" flexDirection="column" gap={1}>

                            {/* <Text fontWeight="semibold" color={theme.colors.primaryText} fontSize="sm">
                                Live Metal Rates
                            </Text> */}

                            <Box display="flex" gap={4}>

                                <Box display="flex" flexDirection="column">
                                    <Text fontSize="xs" color={theme.colors.secondaryText}>
                                        Gold 24K
                                    </Text>
                                    <Text fontWeight="medium" color={theme.colors.primaryText}>
                                        ₹ {rates["GOLD 100.00"]}
                                    </Text>
                                </Box>

                                <Box display="flex" flexDirection="column">
                                    <Text fontSize="xs" color={theme.colors.secondaryText}>
                                        Gold 22K (916)
                                    </Text>
                                    <Text fontWeight="medium" color={theme.colors.primaryText}>
                                        ₹ {rates["GOLD 916.00"]}
                                    </Text>
                                </Box>

                            </Box>

                        </Box>
                      
                        <Badge
                            colorScheme="green"
                            variant="subtle"
                            fontSize="10px"
                            borderRadius="full"
                            px={2}
                        >
                            {totalMetals}
                        </Badge>
                        <FaCaretDown size="14px" color={theme.colors.primaryText} />
                    </HStack>
                </Button>
            </Menu.Trigger>

            <Portal>
                <Menu.Positioner>
                    <Menu.Content
                        minW="300px"
                        boxShadow="lg"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.100"
                        p={1}
                    >
                        {/* Header */}
                        <Box p={2} bg="gray.100" borderBottomWidth="1px" borderColor="gray.400" >
                            <Text display='flex' fontSize="xs" fontWeight="semibold" color="gray.600" justifyContent='center' alignItems='center'>
                                TODAY'S RATES
                            </Text>
                        </Box>

                        {/* Metal List */}
                        <VStack align="stretch" maxH="250px" overflowY="auto">
                            {sortedEntries.map(([key, value], index) => {
                                const details = getMetalDetails(key);
                                const numericValue = value as number;

                                return (
                                    <React.Fragment key={key}>
                                        <Menu.Item
                                            value={key}
                                            _hover={{ bg: details.bgColor }}
                                            borderRadius="md"
                                            py={1}
                                            style={{margin:'4px 0px'}}
                                        >
                                            <Flex align="center" justify="space-between" w="full">
                                                <HStack spaceX={1}>
                                                    <Box borderRadius="md" bg={details.bgColor}>
                                                        {details.icon}
                                                    </Box>
                                                    <VStack spaceY={0} align="start">
                                                        <Text fontSize="xs" fontWeight="medium" color="gray.800">
                                                            {details.label}
                                                        </Text>
                                                    </VStack>
                                                </HStack>
                                                <VStack spaceY={0} align="end">
                                                    <Text fontSize="xs" fontWeight="semibold" color="green.500">
                                                        {formatCurrency(numericValue)}
                                                    </Text>
                                                </VStack>
                                            </Flex>
                                        </Menu.Item>
                                        {index < sortedEntries.length - 1 && (
                                            <Separator borderColor="gray.100" />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </VStack>

                        {/* Footer with timestamp */}
                        <Box py={2} bg="gray.50" borderTopWidth="1px" borderColor="gray.100" borderRadius="0 0 md md">
                            <Text fontSize="10px" color="gray.600" textAlign="center">
                                Last updated: {latestEntry}
                            </Text>
                        </Box>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    );
};