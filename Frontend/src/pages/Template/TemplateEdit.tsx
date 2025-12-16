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
} from "@mui/material";
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

    const pageBg = "background.default";
    const cardBg = "background.paper";
    const borderColor = alpha(theme.palette.divider, 0.8);
    const paperShadow = isDark ? "none" : "0 2px 12px rgba(0,0,0,0.06)";

    const numericId = id ? Number(id) : NaN;

    const navigationState = (location.state as PreviewState) || {};
    const previewVariables = navigationState.previewVariables;
    const fillFromContract = navigationState.fillFromContract ?? !!previewVariables;

    const [templateName, setTemplateName] = useState<string>("");

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

    // drag + resize
    useEffect(() => {
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
    }, [isResizing]);

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
                : "<p style='padding:16px;color:#888'>No content</p>";

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: system-ui;
            margin: 0;
            padding: 20px;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `;
    }, [htmlContent]);

    // Guards
    if (Number.isNaN(numericId))
        return (
            <Box sx={{ display: "flex" }}>
                <NavMenu />
                <Box sx={{ ml: { md: "260px" }, p: 3 }}>Invalid ID</Box>
            </Box>
        );

    if (isLoading)
        return (
            <Box sx={{ display: "flex" }}>
                <NavMenu />
                <Box sx={{ ml: { md: "260px" }, p: 3 }}>Loading...</Box>
            </Box>
        );

    if (isError || !data)
        return (
            <Box sx={{ display: "flex" }}>
                <NavMenu />
                <Box sx={{ ml: { md: "260px" }, p: 3 }}>Error loading template.</Box>
            </Box>
        );

    return (
        <>
            <NavMenu />

            <Box
                sx={{
                    ml: { xs: 0, md: "260px" },
                    p: 3,
                    bgcolor: pageBg,
                    minHeight: "100vh",
                }}
            >
                {/* HEADER */}
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    sx={{ mb: 3, gap: 1.5 }}
                >
                    <Box>
                        <Typography variant="h5" fontWeight={800}>
                            {t("templateEdit.title")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t("templateEdit.subtitle")}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={() => navigate("/templates")} disabled={isSubmitting}>
                            {t("templateEdit.back")}
                        </Button>

                        <Button
                            variant="contained"
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                        >
                            {isSubmitting ? t("templateEdit.saving") : t("templateEdit.save")}
                        </Button>
                    </Stack>
                </Stack>

                {/* BODY */}
                <Box
                    ref={containerRef}
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: { xs: 2, md: 0 },
                        height: { xs: "auto", md: "calc(100vh - 180px)" },
                    }}
                >
                    {/* LEFT: EDITOR */}
                    <Box
                        sx={{
                            flexBasis: { xs: "100%", md: `${leftWidth}%` },
                            pr: { md: 1.5 },
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
                                height: { xs: "auto", md: "100%" },
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                bgcolor: cardBg,
                                border: `1px solid ${borderColor}`,
                                boxShadow: paperShadow,
                                minHeight: 0,
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={700}>
                                {t("templateEdit.settings")}
                            </Typography>

                            <TextField label={t("templateEdit.name")} size="small" value={templateName} disabled fullWidth />

                            <TextField
                                label={t("templateEdit.description")}
                                size="small"
                                {...register("description")}
                                error={!!errors.description}
                                helperText={errors.description?.message?.toString()}
                                fullWidth
                            />

                            <FormControlLabel control={<Switch {...register("isActive")} />} label={t("templateEdit.active")} />

                            <Typography variant="subtitle2" fontWeight={700}>
                                {t("templateEdit.contentEditor")}
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
                                            placeholder={t("templateEdit.placeholder")}
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
                    <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
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
                    <Box sx={{ flexBasis: { xs: "100%", md: `${100 - leftWidth}%` }, pl: { md: 1.5 }, minHeight: 0 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                height: { xs: 520, md: "100%" },
                                display: "flex",
                                flexDirection: "column",
                                bgcolor: cardBg,
                                border: `1px solid ${borderColor}`,
                                boxShadow: paperShadow,
                                minHeight: 0,
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={700}>
                                {t("templateEdit.preview")}
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
            </Box>
        </>
    );
}
