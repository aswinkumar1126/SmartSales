"use client";

import { createContext, useContext, useState, useEffect, ReactNode ,Dispatch ,SetStateAction } from "react";

type PrintContextType = {
    data: any[];
    columns: {
        key: string;
        label: string;
        align?: "start" | "center" | "end";
        allowTotal?: boolean;
        isNumeric?: boolean;
    }[];
    setData: (data: any[]) => void;
    setColumns: (columns: PrintContextType["columns"]) => void;
    showSno?: boolean;
    setShowSno: Dispatch<SetStateAction<boolean>>;
};

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export const PrintProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<PrintContextType["columns"]>([]);
    const [showSno, setShowSno] = useState<boolean>(false);

    /* 🔹 Load persisted data on mount */
    useEffect(() => {
        const stored = sessionStorage.getItem("print-context");
        if (stored) {
            const parsed = JSON.parse(stored);
            setData(parsed.data || []);
            setColumns(parsed.columns || []);
            setShowSno(parsed.showSno || false);
        }
    }, []);

    /* 🔹 Persist on change */
    useEffect(() => {
        if (data.length || columns.length) {
            sessionStorage.setItem(
                "print-context",
                JSON.stringify({ data, columns ,showSno})
            );
        }
    }, [data, columns]);

    return (
        <PrintContext.Provider value={{ data, columns, setData, setColumns ,showSno ,setShowSno }}>
            {children}
        </PrintContext.Provider>
    );
};

export const usePrint = () => {
    const ctx = useContext(PrintContext);
    if (!ctx) throw new Error("usePrint must be used inside PrintProvider");
    return ctx;
};
