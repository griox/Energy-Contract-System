import { useState, useEffect } from "react";
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
  CircularProgress // [NEW] Import loading spinner
} from "@mui/material";
import { FiX } from "react-icons/fi";
import { TemplateApi } from "@/services/pdfService/pdfService";

interface GeneratePdfDialogProps {
  open: boolean;
  onClose: () => void;
  contract: any;
  onGenerate: (contract: any, templateName: string) => void;
  loading?: boolean; // [NEW] Thêm prop loading
}

export default function GeneratePdfDialog({ open, onClose, contract, onGenerate, loading = false }: GeneratePdfDialogProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | string>("");
  const [previewHtml, setPreviewHtml] = useState("");

  // Load Templates
  useEffect(() => {
    if (open) {
      TemplateApi.getAll().then((data: any) => {
        setTemplates(data);
        const active = data.find((t: any) => t.isActive);
        if (active) setSelectedTemplateId(active.id);
        else if (data.length > 0) setSelectedTemplateId(data[0].id);
      }).catch(err => console.error(err));
    }
  }, [open]);

  // Update Preview Logic
  useEffect(() => {
    if (!selectedTemplateId || !contract) return;
    const tmpl = templates.find(t => t.id === selectedTemplateId);
    if (tmpl) {
      let html = tmpl.htmlContent || "";
      const mapObj: any = {
        "{{ContractNumber}}": contract.contractNumber || "N/A",
        "{{StartDate}}": contract.startDate ? new Date(contract.startDate).toLocaleDateString() : "...",
        "{{EndDate}}": contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "...",
        "{{FullName}}": `${contract.firstName} ${contract.lastName}`,
        "{{Email}}": contract.email || "...",
        "{{Phone}}": contract.phone || "...",
        "{{CompanyName}}": contract.companyName || "...",
        "{{BankAccount}}": contract.bankAccountNumber || "...",
        "{{Address}}": "...", 
        "{{GeneratedDate}}": new Date().toLocaleDateString()
      };
      const re = new RegExp(Object.keys(mapObj).join("|"), "gi");
      html = html.replace(re, (matched: string) => mapObj[matched]);
      setPreviewHtml(html);
    }
  }, [selectedTemplateId, contract, templates]);

  const handleConfirm = () => {
    const tmpl = templates.find(t => t.id === selectedTemplateId);
    onGenerate(contract, tmpl?.name || "");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Generate PDF Configuration</Typography>
        <IconButton onClick={onClose} disabled={loading}><FiX /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ height: '70vh' }}>
          {/* LEFT: Settings */}
          <Box sx={{ width: { xs: '100%', md: '350px' }, borderRight: { md: '1px solid #eee' }, pr: { md: 2 } }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Selected Contract:</Typography>
                <Typography variant="body1" fontWeight={600} color="primary">
                  {contract?.contractNumber}
                </Typography>
                <Typography variant="body2">
                  {contract?.firstName} {contract?.lastName}
                </Typography>
              </Box>

              <TextField
                select
                label="Select Template"
                fullWidth
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={loading} // Disable khi đang loading
              >
                {templates.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name} {t.isActive && " (Default)"}
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  ℹ️ <strong>Note:</strong> This preview shows how the data will be mapped. Click "Generate PDF" to create the official file.
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* RIGHT: Preview */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Typography variant="subtitle2" gutterBottom>Template Preview:</Typography>
            <Paper 
              variant="outlined" 
              sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#525659', display: 'flex', justifyContent: 'center' }}
            >
               <Box 
                 sx={{ 
                   width: '210mm', minHeight: '297mm', bgcolor: 'white', boxShadow: 5, p: 0,
                   transform: 'scale(0.65)', transformOrigin: 'top center', marginBottom: '-30%' 
                 }}
                 dangerouslySetInnerHTML={{ __html: previewHtml }} 
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