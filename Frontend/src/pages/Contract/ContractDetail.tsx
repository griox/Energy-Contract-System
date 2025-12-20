import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
  Avatar,
  Paper,
  Container,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { alpha } from "@mui/material/styles";

import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

// Icons
import {
  FiArrowLeft,
  FiFileText,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiCheckCircle,
  FiShoppingBag,
} from "react-icons/fi";

// Hooks & Components
import { useContract } from "@/hooks/useContracts";
import { useGeneratePdf } from "@/hooks/usePdf";
import { useReseller } from "@/hooks/useResellers";
import { useAddress } from "@/hooks/useAddresses";

import GeneratePdfDialog from "./components/GeneratePdfDialog";
import ViewPdfDialog from "./components/ViewPdfDialog";

export default function ContractDetail() {
  const theme = useTheme();
  const { t } = useTranslation();

  const { id } = useParams();
  const contractId = useMemo(() => Number(id), [id]);
  const isInvalidId = !id || Number.isNaN(contractId) || contractId <= 0;

  const navigate = useNavigate();

  const [genPdfOpen, setGenPdfOpen] = useState(false);
  const [viewPdfOpen, setViewPdfOpen] = useState(false);

  const {
    data: contract,
    isLoading: isLoadingContract,
    refetch,
  } = useContract(contractId);

  const { data: addressData, isLoading: isLoadingAddress } = useAddress(contract?.addressId ?? 0);
  const { data: reseller, isLoading: isLoadingReseller } = useReseller(contract?.resellerId ?? 0);

  const generatePdfMutation = useGeneratePdf();

  const hasPdf = !!contract?.pdfLink?.trim();

  const borderColor = alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.28 : 0.6);
  const softBorder = `1px solid ${borderColor}`;

  const handlePdfAction = () => {
    if (contract?.pdfLink && contract.pdfLink.trim() !== "") setViewPdfOpen(true);
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
      companyName: c.companyName || "",
      startDate: c.startDate,
      endDate: c.endDate,
      bankAccountNumber: c.bankAccountNumber || "",
      addressLine: addressData?.houseNumber || "",
      totalAmount: 0,
      currency: "VND",
      templateName,
      currentPdfUrl: c.pdfLink,
    };

    generatePdfMutation.mutate(pdfRequest as any, {
      onSuccess: () => {
        toast.success(t("contractDetail.toast.pdfGenerated"));
        setGenPdfOpen(false);
        refetch();
      },
      onError: (error: any) => {
        console.error(error);
        toast.error(t("contractDetail.toast.pdfGenerateFailed"));
      },
    });
  };

  if (isInvalidId) {
    return (
      <Box p={4}>
        <Typography color="error">{t("contractDetail.invalidId")}</Typography>
      </Box>
    );
  }

  if (isLoadingContract) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Typography>{t("contractDetail.loadingContractDetails")}</Typography>
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box p={4}>
        <Typography color="error">{t("contractDetail.contractNotFound")}</Typography>
      </Box>
    );
  }

  const createdDate =
    (contract as any)?.createdAt ? new Date((contract as any).createdAt).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 4 }}>
      {/* HEADER */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", px: 4, py: 2 }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              startIcon={<FiArrowLeft />}
              onClick={() => navigate(-1)}
              color="inherit"
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              {t("contractDetail.backToList")}
            </Button>

            <Box flex={1} />

            <Chip
              avatar={
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.25 : 0.18),
                    color: "primary.main",
                    fontWeight: 700,
                  }}
                >
                  R
                </Avatar>
              }
              label={isLoadingReseller ? t("contractDetail.loading") : reseller?.name || t("contractDetail.unknownReseller")}
              variant="outlined"
              sx={{
                fontWeight: 600,
                borderColor,
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.4 : 0),
              }}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            mt={2}
            mb={1}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {t("contractDetail.contractTitle", { number: contract.contractNumber })}
              </Typography>

              <Stack direction="row" spacing={1} mt={1} alignItems="center">
                <Chip
                  label={hasPdf ? t("contractDetail.pdfReady") : t("contractDetail.draft")}
                  color={hasPdf ? "success" : "default"}
                  size="small"
                  icon={hasPdf ? <FiCheckCircle /> : undefined}
                />
                <Typography variant="body2" color="text.secondary">
                  {t("contractDetail.createdOn", { date: createdDate })}
                </Typography>
              </Stack>
            </Box>

            <Box flex={1} />

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color={hasPdf ? "success" : "primary"}
                startIcon={<FiFileText />}
                onClick={handlePdfAction}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  boxShadow: theme.palette.mode === "dark" ? 0 : 2,
                }}
              >
                {hasPdf ? t("contractDetail.viewDownloadPdf") : t("contractDetail.generatePdf")}
              </Button>

              <Button
                variant="outlined"
                startIcon={<FiShoppingBag />}
                onClick={() => navigate(`/orders?contractId=${contract.id}`)}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  borderColor,
                  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.6 : 1),
                }}
              >
                {t("contractDetail.viewOrders")}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* MAIN */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* LEFT */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: softBorder,
                height: "100%",
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.12),
                    color: "primary.main",
                  }}
                >
                  <FiUser />
                </Avatar>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  {t("contractDetail.customerInformation")}
                </Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem icon={<FiUser />} label={t("contractDetail.fullName")} value={`${contract.firstName} ${contract.lastName}`} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem icon={<FiBriefcase />} label={t("contractDetail.company")} value={contract.companyName || t("contractDetail.na")} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem icon={<FiMail />} label={t("contractDetail.emailAddress")} value={contract.email} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem icon={<FiPhone />} label={t("contractDetail.phoneNumber")} value={contract.phone} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem icon={<FiCreditCard />} label={t("contractDetail.bankAccount")} value={contract.bankAccountNumber || t("contractDetail.na")} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem
                    icon={<FiBriefcase />}
                    label={t("contractDetail.taxIdAddress")}
                    value={isLoadingAddress ? t("contractDetail.loading") : addressData?.houseNumber || t("contractDetail.na")}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* RIGHT */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: softBorder,
                height: "100%",
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.22 : 0.12),
                    color: "warning.main",
                  }}
                >
                  <FiCalendar />
                </Avatar>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  {t("contractDetail.contractTerms")}
                </Typography>
              </Stack>

              <Stack spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                    {t("contractDetail.validityPeriod")}
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.06 : 0.05),
                        borderRadius: 1,
                      }}
                    >
                      <FiCalendar size={18} />
                    </Box>

                    <Box>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : t("contractDetail.na")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("contractDetail.startDate")}
                      </Typography>
                    </Box>

                    <Typography color="text.secondary">-</Typography>

                    <Box>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : t("contractDetail.na")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("contractDetail.endDate")}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                    {t("contractDetail.financials")}
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" mt={1}>
                    <Typography color="text.secondary">{t("contractDetail.currency")}</Typography>
                    <Typography fontWeight={700} color="text.primary">
                      VND
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" mt={1}>
                    <Typography color="text.secondary">{t("contractDetail.totalValue")}</Typography>
                    <Typography fontWeight={800} color="primary.main">
                      ---
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* DIALOGS */}
      <GeneratePdfDialog
        open={genPdfOpen}
        onClose={() => setGenPdfOpen(false)}
        contract={contract}
        onGenerate={handleGenerateConfirm}
        loading={generatePdfMutation.isPending}
      />

      <ViewPdfDialog
        open={viewPdfOpen}
        onClose={() => setViewPdfOpen(false)}
        pdfUrl={contract.pdfLink}
        onRegenerate={handleRegenerateRequest}
      />
    </Box>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box sx={{ mt: 0.5, color: "text.secondary" }}>{icon}</Box>
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 0.5, fontWeight: 700, textTransform: "uppercase" }}
        >
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={600} color="text.primary">
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}