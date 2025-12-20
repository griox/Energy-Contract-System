import { useMemo, useState } from "react";
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
    useTheme,
    useMediaQuery,
    IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";

import { useTranslation } from "react-i18next";
import NavMenu from "@/components/NavMenu/NavMenu";

import { useAddresses } from "@/hooks/useAddresses";
import { useResellers } from "@/hooks/useResellers";

import AddressCreate from "./AddressCreate";
import AddressEdit from "./AddressEdit";
import AddressDelete from "./AddressDelete";

import ResellerCreate from "./ResellerCreate";
import ResellerEdit from "./ResellerEdit";
import ResellerDelete from "./ResellerDelete";
import { useDebounce } from "@/hooks/useDebounce";

export default function AddressResellerList() {
    const { t } = useTranslation();
    const PAGE_SIZE = 10;

    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    // ✅ FIX: dùng breakpoint của theme để khớp với NavMenu (NavMenu đang xs->md là mobile)
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const pageBg = "background.default";
    const cardBg = "background.paper";
    const borderColor = theme.palette.divider;

    const headBg = isDark
        ? alpha(theme.palette.common.white, 0.06)
        : alpha(theme.palette.common.black, 0.04);

    const rowHoverBg = alpha(theme.palette.action.hover, isDark ? 0.25 : 0.6);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    // Address states
    const [addrSearch, setAddrSearch] = useState("");
    const debouncedAddrSearch = useDebounce(addrSearch, 400);
    const [zipCode, setZipCode] = useState("");
    const [addrPage, setAddrPage] = useState(1);

    // Reseller states
    const [resSearch, setResSearch] = useState("");
    const debouncedResSearch = useDebounce(resSearch, 400);
    const [resType, setResType] = useState("");
    const [resPage, setResPage] = useState(1);

    // modals
    const [addrModal, setAddrModal] = useState<{
        type: "create" | "edit" | "delete" | null;
        data?: any;
    }>({ type: null });

    const [resModal, setResModal] = useState<{
        type: "create" | "edit" | "delete" | null;
        data?: any;
    }>({ type: null });

    const { data: addressData, isLoading: loadingAddr } = useAddresses({
        search: debouncedAddrSearch || undefined,
        zipCode: zipCode || undefined,
        pageNumber: addrPage,
        pageSize: PAGE_SIZE,
        sortBy: "zipCode",
        sortDesc: false,
    });

    const { data: resellerData, isLoading: loadingRes } = useResellers({
        search: debouncedResSearch || undefined,
        type: resType || undefined,
        pageNumber: resPage,
        pageSize: PAGE_SIZE,
        sortBy: "name",
        sortDesc: false,
    });

    const addresses = addressData?.items ?? [];
    const resellers = resellerData?.items ?? [];

    const zipOptions = useMemo(() => {
        const s = new Set<string>();
        addresses.forEach((a: any) => a?.zipCode && s.add(a.zipCode));
        return Array.from(s);
    }, [addresses]);

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

    // const handleOpenMenu = (e: any) => setAnchorEl(e.currentTarget);
    // const handleCloseMenu = () => setAnchorEl(null);

    return (
        <Box
            sx={{
                display: "flex",
                // ✅ FIX: mobile xếp dọc -> NavMenu nằm trên, content full ngang
                flexDirection: { xs: "column", md: "row" },
                minHeight: "100vh",
                width: "100%",
            }}
        >
            {/* MENU */}
            <NavMenu />

            <Box
                sx={{
                    ml: isMobile ? 0 : "240px",
                    p: isMobile ? 2 : 4,
                    width: "100%",
                    minHeight: "100vh",
                    bgcolor: pageBg,
                }}
            >
                {/* HEADER PAGE */}
                <Stack
                    direction={isMobile ? "column" : "row"}
                    justifyContent="space-between"
                    mb={4}
                    spacing={2}
                    alignItems={isMobile ? "stretch" : "center"}
                >
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700}>
                        {t("Address & Reseller Management")}
                    </Typography>

                    {/* nút menu tổng
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenMenu}
                        fullWidth={isMobile}
                    >
                        {t("Add New")}
                    </Button> */}

                    {/* <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseMenu}>
                        <MenuItem
                            onClick={() => {
                                handleCloseMenu();
                                setAddrModal({ type: "create" });
                            }}
                        >
                            {t("Add Address")}
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                handleCloseMenu();
                                setResModal({ type: "create" });
                            }}
                        >
                            {t("Add Reseller")}
                        </MenuItem>
                    </Menu> */}
                </Stack>

                {/* ==================== ADDRESS SECTION ==================== */}
                <Card
                    sx={{
                        p: isMobile ? 2 : 3,
                        mb: 5,
                        borderRadius: isMobile ? 2 : 4,
                        bgcolor: cardBg,
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    {/* ✅ HEADER ROW: title trái - button phải */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            mb: 2,
                            flexWrap: "wrap",
                        }}
                    >
                        <Typography variant="h6" fontWeight={700} sx={{ m: 0 }}>
                            {t("Address List")}
                        </Typography>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setAddrModal({ type: "create" })}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                            {t("Add Address")}
                        </Button>
                    </Box>

                    {/* FILTER */}
                    <Stack
                        direction={isMobile ? "column" : "row"}
                        spacing={2}
                        mb={2}
                        alignItems="stretch"
                    >
                        <TextField
                            placeholder={t("common.search")}
                            value={addrSearch}
                            onChange={(e) => {
                                setAddrSearch(e.target.value);
                                setAddrPage(1);
                            }}
                            fullWidth
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
                            label={t("Zip Code")}
                            value={zipCode}
                            onChange={(e) => {
                                setZipCode(e.target.value);
                                setAddrPage(1);
                            }}
                            fullWidth={isMobile}
                            sx={{ width: isMobile ? "100%" : 180 }}
                        >
                            <MenuItem value="">{t("common.all")}</MenuItem>
                            {zipOptions.map((z) => (
                                <MenuItem key={z} value={z}>
                                    {z}
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
                            {/* TABLE SCROLLABLE FOR MOBILE */}
                            <Box sx={{ overflowX: "auto" }}>
                                <Table size={isMobile ? "small" : "medium"}>
                                    <TableHead sx={{ bgcolor: headBg }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {t("Zip Code")}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {t("House")}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {t("Extension")}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                {t("common.actions")}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {addresses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                    {t("No addresses found")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            addresses.map((a: any) => (
                                                <TableRow
                                                    key={a.id}
                                                    hover
                                                    sx={{ "&:hover": { bgcolor: rowHoverBg } }}
                                                >
                                                    <TableCell>{a.zipCode}</TableCell>
                                                    <TableCell>{a.houseNumber}</TableCell>
                                                    <TableCell>{a.extension}</TableCell>
                                                    <TableCell align="right">
                                                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                                            <IconButton size="small" color="primary" onClick={() => setAddrModal({ type: "edit", data: a })}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>

                                                            <IconButton size="small" color="error" onClick={() => setAddrModal({ type: "delete", data: a })}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    </TableCell>


                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </Box>

                            <Divider sx={{ borderColor, mt: 2 }} />

                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" }, // ✅ mobile xếp dọc
                                    gap: 1.5,
                                    alignItems: { xs: "stretch", sm: "center" },
                                    justifyContent: "space-between",
                                    py: 1.5,
                                }}
                            >
                                <Typography variant="body2">
                                    {t("Showing")} <b>{addrShownCount}</b> {t("of")}{" "}
                                    <b>{addrTotalCount}</b>
                                </Typography>

                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Button
                                        variant="text"
                                        disabled={!addrCanPrev}
                                        onClick={() => setAddrPage((p) => p - 1)}
                                        sx={{ fontSize: 12 }}
                                    >
                                        {t("prev")}
                                    </Button>

                                    <Typography>
                                        {t("Page")} <b>{addrPage}</b> / <b>{addrTotalPages}</b>
                                    </Typography>

                                    <Button
                                        variant="text"
                                        disabled={!addrCanNext}
                                        onClick={() => setAddrPage((p) => p + 1)}
                                        sx={{ fontSize: 12 }}
                                    >
                                        {t("next")}
                                    </Button>
                                </Stack>
                            </Box>
                        </>
                    )}
                </Card>

                {/* ==================== RESELLER SECTION ==================== */}
                <Card
                    sx={{
                        p: isMobile ? 2 : 3,
                        borderRadius: isMobile ? 2 : 4,
                        bgcolor: cardBg,
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    {/* ✅ HEADER ROW: title trái - button phải */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            mb: 2,
                            flexWrap: "wrap",
                        }}
                    >
                        <Typography variant="h6" fontWeight={700} sx={{ m: 0 }}>
                            {t("Reseller List")}
                        </Typography>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setResModal({ type: "create" })}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                            {t("Add Reseller")}
                        </Button>
                    </Box>

                    <Stack
                        direction={isMobile ? "column" : "row"}
                        spacing={2}
                        mb={2}
                        alignItems="stretch"
                    >
                        <TextField
                            placeholder={t("common.search")}
                            value={resSearch}
                            onChange={(e) => {
                                setResSearch(e.target.value);
                                setResPage(1);
                            }}
                            fullWidth
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
                            label={t("Type")}
                            value={resType}
                            onChange={(e) => {
                                setResType(e.target.value);
                                setResPage(1);
                            }}
                            fullWidth={isMobile}
                            sx={{ width: isMobile ? "100%" : 180 }}
                        >
                            <MenuItem value="">{t("common.all")}</MenuItem>
                            <MenuItem value="Broker">Broker</MenuItem>
                            <MenuItem value="Supplier">Supplier</MenuItem>
                            <MenuItem value="Agency">Agency</MenuItem>
                        </TextField>
                    </Stack>

                    {loadingRes ? (
                        <Box py={3} display="flex" justifyContent="center">
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ overflowX: "auto" }}>
                                <Table size={isMobile ? "small" : "medium"}>
                                    <TableHead sx={{ bgcolor: headBg }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {t("Name")}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {t("Type")}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                {t("common.actions")}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {resellers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                                    {t("No resellers found")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            resellers.map((r: any) => (
                                                <TableRow
                                                    key={r.id}
                                                    hover
                                                    sx={{ "&:hover": { bgcolor: rowHoverBg } }}
                                                >
                                                    <TableCell>{r.name}</TableCell>
                                                    <TableCell>
                                                        <Chip label={r.type} size="small" color="info" />
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                                            <IconButton size="small" color="primary" onClick={() => setResModal({ type: "edit", data: r })}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>

                                                            <IconButton size="small" color="error" onClick={() => setResModal({ type: "delete", data: r })}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    </TableCell>


                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </Box>

                            <Divider sx={{ borderColor, mt: 2 }} />

                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" }, // ✅ mobile xếp dọc
                                    gap: 1.5,
                                    alignItems: { xs: "stretch", sm: "center" },
                                    justifyContent: "space-between",
                                    py: 1.5,
                                }}
                            >
                                <Typography variant="body2">
                                    {t("Showing")} <b>{resShownCount}</b> {t("of")}{" "}
                                    <b>{resTotalCount}</b>
                                </Typography>

                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Button
                                        variant="text"
                                        disabled={!resCanPrev}
                                        onClick={() => setResPage((p) => p - 1)}
                                        sx={{ fontSize: 12 }}
                                    >
                                        {t("prev")}
                                    </Button>

                                    <Typography>
                                        {t("Page")} <b>{resPage}</b> / <b>{resTotalPages}</b>
                                    </Typography>

                                    <Button
                                        variant="text"
                                        disabled={!resCanNext}
                                        onClick={() => setResPage((p) => p + 1)}
                                        sx={{ fontSize: 12 }}
                                    >
                                        {t("next")}
                                    </Button>
                                </Stack>
                            </Box>
                        </>
                    )}
                </Card>

                {/* MODALS */}
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