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
    useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { FiArrowLeft } from "react-icons/fi";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import NavMenu from "@/components/NavMenu/NavMenu";
import { useCreateContract } from "@/hooks/useContracts";
import { useResellers } from "@/hooks/useResellers";
import { useAddresses } from "@/hooks/useAddresses";

type FormValues = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName: string;
    bankAccountNumber: string;
    startDate: string; // yyyy-mm-dd
    endDate: string; // yyyy-mm-dd
    resellerId: string;
    addressId: string;
};

const SIDEBAR_WIDTH = 240;

export default function ContractCreate() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    // --- data select ---
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

    // --- mutation ---
    const createMutation = useCreateContract();

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

    useEffect(() => {
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
    }, [reset]);

    const isSubmitting = createMutation.isPending;
    const loadingSelect = loadingResellers || loadingAddresses;

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
            contractNumber: "AUTO-" + Date.now(),
        };

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
    };

    const pageBg = "background.default";
    const paperBg = "background.paper";
    const borderColor = alpha(theme.palette.divider, 0.8);

    return (
        <Box sx={{ display: "flex" }}>
            <NavMenu />

            <Box
                sx={{
                    ml: `${SIDEBAR_WIDTH}px`,
                    p: 4,
                    width: "100%",
                    minHeight: "100vh",
                    bgcolor: pageBg, // ✅ theo theme
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
                        bgcolor: paperBg, // ✅ theo theme
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
                            bgcolor: paperBg, // ✅ theo theme (đừng xài "white")
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <IconButton onClick={() => navigate(-1)}>
                                <FiArrowLeft />
                            </IconButton>
                            <Box>
                                <Typography variant="h6" fontWeight={800} lineHeight={1.1} color="text.primary">
                                    Create Contract
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Fill in information to create a new contract
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ borderColor }} />

                    {/* Body */}
                    <Box sx={{ p: 3, bgcolor: pageBg }}>
                        {loadingSelect ? (
                            <Box display="flex" justifyContent="center" py={8}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <Paper
                                    sx={{
                                        p: 3,
                                        borderRadius: 4,
                                        bgcolor: paperBg, // ✅ theo theme
                                        border: `1px solid ${borderColor}`,
                                        boxShadow: isDark ? "none" : "0 6px 18px rgba(0,0,0,0.06)",
                                    }}
                                >
                                    <Stack spacing={2.25}>
                                        {/* Row 1 */}
                                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                            <TextField label="First Name" {...register("firstName", { required: true })} fullWidth />
                                            <TextField label="Last Name" {...register("lastName", { required: true })} fullWidth />
                                        </Stack>

                                        {/* Row 2 */}
                                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                            <TextField label="Email" {...register("email", { required: true })} fullWidth />
                                            <TextField label="Phone" {...register("phone")} fullWidth />
                                        </Stack>

                                        {/* Row 3 */}
                                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                            <TextField
                                                type="date"
                                                label="Start Date"
                                                InputLabelProps={{ shrink: true }}
                                                {...register("startDate")}
                                                // giữ watch cho chắc, nhưng không bắt buộc
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

                                        {/* Row 4 */}
                                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                            <TextField label="Company Name" {...register("companyName")} fullWidth />
                                            <TextField label="Bank Account Number" {...register("bankAccountNumber")} fullWidth />
                                        </Stack>

                                        {/* Row 5 */}
                                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                            <TextField
                                                select
                                                label="Reseller"
                                                {...register("resellerId")}
                                                value={watch("resellerId") || ""}
                                                fullWidth
                                            >
                                                <MenuItem value="">-- Select --</MenuItem>
                                                {resellers.map((r: any) => (
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
                                                fullWidth
                                            >
                                                <MenuItem value="">-- Select --</MenuItem>
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
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={isSubmitting}
                                        startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
                                        sx={{ minWidth: 140 }}
                                    >
                                        {isSubmitting ? "Creating..." : "Create"}
                                    </Button>
                                </Box>
                            </form>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}
