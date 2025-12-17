import React, { useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    IconButton,
    TextField,
    Button,
    Stack,
    MenuItem,
    Divider,
    CircularProgress,
    useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FiArrowLeft } from "react-icons/fi";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Hooks
import { useCreateContract, useUpdateContract, useContract } from "@/hooks/useContracts"; 
import { useResellers } from "@/hooks/useResellers";
import { useAddresses } from "@/hooks/useAddresses";

const SIDEBAR_WIDTH = 240;

type FormValues = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName: string;
    bankAccountNumber: string;
    startDate: string;
    endDate: string;
    resellerId: string;
    addressId: string;
};

interface ContractFormBaseProps {
    mode: "create" | "edit";
    contractId?: number;
}

export default function ContractFormBase({ mode, contractId }: ContractFormBaseProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isEdit = mode === "edit";

    // --- Data Selects ---
    const { data: resellersData, isLoading: loadingResellers } = useResellers({
        pageNumber: 1,
        pageSize: 200,
    });
    const resellers = resellersData?.items || [];

    const { data: addressesData, isLoading: loadingAddresses } = useAddresses({
        pageNumber: 1,
        pageSize: 200,
    });
    const addresses = addressesData?.items || [];

    // --- Data Fetching (For Edit Mode) ---
    // SỬA LỖI TẠI ĐÂY: Chỉ truyền 1 tham số là ID.
    // Hook useContract của bạn đã có logic `enabled: !!id`, nên nếu ID = 0 nó sẽ không gọi API.
    const { data: contractData, isLoading: loadingContract } = useContract(contractId || 0);

    // --- Mutations ---
    const createMutation = useCreateContract();
    const updateMutation = useUpdateContract();

    const { register, handleSubmit, reset, watch } = useForm<FormValues>({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            companyName: "",
            bankAccountNumber: "",
            startDate: "",
            endDate: "",
            resellerId: "",
            addressId: "",
        },
    });

    // --- Effect: Populate Form for Edit ---
    useEffect(() => {
        if (isEdit && contractData) {
            // Helper to format ISO date to YYYY-MM-DD for input type="date"
            const formatDate = (isoString: string) => isoString ? isoString.split('T')[0] : "";

            reset({
                firstName: contractData.firstName,
                lastName: contractData.lastName,
                email: contractData.email,
                phone: contractData.phone,
                companyName: contractData.companyName,
                bankAccountNumber: contractData.bankAccountNumber,
                startDate: formatDate(contractData.startDate),
                endDate: formatDate(contractData.endDate),
                resellerId: String(contractData.resellerId || ""),
                addressId: String(contractData.addressId || ""),
            });
        }
    }, [isEdit, contractData, reset]);

    const isSubmitting = createMutation.isPending || updateMutation.isPending;
    // Kiểm tra loading: Nếu đang edit mà chưa có data thì tính là loading
    const isLoadingInitial = loadingResellers || loadingAddresses || (isEdit && loadingContract);

    const onSubmit = (form: FormValues) => {
        const payload: any = {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            companyName: form.companyName ?? "",
            bankAccountNumber: form.bankAccountNumber ?? "",
            resellerId: Number(form.resellerId) || 0,
            addressId: Number(form.addressId) || 0,
            startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
            endDate: form.endDate ? new Date(form.endDate).toISOString() : new Date().toISOString(),
        };

        if (isEdit && contractId) {
            // Update Logic
            updateMutation.mutate({ id: contractId, data: payload }, {
                onSuccess: () => {
                    toast.success(t("contractCreate.toast.updated") || "Cập nhật thành công");
                    navigate("/contracts/list");
                },
                onError: (err: any) => {
                    console.error("UPDATE ERROR:", err);
                    toast.error(t("contractCreate.toast.updateFailed") || "Cập nhật thất bại");
                },
            });
        } else {
            // Create Logic
            payload.contractNumber = "AUTO-" + Date.now();
            payload.pdfLink = "";

            createMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success(t("contractCreate.toast.created") || "Tạo mới thành công");
                    navigate("/contracts/list");
                },
                onError: (err: any) => {
                    console.error("CREATE ERROR:", err);
                    toast.error(t("contractCreate.toast.createFailed") || "Tạo mới thất bại");
                },
            });
        }
    };

    const pageBg = "background.default";
    const paperBg = "background.paper";
    const borderColor = alpha(theme.palette.divider, 0.8);

    return (
        <Box
            sx={{
                ml: `${SIDEBAR_WIDTH}px`,
                p: 4,
                width: "100%",
                minHeight: "100vh",
                bgcolor: pageBg,
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "flex-start",
            }}
        >
            <Paper
                sx={{
                    width: "100%",
                    maxWidth: 1200,
                    borderRadius: 4,
                    overflow: "hidden",
                    bgcolor: paperBg,
                    border: `1px solid ${borderColor}`,
                    boxShadow: isDark ? "none" : "0 10px 30px rgba(0,0,0,0.08)",
                }}
            >
                {/* Top header */}
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: paperBg,
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <IconButton onClick={() => navigate(-1)}>
                            <FiArrowLeft />
                        </IconButton>
                        <Box>
                            <Typography variant="h6" fontWeight={800} lineHeight={1.1} color="text.primary">
                                {isEdit ? t("Edit Contract") : t("contractCreate.title")}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {isEdit ? t("Edit existing contract details") : t("contractCreate.subtitle")}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ borderColor }} />

                {/* Body */}
                <Box sx={{ p: 3, bgcolor: pageBg }}>
                    {isLoadingInitial ? (
                        <Box display="flex" justifyContent="center" py={8}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Paper
                                sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    bgcolor: paperBg,
                                    border: `1px solid ${borderColor}`,
                                    boxShadow: isDark ? "none" : "0 6px 18px rgba(0,0,0,0.06)",
                                }}
                            >
                                <Stack spacing={2.25}>
                                    {/* Row 1 */}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <TextField
                                            label={t("contractCreate.firstName")}
                                            {...register("firstName", { required: true })}
                                            fullWidth
                                        />
                                        <TextField
                                            label={t("contractCreate.lastName")}
                                            {...register("lastName", { required: true })}
                                            fullWidth
                                        />
                                    </Stack>

                                    {/* Row 2 */}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <TextField
                                            label={t("contractCreate.email")}
                                            {...register("email", { required: true })}
                                            fullWidth
                                        />
                                        <TextField
                                            label={t("contractCreate.phone")}
                                            {...register("phone")}
                                            fullWidth
                                        />
                                    </Stack>

                                    {/* Row 3 */}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <TextField
                                            type="date"
                                            label={t("contractCreate.startDate")}
                                            InputLabelProps={{ shrink: true }}
                                            {...register("startDate")}
                                            fullWidth
                                        />
                                        <TextField
                                            type="date"
                                            label={t("contractCreate.endDate")}
                                            InputLabelProps={{ shrink: true }}
                                            {...register("endDate")}
                                            fullWidth
                                        />
                                    </Stack>

                                    {/* Row 4 */}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <TextField
                                            label={t("contractCreate.companyName")}
                                            {...register("companyName")}
                                            fullWidth
                                        />
                                        <TextField
                                            label={t("contractCreate.bankAccountNumber")}
                                            {...register("bankAccountNumber")}
                                            fullWidth
                                        />
                                    </Stack>

                                    {/* Row 5 */}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <TextField
                                            select
                                            label={t("contractCreate.reseller")}
                                            {...register("resellerId")}
                                            value={watch("resellerId") || ""}
                                            fullWidth
                                        >
                                            <MenuItem value="">{t("contractCreate.select")}</MenuItem>
                                            {resellers.map((r: any) => (
                                                <MenuItem key={r.id} value={String(r.id)}>
                                                    {r.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <TextField
                                            select
                                            label={t("contractCreate.address")}
                                            {...register("addressId")}
                                            value={watch("addressId") || ""}
                                            fullWidth
                                        >
                                            <MenuItem value="">{t("contractCreate.select")}</MenuItem>
                                            {addresses.map((a: any) => (
                                                <MenuItem key={a.id} value={String(a.id)}>
                                                    {a.houseNumber} • {a.zipCode}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Stack>
                                </Stack>
                            </Paper>

                            {/* Actions */}
                            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate("/contracts/list")}
                                    disabled={isSubmitting}
                                    sx={{ minWidth: 120 }}
                                >
                                    {t("Cancel")}
                                </Button>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isSubmitting}
                                    startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
                                    sx={{ minWidth: 140 }}
                                >
                                    {isSubmitting 
                                        ? (isEdit ? t("Updating...") : t("Creating...")) 
                                        : (isEdit ? t("Update") : t("Create"))
                                    }
                                </Button>
                            </Box>
                        </form>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}