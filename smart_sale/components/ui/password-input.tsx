"use client";

import * as React from "react";
import {
    Input,
    Box,
    IconButton,
    Text,
    Stack,
    Progress,
} from "@chakra-ui/react";
import { FiMenu, FiEye, FiEyeOff } from "react-icons/fi";
import { useTheme } from "@/context/theme/themeContext";
import { background } from "@chakra-ui/system";

export interface PasswordInputProps
    extends React.ComponentProps<typeof Input> { }

export const PasswordInput = React.forwardRef<
    HTMLInputElement,
    PasswordInputProps
>(function PasswordInput({ onChange, ...props }, ref) {
    const [show, setShow] = React.useState(false);
    const { theme, mode } = useTheme();

    return (
        <Box position="relative" w="full">
            <Input
                ref={ref}
                type={show ? "text" : "password"}
                pr="3rem"
                textTransform="uppercase"   // visual
                onChange={(e) => {
                    const upperValue = e.target.value.toUpperCase();
                    onChange?.({
                        ...e,
                        target: { ...e.target, value: upperValue },
                    });
                }}
                {...props}
            />

            <IconButton
                aria-label={show ? "Hide password" : "Show password"}
                size="sm"
                variant="ghost"
                position="absolute"
                right="0.25rem"
                top="50%"
                transform="translateY(-50%)"
                onClick={() => setShow(!show)}
                color={theme.colors.secondary}
                _hover={{
                    background: mode === "light" ? "#eee" : "#111",
                }}
            >
                {show ? <FiEye /> : <FiEyeOff />}
            </IconButton>
        </Box>
    );
});
export const PasswordStrengthMeter = ({ value }: { value: number }) => {
    const levels = ["Weak", "Medium", "Strong", "Very Strong"];
    const colors = ["red.500", "yellow.500", "green.500", "blue.500"];

    return (
        <Stack gap="1">
            <Progress.Root value={(value / 4) * 100}>
                <Progress.Track>
                    <Progress.Range />
                </Progress.Track>
            </Progress.Root>

            {value > 0 && (
                <Text fontSize="sm" color={colors[value - 1]}>
                    {levels[value - 1]}
                </Text>
            )}
        </Stack>
    );
};
