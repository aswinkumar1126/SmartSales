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
    HStack
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
                minH="100vh"
                bgImage="url('https://static.vecteezy.com/system/resources/previews/014/468/621/large_2x/abstract-digital-technology-background-with-concept-security-vector.jpg')"
                bgSize="cover"
                backgroundPosition='center'
                bgRepeat="no-repeat"
                display="flex"
                alignItems="center"
              
            >
                {/* Optional Dark Overlay */}
                <Box
                    position="absolute"
                
                   
                />

                {/* Carousel */}
               

                {/* Login Card */}
                <VStack
                    zIndex={1}
                    w="full"
                    maxW="420px"
                    
                    bg="whiteAlpha.900"
                    p={8}
                    borderRadius="xl"
                    boxShadow="0 0 40px rgba(15, 187, 255, 0.3)"
                    gap={4}
                    css={{ xs: { marginLeft: '0px' }, sm:{marginLeft:'80px'}}}
                >
                    {/* Title */}
                    <HStack>
                        <Box color="purple.500" bg='purple.200' p={2} rounded='full'>
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

                    {/* FORM */}
                    <VStack
                        as="form"
                        w="full"
                        onSubmit={handleSubmit(onSubmit)}
                        gap={4}
                    >
                        {/* Username */}
                        <Box w="full">
                            <Text fontSize="sm" mb={1}>Username</Text>
                            <InputGroup startElement={<LuUser />}>
                                <Input
                                    placeholder="ENTER USERNAME"
                                    size="lg"
                                    bg="white"
                                    {...register("username", {
                                        onChange: (e) => {
                                            e.target.value = e.target.value.toUpperCase();
                                        },
                                    })}
                                />
                            </InputGroup>
                        </Box>

                        {/* Password */}
                        <Box w="full">
                            <Text fontSize="sm" mb={1}>Password</Text>
                            <InputGroup startElement={<RiLockPasswordLine />}>
                                <PasswordInput
                                    placeholder="ENTER PASSWORD"
                                    size="lg"
                                    bg="white"
                                    {...register("password", {
                                        setValueAs: (value) => value?.toUpperCase(),
                                    })}
                                />
                            </InputGroup>
                        </Box>

                        {/* Button */}
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
