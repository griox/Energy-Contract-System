import { useEffect } from "react";
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    TextField,
    Button,
    Stack,
    MenuItem,
    Divider,
    CircularProgress
} from "@mui/material";

import { FiX } from "react-icons/fi";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

// Hooks
import { useCreateContract, useUpdateContract, useContract } from "@/hooks/useContracts";
import { useResellers } from "@/hooks/useResellers";
import { useAddresses } from "@/hooks/useAddresses";

export default function ContractFormDrawer({ open, mode, id, onClose, onSuccess }: any) {
    const isEdit = mode === "edit";

    // --- Hooks lấy dữ liệu bổ trợ ---
    const { data: resellersData } = useResellers({ pageNumber: 1, pageSize: 100 });
    const resellers = resellersData?.items || [];

    const { data: addressesData } = useAddresses({ pageNumber: 1, pageSize: 100 });
    const addresses = addressesData?.items || [];

    // --- Hooks Mutation ---
    const createMutation = useCreateContract();
    const updateMutation = useUpdateContract();

    // --- Hook lấy chi tiết Contract (khi Edit) ---
    // Sử dụng hook useContract thay vì useQuery trực tiếp
    const { data: contractData, isLoading: isLoadingContract } = useContract(isEdit && open ? id : 0);

    const {
        register,
        handleSubmit,
        reset,
        watch,
    } = useForm({
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

    // LOAD DATA INTO FORM
    useEffect(() => {
        if (open) {
            if (isEdit && contractData) {
                reset({
                    firstName: contractData.firstName,
                    lastName: contractData.lastName,
                    email: contractData.email,
                    phone: contractData.phone,
                    companyName: contractData.companyName ?? "",
                    bankAccountNumber: contractData.bankAccountNumber ?? "",
                    startDate: contractData.startDate ? contractData.startDate.split("T")[0] : "",
                    endDate: contractData.endDate ? contractData.endDate.split("T")[0] : "",
                    resellerId: String(contractData.resellerId || ""),
                    addressId: String(contractData.addressId || ""),
                });
            } else if (!isEdit) {
                reset({
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
                });
            }
        }
    }, [open, isEdit, contractData, reset]);

    // SUBMIT HANDLER
    const onSubmit = (form: any) => {
        const payload: any = {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            companyName: form.companyName ?? "",
            bankAccountNumber: form.bankAccountNumber ?? "",
            resellerId: Number(form.resellerId) || 0,
            addressId: Number(form.addressId) || 0,

            // Giữ logic format date như cũ hoặc dùng toISOString()
            startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
            endDate: form.endDate ? new Date(form.endDate).toISOString() : new Date().toISOString(),

            pdfLink: contractData?.pdfLink || "",
            // Các trường bắt buộc khác nếu API yêu cầu (giả định)
            contractNumber: contractData?.contractNumber || "AUTO-" + Date.now(),

        };

        const mutationOptions = {
            onSuccess: () => {
                // toast.success(isEdit ? "Contract updated!" : "Contract created!");
                onSuccess?.();
                onClose();
            },
            onError: (err: any) => {
                console.error("SAVE ERROR:", err);
                toast.error("Failed to save contract!");
            }
        };

        if (isEdit && id) {
            updateMutation.mutate({ id, data: payload }, mutationOptions);
        } else {
            createMutation.mutate(payload, mutationOptions);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <Drawer anchor="right" open={open} onClose={onClose}
            PaperProps={{ sx: { width: 420, p: 3 } }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                    {isEdit ? "Edit Contract" : "Create Contract"}
                </Typography>
                <IconButton onClick={onClose}>
                    <FiX />
                </IconButton>
            </Box>

            <Divider sx={{ my: 2 }} />

            {isLoadingContract && isEdit ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack spacing={2}>

                        <TextField label="First Name" {...register("firstName")} />

                        <TextField label="Last Name" {...register("lastName")} />

                        <TextField label="Email" {...register("email")} />

                        <TextField label="Phone" {...register("phone")} />

                        <Stack direction="row" spacing={2}>
                            <TextField
                                type="date"
                                label="Start Date"
                                InputLabelProps={{ shrink: true }}
                                {...register("startDate")}
                                value={watch("startDate") || ""}
                                fullWidth
                            />
                            <TextField
                                type="date"
                                label="End Date"
                                InputLabelProps={{ shrink: true }}
                                {...register("endDate")}
                                value={watch("endDate") || ""}
                                fullWidth
                            />
                        </Stack>

                        <TextField label="Company Name" {...register("companyName")} />

                        <TextField
                            label="Bank Account Number"
                            {...register("bankAccountNumber")}
                        />

                        <TextField
                            select
                            label="Reseller"
                            {...register("resellerId")}
                            value={watch("resellerId") || ""}
                        >
                            <MenuItem value="">-- Select --</MenuItem>
                            {resellers.map((r) => (
                                <MenuItem key={r.id} value={String(r.id)}>
                                    {r.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Address"
                            {...register("addressId")}
                            value={watch("addressId") || ""}
                        >
                            <MenuItem value="">-- Select --</MenuItem>
                            {addresses.map((a) => (
                                <MenuItem key={a.id} value={String(a.id)}>
                                    {a.houseNumber} • {a.zipCode}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Stack direction="row" justifyContent="flex-end" spacing={2}>
                            <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                                {isEdit ? "Save" : "Create"}
                            </Button>
                        </Stack>

                    </Stack>
                </form>
            )}
        </Drawer>
    );
}
