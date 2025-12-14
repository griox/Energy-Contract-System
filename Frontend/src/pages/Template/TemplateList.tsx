// src/pages/Template/TemplateList.tsx
import { useTemplates } from "@/hooks/usePdf";
import {
    Box,
    Button,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Typography,
    Stack,
    Chip,
    IconButton,
    Tooltip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import { useNavigate } from "react-router-dom";
import NavMenu from "@/components/NavMenu/NavMenu";
import DeleteTemplateButton from "./TemplateDelete";

export default function TemplateList() {
    const navigate = useNavigate();

    // Use custom hook for fetching
    const { data, isLoading, isError } = useTemplates();
    const templates = Array.isArray(data) ? data : [];

    // Loading state
    if (isLoading) {
        return (
            <Box sx={{ display: "flex" }}>
                <NavMenu />
                <Typography sx={{ ml: { xs: 0, md: "260px" }, p: 3 }}>Loading templates...</Typography>
            </Box>
        );
    }

    // Error state
    if (isError) {
        return (
            <Box sx={{ display: "flex" }}>
                <NavMenu />
                <Typography sx={{ ml: { xs: 0, md: "260px" }, p: 3 }} color="error">
                    Failed to load templates. Please try again later.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex" }}>
            <NavMenu />

            <Box
                sx={{
                    ml: { xs: 0, md: "260px" },
                    p: 3,
                    width: "100%",
                    bgcolor: "#f5f7fa",
                    minHeight: "100vh",
                }}
            >
                {/* HEADER */}
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 3 }}
                >
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            PDF Templates
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage contract PDF templates for the Energy Contract Manager.
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("/templates/create")}
                        sx={{ fontWeight: 600 }}
                    >
                        New Template
                    </Button>
                </Stack>

                {/* TABLE */}
                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    {templates.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                            No templates found. Click "New Template" to create one.
                        </Typography>
                    ) : (
                        <Table size="small">
                            <TableHead sx={{ background: "#f8fafc" }}>
                                <TableRow>
                                    <TableCell width="5%">ID</TableCell>
                                    <TableCell width="25%">Name</TableCell>
                                    <TableCell width="40%">Description</TableCell>
                                    <TableCell width="10%">Status</TableCell>
                                    <TableCell width="20%" align="right">
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {templates.map((t: any) => (
                                    <TableRow key={t.id} hover>
                                        <TableCell>{t.id}</TableCell>

                                        <TableCell>
                                            <Typography fontWeight={600}>{t.name}</Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 420,
                                                    whiteSpace: "nowrap",
                                                    textOverflow: "ellipsis",
                                                    overflow: "hidden",
                                                }}
                                                title={t.description}
                                            >
                                                {t.description}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={t.isActive ? "Active" : "Inactive"}
                                                color={t.isActive ? "success" : "default"}
                                                variant={t.isActive ? "filled" : "outlined"}
                                            />
                                        </TableCell>

                                        <TableCell align="right">
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                justifyContent="flex-end"
                                            >
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/templates/edit/${t.id}`)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <DeleteTemplateButton id={t.id} />
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Paper>
            </Box>
        </Box>
    );
}
