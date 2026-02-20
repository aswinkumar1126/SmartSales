import React from "react";
import { IconButton } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { getStorage } from "@/utils/storage/storage";

type Props = {
    id: string | number;
    mutate: (id: string | number) => void;
    size?: "xs" | "sm" | "md" | "lg";
};

const DeleteAction: React.FC<Props> = ({ id, mutate, size = "sm" }) => {
    const isAdmin = getStorage<string>("admin") ?? "N";

    // not admin → render nothing
    if (isAdmin !== "Y") return null;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // prevents row click navigation
        mutate(id);
    };

    return (
        <Tooltip content="Delete">
            <IconButton
                aria-label="delete"
                size={size}
                colorScheme="red"
                variant="ghost"
                onClick={handleDelete}
            >     <Trash2 size={16} /> </IconButton>
        </Tooltip>
    );
};

export default DeleteAction;
