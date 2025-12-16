import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import NavMenu from "@/components/NavMenu/NavMenu";
import { useContracts } from "@/hooks/useContracts";
import { useReseller } from "@/hooks/useResellers";
import { useTranslation } from "react-i18next";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import Grid from "@mui/material/Grid";
import { alpha } from "@mui/material/styles";

import {
  Add as AddIcon,
  Description as ContractIcon,
  Bolt as EnergyIcon,
  AccessTime as TimeIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useOrders } from "@/hooks/useOrders";

// ===================== Component con: Reseller name =====================
const ResellerCell = ({ resellerId }: { resellerId: number }) => {
  const { t } = useTranslation();
  const { data: reseller, isLoading } = useReseller(resellerId);

  if (!resellerId) return <Typography variant="body2">—</Typography>;

  if (isLoading)
    return (
      <Typography variant="caption" color="text.secondary">
        {t("Loading")}
      </Typography>
    );

  return <Typography variant="body2">{reseller?.name || "—"}</Typography>;
};

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // <=600px

  const D = theme.transitions.duration.standard as number; // đồng bộ tốc độ theme
  const E = "ease";

  const contractQuery = useContracts({ pageNumber: 1, pageSize: 100 });
  const contracts = Array.isArray(contractQuery.data?.items) ? contractQuery.data.items : [];
  const orderQuery = useOrders({ pageNumber: 1, pageSize: 1 });
  const isLoading = contractQuery.isLoading || orderQuery.isLoading;
 const stats = useMemo(() => {
    const now = new Date();
    let activeCount = 0;

    contracts.forEach((c: any) => {
      // Chỉ tính toán Active/Expired dựa trên Contract
      if (c?.endDate && new Date(c.endDate) > now) activeCount++;
    });

    return {
      totalContracts: contractQuery.data?.totalCount ?? 0, // Lấy từ API Contract
      active: activeCount,
      expired: (contractQuery.data?.totalCount ?? 0) - activeCount, // Tính tương đối hoặc đếm thủ công tùy logic
      
      // 👇 Lấy trực tiếp từ API Order, chính xác tuyệt đối cho cả Admin & User
      totalOrders: orderQuery.data?.totalCount ?? 0, 
    };
  }, [contracts, contractQuery.data, orderQuery.data]);

  const recentContracts = useMemo(() => contracts.slice(0, 5), [contracts]);

  // ✅ HERO gradient: dùng opacity để chuyển mượt (không snap)
  const heroDarkGradient = `linear-gradient(135deg,
    ${alpha(theme.palette.primary.main, 0.18)} 0%,
    ${alpha(theme.palette.background.paper, 0.92)} 100%)`;

  const heroLightGradient = `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`;

  const heroTextColor = isDark ? theme.palette.text.primary : theme.palette.common.white;

  const iconBox = (color: "primary" | "success" | "error") => ({
    p: { xs: 1, md: 1.5 },
    borderRadius: 2,
    bgcolor: alpha(theme.palette[color].main, isDark ? 0.16 : 0.12),
    color: theme.palette[color].main,
    border: `1px solid ${alpha(theme.palette[color].main, 0.25)}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: `background-color ${D}ms ${E}, color ${D}ms ${E}, border-color ${D}ms ${E}`,
  });

  return (
    <Box sx={{ display: "flex" }}>
      <NavMenu />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          ml: { xs: 0, md: "240px" }, // ✅ mobile không chừa chỗ sidebar
          p: { xs: 1.5, sm: 2, md: 3 }, // ✅ padding mobile gọn
          bgcolor: "background.default",
          color: "text.primary",
          transition: `background-color ${D}ms ${E}, color ${D}ms ${E}`,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 0 } }}>
          {/* ================= HERO ================= */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.25, md: 4 },
              mb: { xs: 2.5, md: 4 },
              borderRadius: 3,
              position: "relative",
              overflow: "hidden",
              color: heroTextColor,

              border: "1px solid",
              borderColor: alpha(theme.palette.divider, isDark ? 0.35 : 0.12),
              transition: `border-color ${D}ms ${E}, color ${D}ms ${E}`,

              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 2,

              // layer dark
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: heroDarkGradient,
                opacity: isDark ? 1 : 0,
                transition: `opacity ${D}ms ${E}`,
                pointerEvents: "none",
              },
              // layer light
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: heroLightGradient,
                opacity: isDark ? 0 : 1,
                transition: `opacity ${D}ms ${E}`,
                pointerEvents: "none",
              },
            }}
          >
            <Box sx={{ minWidth: 0, position: "relative", zIndex: 1 }}>
              <Typography
                variant="h4"
                fontWeight={900}
                gutterBottom
                sx={{
                  fontSize: { xs: "1.55rem", md: "2.125rem" },
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                ⚡ {t("Energy Contract Manager")}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  opacity: 0.85,
                  maxWidth: 650,
                  fontSize: { xs: "0.9rem", md: "1rem" },
                }}
              >
                {t("Hero Description")}
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.25}
              sx={{ position: "relative", zIndex: 1 }}
            >
            </Stack>
          </Paper>

          {/* ================= STATS ================= */}
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
            📊 {t("Dashboard Overview")}
          </Typography>

          <Grid container spacing={{ xs: 1.25, md: 3 }} sx={{ mb: { xs: 2.5, md: 4 } }}>
            {/* mobile: 3 ô 1 hàng => xs=4 */}
            <Grid size={{ xs: 4, sm: 6, md: 6 }}>
              <Card sx={{ borderRadius: 3, height: "100%", bgcolor: "background.paper", minWidth: 0 }}>
                <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.25} mb={1.25} sx={{ minWidth: 0 }}>
                    <Box sx={iconBox("primary")}>
                      <ContractIcon />
                    </Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.75rem", md: "1rem" }, minWidth: 0 }}
                      noWrap
                    >
                      {t("Total Contracts")}
                    </Typography>
                  </Stack>

                  <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "3rem" } }}>
                    {isLoading ? "-" : stats.totalContracts}
                  </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} mt={1.25}>
                    <Chip
                      label={`${stats.active} ${t("Active")}`}
                      size="small"
                      color="success"
                      variant={isDark ? "outlined" : "filled"}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    />
                    <Chip
                      label={`${stats.expired} ${t("Expired")}`}
                      size="small"
                      color="error"
                      variant={isDark ? "outlined" : "filled"}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 4, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 3, height: "100%", bgcolor: "background.paper", minWidth: 0 }}>
                <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.25} mb={1.25} sx={{ minWidth: 0 }}>
                    <Box sx={iconBox("success")}>
                      <EnergyIcon />
                    </Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.75rem", md: "1rem" }, minWidth: 0 }}
                      noWrap
                    >
                      {t("Total Orders")}
                    </Typography>
                  </Stack>

                  <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "3rem" } }}>
                    {isLoading ? "-" : stats.totalOrders}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" mt={0.75} sx={{ fontSize: { xs: "0.72rem", md: "0.875rem" } }}>
                    {t("Gas & Electricity combined")}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

           <Grid size={{ xs: 4, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 3, height: "100%", bgcolor: "background.paper", minWidth: 0 }}>
                <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.25} mb={1.25} sx={{ minWidth: 0 }}>
                    <Box sx={iconBox("error")}>
                      <TimeIcon />
                    </Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.75rem", md: "1rem" }, minWidth: 0 }}
                      noWrap
                    >
                      {t("Requires Renewal")}
                    </Typography>
                  </Stack>

                  <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "3rem" } }}>
                    {isLoading ? "-" : stats.expired}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" mt={0.75} sx={{ fontSize: { xs: "0.72rem", md: "0.875rem" } }}>
                    {stats.expired === 0 ? `✅ ${t("All active")}` : `⚠️ ${t("Need Action")}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ================= RECENT TABLE ================= */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="h6" fontWeight={900}>
              📄 {t("Recent Contracts")}
            </Typography>
            <Button endIcon={<ArrowForwardIcon />} onClick={() => navigate("/contracts/list")}>
              {t("View All")}
            </Button>
          </Stack>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 3,
              bgcolor: "background.paper",
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              boxShadow: "none",
              overflowX: "auto", // ✅ mobile kéo ngang
              transition: `background-color ${D}ms ${E}, border-color ${D}ms ${E}`,
              "&::-webkit-scrollbar": { height: 6 },
            }}
          >
            <Table
              size={isMobile ? "small" : "medium"}
              sx={{
                minWidth: 760, // ✅ để mobile cuộn ngang (khỏi bể layout)
                "& th, & td": {
                  px: { xs: 1, md: 2 },
                  py: { xs: 0.75, md: 1.25 },
                  fontSize: { xs: "0.78rem", md: "0.875rem" },
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>{t("Contract No.")}</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>{t("Customer")}</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>{t("Reseller")}</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>{t("Duration")}</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>{t("Status")}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>
                    {t("Action")}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        {t("Loading data...")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : recentContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography variant="h6" color="text.secondary">
                        📭 {t("No contracts found")}
                      </Typography>
                      <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/contracts/create")}>
                        {t("Create First Contract")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentContracts.map((c: any) => {
                    const active = c?.endDate && new Date(c.endDate) > new Date();

                    return (
                      <TableRow
                        key={c.id}
                        hover
                        sx={{
                          "&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.6) },
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight={900} color="primary.main" noWrap>
                            {c.contractNumber}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" fontWeight={800} noWrap>
                            {c.firstName} {c.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {c.email}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <ResellerCell resellerId={c.resellerId} />
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {c.startDate ? new Date(c.startDate).toLocaleDateString("vi-VN") : "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {t("common.to")}{" "}
                            {c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "N/A"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={active ? t("Active") : t("Expired")}
                            color={active ? "success" : "error"}
                            size="small"
                            variant={active ? "filled" : "outlined"}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Button size="small" onClick={() => navigate(`/contracts/${c.id}/detail`)}>
                            {t("Details")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ height: 24 }} />
        </Container>
      </Box>
    </Box>
  );
}
