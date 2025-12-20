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

import { useCreateAddress } from "@/hooks/useAddresses";

type FormState = {
    zipCode: string;
    houseNumber: string;
    extension: string;
};

type FieldErrors = {
    zipCode?: string;
    houseNumber?: string;
};

export default function AddressCreate({ open, onClose, onSaved }: any) {
    const { t } = useTranslation();
    const createMutation = useCreateAddress();

    const [form, setForm] = useState<FormState>({
        zipCode: "",
        houseNumber: "",
        extension: "",
    });

    const [errors, setErrors] = useState<FieldErrors>({});

    // reset lỗi mỗi lần mở dialog
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

            // validate realtime các field required
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
        const ok = validate(form);
        if (!ok) return;

        // ✅ GIỮ NGUYÊN LOGIC: mutate(form)
        createMutation.mutate(form, {
            onSuccess: () => {
                toast.success(t("addressCreate.toast.created"));
                setForm({ zipCode: "", houseNumber: "", extension: "" });
                setErrors({});
                onSaved?.();
                onClose();
            },
            onError: (err: any) => {
                console.error("CREATE ADDRESS ERROR:", err);
                toast.error(t("addressCreate.toast.createFailed"));
            },
        });
    };

    const isSubmitting = createMutation.isPending;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t("addressCreate.title")}</DialogTitle>

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