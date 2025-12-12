"use client";

import React from "react";
import {
    Box,
    Button,
    Input,
    VStack,
    Text,
    Grid,
    GridItem,
} from "@chakra-ui/react";

import { useTheme } from "@/context/theme/themeContext";
import { fontVariables } from "@/context/theme/font";
import { Carousel } from "@chakra-ui/react";
import { PasswordInput } from "@/components/ui/password-input";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/utils/validation/authSchema";

import { authService } from "@/service/AuthService";
import { useAuth } from "@/hooks/auth/useAuth";

import { Toaster, toaster } from "@/components/ui/toaster";

export default function LoginPage() {
    const { theme } = useTheme();
    const { login } = useAuth();

    const carouselImages = [
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
        "https://images.unsplash.com/photo-1540206395-68808572332f?w=1200",
        "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200",
    ];

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(loginSchema),
    });

    // Handle submit
    const onSubmit = async (formData: any) => {
        const res = await authService.login({
            username: formData.username,
            password: formData.password,
        });

        if (!res.success) {
            toaster.create({
                type: "error",
                title: res.message || "Login failed",
            });
            return;
        }
        console.log(res?.data)
        const token = res.data?.USERID;
        if (!token) {
            toaster.create({
                type: "error",
                title: "Token missing in response",
            });
            return;
        }

        await login(token);

        toaster.create({
            type: "success",
            title: "Login successful",
        });

        window.location.href = "/";
    };

    return (
        <>
            <Toaster />

            <Box
                className={fontVariables}
                fontFamily="var(--font-lustria)"
                bg={theme.colors.primary}
                color={theme.colors.secondary}
                minH="100vh"
                overflow="hidden"
            >
                <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} h="100vh">
                    {/* LEFT — LOGIN FORM */}
                    <GridItem
                        display="flex"
                        alignItems="center"
                        flexDirection="column"
                        justifyContent="center"
                        p={{ base: 4, md: 8 }}
                        gap={2}
                    >
                        <VStack
                            w="full"
                            maxW="500px"
                            bg="whiteAlpha.900"
                            p={{ base: 6, md: 10 }}
                            borderRadius="xl"
                            border="1px solid #eef"
                            boxShadow="0 0 30px rgba(212, 212, 212, 0.2)"
                        >
                            <Text
                                fontFamily="var(--font-nosifer)"
                                fontSize={{ base: "20px", md: "24px" }}
                                color="rgba(154, 12, 170, 1)"
                                textShadow="0 0 15px rgba(154, 12, 170, 1)"
                                textAlign="center"
                            >
                                Welcome Back
                            </Text>

                            <VStack
                                as="form"
                                width="full"
                                onSubmit={handleSubmit(onSubmit)}
                                gap={4}
                            >
                                {/* Login Name */}
                                <div className="w-full">
                                    <label className="text-sm font-medium">
                                        Login Name
                                    </label>

                                    <Input
                                        placeholder="Enter Your Login Name"
                                        size="lg"
                                        bg="#fff"
                                        border="1px solid #eee"
                                        color="black"
                                        {...register("username")}
                                    />

                                    {errors.username && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.username.message}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="w-full">
                                    <label className="text-sm font-medium">
                                        Password
                                    </label>

                                    <PasswordInput
                                        placeholder="Enter Your Password"
                                        size="lg"
                                        bg="#fff"
                                        border="1px solid #eee"
                                        color="black"
                                        {...register("password")}
                                    />

                                    {errors.password && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>

                                {/* BUTTON */}
                                <Button
                                    type="submit"
                                    w="full"
                                    bg="rgba(154, 12, 170, 1)"
                                    color="white"
                                    fontFamily="var(--font-sofia)"
                                    fontSize="16px"
                                    h="40px"
                                    borderRadius="lg"
                                    loading={isSubmitting}
                                >
                                    Sign In
                                </Button>
                            </VStack>
                        </VStack>
                    </GridItem>

                    {/* RIGHT — IMAGE */}
                    <GridItem display="flex" alignItems="center" justifyContent="center">
                        <Carousel.Root
                            autoplay={{ delay: 3000 }}
                            slideCount={carouselImages.length}
                            mx="auto"
                            maxW="full"
                            p={4}
                            loop
                        >
                            <Carousel.ItemGroup>
                                {carouselImages.map((img, index) => (
                                    <Carousel.Item key={index} index={index}>
                                        <Box
                                            w="100%"
                                            h={{ base: "200px", md: "400px" }}
                                            overflow="hidden"
                                        >
                                            <img
                                                src={img}
                                                width="100%"
                                                height="100%"
                                                draggable={false}
                                                style={{ objectFit: "cover" }}
                                            />
                                        </Box>
                                    </Carousel.Item>
                                ))}
                            </Carousel.ItemGroup>
                        </Carousel.Root>
                    </GridItem>
                </Grid>
            </Box>
        </>
    );
}
