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
  Tooltip
} from "@mui/material";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiSearch,
  FiCheckCircle
} from "react-icons/fi";
import NavMenu from "@/components/NavMenu/NavMenu";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContracts } from "@/hooks/useContracts";
import { useResellers } from "@/hooks/useResellers";
import { useGeneratePdf } from "@/hooks/usePdf";
import { toast } from "react-hot-toast"; // [NEW] Import Toast

import ContractFormDrawer from "./ContractFormDrawer";
import ContractDelete from "./ContractDelete";
import ResellerCell from "./components/ResellerCell";
import GeneratePdfDialog from "./components/GeneratePdfDialog";
import ViewPdfDialog from "./components/ViewPdfDialog";

export default function ContractList() {
  const navigate = useNavigate();

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
    sortBy: sortBy,
    sortDesc: sortDesc,
  });

  const data = contractQuery.data?.items ?? [];
  const totalPages = contractQuery.data?.totalPages ?? 1;
  const generatePdfMutation = useGeneratePdf();

  // --- HANDLERS ---

  // 1. Xử lý khi click vào icon PDF
  const handlePdfIconClick = (c: any) => {
    setSelectedContract(c);
    
    // Logic kiểm tra pdfLink
    if (c.pdfLink && c.pdfLink.trim() !== "") {
      // Nếu ĐÃ CÓ link -> Mở form Preview (ViewPdfDialog)
      setViewPdfOpen(true);
    } else {
      // Nếu CHƯA CÓ link -> Mở form Generate (GeneratePdfDialog)
      setGenPdfOpen(true);
    }
  };

  // 2. Xử lý khi người dùng muốn tạo lại PDF từ màn hình View
  const handleRegenerateRequest = () => {
    setViewPdfOpen(false); // Đóng view
    setGenPdfOpen(true);   // Mở generate
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
        companyName: c.companyName,
        startDate: c.startDate,
        endDate: c.endDate,
        bankAccountNumber: c.bankAccountNumber,
        addressLine: "", 
        totalAmount: 0,
        currency: "VND",
        templateName: templateName,
        
        // [NEW] Truyền link hiện tại để Backend xóa
        currentPdfUrl: c.pdfLink 
    };

    generatePdfMutation.mutate(
      pdfRequest as any,
      {
        onSuccess: () => {
            toast.success("PDF generated successfully!"); // [NEW] Thông báo thành công
            setGenPdfOpen(false);
            contractQuery.refetch(); // Refresh lại list để cập nhật icon xanh
        },
        onError: (error: any) => {
            console.error(error);
            toast.error("Failed to generate PDF. Please try again."); // [NEW] Thông báo lỗi
        }
      }
    );
  };

  const toggleSort = (field: "customerName" | "email") => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(false);
    }
    setPage(1);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <NavMenu />

      <Box sx={{ flexGrow: 1, ml: { xs: 0, md: "260px" }, p: 4, background: "#f5f6fa", minHeight: "100vh" }}>
        <Typography variant="h4" fontWeight={700} mb={3}>Contract Management</Typography>

        {/* FILTER BAR */}
        <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{ startAdornment: (<InputAdornment position="start"><FiSearch /></InputAdornment>) }}
            />
            <TextField
              select
              size="small"
              value={resellerId}
              onChange={(e) => setResellerId(e.target.value)}
              sx={{ width: 180 }}
              label="Reseller"
            >
              <MenuItem value="">All</MenuItem>
              {resellerQuery.data?.items?.map((r: any) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={() => contractQuery.refetch()}>APPLY</Button>
            <Button variant="outlined" onClick={() => { setSearch(""); setResellerId(""); contractQuery.refetch(); }}>CLEAR</Button>
            <Button variant="contained" startIcon={<FiPlus />} onClick={() => { setDrawerMode("create"); setCurrentId(null); setDrawerOpen(true); }}>CREATE</Button>
          </Stack>
        </Paper>

        {/* TABLE */}
        <Paper sx={{ borderRadius: "16px", overflow: "hidden" }}>
          <Stack direction="row" px={2.2} py={1.4} sx={{ fontWeight: 600, bgcolor: "#fafafa", borderBottom: "1px solid #eee" }}>
            <Box flex={1}>Contract No.</Box>
            <Box flex={1.4} onClick={() => toggleSort("customerName")} sx={{ cursor: "pointer" }}>Name</Box>
            <Box flex={1.6}>Email</Box>
            <Box flex={1.1}>Reseller</Box>
            <Box flex={0.8}>Start</Box>
            <Box flex={0.8}>End</Box>
            <Box width={120} textAlign="center">Actions</Box>
          </Stack>

          {data.map((c: any) => {
            // Kiểm tra có link PDF hay không
            const hasPdf = c.pdfLink && c.pdfLink.trim() !== null;

            return (
              <Stack key={c.id} direction="row" px={2.2} py={1.6} sx={{ alignItems: "center", borderBottom: "1px solid #f1f1f1", "&:hover": { bgcolor: "#f7f9fc" } }}>
                <Box flex={1} fontWeight={500} color="primary.main">{c.contractNumber}</Box>
                <Box flex={1.4}>{c.firstName} {c.lastName}</Box>
                <Box flex={1.6}>{c.email}</Box>
                <Box flex={1.1}><ResellerCell resellerId={c.resellerId} /></Box>
                <Box flex={0.8}>{c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"}</Box>
                <Box flex={0.8}>{c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"}</Box>

                <Stack direction="row" spacing={0.5} width={120} justifyContent="center">
                  {/* --- PDF ICON --- */}
                  <Tooltip title={hasPdf ? "View PDF" : "Generate PDF"}>
                    <IconButton 
                      size="small" 
                      onClick={() => handlePdfIconClick(c)} 
                      color={hasPdf ? "success" : "default"} // Xanh nếu có, Mặc định (đen/xám) nếu không
                    >
                      {hasPdf ? <FiCheckCircle size={18} /> : <FiFileText size={18} />}
                    </IconButton>
                  </Tooltip>

                  <IconButton size="small" onClick={() => { setDrawerMode("edit"); setCurrentId(c.id); setDrawerOpen(true); }}>
                    <FiEdit size={16} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => { setDeleteId(c.id); setDeleteOpen(true); }}>
                    <FiTrash2 size={16} />
                  </IconButton>
                </Stack>
              </Stack>
            );
          })}
          
          {/* Pagination */}
          <Stack direction="row" justifyContent="space-between" p={2}>
             <Typography color="text.secondary">Total: {contractQuery.data?.totalCount}</Typography>
             <Stack direction="row" spacing={2}>
                <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <Typography>{page} / {totalPages}</Typography>
                <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
             </Stack>
          </Stack>
        </Paper>

        {/* --- DIALOGS --- */}
        <ContractFormDrawer open={drawerOpen} mode={drawerMode} id={currentId} onClose={() => setDrawerOpen(false)} onSuccess={() => { setDrawerOpen(false); contractQuery.refetch(); }} />
        <ContractDelete open={deleteOpen} id={deleteId} onClose={() => setDeleteOpen(false)} onSuccess={() => { setDeleteOpen(false); contractQuery.refetch(); }} />
        
        {/* Form Generate (Dành cho icon đen/xám) */}
        <GeneratePdfDialog 
          open={genPdfOpen} 
          onClose={() => setGenPdfOpen(false)} 
          contract={selectedContract} 
          onGenerate={handleGenerateConfirm} 
        />

        {/* Form View (Dành cho icon xanh) */}
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
