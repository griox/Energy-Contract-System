// src/pages/Contract/ContractPDF.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Grid
} from "@mui/material";

import { FiX, FiDownload, FiEdit } from "react-icons/fi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { TemplateApi } from "@/services/pdfService/pdfService";
import { contractService } from "@/services/customerService/ContractService";

export default function ContractPDF() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numericId = Number(id);

  const [contract, setContract] = useState<any>(null);
  const [open, setOpen] = useState(true);
  const [defaultTemplateId, setDefaultTemplateId] = useState<number | null>(null);

  // ───────────────── LOAD CONTRACT ─────────────────
  useEffect(() => {
    async function load() {
      try {
        // Chỉ lấy thông tin hợp đồng
        const c = await contractService.getById(numericId);
        setContract(c);
      } catch (error) {
        console.error("Error loading contract data:", error);
      }
    }
    if (!Number.isNaN(numericId)) {
      load();
    }
  }, [numericId]);

  // ───────────────── LOAD DEFAULT TEMPLATE ─────────────────
  useEffect(() => {
    async function loadDefaultTemplate() {
      try {
        const templates = await TemplateApi.getAll();
        if (Array.isArray(templates) && templates.length > 0) {
          const active = templates.find((t: any) => t.isActive);
          const selected = active || templates[0];
          setDefaultTemplateId(selected.id);
        }
      } catch (error) {
        console.error("Failed to load templates for PDF edit", error);
      }
    }
    loadDefaultTemplate();
  }, []);

  // ───────────────── EXPORT PDF ─────────────────
  const exportPDF = () => {
    const input = document.getElementById("pdf-preview");
    if (!input) return;

    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(img, "PNG", 0, 0, width, height);
      pdf.save(`Contract-${contract.contractNumber}.pdf`);
    });
  };

  // ───────────────── EDIT PDF TEMPLATE ─────────────────
  const handleEditTemplate = () => {
    if (!defaultTemplateId || !contract) {
      navigate("/templates");
      return;
    }

    const previewVariables = {
      ContractNumber: contract.contractNumber ?? "",
      FullName: `${contract.firstName ?? ""} ${contract.lastName ?? ""}`.trim(),
      Email: contract.email ?? "",
      Phone: contract.phone ?? "",
      StartDate: contract.startDate?.slice(0, 10) ?? "",
      EndDate: contract.endDate?.slice(0, 10) ?? "",
      CompanyName: contract.companyName ?? "",
      BankAccountNumber: contract.bankAccountNumber ?? "",
      // Các trường Order để trống vì không còn load
      OrderNumber: "",
      OrderType: "",
      OrderStatus: "",
      OrderStartDate: "",
      OrderEndDate: "",
      OrderTopupFee: "",
      Currency: "VND",
      TotalAmount: "",
      GeneratedDate: new Date().toISOString().slice(0, 10),
    };

    navigate(`/templates/edit/${defaultTemplateId}`, {
      state: { previewVariables, fillFromContract: true },
    });
  };

  if (!contract) return <Typography sx={{ p: 3, textAlign: "center" }}>Loading contract data...</Typography>;

  return (
    <Dialog open={open} fullWidth maxWidth="md" scroll="body">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>📄 Xem trước bản in Hợp đồng</Typography>
        <IconButton onClick={() => navigate(`/contracts/${contract.id}/detail`)} color="default">
          <FiX size={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "#f3f4f6", p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* === PDF PREVIEW PAPER === */}
        <Paper
          id="pdf-preview"
          elevation={3}
          sx={{
            width: "210mm", // A4 Width
            minHeight: "297mm", // A4 Height
            p: "20mm", // Standard margin
            bgcolor: "#ffffff",
            boxSizing: "border-box",
            mb: 3
          }}
        >
          <Stack spacing={4}>
            {/* HEADER */}
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} gutterBottom textTransform="uppercase">
                HỢP ĐỒNG CUNG CẤP NĂNG LƯỢNG
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                (Gas / Điện năng · Energy Contract Manager)
              </Typography>
            </Box>

            {/* SECTION 1: CONTRACT INFO */}
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                1. Thông tin Hợp đồng
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                <Typography><strong>Mã hợp đồng:</strong> {contract.contractNumber}</Typography>
                <Typography>
                  <strong>Thời hạn:</strong> {contract.startDate?.slice(0, 10)} — {contract.endDate?.slice(0, 10) || "Không xác định"}
                </Typography>
              </Stack>
            </Box>

            {/* SECTION 2: CUSTOMER INFO */}
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                2. Thông tin Khách hàng
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography><strong>Khách hàng:</strong> {contract.firstName} {contract.lastName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography><strong>Email:</strong> {contract.email}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography><strong>Số điện thoại:</strong> {contract.phone || "Chưa cung cấp"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography><strong>Công ty:</strong> {contract.companyName || "Cá nhân"}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography><strong>Số tài khoản:</strong> {contract.bankAccountNumber || "Không có"}</Typography>
                </Grid>
              </Grid>
            </Box>

            {/* SIGNATURE SECTION */}
            <Box sx={{ pt: 8 }}>
              <Grid container spacing={4}>
                <Grid size={{ xs: 6 }} textAlign="center">
                  <Typography fontWeight={700} gutterBottom>Đại diện Bên A</Typography>
                  <Typography variant="caption" display="block" gutterBottom>(Ký, ghi rõ họ tên)</Typography>
                  <Box sx={{ height: 80 }} /> {/* Space for signature */}
                  <Typography>______________________</Typography>
                </Grid>
                <Grid size={{ xs: 6 }} textAlign="center">
                  <Typography fontWeight={700} gutterBottom>Đại diện Bên B</Typography>
                  <Typography variant="caption" display="block" gutterBottom>(Ký xác nhận)</Typography>
                  <Box sx={{ height: 80 }} /> {/* Space for signature */}
                  <Typography fontWeight={600}>{contract.lastName} {contract.firstName}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Paper>

        {/* === ACTION BUTTONS === */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" width="100%" maxWidth="210mm">
          <Button
            variant="outlined"
            startIcon={<FiEdit />}
            onClick={handleEditTemplate}
          >
            Edit PDF Template
          </Button>
          <Button
            variant="contained"
            startIcon={<FiDownload />}
            onClick={exportPDF}
          >
            Tải về PDF
          </Button>
        </Stack>

      </DialogContent>
    </Dialog>
  );
}
