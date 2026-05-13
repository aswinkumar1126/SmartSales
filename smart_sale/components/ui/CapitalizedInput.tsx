"use client";

import React, { useRef ,useState } from "react";
import { Input, InputGroup, Button, Box, Image as ChakraImage } from "@chakra-ui/react";
import { capitalizeText } from "@/utils/capitalize/capitalizeText";
import { useTheme } from "@/context/theme/themeContext";
import { ICONS_MAP } from "../icon/iconsMap";

export type InputModeType =
    | "text"
    | "number"
    | "gst"
    | "mobile"
    | "aadhaar"
    | "pan"
    | "email"
    | "pincode"
    | "image" ;
type CapitalizedInputProps<T> = {
    value: string | undefined;
    field: any;
    onChange: (field: keyof T, value: any) => void;
    placeholder?: string;
    isCapitalized?: boolean;
    type?: "text" | "number" | "password" | "capitalized" | "image"; // 🔥 Added image
    disabled?: boolean;
    max?: number;
    icon?: boolean;
    size?: "2xs" | "xs" | "sm" | "md" | "lg";

    /** 🔥 NEW */
    allowNegative?: boolean;
    confirmNegative?: boolean;
    onNegativeConfirm?: () => boolean | Promise<boolean>;
    autoFocus?: any;
    onKeyDown?: any;
    onEnter?: () => void;
    inputRef?: any;
    onClassUse?: boolean;
    maxWidth?: string;
    allowDecimal?: boolean;
    allowSpecial?: boolean;
    decimalScale?: number;
    inputModeType?: InputModeType;
    rounded?: string;
    minWidth?: string;
    noBorder?: boolean;
    onBlur?: () => void;
    iconElement?: string;
    allowFocus?: boolean;

    // 🔥 NEW: Image upload props
    accept?: string; // e.g., "image/*", "image/png,image/jpeg"
    maxSize?: number; // in bytes, e.g., 5 * 1024 * 1024 for 5MB
    onImageError?: (error: string) => void;
    imagePreview?: boolean; // Show preview of uploaded image
};

export function CapitalizedInput<T>({
    value,
    field,
    onChange,
    placeholder,
    isCapitalized = true,
    type = "text",
    disabled = false,
    max,
    icon = false,
    size,
    autoFocus = false,
    allowNegative = false,
    confirmNegative = false,
    onNegativeConfirm,
    onKeyDown,
    onEnter,
    inputRef,
    onClassUse = false,
    maxWidth,
    allowDecimal = true,
    allowSpecial = false,
    decimalScale = 3,
    inputModeType,
    rounded = "sm",
    minWidth,
    noBorder,
    onBlur,
    iconElement = "",
    allowFocus = false,
    accept = "image/*", // 🔥 NEW
    maxSize = 5 * 1024 * 1024, // 🔥 NEW: 5MB default
    onImageError, // 🔥 NEW
    imagePreview = true // 🔥 NEW
}: CapitalizedInputProps<T>) {
    const { theme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [focusedValue, setFocusedValue] = useState<string | undefined>(undefined);
const isFocused = focusedValue !== undefined;

    const inputIcon = icon ? ICONS_MAP[iconElement] : null;

    // 🔥 NEW: Handle image file selection
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            onChange(field, null);
            return;
        }

        // Validate file type
        const acceptedTypes = accept.replace(/\s/g, '').split(',');
        const fileType = file.type;
        const isValidType = acceptedTypes.some(type => {
            if (type === 'image/*') return fileType.startsWith('image/');
            return fileType === type;
        });

        if (!isValidType) {
            onImageError?.(`Invalid file type. Please upload: ${accept}`);
            return;
        }

        // Validate file size
        if (file.size > maxSize) {
            const maxSizeMB = maxSize / (1024 * 1024);
            onImageError?.(`File size exceeds ${maxSizeMB}MB limit`);
            return;
        }

        // 🔥 Convert to base64 for preview and API submission
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;

            // Return both the base64 string and the original file object
            const imageData = {
                base64: base64String,
                file: file,
                name: file.name,
                size: file.size,
                type: file.type
            };

            onChange(field, imageData);
        };

        reader.onerror = () => {
            onImageError?.("Error reading file");
        };

        reader.readAsDataURL(file);
    };

    // 🔥 NEW: Handle image removal
    const handleRemoveImage = () => {
        onChange(field, null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 🔥 NEW: Render image input
    const renderImageInput = () => {
        const currentImage = value as any;
        const hasImage = currentImage && typeof currentImage === 'object' && currentImage.base64;

        return (
            <Box width="100%">
                <Box display="flex" gap={2}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept={accept}
                        disabled={disabled}
                        // style={{ display: 'none' }}
                        style={{ border: '1px solid #DDD', fontSize:'xs',padding:'5px' ,color:'#444', }}
                    
                    />
              
                  
                    {hasImage && (
                        <Button
                            onClick={handleRemoveImage}
                            disabled={disabled}
                            size={size}
                            bg="red.500"
                            color="white"
                            _hover={{ bg: "red.600" }}
                            rounded={'full'}
                        >
                            Remove
                        </Button>
                    )}
                </Box>

                {/* 🔥 Image Preview */}
                {imagePreview && hasImage && currentImage.base64 && (
                    <Box mt={2}>
                        <ChakraImage
                            src={currentImage.base64}
                            alt="Preview"
                            maxHeight="80px"
                            maxWidth="100%"
                            objectFit="cover"
                            borderRadius="md"
                        />
                    </Box>
                )}
            </Box>
        );
    };

   const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    const mode = inputModeType || type;

    /* ================== MODE VALIDATIONS ================== */

    if (mode === "mobile") {
        if (!/^[0-9]*$/.test(inputValue)) return;
        if (inputValue.length > 10) return;
    }

    if (mode === "aadhaar") {
        if (!/^[0-9]*$/.test(inputValue)) return;
        if (inputValue.length > 12) return;
    }

    if (mode === "pincode") {
        if (!/^[0-9]*$/.test(inputValue)) return;
        if (inputValue.length > 6) return;
    }

    if (mode === "pan") {
        inputValue = inputValue.toUpperCase();
        const len = inputValue.length;
        if (len <= 5 && !/^[A-Z]*$/.test(inputValue)) return;
        if (len > 5 && len <= 9 && !/^[A-Z]{5}[0-9]*$/.test(inputValue)) return;
        if (len === 10 && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(inputValue)) return;
        if (len > 10) return;
    }

    if (mode === "gst") {
        inputValue = inputValue.toUpperCase();
        const len = inputValue.length;
        if (len <= 2 && !/^[0-9]*$/.test(inputValue)) return;
        if (len > 2 && len <= 7 && !/^[0-9]{2}[A-Z]*$/.test(inputValue)) return;
        if (len > 7 && len <= 11 && !/^[0-9]{2}[A-Z]{5}[0-9]*$/.test(inputValue)) return;
        if (len === 12 && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]$/.test(inputValue)) return;
        if (len === 13 && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9]$/.test(inputValue)) return;
        if (len === 14 && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9]Z$/.test(inputValue)) return;
        if (len === 15 && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9]Z[A-Z0-9]$/.test(inputValue)) return;
        if (len > 15) return;
    }

    if (mode === "email") {
        inputValue = inputValue.toLowerCase();
        if (!/^[a-z0-9@._-]*$/.test(inputValue)) return;
        const parts = inputValue.split("@");
        if (parts.length > 2) return;
        if (parts.length === 2) {
            const domain = parts[1];
            if (!"gmail.com".startsWith(domain)) return;
        }
    }

    if (type === "number") {
        if (inputValue === "-") {
            if (!allowNegative) return;
            // ── sync focusedValue too ──
            if (isFocused) setFocusedValue("-");
            onChange(field, inputValue);
            return;
        }

        if (!allowDecimal && inputValue.includes(".")) return;

        if (allowDecimal && inputValue.includes(".")) {
            const [_, decimals] = inputValue.split(".");
            if (decimals && decimals.length > decimalScale) return;
        }

        const num = Number(inputValue);
        if (isNaN(num)) return;
        if (num < 0 && !allowNegative) return;
        if (max !== undefined && num > max) return;

        // ── keep focusedValue in sync so the input isn't frozen ──
        if (isFocused) setFocusedValue(inputValue);
        onChange(field, inputValue);
        return; // ← early return; skip the generic onChange below
    }

    if (type === "text" && max !== undefined && inputValue.length > max) {
        return;
    }

    onChange(
        field,
        isCapitalized 
            ? capitalizeText(inputValue)
            : inputValue
    );
};

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const val = (e.target as HTMLInputElement).value;

        if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
        }

        if (type === "number") {
            if (!allowDecimal && e.key === ".") {
                e.preventDefault();
            }

            if (!allowNegative && e.key === "-") {
                e.preventDefault();
            }

            if (allowDecimal && e.key === "." && val.includes(".")) {
                e.preventDefault();
            }
        }

        onKeyDown?.(e);
    };

    const formatDecimalOnBlur = (val: string, scale: number) => {
        if (!val || isNaN(Number(val))) return val;
        if (!allowFocus) return val;

        let num = Number(val);
        let formatted = num.toFixed(scale);
        return formatted;
    };

    // 🔥 Return image input for type="image"
    if (type === "image") {
        return renderImageInput();
    }

    return (
        <InputGroup startElement={inputIcon ? inputIcon : undefined}>
           <Input
    type={type === "number" ? "number" : type}
    value={isFocused ? focusedValue : (value ?? "")}
    pl={icon ? "1.8rem" : "0.2rem"}
    textTransform={isCapitalized ? "uppercase" : "none"}
    placeholder={placeholder}
    onChange={handleChange}
    disabled={disabled}
    max={type === "number" ? max : undefined}
    maxLength={type === "text" ? max : undefined}
    size={size}
    autoFocus={autoFocus}
    onKeyDown={handleKeyDown}
    onBlur={(e) => {
         setFocusedValue(undefined); 
        if (type === "number" && allowDecimal) {
            const formatted = formatDecimalOnBlur(e.target.value, decimalScale);
            onChange(field, formatted);
        }
        onBlur?.();
    }}
    ref={(el) => {
        if (inputRef) {
            if (typeof inputRef === 'function') {
                inputRef(el);
            } else if (inputRef.current !== undefined) {
                inputRef.current = el;
            }
        }
    }}
    className={onClassUse ? "type-inputs" : ""}
    maxWidth={maxWidth}
    bg={noBorder ? theme.colors.formColor : theme.colors.whiteColor}
    fontSize='xs'
    rounded={rounded}
    minWidth={minWidth}
    border="1px solid #DDD"
    textAlign={type === "number" ? "right" : "left"} // 🔥 Add this
     onFocus={(e) => {
        if (type === "number") {
            // Strip trailing zeros and leading zeros: "0.300" → "0.3", "0.000" → ""
            const raw = e.target.value;
            const num = Number(raw);
            if (!raw || isNaN(num)) {
                setFocusedValue("");
            } else if (num === 0) {
                setFocusedValue(""); // clear pure zeros so user types fresh
            } else {
                // Remove trailing zeros: "1.300" → "1.3", "2.000" → "2"
                setFocusedValue(String(parseFloat(raw)));
            }
            // Select all text after setting value
            setTimeout(() => e.target.select(), 0);
        }
    }}

    _focus={{
        border: "1px solid #FFF",
        boxShadow: "none",
        textAlign: type === "number" ? "left" : undefined, // 🔥 Align left on focus
    }}
    _hover={{
        border: "1px solid #BBB",
    }}
    css={type === "number" ? {
        WebkitAppearance: 'none',
        MozAppearance: 'textfield',
        '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
        },
        textAlign: 'right', // 🔥 Add this for right alignment when not focused
    } : undefined}
    _disabled={{
        opacity: 1,
        cursor: 'not-allowed',
        bg: noBorder ? '#ffffff' : theme.colors.greyColor,
        border: "1px solid transparent",
        color: theme.colors.green,
        fontWeight: 'bold'
    }}
/>
        </InputGroup>
    );
}