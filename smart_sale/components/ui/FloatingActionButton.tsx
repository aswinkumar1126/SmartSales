"use client";

import { IconButton, Tooltip } from "@chakra-ui/react";
import React from "react";

type FabPosition =
    | "bottom-right"
    | "bottom-left"
    | "top-right"
    | "top-right-high"
    | "top-left";

interface FloatingActionButtonProps {
    icon: React.ReactElement;
    ariaLabel: string;
    onClick?: () => void;
    position?: FabPosition;
    size?: "xs"|"sm" | "md" | "lg";
    colorScheme?: string;
    isDisabled?: boolean;
    tooltip?: string;
    zIndex?: number;
    className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    icon,
    ariaLabel,
    onClick,
    position = "bottom-right",
    size = "sm",
    colorScheme = "yellow",
    isDisabled = false,
    tooltip,
    zIndex = 10,
    className
}) => {
    const positionStyles: Record<FabPosition, any> = {
        "bottom-right": { bottom: ["10px", "10px"], right: ["10px", "10px"] },
        "bottom-left": { bottom: ["10px", "20px"], left: ["10px", "20px"] },
        "top-right": { top: ["10px", "20px"], right: ["10px", "20px"] },
        "top-left": { top: ["10px", "20px"], left: ["10px", "20px"] },
        "top-right-high": { top: ["95px", "60px"], right: ["20px", "20px"] },
    };

    const button = (
        <IconButton
            aria-label={ariaLabel}
            onClick={onClick}
            position="fixed"
            {...positionStyles[position]}
            size={size}
            colorPalette={colorScheme}
            rounded="full"
            shadow="lg"
            zIndex={zIndex}
            disabled={isDisabled}
            _hover={{ transform: "scale(1.05)" }}
            _active={{ transform: "scale(0.95)" }}
            className={className}
        >
            {icon}
        </IconButton>
    );

    if (tooltip) {
        return (
            <Tooltip.Root >
                <Tooltip.Trigger asChild>
                    {button}
                </Tooltip.Trigger>

                <Tooltip.Positioner >
                    <Tooltip.Content fontSize="xs">
                        {tooltip}
                    </Tooltip.Content>
                </Tooltip.Positioner>
            </Tooltip.Root>
        );
    }

    return button;
};
