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
    Divider,
} from "@mui/material";

import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NavMenu from "@/components/NavMenu/NavMenu";
import DeleteTemplateButton from "./TemplateDelete";

const SIDEBAR_WIDTH = 240;

export default function TemplateList() {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();

    const isDark = theme.palette.mode === "dark";

    // ✅ layout mobile phải khớp với NavMenu (NavMenu mobile = xs -> md)
    const isLayoutMobile = useMediaQuery(theme.breakpoints.down("md"));

    // ✅ chỉ card khi màn rất nhỏ
    const isCardMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const { data, isLoading, isError } = useTemplates();
    const templates = Array.isArray(data) ? data : [];

    const pageBg = "background.default";
    const cardBg = "background.paper";
    const borderColor = alpha(theme.palette.divider, 0.8);

    const headBg = isDark
        ? alpha(theme.palette.common.white, 0.06)
        : alpha(theme.palette.common.black, 0.04);

    const rowHoverBg = alpha(theme.palette.action.hover, isDark ? 0.35 : 0.6);

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" }, // ✅ FIX
                    minHeight: "100vh",
                    width: "100%",
                }}
            >
                <NavMenu />

                <Box
                    sx={{
                        ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
                        p: 3,
                        width: "100%",
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <CircularProgress size={20} />
                        <Typography>{t("templateList.loading")}</Typography>
                    </Stack>
                </Box>
            </Box>
        );
    }

    if (isError) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" }, // ✅ FIX
                    minHeight: "100vh",
                    width: "100%",
                }}
            >
                <NavMenu />

                <Typography
                    sx={{ ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` }, p: 3 }}
                    color="error"
                >
                    {t("templateList.loadFailed")}
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" }, // ✅ FIX quan trọng nhất
                minHeight: "100vh",
                width: "100%",
            }}
        >
            <NavMenu />

            <Box
                sx={{
                    ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
                    p: 3,
                    // nếu bạn thấy content dính topbar thì giữ pt này, không hại gì
                    pt: { xs: 2, md: 3 },
                    width: "100%",
                    bgcolor: pageBg,
                    minHeight: "100vh",
                    color: "text.primary",
                }}
            >
                {/* Header */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    sx={{ mb: 3 }}
                >
                    <Box>
                        <Typography variant="h4" fontWeight={800}>
                            {t("templateList.title")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t("templateList.subtitle")}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("/templates/create")}
                        sx={{ fontWeight: 700, width: { xs: "100%", sm: "auto" } }}
                    >
                        {t("templateList.new")}
                    </Button>
                </Stack>

                {/* Empty */}
                {templates.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            bgcolor: cardBg,
                            border: `1px solid ${borderColor}`,
                            textAlign: "center",
                            color: "text.secondary",
                        }}
                    >
                        {t("templateList.empty")}
                    </Paper>
                ) : isCardMobile ? (
                    // MOBILE: Cards
                    <Stack spacing={2}>
                        {templates.map((item: any) => (
                            <Paper
                                key={item.id}
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: cardBg,
                                    border: `1px solid ${borderColor}`,
                                }}
                            >
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="flex-start"
                                    spacing={2}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography fontWeight={800} sx={{ lineHeight: 1.2 }}>
                                            {item.name}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mt: 0.75,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {item.description}
                                        </Typography>
                                    </Box>

                                    <Chip
                                        size="small"
                                        label={
                                            item.isActive
                                                ? t("template.status.active")
                                                : t("template.status.inactive")
                                        }
                                        color={item.isActive ? "success" : "default"}
                                        variant={isDark ? "outlined" : item.isActive ? "filled" : "outlined"}
                                        sx={{ flexShrink: 0 }}
                                    />
                                </Stack>

                                <Divider sx={{ my: 1.5 }} />

                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.secondary">
                                        ID: <b>{item.id}</b>
                                    </Typography>

                                    <Stack direction="row" spacing={1}>
                                        <Tooltip title={t("Edit")}>
                                            <IconButton
                                                size="small"
                                                onClick={() => navigate(`/templates/edit/${item.id}`)}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <DeleteTemplateButton id={item.id} />
                                    </Stack>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                ) : (
                    // DESKTOP/TABLET: Table
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
                                    <TableCell sx={{ fontWeight: 800 }}>
                                        {t("templateList.columns.id")}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>
                                        {t("templateList.columns.name")}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>
                                        {t("templateList.columns.description")}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>
                                        {t("templateList.columns.status")}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                                        {t("templateList.columns.actions")}
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {templates.map((item: any) => (
                                    <TableRow key={item.id} hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                                        <TableCell>{item.id}</TableCell>

                                        <TableCell>
                                            <Typography fontWeight={700}>{item.name}</Typography>
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
                                                title={item.description}
                                            >
                                                {item.description}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={
                                                    item.isActive
                                                        ? t("template.status.active")
                                                        : t("template.status.inactive")
                                                }
                                                color={item.isActive ? "success" : "default"}
                                                variant={isDark ? "outlined" : item.isActive ? "filled" : "outlined"}
                                            />
                                        </TableCell>

                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Tooltip title={t("Edit")}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/templates/edit/${item.id}`)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <DeleteTemplateButton id={item.id} />
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
