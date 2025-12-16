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
    CircularProgress,
    useTheme,
    useMediaQuery,
} from "@mui/material";

import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NavMenu from "@/components/NavMenu/NavMenu";
import DeleteTemplateButton from "./TemplateDelete";

export default function TemplateList() {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();

    const isDark = theme.palette.mode === "dark";
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const { data, isLoading, isError } = useTemplates();
    const templates = Array.isArray(data) ? data : [];

    const pageBg = "background.default";
    const cardBg = "background.paper";
    const borderColor = alpha(theme.palette.divider, 0.8);

    const headBg = isDark
        ? alpha(theme.palette.common.white, 0.06)
        : alpha(theme.palette.common.black, 0.04);

    const rowHoverBg = alpha(theme.palette.action.hover, isDark ? 0.35 : 0.6);

    // Loading
    if (isLoading) {
        return (
            <Box sx={{ display: "flex" }}>
                <NavMenu />
                <Box sx={{ ml: { xs: 0, md: "260px" }, p: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <CircularProgress size={20} />
                        <Typography>{t("templates.loading")}</Typography>
                    </Stack>
                </Box>
            </Box>
        );
    }

    if (isError) {
        return (
            <Box sx={{ display: "flex" }}>
                <NavMenu />
                <Typography sx={{ ml: { xs: 0, md: "260px" }, p: 3 }} color="error">
                    {t("templates.failed")}
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
                    bgcolor: pageBg,
                    minHeight: "100vh",
                }}
            >
                {/* Header */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    sx={{ mb: 3 }}
                >
                    <Box>
                        <Typography variant="h4" fontWeight={800}>
                            {t("templates.title")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t("templates.subtitle")}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("/templates/create")}
                        sx={{ fontWeight: 700, width: { xs: "100%", sm: "auto" } }}
                    >
                        {t("templates.new")}
                    </Button>
                </Stack>

                {/* MOBILE VIEW */}
                {isMobile ? (
                    <Stack spacing={2}>
                        {templates.map((tItem: any) => (
                            <Paper
                                key={tItem.id}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: cardBg,
                                    border: `1px solid ${borderColor}`,
                                }}
                            >
                                <Typography fontWeight={700}>{tItem.name}</Typography>

                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    <Chip
                                        size="small"
                                        label={tItem.isActive ? t("templates.active") : t("templates.inactive")}
                                        color={tItem.isActive ? "success" : "default"}
                                        variant={isDark ? "outlined" : "filled"}
                                    />
                                </Stack>

                                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                                    <Tooltip title={t("templates.edit")}>
                                        <IconButton
                                            size="small"
                                            onClick={() => navigate(`/templates/edit/${tItem.id}`)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>

                                    <DeleteTemplateButton id={tItem.id} />
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                ) : (
                    // DESKTOP TABLE
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: cardBg,
                            border: `1px solid ${borderColor}`,
                        }}
                    >
                        <Table size="small">
                            <TableHead sx={{ bgcolor: headBg }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>{t("templates.id")}</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>{t("templates.name")}</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>{t("templates.description")}</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>{t("templates.status")}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                                        {t("templates.actions")}
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {templates.map((tItem: any) => (
                                    <TableRow
                                        key={tItem.id}
                                        hover
                                        sx={{ "&:hover": { bgcolor: rowHoverBg } }}
                                    >
                                        <TableCell>{tItem.id}</TableCell>

                                        <TableCell>
                                            <Typography fontWeight={700}>{tItem.name}</Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 420,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {tItem.description}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={
                                                    tItem.isActive ? t("templates.active") : t("templates.inactive")
                                                }
                                                color={tItem.isActive ? "success" : "default"}
                                            />
                                        </TableCell>

                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Tooltip title={t("templates.edit")}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            navigate(`/templates/edit/${tItem.id}`)
                                                        }
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <DeleteTemplateButton id={tItem.id} />
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                )}
            </Box>
        </Box>
    );
}
