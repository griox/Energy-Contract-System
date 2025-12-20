import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  ShoppingCart,
  Users,
  History,
  Layers,
  Sun,
  Moon,
  Menu
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  IconButton,
  Button,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Drawer
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ColorModeContext } from "@/theme/AppThemeProvider";

const SIDEBAR_WIDTH = 240;

export default function NavMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const { t, i18n } = useTranslation();
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const lang = (i18n.language || "en") as "vi" | "en";

  const [open, setOpen] = useState(false); // MOBILE MENU

  const menuItems = [
    { key: "home", path: "/home", icon: <Home size={18} /> },
    { key: "contracts", path: "/contracts/list", icon: <FileText size={18} /> },
    { key: "orders", path: "/orders", icon: <ShoppingCart size={18} /> },
    { key: "resellers", path: "/address-reseller/list", icon: <Users size={18} /> },
    { key: "history", path: "/history", icon: <History size={18} /> },
    { key: "templates", path: "/templates", icon: <Layers size={18} /> },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLang = (_: any, next: "vi" | "en" | null) => {
    if (!next) return;
    i18n.changeLanguage(next);
    localStorage.setItem("lng", next);
  };

  // Sidebar UI (tách riêng để dùng cho Drawer & Desktop)
  const SidebarContent = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: "100%",
        p: 2,
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Typography
        variant="h6"
        fontWeight={900}
        textAlign="center"
        sx={{ color: "warning.main", letterSpacing: 1 }}
      >
        INFODATION
      </Typography>

      {/* Language + Theme */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2}>
        <ToggleButtonGroup size="small" value={lang} exclusive onChange={handleLang}>
          <ToggleButton value="vi">VI</ToggleButton>
          <ToggleButton value="en">EN</ToggleButton>
        </ToggleButtonGroup>

        <IconButton onClick={toggleColorMode} sx={{ border: 1, borderColor: "divider" }}>
          {mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <List sx={{ p: 0 }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItemButton
              key={item.key}
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
              selected={active}
              sx={{
                mb: 1,
                borderRadius: 2,
                border: `1px solid ${active ? alpha(theme.palette.primary.main, 0.35) : "transparent"
                  }`,
                bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : "transparent",
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.12) }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={t(`nav.${item.key}`)}
                primaryTypographyProps={{
                  fontWeight: active ? 800 : 600
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ mt: "auto" }}>
        <Button
          fullWidth
          variant="contained"
          color="error"
          onClick={() => navigate("/")}
          sx={{ py: 1.2, borderRadius: 2 }}
        >
          🔓 {t("nav.logout")}
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      {/* MOBILE TOP BAR */}
      {/* MOBILE TOP BAR */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          alignItems: "center",
          gap: 1.5,
          height: 64,
          px: 2,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          position: "sticky",
          top: 0,
          zIndex: 999,
        }}
      >
        <IconButton onClick={() => setOpen(true)} sx={{ mr: 0.5 }}>
          <Menu size={26} />
        </IconButton>

        {/* Title area */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h4"
            fontWeight={900}
            color="#FF9900"
            noWrap
            sx={{ lineHeight: 1.1 }}
          >
            {t("INFODATION")}
          </Typography>

          <Typography variant="caption" color="text.secondary" noWrap>
          </Typography>
        </Box>
      </Box>

      {/* MOBILE MENU DRAWER */}
      <Drawer open={open} onClose={() => setOpen(false)}>
        {SidebarContent}
      </Drawer>

      {/* DESKTOP SIDEBAR */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          width: SIDEBAR_WIDTH,
          position: "fixed",
          height: "100vh"
        }}
      >
        {SidebarContent}
      </Box>
    </>
  );
}
