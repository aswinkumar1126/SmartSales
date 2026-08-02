"use client";

import * as React from "react";
import {
    Input,
    IconButton,
    InputProps,
    Box,
} from "@chakra-ui/react";
import { FiMenu, FiEye, FiEyeOff } from "react-icons/fi";

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
    function PasswordInput(props, ref) {
        const [show, setShow] = React.useState(false);

        return (
            <Box position="relative" w="full">
                <Input
                    ref={ref}
                    type={show ? "text" : "password"}
                    pr="3rem"
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
                >    {show ? <FiEye /> : <FiEyeOff />} </IconButton>
            </Box>
        );
    }
);
