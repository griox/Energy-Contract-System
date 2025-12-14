import { useForm, Controller } from "react-hook-form"; // [UPDATE] Thêm Controller
import { yupResolver } from "@hookform/resolvers/yup";
import ReactQuill from 'react-quill'; // [NEW] Import React Quill
import 'react-quill/dist/quill.snow.css'; // [NEW] Import CSS của Quill

import { useCreateTemplate } from "@/hooks/usePdf";
import {
    Box,
    Button,
    Grid,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
    FormControlLabel,
    CircularProgress,
    FormHelperText // [NEW] Để hiển thị lỗi
} from "@mui/material";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavMenu from "@/components/NavMenu/NavMenu";
import { templateSchema } from "@/schemas/template.schema";

type TemplateCreateFormValues = {
    name: string;
    description: string;
    htmlContent: string;
    isActive: boolean;
};

// [CONFIG] Cấu hình thanh công cụ (Toolbar) cho Editor
const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        [{ 'align': [] }],                                // text alignment
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        ['link', 'image'],
        ['clean']                                         // remove formatting button
    ],
};

// HTML mẫu mặc định (đã rút gọn bớt CSS phức tạp để dễ hiển thị trên Editor)
const CONTRACT_TEMPLATE_HTML = `
    <h1 style="text-align: center;">HỢP ĐỒNG CUNG CẤP NĂNG LƯỢNG</h1>
    <h2 style="text-align: center; color: #6b7280;">(Gas / Điện năng · Energy Contract Manager)</h2>
    
    <h3>1. Thông tin Hợp đồng</h3>
    <p><strong>Mã hợp đồng:</strong> {{ContractNumber}}</p>
    <p><strong>Thời hạn:</strong> {{StartDate}} - {{EndDate}}</p>
    <hr />

    <h3>2. Thông tin Khách hàng</h3>
    <p><strong>Khách hàng:</strong> {{FullName}}</p>
    <p><strong>Email:</strong> {{Email}}</p>
    <p><strong>Công ty:</strong> {{CompanyName}}</p>
    <hr />

    <h3>3. Nội dung chi tiết</h3>
    <p>Bên A đồng ý cung cấp năng lượng cho Bên B theo các điều khoản đính kèm...</p>
    
    <p style="margin-top: 50px;"><strong>Đại diện Bên B</strong></p>
    <p>{{FullName}}</p>
`;

export default function TemplateCreate() {
    const navigate = useNavigate();
    const createMutation = useCreateTemplate();

    const {
        register,
        handleSubmit,
        watch,
        control, // [NEW] Cần lấy control để dùng cho Controller
        formState: { errors },
    } = useForm<TemplateCreateFormValues>({
        resolver: yupResolver(templateSchema),
        defaultValues: {
            name: "",
            description: "Default contract template",
            htmlContent: CONTRACT_TEMPLATE_HTML,
            isActive: true,
        },
    });

    const htmlContent = watch("htmlContent");

    // [UPDATE] Cập nhật logic Preview để thêm CSS thu nhỏ chữ
    const previewHtml = useMemo(() => {
        const content = htmlContent && htmlContent.trim().length > 0
            ? htmlContent
            : "<p style='font-family:system-ui;padding:16px;color:#888'>No HTML content yet. Start typing in the editor.</p>";

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        font-size: 10pt; /* [UPDATE] Cỡ chữ nhỏ hơn */
                        line-height: 1.4;
                        color: #333;
                        margin: 0;
                        padding: 20px; /* Padding giống trang giấy */
                    }
                    /* Thu nhỏ các thẻ Heading tương ứng */
                    h1 { font-size: 18pt; margin-bottom: 10px; }
                    h2 { font-size: 14pt; margin-bottom: 8px; }
                    h3 { font-size: 12pt; margin-bottom: 6px; }
                    p { margin-bottom: 8px; }
                    
                    /* Đảm bảo ảnh và bảng không bị tràn */
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

    const onSubmit = (values: TemplateCreateFormValues) => {
        createMutation.mutate(
            {
                ...values,
                htmlContent: values.htmlContent, // React Quill tự trả về HTML string
            },
            {
                onSuccess: () => {
                    navigate("/templates");
                },
            }
        );
    };

    const isSubmitting = createMutation.isPending;

    return (
        <>
            <NavMenu />
            <Box
                sx={{
                    ml: { xs: 0, md: "260px" },
                    p: 3,
                    bgcolor: "#f5f7fa",
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
                        <Typography variant="h5" fontWeight={700}>
                            Create PDF Template
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ maxWidth: 720 }}
                        >
                            Design your contract template using the editor below.
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/templates")}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isSubmitting ? "Creating..." : "Create template"}
                        </Button>
                    </Stack>
                </Stack>

                {/* BODY */}
                <Grid container spacing={3}>
                    {/* LEFT: FORM + EDITOR (Thu nhỏ lại từ 7 xuống 5) */}
                    <Grid size={{ xs: 12, md: 5 }} >
                        <Paper
                            elevation={2}
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={600}>
                                Template settings
                            </Typography>

                            <TextField
                                label="Template name"
                                size="small"
                                {...register("name")}
                                error={!!errors.name}
                                helperText={errors.name?.message?.toString()}
                                fullWidth
                            />

                            <TextField
                                label="Description"
                                size="small"
                                {...register("description")}
                                error={!!errors.description}
                                helperText={errors.description?.message?.toString()}
                                fullWidth
                            />

                            <FormControlLabel
                                control={<Switch defaultChecked {...register("isActive")} />}
                                label="Active"
                            />

                            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>
                                Content Editor
                            </Typography>

                            {/* [NEW] REACT QUILL EDITOR */}
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
                                    flexShrink: 0 // Giữ toolbar cố định
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
                                            placeholder="Write your contract content here..."
                                        />
                                    )}
                                />
                                {errors.htmlContent && (
                                    <FormHelperText error>{errors.htmlContent.message}</FormHelperText>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* RIGHT: PREVIEW (Mở rộng ra từ 5 lên 7) */}
                    <Grid size={{ xs: 12, md: 7 }} >
                        <Paper
                            elevation={2}
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                position: 'sticky',
                                top: 20
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={600}>
                                Live Preview
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                This is how the PDF will look (approx).
                            </Typography>

                            <Box
                                sx={{
                                    mt: 1,
                                    flex: 1,
                                    minHeight: 600, // Tăng chiều cao preview
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 1,
                                    overflow: "hidden",
                                    bgcolor: "white",
                                }}
                            >
                                <iframe
                                    title="Template preview"
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
                    </Grid>
                </Grid>
            </Box>
        </>
    );
}