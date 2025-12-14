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
    MenuItem,
    Menu,
    CircularProgress,
    Divider,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";

import NavMenu from "@/components/NavMenu/NavMenu";

// Hooks
import { useAddresses } from "@/hooks/useAddresses";
import { useResellers } from "@/hooks/useResellers";

// Address Modals
import AddressCreate from "./AddressCreate";
import AddressEdit from "./AddressEdit";
import AddressDelete from "./AddressDelete";

// Reseller Modals
import ResellerCreate from "./ResellerCreate";
import ResellerEdit from "./ResellerEdit";
import ResellerDelete from "./ResellerDelete";

export default function AddressResellerList() {
    const PAGE_SIZE = 10;

    // =========================
    // ADD NEW MENU
    // =========================
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    // =========================
    // ADDRESS STATES
    // =========================
    const [addrSearch, setAddrSearch] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [addrPage, setAddrPage] = useState(1);
    const [addrSortBy, setAddrSortBy] = useState("zipCode");
    const [addrSortDesc, setAddrSortDesc] = useState(false);

    // =========================
    // RESELLER STATES
    // =========================
    const [resSearch, setResSearch] = useState("");
    const [resType, setResType] = useState("");
    const [resPage, setResPage] = useState(1);
    const [resSortBy, setResSortBy] = useState("name");
    const [resSortDesc, setResSortDesc] = useState(false);

    // =========================
    // MODAL STATES
    // =========================
    const [addrModal, setAddrModal] = useState<{
        type: "create" | "edit" | "delete" | null;
        data?: any;
    }>({ type: null });

    const [resModal, setResModal] = useState<{
        type: "create" | "edit" | "delete" | null;
        data?: any;
    }>({ type: null });

    // =========================
    // FETCH DATA
    // =========================
    const { data: addressData, isLoading: loadingAddr } = useAddresses({
        search: addrSearch || undefined,
        zipCode: zipCode || undefined,
        pageNumber: addrPage,
        pageSize: PAGE_SIZE,
        sortBy: addrSortBy,
        sortDesc: addrSortDesc,
    });

    const { data: resellerData, isLoading: loadingRes } = useResellers({
        search: resSearch || undefined,
        type: resType || undefined,
        pageNumber: resPage,
        pageSize: PAGE_SIZE,
        sortBy: resSortBy,
        sortDesc: resSortDesc,
    });

    const addresses = addressData?.items ?? [];
    const resellers = resellerData?.items ?? [];

    const addrTotalCount = addressData?.totalCount ?? 0;
    const resTotalCount = resellerData?.totalCount ?? 0;

    const addrTotalPages = Math.max(1, Math.ceil(addrTotalCount / PAGE_SIZE));
    const resTotalPages = Math.max(1, Math.ceil(resTotalCount / PAGE_SIZE));

    const addrShownCount =
        addrTotalCount === 0 ? 0 : (addrPage - 1) * PAGE_SIZE + addresses.length;

    const resShownCount =
        resTotalCount === 0 ? 0 : (resPage - 1) * PAGE_SIZE + resellers.length;

    const addrCanPrev = addrPage > 1;
    const addrCanNext = addrPage < addrTotalPages;

    const resCanPrev = resPage > 1;
    const resCanNext = resPage < resTotalPages;

    // =========================
    // HANDLERS
    // =========================
    const handleOpenMenu = (e: any) => setAnchorEl(e.currentTarget);
    const handleCloseMenu = () => setAnchorEl(null);

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
                <Stack direction="row" justifyContent="space-between" mb={4}>
                    <Typography variant="h4" fontWeight={700}>
                        Address & Reseller Management
                    </Typography>

                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenMenu}>
                        Add New
                    </Button>

                    <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseMenu}>
                        <MenuItem
                            onClick={() => {
                                handleCloseMenu();
                                setAddrModal({ type: "create" });
                            }}
                        >
                            Add Address
                        </MenuItem>

                        <MenuItem
                            onClick={() => {
                                handleCloseMenu();
                                setResModal({ type: "create" });
                            }}
                        >
                            Add Reseller
                        </MenuItem>
                    </Menu>
                </Stack>

                {/* ================= ADDRESS SECTION ================= */}
                <Card sx={{ p: 3, mb: 5, borderRadius: 3, overflow: "hidden" }}>
                    <Typography variant="h6" fontWeight={600} mb={2}>
                        Address List
                    </Typography>

                    {/* ADDRESS FILTER */}
                    <Stack direction="row" spacing={2} mb={2}>
                        <TextField
                            fullWidth
                            placeholder="Search address..."
                            value={addrSearch}
                            onChange={(e) => {
                                setAddrSearch(e.target.value);
                                setAddrPage(1);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            select
                            label="Zip Code"
                            value={zipCode}
                            onChange={(e) => {
                                setZipCode(e.target.value);
                                setAddrPage(1);
                            }}
                            sx={{ minWidth: 160 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            {/* ⚠️ lấy zipCode từ current page (đang giống code m). Nếu muốn list zipCode unique toàn DB thì phải có API riêng */}
                            {addresses.map((a: any) => (
                                <MenuItem key={`${a.id}-${a.zipCode}`} value={a.zipCode}>
                                    {a.zipCode}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>

                    {loadingAddr ? (
                        <Box py={3} display="flex" justifyContent="center">
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <>
                            <Table>
                                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                    <TableRow>
                                        <TableCell>Zip Code</TableCell>
                                        <TableCell>House</TableCell>
                                        <TableCell>Extension</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {addresses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                No addresses found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        addresses.map((a: any) => (
                                            <TableRow key={a.id} hover>
                                                <TableCell>{a.zipCode}</TableCell>
                                                <TableCell>{a.houseNumber}</TableCell>
                                                <TableCell>{a.extension}</TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        startIcon={<EditIcon />}
                                                        onClick={() => setAddrModal({ type: "edit", data: a })}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        color="error"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => setAddrModal({ type: "delete", data: a })}
                                                    >
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* PAGINATION BAR - ADDRESS (DƯỚI TABLE) */}
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
                                    Showing <b>{addrShownCount}</b> of <b>{addrTotalCount}</b>
                                </Typography>

                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Button
                                        variant="text"
                                        disabled={!addrCanPrev}
                                        onClick={() => setAddrPage((p) => Math.max(1, p - 1))}
                                        sx={{ fontSize: 12 }}
                                    >
                                        PREVIOUS
                                    </Button>

                                    <Typography variant="body2" color="text.secondary">
                                        Page <b>{addrPage}</b> / <b>{addrTotalPages}</b>
                                    </Typography>

                                    <Button
                                        variant="text"
                                        disabled={!addrCanNext}
                                        onClick={() => setAddrPage((p) => Math.min(addrTotalPages, p + 1))}
                                        sx={{ fontSize: 12 }}
                                    >
                                        NEXT
                                    </Button>
                                </Stack>
                            </Box>
                        </>
                    )}
                </Card>

                {/* ================= RESELLER SECTION ================= */}
                <Card sx={{ p: 3, borderRadius: 3, overflow: "hidden" }}>
                    <Typography variant="h6" fontWeight={600} mb={2}>
                        Reseller List
                    </Typography>

                    {/* RESELLER FILTER */}
                    <Stack direction="row" spacing={2} mb={2}>
                        <TextField
                            fullWidth
                            placeholder="Search reseller..."
                            value={resSearch}
                            onChange={(e) => {
                                setResSearch(e.target.value);
                                setResPage(1);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            select
                            label="Type"
                            value={resType}
                            onChange={(e) => {
                                setResType(e.target.value);
                                setResPage(1);
                            }}
                            sx={{ minWidth: 160 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="Broker">Broker</MenuItem>
                            <MenuItem value="Supplier">Supplier</MenuItem>
                        </TextField>
                    </Stack>

                    {loadingRes ? (
                        <Box py={3} display="flex" justifyContent="center">
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <>
                            <Table>
                                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {resellers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">
                                                No resellers found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        resellers.map((r: any) => (
                                            <TableRow key={r.id} hover>
                                                <TableCell>{r.name}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={r.type}
                                                        color={r.type === "Broker" ? "info" : "secondary"}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        startIcon={<EditIcon />}
                                                        onClick={() => setResModal({ type: "edit", data: r })}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        color="error"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => setResModal({ type: "delete", data: r })}
                                                    >
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* PAGINATION BAR - RESELLER (DƯỚI TABLE) */}
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
                                    Showing <b>{resShownCount}</b> of <b>{resTotalCount}</b>
                                </Typography>

                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Button
                                        variant="text"
                                        disabled={!resCanPrev}
                                        onClick={() => setResPage((p) => Math.max(1, p - 1))}
                                        sx={{ fontSize: 12 }}
                                    >
                                        PREVIOUS
                                    </Button>

                                    <Typography variant="body2" color="text.secondary">
                                        Page <b>{resPage}</b> / <b>{resTotalPages}</b>
                                    </Typography>

                                    <Button
                                        variant="text"
                                        disabled={!resCanNext}
                                        onClick={() => setResPage((p) => Math.min(resTotalPages, p + 1))}
                                        sx={{ fontSize: 12 }}
                                    >
                                        NEXT
                                    </Button>
                                </Stack>
                            </Box>
                        </>
                    )}
                </Card>

                {/* ADDRESS MODALS */}
                {addrModal.type === "create" && (
                    <AddressCreate open onClose={() => setAddrModal({ type: null })} />
                )}
                {addrModal.type === "edit" && (
                    <AddressEdit
                        open
                        onClose={() => setAddrModal({ type: null })}
                        data={addrModal.data}
                    />
                )}
                {addrModal.type === "delete" && (
                    <AddressDelete
                        open
                        onClose={() => setAddrModal({ type: null })}
                        data={addrModal.data}
                    />
                )}

                {/* RESELLER MODALS */}
                {resModal.type === "create" && (
                    <ResellerCreate open onClose={() => setResModal({ type: null })} />
                )}
                {resModal.type === "edit" && (
                    <ResellerEdit
                        open
                        onClose={() => setResModal({ type: null })}
                        data={resModal.data}
                    />
                )}
                {resModal.type === "delete" && (
                    <ResellerDelete
                        open
                        onClose={() => setResModal({ type: null })}
                        data={resModal.data}
                    />
                )}
            </Box>
        </Box>
    );
}
