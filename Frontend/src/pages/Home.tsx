import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import NavMenu from "@/components/NavMenu/NavMenu";
import { useContracts } from "@/hooks/useContracts";
import { useReseller } from "@/hooks/useResellers";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
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

// 👇 FIX: Sử dụng Grid2 để dùng được cú pháp size={{ xs: ..., md: ... }}
import Grid from "@mui/material/Grid";
import { alpha } from "@mui/material/styles";

import {
  Description as ContractIcon,
  Bolt as EnergyIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { useOrders } from "@/hooks/useOrders";

import { FiArrowRight } from "react-icons/fi";

const SIDEBAR_WIDTH = 240;

// ===================== Reseller name =====================
const ResellerCell = ({ resellerId }: { resellerId: number }) => {
  const { t } = useTranslation();
  const { data: reseller, isLoading } = useReseller(resellerId);

  if (!resellerId) return <Typography variant="body2">—</Typography>;

  if (isLoading) {
    return (
      <Typography variant="caption" color="text.secondary">
        {t("Loading")}
      </Typography>
    );
  }

  return <Typography variant="body2">{reseller?.name || "—"}</Typography>;
};

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // <600

  const D = theme.transitions.duration.standard as number;
  const E = "ease";

  const contractQuery = useContracts({ pageNumber: 1, pageSize: 100 });
  const contracts = Array.isArray(contractQuery.data?.items) ? contractQuery.data.items : [];
  const orderQuery = useOrders({ pageNumber: 1, pageSize: 1 });
  const isLoading = contractQuery.isLoading || orderQuery.isLoading;

  const stats = useMemo(() => {
    const now = new Date();
    let activeCount = 0;

    contracts.forEach((c: any) => {
      if (c?.endDate && new Date(c.endDate) > now) activeCount++;
    });




    return {
      totalContracts: contractQuery.data?.totalCount ?? 0,
      active: activeCount,
      expired: contracts.length - activeCount,

    };
  }, [contracts, contractQuery.data, orderQuery.data]);

  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    pageNumber: 1,
    pageSize: 1,
    sortBy: "id",
    sortDesc: true,
  });
  const totalOrders = ordersData?.totalCount;

  const recentContracts = useMemo(() => contracts.slice(0, 5), [contracts]);

  const heroDarkGradient = `linear-gradient(135deg,
    ${alpha(theme.palette.primary.main, 0.18)} 0%,
    ${alpha(theme.palette.background.paper, 0.92)} 100%)`;

  const heroLightGradient = `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`;

  const heroTextColor = isDark ? theme.palette.text.primary : theme.palette.common.white;

  const softBorder = `1px solid ${alpha(theme.palette.divider, 0.55)}`;

  const iconBox = (color: "primary" | "success" | "error") => ({
    p: { xs: 0.75, md: 1.5 },
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

  // ===================== StatCard Component =====================
  // Đã tái sử dụng component này bên trong Grid để code gọn hơn
  const StatCard = ({
    icon,
    title,
    value,
    bottom,
    iconColor = "primary",
  }: {
    icon: React.ReactNode;
    title: string;
    value: React.ReactNode;
    bottom: React.ReactNode;
    iconColor?: "primary" | "success" | "error";
  }) => (
    <Card
      sx={{
        borderRadius: 3,
        height: "100%",
        bgcolor: "background.paper",
        minWidth: 0,
        border: softBorder,
        overflow: "hidden",
      }}
    >
      <CardContent
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          p: { xs: 1.5, md: 2.5 },
          minHeight: { xs: 140, sm: 155, md: 200 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
          <Box sx={iconBox(iconColor)}>
            {icon}
          </Box>
          <Typography
            fontWeight={800}
            color="text.secondary"
            noWrap
            sx={{ fontSize: { xs: "0.75rem", md: "1rem" }, minWidth: 0 }}
          >
            {title}
          </Typography>
        </Stack>

        <Typography
          sx={{
            fontWeight: 900,
            fontSize: { xs: "1.6rem", md: "3rem" },
            mt: 0.5,
            lineHeight: 1.05,
          }}
        >
          {value}
        </Typography>

        <Box sx={{ mt: "auto", pt: 1.25 }}>{bottom}</Box>
      </CardContent>
    </Card>
  );

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
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          minHeight: "100vh",
          ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          p: { xs: 2, md: 3 },
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
              border: softBorder,
              transition: `border-color ${D}ms ${E}, color ${D}ms ${E}`,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 2,

              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: heroDarkGradient,
                opacity: isDark ? 1 : 0,
                transition: `opacity ${D}ms ${E}`,
                pointerEvents: "none",
              },
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
                  fontSize: { xs: "1.45rem", md: "2.125rem" },
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

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ position: "relative", zIndex: 1 }}>
              <Button
                variant="contained"
                onClick={() => navigate("/contracts/list")}
                endIcon={<FiArrowRight />}
                sx={{
                  fontWeight: 900,
                  borderRadius: 2,
                  py: { xs: 1.1, sm: 1 },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {t("View All")}
              </Button>
            </Stack>
          </Paper>

          {/* ================= STATS ================= */}
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1.25 }}>
            📊 {t("Dashboard Overview")}
          </Typography>

          {/* FIX GRID: Sử dụng Grid2 với container và size */}
          <Grid container spacing={{ xs: 1.25, md: 3 }} sx={{ mb: { xs: 2.5, md: 4 } }}>
            {/* Card 1: Total Contracts */}
            <Grid size={{ xs: 4, sm: 6, md: 6 }}>
              <StatCard
                icon={<ContractIcon />}
                title={t("Total Contracts")}
                value={isLoading ? "-" : stats.totalContracts}
                iconColor="primary"
                bottom={
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75}>
                    <Chip
                      label={`${stats.active} ${t("Active")}`}
                      size="small"
                      color="success"
                      variant={isDark ? "outlined" : "filled"}
                      sx={{
                        width: "100%",
                        fontWeight: 900,
                        height: { xs: 20, sm: 22, md: 32 },
                        "& .MuiChip-label": {
                          px: { xs: 0.5, sm: 0.75, md: 1.5 },
                          fontSize: { xs: "0.62rem", sm: "0.7rem", md: "0.875rem" },
                        },
                      }}
                    />
                    <Chip
                      label={`${stats.expired} ${t("Expired")}`}
                      size="small"
                      color="error"
                      variant={isDark ? "outlined" : "filled"}
                      sx={{
                        width: "100%",
                        fontWeight: 900,
                        height: { xs: 20, sm: 22, md: 32 },
                        "& .MuiChip-label": {
                          px: { xs: 0.5, sm: 0.75, md: 1.5 },
                          fontSize: { xs: "0.62rem", sm: "0.7rem", md: "0.875rem" },
                        },
                      }}
                    />
                  </Stack>
                }
              />
            </Grid>

            {/* Card 2: Total Orders */}
            <Grid size={{ xs: 4, sm: 6, md: 3 }}>
              <StatCard
                icon={<EnergyIcon />}
                title={t("Total Orders")}
                value={(isLoading || ordersLoading) ? "-" : (totalOrders ?? "N/A")}
                bottom={
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.72rem", md: "0.875rem" } }}>
                    {t("Gas & Electricity combined")}
                  </Typography>
                }
              />
            </Grid>

            {/* Card 3: Requires Renewal */}
            <Grid size={{ xs: 4, sm: 6, md: 3 }}>
              <StatCard
                icon={<TimeIcon />}
                title={t("Requires Renewal")}
                value={isLoading ? "-" : stats.expired}
                iconColor="error"
                bottom={
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.72rem", md: "0.875rem" } }}>
                    {stats.expired === 0 ? `✅ ${t("All active")}` : `⚠️ ${t("Need Action")}`}
                  </Typography>
                }
              />
            </Grid>
          </Grid>

          {/* ================= RECENT ================= */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="h6" fontWeight={900}>
              📄 {t("Recent Contracts")}
            </Typography>

            <Button endIcon={<FiArrowRight />} onClick={() => navigate("/contracts/list")} sx={{ fontWeight: 800 }}>
              {t("View All")}
            </Button>
          </Stack>

          {/* ===== MOBILE: CARD LIST ===== */}
          {isMobile ? (
            <Stack spacing={1.5}>
              {isLoading ? (
                <Paper
                  sx={{
                    p: 2,
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
              ) : recentContracts.length === 0 ? (
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper", border: softBorder }}>
                  <Typography fontWeight={900}>📭 {t("No contracts found")}</Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 1.5, borderRadius: 2, fontWeight: 900 }}
                    onClick={() => navigate("/contracts/list")}
                  >
                    {t("Create First Contract")}
                  </Button>
                </Paper>
              ) : (
                recentContracts.map((c: any) => {
                  const active = c?.endDate && new Date(c.endDate) > new Date();

                  return (
                    <Card
                      key={c.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        borderColor: alpha(theme.palette.divider, 0.6),
                        bgcolor: "background.paper",
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={900} sx={{ color: "primary.main" }} noWrap>
                              {c.contractNumber}
                            </Typography>
                            <Typography fontWeight={800} noWrap sx={{ mt: 0.25 }}>
                              {c.firstName} {c.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {c.email}
                            </Typography>
                          </Box>

                          <Stack alignItems="flex-end" spacing={0.75} sx={{ flexShrink: 0 }}>
                            <Chip
                              label={active ? t("Active") : t("Expired")}
                              color={active ? "success" : "error"}
                              size="small"
                              variant={active ? "filled" : "outlined"}
                              sx={{ fontWeight: 900 }}
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: 2, fontWeight: 900 }}
                              onClick={() => navigate(`/contracts/${c.id}/detail`)}
                            >
                              {t("Details")}
                            </Button>
                          </Stack>
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />

                        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary">
                              {t("Reseller")}
                            </Typography>
                            <Typography variant="body2" fontWeight={800}>
                              <ResellerCell resellerId={c.resellerId} />
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="caption" color="text.secondary">
                              {t("Duration")}
                            </Typography>
                            <Typography variant="body2" fontWeight={800} noWrap>
                              {c.startDate ? new Date(c.startDate).toLocaleDateString("vi-VN") : "—"} →{" "}
                              {c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "—"}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Stack>
          ) : (
            /* ===== DESKTOP: TABLE ===== */
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 3,
                bgcolor: "background.paper",
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                overflowX: "auto",
                transition: `background-color ${D}ms ${E}, border-color ${D}ms ${E}`,
                "&::-webkit-scrollbar": { height: 6 },
              }}
            >
              <Table
                size="medium"
                sx={{
                  minWidth: 760,
                  "& th, & td": {
                    px: 2,
                    py: 1.25,
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
                        <Button
                          variant="contained"
                          sx={{ mt: 2, fontWeight: 900 }}
                          onClick={() => navigate("/contracts/list")}
                        >
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
                          sx={{ "&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.6) } }}
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
          )}

          <Box sx={{ height: 24 }} />
        </Container>
      </Box>
    </Box>
  );
}