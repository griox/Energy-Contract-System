import React from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TimelineIcon from "@mui/icons-material/Timeline";
const LifecycleSection: React.FC = () => {
    return (
        <Box sx={{ bgcolor: "#141466", color: "white", py: 6 }}>
            <Container maxWidth="lg">
                <Typography variant="h5" align="center" fontWeight={600}>
                    Streamline &amp; Automate the Entire Contract Lifecycle
                </Typography>

                <Typography align="center" sx={{ mt: 1, mb: 4, opacity: 0.9 }}>
                    Finally, one contract management solution for:
                </Typography>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(4,1fr)" },
                        gap: 3,
                    }}
                >
                    <LifecycleItem icon={<DescriptionIcon />} label="Document Management & Drafting" />
                    <LifecycleItem icon={<SearchIcon />} label="Searching & Reporting" />
                    <LifecycleItem icon={<VerifiedUserIcon />} label="Regulatory Compliance" />
                    <LifecycleItem icon={<AccessAlarmIcon />} label="Alerts & Calendar Notifications" />
                    <LifecycleItem icon={<AutoAwesomeIcon />} label="Auto Extraction" />
                    <LifecycleItem icon={<TimelineIcon />} label="Workflow Management" />
                    <LifecycleItem icon={<TimelineIcon />} label="Price & Cost Tracking" />
                    <LifecycleItem icon={<VerifiedUserIcon />} label="E-Signatures" />
                </Box>
            </Container>
        </Box>
    );
};

const LifecycleItem = ({ icon, label }: any) => (
    <Stack spacing={1} alignItems="center" textAlign="center">
        <Box
            sx={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {icon}
        </Box>
        <Typography variant="body2">{label}</Typography>
    </Stack>
);

export default LifecycleSection;