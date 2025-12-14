import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, MenuItem
} from "@mui/material";
import { useState } from "react";
import { useCreateReseller } from "@/hooks/useResellers";

export default function ResellerCreate({ open, onClose }: any) {
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
                setForm({ name: "", type: "Broker" });
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create Reseller</DialogTitle>

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
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? "Saving..." : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
