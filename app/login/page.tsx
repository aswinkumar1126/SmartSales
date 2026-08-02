"use client";

import React, { useRef, useEffect, useState } from "react";
import { Box, Button, VStack, Text, HStack } from "@chakra-ui/react";
import { useTheme } from "@/context/theme/themeContext";
import { useAuth } from "@/hooks/apiHooks/auth/useAuth";
import { Toaster, toaster } from "@/components/ui/toaster";
import { RiLockPasswordLine } from "react-icons/ri";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { theme } = useTheme();
    const { login } = useAuth();
    const router = useRouter();

    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({
        username: "",
        password: "",
    });

    useEffect(() => {
        usernameRef.current?.focus();
    }, []);

    const validate = () => {
        const newErrors = {
            username: "",
            password: "",
        };

        let valid = true;

        if (!username.trim()) {
            newErrors.username = "Username is required";
            valid = false;
        }

        if (!password.trim()) {
            newErrors.password = "Password is required";
            valid = false;
        }

        setErrors(newErrors);

        return valid;
    };

    const onSubmit = async () => {
        if (!validate()) return;

        try {
            setLoading(true);

            const success = await login({
                username,
                password,
            });

            if (!success?.success) {
                toaster.create({
                    type: "error",
                    title: success.message,
                });

                return;
            }

            toaster.create({
                type: "success",
                title: "Login successful",
                duration: 1200,
            });

            setTimeout(() => {
                router.replace("/");
            }, 1500);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyUp = (
        e: React.KeyboardEvent<HTMLInputElement>,
        nextRef?: React.RefObject<HTMLInputElement | null>
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();

            // move focus
            if (nextRef?.current) {
                nextRef.current.focus();
                return;
            }

            // last field -> submit
            submitBtnRef.current?.click();
        }
    };

    const handleUppercase = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        setter(e.target.value.toUpperCase());
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "8px 12px",
        borderRadius: "4px",
        border: "1px solid #CBD5E0",
        fontSize: "14px",
        outline: "none",
    };

    return (
        <>
            <Toaster />

            <Box
                minH="100vh"
                bgImage="url('https://static.vecteezy.com/system/resources/previews/014/468/621/large_2x/abstract-digital-technology-background-with-concept-security-vector.jpg')"
                bgSize="cover"
                backgroundPosition="center"
                bgRepeat="no-repeat"
                display="flex"
                alignItems="center"
            >
                <VStack
                    zIndex={1}
                    w="full"
                    maxW="420px"
                    bg="whiteAlpha.900"
                    p={6}
                    borderRadius="xl"
                    boxShadow="0 0 40px rgba(15, 187, 255, 0.3)"
                    gap={4}
                    css={{
                        xs: { marginLeft: "0px" },
                        sm: { marginLeft: "80px" },
                    }}
                >
                    <HStack>
                        <Box
                            color="purple.500"
                            bg="purple.200"
                            p={2}
                            rounded="full"
                        >
                            <RiLockPasswordLine size={20} />
                        </Box>

                        <Text
                            fontSize="xl"
                            fontWeight="bold"
                            color="purple.600"
                        >
                            Secured Login
                        </Text>
                    </HStack>

                    <Box
                        as="form"
                        display="flex"
                        flexDirection="column"
                        gap={4}
                        onSubmit={(e: React.FormEvent) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                        width={'full'}
                    >
                        {/* Username */}
                        <Box w="full">
                            <Text fontSize="sm" mb={1}>
                                Username
                            </Text>

                            <input
                                ref={usernameRef}
                                value={username}
                                placeholder="Enter username"
                                autoComplete="off"
                                onChange={(e) =>
                                    handleUppercase(e, setUsername)
                                }
                                onKeyDown={(e) =>
                                    handleKeyUp(e, passwordRef)
                                }
                                style={inputStyle}
                            />

                            {errors.username && (
                                <Text
                                    fontSize="xs"
                                    color="red.500"
                                    mt={1}
                                >
                                    {errors.username}
                                </Text>
                            )}
                        </Box>

                        {/* Password */}
                        <Box w="full">
                            <Text fontSize="sm" mb={1}>
                                Password
                            </Text>

                            <input
                                ref={passwordRef}
                                value={password}
                                type="password"
                                placeholder="Enter password"
                                autoComplete="current-password"
                                onChange={(e) =>
                                    handleUppercase(e, setPassword)
                                }
                                onKeyDown={(e) => handleKeyUp(e)}
                                style={inputStyle}
                            />

                            {errors.password && (
                                <Text
                                    fontSize="xs"
                                    color="red.500"
                                    mt={1}
                                >
                                    {errors.password}
                                </Text>
                            )}
                        </Box>

                        <Button
                            ref={submitBtnRef}
                            type="submit"
                            w="full"
                            bg="purple.600"
                            color="white"
                            h="40px"
                            borderRadius="lg"
                            loading={loading}
                        >
                            Proceed
                        </Button>
                    </Box>
                </VStack>
            </Box>
        </>
    );
}