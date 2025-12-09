"use client";

import { Flex, Image } from "@chakra-ui/react";

interface LoaderProps {
    isLoading: boolean;
    fullscreen?: boolean;
}

const Loader = ({ isLoading, fullscreen = false }: LoaderProps) => {
    if (!isLoading) return null; // 🔥 Auto-hide when false

    if (fullscreen) {
        // 🔥 Fullscreen overlay loader
        return (
            <Flex
                position="fixed"
                top={0}
                left={0}
                w="100vw"
                h="100vh"
                bg="rgba(255,255,255,0.85)"
                backdropFilter="blur(3px)"
                align="center"
                justify="center"
                zIndex={9999}
            >
                <Image src="/loader.svg" alt="Loading..." boxSize="90px" />
            </Flex>
        );
    }

    // 🔥 Inline loader (inside container)
    return (
        <Flex align="center" justify="center" w="100%" h="100%">
            <Image src="/loader.svg" alt="Loading..." boxSize="70px" />
        </Flex>
    );
};

export default Loader;
