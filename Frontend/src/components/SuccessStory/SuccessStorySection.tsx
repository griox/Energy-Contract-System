import React from "react";
import { Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import successImg from "../../assets/images/success-energy.jpg";
import { signupFormRef } from "../Hero/HeroSection";
import { Link } from "react-router-dom";

const SuccessStorySection: React.FC = () => {
    return (
        <Box sx={{ bgcolor: "#f7f9fc", color: "black", py: 12 }}>
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 10,
                        alignItems: "flex-start",
                    }}
                >
                    {/* LEFT IMAGE */}
                    <Box
                        sx={{
                            width: 330,
                            height: 420,
                            borderRadius: 4,
                            overflow: "hidden",
                            boxShadow: "0 15px 35px rgba(0,0,0,0.18)",
                            transform: "rotate(-3deg)",
                            flexShrink: 0,
                            mt: 4,
                        }}
                    >
                        <img
                            src={successImg}
                            alt="Success Story"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </Box>

                    {/* RIGHT COLUMN */}
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: "#1f64d1", fontWeight: 700, mb: 1 }}>
                            SUCCESS STORY
                        </Typography>

                        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                            Brownsville Public Utilities Board
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{ mb: 4, maxWidth: 650, lineHeight: 1.7, color: "#555" }}
                        >
                            The Brownsville Public Utilities Board required a modern,
                            user-friendly solution with strong configuration options for
                            managing their full contract lifecycle. CobbleStone delivered.
                        </Typography>

                        {/* FORM CARD */}
                        <Box
                            ref={signupFormRef}
                            sx={{
                                bgcolor: "white",
                                p: 4,
                                borderRadius: 3,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                                border: "1px solid #e0e6ef",
                            }}
                        >
                            <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                                Get Started With Energy Contract Management Today
                            </Typography>

                            <Typography sx={{ mb: 4, opacity: 0.8, lineHeight: 1.6 }}>
                                Fill out the form below and our specialists will contact you
                                within 24 hours.
                            </Typography>

                            <Stack spacing={2}>
                                {/* First + Last Name */}
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField label="First Name *" fullWidth required size="medium" />
                                    <TextField label="Last Name *" fullWidth required size="medium" />
                                </Stack>

                                {/* Company */}
                                <TextField
                                    label="Company Name *"
                                    fullWidth
                                    required
                                    size="medium"
                                />

                                {/* Email + Phone */}
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField
                                        label="Company Email *"
                                        type="email"
                                        fullWidth
                                        required
                                        size="medium"
                                    />
                                    <TextField
                                        label="Phone Number *"
                                        fullWidth
                                        required
                                        size="medium"
                                    />
                                </Stack>

                                {/* PASSWORD */}
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField
                                        label="Password *"
                                        type="password"
                                        fullWidth
                                        required
                                        size="medium"
                                    />
                                    <TextField
                                        label="Confirm Password *"
                                        type="password"
                                        fullWidth
                                        required
                                        size="medium"
                                    />
                                </Stack>

                                {/* Submit Button */}
                                <Button
                                    variant="contained"
                                    sx={{
                                        mt: 1,
                                        bgcolor: "#2130d1ff",
                                        px: 5,
                                        py: 1.6,
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        borderRadius: 30,
                                        "&:hover": {
                                            bgcolor: "#4f57c9ff",
                                        },
                                    }}
                                >
                                    SUBMIT
                                </Button>

                                {/* Login Links */}
                                <Typography
                                    sx={{
                                        mt: 1,
                                        fontSize: "0.95rem",
                                        color: "#666",
                                    }}
                                >
                                    Already have an account?{" "}
                                    <Link
                                        to="/login"
                                        style={{
                                            color: "#1f64d1",
                                            fontWeight: 600,
                                            textDecoration: "none",
                                        }}
                                    >
                                        Sign in here
                                    </Link>
                                </Typography>

                            </Stack>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};
export default SuccessStorySection;