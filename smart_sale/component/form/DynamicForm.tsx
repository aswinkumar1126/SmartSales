// component/form/DynamicForm.tsx
import React,{useState} from 'react';
import { Box, Grid ,Text ,Stack } from "@chakra-ui/react";


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
import { SingleCheckbox } from '@/components/ui/CheckBox';


interface DynamicFormProps {
    fields: FormField[];
    formData: Record<string, any>;
    onChange: (field: any, value: any) => void;
    register: (name: string) => (el: any) => void;
    focusNext: (name: string) => void;
    disabled?: Record<string, boolean | undefined>;
    errors?: Record<string, string>; 
    layout?: "vertical" | "horizontal" | "grid" | "verticalCombine" | "horizontalCombine"; 
    minLabelWidth?:string;
    labelFontSize?:string;
    gap?:number,
    errorToShow?:boolean
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
    fields,
    formData,
    onChange,
    register,
    focusNext,
    disabled = {},
    errors = {}, // Default to empty object
    layout,
    minLabelWidth = "100px",
    labelFontSize = "x-small",
    gap= 4,
    errorToShow = true
   
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
        // Base disabled state: either from props or field.disabled
        let isDisabled = disabled[field.name] || field.disabled;

        // -------------------------------
        // Handle dependsOn logic
        // -------------------------------
        if (field.dependsOn) {
            // Check if the dependsOn field exists in the fields array
            const dependencyField = fields.find(f => f.name === field.dependsOn);

            if (dependencyField) {
                // Disable current field if dependsOn value is empty/null/undefined
                const dependencyValue = formData[field.dependsOn];
                if (dependencyValue === undefined || dependencyValue === null || dependencyValue === '') {
                    isDisabled = true;
                }
            }
            // If dependsOn field does NOT exist, ignore it (leave isDisabled as-is)
        }

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
                        value={formData[field.name] ?? ''} // controlled
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
                            value={formData[field.name] ?? ''} // controlled
                            disabled={isDisabled}
                            size={field.size || "xs"}
                            placeholder={field.placeholder || `Select ${field.label}`}
                            minW={field.minWidth || field.width}
                            // rounded={field.rounded}
                            fontSize={field.fontSize || "10px"}
                            className={field.className}
                            css={field.css}
                            onChange={(e) => onChange(field.name, e.target.value)}
                            items={field.items || field.options || []}
                            onEnter={() => focusNext(field.name)}
                            onBlur={() => handleBlur(field.name)}
                            maxWidth={field.width || field.maxW || field.maxWidth}
                        />
               
                
                );

            case 'combobox':
                return (
                    <SelectCombobox
                        key={field.name}
                        ref={setRef}
                        value={formData[field.name] ?? ''} // controlled
                 
                        // size={field.size || "xs"}
                        placeholder={field.placeholder || `Select ${field.label}`}
                        rounded={field.rounded}
                        // className={field.className}
                        // css={field.css}
                        onChange={(val) => onChange(field.name, val)}
                        items={field.items || field.options || []}
                        disable={isDisabled}
                        onEnter={() => focusNext(field.name)}
                        onKeyDown={(e) => handleKeyDown(e, field.name)}
                        onBlur={() => handleBlur(field.name)}
                        maxWidth={field.maxWidth || field.maxW || field.width}
                        size={field.size || "xs"}
                        fontSize={field.fontSize || "2xs"}
                    />
                );
                case 'password':
                    return (
                        <Box width="100%">
                            <PasswordInput
                                key={field.name}
                                ref={setRef}
                                value={formData[field.name] ?? ''} // controlled
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
                            value={formData[field.name] ?? ''} // controlled
                            onChange={(val) => onChange(field.name, val)}
                            disabled={isDisabled}
                            placeholder={field.placeholder || "dd-mm-yyyy"}
                            dateFormat={field.dateFormat || "dd-MM-yyyy"}
                            maxDate={field.maxDate}
                            minDate={field.minDate}
                            showTimeSelect={field.showTimeSelect}
                            onBlur={() => handleBlur(field.name)}
                            onKeyDown={(e) => handleKeyDown(e, field.name)}
                            defaultValue ={field.defaultValue}
                            maxWidth={field.maxWidth || field.maxW || field.width}
                        
                            
                        />
                    );

                case 'color':
                    return (
                        <ColorPickerInput
                            key={field.name}
                            ref={setRef}
                            value={formData[field.name] ?? '#000000'}
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
                            value={formData[field.name] ?? ''} // controlled
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
                            value={formData[field.name] ?? ''} // controlled
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
                            value={formData[field.name] ?? false} // controlled
                            onChange={(val) => onChange(field.name, val)}
                            disabled={isDisabled}
                            trueValue={field.trueValue !== undefined ? field.trueValue : true}
                            falseValue={field.falseValue !== undefined ? field.falseValue : false}
                            labels={field.switchLabels || { on: 'YES', off: 'NO' }}
                            size={field.size || "sm"}
                            onBlur={() => handleBlur(field.name)}
                        />
                    );
            case 'checkbox' :
                return (
                    <SingleCheckbox 
                        label={field.label}
                        checked={formData[field.name] ?? false}
                        onChange={(checked: boolean) => onChange(field.name, checked)}
                        size={field.size || "sm"}
                        disabled={isDisabled}
                        fontSize={field.fontSize || "sm"}

                    />
                )


         
            case 'number':
                    return (
                        <CapitalizedInput
                            key={field.name}
                            inputRef={setRef}
                            field={field.name}
                            value={formData[field.name] ?? ''} // controlled
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
                            onKeyDown={(e: any) => handleKeyDown(e, field.name)}
                            onBlur={() => handleBlur(field.name)}
                            iconElement={field.iconElement}
                            type='number'
                            allowFocus={field.allowFocus}
                        />
                    );
                    case 'image' :
                        return (
                            <CapitalizedInput 
                                type='image'
                                inputRef={setRef}
                                key={field.name}
                                field={field.name}
                                value={formData[field.name] ?? ''} // controlled
                                onChange={onChange} // Pass the original onChange that expects (field, value)
                                disabled={isDisabled}
                                size={field.size || "xs"}
                                placeholder={field.placeholder}
                                maxWidth={field.maxWidth || field.maxW || field.width}
                                minWidth={field.minWidth}
                                rounded={field.rounded}
                                onEnter={() => focusNext(field.name)}
                                onKeyDown={(e: any) => handleKeyDown(e, field.name)}
                                onBlur={() => handleBlur(field.name)}
                                

                            />
                        )
            case 'text':
                default:
                    return (
                        <CapitalizedInput
                            key={field.name}
                            inputRef={setRef}
                            field={field.name}
                            value={formData[field.name] ?? ''} // controlled
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
                            onKeyDown={(e: any) => handleKeyDown(e, field.name)}
                            onBlur={() => handleBlur(field.name)}
                            iconElement={field.iconElement}
                            type='text'
                            
                        />
                    );
           
               
        };
      
    };
        return (
            <Box width="100%">
                {fieldComponent()}
                {/* {showError && (
                    <Text color="red.500" fontSize="2xs" mt={1} ml={1}>
                        {errors[field.name]}
                    </Text>
                )} */}
            </Box>
        );
    }


    // Determine grid template columns
    const getGridTemplateColumns = () => {
        if (layout === "vertical" || layout === "verticalCombine") return "1fr"; // 1 column
        if (layout === "horizontal" || layout === "horizontalCombine") return "1fr 1fr"; // 2 equal columns
        if (layout === "grid") return "repeat(2, 1fr)"; // Default grid - 2 columns
        return "1fr"; // Fallback
    };

    return (
        <Box
            display={layout === "grid" ? "grid" : "flex"}
            flexDirection={
                layout === "vertical" || layout === "verticalCombine"
                    ? "column"
                    : "row"
            }
            flexWrap={
                layout === "horizontal" || layout === "horizontalCombine"
                    ? "wrap"
                    : "nowrap"
            }
            gridTemplateColumns={layout === "grid" ? getGridTemplateColumns() : undefined}
            gap={gap}
         
            width="100%"
        >
            {fields.map((field) => (
                <Box
                    key={field.name}
                    display="flex"
                    flexDirection={
                        layout === "verticalCombine" || layout === "horizontalCombine"
                            ? "column"  // Stack label above input for Combine layouts
                            : "row"      // Label beside input for other layouts
                    }
                    alignItems={layout === "verticalCombine" || layout === "horizontalCombine"
                        ? "center"
                        : "center"
                    }
                    gap={layout === "verticalCombine" || layout === "horizontalCombine" ? 1 : 2}
                    flex={layout === "horizontal" || layout === "horizontalCombine" ? "0 0 auto" : "1"}
                    // width={
                    //     layout === "horizontal" || layout === "horizontalCombine"
                    //         ? "calc(50% - 8px)"
                    //         : "100%"
                    // }
                    gridColumn={field.colSpan && layout === "grid" ? `span ${field.colSpan}` : undefined}
                    
                >
                    {/* Label */}
                    <Box
                        minW={layout === "verticalCombine" || layout === "horizontalCombine"
                            ? "100%"  // Full width when stacked
                            : minLabelWidth || "100px"  // Fixed width when beside
                        }
                        fontSize={labelFontSize}
                        fontWeight="semibold"
                        whiteSpace={layout === "verticalCombine" || layout === "horizontalCombine"
                            ? "normal"
                            : "nowrap"
                        }
                    >
                        {field.label}
                        {field.required && (
                            <span style={{ color: 'red', fontSize: '14px' }}>*</span>
                        )}

                    </Box>

                    {/* Input field */}
                    <Box
                        width={layout === "verticalCombine" || layout === "horizontalCombine"
                            ? "100%"
                            : "auto"
                        }
                        flex={layout !== "verticalCombine" && layout !== "horizontalCombine" ? "1" : undefined}
                    >
                        {renderField(field)}
                         {errorToShow ? errors?.[field.name] && (
                            <Box fontSize="2xs" color="red" mt={1} ml={1}>
                                {errors[field.name]}
                            </Box>
                        ) : null}
                    </Box>
                </Box>
            ))}
        </Box>
    );
}