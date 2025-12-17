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
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useCreateAddress } from "@/hooks/useAddresses";

export default function AddressCreate({ open, onClose, onSaved }: any) {
    const { t } = useTranslation();

    const createMutation = useCreateAddress();

    const [form, setForm] = useState({
        zipCode: "",
        houseNumber: "",
        extension: "",
    });

    const change = (e: any) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const submit = () => {
        createMutation.mutate(form, {
            onSuccess: () => {
                toast.success(t("addressCreate.toast.created"));
                setForm({ zipCode: "", houseNumber: "", extension: "" });
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
