import { Badge } from "@chakra-ui/react";

export const AccountStatusBadge = ({ active }: { active: any }) => {
    const isActive =
        active === true ||
        active === "Y" ||
        active === 1 ||
        active === "ACTIVE";

    return (
        <Badge
            colorPalette={isActive ? "green" : "gray"}
            variant="subtle"
            px={3}
            py={1}
            borderRadius="full"
            textAlign="center"
            minW="90px"
        >
            {isActive ? "ACTIVE" : "INACTIVE"}
        </Badge>
    );
};