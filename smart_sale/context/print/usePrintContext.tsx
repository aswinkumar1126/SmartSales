"use client";

import { getStorage, setStorage } from "@/utils/storage/storage";
import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    Dispatch,
    SetStateAction,
} from "react";

type PrintContextType = {
    data: any[];
    columns: {
        key: string;
        label: string;
        align?: "start" | "center" | "end";
        allowTotal?: boolean;
        isNumeric?: boolean;
    }[];
    title?: (title: string) => void; // 🔹 accepts string
    titleText?: string;              // 🔹 current title value
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
    const [titleText, setTitleText] = useState<string>("");

    
    // 🔹 Title setter
    const title = (t: string) => {
        setTitleText(t);
    };
    console.log(titleText ,'title from usePrint');

    /* 🔹 Load persisted data on mount */
    useEffect(() => {
        const stored = getStorage<any>("print-context");

        if (stored) {
            setData(stored.data || []);
            setColumns(stored.columns || []);
            setShowSno(stored.showSno || false);
            setTitleText(stored.titleText || "");
        }
    }, []);


    /* 🔹 Persist on change */
    useEffect(() => {
        setStorage(
            "print-context",
            JSON.stringify({ data, columns, showSno, titleText })
        );
    }, [data, columns, showSno, titleText]);

    return (
        <PrintContext.Provider
            value={{
                data,
                columns,
                title,
                titleText,
                setData,
                setColumns,
                showSno,
                setShowSno,
            }}
        >
            {children}
        </PrintContext.Provider>
    );
};

export const usePrint = () => {
    const ctx = useContext(PrintContext);
    if (!ctx) throw new Error("usePrint must be used inside PrintProvider");
    return ctx;
};
