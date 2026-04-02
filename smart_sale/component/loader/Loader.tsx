"use client";

import { Flex, Image ,VStack ,Text} from "@chakra-ui/react";

interface LoaderProps {
    isLoading: boolean;
    fullscreen?: boolean;
    content?:string
}

const Loader = ({ isLoading, fullscreen = false , content   }: LoaderProps) => {
    if (!isLoading) return null;

    if (fullscreen) {
        return (
            <Flex
                position="fixed"
                inset={0}                 // ✅ covers full screen
                bg="rgba(255, 255, 255, 1)"
                backdropFilter="blur(6px)"
                css={{
                    WebkitBackdropFilter: "blur(6px)", // ✅ Safari support
                }}
                align="center"
                justify="center"
                zIndex={9999}
                pointerEvents="all"       // ✅ block clicks behind
                transition="all 0.2s ease-in-out"
            >
                <VStack spaceX={3}>
                    <Image
                        src="/loader.svg"
                        alt="Loading..."
                        boxSize="90px"
                        draggable={false}
                    />

                    <Text
                        fontSize="sm"
                        color="gray.600"
                        textAlign="center"
                        fontWeight="medium"
                    >
                        {content}
                    </Text>
                </VStack>
            </Flex>
        );
    }

    // 🔹 Inline loader
    return (
        <Flex
            align="center"
            justify="center"
            w="100%"
            h="100%"
            minH="150px"
        >
            <VStack spaceY={3}>
                <Image
                    src="/loader.svg"
                    alt="Loading..."
                    boxSize="90px"
                    draggable={false}
                />

                <Text
                    fontSize="sm"
                    color="gray.600"
                    textAlign="center"
                    fontWeight="medium"
                >
                    {content}
                </Text>
            </VStack>
        </Flex>
    );
};

export default Loader;
