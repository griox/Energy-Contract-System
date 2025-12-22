// src/pages/Contract/ContractHistoryPage.tsx
import { Fragment, useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import NavMenu from "@/components/NavMenu/NavMenu";
import { useContractHistoryByContract, useDeleteContractHistory } from "@/hooks/useContractHistory";
import { useContracts } from "@/hooks/useContracts";
import { useDebounce } from "@/hooks/useDebounce";

import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Collapse,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Pagination,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const SIDEBAR_OFFSET = 260;

/** ======================
 * Helpers
 * ====================== */
function toIntOrFallback(raw: string | null, fallback: number) {
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function safeJsonParse<T = any>(s?: string): T | null {
    if (!s) return null;
    const str = String(s).trim();
    if (!str) return null;
    if (!(str.startsWith("{") || str.startsWith("["))) return null;
    try {
        return JSON.parse(str) as T;
    } catch {
        return null;
    }
}

function isPlainObject(v: any) {
    return v && typeof v === "object" && !Array.isArray(v);
}

function normalizePath(path: string) {
    return String(path || "").trim().toLowerCase();
}

function isNoisePath(path: string) {
    const p = normalizePath(path);

    if (p === "id" || p.endsWith(".id")) return true;
    if (p === "contractid" || p.endsWith(".contractid")) return true;

    if (p.startsWith("orders") || p.includes(".orders")) return true;
    if (p.startsWith("history") || p.includes(".history")) return true;
    if (p.includes(".contracts")) return true;

    if (p.includes("x-amz") || p.includes("signature") || p.includes("credential")) return true;

    return false;
}

function flattenAny(
    value: any,
    prefix = "",
    out: Record<string, any> = {},
    depth = 0,
    maxDepth = 6,
    maxArrayItems = 3
) {
    if (depth > maxDepth) return out;

    if (Array.isArray(value)) {
        if (value.every((x) => !isPlainObject(x) && !Array.isArray(x))) {
            out[prefix || "[]"] = value.slice(0, maxArrayItems);
            return out;
        }
        for (let i = 0; i < Math.min(value.length, maxArrayItems); i++) {
            const item = value[i];
            const p = prefix ? `${prefix}[${i}]` : `[${i}]`;
            flattenAny(item, p, out, depth + 1, maxDepth, maxArrayItems);
        }
        return out;
    }

    if (isPlainObject(value)) {
        for (const k of Object.keys(value)) {
            const v = (value as any)[k];
            const p = prefix ? `${prefix}.${k}` : k;
            if (isNoisePath(p)) continue;
            if (isPlainObject(v) || Array.isArray(v)) flattenAny(v, p, out, depth + 1, maxDepth, maxArrayItems);
            else out[p] = v;
        }
        return out;
    }

    if (prefix) out[prefix] = value;
    return out;
}

function humanizeLabel(path: string) {
    const p = String(path || "").trim();
    if (!p) return "Change";
    const last = p.split(".").pop() || p;
    const spaced = last.replace(/([a-z])([A-Z])/g, "$1 $2");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * ✅ Normalize để so sánh diff (giảm nhiễu timezone/format):
 * - Date-like string: ép về YYYY-MM-DD
 * - String: trim
 * - number/boolean: stringify
 * - object/array: JSON.stringify
 */
function normalizeForCompare(path: string, v: any) {
    if (v === null || v === undefined) return "";
    const p = normalizePath(path);

    if (typeof v === "string") {
        const s = v.trim();
        if (!s) return "";

        const isDateField =
            p.endsWith("startdate") ||
            p.endsWith("enddate") ||
            p.endsWith("date") ||
            p.includes("date.");

        if (isDateField) {
            const m = s.match(/^\d{4}-\d{2}-\d{2}/);
            if (m) return m[0];

            const d = new Date(s);
            if (!Number.isNaN(d.getTime())) {
                const y = d.getFullYear();
                const mo = String(d.getMonth() + 1).padStart(2, "0");
                const da = String(d.getDate()).padStart(2, "0");
                return `${y}-${mo}-${da}`;
            }
        }

        return s;
    }

    if (typeof v === "number") return String(v);
    if (typeof v === "boolean") return v ? "true" : "false";

    try {
        return JSON.stringify(v);
    } catch {
        return String(v);
    }
}

/** ======================
 * Types (khớp Swagger)
 * ====================== */
type HistoryItem = {
    id: number;
    oldValue?: string | null;
    newValue?: string | null;
    timestamp: string;
    contractId: number;
};

type ChangeItem = {
    path: string;
    oldVal: any;
    newVal: any;
    kind: "diff" | "plain" | "nodiff";
    label?: string;
};

type HistoryGroup = {
    historyId: number;
    timestamp: string;
    contractId: number;
    changes: ChangeItem[];
    oldRaw?: string | null;
    newRaw?: string | null;
};

function buildHistoryGroups(items: HistoryItem[]): HistoryGroup[] {
    const groups: HistoryGroup[] = [];

    for (const h of items) {
        const oldJson = safeJsonParse<any>(h.oldValue ?? "");
        const newJson = safeJsonParse<any>(h.newValue ?? "");

        // old/new không phải JSON => show plain
        if (!oldJson || !newJson) {
            groups.push({
                historyId: h.id,
                timestamp: h.timestamp,
                contractId: h.contractId,
                oldRaw: h.oldValue,
                newRaw: h.newValue,
                changes: [{ path: "plain", oldVal: h.oldValue, newVal: h.newValue, kind: "plain" }],
            });
            continue;
        }

        const oldFlat = flattenAny(oldJson);
        const newFlat = flattenAny(newJson);

        const keys = new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)]);
        const diffs: ChangeItem[] = [];

        keys.forEach((path) => {
            if (isNoisePath(path)) return;

            const a = oldFlat[path];
            const b = newFlat[path];

            // ✅ compare after normalize
            const na = normalizeForCompare(path, a);
            const nb = normalizeForCompare(path, b);

            if (na !== nb) {
                diffs.push({ path, oldVal: a, newVal: b, kind: "diff" });
            }
        });

        if (diffs.length === 0) {
            groups.push({
                historyId: h.id,
                timestamp: h.timestamp,
                contractId: h.contractId,
                oldRaw: h.oldValue,
                newRaw: h.newValue,
                changes: [{ path: "nodiff", oldVal: h.oldValue, newVal: h.newValue, kind: "nodiff" }],
            });
            continue;
        }

        groups.push({
            historyId: h.id,
            timestamp: h.timestamp,
            contractId: h.contractId,
            oldRaw: h.oldValue,
            newRaw: h.newValue,
            changes: diffs,
        });
    }

    groups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return groups;
}

/** ======================
 * Page
 * ====================== */
export default function ContractHistoryPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const { t, i18n } = useTranslation();
    const lang = i18n.language || "en";
    const isVI = lang.toLowerCase().startsWith("vi");

    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const formatDateTime = useCallback(
        (iso: string) => {
            const d = new Date(iso);
            return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(isVI ? "vi-VN" : "en-US");
        },
        [isVI]
    );

    const formatValue = useCallback(
        (v: any) => {
            if (v === null || v === undefined || v === "") return "—";
            if (typeof v === "number") return v.toLocaleString(isVI ? "vi-VN" : "en-US");
            if (typeof v === "boolean") return v ? (isVI ? "Có" : "Yes") : (isVI ? "Không" : "No");
            if (typeof v === "string") {
                const s = v.trim();
                if (!s) return "—";
                if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.split("T")[0];
                if (s.startsWith("http://") || s.startsWith("https://")) return isVI ? "Liên kết" : "Link";
                if (s.length > 80) return s.slice(0, 77) + "…";
                return s;
            }
            try {
                const s = JSON.stringify(v);
                if (s.length > 80) return s.slice(0, 77) + "…";
                return s;
            } catch {
                return String(v);
            }
        },
        [isVI]
    );

    // ✅ labels song ngữ
    const FIELD_LABELS: Record<string, { vi: string; en: string }> = useMemo(
        () => ({
            contractnumber: { vi: "Mã hợp đồng", en: "Contract number" },
            startdate: { vi: "Ngày bắt đầu", en: "Start date" },
            enddate: { vi: "Ngày kết thúc", en: "End date" },
            firstname: { vi: "Họ", en: "First name" },
            lastname: { vi: "Tên", en: "Last name" },
            email: { vi: "Email", en: "Email" },
            phone: { vi: "SĐT", en: "Phone" },
            companyname: { vi: "Tên công ty", en: "Company name" },
            bankaccountnumber: { vi: "Số tài khoản", en: "Bank account number" },
            pdflink: { vi: "Link PDF", en: "PDF link" },

            resellerid: { vi: "ResellerId", en: "ResellerId" },
            "reseller.name": { vi: "Đại lý", en: "Reseller" },
            "reseller.type": { vi: "Loại đại lý", en: "Reseller type" },

            addressid: { vi: "AddressId", en: "AddressId" },
            "address.zipcode": { vi: "Mã bưu chính", en: "Postal code" },
            "address.housenumber": { vi: "Số nhà", en: "House number" },
            "address.extension": { vi: "Phụ", en: "Extension" },

            plain: { vi: "Thay đổi (raw)", en: "Change (raw)" },
            nodiff: { vi: "Không có field thay đổi", en: "No field changes" },
        }),
        []
    );

    const resolveLabel = useCallback(
        (path: string) => {
            const norm = normalizePath(path);
            const lastSeg = norm.split(".").pop() || norm;

            const hit = FIELD_LABELS[norm] ?? FIELD_LABELS[lastSeg];
            if (hit) return isVI ? hit.vi : hit.en;

            return humanizeLabel(path);
        },
        [FIELD_LABELS, isVI]
    );

    // contractId ưu tiên param path, fallback query
    const contractIdFromUrl = useMemo(() => {
        const p1 = id ? Number(id) : NaN;
        const raw = searchParams.get("contractId");
        const p2 = raw && raw.trim() !== "" ? Number(raw) : NaN;
        return !Number.isNaN(p1) ? p1 : !Number.isNaN(p2) ? p2 : NaN;
    }, [id, searchParams]);

    const pageNumberFromUrl = useMemo(() => toIntOrFallback(searchParams.get("pageNumber"), 1), [searchParams]);
    const pageSizeFromUrl = useMemo(() => {
        const size = toIntOrFallback(searchParams.get("pageSize"), 10);
        return [10, 20, 50, 100].includes(size) ? size : 10;
    }, [searchParams]);
    const searchFromUrl = useMemo(() => searchParams.get("search") ?? "", [searchParams]);

    const [inputContractId, setInputContractId] = useState("");
    const [inputSearch, setInputSearch] = useState("");

    useEffect(() => {
        setInputContractId(Number.isNaN(contractIdFromUrl) ? "" : String(contractIdFromUrl));
    }, [contractIdFromUrl]);

    useEffect(() => {
        setInputSearch(searchFromUrl);
    }, [searchFromUrl]);

    const debouncedSearch = useDebounce(inputSearch, 450);

    const contractId = inputContractId.trim() === "" ? NaN : Number(inputContractId);
    const enabled = Number.isFinite(contractId) && contractId > 0;

    const borderColor = alpha(theme.palette.divider, isDark ? 0.35 : 0.8);
    const softBorder = `1px solid ${alpha(theme.palette.divider, isDark ? 0.3 : 0.55)}`;
    const paperShadow = isDark ? "none" : "0 2px 12px rgba(0,0,0,0.06)";

    // contracts dropdown
    const { data: contractData, isLoading: isLoadingContracts } = useContracts({ pageNumber: 1, pageSize: 200 }) as any;
    const contracts = contractData?.items ?? [];

    const selectedContract = useMemo(() => {
        if (!inputContractId.trim()) return null;
        return contracts.find((c: any) => String(c.id) === String(inputContractId)) ?? null;
    }, [contracts, inputContractId]);

    // querystring helpers
    const applyParams = useCallback(
        (next: { contractId?: string; pageNumber?: number; pageSize?: number; search?: string }) => {
            const fallbackContractId = inputContractId.trim() || searchParams.get("contractId") || "";

            const currentContractId = (next.contractId ?? fallbackContractId).trim();
            const currentPageNumber = String(next.pageNumber ?? pageNumberFromUrl);
            const currentPageSize = String(next.pageSize ?? pageSizeFromUrl);
            const currentSearch = (next.search ?? searchParams.get("search") ?? "").trim();

            const sp: Record<string, string> = {};
            if (currentContractId) sp.contractId = currentContractId;
            if (currentPageNumber) sp.pageNumber = currentPageNumber;
            if (currentPageSize) sp.pageSize = currentPageSize;
            if (currentSearch) sp.search = currentSearch;

            setSearchParams(sp);
        },
        [inputContractId, pageNumberFromUrl, pageSizeFromUrl, searchParams, setSearchParams]
    );

    const handleLoad = () => {
        if (!inputContractId.trim()) return;
        applyParams({ contractId: inputContractId.trim(), pageNumber: 1, search: inputSearch.trim() });
    };

    const handleClear = () => {
        setInputContractId("");
        setInputSearch("");
        setSearchParams({});
    };

    const handlePageChange = (_: any, page: number) => applyParams({ pageNumber: page });
    const handlePageSizeChange = (size: number) => applyParams({ pageSize: size, pageNumber: 1 });

    useEffect(() => {
        if (!enabled) return;

        const nextSearch = (debouncedSearch || "").trim();
        const currentSearch = (searchFromUrl || "").trim();
        if (nextSearch === currentSearch) return;

        applyParams({
            contractId: inputContractId.trim(),
            search: nextSearch,
            pageNumber: 1,
        });
    }, [applyParams, debouncedSearch, enabled, inputContractId, searchFromUrl]);

    // history query
    const { data, isLoading, isFetching, isError, error } = useContractHistoryByContract({
        contractId: enabled ? contractId : undefined,
        pageNumber: pageNumberFromUrl,
        pageSize: pageSizeFromUrl,
        search: searchFromUrl,
    }) as any;

    const items: HistoryItem[] = data?.items ?? [];
    const totalPages = data?.totalPages ?? 0;
    const totalCount = data?.totalCount ?? 0;

    // ✅ build + ẩn record "No field changes"
    const historyGroupsRaw = useMemo(() => {
        const gs = buildHistoryGroups(items);
        return gs.filter((g) => g.changes.some((c) => c.kind !== "nodiff"));
    }, [items]);

    // attach labels
    const historyGroups = useMemo(() => {
        return historyGroupsRaw.map((g) => ({
            ...g,
            changes: g.changes.map((c) => ({
                ...c,
                label:
                    c.kind === "plain"
                        ? resolveLabel("plain")
                        : c.kind === "nodiff"
                            ? resolveLabel("nodiff")
                            : resolveLabel(c.path),
            })),
        }));
    }, [historyGroupsRaw, resolveLabel]);

    // client-side filter
    const clientFilteredGroups = useMemo(() => {
        const q = (searchFromUrl || "").trim().toLowerCase();
        if (!q) return historyGroups;
        return historyGroups.filter((g) =>
            g.changes.some((c) => `${c.label} ${formatValue(c.oldVal)} ${formatValue(c.newVal)}`.toLowerCase().includes(q))
        );
    }, [formatValue, historyGroups, searchFromUrl]);

    const totalChanges = useMemo(
        () => clientFilteredGroups.reduce((sum, g) => sum + (g.changes?.length || 0), 0),
        [clientFilteredGroups]
    );

    const buildSummary = useCallback(
        (changes: ChangeItem[]) => {
            const diffs = changes.filter((c) => c.kind === "diff");
            const names = diffs.slice(0, 3).map((c) => c.label || resolveLabel(c.path));
            const more = diffs.length - names.length;
            if (names.length === 0) return "—";
            return more > 0 ? `${names.join(", ")} +${more}` : names.join(", ");
        },
        [resolveLabel]
    );

    // expand/collapse
    const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
    useEffect(() => {
        setExpandedIds({});
    }, [enabled, contractId, pageNumberFromUrl, pageSizeFromUrl, searchFromUrl]);

    const toggleExpand = (historyId: number) => {
        setExpandedIds((prev) => ({ ...prev, [historyId]: !prev[historyId] }));
    };

    // delete dialog
    const deleteMutation = useDeleteContractHistory();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleteTargetTime, setDeleteTargetTime] = useState<string>("");

    const askDelete = (historyId: number, timestamp: string) => {
        setDeleteTargetId(historyId);
        setDeleteTargetTime(timestamp);
        setDeleteOpen(true);
    };

    const closeDelete = () => {
        setDeleteOpen(false);
        setDeleteTargetId(null);
        setDeleteTargetTime("");
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        await deleteMutation.mutateAsync(deleteTargetId);
        closeDelete();
    };

    // ✅ chỉ dùng UPDATED + PLAIN
    const updatedText = useCallback(
        () => t("history.badge.updated", { defaultValue: isVI ? "CẬP NHẬT" : "UPDATED" }),
        [isVI, t]
    );

    const renderChangeLine = (c: ChangeItem, idx: number) => {
        if (c.kind === "plain") {
            return (
                <Stack key={`${c.path}-${idx}`} direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                    <Chip label={c.label} size="small" color="info" variant="outlined" sx={{ fontWeight: 900 }} />
                    <Chip label={formatValue(c.oldVal)} size="small" variant="outlined" />
                    <Typography sx={{ fontWeight: 900, opacity: 0.65 }}>→</Typography>
                    <Chip label={formatValue(c.newVal)} size="small" variant="outlined" />
                </Stack>
            );
        }

        if (c.kind === "nodiff") {
            // (thực tế đã filter rồi, nhưng giữ cho an toàn)
            return (
                <Stack key={`${c.path}-${idx}`} direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                    <Chip label={c.label} size="small" color="warning" variant="outlined" sx={{ fontWeight: 900 }} />
                </Stack>
            );
        }

        // diff -> ALWAYS UPDATED
        return (
            <Stack key={`${c.path}-${idx}`} direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                <Tooltip title={c.path} placement="top-start">
                    <Chip
                        label={c.label}
                        size="small"
                        sx={{
                            fontWeight: 900,
                            maxWidth: 240,
                            "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                        }}
                    />
                </Tooltip>

                <Tooltip title={String(c.oldVal ?? "")} placement="top-start">
                    <Chip
                        label={formatValue(c.oldVal)}
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{
                            fontWeight: 700,
                            textDecoration: "line-through",
                            maxWidth: 340,
                            "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                        }}
                    />
                </Tooltip>

                <Typography sx={{ fontWeight: 900, opacity: 0.65 }}>→</Typography>

                <Tooltip title={String(c.newVal ?? "")} placement="top-start">
                    <Chip
                        label={formatValue(c.newVal)}
                        size="small"
                        variant="outlined"
                        color="success"
                        sx={{
                            fontWeight: 900,
                            maxWidth: 340,
                            "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                        }}
                    />
                </Tooltip>

                <Chip label={updatedText()} size="small" color="primary" variant="outlined" sx={{ fontWeight: 900 }} />
            </Stack>
        );
    };

    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh", bgcolor: "background.default" }}>
            <NavMenu />

            <Box
                sx={{
                    flexGrow: 1,
                    width: "100%",
                    ml: { xs: 0, md: `${SIDEBAR_OFFSET}px` },
                    px: { xs: 2, sm: 3, md: 4 },
                    py: { xs: 2, md: 4 },
                }}
            >
                <Container maxWidth="lg" disableGutters>
                    {/* HEADER */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" sx={{ mb: 2.5 }}>
                        <Box>
                            <Stack direction="row" alignItems="center" gap={1}>
                                <HistoryIcon color="primary" />
                                <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} sx={{ lineHeight: 1.15 }}>
                                    {t("history.title", { defaultValue: isVI ? "Lịch sử hợp đồng" : "Contract History" })}
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {t("history.subtitle", { defaultValue: isVI ? "Xem change logs theo ContractId" : "View change logs by ContractId" })}
                            </Typography>
                        </Box>
                    </Stack>

                    {/* FILTER BAR */}
                    <Paper
                        sx={{
                            p: { xs: 2, sm: 2.5 },
                            borderRadius: "999px",
                            boxShadow: paperShadow,
                            mb: 3,
                            bgcolor: "background.paper",
                            border: `1px solid ${borderColor}`,
                        }}
                    >
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                            <TextField
                                size="small"
                                label={t("history.search", { defaultValue: isVI ? "Tìm kiếm" : "Search" })}
                                placeholder={t("history.searchPlaceholder", { defaultValue: isVI ? "Tìm field/giá trị..." : "Search fields/values..." })}
                                value={inputSearch}
                                onChange={(e) => setInputSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        if (!inputContractId.trim()) return;
                                        applyParams({
                                            contractId: inputContractId.trim(),
                                            search: inputSearch.trim(),
                                            pageNumber: 1,
                                        });
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: "text.secondary" }} fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flex: 1.3, minWidth: 240, "& .MuiOutlinedInput-root": { borderRadius: "999px" } }}
                            />

                            <Autocomplete
                                loading={isLoadingContracts}
                                options={contracts}
                                value={selectedContract}
                                onChange={(_, v: any | null) => {
                                    const nextId = v ? String(v.id) : "";
                                    setInputContractId(nextId);

                                    if (nextId) {
                                        applyParams({
                                            contractId: nextId,
                                            search: inputSearch.trim(),
                                            pageNumber: 1,
                                        });
                                    }
                                }}
                                getOptionLabel={(c: any) => (c ? `${c.contractNumber ?? ""} — ${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() : "")}
                                isOptionEqualToValue={(opt: any, val: any) => String(opt?.id) === String(val?.id)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        label={t("history.contractId", { defaultValue: isVI ? "ContractId" : "ContractId" })}
                                        placeholder={t("history.contractPlaceholder", { defaultValue: isVI ? "Chọn hợp đồng..." : "Select contract..." })}
                                        sx={{ flex: 1, minWidth: 280, "& .MuiOutlinedInput-root": { borderRadius: "999px" } }}
                                    />
                                )}
                            />

                            <TextField
                                size="small"
                                select
                                label={t("common.pageSize", { defaultValue: isVI ? "Số dòng" : "Page size" })}
                                value={pageSizeFromUrl}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                sx={{ width: { xs: "100%", md: 160 }, "& .MuiOutlinedInput-root": { borderRadius: "999px" } }}
                            >
                                {[10, 20, 50, 100].map((n) => (
                                    <MenuItem key={n} value={n}>
                                        {n}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button variant="contained" onClick={handleLoad} disabled={!inputContractId.trim()} sx={{ fontWeight: 900, borderRadius: "999px", px: 2.5 }}>
                                    {t("common.load", { defaultValue: isVI ? "TẢI" : "LOAD" })}
                                </Button>
                                <Button variant="outlined" onClick={handleClear} sx={{ fontWeight: 900, borderRadius: "999px" }}>
                                    {t("common.clear", { defaultValue: isVI ? "XÓA" : "CLEAR" })}
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* CONTENT */}
                    <Paper sx={{ borderRadius: "20px", overflow: "hidden", bgcolor: "background.paper", border: softBorder }}>
                        {/* header row */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" px={2.4} py={1.8} sx={{ bgcolor: "action.hover", borderBottom: `1px solid ${borderColor}` }}>
                            <Box>
                                <Stack direction="row" alignItems="center" gap={1}>
                                    <DescriptionOutlinedIcon fontSize="small" color="action" />
                                    <Typography fontWeight={900}>{t("history.sectionTitle", { defaultValue: isVI ? "Contract history" : "Contract history" })}</Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    ContractId: <b>{enabled ? contractId : "-"}</b>
                                    {enabled ? (
                                        <>
                                            {" "}
                                            • {t("history.totalRecords", { defaultValue: isVI ? "Tổng record" : "Total records" })}: <b>{totalCount}</b> •{" "}
                                            {t("history.totalChanges", { defaultValue: isVI ? "Tổng thay đổi" : "Total changes" })}: <b>{totalChanges}</b>
                                        </>
                                    ) : null}
                                </Typography>
                            </Box>
                            {isFetching ? <CircularProgress size={18} /> : null}
                        </Stack>

                        <Box p={2.2}>
                            {!enabled && (
                                <Typography color="text.secondary">
                                    {t("history.pickContract", { defaultValue: isVI ? "Chọn hợp đồng để xem lịch sử." : "Select a contract to view history." })}
                                </Typography>
                            )}

                            {enabled && isError && (
                                <Typography color="error">
                                    {t("history.loadError", { defaultValue: isVI ? "Không tải được lịch sử:" : "Failed to load history:" })} {(error as any)?.message || ""}
                                </Typography>
                            )}

                            {enabled && isLoading && (
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 6, justifyContent: "center" }}>
                                    <CircularProgress size={22} />
                                    <Typography color="text.secondary">{t("common.loading", { defaultValue: isVI ? "Đang tải..." : "Loading..." })}</Typography>
                                </Stack>
                            )}

                            {enabled && !isLoading && !isError && clientFilteredGroups.length === 0 && (
                                <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }} spacing={1}>
                                    <DescriptionOutlinedIcon sx={{ opacity: 0.25, fontSize: 54 }} />
                                    <Typography color="text.secondary">{t("history.noResults", { defaultValue: isVI ? "Không tìm thấy thay đổi nào." : "No changes found." })}</Typography>
                                </Stack>
                            )}

                            {/* DESKTOP */}
                            {enabled && !isLoading && !isError && clientFilteredGroups.length > 0 && !isMobile && (
                                <TableContainer sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.35)}` }}>
                                    <Table size="medium">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: alpha(theme.palette.common.black, isDark ? 0.2 : 0.03) }}>
                                                <TableCell sx={{ fontWeight: 900, color: "text.secondary", width: 56 }} />
                                                <TableCell sx={{ fontWeight: 900, color: "text.secondary", width: 260 }}>
                                                    {t("history.time", { defaultValue: isVI ? "THỜI GIAN" : "TIMESTAMP" })}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 900, color: "text.secondary" }}>
                                                    {t("history.summary", { defaultValue: isVI ? "TÓM TẮT THAY ĐỔI" : "CHANGE SUMMARY" })}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 900, color: "text.secondary", width: 140 }}>
                                                    {t("common.actions", { defaultValue: isVI ? "THAO TÁC" : "ACTIONS" })}
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {clientFilteredGroups.map((g) => {
                                                const open = !!expandedIds[g.historyId];
                                                const hasPlain = g.changes.some((c) => c.kind === "plain");

                                                return (
                                                    <Fragment key={g.historyId}>
                                                        <TableRow hover sx={{ "&:hover": { bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.04) } }}>
                                                            <TableCell sx={{ width: 56 }}>
                                                                <IconButton size="small" onClick={() => toggleExpand(g.historyId)}>
                                                                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                                </IconButton>
                                                            </TableCell>

                                                            <TableCell>
                                                                <Stack>
                                                                    <Typography fontWeight={900}>{formatDateTime(g.timestamp)}</Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                                                        ID: {g.historyId} • {g.changes.length} {t("history.changes", { defaultValue: isVI ? "thay đổi" : "changes" })}
                                                                    </Typography>
                                                                </Stack>
                                                            </TableCell>

                                                            <TableCell>
                                                                <Stack direction="row" alignItems="center" gap={1} sx={{ flexWrap: "wrap" }}>
                                                                    <Chip
                                                                        size="small"
                                                                        label={buildSummary(g.changes)}
                                                                        sx={{
                                                                            fontWeight: 900,
                                                                            maxWidth: 520,
                                                                            "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                                                                        }}
                                                                    />
                                                                    {hasPlain ? <Chip label="PLAIN" size="small" color="info" variant="outlined" /> : null}
                                                                </Stack>
                                                            </TableCell>

                                                            <TableCell align="right">
                                                                <Tooltip title={t("history.delete", { defaultValue: isVI ? "Xóa record" : "Delete record" })}>
                                                                    <span>
                                                                        <IconButton size="small" color="error" onClick={() => askDelete(g.historyId, g.timestamp)} disabled={deleteMutation.isPending}>
                                                                            <DeleteOutlineIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>

                                                        <TableRow>
                                                            <TableCell colSpan={4} sx={{ pt: 0, pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.35)}` }}>
                                                                <Collapse in={open} timeout="auto" unmountOnExit>
                                                                    <Paper
                                                                        variant="outlined"
                                                                        sx={{
                                                                            mt: 1,
                                                                            p: 1.5,
                                                                            borderRadius: 3,
                                                                            borderColor: alpha(theme.palette.divider, 0.35),
                                                                            bgcolor: alpha(theme.palette.common.black, isDark ? 0.18 : 0.02),
                                                                        }}
                                                                    >
                                                                        <Stack spacing={1}>
                                                                            <Typography fontWeight={900} sx={{ mb: 0.5 }}>
                                                                                {t("history.detail", { defaultValue: isVI ? "Chi tiết thay đổi" : "Change details" })}
                                                                            </Typography>
                                                                            {g.changes.map(renderChangeLine)}
                                                                        </Stack>
                                                                    </Paper>
                                                                </Collapse>
                                                            </TableCell>
                                                        </TableRow>
                                                    </Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {/* MOBILE */}
                            {enabled && !isLoading && !isError && clientFilteredGroups.length > 0 && isMobile && (
                                <Stack spacing={1.2}>
                                    {clientFilteredGroups.map((g) => {
                                        const open = !!expandedIds[g.historyId];
                                        const hasPlain = g.changes.some((c) => c.kind === "plain");

                                        return (
                                            <Card key={g.historyId} variant="outlined" sx={{ borderRadius: 3, borderColor: alpha(theme.palette.divider, 0.6) }}>
                                                <CardContent sx={{ p: 2 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography fontWeight={900}>{formatDateTime(g.timestamp)}</Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                                                ID: {g.historyId} • {g.changes.length} {t("history.changes", { defaultValue: isVI ? "thay đổi" : "changes" })}
                                                            </Typography>
                                                        </Box>

                                                        <Stack direction="row" alignItems="center" gap={0.5}>
                                                            <IconButton onClick={() => toggleExpand(g.historyId)} size="small">
                                                                {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                                                            </IconButton>
                                                            <IconButton onClick={() => askDelete(g.historyId, g.timestamp)} size="small" color="error" disabled={deleteMutation.isPending}>
                                                                <DeleteOutlineIcon fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    </Stack>

                                                    <Divider sx={{ my: 1.2 }} />

                                                    <Stack direction="row" alignItems="center" gap={1} sx={{ flexWrap: "wrap" }}>
                                                        <Chip label={buildSummary(g.changes)} size="small" sx={{ fontWeight: 900 }} />
                                                        {hasPlain ? <Chip label="PLAIN" size="small" color="info" variant="outlined" /> : null}
                                                    </Stack>

                                                    <Collapse in={open} timeout="auto" unmountOnExit>
                                                        <Divider sx={{ my: 1.2 }} />
                                                        <Stack spacing={1}>{g.changes.map(renderChangeLine)}</Stack>
                                                    </Collapse>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            )}

                            {/* Pagination */}
                            {enabled && !isLoading && !isError && totalPages > 1 && (
                                <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={1.2} mt={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t("common.page", { defaultValue: isVI ? "Trang" : "Page" })} <b>{pageNumberFromUrl}</b> / <b>{totalPages}</b>
                                    </Typography>
                                    <Pagination page={pageNumberFromUrl} count={totalPages} onChange={handlePageChange} color="primary" size={isMobile ? "small" : "medium"} />
                                </Stack>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Note */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1.5,
                                    borderRadius: 3,
                                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06),
                                    borderColor: alpha(theme.palette.primary.main, isDark ? 0.25 : 0.18),
                                }}
                            >
                                <Stack direction="row" alignItems="flex-start" gap={1.2}>
                                    <HistoryIcon color="primary" sx={{ mt: 0.2 }} />
                                    <Box>
                                        <Typography fontWeight={900} variant="body2">
                                            {t("common.note", { defaultValue: isVI ? "Ghi chú" : "Note" })}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t("history.note", {
                                                defaultValue: isVI
                                                    ? "FE đã ẩn record 'No field changes' (nodiff) để tránh trùng dòng. Nếu vẫn bị trùng, backend đang log 2 lần."
                                                    : "FE hides 'No field changes' (nodiff) records to avoid duplicates. If duplication persists, backend logs twice.",
                                            })}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Box>
                    </Paper>

                    {/* DELETE CONFIRM DIALOG */}
                    <Dialog open={deleteOpen} onClose={closeDelete} fullWidth maxWidth="xs">
                        <DialogTitle sx={{ fontWeight: 900 }}>
                            {t("history.deleteTitle", { defaultValue: isVI ? "Xóa Contract History?" : "Delete Contract History?" })}
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" color="text.secondary">
                                {t("history.deleteConfirm", { defaultValue: isVI ? "Bạn chắc chắn muốn xóa record này không?" : "Are you sure you want to delete this record?" })}
                            </Typography>

                            <Paper variant="outlined" sx={{ mt: 1.5, p: 1.2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, isDark ? 0.08 : 0.03) }}>
                                <Typography fontWeight={900}>ID: {deleteTargetId ?? "-"}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t("history.time", { defaultValue: isVI ? "Thời gian" : "Time" })}: {deleteTargetTime ? formatDateTime(deleteTargetTime) : "-"}
                                </Typography>
                            </Paper>

                            {deleteMutation.isError ? (
                                <Typography sx={{ mt: 1.5 }} color="error">
                                    {t("history.deleteFailed", { defaultValue: isVI ? "Xóa thất bại:" : "Delete failed:" })} {(deleteMutation.error as any)?.message || ""}
                                </Typography>
                            ) : null}
                        </DialogContent>

                        <DialogActions sx={{ px: 2, pb: 2 }}>
                            <Button onClick={closeDelete} variant="outlined" sx={{ fontWeight: 900 }}>
                                {t("common.cancel", { defaultValue: isVI ? "Hủy" : "Cancel" })}
                            </Button>

                            <Button
                                onClick={confirmDelete}
                                color="error"
                                variant="contained"
                                sx={{ fontWeight: 900 }}
                                startIcon={deleteMutation.isPending ? <CircularProgress size={16} /> : <DeleteOutlineIcon />}
                                disabled={deleteMutation.isPending}
                            >
                                {t("common.delete", { defaultValue: isVI ? "Xóa" : "Delete" })}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Container>
            </Box>
        </Box>
    );
}
