import { useEffect, useMemo, useState } from "react";
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
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    Collapse,
    CardContent,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import EuroIcon from "@mui/icons-material/Euro";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import NavMenu from "@/components/NavMenu/NavMenu";
import { useOrders, useCreateOrder, useUpdateOrder, useDeleteOrder } from "@/hooks/useOrders";
import { useContracts } from "@/hooks/useContracts";
import { OrderType, OrderStatus } from "@/types/order";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/stores/useAuthStore"; // [MỚI]
import { getUserRole } from "@/lib/authUtils"; // [MỚI]

type OrderAny = any;

type FieldErrors = {
    orderNumber?: string;
    contractId?: string;
    startDate?: string;
    endDate?: string;
    topupFee?: string;
};

type FormState = {
    orderNumber: string;
    orderType: OrderType;
    status: OrderStatus;
    startDate: string;
    endDate: string;
    topupFee: number | string;
    contractId: string;
};

function toDateInputValue(iso?: string) {
    if (!iso) return "";
    return String(iso).split("T")[0] ?? "";
}

function parseLocalDate(dateStr: string) {
    return new Date(`${dateStr}T00:00:00`);
}

export default function OrderList() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [searchParams] = useSearchParams();
    const contractIdParam = searchParams.get("contractId");

    // [MỚI] Lấy Role
    const { accessToken } = useAuthStore();
    const role = getUserRole(accessToken);
    const isAdmin = role === "Admin";

    // ==========================
    // STATE: FILTER / PAGINATION
    // ==========================
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [status, setStatus] = useState<number | "">("");
    const [orderType, setOrderType] = useState<number | "">("");

    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // ==========================
    // POPUP STATE
    // ==========================
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editingOrder, setEditingOrder] = useState<OrderAny | null>(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingOrder, setDeletingOrder] = useState<OrderAny | null>(null);

    // ==========================
    // API HOOKS
    // ==========================
    const ordersQuery = useOrders({
        search: debouncedSearch || undefined,
        status: (status === "" || status === undefined) ? undefined : (Number(status) as unknown as OrderStatus),
        orderType: (orderType === "" || orderType === undefined) ? undefined : (Number(orderType) as unknown as OrderType),
        contractId: contractIdParam ? Number(contractIdParam) : undefined,
        pageNumber: page,
        pageSize: PAGE_SIZE,
    });

    const { data, isLoading, refetch } = ordersQuery as any;

    const orders = data?.items ?? [];
    const totalCount = data?.totalCount ?? 0;

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const shownCount = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + orders.length;

    const canPrev = page > 1;
    const canNext = page < totalPages;

    const { data: contractData } = useContracts({ pageNumber: 1, pageSize: 200 });
    const contracts = contractData?.items || [];

    const createMutation = useCreateOrder();
    const updateMutation = useUpdateOrder();
    const deleteMutation = useDeleteOrder();

    // ==========================
    // THEME STYLES
    // ==========================
    const pageBg = "background.default";
    const cardBg = "background.paper";
    const borderColor = alpha(theme.palette.divider, 0.8);

    const headBg = isDark ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.common.black, 0.04);
    const rowHoverBg = alpha(theme.palette.action.hover, isDark ? 0.35 : 0.6);

    // ==========================
    // HELPERS
    // ==========================
    const getStatusColor = (s: number) => {
        switch (s) {
            case OrderStatus.Active: return "success";
            case OrderStatus.Pending: return "warning";
            case OrderStatus.Completed: return "info";
            case OrderStatus.Cancelled: return "error";
            default: return "default";
        }
    };

    const getStatusLabel = (s: number) => t(`orders.statusMap.${s}`, { defaultValue: "Unknown" });
    const getTypeLabel = (type: number) => (type === OrderType.Electricity ? t("orders.electricity") : t("orders.gas"));

    const headCellSx = useMemo(() => ({
        fontWeight: 800,
        color: "text.primary",
        userSelect: "none",
        whiteSpace: "nowrap",
    }), []);

    const contractNumberById = useMemo(() => {
        const m = new Map<number, string>();
        (contracts ?? []).forEach((c: any) => {
            m.set(Number(c.id), c.contractNumber);
        });
        return m;
    }, [contracts]);

    const formatDate = (iso?: string) => (iso ? String(iso).split("T")[0] : "—");

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setOrderType("");
        setPage(1);
    };

    // ==========================
    // FORM DIALOG + VALIDATE
    // ==========================
    const [form, setForm] = useState<FormState>({
        orderNumber: "",
        orderType: OrderType.Gas,
        status: OrderStatus.Pending,
        startDate: "",
        endDate: "",
        topupFee: 0,
        contractId: "",
    });

    const [formErrors, setFormErrors] = useState<FieldErrors>({});

    const validateForm = (next: FormState) => {
        const e: FieldErrors = {};
        if (!String(next.orderNumber ?? "").trim()) e.orderNumber = "Order Number is required";
        if (!next.contractId) e.contractId = "Contract is required";
        if (!next.startDate) e.startDate = "Start Date is required";
        if (!next.endDate) e.endDate = "End Date is required";

        const feeRaw = next.topupFee;
        if (feeRaw === "" || feeRaw === null || feeRaw === undefined) {
            e.topupFee = "Top-up Fee is required";
        } else {
            const feeNum = Number(feeRaw);
            if (Number.isNaN(feeNum)) e.topupFee = "Top-up Fee must be a number";
            else if (feeNum < 0) e.topupFee = "Top-up Fee must be >= 0";
        }

        if (next.startDate && next.endDate) {
            const start = parseLocalDate(next.startDate);
            const end = parseLocalDate(next.endDate);
            if (Number.isNaN(start.getTime())) e.startDate = "Invalid Start Date";
            if (Number.isNaN(end.getTime())) e.endDate = "Invalid End Date";
            if (!e.startDate && !e.endDate && end < start) {
                e.endDate = "End Date must be greater than or equal to Start Date";
            }
        }
        setFormErrors(e);
        return Object.keys(e).length === 0;
    };

    useEffect(() => {
        if (!formOpen) return;
        setFormErrors({});
        if (formMode === "edit" && editingOrder) {
            setForm({
                orderNumber: editingOrder.orderNumber ?? "",
                orderType: editingOrder.orderType ?? OrderType.Gas,
                status: editingOrder.status ?? OrderStatus.Pending,
                startDate: toDateInputValue(editingOrder.startDate),
                endDate: toDateInputValue(editingOrder.endDate),
                topupFee: Number(editingOrder.topupFee ?? 0),
                contractId: editingOrder.contractId?.toString?.() ?? "",
            });
        } else {
            setForm({
                orderNumber: "",
                orderType: OrderType.Gas,
                status: OrderStatus.Pending,
                startDate: "",
                endDate: "",
                topupFee: 0,
                contractId: "",
            });
        }
    }, [formOpen, formMode, editingOrder]);

    const handleFormChange = (e: any) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name]: value } as FormState;
            if (["startDate", "endDate", "contractId", "orderNumber", "topupFee"].includes(name)) {
                validateForm(next);
            }
            return next;
        });
    };

    const canSubmitForm = useMemo(() => {
        if (!String(form.orderNumber ?? "").trim()) return false;
        if (!form.contractId) return false;
        if (!form.startDate || !form.endDate) return false;
        if (Object.keys(formErrors).length > 0) return false;
        return true;
    }, [form, formErrors]);

    const closeForm = () => {
        setFormOpen(false);
        setEditingOrder(null);
    };

    const submitForm = () => {
        const ok = validateForm(form);
        if (!ok) return;
        const payload = {
            ...form,
            contractId: Number(form.contractId),
            topupFee: Number(form.topupFee),
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
        };

        if (formMode === "create") {
            createMutation.mutate(payload as any, { onSuccess: () => { closeForm(); refetch?.(); } });
        } else if (editingOrder?.id) {
            updateMutation.mutate({ id: Number(editingOrder.id), data: payload } as any, { onSuccess: () => { closeForm(); refetch?.(); } });
        }
    };

    const closeDelete = () => {
        setDeleteOpen(false);
        setDeletingOrder(null);
    };

    const confirmDelete = () => {
        if (!deletingOrder?.id) return;
        deleteMutation.mutate(Number(deletingOrder.id), { onSuccess: () => { closeDelete(); refetch?.(); } });
    };

    const openCreatePopup = () => {
        setFormMode("create");
        setEditingOrder(null);
        setFormOpen(true);
    };

    const openEditPopup = (order: OrderAny) => {
        setFormMode("edit");
        setEditingOrder(order);
        setFormOpen(true);
    };

    const openDeletePopup = (order: OrderAny) => {
        setDeletingOrder(order);
        setDeleteOpen(true);
    };

    const MobileOrderCard = ({ order }: { order: any }) => {
        const contractNo = contractNumberById.get(Number(order.contractId)) ?? "-";
        return (
            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: alpha(theme.palette.divider, 0.6), bgcolor: "background.paper", overflow: "hidden" }}>
                <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={900} sx={{ color: "primary.main" }} noWrap>{order.orderNumber}</Typography>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>{t("orders.contract")}: <b>{contractNo}</b></Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                            <Chip label={getStatusLabel(order.status)} size="small" color={getStatusColor(order.status) as any} variant={isDark ? "outlined" : "filled"} sx={{ fontWeight: 900 }} />
                            
                            {/* [MỚI] Ẩn nút Edit/Delete trên Mobile nếu là Admin (tuỳ yêu cầu, nếu Admin chỉ xem thì ẩn luôn) */}
                            {!isAdmin && (
                                <>
                                    <IconButton size="small" color="primary" onClick={() => openEditPopup(order)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => openDeletePopup(order)}><DeleteIcon fontSize="small" /></IconButton>
                                </>
                            )}
                        </Stack>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">{t("orders.type")}</Typography>
                            <Chip icon={order.orderType === OrderType.Electricity ? <FlashOnIcon /> : <LocalGasStationIcon />} label={getTypeLabel(order.orderType)} size="small" variant={isDark ? "outlined" : "filled"} />
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">{t("orders.startDate")}</Typography>
                            <Typography variant="body2" fontWeight={800}>{formatDate(order.startDate)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">{t("orders.endDate")}</Typography>
                            <Typography variant="body2" fontWeight={800}>{formatDate(order.endDate)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">{t("orders.fee")}</Typography>
                            <Typography variant="body2" fontWeight={800}>{order.topupFee?.toLocaleString?.()} €</Typography>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh", bgcolor: pageBg }}>
            <NavMenu />
            <Box sx={{ ml: { xs: 0, md: "240px" }, p: { xs: 2, md: 4 }, width: "100%", minHeight: "100vh", bgcolor: pageBg, color: "text.primary" }}>
                {/* HEADER */}
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.25} mb={isMobile ? 2 : 4}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} noWrap>{t("orders.management")}</Typography>
                        {contractIdParam && (
                            <Chip
                                label={`${t("Filtering by Contract ID")}: ${contractIdParam}`}
                                onDelete={() => { window.location.href = "/orders"; }}
                                sx={{ mt: 1 }}
                            />
                        )}
                        <Typography variant="body2" color="text.secondary" noWrap>{t("orders.subtitle")}</Typography>
                    </Box>
                    
                    {/* [CHỈNH SỬA] Chỉ hiển thị nút Create Order nếu KHÔNG PHẢI ADMIN */}
                    {!isAdmin && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={openCreatePopup}
                            fullWidth={isMobile}
                            sx={{ borderRadius: 2, fontWeight: 900, py: isMobile ? 1.1 : undefined }}
                        >
                            {t("orders.create")}
                        </Button>
                    )}
                </Stack>

                {/* FILTER */}
                {isMobile ? (
                    <Card sx={{ p: 2, mb: 2, bgcolor: cardBg, border: `1px solid ${borderColor}`, borderRadius: 3, boxShadow: "none" }}>
                        {/* Mobile Filter Content... (Giữ nguyên) */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => setMobileFilterOpen((v) => !v)} sx={{ cursor: "pointer" }}>
                            <Box>
                                <Typography fontWeight={900}>{t("Search...")}</Typography>
                                <Typography variant="caption" color="text.secondary">{t("Apply / Clear")}</Typography>
                            </Box>
                            <IconButton size="small" sx={{ ml: 1 }}>{mobileFilterOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}</IconButton>
                        </Stack>
                        <Collapse in={mobileFilterOpen}>
                            <Divider sx={{ my: 1.5, borderColor }} />
                            <Stack spacing={1.25}>
                                <TextField fullWidth size="small" placeholder={t("common.search")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} />
                                <TextField select fullWidth size="small" label={t("orders.status")} value={status} onChange={(e) => { setStatus(e.target.value === "" ? "" : Number(e.target.value)); setPage(1); }}>
                                    <MenuItem value="">{t("common.all")}</MenuItem>
                                    <MenuItem value={OrderStatus.Active}>{t("orders.statusActive")}</MenuItem>
                                    <MenuItem value={OrderStatus.Pending}>{t("orders.statusPending")}</MenuItem>
                                    <MenuItem value={OrderStatus.Completed}>{t("orders.statusCompleted")}</MenuItem>
                                    <MenuItem value={OrderStatus.Cancelled}>{t("orders.statusCancelled")}</MenuItem>
                                </TextField>
                                <TextField select fullWidth size="small" label={t("orders.type")} value={orderType} onChange={(e) => { setOrderType(e.target.value === "" ? "" : Number(e.target.value)); setPage(1); }}>
                                    <MenuItem value="">{t("common.all")}</MenuItem>
                                    <MenuItem value={OrderType.Electricity}>{t("orders.electricity")}</MenuItem>
                                    <MenuItem value={OrderType.Gas}>{t("orders.gas")}</MenuItem>
                                </TextField>
                                <Stack direction="row" spacing={1}>
                                    <Button fullWidth variant="outlined" onClick={clearFilters} sx={{ borderRadius: 2, fontWeight: 900 }}>{t("Clear")}</Button>
                                    <Button fullWidth variant="contained" onClick={() => setMobileFilterOpen(false)} sx={{ borderRadius: 2, fontWeight: 900 }}>{t("Apply")}</Button>
                                </Stack>
                            </Stack>
                        </Collapse>
                    </Card>
                ) : (
                    <Card sx={{ p: 2, mb: 3, bgcolor: cardBg, border: `1px solid ${borderColor}`, boxShadow: isDark ? "none" : undefined, borderRadius: 3 }}>
                        {/* Desktop Filter Content... (Giữ nguyên) */}
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField fullWidth size="small" placeholder={t("common.search")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} />
                            <TextField select size="small" label={t("orders.status")} value={status} onChange={(e) => { setStatus(e.target.value === "" ? "" : Number(e.target.value)); setPage(1); }} sx={{ minWidth: 150 }}>
                                <MenuItem value="">{t("common.all")}</MenuItem>
                                <MenuItem value={OrderStatus.Active}>{t("orders.statusActive")}</MenuItem>
                                <MenuItem value={OrderStatus.Pending}>{t("orders.statusPending")}</MenuItem>
                                <MenuItem value={OrderStatus.Completed}>{t("orders.statusCompleted")}</MenuItem>
                                <MenuItem value={OrderStatus.Cancelled}>{t("orders.statusCancelled")}</MenuItem>
                            </TextField>
                            <TextField select size="small" label={t("orders.type")} value={orderType} onChange={(e) => { setOrderType(e.target.value === "" ? "" : Number(e.target.value)); setPage(1); }} sx={{ minWidth: 150 }}>
                                <MenuItem value="">{t("common.all")}</MenuItem>
                                <MenuItem value={OrderType.Electricity}>{t("orders.electricity")}</MenuItem>
                                <MenuItem value={OrderType.Gas}>{t("orders.gas")}</MenuItem>
                            </TextField>
                        </Stack>
                    </Card>
                )}

                {/* LIST / TABLE */}
                {isMobile ? (
                    <Stack spacing={1.5}>
                        {isLoading ? (
                            <Card sx={{ p: 2, borderRadius: 3, bgcolor: "background.paper", border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none" }}>
                                <Stack direction="row" spacing={1.5} alignItems="center"><CircularProgress size={18} /><Typography color="text.secondary">{t("Loading data...")}</Typography></Stack>
                            </Card>
                        ) : orders.length === 0 ? (
                            <Card sx={{ p: 2, borderRadius: 3, bgcolor: "background.paper", border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none" }}>
                                <Typography fontWeight={900}>{t("orders.noOrders")}</Typography>
                            </Card>
                        ) : (
                            orders.map((order: any) => <MobileOrderCard key={order.id} order={order} />)
                        )}
                        <Card sx={{ borderRadius: 3, bgcolor: "background.paper", border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none" }}>
                            <CardContent sx={{ p: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="text.secondary">{t("Page")} <b>{page}</b> / <b>{totalPages}</b></Typography>
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="outlined" size="small" disabled={!canPrev || isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))} sx={{ borderRadius: 2, fontWeight: 900 }}>{t("prev")}</Button>
                                        <Button variant="outlined" size="small" disabled={!canNext || isLoading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} sx={{ borderRadius: 2, fontWeight: 900 }}>{t("next")}</Button>
                                    </Stack>
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t("Showing")} <b>{shownCount}</b> {t("of")} <b>{totalCount}</b></Typography>
                            </CardContent>
                        </Card>
                    </Stack>
                ) : (
                    <Card sx={{ borderRadius: 3, overflow: "hidden", bgcolor: cardBg, border: `1px solid ${borderColor}`, boxShadow: isDark ? "none" : undefined }}>
                        <Table>
                            <TableHead sx={{ bgcolor: headBg }}>
                                <TableRow>
                                    <TableCell sx={headCellSx}>{t("orders.orderNumber")}</TableCell>
                                    <TableCell sx={headCellSx}>{t("orders.contract")}</TableCell>
                                    <TableCell sx={headCellSx}>{t("orders.type")}</TableCell>
                                    <TableCell sx={headCellSx}>{t("orders.status")}</TableCell>
                                    <TableCell sx={headCellSx}>{t("orders.startDate")}</TableCell>
                                    <TableCell sx={headCellSx}>{t("orders.endDate")}</TableCell>
                                    <TableCell sx={headCellSx}>{t("orders.fee")}</TableCell>
                                    <TableCell align="right" sx={headCellSx}>{t("common.actions")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>{t("orders.noOrders")}</TableCell></TableRow>
                                ) : (
                                    orders.map((order: any) => (
                                        <TableRow key={order.id} hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                                            <TableCell sx={{ color: "text.primary", fontWeight: 600 }}>{order.orderNumber}</TableCell>
                                            <TableCell sx={{ color: "text.primary" }}>{contractNumberById.get(Number(order.contractId)) ?? "-"}</TableCell>
                                            <TableCell>
                                                <Chip icon={order.orderType === OrderType.Electricity ? <FlashOnIcon /> : <LocalGasStationIcon />} label={getTypeLabel(order.orderType)} size="small" variant={isDark ? "outlined" : "filled"} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={getStatusLabel(order.status)} size="small" color={getStatusColor(order.status) as any} variant={isDark ? "outlined" : "filled"} />
                                            </TableCell>
                                            <TableCell sx={{ color: "text.primary" }}>{formatDate(order.startDate)}</TableCell>
                                            <TableCell sx={{ color: "text.primary" }}>{formatDate(order.endDate)}</TableCell>
                                            <TableCell sx={{ color: "text.primary" }}>{order.topupFee?.toLocaleString?.()} €</TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                                    {/* [CHỈNH SỬA] Ẩn nút Edit/Delete nếu là Admin */}
                                                    {!isAdmin && (
                                                        <>
                                                            <IconButton size="small" color="primary" onClick={() => openEditPopup(order)}><EditIcon fontSize="small" /></IconButton>
                                                            <IconButton size="small" color="error" onClick={() => openDeletePopup(order)}><DeleteIcon fontSize="small" /></IconButton>
                                                        </>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Divider sx={{ borderColor }} />
                        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: isDark ? alpha(theme.palette.common.black, 0.25) : "background.paper" }}>
                            <Typography variant="body2" color="text.secondary">{t("Showing")} <b>{shownCount}</b> {t("of")} <b>{totalCount}</b></Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Button variant="text" disabled={!canPrev || isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))} sx={{ fontSize: 12 }}>{t("prev")}</Button>
                                <Typography variant="body2" color="text.secondary">{t("Page")} <b>{page}</b> / <b>{totalPages}</b></Typography>
                                <Button variant="text" disabled={!canNext || isLoading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} sx={{ fontSize: 12 }}>{t("next")}</Button>
                            </Stack>
                        </Box>
                    </Card>
                )}

                {/* CREATE / EDIT DIALOG */}
                <Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="md">
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        {formMode === "create" ? t("orders.create") : t("Edit Order")}
                        {formMode === "edit" && editingOrder?.orderNumber ? ` — ${editingOrder.orderNumber}` : ""}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body2" color="text.secondary" mb={2}>{t("Fill in the details below.")}</Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                            <TextField label={t("orders.orderNumber")} name="orderNumber" fullWidth value={form.orderNumber} onChange={handleFormChange} placeholder="e.g. ORD-2024-001" error={!!formErrors.orderNumber} helperText={formErrors.orderNumber} />
                            <TextField label={t("orders.contract")} name="contractId" fullWidth select value={form.contractId} onChange={handleFormChange} error={!!formErrors.contractId} helperText={formErrors.contractId}>
                                {contracts.map((c: any) => (<MenuItem key={c.id} value={String(c.id)}>{c.contractNumber} — {c.firstName} {c.lastName}</MenuItem>))}
                            </TextField>
                            <TextField label={t("orders.type")} name="orderType" fullWidth select value={form.orderType} onChange={handleFormChange}>
                                <MenuItem value={OrderType.Gas}>{t("orders.gas")}</MenuItem>
                                <MenuItem value={OrderType.Electricity}>{t("orders.electricity")}</MenuItem>
                            </TextField>
                            <TextField label={t("orders.status")} name="status" fullWidth select value={form.status} onChange={handleFormChange}>
                                <MenuItem value={OrderStatus.Pending}>{t("orders.statusPending")}</MenuItem>
                                <MenuItem value={OrderStatus.Active}>{t("orders.statusActive")}</MenuItem>
                                <MenuItem value={OrderStatus.Completed}>{t("orders.statusCompleted")}</MenuItem>
                                <MenuItem value={OrderStatus.Cancelled}>{t("orders.statusCancelled")}</MenuItem>
                            </TextField>
                            <TextField type="date" label={t("orders.startDate")} name="startDate" fullWidth InputLabelProps={{ shrink: true }} value={form.startDate} onChange={handleFormChange} error={!!formErrors.startDate} helperText={formErrors.startDate} />
                            <TextField type="date" label={t("orders.endDate")} name="endDate" fullWidth InputLabelProps={{ shrink: true }} value={form.endDate} onChange={handleFormChange} error={!!formErrors.endDate} helperText={formErrors.endDate} />
                            <Box sx={{ gridColumn: "1 / -1" }}>
                                <TextField type="number" label={t("Top-up Fee")} name="topupFee" fullWidth value={form.topupFee} onChange={handleFormChange} error={!!formErrors.topupFee} helperText={formErrors.topupFee} InputProps={{ startAdornment: (<InputAdornment position="start"><EuroIcon fontSize="small" /></InputAdornment>) }} />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button variant="outlined" onClick={closeForm} sx={{ borderRadius: 2 }}>{t("Cancel")}</Button>
                        <Button variant="contained" onClick={submitForm} disabled={createMutation.isPending || updateMutation.isPending || !canSubmitForm} sx={{ borderRadius: 2, px: 4 }}>
                            {formMode === "create" ? (createMutation.isPending ? t("Creating...") : t("orders.create")) : (updateMutation.isPending ? t("Saving...") : t("Save Changes"))}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* DELETE DIALOG */}
                <Dialog open={deleteOpen} onClose={closeDelete} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}><WarningAmberRoundedIcon sx={{ color: "#f59e0b" }} />{t("Delete Order?")}</DialogTitle>
                    <DialogContent dividers>
                        <Typography color="text.secondary">{t("Are you sure you want to delete order")} <b>{deletingOrder?.orderNumber}</b>?<br />{t("This action cannot be undone.")}</Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button variant="outlined" onClick={closeDelete} sx={{ borderRadius: 2 }}>{t("Cancel")}</Button>
                        <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleteMutation.isPending} sx={{ borderRadius: 2, px: 3 }}>
                            {deleteMutation.isPending ? t("Deleting...") : t("Delete Order")}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
}