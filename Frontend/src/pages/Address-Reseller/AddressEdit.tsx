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
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useUpdateAddress } from "@/hooks/useAddresses";

export default function AddressEdit({ open, onClose, onSaved, data }: any) {
    const { t } = useTranslation();

    const updateMutation = useUpdateAddress();

    const [form, setForm] = useState({
        zipCode: "",
        houseNumber: "",
        extension: "",
    });

    useEffect(() => {
        if (!data) return;

        setForm({
            zipCode: data.zipCode || "",
            houseNumber: data.houseNumber || "",
            extension: data.extension || "",
        });
    }, [data]);

    const change = (e: any) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const submit = () => {
        if (!data?.id) return;

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
                    />
                    <TextField
                        label={t("addressCreate.houseNumber")}
                        name="houseNumber"
                        value={form.houseNumber}
                        onChange={change}
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

                <Button onClick={submit} variant="contained" disabled={isSubmitting}>
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
