
import { IconButton, Tooltip, CircularProgress } from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import { useDeleteTemplate } from "@/hooks/usePdf";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

interface DeleteTemplateButtonProps {
    id: number;
}

export default function DeleteTemplateButton({ id }: DeleteTemplateButtonProps) {
    const { t } = useTranslation();
    const deleteMutation = useDeleteTemplate();

    const handleDelete = () => {
        const ok = window.confirm(t("templateDelete.confirm"));
        if (!ok) return;

        deleteMutation.mutate(id, {
            onSuccess: () => toast.success(t("templateDelete.toast.deleted")),
            onError: (err: any) => {
                console.error("DELETE TEMPLATE ERROR:", err);
                toast.error(t("templateDelete.toast.deleteFailed"));
            },
        });
    };

    return (
        <Tooltip title={t("templateDelete.tooltip")}>
            <IconButton
                size="small"
                color="error"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
            >
                {deleteMutation.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                ) : (
                    <DeleteIcon fontSize="small" />
                )}
            </IconButton>
        </Tooltip>
    );
}