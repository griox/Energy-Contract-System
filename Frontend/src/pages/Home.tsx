import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useContracts } from "@/hooks/useContracts";
import { useReseller } from "@/hooks/useResellers"; // 1. Import hook lấy chi tiết Reseller
import NavMenu from "@/components/NavMenu/NavMenu";

// MUI Components
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme
} from "@mui/material";

// Icons
import {
  Add as AddIcon,
  Description as ContractIcon,
  Bolt as EnergyIcon,
  AccessTime as TimeIcon,
  ArrowForward as ArrowForwardIcon
} from "@mui/icons-material";

// 2. Component con để fetch và hiển thị tên Reseller
// Tách ra để có thể dùng Hook useReseller hợp lệ
const ResellerCell = ({ resellerId }: { resellerId: number }) => {
  const { data: reseller, isLoading } = useReseller(resellerId);

  if (isLoading) return <Typography variant="caption" color="text.secondary">Loading...</Typography>;
  return <Typography variant="body2">{reseller?.name || "—"}</Typography>;
};

export default function Home() {
  const navigate = useNavigate();
  const theme = useTheme();

  // ===================== FETCH DATA (React Query) =====================
  const { data, isLoading } = useContracts({ pageNumber: 1, pageSize: 100 });
  const contracts = Array.isArray(data?.items) ? data.items : [];

  // ===================== CALCULATIONS (useMemo) =====================
  const stats = useMemo(() => {
    const now = new Date();
    let activeCount = 0;

    contracts.forEach((c) => {
      if (c.endDate && new Date(c.endDate) > now) {
        activeCount++;
      }
    });

    return {
      total: contracts.length,
      active: activeCount,
      expired: contracts.length - activeCount,
      totalOrders: 0
    };
  }, [contracts]);

  // ===================== UI RENDER ======================
  return (
    <Box sx={{ display: "flex" }}>
      <NavMenu />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f5f7fa",
          minHeight: "100vh",
          ml: { xs: 0, md: "260px" },
          p: 3,
        }}
      >
        <Container maxWidth="xl">

          {/* ================= HERO SECTION ================= */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 3,
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              color: "white",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                ⚡ Energy Contract Manager
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 600 }}>
                Manage all your energy contracts, track expirations, and monitor orders in one centralized platform.
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate("/contracts/list")}
                sx={{ bgcolor: "#3b82f6", fontWeight: 1200 }}
              >
                New Contract
              </Button>
            </Stack>
          </Paper>

          {/* ================= DASHBOARD STATS ================= */}
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: "text.primary" }}>
            📊 Dashboard Overview
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* CARD 1: TOTAL CONTRACTS */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ borderRadius: 2, height: "100%" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#eff6ff", color: "#3b82f6" }}>
                      <ContractIcon />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      Total Contracts
                    </Typography>
                  </Stack>
                  <Typography variant="h3" fontWeight={700} color="text.primary">
                    {isLoading ? "-" : stats.total}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={2}>
                    <Chip
                      label={`${stats.active} Active`}
                      size="small"
                      color="success"
                      variant="filled"
                      sx={{ bgcolor: "#dcfce7", color: "#166534" }}
                    />
                    {stats.expired > 0 && (
                      <Chip
                        label={`${stats.expired} Expired`}
                        size="small"
                        color="error"
                        variant="filled"
                        sx={{ bgcolor: "#fee2e2", color: "#991b1b" }}
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* CARD 2: TOTAL ORDERS */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 2, height: "100%" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f0fdf4", color: "#22c55e" }}>
                      <EnergyIcon />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      Total Orders
                    </Typography>
                  </Stack>
                  <Typography variant="h3" fontWeight={700} color="text.primary">
                    {isLoading ? "-" : "N/A"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Gas & Electricity combined
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* CARD 3: RENEWALS */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 2, height: "100%" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#fef2f2", color: "#ef4444" }}>
                      <TimeIcon />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      Requires Renewal
                    </Typography>
                  </Stack>
                  <Typography variant="h3" fontWeight={700} color="text.primary">
                    {isLoading ? "-" : stats.expired}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {stats.expired === 0 ? "✅ All contracts are active" : "⚠️ Action needed for expired contracts"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ================= RECENT CONTRACTS TABLE ================= */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={700}>
              📄 Recent Contracts
            </Typography>
            <Button
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/contracts/list")}
            >
              View All
            </Button>
          </Stack>

          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: theme.shadows[1] }}>
            <Table>
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Contract No.</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reseller</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary" mt={1}>Loading data...</Typography>
                    </TableCell>
                  </TableRow>
                ) : contracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography variant="h6" color="text.secondary">📭 No contracts found</Typography>
                      <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/contracts/create")}>
                        Create First Contract
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts.slice(0, 5).map((c) => {
                    const isActive = c.endDate && new Date(c.endDate) > new Date();

                    return (
                      <TableRow key={c.id} hover>
                        <TableCell>
                          <Typography fontWeight={600} color="primary.main">
                            {c.contractNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{c.firstName} {c.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                        </TableCell>

                        {/* 3. Sử dụng Component con để hiển thị Reseller */}
                        <TableCell>
                          <ResellerCell resellerId={c.resellerId} />
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {new Date(c.startDate).toLocaleDateString("vi-VN")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            to {c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isActive ? "Active" : "Expired"}
                            color={isActive ? "success" : "error"}
                            size="small"
                            variant={isActive ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => navigate(`/contracts/${c.id}/detail`)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </Container>
      </Box>
    </Box>
  );
}
