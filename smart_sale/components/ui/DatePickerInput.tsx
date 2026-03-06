// components/ui/DatePickerInput.tsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Box, Input } from "@chakra-ui/react";

interface DatePickerInputProps {
    value: string | null;
    onChange: (date: string) => void;
    disabled?: boolean;
    placeholder?: string;
    dateFormat?: string;
    maxDate?: Date;
    minDate?: Date;
    showTimeSelect?: boolean;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const parseISOToDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
};

const formatDateToISO = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
};

export const DatePickerInput = React.forwardRef<
    HTMLInputElement,
    DatePickerInputProps
>(
    (
        {
            value,
            onChange,
            disabled = false,
            placeholder = "dd-mm-yyyy",
            dateFormat = "dd-MM-yyyy",
            maxDate,
            minDate,
            showTimeSelect = false,
            onBlur,
            onKeyDown,
        },
        ref
    ) => {

        const [isOpen, setIsOpen] = useState(false);

        /**
         * Custom Chakra Input
         */
        const CustomInput = React.forwardRef<HTMLInputElement, any>(
            (
                { value, onClick, onChange, onBlur: dpBlur, onKeyDown: dpKeyDown, ...rest },
                forwardRef
            ) => {
                return (
                    <Input
                        ref={(node) => {
                            if (typeof forwardRef === "function") forwardRef(node);
                            else if (forwardRef) forwardRef.current = node;

                            if (typeof ref === "function") ref(node);
                            else if (ref)
                                (ref as React.MutableRefObject<HTMLInputElement | null>).current =
                                    node;
                        }}
                        value={value}
                        size="sm"
                        autoComplete="off"
                        {...rest}
                        onClick={(e) => {
                            setIsOpen(true);
                            onClick?.(e);
                        }}
                        onChange={onChange}
                        onBlur={(e) => {
                            dpBlur?.(e);
                            onBlur?.();
                        }}
                        onKeyDown={(e) => {

                            if (e.key === "Enter") {
                                e.preventDefault();

                                // close calendar
                                setIsOpen(false);

                                // move to next field
                                onKeyDown?.(e);
                                return;
                            }

                            dpKeyDown?.(e);
                        }}
                    />
                );
            }
        );

        CustomInput.displayName = "CustomDateInput";

        return (
            <Box w="full">
                <DatePicker
                    selected={parseISOToDate(value || undefined)}
                    onChange={(date: Date | null) => {
                        if (!date) return;

                        onChange(formatDateToISO(date));

                        // close after selecting
                        setIsOpen(false);
                    }}
                    open={isOpen}
                    onClickOutside={() => setIsOpen(false)}
                    disabled={disabled}
                    maxDate={maxDate}
                    minDate={minDate}
                    dateFormat={dateFormat}
                    showTimeSelect={showTimeSelect}
                    placeholderText={placeholder}
                    customInput={<CustomInput />}
                    popperPlacement="bottom-start"
                    portalId="root"
                    popperClassName="chakra-datepicker-popper"
                />
            </Box>
        );
    }
);

DatePickerInput.displayName = "DatePickerInput";