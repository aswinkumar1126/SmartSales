import { useRef, useEffect, useCallback } from 'react';

type FieldName = string;
type InputElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;

const isReadOnly = (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean =>
    'readOnly' in el ? (el as HTMLInputElement | HTMLTextAreaElement).readOnly : false;

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
    const listenersRef = useRef<Record<FieldName, (e: KeyboardEvent) => void>>({});
    const hasMounted = useRef(false);
    const isSubmitting = useRef(false);
    const fieldsRef = useRef(fields);
    fieldsRef.current = fields;
    const onSubmitRef = useRef(onSubmit);
    onSubmitRef.current = onSubmit;

    const focusNext = useCallback((currentField: FieldName) => {
        const currentIndex = fieldsRef.current.indexOf(currentField);
        if (currentIndex === -1) return;

        for (let i = currentIndex + 1; i < fieldsRef.current.length; i++) {
            const nextEl = inputRefs.current[fieldsRef.current[i]];
            if (nextEl && !nextEl.disabled && !isReadOnly(nextEl)) {
                nextEl.focus();
                return;
            }
        }

        if (onSubmitRef.current && !isSubmitting.current) {
            isSubmitting.current = true;
            onSubmitRef.current();
            setTimeout(() => { isSubmitting.current = false; }, 500);
        }
    }, []);

    const register = useCallback((fieldName: FieldName) => (el: InputElement) => {
        const prev = inputRefs.current[fieldName];
        if (prev && prev !== el && listenersRef.current[fieldName]) {
            prev.removeEventListener('keydown', listenersRef.current[fieldName] as EventListener);
            delete listenersRef.current[fieldName];
        }
        inputRefs.current[fieldName] = el;
        if (el && (el.disabled || isReadOnly(el))) {
            const handler = (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    focusNext(fieldName);
                }
            };
            listenersRef.current[fieldName] = handler;
            el.addEventListener('keydown', handler as EventListener);
        }
    }, [focusNext]);

    const focusFirst = useCallback(() => {
        for (let i = 0; i < fieldsRef.current.length; i++) {
            const el = inputRefs.current[fieldsRef.current[i]];
            if (el && !el.disabled && !isReadOnly(el)) {
                el.focus();
                return;
            }
        }
    }, []);

    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            const timer = setTimeout(() => focusFirst(), 100);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        fields.forEach((fieldName) => {
            const el = inputRefs.current[fieldName];
            if (!el) return;
            if (listenersRef.current[fieldName]) {
                el.removeEventListener('keydown', listenersRef.current[fieldName] as EventListener);
                delete listenersRef.current[fieldName];
            }
            if (el.disabled || isReadOnly(el)) {
                const handler = (e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        focusNext(fieldName);
                    }
                };
                listenersRef.current[fieldName] = handler;
                el.addEventListener('keydown', handler as EventListener);
            }
        });
    }, [fields, focusNext]);

    return { register, focusNext, focusFirst };
};