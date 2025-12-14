import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from "@mui/material";
import { useDeleteAddress } from "@/hooks/useAddresses";

export default function AddressDelete({ open, onClose, onDeleted, data }: any) {
    // Sử dụng hook useDeleteAddress
    const deleteMutation = useDeleteAddress();

    const handleDelete = () => {
        if (!data?.id) return;

        deleteMutation.mutate(data.id, {
            onSuccess: () => {
                onDeleted?.();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Delete Address</DialogTitle>

            <DialogContent>
                <Typography>
                    Are you sure you want to delete address <b>{data?.houseNumber} {data?.zipCode}</b>?
                </Typography>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={deleteMutation.isPending}>Cancel</Button>
                <Button 
                    color="error" 
                    variant="contained" 
                    onClick={handleDelete} 
                    disabled={deleteMutation.isPending}
                >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
