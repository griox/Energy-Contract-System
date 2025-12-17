import { Box, Button, Paper, Typography, Stack, CircularProgress, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import NavMenu from "@/components/NavMenu/NavMenu";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { useDeleteOrder, useOrder } from "@/hooks/useOrders";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const SIDEBAR_WIDTH = 240;

export default function OrderDelete() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const theme = useTheme();

    const orderId = Number(id);

    const { data: order, isLoading } = useOrder(orderId);
    const deleteMutation = useDeleteOrder();

    const handleDelete = () => {
        deleteMutation.mutate(orderId, {
            onSuccess: () => {
                toast.success(t("orderDelete.toast.deleted"));
                navigate("/orders");
            },
            onError: (err: any) => {
                console.error("DELETE ORDER ERROR:", err);
                toast.error(t("orderDelete.toast.deleteFailed"));
            },
        });
    };

    const pageBg = "background.default";
    const paperBg = "background.paper";
    const borderColor = alpha(theme.palette.divider, 0.8);

    if (isLoading) {
        return (
            <Box sx={{ ml: `${SIDEBAR_WIDTH}px`, p: 4 }}>
                {t("Loading")}
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex" }}>
            <NavMenu />

            <Box
                sx={{
                    ml: `${SIDEBAR_WIDTH}px`,
                    p: 4,
                    width: "100%",
                    bgcolor: pageBg,
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Paper
                    sx={{
                        p: 4,
                        maxWidth: 520,
                        width: "100%",
                        borderRadius: 4,
                        textAlign: "center",
                        bgcolor: paperBg,
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    <WarningAmberRoundedIcon sx={{ fontSize: 60, color: "#f59e0b", mb: 2 }} />

                    <Typography variant="h5" fontWeight={800} mb={1}>
                        {t("orderDelete.title")}
                    </Typography>

                    <Typography color="text.secondary" mb={4}>
                        {t("orderDelete.confirm", { orderNumber: order?.orderNumber ?? "—" })}
                        <br />
                        {t("orderDelete.warning")}
                    </Typography>

                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/orders")}
                            sx={{ borderRadius: 2, px: 3 }}
                            disabled={deleteMutation.isPending}
                        >
                            {t("Cancel")}
                        </Button>

                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            sx={{ borderRadius: 2, px: 3 }}
                            startIcon={
                                deleteMutation.isPending ? (
                                    <CircularProgress size={18} color="inherit" />
                                ) : undefined
                            }
                        >
                            {deleteMutation.isPending ? t("orderDelete.deleting") : t("orderDelete.delete")}
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}
