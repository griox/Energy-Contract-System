import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  ShoppingCart,
  Users,
  History,
  Layers,
} from "lucide-react";

export default function NavMenu() {
  const navigate = useNavigate();

  const menuItems = [
    { label: "Home", path: "/home", icon: <Home size={20} /> },

    { label: "Contracts List", path: "/contracts/list", icon: <FileText size={20} /> },

    { label: "Orders", path: "/orders", icon: <ShoppingCart size={20} /> },

    { label: "Resellers", path: "/address-reseller/list", icon: <Users size={20} /> },

    { label: "History", path: "/history", icon: <History size={20} /> },

    { label: "Templates", path: "/templates", icon: <Layers size={20} /> },
  ];

  return (
    <div
      style={{
        width: "240px",
        background: "#1F2937",
        color: "white",
        height: "100vh",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <h2
        style={{
          color: "#FBBF24",
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: "1.5rem",
        }}
      >
        INFODATION
      </h2>

      {menuItems.map((item) => (
        <div
          key={item.label}
          onClick={() => navigate(item.path)}
          style={{
            padding: "0.8rem 1rem",
            background: "#374151",
            borderRadius: "0.5rem",
            cursor: "pointer",
            transition: "0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#4B5563")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#374151")}
        >
          {item.label}
        </div>
      ))}

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "auto",
          padding: "0.8rem 1rem",
          background: "#DC2626",
          border: "none",
          color: "white",
          borderRadius: "0.5rem",
          cursor: "pointer",
        }}
      >
        🔓 Log Out
      </button>
    </div>
  );
}
