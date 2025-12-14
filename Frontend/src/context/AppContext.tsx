import { createContext, useContext, useState } from "react";

interface AppContextType {
    search: string;
    setSearch: (value: string) => void;

    page: number;
    setPage: (value: number) => void;

    pageSize: number;
    setPageSize: (value: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    return (
        <AppContext.Provider
            value={{
                search,
                setSearch,
                page,
                setPage,
                pageSize,
                setPageSize,
            }}
        >
            {children}

        </AppContext.Provider>
    );
}

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
    return ctx;
}