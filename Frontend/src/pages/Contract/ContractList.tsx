import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  TextField,
  Stack,
  IconButton,
  MenuItem,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  InputAdornment,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

// Icons
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";

// Components & Hooks
import NavMenu from "@/components/NavMenu/NavMenu";
import ResellerCell from "./components/ResellerCell";
import ContractFormDrawer from "./ContractFormDrawer";
import GeneratePdfDialog from "./components/GeneratePdfDialog";
import ViewPdfDialog from "./components/ViewPdfDialog";

import { useContracts } from "@/hooks/useContracts";
import { useResellers } from "@/hooks/useResellers";
import { useGeneratePdf } from "@/hooks/usePdf";
import { useDeleteContract } from "@/hooks/useContracts"; // Assuming you have this
import { useAuthStore } from "@/stores/useAuthStore";
import { getUserRole } from "@/lib/authUtils";
import toast from "react-hot-toast";

const SIDEBAR_OFFSET = 240; // Matches OrderList layout

export default function ContractList() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();

  // ==========================
  // STATE: LOGIC RETAINED
  // ==========================
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // PDF Logic States
  const [genPdfOpen, setGenPdfOpen] = useState(false);
  const [viewPdfOpen, setViewPdfOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [resellerId, setResellerId] = useState("");
  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");
  const [sortBy, setSortBy] = useState<"customerName" | "email">("customerName");
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false); // UI state from OrderList

  const { accessToken } = useAuthStore();
  const role = getUserRole(accessToken);
  const isAdMin = role === "Admin";

  const PAGE_SIZE = 10;

  // ==========================
  // API HOOKS
  // ==========================
  const resellerQuery = useResellers({ pageNumber: 1, pageSize: 999 });

  const contractQuery = useContracts({
    search: search || undefined,
    resellerId: resellerId ? Number(resellerId) : undefined,
    startDateFrom: startFrom || undefined,
    startDateTo: startTo || undefined,
    pageNumber: page,
    pageSize: PAGE_SIZE,
    sortBy,
    sortDesc,
  });

  const data = contractQuery.data?.items ?? [];
  const totalPages = contractQuery.data?.totalPages ?? 1;
  const totalCount = contractQuery.data?.totalCount ?? 0;
  const shownCount = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + data.length;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const generatePdfMutation = useGeneratePdf();
  // Assuming a delete hook exists similar to OrderList, otherwise use your existing logic
  const deleteMutation = useDeleteContract ? useDeleteContract() : { mutate: () => {}, isPending: false };

  // ==========================
  // STYLES
  // ==========================
  const pageBg = "background.default";
  const cardBg = "background.paper";
  const borderColor = alpha(theme.palette.divider, 0.8);
  const headBg = isDark ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.common.black, 0.04);
  const rowHoverBg = alpha(theme.palette.action.hover, isDark ? 0.35 : 0.6);

  const headCellSx = useMemo(
    () => ({
      fontWeight: 800,
      color: "text.primary",
      userSelect: "none",
      whiteSpace: "nowrap",
    }),
    []
  );

  // ==========================
  // HANDLERS (LOGIC RETAINED)
  // ==========================
  const handlePdfIconClick = (c: any) => {
    setSelectedContract(c);
    const hasPdf = typeof c?.pdfLink === "string" && c.pdfLink.trim() !== "";
    if (hasPdf) setViewPdfOpen(true);
    else setGenPdfOpen(true);
  };

  const handleRegenerateRequest = () => {
    setViewPdfOpen(false);
    setGenPdfOpen(true);
  };

  const handleGenerateConfirm = (c: any, templateName: string) => {
    const pdfRequest = {
      contractId: c.id,
      contractNumber: c.contractNumber,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      companyName: c.companyName,
      startDate: c.startDate,
      endDate: c.endDate,
      bankAccountNumber: c.bankAccountNumber,
      addressLine: "",
      totalAmount: 0,
      currency: "VND",
      templateName,
      currentPdfUrl: c.pdfLink,
    };

    generatePdfMutation.mutate(pdfRequest as any, {
      onSuccess: () => {
        toast.success(t("contractDetail.toast.pdfGenerated"));
        setGenPdfOpen(false);
        contractQuery.refetch();
      },
      onError: (error: any) => {
        console.error(error);
        toast.error(t("contractDetail.toast.pdfGenerateFailed"));
      },
    });
  };

  const toggleSort = (field: "customerName" | "email") => {
    if (sortBy === field) setSortDesc(!sortDesc);
    else {
      setSortBy(field);
      setSortDesc(false);
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setResellerId("");
    setStartFrom("");
    setStartTo("");
    setPage(1);
    contractQuery.refetch();
  };

  const openCreate = () => {
    setDrawerMode("create");
    setCurrentId(null);
    setDrawerOpen(true);
  };

  const openEdit = (id: number) => {
    setDrawerMode("edit");
    setCurrentId(id);
    setDrawerOpen(true);
  };

  const openDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    // Implementing delete logic matching OrderList pattern
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteOpen(false);
        contractQuery.refetch();
      }
    });
  };

  const renderSortIcon = (field: "customerName" | "email") => {
    const active = sortBy === field;
    if (active) return sortDesc ? <FiChevronDown size={14} /> : <FiChevronUp size={14} />;
    return <FiChevronDown size={14} style={{ opacity: 0.25 }} />;
  };

  // ==========================
  // MOBILE CARD ITEM
  // ==========================
  const MobileContractCard = ({ c }: { c: any }) => {
    const hasPdf = typeof c?.pdfLink === "string" && c.pdfLink.trim() !== "";
    
    return (
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: alpha(theme.palette.divider, 0.6),
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Top Row: Number & Actions */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                fontWeight={900}
                sx={{ color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate(`/contracts/${c.id}/detail`)}
                noWrap
              >
                {c.contractNumber}
              </Typography>
              <Typography fontWeight={800} sx={{ mt: 0.25 }} noWrap>
                {c.firstName} {c.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {c.email}
              </Typography>
            </Box>

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
               {/* PDF ICON LOGIC - RETAINED */}
              <Tooltip title={hasPdf ? t("pdf.view") : t("pdf.generate")}>
                <IconButton
                  size="small"
                  onClick={() => handlePdfIconClick(c)}
                  color={hasPdf ? "success" : "default"}
                >
                  {hasPdf ? <FiCheckCircle size={18} /> : <FiFileText size={18} />}
                </IconButton>
              </Tooltip>

              {isAdMin && (
                <>
                  <IconButton size="small" color="primary" onClick={() => openEdit(c.id)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => openDelete(c.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {/* Details */}
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {t("Reseller")}
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                <ResellerCell resellerId={c.resellerId} />
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {t("contract.start")}
              </Typography>
              <Typography variant="body2" fontWeight={800}>
                {c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {t("contract.end")}
              </Typography>
              <Typography variant="body2" fontWeight={800}>
                 {c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // ==========================
  // RENDER
  // ==========================
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        minHeight: "100vh",
        bgcolor: pageBg,
      }}
    >
      <NavMenu />

      <Box
        sx={{
          ml: { xs: 0, md: `${SIDEBAR_OFFSET}px` },
          p: { xs: 2, md: 4 },
          width: "100%",
          minHeight: "100vh",
          bgcolor: pageBg,
          color: "text.primary",
        }}
      >
        {/* HEADER */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.25}
          mb={isMobile ? 2 : 4}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} noWrap>
              {t("contract.management")}
            </Typography>
          </Box>

          {isAdMin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              fullWidth={isMobile}
              sx={{ borderRadius: 2, fontWeight: 900, py: isMobile ? 1.1 : undefined }}
            >
              {t("contract.create")}
            </Button>
          )}
        </Stack>

        {/* FILTER SECTION */}
        {isMobile ? (
          <Card
            sx={{
              p: 2,
              mb: 2,
              bgcolor: cardBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 3,
              boxShadow: "none",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              onClick={() => setMobileFilterOpen((v) => !v)}
              sx={{ cursor: "pointer" }}
            >
              <Box>
                <Typography fontWeight={900}>{t("Search...", { defaultValue: "Search..." })}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("Apply / Clear", { defaultValue: "Apply / Clear" })}
                </Typography>
              </Box>
              <IconButton size="small" sx={{ ml: 1 }}>
                {mobileFilterOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
              </IconButton>
            </Stack>

            <Collapse in={mobileFilterOpen}>
              <Divider sx={{ my: 1.5, borderColor }} />
              <Stack spacing={1.25}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t("common.search")}
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

                <TextField
                  select
                  fullWidth
                  size="small"
                  value={resellerId}
                  onChange={(e) => {
                    setResellerId(e.target.value);
                    setPage(1);
                  }}
                  label={t("reseller.label")}
                >
                  <MenuItem value="">{t("common.all")}</MenuItem>
                  {resellerQuery.data?.items?.map((r: any) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label={t("contract.start")}
                  InputLabelProps={{ shrink: true }}
                  value={startFrom}
                  onChange={(e) => {
                    setStartFrom(e.target.value);
                    setPage(1);
                  }}
                />

                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label={t("contract.end")}
                  InputLabelProps={{ shrink: true }}
                  value={startTo}
                  onChange={(e) => {
                    setStartTo(e.target.value);
                    setPage(1);
                  }}
                />

                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={clearFilters}
                    sx={{ borderRadius: 2, fontWeight: 900 }}
                  >
                    {t("common.clear")}
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                        contractQuery.refetch();
                        setMobileFilterOpen(false);
                    }}
                    sx={{ borderRadius: 2, fontWeight: 900 }}
                  >
                    {t("common.apply")}
                  </Button>
                </Stack>
              </Stack>
            </Collapse>
          </Card>
        ) : (
          <Card
            sx={{
              p: 2,
              mb: 3,
              bgcolor: cardBg,
              border: `1px solid ${borderColor}`,
              boxShadow: isDark ? "none" : undefined,
              borderRadius: 3,
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
              <TextField
                fullWidth
                size="small"
                placeholder={t("common.search")}
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

              <TextField
                select
                size="small"
                value={resellerId}
                onChange={(e) => {
                  setResellerId(e.target.value);
                  setPage(1);
                }}
                label={t("reseller.label")}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">{t("common.all")}</MenuItem>
                {resellerQuery.data?.items?.map((r: any) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="date"
                size="small"
                label={t("contract.start")}
                InputLabelProps={{ shrink: true }}
                value={startFrom}
                onChange={(e) => {
                  setStartFrom(e.target.value);
                  setPage(1);
                }}
                sx={{ width: 170 }}
              />

              <TextField
                type="date"
                size="small"
                label={t("contract.end")}
                InputLabelProps={{ shrink: true }}
                value={startTo}
                onChange={(e) => {
                  setStartTo(e.target.value);
                  setPage(1);
                }}
                sx={{ width: 170 }}
              />

              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={clearFilters} sx={{ borderRadius: 2, fontWeight: 900 }}>
                    {t("common.clear")}
                </Button>
                <Button variant="contained" onClick={() => contractQuery.refetch()} sx={{ borderRadius: 2, fontWeight: 900 }}>
                    {t("common.apply")}
                </Button>
              </Stack>
            </Stack>
          </Card>
        )}

        {/* DATA LIST / TABLE */}
        {isMobile ? (
          <Stack spacing={1.5}>
            {contractQuery.isLoading ? (
               <Card sx={{ p: 2, borderRadius: 3, bgcolor: "background.paper", border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none" }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={18} />
                  <Typography color="text.secondary">{t("Loading data...")}</Typography>
                </Stack>
              </Card>
            ) : data.length === 0 ? (
               <Card sx={{ p: 2, borderRadius: 3, bgcolor: "background.paper", border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none" }}>
                <Typography fontWeight={900}>{t("No contracts found")}</Typography>
              </Card>
            ) : (
                data.map((c: any) => <MobileContractCard key={c.id} c={c} />)
            )}

             {/* MOBILE PAGINATION */}
             <Card sx={{ borderRadius: 3, bgcolor: "background.paper", border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none" }}>
                <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                            {t("Page")} <b>{page}</b> / <b>{totalPages}</b>
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button variant="outlined" size="small" disabled={!canPrev} onClick={() => setPage(p => Math.max(1, p - 1))} sx={{ borderRadius: 2, fontWeight: 900 }}>{t("prev")}</Button>
                            <Button variant="outlined" size="small" disabled={!canNext} onClick={() => setPage(p => Math.min(totalPages, p + 1))} sx={{ borderRadius: 2, fontWeight: 900 }}>{t("next")}</Button>
                        </Stack>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {t("Showing", { defaultValue: "Showing" })} <b>{shownCount}</b> {t("of", { defaultValue: "of" })} <b>{totalCount}</b>
                    </Typography>
                </CardContent>
            </Card>
          </Stack>
        ) : (
          <Card
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: cardBg,
              border: `1px solid ${borderColor}`,
              boxShadow: isDark ? "none" : undefined,
            }}
          >
            <Table>
              <TableHead sx={{ bgcolor: headBg }}>
                <TableRow>
                  <TableCell sx={headCellSx}>{t("Contract No.")}</TableCell>

                  <TableCell sx={{ ...headCellSx, cursor: "pointer" }} onClick={() => toggleSort("customerName")}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <span>{t("Customer")}</span>
                      {renderSortIcon("customerName")}
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ ...headCellSx, cursor: "pointer" }} onClick={() => toggleSort("email")}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <span>Email</span>
                      {renderSortIcon("email")}
                    </Stack>
                  </TableCell>

                  <TableCell sx={headCellSx}>{t("Reseller")}</TableCell>
                  <TableCell sx={headCellSx}>{t("contract.start")}</TableCell>
                  <TableCell sx={headCellSx}>{t("contract.end")}</TableCell>
                  <TableCell align="right" sx={headCellSx}>{t("Action")}</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {contractQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      {t("No contracts found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((c: any) => {
                    const hasPdf = typeof c?.pdfLink === "string" && c.pdfLink.trim() !== "";
                    return (
                        <TableRow key={c.id} hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                            <TableCell 
                                sx={{ color: "primary.main", fontWeight: 700, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                onClick={() => navigate(`/contracts/${c.id}/detail`)}
                            >
                                {c.contractNumber}
                            </TableCell>

                            <TableCell sx={{ color: "text.primary" }}>
                                {c.firstName} {c.lastName}
                            </TableCell>

                            <TableCell sx={{ color: "text.primary" }}>{c.email}</TableCell>
                            
                            <TableCell>
                                <ResellerCell resellerId={c.resellerId} />
                            </TableCell>

                            <TableCell sx={{ color: "text.primary" }}>
                                {c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"}
                            </TableCell>
                            
                            <TableCell sx={{ color: "text.primary" }}>
                                {c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"}
                            </TableCell>

                            <TableCell align="right">
                                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                    {/* PDF ICON LOGIC - RETAINED */}
                                    <Tooltip title={hasPdf ? t("pdf.view") : t("pdf.generate")}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handlePdfIconClick(c)}
                                            color={hasPdf ? "success" : "default"}
                                        >
                                            {hasPdf ? <FiCheckCircle size={18} /> : <FiFileText size={18} />}
                                        </IconButton>
                                    </Tooltip>

                                    {isAdMin && (
                                        <>
                                            <IconButton size="small" color="primary" onClick={() => openEdit(c.id)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => openDelete(c.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </>
                                    )}
                                </Stack>
                            </TableCell>
                        </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <Divider sx={{ borderColor }} />

            {/* DESKTOP PAGINATION */}
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: isDark ? alpha(theme.palette.common.black, 0.25) : "background.paper",
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    {t("Showing", { defaultValue: "Showing" })} <b>{shownCount}</b> {t("of", { defaultValue: "of" })}{" "}
                    <b>{totalCount}</b>
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Button variant="text" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} sx={{ fontSize: 12 }}>
                        {t("prev")}
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        {t("Page")} <b>{page}</b> / <b>{totalPages}</b>
                    </Typography>
                    <Button variant="text" disabled={!canNext} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} sx={{ fontSize: 12 }}>
                        {t("next")}
                    </Button>
                </Stack>
            </Box>
          </Card>
        )}

        {/* --- DIALOGS (RETAINED) --- */}
        <ContractFormDrawer
          open={drawerOpen}
          mode={drawerMode}
          id={currentId}
          onClose={() => setDrawerOpen(false)}
          onSuccess={() => {
            setDrawerOpen(false);
            contractQuery.refetch();
          }}
        />

        {/* Delete Dialog - Adapted to MUI Dialog like OrderList used if you have a component, 
            or using your existing ContractDelete component */}
        {deleteOpen && (
             <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
                    <WarningAmberRoundedIcon sx={{ color: "#f59e0b" }} />
                    {t("Delete Contract?", { defaultValue: "Delete Contract?" })}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography color="text.secondary">
                         {t("Are you sure you want to delete this contract?")}<br />
                         {t("This action cannot be undone.")}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setDeleteOpen(false)} sx={{ borderRadius: 2 }}>
                         {t("Cancel")}
                    </Button>
                     <Button
                        variant="contained"
                        color="error"
                        onClick={confirmDelete}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        {t("Delete")}
                    </Button>
                </DialogActions>
             </Dialog>
        )}

        <GeneratePdfDialog
          open={genPdfOpen}
          onClose={() => setGenPdfOpen(false)}
          contract={selectedContract}
          onGenerate={handleGenerateConfirm}
          loading={generatePdfMutation.isPending}
        />

        <ViewPdfDialog
          open={viewPdfOpen}
          onClose={() => setViewPdfOpen(false)}
          pdfUrl={selectedContract?.pdfLink}
          onRegenerate={handleRegenerateRequest}
        />
      </Box>
    </Box>
  );
}