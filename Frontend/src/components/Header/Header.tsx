import React from "react";
import {
    Box,
    Button,
    Container,
    Modal,
    Stack,
    Typography
} from "@mui/material";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";

const Header: React.FC = () => {
    const [openLogin, setOpenLogin] = React.useState(false);
    const [openRegister, setOpenRegister] = React.useState(false);

    // Hàm chuyển sang form đăng ký
    const handleSwitchToRegister = () => {
        setOpenLogin(false);
        setTimeout(() => setOpenRegister(true), 100); // Thêm delay nhỏ để tránh xung đột modal nếu cần
    };

    // Hàm chuyển sang form đăng nhập
    const handleSwitchToLogin = () => {
        setOpenRegister(false);
        setTimeout(() => setOpenLogin(true), 100);
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
                {/* MUI Modal yêu cầu children phải có khả năng nhận ref, thẻ div bọc ngoài là an toàn nhất */}
                <div style={{ outline: 'none' }}>
                    <LoginForm 
                        className="w-[400px] bg-white text-black" 
                        onSwitchToSignup={handleSwitchToRegister} 
                    />
                </div>
            </Modal>

            {/* ========== REGISTER POPUP ========== */}
            <Modal 
                open={openRegister} 
                onClose={() => setOpenRegister(false)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <div style={{ outline: 'none' }}>
                    <SignupForm 
                        className="w-[500px] bg-white text-black" 
                        onSwitchToLogin={handleSwitchToLogin} 
                    />
                </div>
            </Modal>
        </>
    );
};

export default Header;