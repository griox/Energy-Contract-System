import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from "@mui/material";
import { useDeleteReseller } from "@/hooks/useResellers";

export default function ResellerDelete({ open, onClose, data }: any) {
    // Sử dụng hook xóa
    const deleteMutation = useDeleteReseller();

    const handleDelete = () => {
        if (!data?.id) return;

        deleteMutation.mutate(data.id, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Delete Reseller</DialogTitle>

            <DialogContent>
                <Typography>
                    Are you sure you want to delete reseller <b>{data?.name}</b>?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    This action cannot be undone.
                </Typography>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={deleteMutation.isPending}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}