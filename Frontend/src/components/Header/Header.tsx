import React from "react";
import {
    Box,
    Button,
    Container,
    Modal,
    Stack,
    Typography
} from "@mui/material";
// import { useNavigate } from "react-router-dom"; // Removed as navigation is handled inside forms or not needed here directly
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";

const Header: React.FC = () => {
    const [openLogin, setOpenLogin] = React.useState(false);
    const [openRegister, setOpenRegister] = React.useState(false);

    // Helper to switch from Login to Register
    const handleSwitchToRegister = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default anchor behavior
        setOpenLogin(false);
        setOpenRegister(true);
    };

    // Helper to switch from Register to Login
    const handleSwitchToLogin = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default anchor behavior
        setOpenRegister(false);
        setOpenLogin(true);
    };

    return (
        <>
            {/* TOP NAV */}
            <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <Container
                    maxWidth="lg"
                    sx={{
                        py: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        INFODATION
                        <Typography
                            component="span"
                            variant="body2"
                            sx={{ ml: 1, opacity: 0.7 }}
                        >
                            Management
                        </Typography>
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={3}
                        sx={{ display: { xs: "none", md: "flex" } }}
                    >
                        <Typography>SOFTWARE</Typography>
                        <Typography>INDUSTRIES</Typography>
                        <Typography>FREE TRIAL</Typography>
                        <Typography>RESOURCES</Typography>
                        <Typography>COMPANY</Typography>
                        <Typography>BLOG</Typography>
                    </Stack>

                    <Button
                        variant="outlined"
                        onClick={() => setOpenLogin(true)}
                        sx={{
                            px: 3,
                            borderRadius: 999,
                            color: "white",
                            borderColor: "white",
                            "&:hover": { borderColor: "#4f77ff", color: "#4f77ff" }
                        }}
                    >
                        SIGN IN
                    </Button>
                </Container>
            </Box>

            {/* ========== LOGIN POPUP ========== */}
            <Modal 
                open={openLogin} 
                onClose={() => setOpenLogin(false)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {/* Wrap in a div to handle click events for switching forms properly */}
                <div onClick={(e) => {
                    // Check if the click target is the "Sign up" link inside the form
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'A' && target.getAttribute('href') === '/signup') {
                        handleSwitchToRegister(e as unknown as React.MouseEvent);
                    }
                }}>
                    <LoginForm className="w-[400px] bg-white text-black" />
                </div>
            </Modal>

            {/* ========== REGISTER POPUP ========== */}
            <Modal 
                open={openRegister} 
                onClose={() => setOpenRegister(false)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {/* Wrap in a div to handle click events for switching forms properly */}
                <div onClick={(e) => {
                    // Check if the click target is the "Sign in" link inside the form
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'A' && target.getAttribute('href') === '/') {
                        handleSwitchToLogin(e as unknown as React.MouseEvent);
                    }
                }}>
                    <SignupForm className="w-[500px] bg-white text-black" />
                </div>
            </Modal>
        </>
    );
};

export default Header;
