// src/pages/Contract/ContractEdit.tsx
import React from "react";
import { useParams } from "react-router-dom";
import ContractFormBase from "./ContractFormBase";
import NavMenu from "../../components/NavMenu/NavMenu";
import { Box } from "@mui/material";

const ContractEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = id ? parseInt(id, 10) : undefined;

  return (
    <Box sx={{ display: "flex" }}>
      {/* NavMenu */}
      <NavMenu />

      {/* Contract form */}
      <ContractFormBase 
        mode="edit" 
        contractId={numericId} 
        // If you need to fetch initial data here
      />
    </Box>
  );
};

export default ContractEdit;
