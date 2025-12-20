import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    CircularProgress,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useUpdateAddress } from "@/hooks/useAddresses";

type FormState = {
    zipCode: string;
    houseNumber: string;
    extension: string;
};

type FieldErrors = {
    zipCode?: string;
    houseNumber?: string;
};

export default function AddressEdit({ open, onClose, onSaved, data }: any) {
    const { t } = useTranslation();
    const updateMutation = useUpdateAddress();

    const [form, setForm] = useState<FormState>({
        zipCode: "",
        houseNumber: "",
        extension: "",
    });

    const [errors, setErrors] = useState<FieldErrors>({});

    useEffect(() => {
        if (!data) return;

        setForm({
            zipCode: data.zipCode || "",
            houseNumber: data.houseNumber || "",
            extension: data.extension || "",
        });

        setErrors({});
    }, [data]);

    useEffect(() => {
        if (open) setErrors({});
    }, [open]);

    const validate = (next: FormState) => {
        const e: FieldErrors = {};

        if (!String(next.zipCode ?? "").trim()) e.zipCode = "Zip Code is required";
        if (!String(next.houseNumber ?? "").trim()) e.houseNumber = "House number is required";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const change = (e: any) => {
        const { name, value } = e.target;

        setForm((prev) => {
            const next = { ...prev, [name]: value };

            if (name === "zipCode" || name === "houseNumber") {
                validate(next);
            }

            return next;
        });
    };

    const canSubmit = useMemo(() => {
        if (!form.zipCode.trim()) return false;
        if (!form.houseNumber.trim()) return false;
        if (errors.zipCode || errors.houseNumber) return false;
        return true;
    }, [form, errors]);

    const submit = () => {
        if (!data?.id) return;

        const ok = validate(form);
        if (!ok) return;

        // ✅ GIỮ NGUYÊN LOGIC: mutate({ id, data: form })
        updateMutation.mutate(
            { id: data.id, data: form },
            {
                onSuccess: () => {
                    toast.success(t("addressEdit.toast.updated"));
                    onSaved?.();
                    onClose();
                },
                onError: (err: any) => {
                    console.error("UPDATE ADDRESS ERROR:", err);
                    toast.error(t("addressEdit.toast.updateFailed"));
                },
            }
        );
    };

    const isSubmitting = updateMutation.isPending;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t("addressEdit.title")}</DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label={t("addressCreate.zipCode")}
                        name="zipCode"
                        value={form.zipCode}
                        onChange={change}
                        error={!!errors.zipCode}
                        helperText={errors.zipCode}
                    />

                    <TextField
                        label={t("addressCreate.houseNumber")}
                        name="houseNumber"
                        value={form.houseNumber}
                        onChange={change}
                        error={!!errors.houseNumber}
                        helperText={errors.houseNumber}
                    />

                    <TextField
                        label={t("addressCreate.extension")}
                        name="extension"
                        value={form.extension}
                        onChange={change}
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={isSubmitting}>
                    {t("Cancel")}
                </Button>

                <Button
                    onClick={submit}
                    variant="contained"
                    disabled={isSubmitting || !canSubmit}
                    startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                    {isSubmitting ? t("Saving...") : t("Save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}