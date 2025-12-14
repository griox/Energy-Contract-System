import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
  Grid,
  Avatar,
  Paper,
  Container
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";

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
  FiShoppingBag
} from "react-icons/fi";

// Hooks & Components
import { useContract } from "@/hooks/useContracts";
import { useGeneratePdf } from "@/hooks/usePdf";
import { useReseller } from "@/hooks/useResellers";
import { useAddress } from "@/hooks/useAddresses"; // [NEW] Import hook useAddress

import GeneratePdfDialog from "./components/GeneratePdfDialog";
import ViewPdfDialog from "./components/ViewPdfDialog";

export default function ContractDetail() {
  const { id } = useParams();
  const contractId = Number(id);
  const navigate = useNavigate();

  // --- STATES ---
  const [genPdfOpen, setGenPdfOpen] = useState(false);
  const [viewPdfOpen, setViewPdfOpen] = useState(false);

  // --- QUERIES ---
  const { data: contract, isLoading: isLoadingContract, refetch } = useContract(contractId);
  
  // [NEW] Sử dụng hook useAddress để lấy thông tin địa chỉ
  // Truyền 0 nếu chưa có contract để tránh lỗi, hook đã có enabled: !!id check
  const { data: addressData, isLoading: isLoadingAddress } = useAddress(contract?.addressId ?? 0);

  const { data: reseller, isLoading: isLoadingReseller } = useReseller(contract?.resellerId ?? 0);
  const generatePdfMutation = useGeneratePdf();

  // --- HANDLERS ---

  // 1. Xử lý khi nhấn nút PDF chính
  const handlePdfAction = () => {
    if (contract?.pdfLink && contract.pdfLink.trim() !== "") {
      setViewPdfOpen(true); // Đã có file -> Xem
    } else {
      setGenPdfOpen(true); // Chưa có -> Tạo mới
    }
  };

  // 2. Xử lý khi muốn tạo lại từ màn hình View
  const handleRegenerateRequest = () => {
    setViewPdfOpen(false);
    setGenPdfOpen(true);
  };

  // 3. Gọi API Generate
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
        addressLine: addressData?.houseNumber || "", // [UPDATE] Sử dụng địa chỉ vừa fetch được
        totalAmount: 0,
        currency: "VND",
        templateName: templateName,
        currentPdfUrl: c.pdfLink 
    };

    generatePdfMutation.mutate(
      pdfRequest as any,
      {
        onSuccess: () => {
            toast.success("PDF generated successfully!");
            setGenPdfOpen(false);
            refetch(); 
        },
        onError: (error: any) => {
            console.error(error);
            toast.error("Failed to generate PDF.");
        }
      }
    );
  };

  if (isLoadingContract) return <Box p={4} display="flex" justifyContent="center"><Typography>Loading contract details...</Typography></Box>;
  if (!contract) return <Box p={4}><Typography color="error">Contract not found</Typography></Box>;

  const hasPdf = contract.pdfLink && contract.pdfLink.trim() !== "";

  return (
    <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh", pb: 4 }}>
      {/* HEADER BACKGROUND */}
      <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e0e0e0", px: 4, py: 2 }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button 
              startIcon={<FiArrowLeft />} 
              onClick={() => navigate(-1)} 
              color="inherit"
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              Back to list
            </Button>
            <Box flex={1} />
            <Chip
              avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>R</Avatar>}
              label={isLoadingReseller ? "Loading..." : (reseller?.name || "Unknown Reseller")}
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          </Stack>
          
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} mt={2} mb={1} spacing={2}>
            <Box>
                <Typography variant="h4" fontWeight={700} color="#1a202c">
                  Contract #{contract.contractNumber}
                </Typography>
                <Stack direction="row" spacing={1} mt={1} alignItems="center">
                    <Chip 
                        label={hasPdf ? "PDF Ready" : "Draft"} 
                        color={hasPdf ? "success" : "default"} 
                        size="small" 
                        icon={hasPdf ? <FiCheckCircle /> : undefined}
                    />
                    <Typography variant="body2" color="text.secondary">
                        Created on: {new Date().toLocaleDateString()}
                    </Typography>
                </Stack>
            </Box>
            
            <Box flex={1} />

            {/* ACTION BUTTONS */}
            <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color={hasPdf ? "success" : "primary"}
                  startIcon={<FiFileText />}
                  onClick={handlePdfAction}
                  sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: 2 }}
                >
                  {hasPdf ? "View / Download PDF" : "Generate PDF"}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<FiShoppingBag />}
                  onClick={() => navigate(`/orders?contractId=${contract.id}`)}
                  sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: 'white' }}
                >
                  View Orders
                </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* MAIN CONTENT */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
            
            {/* LEFT COLUMN: CUSTOMER INFO */}
            <Grid size={{xs:12, md:8}}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", height: '100%' }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                        <Avatar sx={{ bgcolor: '#e3f2fd', color: 'primary.main' }}><FiUser /></Avatar>
                        <Typography variant="h6" fontWeight={600}>Customer Information</Typography>
                    </Stack>
                    
                    <Grid container spacing={3}>
                        <Grid size={{xs:12, sm:6}}>
                            <InfoItem icon={<FiUser />} label="Full Name" value={`${contract.firstName} ${contract.lastName}`} />
                        </Grid>
                        <Grid size={{xs:12, sm:6}}>
                            <InfoItem icon={<FiBriefcase />} label="Company" value={contract.companyName || "N/A"} />
                        </Grid>
                        <Grid size={{xs:12, sm:6}}>
                            <InfoItem icon={<FiMail />} label="Email Address" value={contract.email} />
                        </Grid>
                        <Grid size={{xs:12, sm:6}}>
                            <InfoItem icon={<FiPhone />} label="Phone Number" value={contract.phone} />
                        </Grid>
                        <Grid size={{xs:12}}>
                            <Divider sx={{ my: 1 }} />
                        </Grid>
                        <Grid size={{xs:12, sm:6}}>
                            <InfoItem icon={<FiCreditCard />} label="Bank Account" value={contract.bankAccountNumber || "N/A"} />
                        </Grid>
                        
                        {/* [UPDATE] Hiển thị Address từ hook useAddress */}
                        <Grid size={{xs:12, sm:6}}>
                            <InfoItem 
                                icon={<FiBriefcase />} 
                                label="Tax ID / Address" 
                                value={isLoadingAddress ? "Loading..." : (addressData?.houseNumber || "N/A")} 
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>

            {/* RIGHT COLUMN: CONTRACT TERMS */}
            <Grid size={{xs:12, md:4}}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", height: '100%', bgcolor: '#fff' }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                        <Avatar sx={{ bgcolor: '#fff3e0', color: 'warning.main' }}><FiCalendar /></Avatar>
                        <Typography variant="h6" fontWeight={600}>Contract Terms</Typography>
                    </Stack>

                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>VALIDITY PERIOD</Typography>
                            <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                                <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 1 }}><FiCalendar size={18} /></Box>
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                        {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : "N/A"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">Start Date</Typography>
                                </Box>
                                <Typography color="text.secondary">-</Typography>
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                        {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "N/A"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">End Date</Typography>
                                </Box>
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>FINANCIALS</Typography>
                            <Stack direction="row" justifyContent="space-between" mt={1}>
                                <Typography color="text.secondary">Currency</Typography>
                                <Typography fontWeight={600}>VND</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" mt={1}>
                                <Typography color="text.secondary">Total Value</Typography>
                                <Typography fontWeight={600} color="primary.main">---</Typography>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>
            </Grid>
        </Grid>
      </Container>

      {/* --- DIALOGS --- */}
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

// Helper Component
function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ mt: 0.5, color: 'text.secondary' }}>{icon}</Box>
            <Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    {label.toUpperCase()}
                </Typography>
                <Typography variant="body1" fontWeight={500} color="text.primary">
                    {value}
                </Typography>
            </Box>
        </Stack>
    );
}
