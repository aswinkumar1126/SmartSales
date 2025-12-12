"use client"
import { Carousel, IconButton, Box } from "@chakra-ui/react"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"

const items = Array.from({ length: 5 })


export default function User(){
    return (
        <Carousel.Root slideCount={items.length} maxW="md" mx="auto">
            <Carousel.ItemGroup>
                {items.map((_, index) => (
                    <Carousel.Item key={index} index={index}>
                        <Box w="100%" h="300px" rounded="lg" fontSize="2.5rem" background="#000">
                            {index + 1}
                        </Box>
                    </Carousel.Item>
                ))}
            </Carousel.ItemGroup>

            <Carousel.Control justifyContent="center" gap="4">
                <Carousel.PrevTrigger asChild>
                    <IconButton size="xs" variant="ghost">
                        <LuChevronLeft />
                    </IconButton>
                </Carousel.PrevTrigger>

                <Carousel.Indicators />

                <Carousel.NextTrigger asChild>
                    <IconButton size="xs" variant="ghost">
                        <LuChevronRight />
                    </IconButton>
                </Carousel.NextTrigger>
            </Carousel.Control>
        </Carousel.Root>
    )
}
