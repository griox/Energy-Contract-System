import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

import { useDeleteContract } from "@/hooks/useContracts";

export default function ContractDelete({
  open,
  id,
  onClose,
  onSuccess,
}: {
  open: boolean;
  id: number | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Sử dụng Hook xóa
  const { mutate: deleteContract, isPending } = useDeleteContract();

  const handleDelete = () => {
    if (!id) return;

    deleteContract(id, {
      onSuccess: () => {
        // Hook đã tự động invalidate query 'contracts', 
        // ta chỉ cần đóng modal và gọi callback onSuccess (nếu cần logic phụ)
        onSuccess(); 
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Contract</DialogTitle>

      <DialogContent>
        <Typography>
          Are you sure you want to delete contract <b>#{id}</b>?
          This action cannot be undone.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>Cancel</Button>

        <Button 
          color="error" 
          variant="contained" 
          onClick={handleDelete}
          disabled={isPending} // Disable nút khi đang xóa
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
