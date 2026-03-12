// // @/component/form/AddTransactionItemForm.tsx
// "use client";

// import React, { useState, useEffect, useCallback, useRef } from "react";
// import {
//     Box,
//     Portal,
//     Select,
//     createListCollection,
//     Button,
//     Grid,
//     GridItem,
//     Flex,
//     Text,
//     HStack,
//     Icon,
// } from "@chakra-ui/react";
// import { Combobox, useFilter, useListCollection } from "@chakra-ui/react";
// import { useTheme } from "@/context/theme/themeContext";
// import { CapitalizedInput } from "@/component/form/CapitalizedInput";
// import downLoadIcon from '@/asserts/icons/download.png';
// import Image from "next/image";
// import { useCalculatePure } from "@/hooks/pure/useCalculatePure";
// import { toaster } from "@/components/ui/toaster";
// import StoneEnterMaster from "../StoneMaster/StoneEntryMaster";


// /* ---------------- TYPES ---------------- */

// export interface FormField {
//     key: string;
//     label: string;
//     type: "text" | "number" | "select" | "combobox" | "capitalized" | "calculated";
//     placeholder?: string;
//     collection?: {
//         items: { label: string; value: string }[];
//     };
//     getLabelByValue?: (collection: any, value: any) => string;
//     isRequired?: boolean;
//     min?: number;
//     max?: number;
//     step?: number;
//     precision?: number;
//     allowNegative?: boolean;
//     confirmNegative?: boolean;
//     size?: "2xs" | "xs" | "sm" | "md" | "lg";
//     disabled?: boolean;
//     decimalScale?: number;
//     dependsOn?: string; // ADD THIS
//     defaultValue?:string;
// }
// /* ---------------- SELECT ---------------- */

// export function CustomSelect({
//     value,
//     onChange,
//     collection,
//     placeholder,
//     isInvalid,
//     size = "sm",
//     inputRef,
//     onEnter,
//     disabled,
// }: {
//     value: string;
//     onChange: (value: string) => void;
//     collection?: { items: { label: string; value: string }[] };
//     placeholder?: string;
//     isInvalid?: boolean;
//     size?: "xs" | "sm" | "md" | "lg";
//     inputRef?: React.RefObject<HTMLSelectElement>;
//     onEnter?: () => void;
//     disabled?: boolean;
// }) {
//     const selectCollection = createListCollection({
//         items: collection?.items || [],
//     });

//     const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
//         if (e.key === "Enter") {
//             e.preventDefault();
//             onEnter?.();
//         }
//     };


//     // Create a local ref if no ref is provided
//     const localRef = useRef<HTMLSelectElement>(null);
//     const ref = inputRef || localRef;

//     return (
//         <>
//             <Select.Root
//                 collection={selectCollection}
//                 size={size}
//                 value={value ? [value] : []}
//                 onValueChange={(e) => onChange(e.value[0] || "")}
//                 disabled = {disabled}
//             >
//                 <Select.HiddenSelect />
//                 <Select.Control>
//                     <Select.Trigger borderColor={isInvalid ? "red.400" : undefined}>
//                         <Select.ValueText placeholder={placeholder} />
//                     </Select.Trigger>
//                     <Select.IndicatorGroup>
//                         <Select.Indicator />
//                     </Select.IndicatorGroup>
//                 </Select.Control>

//                 <Portal>
//                     <Select.Positioner>
//                         <Select.Content>
//                             {selectCollection.items.map((item) => (
//                                 <Select.Item item={item} key={item.value}>
//                                     {item.label}
//                                     <Select.ItemIndicator />
//                                 </Select.Item>
//                             ))}
//                         </Select.Content>
//                     </Select.Positioner>
//                 </Portal>
//             </Select.Root>

//             {/* Hidden select field for ref and keyboard events */}
//             <select
//                 ref={ref}
//                 value={value}
//                 onChange={(e) => onChange(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 style={{
//                     position: 'absolute',
//                     opacity: 0,
//                     width: 0,
//                     height: 0,
//                     pointerEvents: 'none'
//                 }}
//                 tabIndex={-1}
//             />
//         </>
//     );
// }

// /* ---------------- COMBOBOX ---------------- */

// export function CustomCombobox({
//     value,
//     onChange,
//     collection,
//     placeholder,
//     isInvalid,
//     size = "sm",
//     inputRef,
//     onEnter,
//     disabled
// }: {
//     value: string;
//     onChange: (value: string) => void;
//     collection?: { items: { label: string; value: string }[] };
//     placeholder?: string;
//     isInvalid?: boolean;
//     size?: "2xs" | "sm" | "md" | "lg" | "xs";
//     inputRef?: React.RefObject<HTMLInputElement>;
//     onEnter?: () => void;
//     disabled?: boolean;
// }) {
//     const { contains } = useFilter({ sensitivity: "base" });
//     const [isOpen, setIsOpen] = useState(false);
//     const [highlightedValue, setHighlightedValue] = useState<string | null>(null);

//     const { collection: filteredCollection, filter } = useListCollection({
//         initialItems: collection?.items || [],
//         filter: contains,
//     });

//     // Update collection when items change
//     useEffect(() => {
//         filter("");
//     }, [collection?.items]);

//     const localRef = useRef<HTMLInputElement>(null);
//     const ref = inputRef || localRef;

//     const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//         if (e.key === "Enter") {
//             e.preventDefault();
//             e.stopPropagation();

//             if (isOpen && filteredCollection.items.length > 0) {
//                 // Use highlighted item if user arrowed down, else first filtered item
//                 const selectedValue = highlightedValue ?? filteredCollection.items[0].value;
//                 const selectedItem =
//                     filteredCollection.items.find((item) => item.value === selectedValue)
//                     ?? filteredCollection.items[0];

//                 onChange(selectedItem.value);
//                 setHighlightedValue(null);
//                 setIsOpen(false);
//                 setTimeout(() => onEnter?.(), 50);
//             } else {
//                 // Dropdown closed or empty, just move to next field
//                 onEnter?.();
//             }
//         }
//     };

//     return (
//         <Combobox.Root
//             collection={filteredCollection}
//             value={value ? [value] : []}
//             open={isOpen}
//             onOpenChange={(e) => setIsOpen(e.open)}
//             onValueChange={(e) => {
//                 onChange(e.value[0] || "");
//                 setIsOpen(false);
//                 setTimeout(() => onEnter?.(), 50);
//             }}
//             onInputValueChange={(e) => {
//                 filter(e.inputValue);
//                 // Open dropdown when typing
//                 if (e.inputValue.length > 0) {
//                     setIsOpen(true);
//                 } else {
//                     setIsOpen(false);
//                 }
//             }}
//             onHighlightChange={(e) => {
//                 setHighlightedValue(e.highlightedValue);
//             }}
//             size="xs"
//             fontSize="2xs"
//             width="100%"
//             openOnClick
//             disabled={disabled}
//         >
//             <Combobox.Control>
//                 <Combobox.Input
//                     ref={ref}
//                     placeholder={placeholder}
//                     borderColor={isInvalid ? "red.400" : undefined}
//                     fontSize="2xs"
//                     p={1}
//                     onKeyDown={handleKeyDown}
//                     disabled={disabled}
//                 />
//                 <Combobox.IndicatorGroup>
//                     <Combobox.ClearTrigger onClick={() => {
//                         onChange("");
//                         setIsOpen(false);
//                     }} />
//                     <Combobox.Trigger />
//                 </Combobox.IndicatorGroup>
//             </Combobox.Control>

//             <Portal>
//                 <Combobox.Positioner marginTop={-1.5}>
//                     <Combobox.Content maxH="200px" overflowY="auto">
//                         <Combobox.Empty fontSize="2xs">No items found</Combobox.Empty>
//                         {filteredCollection.items.map((item) => (
//                             <Combobox.Item item={item} key={item.value} fontSize="2xs">
//                                 {item.label}
//                                 <Combobox.ItemIndicator />
//                             </Combobox.Item>
//                         ))}
//                     </Combobox.Content>
//                 </Combobox.Positioner>
//             </Portal>
//         </Combobox.Root>
//     );
// }
// interface AddTransactionItemFormProps {
//     fields: FormField[];
//     onSubmit: (data: any) => Promise<void> | void;
//     onCancel: () => void;
//     compact?: boolean;
//     handleClearForm?: any;
//     isEditing: boolean;
//     getAvailableWeight?: (pureId: string) => number | null;
//     isIssue?: boolean;
// }

// export default function AddTransactionItemForm({
//     fields,
//     onSubmit,
//     onCancel,
//     compact = false,
//     handleClearForm,
//     isEditing,
//     getAvailableWeight,
//     isIssue
// }: AddTransactionItemFormProps) {



//     const [formData, setFormData] = useState<Record<string, any>>({});
//     const [errors, setErrors] = useState<Record<string, string>>({});
//     const [touched, setTouched] = useState<Record<string, boolean>>({});
//     const [isSubmitting, setIsSubmitting] = useState(false);


//     const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);
//     const [currentGRSWT, setCurrentGRSWT] = useState<number>(0);

//     const { theme } = useTheme();

//     console.log(fields,'fieldsfields');

//     // Create refs for each field
//     const fieldRefs = useRef<Record<string, React.RefObject<any>>>({});

//     // Initialize refs for each visible field
//     const visibleFields = fields.filter(
//         (field) => field.key !== "NETWT" && field.key !== "PUREWT" && field.key !== "PURE" && field.key !== "APURE"
//     );

//     // Create refs for each field
//     visibleFields.forEach(field => {
//         if (!fieldRefs.current[field.key]) {
//             fieldRefs.current[field.key] = React.createRef<any>();
//         }
//     });

//     // Submit button ref
//     const submitButtonRef = useRef<HTMLButtonElement>(null);

//     const mirrorMap: Record<string, string> = {
//         WT: "AWT",
//         PURE: "APUREWT",
//         TOUCH: "ATOUCH"
//     };

//     const pureValue = useCalculatePure(formData.WT, formData.TOUCH);
//     const alternativePureValue = useCalculatePure(formData.AWT, formData.ATOUCH);
    

//     const handleStnwtClick = useCallback((grswtValue: number) => {
//         setCurrentGRSWT(grswtValue);
//         setIsStoneModalOpen(true);
//     }, []);

//     /* ---------------- NAVIGATION ---------------- */

//     const moveToNextField = (currentKey: string) => {
//         const fieldKeys = visibleFields.map(f => f.key);
//         const currentIndex = fieldKeys.indexOf(currentKey);

//         if (currentIndex < fieldKeys.length - 1) {
//             // Move to next field
//             const nextKey = fieldKeys[currentIndex + 1];
//             const nextRef = fieldRefs.current[nextKey];
//             if (nextRef?.current) {
//                 nextRef.current.focus();
//                 if (nextRef.current.select) {
//                     nextRef.current.select();
//                 }
//             }
//         } else {
//             // Last field, move to submit button
//             submitButtonRef.current?.focus();
//         }
//     };

//     /* ---------------- INIT ---------------- */

//     useEffect(() => {
//         const init: Record<string, any> = {};
//         fields.forEach((f) => {
//             // Set default value if provided
//             if (f.defaultValue) {
//                 init[f.key] = f.defaultValue;
//             } else {
//                 init[f.key] = "";
//             }
//         });
//         setFormData(init);
//     }, [fields]);
//     /* ---------------- CALCULATIONS ---------------- */

//     // Calculate NETWT (Gross Weight - Less Weight)
//     const calculateNetWeight = useCallback(() => {
//         const grswt = parseFloat(formData.GRSWT) || 0;
//         const stnwt = parseFloat(formData.STNWT) || 0;
//         return (grswt - stnwt).toFixed(3);
//     }, [formData.GRSWT, formData.STNWT]);

//     // Calculate PUREWT (Net Weight * TOUCH / 100)
//     const calculatePureWeight = useCallback(() => {
//         const netwt = parseFloat(calculateNetWeight()) || 0;
//         const TOUCH = parseFloat(formData.TOUCH) || 0;
//         return ((netwt * TOUCH) / 100).toFixed(3);
//     }, [calculateNetWeight, formData.TOUCH]);

//     // Update calculated fields when relevant fields change
//     useEffect(() => {
//         if (formData.GRSWT || formData.STNWT) {
//             const netwt = calculateNetWeight();
//             setFormData(prev => ({ ...prev, NETWT: netwt }));
//         }
//     }, [formData.GRSWT, formData.STNWT, calculateNetWeight]);

//     useEffect(() => {
//         if (formData.GRSWT || formData.STNWT || formData.TOUCH) {
//             const purewt = calculatePureWeight();
//             setFormData(prev => ({ ...prev, PUREWT: purewt }));
//         }
//     }, [formData.GRSWT, formData.STNWT, formData.TOUCH, calculatePureWeight]);

//     useEffect(() => {
//         if (pureValue) {
//             setFormData(prev => ({
//                 ...prev,
//                 PURE: pureValue,     // or PUREWT
//             }));
//         }
//         if (alternativePureValue) {
//             setFormData(prev => ({
//                 ...prev,
//                 APUREWT: alternativePureValue
//             }));
//         }
//     }, [pureValue, alternativePureValue]);

//     /* ---------------- CHANGE ---------------- */

//     const handleChange = useCallback((key: string, value: any) => {
//         const newFormData = { ...formData, [key]: value };

//         // ✅ One-way mirror (main → alternative)
//         if (mirrorMap[key]) {
//             newFormData[mirrorMap[key]] = value;
//         }
//         if ((key === "WT" || key === "AWT") && formData.PUREID && getAvailableWeight) {
//             const available = getAvailableWeight(formData.PUREID);

//             if (available != null && Number(value) > available) {
//                 toaster.create({
//                     title: "Stock Limit Exceeded",
//                     description: `Available weight is ${available}`,
//                     type: "error",
//                 });

//                 newFormData[key] = available;
//             }
//         }

//         // Existing logic
//         if (key === "GRSWT" || key === "STNWT") {
//             const grswt = parseFloat(key === "GRSWT" ? value : formData.GRSWT) || 0;
//             const stnwt = parseFloat(key === "STNWT" ? value : formData.STNWT) || 0;
//             newFormData.NETWT = (grswt - stnwt).toFixed(3);

//             if (formData.TOUCH) {
//                 const TOUCH = parseFloat(formData.TOUCH) || 0;
//                 newFormData.PUREWT = ((grswt - stnwt) * TOUCH / 100).toFixed(3);
//             }
//         }

//         if (key === "TOUCH") {
//             const TOUCH = parseFloat(value) || 0;
//             const netwt = parseFloat(formData.NETWT || calculateNetWeight()) || 0;
//             newFormData.PUREWT = ((netwt * TOUCH) / 100).toFixed(3);
//         }

//         setFormData(newFormData);
//         setTouched((prev) => ({ ...prev, [key]: true }));
//         setErrors((prev) => ({ ...prev, [key]: "" }));
//     }, [formData, calculateNetWeight, getAvailableWeight]);

//     useEffect(() => {
//         if (pureValue) {
//             setFormData(prev => ({
//                 ...prev,
//                 PURE: pureValue,
//                 APUREWT: prev.PURE || pureValue, // don’t override if user changed
//             }));
//         }
//     }, [pureValue]);

//     /* ---------------- VALIDATION ---------------- */

//     const validateField = (field: FormField, value: any): string => {
//         if (field.isRequired && (!value || value.toString().trim() === "")) {
//             return `${field.label} is required`;
//         }

//         if (field.type === "number") {
//             const num = Number(value);
//             if (isNaN(num)) return `${field.label} must be a number`;
//             if (!field.allowNegative && num < 0)
//                 return `${field.label} cannot be negative`;
//             if (field.min !== undefined && num < field.min)
//                 return `${field.label} must be ≥ ${field.min}`;
//             if (field.max !== undefined && num > field.max)
//                 return `${field.label} must be ≤ ${field.max}`;
//         }

//         return "";
//     };

//     const validateForm = () => {
//         const nextErrors: Record<string, string> = {};
//         let valid = true;

//         visibleFields.forEach((f) => {
//             const err = validateField(f, formData[f.key]);
//             if (err) {
//                 nextErrors[f.key] = err;
//                 valid = false;
//             }
//         });

//         setErrors(nextErrors);
//         return valid;
//     };

//     /* ---------------- SUBMIT ---------------- */

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setIsSubmitting(true);

//         if (!validateForm()) {
//             setIsSubmitting(false);
//             return;
//         }

//         try {
//             // Add calculated NETWT and PUREWT to the data before submitting
//             const submitData = {
//                 ...formData,
//                 NETWT: calculateNetWeight(),
//                 PUREWT: calculatePureWeight(),
//             };

//             await onSubmit(submitData);
//             const reset: Record<string, any> = {};
//             fields.forEach((f) => (reset[f.key] = ""));
//             setFormData(reset);
//             setTouched({});

//             // Focus back to first field after submit
//             setTimeout(() => {
//                 const firstField = visibleFields[0]?.key;
//                 if (firstField && fieldRefs.current[firstField]?.current) {
//                     fieldRefs.current[firstField].current.focus();
//                 }
//             }, 100);
//         } catch (err) {
//             console.error(err);
//         }

//         setIsSubmitting(false);
//     };


//     /* ---------------- RENDER FIELD ---------------- */
//     const renderField = (field: FormField) => {
//         const size = "xs";
//         const isInvalid = !!errors[field.key] && touched[field.key];
//         const fieldRef = fieldRefs.current[field.key];

//         // Check if field should be disabled based on dependency
//         const shouldDisable = field.dependsOn && !formData[field.dependsOn];

//         // Special handling for STNWT field
//         if (field.key === "STNWT") {
//             return (
//                 <Box
//                     position="relative"
//                     cursor="pointer"
//                     onFocus={() => {
//                         if (formData.GRSWT && Number(formData.GRSWT) > 0) {
//                             handleStnwtClick(Number(formData.GRSWT));
//                         } else {
//                             toaster.create({
//                                 title: "GRSWT Required",
//                                 description: "Please enter Gross Weight first",
//                                 type: "warning",
//                             });
//                         }
//                     }}
//                 >
//                     <CapitalizedInput
//                         field={field.key as string}
//                         value={formData[field.key] || ""}
//                         onChange={(_, v) => handleChange(field.key, v)}
//                         type="number"
//                         isCapitalized={false}
//                         allowNegative={field.allowNegative}
//                         confirmNegative={field.confirmNegative}
//                         size={size}
//                         onClassUse={true}
//                         rounded="md"
//                         max={field.max}
//                         decimalScale={field.decimalScale}
//                         disabled={shouldDisable || field.disabled}
//                         inputRef={fieldRef}
//                         onEnter={() => moveToNextField(field.key)}
                       
//                     />
//                     <Button
//                         size="2xs"
//                         position="absolute"
//                         right="0"
//                         top="0"
//                         height="100%"
//                         onClick={(e) => {
//                             e.stopPropagation();
//                             if (formData.GRSWT && Number(formData.GRSWT) > 0) {
//                                 handleStnwtClick(Number(formData.GRSWT));
//                             } else {
//                                 toaster.create({
//                                     title: "GRSWT Required",
//                                     description: "Please enter Gross Weight first",
//                                     type: "warning",
//                                 });
//                             }
//                         }}
//                         disabled={!formData.GRSWT || Number(formData.GRSWT) <= 0}
//                         title="Click to calculate stone weight"
//                         variant="ghost"
//                         minW="auto"
//                         px={1}
//                     >
//                         💎
//                     </Button>
//                 </Box>
//             );
//         }
//         switch (field.type) {
//             case "capitalized":
//                 return (
//                     <CapitalizedInput
//                         field={field.key as string}
//                         value={formData[field.key] || ""}
//                         onChange={(_, v) => handleChange(field.key, v)}
//                         type="text"
//                         isCapitalized
//                         rounded="md"
//                         size={size}
//                         max={field.max}
//                         decimalScale={field.decimalScale}
//                         inputRef={fieldRef}
//                         onEnter={() => moveToNextField(field.key)}
//                         disabled={shouldDisable || field.disabled}
//                     />
//                 );

//             case "number":
//             case "calculated":
//                 return (
//                     <CapitalizedInput
//                         field={field.key as string}
//                         value={formData[field.key] || ""}
//                         onChange={(_, v) => handleChange(field.key, v)}
//                         type="number"
//                         isCapitalized={false}
//                         allowNegative={field.allowNegative}
//                         confirmNegative={field.confirmNegative}
//                         size={size}
//                         onClassUse={true}
//                         rounded="md"
//                         max={field.max}
//                         decimalScale={field.decimalScale}
//                         disabled={shouldDisable || field.disabled || field.type === "calculated"}
//                         inputRef={fieldRef}
//                         onEnter={() => moveToNextField(field.key)}
//                     />
//                 );

//             case "select":
//                 return (
//                     <CustomSelect
//                         value={formData[field.key] || ""}
//                         onChange={(v) => handleChange(field.key, v)}
//                         collection={field.collection}
//                         placeholder={field.placeholder}
//                         isInvalid={isInvalid}
//                         size={size}
//                         inputRef={fieldRef}
//                         onEnter={() => moveToNextField(field.key)}
//                         disabled={shouldDisable || field.disabled}
//                     />
//                 );

//             case "combobox":
//                 return (
//                     <CustomCombobox
//                         value={formData[field.key] || ""}
//                         onChange={(v) => handleChange(field.key, v)}
//                         collection={field.collection}
//                         placeholder={field.placeholder}
//                         isInvalid={isInvalid}
//                         size={size}
//                         inputRef={fieldRef}
//                         onEnter={() => moveToNextField(field.key)}
//                         disabled={shouldDisable || field.disabled}
//                     />
//                 );

//             default:
//                 return (
//                     <CapitalizedInput
//                         field={field.key as string}
//                         value={formData[field.key] || ""}
//                         onChange={(_, v) => handleChange(field.key, v)}
//                         type="text"
//                         isCapitalized={false}
//                         size={size}
//                         onClassUse={true}
//                         max={field.max}
//                         rounded="sm"
//                         decimalScale={field.decimalScale}
//                         inputRef={fieldRef}
//                         onEnter={() => moveToNextField(field.key)}
//                         disabled={shouldDisable || field.disabled}
//                     />
//                 );
//         }
//     };

//     /* ---------------- GRID ---------------- */

//     const getGridColumns = () => {
//         if (compact) {
//             return {
//                 md: "repeat(4, 1fr)",
//                 lg: "repeat(6, 1fr)",
//                 xl: "repeat(13, 1fr)",
//                 base: "repeat(2, 1fr)", // 12-column grid for flexibility
//             };
//         }

//         return {
//             base: "repeat(1, 1fr)",
//             md: "repeat(2, 1fr)",
//             lg: "repeat(3, 1fr)",
//             xl: "repeat(4, 1fr)",
//         };
//     };

//     const getGridColumnSpan = (field: FormField): string => {
//         // Define how many columns each field should span
//         const spanMap: Record<string, string> = {
//             "PUREID": "span 2",
//             "ITEMID": "span 2",
//             "DESCRIPTION": "span 2",
//             "ITEMCODE": "span 1",
//             "PCS": "span 1",
//             "GRSWT": "span 1",
//             "LESSWT": "span 1",
//             "TOUCH": "span 1",
//             "RATE": "span 1",
//             "AMOUNT": "span 1",
//         };

//         return spanMap[field.key] || "span 1"; // Default to 1 column
//     };

//     /* ---------------- UI ---------------- */

//     return (
//         <Box
//             p={compact ? 3 : 4}
//             borderWidth="1px"
//             borderRadius="lg"
//             bg={theme.colors.formColor}
//             boxShadow="sm"
//         >
//             <form onSubmit={handleSubmit}>
//                 <Grid templateColumns={getGridColumns()} gap={compact ? 3 : 4}>
//                     {visibleFields.map((field) => (
//                         <GridItem
//                             key={field.key}
//                             gridColumn={getGridColumnSpan(field)}
//                         >
//                             <Flex direction="column">
//                                 <Text fontSize="2xs" mb={1}>
//                                     {field.label}
//                                     {field.isRequired && (
//                                         <Text as="span" color="red.500"> *</Text>
//                                     )}
//                                 </Text>
//                                 {renderField(field)}
//                                 {errors[field.key] && (
//                                     <Text fontSize="2xs" color="red.500" mt={1}>
//                                         {errors[field.key]}
//                                     </Text>
//                                 )}
//                             </Flex>
//                         </GridItem>
//                     ))}
//                 </Grid>

//                 <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
//                     {/* Show calculated values */}
//                     <Flex mt={1} p={1} bg="gray.50" borderRadius="md" gap={2}>
//                         {formData.NETWT && (
//                             <Text fontSize="2xs">
//                                 <strong>NET WT :</strong> {formData.NETWT}
//                             </Text>
//                         )}
//                         {formData.PUREWT && !isIssue &&  (
//                             <Text fontSize="2xs">
//                                 <strong>PURE WT :</strong> {formData.PUREWT}
//                             </Text>
//                         )}
//                         {formData.PURE && (
//                             <Text fontSize="2xs">
//                                 <strong>PURE  :</strong> {formData.PURE}
//                             </Text>
//                         )}
//                         {formData.APUREWT && (
//                             <Text fontSize="2xs">
//                                 <strong>A.PURE :</strong> {formData.APUREWT}
//                             </Text>
//                         )}
//                     </Flex>

//                     <Box display='flex' gap={1}>
//                         <Button
//                             ref={submitButtonRef}
//                             size="2xs"
//                             type="submit"
//                             loading={isSubmitting}
//                             bg={theme.colors.formColor}
//                             variant='ghost'
//                             color={theme.colors.whiteColor}
//                             onKeyDown={(e) => {
//                                 if (e.key === "Enter") {
//                                     e.preventDefault();
//                                     handleSubmit(e);
//                                 }
//                             }}
//                         >
//                             <Image src={downLoadIcon} alt="download" width={35} />
//                         </Button>
//                     </Box>
//                 </Box>
//             </form>
//             {isStoneModalOpen && (
//                 <Box
//                     position="fixed"
//                     top="0"
//                     left="0"
//                     right="0"
//                     bottom="0"
//                     bg="rgba(0,0,0,0.5)"
//                     zIndex={10}
//                     display="flex"
//                     alignItems="center"
//                     justifyContent="center"
//                     onClick={() => setIsStoneModalOpen(false)}
//                 >
//                     <Box
//                         bg={theme.colors.formColor}
//                         borderRadius="lg"
//                         maxW="1200px"
//                         width="100%"
//                         maxH="90vh"
//                         overflow="auto"
//                         onClick={(e) => e.stopPropagation()}
//                     >
//                         <StoneEnterMaster
//                             grsWeight={currentGRSWT}
//                             onClose={() => setIsStoneModalOpen(false)}
//                             onSave={(stoneData) => {
//                                 // Handle saving stone data
//                                 console.log('Stone data:', stoneData);
//                                 // You can update the STNWT field with total stone weight
//                                 const totalStoneWeight = stoneData.reduce((sum, row) => {
//                                     const weight = row.unit === 'c' ? row.weight / 5 : row.weight;
//                                     return sum + weight;
//                                 }, 0);
//                                 handleChange('STNWT', totalStoneWeight.toFixed(3));
//                                 setIsStoneModalOpen(false);
//                             }}
//                             stoneItems={[
//                                 {label:'metal' , value:'m'},
//                                 {label:'stone' , value:'s'},
//                             ]}
//                             subStoneItems={[
//                                 { label: 'metal', value: 'm' },
//                                 { label: 'stone', value: 's' },
//                             ]}
//                         />
//                     </Box>
//                 </Box>
//             )}
//         </Box>
//     );
// }