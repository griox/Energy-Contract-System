import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#0d1117", // GitHub dark theme background
                color: "#c9d1d9",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background decoration */}
            <Box
                sx={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background: "radial-gradient(circle, rgba(56,139,253,0.1) 0%, rgba(13,17,23,0) 50%)",
                    zIndex: 0,
                }}
            />

            <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                <Typography
                    variant="h1"
                    sx={{
                        fontSize: { xs: "8rem", md: "12rem" },
                        fontWeight: 800,
                        lineHeight: 1,
                        color: "#30363d",
                        textShadow: "0 0 20px rgba(0,0,0,0.5)",
                    }}
                >
                    404
                </Typography>

               

                <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: "#fff" }}>
                    This is not the web page you are looking for.
                </Typography>

                <Typography variant="body1" sx={{ mb: 5, color: "#8b949e", maxWidth: "600px", mx: "auto" }}>
                    The page you are trying to access might have been removed, had its name changed, or is temporarily unavailable.
                </Typography>

                <Button
                    variant="outlined"
                    onClick={() => navigate("/")}
                    sx={{
                        color: "#58a6ff",
                        borderColor: "rgba(240,246,252,0.1)",
                        textTransform: "none",
                        fontSize: "1rem",
                        px: 4,
                        py: 1,
                        borderRadius: "6px",
                        "&:hover": {
                            borderColor: "#8b949e",
                            bgcolor: "rgba(177,186,196,0.12)",
                        },
                    }}
                >
                    Take me home
                </Button>
            </Container>
        </Box>
    );
}