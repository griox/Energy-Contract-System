import { useEffect } from "react";
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
} from "@mui/material";

import { FiArrowLeft } from "react-icons/fi";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Xóa NavMenu ở đây vì component cha (ContractCreate/ContractEdit) đã gọi
import { useCreateContract, useUpdateContract, useContract } from "@/hooks/useContracts";
import { useResellers } from "@/hooks/useResellers";
import { useAddresses } from "@/hooks/useAddresses";

// 1. Định nghĩa Props
interface ContractFormBaseProps {
    mode: "create" | "edit";
    contractId?: number;
}

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

// 2. Đổi tên component và nhận props
export default function ContractFormBase({ mode, contractId }: ContractFormBaseProps) {
    const navigate = useNavigate();

    // --- Data Select ---
    const { data: resellersData, isLoading: loadingResellers } = useResellers({ pageNumber: 1, pageSize: 200 });
    const resellers = resellersData?.items || [];

    const { data: addressesData, isLoading: loadingAddresses } = useAddresses({ pageNumber: 1, pageSize: 200 });
    const addresses = addressesData?.items || [];

    // --- Load Data for Edit ---
    const { data: contractData, isLoading: loadingContract } = useContract(contractId || 0);

    // --- Mutations ---
    const createMutation = useCreateContract();
    const updateMutation = useUpdateContract();

    const { register, handleSubmit, reset, watch } = useForm<FormValues>({
        defaultValues: {
            firstName: "", lastName: "", email: "", phone: "",
            companyName: "", bankAccountNumber: "",
            startDate: "", endDate: "", resellerId: "", addressId: "",
        },
    });

    // 3. Effect: Fill data form khi ở chế độ Edit
    useEffect(() => {
        if (mode === "edit" && contractData) {
            reset({
                firstName: contractData.firstName || "",
                lastName: contractData.lastName || "",
                email: contractData.email || "",
                phone: contractData.phone || "",
                companyName: contractData.companyName || "",
                bankAccountNumber: contractData.bankAccountNumber || "",
                startDate: contractData.startDate ? contractData.startDate.split("T")[0] : "",
                endDate: contractData.endDate ? contractData.endDate.split("T")[0] : "",
                resellerId: String(contractData.resellerId || ""),
                addressId: String(contractData.addressId || ""),
            });
        } else if (mode === "create") {
            reset({
                firstName: "", lastName: "", email: "", phone: "",
                companyName: "", bankAccountNumber: "",
                startDate: "", endDate: "", resellerId: "", addressId: "",
            });
        }
    }, [mode, contractData, reset]);

    const isSubmitting = createMutation.isPending || updateMutation.isPending;
    const isLoading = loadingResellers || loadingAddresses || (mode === "edit" && loadingContract);

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
            pdfLink: "",
            contractNumber: mode === "create" ? "AUTO-" + Date.now() : contractData?.contractNumber,
        };

        if (mode === "create") {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success("Contract created!");
                    navigate("/contracts/list");
                },
                onError: (err: any) => {
                    console.error("CREATE ERROR:", err);
                    toast.error("Failed to create contract!");
                },
            });
        } else {
            if (!contractId) return;
            updateMutation.mutate({ id: contractId, data: { ...payload, id: contractId } }, {
                onSuccess: () => {
                    toast.success("Contract updated!");
                    navigate("/contracts/list");
                },
                onError: (err: any) => {
                    console.error("UPDATE ERROR:", err);
                    toast.error("Failed to update contract!");
                },
            });
        }
    };

    return (
        <Box
            sx={{
                flexGrow: 1,
                ml: { xs: 0, md: "260px" }, // Responsive margin để tránh đè lên NavMenu
                p: 4,
                width: "100%",
                minHeight: "100vh",
                background: "#F8FAFC",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "flex-start",
            }}
        >
            <Paper
                sx={{
                    width: "100%",
                    maxWidth: 1200,
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
            >
                {/* Header */}
                <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "white" }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <IconButton onClick={() => navigate(-1)}>
                            <FiArrowLeft />
                        </IconButton>
                        <Box>
                            <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
                                {mode === "create" ? "Create Contract" : `Edit Contract #${contractData?.contractNumber || contractId}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {mode === "create" ? "Fill in information to create a new contract" : "Update contract information"}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider />

                {/* Body */}
                <Box sx={{ p: 3, bgcolor: "#F8FAFC" }}>
                    {isLoading ? (
                        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
                                <Stack spacing={2.25}>
                                    {/* Row 1 */}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <TextField label="First Name" {...register("firstName", { required: true })} fullWidth InputLabelProps={{ shrink: true }} />
                                        <TextField label="Last Name" {...register("lastName", { required: true })} fullWidth InputLabelProps={{ shrink: true }} />
                                    </Stack>
                                    {/* Row 2 */}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <TextField label="Email" {...register("email", { required: true })} fullWidth InputLabelProps={{ shrink: true }} />
                                        <TextField label="Phone" {...register("phone")} fullWidth InputLabelProps={{ shrink: true }} />
                                    </Stack>
                                    {/* Row 3 */}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <TextField type="date" label="Start Date" InputLabelProps={{ shrink: true }} {...register("startDate")} value={watch("startDate") || ""} fullWidth />
                                        <TextField type="date" label="End Date" InputLabelProps={{ shrink: true }} {...register("endDate")} value={watch("endDate") || ""} fullWidth />
                                    </Stack>
                                    {/* Row 4 */}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <TextField label="Company Name" {...register("companyName")} fullWidth InputLabelProps={{ shrink: true }} />
                                        <TextField label="Bank Account Number" {...register("bankAccountNumber")} fullWidth InputLabelProps={{ shrink: true }} />
                                    </Stack>
                                    {/* Row 5 */}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <TextField select label="Reseller" {...register("resellerId")} value={watch("resellerId") || ""} fullWidth InputLabelProps={{ shrink: true }}>
                                            <MenuItem value="">-- Select --</MenuItem>
                                            {resellers.map((r: any) => <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>)}
                                        </TextField>
                                        <TextField select label="Address" {...register("addressId")} value={watch("addressId") || ""} fullWidth InputLabelProps={{ shrink: true }}>
                                            <MenuItem value="">-- Select --</MenuItem>
                                            {addresses.map((a: any) => <MenuItem key={a.id} value={String(a.id)}>{a.houseNumber} • {a.zipCode}</MenuItem>)}
                                        </TextField>
                                    </Stack>
                                </Stack>
                            </Paper>

                            {/* Actions */}
                            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                                <Button variant="outlined" onClick={() => navigate("/contracts/list")} disabled={isSubmitting} sx={{ minWidth: 120 }}>Cancel</Button>
                                <Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null} sx={{ minWidth: 140 }}>
                                    {isSubmitting ? "Saving..." : (mode === "create" ? "Create" : "Update")}
                                </Button>
                            </Box>
                        </form>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
