import { Box } from "@mui/material";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#020b26",
                p: 4,
                color: "white",
            }}
        >
            <Box sx={{ maxWidth: 1200, mx: "auto" }}>{children}</Box>
        </Box>
    );
}
