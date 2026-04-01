import { useRef, useEffect } from "react";

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
    const isSubmitting = useRef(false);

    // ✅ Helper: check if element is focusable
    const isFocusable = (el: any) => {
        if (!el) return false;

        return !(
            el.disabled ||
            el.getAttribute?.("disabled") !== null ||
            el.getAttribute?.("aria-disabled") === "true"
        );
    };

    const register = (fieldName: FieldName) => (el: InputElement) => {
        inputRefs.current[fieldName] = el;
    };

    // ✅ Focus FIRST valid input (skip disabled)
    const focusFirst = () => {
        for (const field of fields) {
            const el = inputRefs.current[field];
            if (isFocusable(el)) {
                el?.focus();
                break;
            }
        }
    };

    // ✅ Focus NEXT valid input (skip disabled)
    const focusNext = (currentField: FieldName) => {
        const currentIndex = fields.indexOf(currentField);
        if (currentIndex === -1) return;

        // Try finding next focusable field
        for (let i = currentIndex + 1; i < fields.length; i++) {
            const el = inputRefs.current[fields[i]];
            if (isFocusable(el)) {
                el?.focus();
                return;
            }
        }

        // ✅ If no next field → submit
        if (onSubmit && !isSubmitting.current) {
            isSubmitting.current = true;

            onSubmit();

            setTimeout(() => {
                isSubmitting.current = false;
            }, 500);
        }
    };

    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;

            const timer = setTimeout(() => {
                focusFirst();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, []);

    return { register, focusNext, focusFirst };
};