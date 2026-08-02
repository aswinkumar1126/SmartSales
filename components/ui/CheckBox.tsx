import { Checkbox, CheckboxGroup, Fieldset, For, HStack, VStack } from "@chakra-ui/react"

interface Option {
    value: string
    label: string
}

interface ModeCheckboxProps {
    mode?: "single" | "multiple"
    options: Option[]
    defaultValue?: string | string[]
    onChange?: (value: string | string[]) => void
    direction?: "vertical" | "horizontal"
    name?: string
    [key: string]: any
}

const ModeCheckbox = ({
    mode = "multiple",
    options,
    defaultValue,
    onChange,
    direction = "vertical",
    name = "checkbox-group",
    ...props
}: ModeCheckboxProps) => {

    if (mode === "single") {
        const selectedValue = defaultValue as string | undefined

        return (
            <Fieldset.Root {...props}>
                <Fieldset.Content>
                    {direction === "horizontal" ? (
                        <HStack gap={4} wrap="wrap">
                            <For each={options}>
                                {(item: Option) => (
                                    <Checkbox.Root
                                        key={item.value}
                                        checked={selectedValue === item.value}
                                        onCheckedChange={(e) => {
                                            if (e.checked === true) {
                                                onChange?.(item.value)
                                            }
                                        }}
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label>{item.label}</Checkbox.Label>
                                    </Checkbox.Root>
                                )}
                            </For>
                        </HStack>
                    ) : (
                        <VStack align="start" gap={2}>
                            <For each={options}>
                                {(item: Option) => (
                                    <Checkbox.Root
                                        key={item.value}
                                        checked={selectedValue === item.value}
                                        onCheckedChange={(e) => {
                                            if (e.checked === true) {
                                                onChange?.(item.value)
                                            }
                                        }}
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label>{item.label}</Checkbox.Label>
                                    </Checkbox.Root>
                                )}
                            </For>
                        </VStack>
                    )}
                </Fieldset.Content>
            </Fieldset.Root>
        )
    }

    const selectedValues = defaultValue as string[] | undefined

    return (
        <Fieldset.Root {...props}>
            <CheckboxGroup
                defaultValue={selectedValues}
                onValueChange={(value: string[]) => onChange?.(value)}
                name={name}
            >
                <Fieldset.Content>
                    {direction === "horizontal" ? (
                        <HStack gap={4} wrap="wrap">
                            <For each={options}>
                                {(item: Option) => (
                                    <Checkbox.Root key={item.value} value={item.value}>
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label>{item.label}</Checkbox.Label>
                                    </Checkbox.Root>
                                )}
                            </For>
                        </HStack>
                    ) : (
                        <VStack align="start" gap={2}>
                            <For each={options}>
                                {(item: Option) => (
                                    <Checkbox.Root key={item.value} value={item.value}>
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label>{item.label}</Checkbox.Label>
                                    </Checkbox.Root>
                                )}
                            </For>
                        </VStack>
                    )}
                </Fieldset.Content>
            </CheckboxGroup>
        </Fieldset.Root>
    )
}

interface SingleCheckboxProps {
    label: string
    checked?: boolean
    onChange?: (checked: boolean) => void
    size?: "xs"|"sm" | "md" | "lg"
    fontSize?:string |"xs"| "sm" | "md" | "lg"
    [key: string]: any
}

const SingleCheckbox = ({
    label,
    checked = false,
    onChange,
    size="sm",
    fontSize ="sm",
    disabled,
    ...props
}: SingleCheckboxProps) => {
    return (
        <Checkbox.Root
            checked={checked}
           onCheckedChange={(e) => onChange?.(!!e.checked)}
            {...props}
            disabled={disabled}
            size={size}

        >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label fontSize={fontSize}>{label}</Checkbox.Label>
        </Checkbox.Root>
    )
}

export { ModeCheckbox, SingleCheckbox }
export type { Option, ModeCheckboxProps, SingleCheckboxProps }
