import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    Typography,
    CircularProgress,
} from "@mui/material";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useDeleteAddress } from "@/hooks/useAddresses";

export default function AddressDelete({ open, onClose, onDeleted, data }: any) {
    const { t } = useTranslation();

    const deleteMutation = useDeleteAddress();
    const isDeleting = deleteMutation.isPending;

    const handleDelete = () => {
        if (!data?.id) return;

        deleteMutation.mutate(data.id, {
            onSuccess: () => {
                toast.success(t("addressDelete.toast.deleted"));
                onDeleted?.();
                onClose();
            },
            onError: (err: any) => {
                console.error("DELETE ADDRESS ERROR:", err);
                toast.error(t("addressDelete.toast.deleteFailed"));
            },
        });
    };

    const addressText = `${data?.houseNumber ?? "—"} ${data?.zipCode ?? ""}`.trim();

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>{t("addressDelete.title")}</DialogTitle>

            <DialogContent>
                <Typography>
                    {t("addressDelete.confirm", { address: addressText })}
                </Typography>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={isDeleting}>
                    {t("Cancel")}
                </Button>

                <Button
                    color="error"
                    variant="contained"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                    {isDeleting ? t("addressDelete.deleting") : t("addressDelete.delete")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
