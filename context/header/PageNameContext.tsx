import { createContext , useContext ,ReactNode ,useState, useEffect } from "react";

export interface PageNameContextType {
    pageName?:string |null;
    description?: string|null;
    setPageName:(name:string | null) => void;
    setDescription:(desc:string | null) => void;
}
const PageNameContext = createContext<PageNameContextType | undefined>(undefined);


export const usePageName = () => {
    const context = useContext(PageNameContext);
    if (!context) {
        throw new Error('usePageName must be used within a PageNameProvider');
    }
    return context;
};

export const PageNameProvider = ({ children }: { children: ReactNode })=>{

    const [pageName, setPageName] = useState<string | null>(null);
    
    const [description, setDescription] = useState<string | null>(null);

    return(
        <PageNameContext.Provider 
            value={{
                pageName,
                description,
                setPageName,
                setDescription,
            }}
        >   
        {children}
        </PageNameContext.Provider>
    )

}