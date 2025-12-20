import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const { mutate: deleteContract, isPending } = useDeleteContract();

  const handleDelete = () => {
    if (!id) return;

    deleteContract(id, {
      onSuccess: () => {
        toast.success(t("contractDelete.toast.deleted"));
        onSuccess();
        onClose();
      },
      onError: (err: any) => {
        console.error("DELETE ERROR:", err);
        toast.error(t("contractDelete.toast.deleteFailed"));
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("contractDelete.title")}</DialogTitle>

      <DialogContent>
        <Typography>
          {t("contractDelete.confirm", { id })}
          <br />
          {t("contractDelete.warning")}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          {t("Cancel")}
        </Button>

        <Button
          color="error"
          variant="contained"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? t("contractDelete.deleting") : t("contractDelete.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}