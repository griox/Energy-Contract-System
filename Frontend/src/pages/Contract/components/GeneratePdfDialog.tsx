import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Stack,
  IconButton,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";

import { TemplateApi } from "@/services/pdfService/pdfService";

interface GeneratePdfDialogProps {
  open: boolean;
  onClose: () => void;
  contract: any;
  onGenerate: (contract: any, templateName: string) => void;
  loading?: boolean;
}

export default function GeneratePdfDialog({
  open,
  onClose,
  contract,
  onGenerate,
  loading = false,
}: GeneratePdfDialogProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | string>("");
  const [previewHtml, setPreviewHtml] = useState("");

  const borderColor = alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.28 : 0.6);

  // Load Templates
  useEffect(() => {
    if (!open) return;

    let alive = true;

    TemplateApi.getAll()
      .then((data: any) => {
        if (!alive) return;

        const arr = Array.isArray(data) ? data : [];
        setTemplates(arr);

        const active = arr.find((x: any) => x?.isActive);
        if (active?.id != null) setSelectedTemplateId(active.id);
        else if (arr.length > 0) setSelectedTemplateId(arr[0].id);
        else setSelectedTemplateId("");
      })
      .catch((err) => {
        console.error(err);
        if (!alive) return;
        setTemplates([]);
        setSelectedTemplateId("");
      });

    return () => {
      alive = false;
    };
  }, [open]);

  const selectedTemplate = useMemo(
    () => templates.find((t: any) => t?.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  // Update Preview Logic
  useEffect(() => {
    if (!selectedTemplateId || !contract) {
      setPreviewHtml("");
      return;
    }

    const tmpl = templates.find((t: any) => t?.id === selectedTemplateId);
    if (!tmpl) {
      setPreviewHtml("");
      return;
    }

    let html = tmpl.htmlContent || "";

    const mapObj: Record<string, string> = {
      "{{ContractNumber}}": contract.contractNumber || t("common.na"),
      "{{StartDate}}": contract.startDate ? new Date(contract.startDate).toLocaleDateString() : "...",
      "{{EndDate}}": contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "...",
      "{{FullName}}": `${contract.firstName ?? ""} ${contract.lastName ?? ""}`.trim() || t("common.na"),
      "{{Email}}": contract.email || "...",
      "{{Phone}}": contract.phone || "...",
      "{{CompanyName}}": contract.companyName || "...",
      "{{BankAccount}}": contract.bankAccountNumber || "...",
      "{{Address}}": contract.addressLine || "...",
      "{{GeneratedDate}}": new Date().toLocaleDateString(),
    };

    const re = new RegExp(Object.keys(mapObj).join("|"), "gi");
    html = html.replace(re, (matched: string) => mapObj[matched] ?? matched);

    setPreviewHtml(html);
  }, [selectedTemplateId, contract, templates, t]);

  const handleConfirm = () => {
    const tmpl = templates.find((x: any) => x?.id === selectedTemplateId);
    onGenerate(contract, tmpl?.name || "");
  };

  const safeContractNumber = contract?.contractNumber ?? "-";
  const safeFullName = `${contract?.firstName ?? ""} ${contract?.lastName ?? ""}`.trim();

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pr: 1.5 }}>
        <Typography variant="h6" fontWeight={900}>
          {t("generatePdfDialog.title")}
        </Typography>

        <IconButton onClick={onClose} disabled={loading} aria-label={t("common.close")}>
          <FiX />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ height: "70vh" }}>
          {/* LEFT: Settings */}
          <Box
            sx={{
              width: { xs: "100%", md: "350px" },
              borderRight: { md: `1px solid ${borderColor}` },
              pr: { md: 2 },
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={800} gutterBottom>
                  {t("generatePdfDialog.selectedContract")}
                </Typography>

                <Typography variant="body1" fontWeight={900} sx={{ color: "primary.main" }}>
                  {safeContractNumber}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {safeFullName || t("common.na")}
                </Typography>
              </Box>

              <TextField
                select
                label={t("generatePdfDialog.selectTemplate")}
                fullWidth
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={loading}
              >
                {templates.map((tpl: any) => (
                  <MenuItem key={tpl.id} value={tpl.id}>
                    {tpl.name} {tpl.isActive ? `(${t("common.default")})` : ""}
                  </MenuItem>
                ))}
              </TextField>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${borderColor}`,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.info.main, 0.12)
                      : alpha(theme.palette.info.main, 0.10),
                  color: "text.primary",
                }}
              >
                <Typography variant="body2" fontWeight={900} sx={{ mb: 0.5 }}>
                  {t("generatePdfDialog.noteTitle")}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.92 }}>
                  {t("generatePdfDialog.noteBody")}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* RIGHT: Preview */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={800} gutterBottom>
              {t("generatePdfDialog.templatePreview")}
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                flex: 1,
                overflow: "auto",
                p: 2,
                bgcolor: theme.palette.mode === "dark" ? alpha("#525659", 0.9) : "#525659",
                display: "flex",
                justifyContent: "center",
                borderColor,
              }}
            >
              <Box
                sx={{
                  width: "210mm",
                  minHeight: "297mm",
                  bgcolor: "white",
                  boxShadow: theme.palette.mode === "dark" ? 0 : 5,
                  p: 0,
                  transform: "scale(0.65)",
                  transformOrigin: "top center",
                  marginBottom: "-30%",
                  borderRadius: 1,
                }}
                dangerouslySetInnerHTML={{
                  __html:
                    previewHtml ||
                    `<div style="padding:24px;color:#64748b;font-family:system-ui">
                      ${t("generatePdfDialog.noPreview")}
                    </div>`,
                }}
              />
            </Paper>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        {/* Ẩn nút khi loading */}
        {!loading && (
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            color="primary"
          >
            Generate PDF
          </Button>
        )}
        {/* Nếu muốn hiện loading spinner thay cho nút: */}
        {loading && (
          <Button variant="contained" color="primary" disabled startIcon={<CircularProgress size={20} color="inherit" />}>
            Generating...
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
