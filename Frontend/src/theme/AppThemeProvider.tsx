import React, { createContext, useMemo, useState } from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { alpha } from "@mui/material/styles";

export const ColorModeContext = createContext({
    mode: "light" as "light" | "dark",
    toggleColorMode: () => { },
});

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const savedMode = (localStorage.getItem("mode") as "light" | "dark") || "light";
    const [mode, setMode] = useState<"light" | "dark">(savedMode);

    const colorMode = useMemo(
        () => ({
            mode,
            toggleColorMode: () => {
                setMode((prev) => {
                    const next = prev === "light" ? "dark" : "light";
                    localStorage.setItem("mode", next);
                    return next;
                });
            },
        }),
        [mode]
    );

    const theme = useMemo(() => {
        const D = 700; // ✅ chỉnh 1 chỗ này là tất cả cùng tốc độ
        const E = "ease";

        return createTheme({
            palette: {
                mode,
                ...(mode === "dark"
                    ? { background: { default: "#0B1220", paper: "#111827" } }
                    : { background: { default: "#F8FAFC", paper: "#FFFFFF" } }),
            },

            shape: { borderRadius: 14 },

            transitions: {
                duration: {
                    shortest: D,
                    shorter: D,
                    short: D,
                    standard: D,
                    complex: D,
                    enteringScreen: D,
                    leavingScreen: D,
                },
            },

            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        html: {
                            // ✅ quan trọng nhất: native controls (date picker) theo mode
                            colorScheme: mode,
                        },
                        body: {
                            backgroundColor: mode === "dark" ? "#0B1220" : "#F8FAFC",
                            transition: `background-color ${D}ms ${E}, color ${D}ms ${E}`,
                        },

                        // ✅ ép input/select/textarea dùng color-scheme
                        "input, select, textarea": {
                            colorScheme: mode,
                        },

                        // ✅ chỉnh icon calendar trong input date (chỉ icon thôi)
                        'input[type="date"]::-webkit-calendar-picker-indicator': {
                            filter: mode === "dark" ? "invert(1)" : "invert(0)",
                            opacity: mode === "dark" ? 0.85 : 0.7,
                        },

                        // (optional) nếu m dùng scrollbar custom
                        "*": {
                            scrollbarColor: mode === "dark" ? "#334155 #0B1220" : "#CBD5E1 #F8FAFC",
                        },
                    },
                },

                // ✅ surface
                MuiPaper: {
                    styleOverrides: {
                        root: () => ({
                            backgroundImage: "none",
                            transition: `background-color ${D}ms ${E}, color ${D}ms ${E}, border-color ${D}ms ${E}, box-shadow ${D}ms ${E}`,
                        }),
                    },
                },

                MuiCard: {
                    styleOverrides: {
                        root: ({ theme }) => ({
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                            transition: `background-color ${D}ms ${E}, color ${D}ms ${E}, border-color ${D}ms ${E}, box-shadow ${D}ms ${E}`,
                        }),
                    },
                },

                // ✅ text + icon (đổi màu mượt)
                MuiTypography: {
                    styleOverrides: {
                        root: () => ({
                            transition: `color ${D}ms ${E}`,
                        }),
                    },
                },
                MuiSvgIcon: {
                    styleOverrides: {
                        root: () => ({
                            transition: `color ${D}ms ${E}`,
                        }),
                    },
                },

                // ✅ button / chip
                MuiButtonBase: {
                    styleOverrides: {
                        root: () => ({
                            transition: `background-color ${D}ms ${E}, color ${D}ms ${E}, border-color ${D}ms ${E}, box-shadow ${D}ms ${E}, transform ${D}ms ${E}`,
                        }),
                    },
                },
                MuiChip: {
                    styleOverrides: {
                        root: () => ({
                            transition: `background-color ${D}ms ${E}, color ${D}ms ${E}, border-color ${D}ms ${E}`,
                        }),
                    },
                },

                // ✅ table (đổi màu mượt, đều)
                MuiTableHead: {
                    styleOverrides: {
                        root: ({ theme }) => ({
                            backgroundColor: alpha(theme.palette.action.hover, 0.6),
                            transition: `background-color ${D}ms ${E}`,
                        }),
                    },
                },
                MuiTableRow: {
                    styleOverrides: {
                        root: () => ({
                            transition: `background-color ${D}ms ${E}`,
                        }),
                    },
                },
                MuiTableCell: {
                    styleOverrides: {
                        root: ({ theme }) => ({
                            borderColor: alpha(theme.palette.divider, 0.35),
                            transition: `background-color ${D}ms ${E}, color ${D}ms ${E}, border-color ${D}ms ${E}`,
                        }),
                        head: ({ theme }) => ({
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                        }),
                    },
                },
            },
        });
    }, [mode]);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}
