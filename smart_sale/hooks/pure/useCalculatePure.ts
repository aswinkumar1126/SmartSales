"use client";

import { useEffect, useState } from "react";

export const useCalculatePure = (weight: string | number, touch: string | number) => {
    const [pure, setPure] = useState<string>("");

    useEffect(() => {
        const w = Number(weight);
        const t = Number(touch);

        if (!isNaN(w) && !isNaN(t)) {
            const result = (w * t) / 100;
            setPure(result ? result.toFixed(3) : "");
        } else {
            setPure("");
        }
    }, [weight, touch]);

    return pure;
};
