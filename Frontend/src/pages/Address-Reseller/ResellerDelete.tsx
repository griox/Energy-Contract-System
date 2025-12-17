import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
} from "@mui/material";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useDeleteReseller } from "@/hooks/useResellers";

export default function ResellerDelete({ open, onClose, onDeleted, data }: any) {
    const { t } = useTranslation();

    const deleteMutation = useDeleteReseller();
    const isDeleting = deleteMutation.isPending;

    const handleDelete = () => {
        if (!data?.id) return;

        deleteMutation.mutate(data.id, {
            onSuccess: () => {
                toast.success(t("resellerDelete.toast.deleted"));
                onDeleted?.();
                onClose();
            },
            onError: (err: any) => {
                console.error("DELETE RESELLER ERROR:", err);
                toast.error(t("resellerDelete.toast.deleteFailed"));
            },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>{t("resellerDelete.title")}</DialogTitle>

            <DialogContent>
                <Typography>
                    {t("resellerDelete.confirm", { name: data?.name ?? "—" })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {t("resellerDelete.warning")}
                </Typography>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={isDeleting}>
                    {t("Cancel")}
                </Button>

                <Button
                    variant="contained"
                    color="error"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                    {isDeleting ? t("resellerDelete.deleting") : t("resellerDelete.delete")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
