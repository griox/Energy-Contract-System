import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from "@mui/material";
import { useState, useEffect } from "react";
import { useUpdateAddress } from "@/hooks/useAddresses";

export default function AddressEdit({ open, onClose, onSaved, data }: any) {
    // Sử dụng hook useUpdateAddress
    const updateMutation = useUpdateAddress();

    const [form, setForm] = useState({
        zipCode: "",
        houseNumber: "",
        extension: "",
    });

    useEffect(() => {
        if (data) {
            setForm({
                zipCode: data.zipCode || "",
                houseNumber: data.houseNumber || "",
                extension: data.extension || "",
            });
        }
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
                    onSaved?.();
                    onClose();
                },
            }
        );
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit Address</DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField label="Zip Code" name="zipCode" value={form.zipCode} onChange={change} />
                    <TextField label="House Number" name="houseNumber" value={form.houseNumber} onChange={change} />
                    <TextField label="Extension" name="extension" value={form.extension} onChange={change} />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={submit} 
                    variant="contained" 
                    disabled={updateMutation.isPending}
                >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
