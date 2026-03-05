// component/form/DynamicForm.tsx
import React,{useState} from 'react';
import { Box, Grid ,Text } from "@chakra-ui/react";


import { CapitalizedInput } from '@/components/ui/CapitalizedInput';
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";
import RadioButton from '@/components/ui/RadioButton';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthMeter } from '@/components/ui/password-input';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { ColorPickerInput } from '@/components/ui/ColorPickerInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { BarcodeInput } from '@/components/ui/BarcodeInput';
import { SwitchInput } from '@/components/ui/SwitchInput';



import { FormField } from '@/types/form/form';


interface DynamicFormProps {
    fields: FormField[];
    formData: Record<string, any>;
    onChange: (field: string | number, value: any) => void;
    register: (name: string) => (el: any) => void;
    focusNext: (name: string) => void;
    disabled?: Record<string, boolean | undefined>;
    errors?: Record<string, string>; // Add errors prop
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
    fields,
    formData,
    onChange,
    register,
    focusNext,
    disabled = {},
    errors = {} // Default to empty object
}) => {

    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleKeyDown = (e: React.KeyboardEvent, fieldName: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            focusNext(fieldName);
        }
    };

    const handleBlur = (fieldName: string) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
    };

    const renderField = (field: FormField) => {
        const isDisabled = disabled[field.name] || field.disabled;
        const showError = touched[field.name] && errors[field.name];

        // Register ref function
        const setRef = (el: any) => {
            if (el) {
                register(field.name)(el);
            }
        };

        const fieldComponent = () => {
            switch (field.type) {

            case 'radio':
                return (
                    <RadioButton
                        key={field.name}
                        ref={setRef}
                        collection={field.options || []}
                        value={formData[field.name] || ''}
                        onChange={(val) => onChange(field.name, val)}
                        isDisabled={isDisabled}
                        size={field.size as any}
                        defaultValue={field.defaultValue}
                        onKeyDown={(e) => handleKeyDown(e, field.name)}
                        onBlur={() => handleBlur(field.name)}
                    />
                );

            case 'select':
                return (
                    <NativeSelectWrapper
                        key={field.name}
                        ref={setRef}
                        value={formData[field.name] || ''}
                        disabled={isDisabled}
                        size={field.size || "xs"}
                        placeholder={field.placeholder || `Select ${field.label}`}
                        maxW={field.maxW || field.maxWidth || field.width}
                        // rounded={field.rounded}
                        fontSize={field.fontSize || "10px"}
                        className={field.className}
                        css={field.css}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        items={field.options || field.options || []}
                        onEnter={() => focusNext(field.name)}
                        onBlur={() => handleBlur(field.name)}
                    />
                );

            case 'combobox':
                return (
                    <SelectCombobox
                        key={field.name}
                        ref={setRef}
                        value={formData[field.name] || ''}
                 
                        // size={field.size || "xs"}
                        placeholder={field.placeholder || `Select ${field.label}`}
                        rounded={field.rounded}
                        // className={field.className}
                        // css={field.css}
                        onChange={(val) => onChange(field.name, val)}
                        items={field.options  || []}
                        disable={isDisabled}
                        onEnter={() => focusNext(field.name)}
                        onKeyDown={(e) => handleKeyDown(e, field.name)}
                        onBlur={() => handleBlur(field.name)}
                    />
                );
                case 'password':
                    return (
                        <Box width="100%">
                            <PasswordInput
                                key={field.name}
                                ref={setRef}
                                value={formData[field.name] || ''}
                                onChange={(e) => onChange(field.name, e.target.value)}
                                disabled={isDisabled}
                                size={field.size || "sm"}
                                placeholder={field.placeholder || "Enter password"}
                                maxLength={field.maxLength}
                                onBlur={() => handleBlur(field.name)}
                                onKeyDown={(e) => handleKeyDown(e, field.name)}
                                autoFocus={field.autoFocus}
                            />
                            {field.showStrengthMeter && formData[field.name] && (
                                <PasswordStrengthMeter value={Math.min(4, formData[field.name].length)} />
                            )}
                        </Box>
                    );

                case 'date':
                    return (
                        <DatePickerInput
                            key={field.name}
                            ref={setRef}
                            value={formData[field.name]}
                            onChange={(val) => onChange(field.name, val)}
                            disabled={isDisabled}
                            placeholder={field.placeholder || "dd-mm-yyyy"}
                            dateFormat={field.dateFormat || "dd-MM-yyyy"}
                            maxDate={field.maxDate}
                            minDate={field.minDate}
                            showTimeSelect={field.showTimeSelect}
                            onBlur={() => handleBlur(field.name)}
                            onKeyDown={(e) => handleKeyDown(e, field.name)}
                        />
                    );

                case 'color':
                    return (
                        <ColorPickerInput
                            key={field.name}
                            ref={setRef}
                            value={formData[field.name] || '#000000'}
                            onChange={(val) => onChange(field.name, val)}
                            disabled={isDisabled}
                            placeholder={field.placeholder || "Pick a color"}
                            onBlur={() => handleBlur(field.name)}
                            onKeyDown={(e) => handleKeyDown(e, field.name)}
                        />
                    );

                case 'currency':
                    return (
                        <CurrencyInput
                            key={field.name}
                            ref={setRef}
                            value={formData[field.name] || ''}
                            onChange={(val) => onChange(field.name, val)}
                            disabled={isDisabled}
                            size={field.size || "sm"}
                            placeholder={field.placeholder || "0.00"}
                            maxLength={field.maxLength}
                            decimalScale={field.decimalScale || 2}
                            onBlur={() => handleBlur(field.name)}
                            onKeyDown={(e) => handleKeyDown(e, field.name)}
                            autoFocus={field.autoFocus}
                        />
                    );

                case 'barcode':
                    return (
                        <BarcodeInput
                            key={field.name}
                            ref={setRef}
                            value={formData[field.name] || ''}
                            onChange={(val) => onChange(field.name, val)}
                            disabled={isDisabled}
                            size={field.size || "sm"}
                            placeholder={field.placeholder || "Scan barcode..."}
                            maxLength={field.maxLength || 50}
                            onBlur={() => handleBlur(field.name)}
                            onKeyDown={(e) => handleKeyDown(e, field.name)}
                            autoFocus={field.autoFocus}
                        />
                    );

                case 'switch':
                    return (
                        <SwitchInput
                            key={field.name}
                            ref={setRef}
                            value={formData[field.name]}
                            onChange={(val) => onChange(field.name, val)}
                            disabled={isDisabled}
                            trueValue={field.trueValue !== undefined ? field.trueValue : true}
                            falseValue={field.falseValue !== undefined ? field.falseValue : false}
                            labels={field.switchLabels || { on: 'YES', off: 'NO' }}
                            size={field.size || "sm"}
                            onBlur={() => handleBlur(field.name)}
                        />
                    );

         
            case 'number':
            case 'text':
            default:
                return (
                    <CapitalizedInput
                        key={field.name}
                        inputRef={setRef}
                        field={field.name}
                        value={formData[field.name] || ''}
                        onChange={onChange} // Pass the original onChange that expects (field, value)
                        disabled={isDisabled}
                        size={field.size || "xs"}
                        placeholder={field.placeholder}
                        maxWidth={field.maxWidth || field.maxW || field.width}
                        minWidth={field.minWidth}
                        rounded={field.rounded}
                        // fontSize={field.fontSize}
                        // className={field.className}
                        // css={field.css}
                        max={field.maxLength}
                        isCapitalized={field.isCapitalized}
                        inputModeType={field.inputModeType}
                        allowNegative={field.allowNegative}
                        allowDecimal={field.allowDecimal}
                        allowSpecial={field.allowSpecial}
                        decimalScale={field.decimalScale}
                        icon={field.icon}
                        noBorder={field.noBorder}
                        autoFocus={field.autoFocus}
                        onEnter={() => focusNext(field.name)}
                        onKeyDown={(e:any) => handleKeyDown(e, field.name)}
                        onBlur={() => handleBlur(field.name)}
                        iconElement={field.iconElement}
                    />
                );
        };
      
    };
        return (
            <Box width="100%">
                {fieldComponent()}
                {showError && (
                    <Text color="red.500" fontSize="2xs" mt={1} ml={1}>
                        {errors[field.name]}
                    </Text>
                )}
            </Box>
        );
    }

    return (
        <Grid gap={2}>
            {fields.map((field) => (
                <Box
                    key={field.name}
                    display="flex"
                    alignItems="flex-start"
                    gap={2}
                    gridColumn={field.colSpan ? `span ${field.colSpan}` : undefined}
                >
                    <Box minW="120px" fontSize="xs" pt={2}>
                        {field.label} {field.required && <span style={{ color: 'red'  ,fontSize:'14px'}}>*</span>} 
                    </Box>
                    <Box flex="1">
                        {renderField(field)}
                    </Box>
                </Box>
            ))}
        </Grid>
    );
};