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
    const isSubmitting = useRef(false); // ✅ lock

    const register = (fieldName: FieldName) => (el: InputElement) => {
        inputRefs.current[fieldName] = el;
    };

    const focusNext = (currentField: FieldName) => {
        const currentIndex = fields.indexOf(currentField);
        if (currentIndex === -1) return;

        // ✅ LAST FIELD → SUBMIT
        if (currentIndex === fields.length - 1) {
            if (onSubmit && !isSubmitting.current) {
                isSubmitting.current = true;

                onSubmit();

                // unlock after short delay
                setTimeout(() => {
                    isSubmitting.current = false;
                }, 500);
            }
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

    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            const timer = setTimeout(() => focusFirst(), 100);
            return () => clearTimeout(timer);
        }
    }, []);

    return { register, focusNext, focusFirst };
};