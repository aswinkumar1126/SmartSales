import { HStack, RadioGroup } from "@chakra-ui/react";

interface RadioOption {
    value: string;
    label: string;
}

interface RadioProps {
    collection: RadioOption[];
    value: string;
    onChange: (value: string) => void;
    isDisabled?: boolean;
    defaultValue?: string;
    size?: "xs" |"sm" | "md" | "lg";
}

export const RadioButton = ({
    collection,
    value,
    onChange,
    isDisabled = false,
    defaultValue,
    size
}: RadioProps) => {


    console.log(defaultValue,'defaultValue')
    return (
        <RadioGroup.Root
            value={value}
            onValueChange={(e) => e.value && onChange(e.value)}
            disabled={isDisabled}
            defaultValue={defaultValue}
            size={size}
        >
            <HStack gap="6" flexWrap="wrap">
                {collection.map((item) => (
                    <RadioGroup.Item key={item.value} value={item.value}>
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText fontSize="x-small">{item.label}</RadioGroup.ItemText>
                    </RadioGroup.Item>
                ))}
            </HStack>
        </RadioGroup.Root>
    );
};