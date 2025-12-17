import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Button,
    CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useUpdateReseller } from "@/hooks/useResellers";

export default function ResellerEdit({ open, onClose, onSaved, data }: any) {
    const { t } = useTranslation();
    const updateMutation = useUpdateReseller();

    const [form, setForm] = useState({ name: "", type: "Broker" });

    useEffect(() => {
        if (!data) return;
        setForm({ name: data.name ?? "", type: data.type ?? "Broker" });
    }, [data]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const save = () => {
        if (!data?.id) return;

        updateMutation.mutate(
            { id: data.id, data: form },
            {
                onSuccess: () => {
                    toast.success(t("resellerEdit.toast.updated"));
                    onSaved?.();
                    onClose();
                },
                onError: (err: any) => {
                    console.error("UPDATE RESELLER ERROR:", err);
                    toast.error(t("resellerEdit.toast.updateFailed"));
                },
            }
        );
    };

    const isSubmitting = updateMutation.isPending;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t("resellerEdit.title")}</DialogTitle>

            <DialogContent>
                <TextField
                    label={t("resellerCreate.name")}
                    name="name"
                    fullWidth
                    margin="dense"
                    value={form.name}
                    onChange={handleChange}
                />

                <TextField
                    label={t("resellerCreate.type")}
                    name="type"
                    fullWidth
                    margin="dense"
                    select
                    value={form.type}
                    onChange={handleChange}
                >
                    <MenuItem value="Broker">{t("Broker")}</MenuItem>
                    <MenuItem value="Agency">{t("Agency")}</MenuItem>
                    <MenuItem value="Supplier">{t("Supplier")}</MenuItem>
                </TextField>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={isSubmitting}>
                    {t("Cancel")}
                </Button>

                <Button variant="contained" onClick={save} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <CircularProgress size={18} color="inherit" style={{ marginRight: 8 }} />
                            {t("Saving...")}
                        </>
                    ) : (
                        t("Save")
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
