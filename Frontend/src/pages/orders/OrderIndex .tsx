// src/pages/orders/OrderIndex.tsx
import { useState, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TableContainer,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import NavMenu from "@/components/NavMenu/NavMenu";
import { useNavigate } from "react-router-dom";

// Hooks & Types
import { useOrders } from "@/hooks/useOrders";
import { useContracts } from "@/hooks/useContracts";
import { OrderType, OrderStatus } from "@/types/order";

// ===== COMPONENT =====
export default function OrderIndex() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | false>(false);

  // 1. Lấy danh sách Orders (Lấy số lượng lớn để group)
  const { data: orderData, isLoading: loadingOrders } = useOrders({
    pageNumber: 1,
    pageSize: 1000, // Lấy nhiều để demo group
  });

  // 2. Lấy danh sách Contracts
  const { data: contractData, isLoading: loadingContracts } = useContracts({
    pageNumber: 1,
    pageSize: 100,
  });

  const orders = orderData?.items || [];
  const contracts = contractData?.items || [];

  // 3. Group Orders theo Contract ID
  const contractsWithOrders = useMemo(() => {
    if (!contracts.length) return [];

    return contracts.map((contract) => {
      const contractOrders = orders.filter((o) => o.contractId === contract.id);
      return {
        ...contract,
        orders: contractOrders,
      };
    });
  }, [contracts, orders]);

  const handleAccordionChange = (panel: string) => (_: any, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleEdit = (orderId: number) => {
    navigate(`/orders/edit/${orderId}`);
  };

  const handleDelete = (orderId: number) => {
    navigate(`/orders/delete/${orderId}`);
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case OrderStatus.Active: return "success";
      case OrderStatus.Pending: return "warning";
      case OrderStatus.Completed: return "info";
      case OrderStatus.Cancelled: return "error";
      default: return "default";
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case OrderStatus.Active: return "Active";
      case OrderStatus.Pending: return "Pending";
      case OrderStatus.Completed: return "Completed";
      case OrderStatus.Cancelled: return "Cancelled";
      default: return "Unknown";
    }
  };

  if (loadingOrders || loadingContracts) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <NavMenu />
      <Box sx={{ flexGrow: 1, background: "#f5f7fa", minHeight: "100vh", py: 4, ml: "240px" }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
            <span style={{ color: "#1976D2" }}>Order</span> Management (Grouped by Contract)
          </Typography>

          {contractsWithOrders.length === 0 ? (
            <Typography>No contracts found.</Typography>
          ) : (
            contractsWithOrders.map((contract) => (
              <Accordion
                key={contract.id}
                expanded={expanded === `panel-${contract.id}`}
                onChange={handleAccordionChange(`panel-${contract.id}`)}
                sx={{ mb: 2, borderRadius: "8px !important", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>
                      {contract.contractNumber} - {contract.firstName} {contract.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {contract.orders.length} orders
                    </Typography>
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  <Paper sx={{ p: 0, boxShadow: "none" }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Order No.</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Fee</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {contract.orders.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ color: "#94a3b8", py: 3 }}>
                                No orders for this contract.
                              </TableCell>
                            </TableRow>
                          ) : (
                            contract.orders.map((o) => (
                              <TableRow key={o.id} hover>
                                <TableCell>{o.orderNumber}</TableCell>
                                <TableCell>
                                  <Chip
                                    icon={o.orderType === OrderType.Electricity ? <FlashOnIcon fontSize="small" /> : <LocalGasStationIcon fontSize="small" />}
                                    label={o.orderType === OrderType.Electricity ? "ELECTRICITY" : "GAS"}
                                    variant="outlined"
                                    size="small"
                                    color={o.orderType === OrderType.Electricity ? "warning" : "info"}
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={getStatusLabel(o.status)}
                                    variant="outlined"
                                    size="small"
                                    color={getStatusColor(o.status) as any}
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>
                                <TableCell>{o.startDate?.split("T")[0]}</TableCell>
                                <TableCell>{o.endDate?.split("T")[0]}</TableCell>
                                <TableCell>{o.topupFee?.toLocaleString()} €</TableCell>
                                <TableCell align="right">
                                  <IconButton color="primary" size="small" onClick={() => handleEdit(o.id)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton color="error" size="small" onClick={() => handleDelete(o.id)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Container>
      </Box>
    </Box>
  );
}
