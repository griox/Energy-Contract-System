import { useMemo, useState } from "react";
import {
    Box,
    Button,
    TextField,
    MenuItem,
    Stack,
    Typography,
    Paper,
    InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/Grid"; // ✅ FIX: dùng Grid2
import { useNavigate } from "react-router-dom";
import NavMenu from "@/components/NavMenu/NavMenu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EuroIcon from "@mui/icons-material/Euro";

import { useCreateOrder } from "@/hooks/useOrders";
import { useContracts } from "@/hooks/useContracts";
import { OrderType, OrderStatus } from "@/types/order";

type FormState = {
    orderNumber: string;
    orderType: OrderType;
    status: OrderStatus;
    startDate: string; // yyyy-mm-dd
    endDate: string; // yyyy-mm-dd
    topupFee: number | string;
    contractId: string; // select string
};

type FieldErrors = {
    orderNumber?: string;
    contractId?: string;
    startDate?: string;
    endDate?: string;
    topupFee?: string; // ✅ thêm validate topupFee
};

function parseLocalDate(dateStr: string) {
    // an toàn timezone: yyyy-mm-dd -> Date tại 00:00 local
    return new Date(`${dateStr}T00:00:00`);
}

export default function OrderCreate() {
    const navigate = useNavigate();
    const createMutation = useCreateOrder();

    const { data: contractData } = useContracts({ pageNumber: 1, pageSize: 100 });
    const contracts = contractData?.items || [];

    const [form, setForm] = useState<FormState>({
        orderNumber: "",
        orderType: OrderType.Gas,
        status: OrderStatus.Pending,
        startDate: "",
        endDate: "",
        topupFee: 0,
        contractId: "",
    });

    const [errors, setErrors] = useState<FieldErrors>({});

    const validate = (next: FormState) => {
        const e: FieldErrors = {};

        // Basic required
        if (!next.orderNumber.trim()) e.orderNumber = "Order Number is required";
        if (!next.contractId) e.contractId = "Contract is required";
        if (!next.startDate) e.startDate = "Start Date is required";
        if (!next.endDate) e.endDate = "End Date is required";

        // ✅ TopupFee validate
        if (next.topupFee === "" || next.topupFee === null || next.topupFee === undefined) {
            e.topupFee = "Top-up Fee is required";
        } else {
            const fee = Number(next.topupFee);
            if (Number.isNaN(fee)) e.topupFee = "Top-up Fee must be a number";
            else if (fee < 0) e.topupFee = "Top-up Fee must be >= 0";
        }

        // Date compare
        if (next.startDate && next.endDate) {
            const start = parseLocalDate(next.startDate);
            const end = parseLocalDate(next.endDate);

            if (Number.isNaN(start.getTime())) e.startDate = "Invalid Start Date";
            if (Number.isNaN(end.getTime())) e.endDate = "Invalid End Date";

            if (!e.startDate && !e.endDate && end < start) {
                e.endDate = "End Date must be greater than or equal to Start Date";
            }
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        setForm((prev) => {
            const next = { ...prev, [name]: value };

            // validate realtime cho các field quan trọng (✅ thêm topupFee)
            if (
                name === "startDate" ||
                name === "endDate" ||
                name === "contractId" ||
                name === "orderNumber" ||
                name === "topupFee"
            ) {
                validate(next);
            }

            return next;
        });
    };

    const canSubmit = useMemo(() => {
        if (!form.orderNumber.trim()) return false;
        if (!form.contractId) return false;
        if (!form.startDate || !form.endDate) return false;

        // ✅ topupFee phải hợp lệ
        if (form.topupFee === "" || form.topupFee === null || form.topupFee === undefined) return false;

        if (
            errors.orderNumber ||
            errors.contractId ||
            errors.startDate ||
            errors.endDate ||
            errors.topupFee
        )
            return false;

        return true;
    }, [form, errors]);

    const handleSubmit = () => {
        // ✅ chặn 100% nếu invalid
        const ok = validate(form);
        if (!ok) return;

        createMutation.mutate(
            {
                ...form,
                contractId: Number(form.contractId),
                topupFee: Number(form.topupFee),

                // ✅ giữ logic bạn đang dùng: create gửi yyyy-mm-dd
                startDate: form.startDate,
                endDate: form.endDate,
            },
            {
                onSuccess: () => navigate("/orders"),
            }
        );
    };

    return (
        <Box sx={{ display: "flex" }}>
            <NavMenu />

            <Box sx={{ ml: "240px", p: 4, width: "100%", background: "#F8FAFC", minHeight: "100vh" }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/orders")}
                    sx={{ mb: 3, color: "#64748b", textTransform: "none" }}
                >
                    Back to Orders
                </Button>

                <Paper
                    sx={{
                        maxWidth: 800,
                        mx: "auto",
                        p: 4,
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <Typography variant="h5" mb={1} fontWeight={700} color="#1e293b">
                        Create New Order
                    </Typography>

                    <Typography variant="body2" color="#64748b" mb={4}>
                        Fill in the details below to create a new energy order.
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Order Number"
                                name="orderNumber"
                                fullWidth
                                value={form.orderNumber}
                                onChange={handleChange}
                                placeholder="e.g. ORD-2024-001"
                                error={!!errors.orderNumber}
                                helperText={errors.orderNumber}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Contract"
                                name="contractId"
                                fullWidth
                                select
                                value={form.contractId}
                                onChange={handleChange}
                                error={!!errors.contractId}
                                helperText={errors.contractId}
                            >
                                {contracts.map((c: any) => (
                                    <MenuItem key={c.id} value={String(c.id)}>
                                        {c.contractNumber} — {c.firstName} {c.lastName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Order Type"
                                name="orderType"
                                fullWidth
                                select
                                value={form.orderType}
                                onChange={handleChange}
                            >
                                <MenuItem value={OrderType.Gas}>Gas</MenuItem>
                                <MenuItem value={OrderType.Electricity}>Electricity</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Status"
                                name="status"
                                fullWidth
                                select
                                value={form.status}
                                onChange={handleChange}
                            >
                                <MenuItem value={OrderStatus.Pending}>Pending</MenuItem>
                                <MenuItem value={OrderStatus.Active}>Active</MenuItem>
                                <MenuItem value={OrderStatus.Completed}>Completed</MenuItem>
                                <MenuItem value={OrderStatus.Cancelled}>Cancelled</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                type="date"
                                label="Start Date"
                                name="startDate"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={form.startDate}
                                onChange={handleChange}
                                error={!!errors.startDate}
                                helperText={errors.startDate}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                type="date"
                                label="End Date"
                                name="endDate"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={form.endDate}
                                onChange={handleChange}
                                error={!!errors.endDate}
                                helperText={errors.endDate}
                            />
                        </Grid>

                        <Grid size={12}>
                            <TextField
                                type="number"
                                label="Top-up Fee"
                                name="topupFee"
                                fullWidth
                                value={form.topupFee}
                                onChange={handleChange}
                                error={!!errors.topupFee}
                                helperText={errors.topupFee}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EuroIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Stack direction="row" spacing={2} mt={4} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => navigate("/orders")} sx={{ borderRadius: "8px" }}>
                            Cancel
                        </Button>

                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={createMutation.isPending || !canSubmit}
                            sx={{ borderRadius: "8px", px: 4 }}
                        >
                            {createMutation.isPending ? "Creating..." : "Create Order"}
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}