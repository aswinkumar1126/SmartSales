import React, { useState } from "react";
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
}, ref) => {

    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<Date>(
        parseISOToDate(value) || parseISOToDate(defaultValue) || new Date()
    );

    const CustomInput = React.forwardRef<HTMLInputElement, any>(
        ({ value, onClick, onChange: dpOnChange, onBlur: dpBlur, onKeyDown: dpKeyDown, ...rest }, forwardRef) => (
            <Input
                ref={(node) => {
                    if (typeof forwardRef === "function") forwardRef(node);
                    else if (forwardRef) forwardRef.current = node;

                    if (typeof ref === "function") ref(node);
                    else if (ref)
                        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
                }}
                value={value}
                size="sm"
                autoComplete="off"
                {...rest}
                onClick={(e) => { setIsOpen(true); onClick?.(e); }}
                onFocus={(e) => { setIsOpen(true); onClick?.(e); }}
                onChange={dpOnChange}

                onBlur={(e) => { dpBlur?.(e); onBlur?.(); }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        // Confirm the currently selected date
                        onChange(formatDateToISO(selected));
                        setIsOpen(false);
                        // Move to next field
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
                portalId="root"
                popperClassName="chakra-datepicker-popper"
            />
        </Box>
    );
});

DatePickerInput.displayName = "DatePickerInput";