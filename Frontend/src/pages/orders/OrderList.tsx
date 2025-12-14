import { useState } from "react";
import {
    Box,
    Button,
    Card,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Stack,
    TextField,
    InputAdornment,
    Chip,
    IconButton,
    CircularProgress,
    MenuItem,
    Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";

import NavMenu from "@/components/NavMenu/NavMenu";
import { useOrders } from "@/hooks/useOrders";
import { OrderType, OrderStatus } from "@/types/order";

export default function OrderList() {
    const navigate = useNavigate();

    // ==========================
    // STATE
    // ==========================
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<number | "">("");
    const [orderType, setOrderType] = useState<number | "">("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDesc, setSortDesc] = useState(true);
    const [page, setPage] = useState(1);

    const PAGE_SIZE = 10;

    // ==========================
    // FETCH DATA
    // ==========================
    const { data, isLoading } = useOrders({
        search: search || undefined,
        status: status === "" ? undefined : status,
        orderType: orderType === "" ? undefined : orderType,
        pageNumber: page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortDesc,
    });

    const orders = data?.items ?? [];

    // ⚠️ theo API của m: totalCount
    const totalCount = data?.totalCount ?? 0;

    // totalPages tối thiểu = 1 để UI không bị "Page 1 / 0"
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    // shownCount theo kiểu screenshot: page1 size10 total16 => "Showing 10 of 16"
    const shownCount =
        totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + orders.length;

    const canPrev = page > 1;
    const canNext = page < totalPages;

    // ==========================
    // HELPERS
    // ==========================
    const getStatusColor = (s: number) => {
        switch (s) {
            case OrderStatus.Active:
                return "success";
            case OrderStatus.Pending:
                return "warning";
            case OrderStatus.Completed:
                return "info";
            case OrderStatus.Cancelled:
                return "error";
            default:
                return "default";
        }
    };

    const getStatusLabel = (s: number) => {
        switch (s) {
            case OrderStatus.Active:
                return "Active";
            case OrderStatus.Pending:
                return "Pending";
            case OrderStatus.Completed:
                return "Completed";
            case OrderStatus.Cancelled:
                return "Cancelled";
            default:
                return "Unknown";
        }
    };

    // ==========================
    // RENDER
    // ==========================
    return (
        <Box sx={{ display: "flex" }}>
            <NavMenu />

            <Box
                sx={{
                    ml: "240px",
                    p: 4,
                    width: "100%",
                    minHeight: "100vh",
                    background: "#F8FAFC",
                }}
            >
                {/* HEADER */}
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={4}
                >
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Order Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage electricity and gas orders
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("/orders/create")}
                    >
                        Create Order
                    </Button>
                </Stack>

                {/* FILTER */}
                <Card sx={{ p: 2, mb: 3 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        {/* SEARCH */}
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by order number"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* STATUS */}
                        <TextField
                            select
                            size="small"
                            label="Status"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value === "" ? "" : Number(e.target.value));
                                setPage(1);
                            }}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value={OrderStatus.Active}>Active</MenuItem>
                            <MenuItem value={OrderStatus.Pending}>Pending</MenuItem>
                            <MenuItem value={OrderStatus.Completed}>Completed</MenuItem>
                            <MenuItem value={OrderStatus.Cancelled}>Cancelled</MenuItem>
                        </TextField>

                        {/* ORDER TYPE */}
                        <TextField
                            select
                            size="small"
                            label="Type"
                            value={orderType}
                            onChange={(e) => {
                                setOrderType(
                                    e.target.value === "" ? "" : Number(e.target.value)
                                );
                                setPage(1);
                            }}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value={OrderType.Electricity}>Electricity</MenuItem>
                            <MenuItem value={OrderType.Gas}>Gas</MenuItem>
                        </TextField>

                        {/* SORT BY */}
                        <TextField
                            select
                            size="small"
                            label="Sort By"
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setPage(1);
                            }}
                            sx={{ minWidth: 160 }}
                        >
                            <MenuItem value="createdAt">Created Date</MenuItem>
                            <MenuItem value="orderNumber">Order Number</MenuItem>
                            <MenuItem value="startDate">Start Date</MenuItem>
                        </TextField>

                        {/* SORT DIR */}
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setSortDesc(!sortDesc);
                                setPage(1);
                            }}
                        >
                            {sortDesc ? "DESC" : "ASC"}
                        </Button>
                    </Stack>
                </Card>

                {/* TABLE */}
                <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                            <TableRow>
                                <TableCell>ORDER NO</TableCell>
                                <TableCell>TYPE</TableCell>
                                <TableCell>STATUS</TableCell>
                                <TableCell>START DATE</TableCell>
                                <TableCell>END DATE</TableCell>
                                <TableCell>FEE</TableCell>
                                <TableCell align="right">ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order: any) => (
                                    <TableRow key={order.id} hover>
                                        <TableCell>{order.orderNumber}</TableCell>

                                        <TableCell>
                                            <Chip
                                                icon={
                                                    order.orderType === OrderType.Electricity ? (
                                                        <FlashOnIcon />
                                                    ) : (
                                                        <LocalGasStationIcon />
                                                    )
                                                }
                                                label={
                                                    order.orderType === OrderType.Electricity
                                                        ? "Electricity"
                                                        : "Gas"
                                                }
                                                size="small"
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(order.status)}
                                                size="small"
                                                color={getStatusColor(order.status) as any}
                                            />
                                        </TableCell>

                                        <TableCell>{order.startDate?.split("T")[0]}</TableCell>
                                        <TableCell>{order.endDate?.split("T")[0]}</TableCell>

                                        <TableCell>{order.topupFee?.toLocaleString()} €</TableCell>

                                        <TableCell align="right">
                                            <Stack
                                                direction="row"
                                                justifyContent="flex-end"
                                                spacing={1}
                                            >
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => navigate(`/orders/edit/${order.id}`)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>

                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => navigate(`/orders/delete/${order.id}`)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* PAGINATION BAR (DƯỚI TABLE) */}
                    <Divider />

                    <Box
                        sx={{
                            px: 2,
                            py: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            bgcolor: "white",
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            Showing <b>{shownCount}</b> of <b>{totalCount}</b>
                        </Typography>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant="text"
                                disabled={!canPrev || isLoading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                sx={{ fontSize: 12 }}
                            >
                                PREVIOUS
                            </Button>

                            <Typography variant="body2" color="text.secondary">
                                Page <b>{page}</b> / <b>{totalPages}</b>
                            </Typography>

                            <Button
                                variant="text"
                                disabled={!canNext || isLoading}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                sx={{ fontSize: 12 }}
                            >
                                NEXT
                            </Button>
                        </Stack>
                    </Box>
                </Card>
            </Box>
        </Box>
    );
}
