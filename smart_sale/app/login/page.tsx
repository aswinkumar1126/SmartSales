"use client"

import React, { useRef, useEffect } from "react";
import { Box, Button, VStack, Text, HStack } from "@chakra-ui/react";
import { useTheme } from "@/context/theme/themeContext";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/utils/validation/authSchema";
import { useAuth } from "@/hooks/apiHooks/auth/useAuth";
import { Toaster, toaster } from "@/components/ui/toaster";
import { RiLockPasswordLine } from 'react-icons/ri';
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { theme } = useTheme();
    const { login } = useAuth();
    const router = useRouter();

    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        usernameRef.current?.focus();
    }, []);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(loginSchema),
    });

    const onSubmit = async (formData: any) => {
        const success = await login({
            username: formData.username,
            password: formData.password,
        });

        if (!success?.success) {
            toaster.create({ type: "error", title: success.message });
            return;
        }

        toaster.create({ type: "success", title: "Login successful", duration: 1200 });
        setTimeout(() => router.replace("/"), 1500);
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        nextRef?: React.RefObject<HTMLInputElement | null>
    ) => {
        console.log(e.key,"enteringKey");
        
        if (e.key === "Enter") {
            e.preventDefault();
            if (nextRef?.current) {
                nextRef.current.focus();
            } else {
                handleSubmit(onSubmit)();
            }
        }
    };

    // ✅ Uppercase directly on the input element — no setValue, no re-render
    const handleUppercase = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pos = e.target.selectionStart;
        e.target.value = e.target.value.toUpperCase();
        e.target.setSelectionRange(pos, pos); // keep cursor position
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "8px 12px",
        borderRadius: "4px",
        border: "1px solid #CBD5E0",
        fontSize: "14px",
        outline: "none",
    };

    const { ref: usernameRHFRef, ...usernameRest } = register("username");
    const { ref: passwordRHFRef, ...passwordRest } = register("password");

    return (
        <>
            <Toaster />
            <Box
                minH="100vh"
                bgImage="url('https://static.vecteezy.com/system/resources/previews/014/468/621/large_2x/abstract-digital-technology-background-with-concept-security-vector.jpg')"
                bgSize="cover"
                backgroundPosition='center'
                bgRepeat="no-repeat"
                display="flex"
                alignItems="center"
            >
                <VStack
                    zIndex={1}
                    w="full"
                    maxW="420px"
                    bg="whiteAlpha.900"
                    p={8}
                    borderRadius="xl"
                    boxShadow="0 0 40px rgba(15, 187, 255, 0.3)"
                    gap={4}
                    css={{ xs: { marginLeft: '0px' }, sm: { marginLeft: '80px' } }}
                >
                    <HStack>
                        <Box color="purple.500" bg='purple.200' p={2} rounded='full'>
                            <RiLockPasswordLine size={20} />
                        </Box>
                        <Text fontSize="xl" fontWeight="bold" color="purple.600">
                            Secured Login
                        </Text>
                    </HStack>

                    <VStack as="form" w="full" onSubmit={handleSubmit(onSubmit)} gap={4}>

                        {/* Username */}
                        <Box w="full">
                            <Text fontSize="sm" mb={1}>Username</Text>
                            <input
                                {...usernameRest}
                                ref={(e) => {
                                    usernameRHFRef(e);              // RHF ref
                                    (usernameRef as any).current = e; // focus ref
                                }}
                                placeholder="Enter username"
                                autoComplete="off"
                                // ✅ uppercase mutates input value directly — no re-render
                                onChange={handleUppercase}
                                onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                                
                                style={inputStyle}
                            />
                            {errors.username && (
                                <Text fontSize="xs" color="red.500" mt={1}>
                                    {errors.username.message}
                                </Text>
                            )}
                        </Box>

                        {/* Password */}
                        <Box w="full">
                            <Text fontSize="sm" mb={1}>Password</Text>
                            <input
                                {...passwordRest}
                                ref={(e) => {
                                    passwordRHFRef(e);              // RHF ref
                                    (passwordRef as any).current = e; // focus ref
                                }}
                                type="password"
                                placeholder="Enter password"
                                autoComplete="current-password"
                                // ✅ uppercase mutates input value directly — no re-render
                                onChange={handleUppercase}
                                onKeyDown={(e) => handleKeyDown(e)} // Enter → submit
                                style={inputStyle}
                            />
                            {errors.password && (
                                <Text fontSize="xs" color="red.500" mt={1}>
                                    {errors.password.message}
                                </Text>
                            )}
                        </Box>

                        <Button
                            type="submit"
                            w="full"
                            bg="purple.600"
                            color="white"
                            h="40px"
                            borderRadius="lg"
                            loading={isSubmitting}
                        >
                            Proceed
                        </Button>
                    </VStack>
                </VStack>
            </Box>
        </>
    );
}