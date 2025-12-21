import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Box,
  Button,
  Typography,
  TextField,
  Stack,
  IconButton,
  MenuItem,
  Paper,
  InputAdornment,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { alpha } from "@mui/material/styles";

import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiSearch,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

import NavMenu from "@/components/NavMenu/NavMenu";

import { useContracts } from "@/hooks/useContracts";
import { useResellers } from "@/hooks/useResellers";
import { useGeneratePdf } from "@/hooks/usePdf";

import toast from "react-hot-toast";

import ContractFormDrawer from "./ContractFormDrawer";
import ContractDelete from "./ContractDelete";
import ResellerCell from "./components/ResellerCell";
import GeneratePdfDialog from "./components/GeneratePdfDialog";
import ViewPdfDialog from "./components/ViewPdfDialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { getUserRole } from "@/lib/authUtils";
import { useNavigate } from "react-router-dom";

const SIDEBAR_OFFSET = 260;

export default function ContractList() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();

  // --- STATES ---
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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

  const { accessToken } = useAuthStore();
  const role = getUserRole(accessToken);
  const isAdMin = role === "Admin";

  const PAGE_SIZE = 10;

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

  const generatePdfMutation = useGeneratePdf();

  // ===== STYLES =====
  const borderColor = alpha(theme.palette.divider, isDark ? 0.35 : 0.8);
  const softBorder = `1px solid ${alpha(theme.palette.divider, isDark ? 0.3 : 0.55)}`;
  const paperShadow = isDark ? "none" : "0 2px 12px rgba(0,0,0,0.06)";

  const rowHoverBg = isDark
    ? alpha(theme.palette.common.white, 0.08)
    : alpha(theme.palette.common.black, 0.04);

  const rowHoverShadow = `inset 0 0 0 1px ${alpha(theme.palette.divider, isDark ? 0.35 : 0.4)}`;
  const iconHoverBg = alpha(theme.palette.action.hover, isDark ? 0.45 : 0.7);

  // --- HANDLERS ---
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

  const pageTitle = useMemo(() => t("contract.management"), [t]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <NavMenu />

      <Box
        sx={{
          flexGrow: 1,
          width: "100%",
          ml: { xs: 0, md: `${SIDEBAR_OFFSET}px` },
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, md: 4 },
          color: "text.primary",
        }}
      >
        {/* HEADER */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} sx={{ lineHeight: 1.15 }}>
              {pageTitle}
            </Typography>
          </Box>

          {isAdMin && (
            <Button
              variant="contained"
              startIcon={<FiPlus />}
              onClick={openCreate}
            >
              {t("contract.create")}
            </Button>
          )}
        </Stack>

        {/* FILTERS */}
        {isMobile ? (
          <Accordion
            elevation={0}
            sx={{
              mb: 2,
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "background.paper",
              border: softBorder,
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack>
                <Typography fontWeight={800}>{t("common.search")}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("common.apply")} / {t("common.clear")}
                </Typography>
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <Stack spacing={1.4}>
                <TextField
                  size="small"
                  placeholder={t("common.search")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FiSearch />
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
                  fullWidth
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
                  size="small"
                  label={t("contract.start")}
                  InputLabelProps={{ shrink: true }}
                  value={startFrom}
                  onChange={(e) => {
                    setStartFrom(e.target.value);
                    setPage(1);
                  }}
                  fullWidth
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
                  fullWidth
                />

                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => contractQuery.refetch()}
                  >
                    {t("common.apply")}
                  </Button>
                  <Button fullWidth variant="outlined" onClick={clearFilters}>
                    {t("common.clear")}
                  </Button>
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ) : (
          <Paper
            sx={{
              p: 3,
              borderRadius: "16px",
              boxShadow: paperShadow,
              mb: 3,
              bgcolor: "background.paper",
              border: `1px solid ${borderColor}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <TextField
                size="small"
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                sx={{ flex: 1, minWidth: 220 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FiSearch />
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
                sx={{ width: 200 }}
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

              <Button variant="contained" onClick={() => contractQuery.refetch()}>
                {t("common.apply")}
              </Button>

              <Button variant="outlined" onClick={clearFilters}>
                {t("common.clear")}
              </Button>
            </Stack>
          </Paper>
        )}

        {/* CONTENT */}
        {contractQuery.isLoading ? (
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: "background.paper",
              border: softBorder,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <CircularProgress size={18} />
            <Typography color="text.secondary">{t("Loading data...")}</Typography>
          </Paper>
        ) : isMobile ? (
          // MOBILE LIST VIEW
          <Stack spacing={1.5} sx={{ width: "100%" }}>
            {data.map((c: any) => {
              const hasPdf = typeof c?.pdfLink === "string" && c.pdfLink.trim() !== "";
              return (
                <Card
                  key={c.id}
                  variant="outlined"
                  sx={{
                    width: "100%",
                    borderRadius: 2.5,
                    borderColor: alpha(theme.palette.divider, 0.6),
                    bgcolor: "background.paper",
                    transition: "background-color .15s ease, box-shadow .15s ease",
                    "&:hover": {
                      bgcolor: rowHoverBg,
                      boxShadow: rowHoverShadow,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          fontWeight={900}
                          sx={{
                            color: "primary.main",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
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

                      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                        <Tooltip title={hasPdf ? t("pdf.view") : t("pdf.generate")}>
                          <IconButton
                            size="small"
                            onClick={() => handlePdfIconClick(c)}
                            sx={{
                              color: hasPdf ? theme.palette.success.main : theme.palette.text.secondary,
                              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                              borderRadius: 2,
                              "&:hover": { bgcolor: iconHoverBg },
                            }}
                          >
                            {hasPdf ? <FiCheckCircle size={16} /> : <FiFileText size={16} />}
                          </IconButton>
                        </Tooltip>

                        {isAdMin && (
                          <>
                            <Tooltip title={t("Edit")}>
                              <IconButton
                                size="small"
                                onClick={() => openEdit(c.id)}
                                sx={{
                                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                                  borderRadius: 2,
                                  "&:hover": { bgcolor: iconHoverBg },
                                }}
                              >
                                <FiEdit size={16} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={t("Delete")}>
                              <IconButton
                                size="small"
                                onClick={() => openDelete(c.id)}
                                sx={{
                                  color: theme.palette.error.main,
                                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                                  borderRadius: 2,
                                  "&:hover": { bgcolor: iconHoverBg },
                                }}
                              >
                                <FiTrash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                          {t("Reseller")}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          <ResellerCell resellerId={c.resellerId} />
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {t("contract.start")}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {t("contract.end")}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}

            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper", border: softBorder }}>
              <Stack spacing={1}>
                <Typography color="text.secondary" textAlign="center">
                  {t("Page")} <b>{page}</b> / <b>{totalPages}</b>
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="outlined" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    {t("prev")}
                  </Button>
                  <Button fullWidth variant="outlined" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    {t("next")}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        ) : (
          // DESKTOP TABLE VIEW
          <Paper
            sx={{
              borderRadius: "16px",
              overflow: "hidden",
              bgcolor: "background.paper",
              border: `1px solid ${borderColor}`,
            }}
          >
            {/* HEADER ROW */}
            <Stack
              direction="row"
              px={2.2}
              py={1.4}
              sx={{
                fontWeight: 700,
                bgcolor: "action.hover",
                borderBottom: `1px solid ${borderColor}`,
                color: "text.secondary",
              }}
            >
              <Box flex={1}>{t("Contract No.")}</Box>

              <Box
                flex={1.4}
                onClick={() => toggleSort("customerName")}
                sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5, userSelect: "none" }}
              >
                {t("Customer")}
                {sortBy === "customerName" ? (sortDesc ? <FiChevronDown /> : <FiChevronUp />) : null}
              </Box>

              <Box
                flex={1.6}
                onClick={() => toggleSort("email")}
                sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5, userSelect: "none" }}
              >
                Email
                {sortBy === "email" ? (sortDesc ? <FiChevronDown /> : <FiChevronUp />) : null}
              </Box>

              <Box flex={1.1}>{t("Reseller")}</Box>
              <Box flex={0.8}>{t("contract.start")}</Box>
              <Box flex={0.8}>{t("contract.end")}</Box>
              <Box width={120} textAlign="center">
                {t("Action")}
              </Box>
            </Stack>

            {/* BODY ROWS */}
            {data.map((c: any) => {
              const hasPdf = typeof c?.pdfLink === "string" && c.pdfLink.trim() !== "";
              return (
                <Stack
                  key={c.id}
                  direction="row"
                  px={2.2}
                  py={1.6}
                  sx={{
                    alignItems: "center",
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
                    bgcolor: "background.paper",

                    transition: "background-color .15s ease, box-shadow .15s ease, border-color .15s ease",
                    "&:hover": {
                      bgcolor: rowHoverBg,
                      boxShadow: rowHoverShadow,
                      borderColor: alpha(theme.palette.divider, isDark ? 0.55 : 0.6),
                    },
                    "&:focus-within": {
                      bgcolor: rowHoverBg,
                      boxShadow: rowHoverShadow,
                    },
                  }}
                >
                  <Box
                    flex={1}
                    fontWeight={700}
                    onClick={() => navigate(`/contracts/${c.id}/detail`)}
                    sx={{
                      color: "primary.main",
                      cursor: "pointer",
                      "&:hover": {
                        textDecoration: "underline",
                        color: "primary.dark",
                      },
                    }}
                  >
                    {c.contractNumber}
                  </Box>

                  <Box flex={1.4}>
                    {c.firstName} {c.lastName}
                  </Box>

                  <Box flex={1.6}>{c.email}</Box>

                  <Box flex={1.1}>
                    <ResellerCell resellerId={c.resellerId} />
                  </Box>

                  <Box flex={0.8}>{c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"}</Box>
                  <Box flex={0.8}>{c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"}</Box>

                  <Stack direction="row" spacing={0.5} width={120} justifyContent="center">
                    <Tooltip title={hasPdf ? t("pdf.view") : t("pdf.generate")}>
                      <IconButton
                        size="small"
                        onClick={() => handlePdfIconClick(c)}
                        sx={{
                          color: hasPdf ? theme.palette.success.main : theme.palette.text.secondary,
                          "&:hover": { bgcolor: iconHoverBg },
                        }}
                      >
                        {hasPdf ? <FiCheckCircle size={18} /> : <FiFileText size={18} />}
                      </IconButton>
                    </Tooltip>

                    {isAdMin && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => openEdit(c.id)}
                          sx={{ color: "text.primary", "&:hover": { bgcolor: iconHoverBg } }}
                        >
                          <FiEdit size={16} />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() => openDelete(c.id)}
                          sx={{ color: theme.palette.error.main, "&:hover": { bgcolor: iconHoverBg } }}
                        >
                          <FiTrash2 size={16} />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </Stack>
              );
            })}

            {/* FOOTER */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              p={2}
              sx={{
                bgcolor: isDark ? alpha(theme.palette.common.black, 0.25) : "background.paper",
                borderTop: `1px solid ${borderColor}`,
              }}
            >
              <Typography color="text.secondary">
                {t("Total")}: {totalCount}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  {t("prev")}
                </Button>

                <Typography color="text.secondary">
                  <b>{page}</b> / <b>{totalPages}</b>
                </Typography>

                <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  {t("next")}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* --- DIALOGS --- */}
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

        <ContractDelete
          open={deleteOpen}
          id={deleteId}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            setDeleteOpen(false);
            contractQuery.refetch();
          }}
        />

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