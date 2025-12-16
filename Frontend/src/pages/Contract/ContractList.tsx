import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
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

export default function ContractList() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { t } = useTranslation();

  // --- STATES ---
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // PDF Dialog States
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

  // Queries
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

  const generatePdfMutation = useGeneratePdf();

  // ===== THEME STYLES (NO HARDCODE) =====
  const borderColor = alpha(theme.palette.divider, 0.8);
  const paperShadow = isDark ? "none" : "0 2px 12px rgba(0,0,0,0.06)";

  // --- HANDLERS ---

  // click icon PDF
  const handlePdfIconClick = (c: any) => {
    setSelectedContract(c);

    const hasPdf = typeof c?.pdfLink === "string" && c.pdfLink.trim() !== "";
    if (hasPdf) setViewPdfOpen(true);
    else setGenPdfOpen(true);
  };

  // từ view -> mở generate
  const handleRegenerateRequest = () => {
    setViewPdfOpen(false);
    setGenPdfOpen(true);
  };

  // generate pdf
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
        toast.success("PDF generated successfully!");
        setGenPdfOpen(false);
        contractQuery.refetch();
      },
      onError: (error: any) => {
        console.error(error);
        toast.error("Failed to generate PDF. Please try again.");
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

  return (
    <Box sx={{ display: "flex" }}>
      <NavMenu />

      <Box
        sx={{
          flexGrow: 1,
          ml: { xs: 0, md: "260px" },
          p: 4,
          bgcolor: "background.default",
          minHeight: "100vh",
          color: "text.primary",
        }}
      >
        <Typography variant="h4" fontWeight={800} mb={3} color="text.primary">
          {t("contract.management")}
        </Typography>

        {/* FILTER BAR */}
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

            <Button
              variant="outlined"
              onClick={() => {
                setSearch("");
                setResellerId("");
                setStartFrom("");
                setStartTo("");
                setPage(1);
                contractQuery.refetch();
              }}
            >
              {t("common.clear")}
            </Button>
              {isAdMin &&(
                <Button
              variant="contained"
              startIcon={<FiPlus />}
              onClick={() => {
                setDrawerMode("create");
                setCurrentId(null);
                setDrawerOpen(true);
              }}
            >
              {t("contract.create")}
            </Button>
              )}
          </Stack>
        </Paper>

        {/* TABLE */}
        <Paper
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            bgcolor: "background.paper",
            border: `1px solid ${borderColor}`,
          }}
        >
          {/* HEADER */}
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
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                userSelect: "none",
              }}
            >
              {t("Customer")}
              {sortBy === "customerName" ? (sortDesc ? <FiChevronDown /> : <FiChevronUp />) : null}
            </Box>

            <Box
              flex={1.6}
              onClick={() => toggleSort("email")}
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                userSelect: "none",
              }}
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

          {/* ROWS */}
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
                  "&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.6) },
                }}
              >
                <Box 
                  flex={1} 
                  fontWeight={700} 
                  onClick={() => navigate(`/contracts/${c.id}/detail`)} // 1. Thêm sự kiện click chuyển trang
                  sx={{ 
                    color: "primary.main",
                    cursor: "pointer", // 2. Đổi con trỏ chuột thành hình bàn tay
                    "&:hover": {       // 3. Thêm hiệu ứng gạch chân khi di chuột vào
                      textDecoration: "underline",
                      color: "primary.dark"
                    }
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
                  {/* PDF ICON */}
                  <Tooltip title={hasPdf ? t("pdf.view") : t("pdf.generate")}>
                    <IconButton
                      size="small"
                      onClick={() => handlePdfIconClick(c)}
                      sx={{
                        color: hasPdf ? theme.palette.success.main : theme.palette.text.secondary,
                        "&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.5) },
                      }}
                    >
                      {hasPdf ? <FiCheckCircle size={18} /> : <FiFileText size={18} />}
                    </IconButton>
                  </Tooltip>
                    {isAdMin &&(
                      <>
                      <IconButton
                    size="small"
                    onClick={() => {
                      setDrawerMode("edit");
                      setCurrentId(c.id);
                      setDrawerOpen(true);
                    }}
                    sx={{ color: "text.primary" }}
                  >
                    <FiEdit size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setDeleteId(c.id);
                      setDeleteOpen(true);
                    }}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <FiTrash2 size={16} />
                  </IconButton>
                  </>
                    )}
                </Stack>
              </Stack>
            );
          })}

          {/* Pagination */}
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
              Total: {contractQuery.data?.totalCount ?? 0}
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
