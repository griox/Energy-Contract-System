// src/pages/Template/TemplateEdit.tsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import {
    Box,
    Button,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
    FormControlLabel,
    CircularProgress,
    FormHelperText,
    useTheme,
    useMediaQuery,
    Tabs,
    Tab,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { alpha } from "@mui/material/styles";

import { useEffect, useMemo, useRef, useState } from "react";
import NavMenu from "@/components/NavMenu/NavMenu";
import { useTemplate, useUpdateTemplate } from "@/hooks/usePdf";
import { templateSchema } from "@/schemas/template.schema";

type TemplateEditFormValues = {
    description: string;
    htmlContent: string;
    isActive: boolean;
};

interface PreviewState {
    previewVariables?: Record<string, string>;
    fillFromContract?: boolean;
}

// Toolbar config
const modules = {
    toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        ["link", "image"],
        ["clean"],
    ],
};

export const CONTRACT_TEMPLATE_HTML = `
  <h1 style="text-align: center;">HỢP ĐỒNG MẪU</h1>
  <p>Mã hợp đồng: {ContractNumber}</p>
`;

export default function TemplateEdit() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const pageBg = "background.default";
    const cardBg = "background.paper";
    const borderColor = alpha(theme.palette.divider, 0.8);
    const paperShadow = isDark ? "none" : "0 2px 12px rgba(0,0,0,0.06)";

    const numericId = id ? Number(id) : NaN;

    const navigationState = (location.state as PreviewState) || {};
    const previewVariables = navigationState.previewVariables;
    const fillFromContract = navigationState.fillFromContract ?? !!previewVariables;

    const [templateName, setTemplateName] = useState<string>("");

    // ===== Desktop resize states (GIỮ NGUYÊN) =====
    const [leftWidth, setLeftWidth] = useState<number>(50);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { data, isLoading, isError } = useTemplate(numericId);
    const updateMutation = useUpdateTemplate();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        formState: { errors },
    } = useForm<TemplateEditFormValues>({
        resolver: yupResolver(templateSchema.omit(["name"])),
        defaultValues: {
            description: "",
            htmlContent: "",
            isActive: true,
        },
    });

    const htmlContent = watch("htmlContent");

    useEffect(() => {
        if (!data) return;

        setTemplateName(data.name);

        let htmlBase = data.htmlContent?.trim() || CONTRACT_TEMPLATE_HTML;

        if (fillFromContract && previewVariables) {
            Object.entries(previewVariables).forEach(([key, value]) => {
                const regex = new RegExp(`\\{${key}\\}`, "g");
                htmlBase = htmlBase.replace(regex, value ?? "");
            });
        }

        reset({
            description: data.description,
            htmlContent: htmlBase,
            isActive: data.isActive,
        });
    }, [data, reset, fillFromContract, previewVariables]);

    // drag + resize (desktop only) - GIỮ NGUYÊN + chặn mobile
    useEffect(() => {
        if (isMobile) return;

        function handleMouseMove(e: MouseEvent) {
            if (!isResizing || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;

            let newLeft = (offsetX / rect.width) * 100;
            newLeft = Math.max(30, Math.min(70, newLeft));
            setLeftWidth(newLeft);
        }

        function handleMouseUp() {
            if (isResizing) setIsResizing(false);
        }

        if (isResizing) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, isMobile]);

    const onSubmit = (values: TemplateEditFormValues) => {
        if (Number.isNaN(numericId)) return;

        updateMutation.mutate(
            {
                id: numericId,
                data: {
                    ...values,
                    htmlContent: values.htmlContent,
                },
            } as any,
            { onSuccess: () => navigate("/templates") }
        );
    };

    const isSubmitting = updateMutation.isPending;

    const previewHtml = useMemo(() => {
        const content =
            htmlContent && htmlContent.trim().length > 0
                ? htmlContent
                : `<p style="padding:16px;color:#888">${t("template.previewEmpty")}</p>`;

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
            background: #fff;
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `;
    }, [htmlContent, t]);

    // ===== Mobile UI states (KHÔNG ĐỤNG DESKTOP) =====
    const [mobileTab, setMobileTab] = useState<0 | 1>(0); // 0=settings, 1=content
    const [previewOpen, setPreviewOpen] = useState(false);

    // Guards
    if (Number.isNaN(numericId)) {
        return (
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
                <NavMenu />
                <Box sx={{ ml: { xs: 0, md: "260px" }, p: 3, width: "100%" }}>
                    <Typography color="error">{t("template.invalidId")}</Typography>
                </Box>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
                <NavMenu />
                <Box sx={{ ml: { xs: 0, md: "260px" }, p: 3, width: "100%" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <CircularProgress size={18} />
                        <Typography color="text.secondary">{t("Loading data...")}</Typography>
                    </Stack>
                </Box>
            </Box>
        );
    }

    if (isError || !data) {
        return (
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
                <NavMenu />
                <Box sx={{ ml: { xs: 0, md: "260px" }, p: 3, width: "100%" }}>
                    <Typography color="error">{t("template.loadError")}</Typography>
                </Box>
            </Box>
        );
    }

    return (
        // ✅ quan trọng: mobile = column để TopBar không bóp ngang content
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
            <NavMenu />

            <Box
                sx={{
                    ml: { xs: 0, md: "260px" }, // GIỮ Y NGUYÊN desktop của m
                    p: { xs: 2, md: 3 },
                    pt: { xs: 2, md: 3 },
                    bgcolor: pageBg,
                    minHeight: "100vh",
                    width: "100%",
                    color: "text.primary",
                }}
            >
                {/* HEADER */}
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                    sx={{ mb: 2, gap: 1.25 }}
                >
                    <Box>
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={900}>
                            {t("templateEdit.title")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t("templateEdit.subtitle")}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Button
                            fullWidth={isMobile}
                            variant="outlined"
                            onClick={() => navigate("/templates")}
                            disabled={isSubmitting}
                            sx={{ borderRadius: 2, fontWeight: 800 }}
                        >
                            {t("template.back")}
                        </Button>

                        <Button
                            fullWidth={isMobile}
                            variant="contained"
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
                            sx={{ borderRadius: 2, fontWeight: 900 }}
                        >
                            {isSubmitting ? t("Saving...") : t("templateEdit.save")}
                        </Button>
                    </Stack>
                </Stack>

                {/* =======================
            MOBILE LAYOUT (Tabs)
            ======================= */}
                {isMobile ? (
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            overflow: "hidden",
                            bgcolor: cardBg,
                            border: `1px solid ${borderColor}`,
                            boxShadow: paperShadow,
                        }}
                    >
                        <Tabs
                            value={mobileTab}
                            onChange={(_, v) => setMobileTab(v)}
                            variant="fullWidth"
                            sx={{
                                borderBottom: `1px solid ${borderColor}`,
                                "& .MuiTab-root": { fontWeight: 900 },
                            }}
                        >
                            <Tab label={t("template.settings")} />
                            <Tab label={t("template.editor")} />
                        </Tabs>

                        {/* SETTINGS TAB */}
                        {mobileTab === 0 ? (
                            <Box sx={{ p: 2 }}>
                                <Stack spacing={1.5}>
                                    <TextField
                                        label={t("template.name")}
                                        size="small"
                                        value={templateName}
                                        disabled
                                        fullWidth
                                    />

                                    <TextField
                                        label={t("template.description")}
                                        size="small"
                                        {...register("description")}
                                        error={!!errors.description}
                                        helperText={errors.description?.message?.toString()}
                                        fullWidth
                                    />

                                    <FormControlLabel
                                        control={<Switch {...register("isActive")} />}
                                        label={t("template.active")}
                                    />
                                </Stack>
                            </Box>
                        ) : (
                            /* CONTENT TAB */
                            <Box sx={{ p: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={900}>
                                        {t("template.editor")}
                                    </Typography>

                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setPreviewOpen(true)}
                                        sx={{ borderRadius: 2, fontWeight: 800 }}
                                    >
                                        {t("template.previewTitle")}
                                    </Button>
                                </Stack>

                                <Divider sx={{ mb: 1.5, borderColor }} />

                                <Box
                                    sx={{
                                        "& .quill": { display: "flex", flexDirection: "column" },
                                        "& .ql-toolbar": {
                                            backgroundColor: cardBg,
                                            borderColor: borderColor,
                                        },
                                        "& .ql-container": {
                                            borderColor: borderColor,
                                            backgroundColor: isDark ? alpha(theme.palette.common.white, 0.05) : "#fff",
                                            minHeight: 380,
                                            borderBottomLeftRadius: 8,
                                            borderBottomRightRadius: 8,
                                        },
                                        "& .ql-editor": {
                                            minHeight: 340,
                                        },
                                    }}
                                >
                                    <Controller
                                        name="htmlContent"
                                        control={control}
                                        render={({ field }) => (
                                            <ReactQuill
                                                theme="snow"
                                                value={field.value}
                                                onChange={field.onChange}
                                                modules={modules}
                                                placeholder={t("template.editorPlaceholderEdit")}
                                            />
                                        )}
                                    />

                                    {errors.htmlContent && (
                                        <FormHelperText error sx={{ mt: 1 }}>
                                            {errors.htmlContent.message as any}
                                        </FormHelperText>
                                    )}
                                </Box>

                                {/* PREVIEW DIALOG (mobile) */}
                                <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullScreen>
                                    <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}>
                                        <Box sx={{ flex: 1 }}>{t("template.previewTitle")}</Box>
                                        <IconButton onClick={() => setPreviewOpen(false)}>
                                            <CloseIcon />
                                        </IconButton>
                                    </DialogTitle>

                                    <DialogContent dividers sx={{ p: 0 }}>
                                        <Box
                                            sx={{
                                                height: "calc(100vh - 120px)",
                                                borderTop: `1px solid ${borderColor}`,
                                                bgcolor: isDark ? alpha(theme.palette.common.white, 0.04) : "#fff",
                                            }}
                                        >
                                            <iframe
                                                title="preview"
                                                style={{
                                                    border: "none",
                                                    width: "100%",
                                                    height: "100%",
                                                    backgroundColor: "white",
                                                }}
                                                srcDoc={previewHtml}
                                            />
                                        </Box>
                                    </DialogContent>

                                    <DialogActions sx={{ p: 2 }}>
                                        <Button
                                            variant="contained"
                                            onClick={() => setPreviewOpen(false)}
                                            sx={{ borderRadius: 2, fontWeight: 900 }}
                                            fullWidth
                                        >
                                            {t("Close", { defaultValue: "Close" })}
                                        </Button>
                                    </DialogActions>
                                </Dialog>
                            </Box>
                        )}
                    </Paper>
                ) : (
                    /* =======================
                       DESKTOP LAYOUT (GIỮ NGUYÊN)
                       ======================= */
                    <Box
                        ref={containerRef}
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            gap: 0,
                            height: "calc(100vh - 180px)",
                        }}
                    >
                        {/* LEFT: EDITOR */}
                        <Box
                            sx={{
                                flexBasis: `${leftWidth}%`,
                                pr: 1.5,
                                display: "flex",
                                flexDirection: "column",
                                minHeight: 0,
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                    bgcolor: cardBg,
                                    border: `1px solid ${borderColor}`,
                                    boxShadow: paperShadow,
                                    minHeight: 0,
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight={800}>
                                    {t("template.settings")}
                                </Typography>

                                <TextField label={t("template.name")} size="small" value={templateName} disabled fullWidth />

                                <TextField
                                    label={t("template.description")}
                                    size="small"
                                    {...register("description")}
                                    error={!!errors.description}
                                    helperText={errors.description?.message?.toString()}
                                    fullWidth
                                />

                                <FormControlLabel control={<Switch {...register("isActive")} />} label={t("template.active")} />

                                <Typography variant="subtitle2" fontWeight={800}>
                                    {t("template.editor")}
                                </Typography>

                                {/* QUILL */}
                                <Box
                                    sx={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        minHeight: 0,

                                        "& .quill": {
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            overflow: "hidden",
                                        },
                                        "& .ql-toolbar": {
                                            flexShrink: 0,
                                            backgroundColor: cardBg,
                                            borderColor: borderColor,
                                        },
                                        "& .ql-container": {
                                            flex: 1,
                                            overflow: "hidden",
                                            borderColor: borderColor,
                                            backgroundColor: isDark ? alpha(theme.palette.common.white, 0.05) : "#fff",
                                        },
                                        "& .ql-editor": {
                                            flex: 1,
                                            overflowY: "auto",
                                        },
                                    }}
                                >
                                    <Controller
                                        name="htmlContent"
                                        control={control}
                                        render={({ field }) => (
                                            <ReactQuill
                                                theme="snow"
                                                value={field.value}
                                                onChange={field.onChange}
                                                modules={modules}
                                                placeholder={t("template.editorPlaceholderEdit")}
                                            />
                                        )}
                                    />

                                    {errors.htmlContent && (
                                        <FormHelperText error>{errors.htmlContent.message as any}</FormHelperText>
                                    )}
                                </Box>
                            </Paper>
                        </Box>

                        {/* DRAG HANDLE */}
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box
                                onMouseDown={() => setIsResizing(true)}
                                sx={{
                                    width: "8px",
                                    height: "120px",
                                    cursor: "col-resize",
                                    bgcolor: alpha(theme.palette.text.secondary, isResizing ? 0.6 : 0.3),
                                    borderRadius: "4px",
                                }}
                            />
                        </Box>

                        {/* RIGHT: PREVIEW */}
                        <Box
                            sx={{
                                flexBasis: `${100 - leftWidth}%`,
                                pl: 1.5,
                                minHeight: 0,
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    bgcolor: cardBg,
                                    border: `1px solid ${borderColor}`,
                                    boxShadow: paperShadow,
                                    minHeight: 0,
                                }}
                            >
                                <Typography variant="subtitle1" fontWeight={800}>
                                    {t("template.previewTitle")}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {t("template.previewSubtitle")}
                                </Typography>

                                <Box
                                    sx={{
                                        mt: 1,
                                        flex: 1,
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: 1,
                                        overflow: "hidden",
                                        bgcolor: isDark ? alpha(theme.palette.common.white, 0.04) : "#fff",
                                    }}
                                >
                                    <iframe
                                        title="preview"
                                        style={{
                                            border: "none",
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: "white",
                                        }}
                                        srcDoc={previewHtml}
                                    />
                                </Box>
                            </Paper>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
