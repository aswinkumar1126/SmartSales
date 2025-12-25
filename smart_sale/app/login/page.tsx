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
    InputGroup,
} from "@chakra-ui/react";

import { useTheme } from "@/context/theme/themeContext";
import { fontVariables } from "@/context/theme/font";
import { Carousel } from "@chakra-ui/react";
import { PasswordInput } from "@/components/ui/password-input";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/utils/validation/authSchema";

import { useAuth } from "@/hooks/auth/useAuth";

import { Toaster, toaster } from "@/components/ui/toaster";
import { LuUser } from "react-icons/lu";
import { RiLockPasswordLine } from 'react-icons/ri'
import { useRouter } from "next/navigation";


export default function LoginPage() {
    const { theme } = useTheme();
    const { login } = useAuth();
    const router =useRouter();
      const carouselImages = [
        "https://www.canadianminingjournal.com/wp-content/uploads/2021/09/Polyus_Olympiada_20180915_img_7698.jpg",
        "https://cdn1.matadornetwork.com/blogs/1/2022/11/alaska-gold-pan-close-up.jpg",
        "https://www.goldmarket.fr/wp-content/uploads/2025/09/44dd529dthumbnail-1110x550.jpeg.webp",
        "https://img.freepik.com/premium-photo/molten-gold-being-carefully-poured-into-mold_68708-11243.jpg",
        "https://media.istockphoto.com/id/617896650/photo/craft-jewelery-making.jpg?s=612x612&w=0&k=20&c=UFruy7o2mUEXsHVEWZ8kxv-eSuX_rxiJ6c4yvOtwWuU="
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
        const success = await login({
            username: formData.username,
            password: formData.password,
        });
        console.log(success,'success');

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
        });

        router.replace("/");
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
                                <Box w="full">
                                    <Text fontSize="sm" fontWeight="500" mb={1}>
                                        Login Name
                                    </Text>
                                    <InputGroup startElement={<LuUser />} >
                                    <Input
                                        placeholder="Enter Your Login Name"
                                        size="lg"
                                        bg="white"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        color="black"
                                        _focus={{
                                            borderColor: "purple.400",
                                            boxShadow: "0 0 0 1px var(--chakra-colors-purple-400)",
                                        }}
                                        {...register("username")}
                                    />
                                    </InputGroup>

                                    {errors.username && (
                                        <Text fontSize="xs" color="red.500" mt={1}>
                                            {errors.username.message}
                                        </Text>
                                    )}
                                </Box>

                                {/* Password */}
                                <Box w="full">
                                    <Text fontSize="sm" fontWeight="500" mb={1}>
                                        Password
                                    </Text>
                                    <InputGroup startElement = {<RiLockPasswordLine />} >
                                    <PasswordInput
                                        placeholder="Enter Your Password"
                                        size="lg"
                                        bg="white"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        color="black"
                                        _focus={{
                                            borderColor: "purple.400",
                                            boxShadow: "0 0 0 1px var(--chakra-colors-purple-400)",
                                        }}
                                        {...register("password")}
                                    />
                                    </InputGroup>

                                    {errors.password && (
                                        <Text fontSize="xs" color="red.500" mt={1}>
                                            {errors.password.message}
                                        </Text>
                                    )}
                                </Box>


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
