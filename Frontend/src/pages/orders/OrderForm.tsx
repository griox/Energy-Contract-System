
import {
    Box, Paper, Typography, Button, Grid,
    TextField, RadioGroup, FormControlLabel,
    Radio, Select, MenuItem, InputLabel,
    FormControl
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PaidIcon from "@mui/icons-material/Paid";

export default function OrderForm({
    selectedOrder,
    formData,
    onChange,
    onSubmit,
    onBack
}: any) {
    return (
        <Box sx={{ mt: 2 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: "#1565c0",
                    mb: 2
                }}
            >
                ← Quay lại Danh sách Đơn hàng
            </Button>

            <Paper
                sx={{
                    p: 4,
                    borderRadius: "16px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                    backgroundColor: "#fff"
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                    {selectedOrder ?
                        `Rdit Oders: ${selectedOrder.order_number}` :
                        "Create Orders"}
                </Typography>

                <Box component="form" onSubmit={onSubmit}>
                    <Grid container spacing={3}>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Số Đơn hàng"
                                name="order_number"
                                value={formData.order_number || ""}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography sx={{ fontWeight: 600, mb: 1 }}>Loại Năng lượng</Typography>
                            <RadioGroup
                                row
                                name="order_type"
                                value={formData.order_type || "electricity"}
                                onChange={onChange}
                            >
                                <FormControlLabel value="electricity" control={<Radio />} label="Electricity (Điện)" />
                                <FormControlLabel value="gas" control={<Radio />} label="Gas (Ga)" />
                            </RadioGroup>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Ngày Bắt đầu"
                                type="date"
                                fullWidth
                                name="start_date"
                                value={formData.start_date || ""}
                                onChange={onChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Ngày Kết thúc"
                                type="date"
                                fullWidth
                                name="end_date"
                                value={formData.end_date || ""}
                                onChange={onChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status || "pending"}
                                    onChange={onChange}
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Phí Nạp/Đăng ký (VND)"
                                type="number"
                                fullWidth
                                name="topup_fee"
                                value={formData.topup_fee || 0}
                                onChange={onChange}
                                InputProps={{
                                    startAdornment: <PaidIcon sx={{ mr: 1 }} />
                                }}
                            />
                        </Grid>

                    </Grid>

                    <Box sx={{ textAlign: "right", mt: 4 }}>
                        <Button
                            variant="outlined"
                            onClick={onBack}
                            sx={{ mr: 2, borderRadius: "10px" }}
                        >
                            Cancle
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            sx={{
                                backgroundColor: "#1976D2",
                                borderRadius: "10px",
                                px: 4,
                                py: 1.2,
                                fontWeight: 700
                            }}
                        >
                            {selectedOrder ? "Save Changes" : "Create"}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}
