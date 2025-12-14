import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import { useDeleteTemplate } from "@/hooks/usePdf";
import { CircularProgress } from "@mui/material";

interface DeleteTemplateButtonProps {
    id: number;
}

export default function DeleteTemplateButton({ id }: DeleteTemplateButtonProps) {
    const deleteMutation = useDeleteTemplate();

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <Tooltip title="Delete Template">
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