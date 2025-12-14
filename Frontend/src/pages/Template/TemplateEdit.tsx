// src/pages/Template/TemplateEdit.tsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form"; // [UPDATE] Thêm Controller
import { yupResolver } from "@hookform/resolvers/yup";
import ReactQuill from 'react-quill'; // [NEW] Import React Quill
import 'react-quill/dist/quill.snow.css'; // [NEW] Import CSS

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
    FormHelperText
} from "@mui/material";
import { useEffect, useState, useMemo, useRef } from "react";
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

// [CONFIG] Cấu hình Toolbar cho Editor
const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'align': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean']
    ],
};

// HTML mẫu fallback
export const CONTRACT_TEMPLATE_HTML = `
    <h1 style="text-align: center;">HỢP ĐỒNG MẪU</h1>
    <p>Mã hợp đồng: {ContractNumber}</p>
`;

export default function TemplateEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const numericId = id ? Number(id) : NaN;

    const navigationState = (location.state as PreviewState) || {};
    const previewVariables = navigationState.previewVariables;
    const fillFromContract = navigationState.fillFromContract ?? !!previewVariables;

    const [templateName, setTemplateName] = useState<string>("");
    const [leftWidth, setLeftWidth] = useState<number>(50);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // --- Hooks ---
    const { data, isLoading, isError } = useTemplate(numericId);
    const updateMutation = useUpdateTemplate();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control, // [NEW] Lấy control cho ReactQuill
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

    // 🔹 Load template từ API + Merge dữ liệu
    useEffect(() => {
        if (data) {
            setTemplateName(data.name);

            const htmlFromDb = data.htmlContent?.trim();
            let htmlBase = htmlFromDb && htmlFromDb.length > 0 ? htmlFromDb : CONTRACT_TEMPLATE_HTML;

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
        }
    }, [data, reset, fillFromContract, previewVariables]);

    // 🔹 Drag handle logic
    useEffect(() => {
        function handleMouseMove(e: MouseEvent) {
            if (!isResizing || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            let newLeft = (offsetX / rect.width) * 100;
            newLeft = Math.max(30, Math.min(70, newLeft)); // Giới hạn kéo thả hợp lý hơn
            setLeftWidth(newLeft);
        }
        function handleMouseUp() { if (isResizing) setIsResizing(false); }

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
                    htmlContent: values.htmlContent, // React Quill trả về HTML string chuẩn
                },
            },
            {
                onSuccess: () => {
                    navigate("/templates");
                },
            }
        );
    };

    const isSubmitting = updateMutation.isPending;

    // 🔹 Preview Logic (Cập nhật CSS giống TemplateCreate)
    const previewHtml = useMemo(() => {
        const content = htmlContent && htmlContent.trim().length > 0
            ? htmlContent
            : "<p style='font-family:system-ui;padding:16px;color:#888'>No HTML content yet.</p>";

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        font-size: 10pt;
                        line-height: 1.4;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                    }
                    h1 { font-size: 18pt; margin-bottom: 10px; }
                    h2 { font-size: 14pt; margin-bottom: 8px; }
                    h3 { font-size: 12pt; margin-bottom: 6px; }
                    p { margin-bottom: 8px; }
                    img { max-width: 100%; height: auto; }
                    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
                    th, td { border: 1px solid #ddd; padding: 4px 8px; }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
    }, [htmlContent]);

    if (Number.isNaN(numericId)) return <Box sx={{ ml: { xs: 0, md: "260px" }, p: 3 }}>Invalid ID</Box>;
    if (isLoading) return <Box sx={{ ml: { xs: 0, md: "260px" }, p: 3 }}>Loading...</Box>;
    if (isError || !data) return <Box sx={{ ml: { xs: 0, md: "260px" }, p: 3 }}>Error loading template.</Box>;

    return (
        <>
            <NavMenu />
            <Box sx={{ ml: { xs: 0, md: "260px" }, p: 3, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
                {/* HEADER */}
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>Edit PDF Template</Typography>
                        <Typography variant="body2" color="text.secondary">Update HTML layout and settings.</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={() => navigate("/templates")} disabled={isSubmitting}>Back</Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSubmit(onSubmit)} 
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isSubmitting ? "Saving..." : "Save changes"}
                        </Button>
                    </Stack>
                </Stack>

                {/* BODY */}
                <Box ref={containerRef} sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 2, md: 0 }, height: 'calc(100vh - 180px)' }}>
                    {/* LEFT: EDITOR */}
                    <Box sx={{ flexBasis: { xs: "100%", md: `${leftWidth}%` }, pr: { md: 1.5 }, display: 'flex', flexDirection: 'column' }}>
                        <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600}>Settings</Typography>
                            <TextField label="Name" size="small" value={templateName} disabled fullWidth />
                            <TextField label="Description" size="small" {...register("description")} fullWidth />
                            <FormControlLabel control={<Switch {...register("isActive")} />} label="Active" />
                            
                            <Typography variant="subtitle2" fontWeight={600}>Content Editor</Typography>
                            
                            {/* [UPDATE] Thay TextField bằng ReactQuill */}
                            <Box sx={{ 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: 'column',
                                minHeight: 0, // [FIX] Quan trọng: Ngăn flex item bị tràn ra ngoài parent
                                '& .quill': { 
                                    flex: 1, 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    overflow: 'hidden' 
                                },
                                '& .ql-toolbar': {
                                    flexShrink: 0 // Giữ toolbar cố định, không bị co
                                },
                                '& .ql-container': { 
                                    flex: 1, 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    overflow: 'hidden', // Ẩn scroll ở container bao ngoài
                                    borderBottomLeftRadius: '8px',
                                    borderBottomRightRadius: '8px'
                                },
                                '& .ql-editor': {
                                    flex: 1,
                                    overflowY: 'auto', // [FIX] Scroll nội dung bên trong editor
                                    fontSize: '14px'
                                }
                            }}>
                                <Controller
                                    name="htmlContent"
                                    control={control}
                                    render={({ field }) => (
                                        <ReactQuill
                                            theme="snow"
                                            value={field.value}
                                            onChange={field.onChange}
                                            modules={modules}
                                            placeholder="Edit contract content here..."
                                        />
                                    )}
                                />
                                {errors.htmlContent && (
                                    <FormHelperText error>{errors.htmlContent.message}</FormHelperText>
                                )}
                            </Box>
                        </Paper>
                    </Box>

                    {/* DRAG HANDLE */}
                    <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center", alignItems: 'center' }}>
                        <Box 
                            onMouseDown={() => setIsResizing(true)} 
                            sx={{ 
                                width: "8px", 
                                height: "100px", 
                                cursor: "col-resize", 
                                bgcolor: isResizing ? "#3b82f6" : "#cbd5e1", 
                                borderRadius: "4px",
                                transition: "background-color 0.2s",
                                '&:hover': { bgcolor: "#94a3b8" }
                            }} 
                        />
                    </Box>

                    {/* RIGHT: PREVIEW */}
                    <Box sx={{ flexBasis: { xs: "100%", md: `${100 - leftWidth}%` }, pl: { md: 1.5 } }}>
                        <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                            <Typography variant="subtitle1" fontWeight={600}>Live Preview</Typography>
                            <Box sx={{ mt: 1, flex: 1, border: "1px solid #e2e8f0", borderRadius: 1, bgcolor: "white", overflow: 'hidden' }}>
                                <iframe 
                                    title="preview" 
                                    style={{ border: "none", width: "100%", height: "100%" }} 
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
