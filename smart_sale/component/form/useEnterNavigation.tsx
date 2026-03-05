import { useRef, useEffect } from 'react';

type FieldName = string;
type InputElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;

interface UseEnterNavigationReturn {
    register: (fieldName: FieldName) => (el: InputElement) => void;
    focusNext: (currentField: FieldName) => void;
    focusFirst: () => void;
}

export const useEnterNavigation = (
    fields: FieldName[],
    onSubmit?: () => void
): UseEnterNavigationReturn => {
    const inputRefs = useRef<Record<FieldName, InputElement>>({});
    const hasMounted = useRef(false);

    const register = (fieldName: FieldName) => (el: InputElement) => {
        inputRefs.current[fieldName] = el;
    };

    const focusNext = (currentField: FieldName) => {
        const currentIndex = fields.indexOf(currentField);
        if (currentIndex === -1) return;

        if (currentIndex === fields.length - 1) {
            if (onSubmit) onSubmit();
        } else {
            const nextField = fields[currentIndex + 1];
            inputRefs.current[nextField]?.focus();
        }
    };

    const focusFirst = () => {
        if (fields.length > 0) {
            inputRefs.current[fields[0]]?.focus();
        }
    };

    // Auto-focus first field ONLY on initial mount
    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            const timer = setTimeout(() => focusFirst(), 100); // small delay for DOM
            return () => clearTimeout(timer);
        }
    }, []); // Empty dependency array - runs only once on mount

    return { register, focusNext, focusFirst };
};