import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from "@mui/material";
import { FiX, FiRefreshCw, FiDownload } from "react-icons/fi";
import { useState } from "react";
// [FIX] Import api_pdf thay vì axios gốc
import api_pdf from "@/lib/api/api_pdf"; 
import { toast } from "react-hot-toast";

interface ViewPdfDialogProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  onRegenerate: () => void;
}

export default function ViewPdfDialog({ open, onClose, pdfUrl, onRegenerate }: ViewPdfDialogProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!pdfUrl) return;
    setDownloading(true);
    try {
      // [FIX] Sử dụng api_pdf.post thay vì axios.post
      // URL chỉ cần path tương đối vì baseURL đã được cấu hình trong api_pdf
      const response = await api_pdf.post(
        "/pdf-contract/download", 
        { fileUrl: pdfUrl },
        { responseType: 'blob' } 
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'contract.pdf';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2)
            fileName = fileNameMatch[1];
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Failed to download file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, px: 2 }}>
        <Typography variant="h6">View Contract PDF</Typography>
        <IconButton onClick={onClose}><FiX /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, height: '85vh', bgcolor: '#525659', overflow: 'hidden' }}>
        {pdfUrl ? (
          <iframe 
            src={`${pdfUrl}#view=FitH`} 
            width="100%" 
            height="100%" 
            style={{ border: 'none', display: 'block' }}
            title="PDF Viewer"
          />
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography color="white">Invalid PDF URL</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Box>
            <Button 
                variant="outlined" 
                color="warning" 
                startIcon={<FiRefreshCw />}
                onClick={onRegenerate}
                sx={{ mr: 1 }}
            >
                Regenerate
            </Button>
            
            <Button 
                variant="contained" 
                color="primary" 
                startIcon={downloading ? <CircularProgress size={20} color="inherit"/> : <FiDownload />}
                onClick={handleDownload}
                disabled={downloading || !pdfUrl}
            >
                {downloading ? "Downloading..." : "Download"}
            </Button>
        </Box>

        <Button onClick={onClose} variant="text" color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
}