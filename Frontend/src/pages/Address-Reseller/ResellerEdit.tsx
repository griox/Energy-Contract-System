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
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useUpdateReseller } from "@/hooks/useResellers";

type FormState = {
    name: string;
    type: string;
};

type FieldErrors = {
    name?: string;
    type?: string;
};

export default function ResellerEdit({ open, onClose, onSaved, data }: any) {
    const { t } = useTranslation();
    const updateMutation = useUpdateReseller();

    const [form, setForm] = useState<FormState>({ name: "", type: "Broker" });
    const [errors, setErrors] = useState<FieldErrors>({});

    useEffect(() => {
        if (!data) return;
        setForm({ name: data.name ?? "", type: data.type ?? "Broker" });
        setErrors({});
    }, [data]);

    useEffect(() => {
        if (open) setErrors({});
    }, [open]);

    const validate = (next: FormState) => {
        const e: FieldErrors = {};

        if (!String(next.name ?? "").trim()) e.name = "Name is required";
        if (!String(next.type ?? "").trim()) e.type = "Type is required";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        setForm((prev) => {
            const next = { ...prev, [name]: value };

            if (name === "name" || name === "type") validate(next);

            return next;
        });
    };

    const canSubmit = useMemo(() => {
        if (!form.name.trim()) return false;
        if (!form.type) return false;
        if (errors.name || errors.type) return false;
        return true;
    }, [form, errors]);

    const save = () => {
        if (!data?.id) return;

        const ok = validate(form);
        if (!ok) return;

        // ✅ GIỮ NGUYÊN LOGIC: mutate({ id, data: form })
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
                    error={!!errors.name}
                    helperText={errors.name}
                />

                <TextField
                    label={t("resellerCreate.type")}
                    name="type"
                    fullWidth
                    margin="dense"
                    select
                    value={form.type}
                    onChange={handleChange}
                    error={!!errors.type}
                    helperText={errors.type}
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

                <Button
                    variant="contained"
                    onClick={save}
                    disabled={isSubmitting || !canSubmit}
                >
                    {isSubmitting ? (
                        <>
                            <CircularProgress
                                size={18}
                                color="inherit"
                                style={{ marginRight: 8 }}
                            />
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