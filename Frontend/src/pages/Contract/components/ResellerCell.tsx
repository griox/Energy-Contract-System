import { useReseller } from "@/hooks/useResellers";

interface ResellerCellProps {
  resellerId: number;
}

export default function ResellerCell({ resellerId }: ResellerCellProps) {
  const { data: reseller, isLoading } = useReseller(resellerId);
  
  if (isLoading) return <span>Loading...</span>;
  return <span>{reseller?.name || "—"}</span>;
}