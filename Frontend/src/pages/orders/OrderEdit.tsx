import { useEffect, useState } from "react";
import {
    Box, Button, TextField, MenuItem, Stack, Typography, Paper, Grid, InputAdornment, 
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import NavMenu from "@/components/NavMenu/NavMenu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EuroIcon from "@mui/icons-material/Euro";

import { useOrder, useUpdateOrder } from "@/hooks/useOrders";
import { useContracts } from "@/hooks/useContracts";
import { OrderType, OrderStatus } from "@/types/order";

export default function OrderEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const orderId = Number(id);

    const { data: order, isLoading } = useOrder(orderId);
    const updateMutation = useUpdateOrder();
    
    // Lấy danh sách Contract
    const { data: contractData } = useContracts({ pageNumber: 1, pageSize: 100 });
    const contracts = contractData?.items || [];

    const [form, setForm] = useState<{
        orderNumber: string;
        orderType: OrderType;
        status: OrderStatus;
        startDate: string;
        endDate: string;
        topupFee: number;
        contractId: string;
    }>({
        orderNumber: "",
        orderType: OrderType.Gas, // Default value matching the type
        status: OrderStatus.Pending, // Default value matching the type
        startDate: "",
        endDate: "",
        topupFee: 0,
        contractId: "",
    });

    useEffect(() => {
        if (order) {
            setForm({
                orderNumber: order.orderNumber,
                orderType: order.orderType,
                status: order.status,
                startDate: order.startDate ? order.startDate.split("T")[0] : "",
                endDate: order.endDate ? order.endDate.split("T")[0] : "",
                topupFee: order.topupFee,
                contractId: order.contractId.toString(),
            });
        }
    }, [order]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        updateMutation.mutate({
            id: orderId,
            data: {
                ...form,
                contractId: Number(form.contractId),
                topupFee: Number(form.topupFee),
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString(),
            }
        }, {
            onSuccess: () => navigate("/orders")
        });
    };

    if (isLoading) return <Box sx={{ ml: "240px", p: 4 }}>Loading...</Box>;

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

                <Paper sx={{ maxWidth: 800, mx: "auto", p: 4, borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                    <Typography variant="h5" mb={1} fontWeight={700} color="#1e293b">
                        Edit Order
                    </Typography>
                    <Typography variant="body2" color="#64748b" mb={4}>
                        Update order details for <b>{order?.orderNumber}</b>.
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Order Number"
                                name="orderNumber"
                                fullWidth
                                value={form.orderNumber}
                                onChange={handleChange}
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
                            >
                                {contracts.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
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
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                type="number"
                                label="Top-up Fee"
                                name="topupFee"
                                fullWidth
                                value={form.topupFee}
                                onChange={handleChange}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><EuroIcon fontSize="small" /></InputAdornment>,
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
                            disabled={updateMutation.isPending}
                            sx={{ borderRadius: "8px", px: 4 }}
                        >
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}