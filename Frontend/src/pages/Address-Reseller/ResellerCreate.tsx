import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    MenuItem,
    CircularProgress,
} from "@mui/material";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useCreateReseller } from "@/hooks/useResellers";

export default function ResellerCreate({ open, onClose, onSaved }: any) {
    const { t } = useTranslation();
    const createMutation = useCreateReseller();

    const [form, setForm] = useState({
        name: "",
        type: "Broker",
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const save = () => {
        createMutation.mutate(form, {
            onSuccess: () => {
                toast.success(t("resellerCreate.toast.created"));
                setForm({ name: "", type: "Broker" });
                onSaved?.();
                onClose();
            },
            onError: (err: any) => {
                console.error("CREATE RESELLER ERROR:", err);
                toast.error(t("resellerCreate.toast.createFailed"));
            },
        });
    };

    const isSubmitting = createMutation.isPending;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t("resellerCreate.title")}</DialogTitle>

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
