// components/ui/DatePickerInput.tsx
import React from 'react';
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
    onKeyDown?: (e: React.KeyboardEvent) => void;
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

export const DatePickerInput = React.forwardRef<HTMLInputElement, DatePickerInputProps>(({
    value,
    onChange,
    disabled = false,
    placeholder = "dd-mm-yyyy",
    dateFormat = "dd-MM-yyyy",
    maxDate,
    minDate,
    showTimeSelect = false,
    onBlur,
    onKeyDown
}, ref) => {
    return (
        <Box w="full">
            <DatePicker
                selected={parseISOToDate(value || undefined)}
                onChange={(date: Date | null) => {
                    if (!date) return;
                    onChange(formatDateToISO(date));
                }}
                disabled={disabled}
                maxDate={maxDate}
                minDate={minDate}
                dateFormat={dateFormat}
                showTimeSelect={showTimeSelect}
                placeholderText={placeholder}
                customInput={<Input ref={ref} size="sm" onBlur={onBlur} onKeyDown={onKeyDown} />}
                className="w-full"
            />
        </Box>
    );
});

DatePickerInput.displayName = 'DatePickerInput';