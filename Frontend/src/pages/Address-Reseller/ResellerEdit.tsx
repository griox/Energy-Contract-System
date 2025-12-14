import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Button
} from "@mui/material";
import { useState, useEffect } from "react";
import { useUpdateReseller } from "@/hooks/useResellers";

export default function ResellerEdit({ open, onClose, data }: any) {
    const updateMutation = useUpdateReseller();

    const [form, setForm] = useState({ name: "", type: "Broker" });

    useEffect(() => {
        if (data) setForm({ name: data.name, type: data.type });
    }, [data]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const save = () => {
        if (!data?.id) return;

        updateMutation.mutate(
            { id: data.id, data: form },
            { onSuccess: () => onClose() }
        );
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit Reseller</DialogTitle>

            <DialogContent>
                <TextField
                    label="Name"
                    name="name"
                    fullWidth
                    margin="dense"
                    value={form.name}
                    onChange={handleChange}
                />

                <TextField
                    label="Type"
                    name="type"
                    fullWidth
                    margin="dense"
                    select
                    value={form.type}
                    onChange={handleChange}
                >
                    <MenuItem value="Broker">Broker</MenuItem>
                    <MenuItem value="Agency">Agency</MenuItem>
                </TextField>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={save}
                    disabled={updateMutation.isPending} // Disable khi đang lưu
                >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
