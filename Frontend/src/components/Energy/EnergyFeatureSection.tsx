import React from "react";
import { Box, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";

const EnergyFeatureSection: React.FC = () => {
    return (
        <Box sx={{ bgcolor: "white", color: "black", py: 6 }}>
            <Container maxWidth="lg">
                <Typography
                    align="center"
                    sx={{ mb: 4, color: "text.secondary" }}
                >
                    Fully integrated, industry-specific contract management for energy organizations.
                </Typography>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                        gap: 3,
                    }}
                >
                    <FeatureCard
                        title="Manage Contracts Specific to Energy Sector"
                        desc="Manage contracts for vendors, customers, confidentiality agreements, utility services and more."
                    />

                    <FeatureCard
                        title="Energy Contract Management, E-Procurement & More"
                        desc="Centralize contracts, eProcurement, bidding and workflows in one place."
                    />
                </Box>
            </Container>
        </Box>
    );
};

const FeatureCard = ({ title, desc }: any) => (
    <Card variant="outlined">
        <CardContent>
            <Stack spacing={2} alignItems="center" textAlign="center">
                <Chip label={title} />
                <Typography variant="body2" color="text.secondary">
                    {desc}
                </Typography>
            </Stack>
        </CardContent>
    </Card>
);
export default EnergyFeatureSection;