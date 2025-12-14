import React from "react";
import { Box, Container, Typography } from "@mui/material";
const QuoteSection: React.FC = () => {
    return (
        <Box sx={{ bgcolor: "#1a1a6b", color: "white", py: 4 }}>
            <Container maxWidth="lg">
                <Typography align="center" sx={{ fontStyle: "italic" }}>
                    "When it came down to our energy sector requirements, CobbleStone was the obvious
                    choice." — Lee, Contract Manager
                </Typography>
            </Container>
        </Box>
    );
};
export default QuoteSection;