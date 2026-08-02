import React, { useEffect, useRef } from "react";
import { useFormNavigator } 
from "@/context/navigator/EnterNavigator";

type EnterWrapperProps = {
    navigatorKey: string;
    children: (props: { ref: React.Ref<any>; onEnter: () => void }) => React.ReactNode;
};

export const EnterWrapper: React.FC<EnterWrapperProps> = ({ navigatorKey, children }) => {
    const { register, focusNext } = useFormNavigator();
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        register(navigatorKey, ref.current);
    }, [navigatorKey, ref, register]);

    const onEnter = () => focusNext(navigatorKey);

    return <>{children({ ref, onEnter })}</>;
};