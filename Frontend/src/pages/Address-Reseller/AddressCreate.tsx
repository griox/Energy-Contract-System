import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from "@mui/material";
import { useState } from "react";
import { useCreateAddress } from "@/hooks/useAddresses";

export default function AddressCreate({ open, onClose, onSaved }: any) {
    // Sử dụng hook useCreateAddress
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
                // Reset form
                setForm({ zipCode: "", houseNumber: "", extension: "" });
                onSaved?.();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create Address</DialogTitle>

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
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? "Saving..." : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
