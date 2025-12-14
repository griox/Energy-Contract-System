import { Box, Button, Paper, Typography, Stack } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import NavMenu from "@/components/NavMenu/NavMenu";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { useDeleteOrder, useOrder } from "@/hooks/useOrders";

export default function OrderDelete() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const orderId = Number(id);

    const { data: order, isLoading } = useOrder(orderId);
    const deleteMutation = useDeleteOrder();

    const handleDelete = () => {
        deleteMutation.mutate(orderId, {
            onSuccess: () => navigate("/orders"),
        });
    };

    if (isLoading) return <Box sx={{ ml: "240px", p: 4 }}>Loading...</Box>;

    return (
        <Box sx={{ display: "flex" }}>
            <NavMenu />
            <Box
                sx={{
                    ml: "240px",
                    p: 4,
                    width: "100%",
                    background: "#F8FAFC",
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Paper
                    sx={{
                        p: 4,
                        maxWidth: 500,
                        width: "100%",
                        borderRadius: "16px",
                        textAlign: "center",
                    }}
                >
                    <WarningAmberRoundedIcon
                        sx={{ fontSize: 60, color: "#f59e0b", mb: 2 }}
                    />

                    <Typography variant="h5" fontWeight={700} mb={1}>
                        Delete Order?
                    </Typography>

                    <Typography color="text.secondary" mb={4}>
                        Are you sure you want to delete order{" "}
                        <b>{order?.orderNumber}</b>?<br />
                        This action cannot be undone.
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={2}
                        justifyContent="center"
                    >
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/orders")}
                            sx={{ borderRadius: "8px", px: 3 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            sx={{ borderRadius: "8px", px: 3 }}
                        >
                            {deleteMutation.isPending
                                ? "Deleting..."
                                : "Delete Order"}
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}
