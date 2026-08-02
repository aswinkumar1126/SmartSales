// types/form/form.ts
import { SelectItem } from "@/components/ui/selectComboBox";
import { InputModeType } from "@/components/ui/CapitalizedInput";

export interface FormField {
    name: string;           // field name
    label: string;          // display label
    type: 'text' | 'select' | 'combobox' |'multiCombobox' | 'capitalized' | 'gst' | 'yesno' | 'radio' | 'number' | 'password' | 'date' | 'color' | 'currency' | 'barcode' | 'switch' |'image' | 'checkbox';
    required?: boolean;
    disabled?: boolean;
    colSpan?: number;       // for grid layout
    width?: string;

    // Common props for all input types
    size?:  "xs" | "sm" | "md" | "lg";
    placeholder?: string;
    maxWidth?: string;
    minWidth?: string;
    rounded?: string;
    fontSize?: string;

    // For text/capitalized/gst/currency/barcode inputs
    maxLength?: number;
    isCapitalized?: boolean;
    inputModeType?: InputModeType;
    allowNegative?: boolean;
    allowDecimal?: boolean;
    allowSpecial?: boolean;
    decimalScale?: number;
    icon?: boolean;
    iconElement?: string;
    noBorder?: boolean;
    autoFocus?: boolean;

    // For select/combobox inputs
    options?: SelectItem[];
    items?: SelectItem[];

    // For radio inputs
    radioOptions?: Array<{ label: string; value: string; }>;
    defaultValue?: string;

    // For date picker
    dateFormat?: string;
    maxDate?: Date|string;
    minDate?: Date | string;
    showTimeSelect?: boolean;

    // For color picker
    colorFormat?: 'hex' | 'rgb' | 'rgba';

    // For switch/toggle
    switchLabels?: { on: string; off: string };
    trueValue?: any;
    falseValue?: any;

    // For password strength
    showStrengthMeter?: boolean;

    // UI specific
    maxW?: string;
    className?: string;
    css?: any;

    // Validation
    validate?: (value: any) => string | undefined;

    dependsOn?: string;
    allowFocus?:boolean;

    maxSize ?:number
    
}