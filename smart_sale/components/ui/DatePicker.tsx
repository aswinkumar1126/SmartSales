import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Box, Input } from "@chakra-ui/react";

interface DatePickerInputProps {
    value?: string | null;
    onChange: (date: string) => void;
    disabled?: boolean;
    placeholder?: string;
    dateFormat?: string;
    maxDate?: Date | string;
    minDate?: Date | string;
    showTimeSelect?: boolean;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    defaultValue?: string;
    maxWidth?: string;
    isRoot?: boolean;
    onDateSelect?: () => void; // New prop to handle moving to next field
}

const parseISOToDate = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
};

const formatDateToISO = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
};

const parseDate = (date?: string | Date | null) => {
    if (!date) return null;
    return date instanceof Date ? date : new Date(date);
};

export const DatePickerInput = React.forwardRef<
    HTMLInputElement,
    DatePickerInputProps
>(({
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
    defaultValue,
    maxWidth = "200px",
    isRoot = false,
    onDateSelect,
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<Date>(
        parseISOToDate(value) || parseISOToDate(defaultValue) || new Date()
    );
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const parsed = parseISOToDate(value);
        if (parsed) {
            setSelected(parsed);
        }
    }, [value]);

    // Helper function to focus on next focusable element
    const focusNextField = () => {
        if (inputRef.current) {
            // Get all focusable elements in the form
            const focusableElements = document.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            // Find current index
            const currentIndex = Array.from(focusableElements).indexOf(inputRef.current);

            // Focus on next element if exists
            if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
                const nextElement = focusableElements[currentIndex + 1] as HTMLElement;
                nextElement.focus();
            }
        }
    };

    const CustomInput = React.forwardRef<HTMLInputElement, any>(
        ({ value, onClick, onChange: dpOnChange, onBlur: dpBlur, onKeyDown: dpKeyDown, ...rest }, forwardRef) => (
            <Input
                ref={(node) => {
                    if (typeof forwardRef === "function") forwardRef(node);
                    else if (forwardRef) forwardRef.current = node;

                    if (typeof ref === "function") ref(node);
                    else if (ref)
                        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;

                    if (inputRef) inputRef.current = node;
                }}
                value={value}
                size="sm"
                autoComplete="on"
                {...rest}
                onClick={(e) => { setIsOpen(true); onClick?.(e); }}
                // onFocus={(e) => { setIsOpen(true); onClick?.(e); }}
                onChange={dpOnChange}
                onBlur={(e) => { dpBlur?.(e); onBlur?.(); }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        onChange(formatDateToISO(selected));
                        setIsOpen(false);
                        focusNextField(); // Focus next field on Enter
                        onKeyDown?.(e);
                        return;
                    }
                    dpKeyDown?.(e);
                }}
            />
        )
    );
    CustomInput.displayName = "CustomDateInput";

    return (
        <Box w="full" maxW={maxWidth}>
            <DatePicker
                selected={selected}
                onChange={(date: Date | null) => {
                    if (!date) return;
                    setSelected(date);
                    onChange(formatDateToISO(date));
                    setIsOpen(false);

                    // Move focus to next field after date selection
                    setTimeout(() => {
                        focusNextField();
                        onDateSelect?.(); // Optional callback
                    }, 0);
                }}
                open={isOpen}
                onClickOutside={() => setIsOpen(false)}
                disabled={disabled}
                maxDate={parseDate(maxDate) || undefined}
                minDate={parseDate(minDate) || undefined}
                dateFormat={dateFormat}
                showTimeSelect={showTimeSelect}
                placeholderText={placeholder}
                customInput={<CustomInput />}
                popperPlacement="bottom-start"
                portalId={isRoot ? "root" : ''}
                popperClassName="chakra-datepicker-popper"
                popperContainer={({ children }) => children}
            />
        </Box>
    );
});

DatePickerInput.displayName = "DatePickerInput";