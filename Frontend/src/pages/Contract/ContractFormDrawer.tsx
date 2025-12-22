// src/components/ContractFormDrawer/ContractFormDrawer.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Drawer,
    Box,
    Typography,
    TextField,
    MenuItem,
    Button,
    Divider,
    CircularProgress,
    Stack,
    Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { useResellers } from "@/hooks/useResellers";
import { useAddresses } from "@/hooks/useAddresses";
import { useContract, useCreateContract, useUpdateContract } from "@/hooks/useContracts";

type Props = {
    open: boolean;
    mode: "create" | "edit";
    id?: number | null;
    onClose: () => void;
    onSuccess?: () => void;
};

type FormState = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName: string;
    bankAccountNumber: string;
    startDate: string; // yyyy-mm-dd
    endDate: string;   // yyyy-mm-dd
    resellerId: string;
    addressId: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

// ====== LIMITS ======
const MAX_FULLNAME = 50;
const MAX_EMAIL = 100;
const MIN_PHONE_DIGITS = 9;
const MAX_PHONE_DIGITS = 10;
const MAX_COMPANY = 100;
const MAX_BANK = 20;

// ====== VALIDATORS ======
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSON_NAME_ALLOWED = /^[\p{L}\s'-]+$/u;

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

/**
 * ISO (có timezone) -> yyyy-mm-dd theo LOCAL timezone (fix lệch -1 ngày khi Edit)
 */
function isoToLocalDateInput(iso?: string | null) {
    if (!iso) return "";
    const s = String(iso).trim();
    if (!s) return "";

    // nếu backend trả thẳng "YYYY-MM-DD"
    const m = s.match(/^\d{4}-\d{2}-\d{2}$/);
    if (m) return m[0];

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) {
        const m2 = s.match(/^\d{4}-\d{2}-\d{2}/);
        return m2 ? m2[0] : "";
    }

    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * yyyy-mm-dd -> ISO tại 00:00:00Z (UTC midnight) để backend lưu không lệch ngày
 */
function dateInputToUtcIso(dateStr: string) {
    const s = (dateStr || "").trim();
    if (!s) return "";
    const parts = s.split("-").map((x) => Number(x));
    if (parts.length !== 3) return "";
    const [y, m, d] = parts;
    if (!y || !m || !d) return "";
    const utc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    return utc.toISOString();
}

function isValidDateInput(dateStr: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return false;
    const utc = new Date(Date.UTC(y, m - 1, d));
    return (
        utc.getUTCFullYear() === y &&
        utc.getUTCMonth() === m - 1 &&
        utc.getUTCDate() === d
    );
}

function countDigits(s: string) {
    return (s.match(/\d/g) || []).length;
}

function fullNameLength(firstName?: string, lastName?: string) {
    const f = (firstName ?? "").trim();
    const l = (lastName ?? "").trim();
    if (!f && !l) return 0;
    return f.length + (f && l ? 1 : 0) + l.length;
}

function sanitizePersonName(raw: string) {
    let s = String(raw ?? "");
    s = s.replace(/\s+/g, " ");
    try {
        s = s.replace(/[^\p{L}\s'-]/gu, "");
    } catch {
        s = s.replace(/[^A-Za-zÀ-ỹ\s'-]/g, "");
    }
    s = s.replace(/\s+/g, " ").trim();
    return s;
}

function sanitizeEmail(raw: string) {
    let s = String(raw ?? "");
    s = s.trimStart();
    if (s.length > MAX_EMAIL) s = s.slice(0, MAX_EMAIL);
    return s;
}

function sanitizeCompany(raw: string) {
    let s = String(raw ?? "");
    s = s.replace(/\s+/g, " ").trim();
    if (s.length > MAX_COMPANY) s = s.slice(0, MAX_COMPANY);
    return s;
}

/**
 * enforce tổng fullname <= 50
 */
function enforceFullNameLimit(
    _field: "firstName" | "lastName",
    incoming: string,
    otherFieldValue: string
) {
    const other = (otherFieldValue ?? "").trim();
    let current = (incoming ?? "").trim();

    const space = current && other ? 1 : 0;
    const allowed = MAX_FULLNAME - other.length - space;

    if (allowed <= 0) return "";
    if (current.length > allowed) current = current.slice(0, allowed);
    return current;
}

// ✅ Pure validator: KHÔNG setState ở đây
function getErrors(next: FormState): FieldErrors {
    const e: FieldErrors = {};

    const fn = next.firstName.trim();
    const ln = next.lastName.trim();

    if (!fn) e.firstName = "First Name is required";
    else if (!PERSON_NAME_ALLOWED.test(fn))
        e.firstName = "First Name only allows letters, space, ' and -";

    if (!ln) e.lastName = "Last Name is required";
    else if (!PERSON_NAME_ALLOWED.test(ln))
        e.lastName = "Last Name only allows letters, space, ' and -";

    if (fn && ln) {
        const len = fullNameLength(fn, ln);
        if (len > MAX_FULLNAME) {
            e.firstName = `Full name (First + Last) max ${MAX_FULLNAME} characters`;
            e.lastName = `Full name (First + Last) max ${MAX_FULLNAME} characters`;
        }
    }

    const em = next.email.trim();
    if (!em) e.email = "Email is required";
    else if (em.length > MAX_EMAIL) e.email = `Email max ${MAX_EMAIL} characters`;
    else if (!EMAIL_REGEX.test(em)) e.email = "Invalid Email";

    const phone = next.phone.trim();
    if (!phone) e.phone = "Phone is required";
    else {
        const digits = countDigits(phone);
        if (digits < MIN_PHONE_DIGITS)
            e.phone = `Phone must contain at least ${MIN_PHONE_DIGITS} digits`;
        else if (digits > MAX_PHONE_DIGITS)
            e.phone = `Phone must contain at most ${MAX_PHONE_DIGITS} digits`;
    }

    const company = next.companyName.trim();
    if (!company) e.companyName = "Company Name is required";
    else if (company.length > MAX_COMPANY)
        e.companyName = `Company Name max ${MAX_COMPANY} characters`;

    const bank = next.bankAccountNumber.trim();
    if (!bank) e.bankAccountNumber = "Bank Account Number is required";
    else if (bank.length > MAX_BANK) e.bankAccountNumber = `Bank Account Number max ${MAX_BANK} characters`;
    else if (!/^\d+$/.test(bank)) e.bankAccountNumber = "Bank Account Number must contain digits only";

    if (!next.resellerId || Number(next.resellerId) <= 0) e.resellerId = "Reseller is required";
    if (!next.addressId || Number(next.addressId) <= 0) e.addressId = "Address is required";

    if (!next.startDate) e.startDate = "Start Date is required";
    else if (!isValidDateInput(next.startDate)) e.startDate = "Invalid Start Date";

    if (!next.endDate) e.endDate = "End Date is required";
    else if (!isValidDateInput(next.endDate)) e.endDate = "Invalid End Date";

    if (next.startDate && next.endDate && isValidDateInput(next.startDate) && isValidDateInput(next.endDate)) {
        const s = new Date(dateInputToUtcIso(next.startDate));
        const en = new Date(dateInputToUtcIso(next.endDate));
        if (!Number.isNaN(s.getTime()) && !Number.isNaN(en.getTime()) && en < s) {
            e.endDate = "End Date must be greater than or equal to Start Date";
        }
    }

    return e;
}

export default function ContractFormDrawer({ open, mode, id, onClose, onSuccess }: Props) {
    const { t } = useTranslation();
    const isEdit = mode === "edit";

    const createMutation = useCreateContract();
    const updateMutation = useUpdateContract();

    const { data: resellerData, isLoading: resellerLoading } = useResellers({
        pageNumber: 1,
        pageSize: 200,
    });
    const resellers = resellerData?.items ?? [];

    const { data: addressData, isLoading: addressLoading } = useAddresses({
        pageNumber: 1,
        pageSize: 200,
    });
    const addresses = addressData?.items ?? [];

    const contractId = isEdit && id ? Number(id) : 0;
    const { data: contractData, isLoading: contractLoading } = useContract(contractId);

    const [form, setForm] = useState<FormState>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        companyName: "",
        bankAccountNumber: "",
        startDate: "",
        endDate: "",
        resellerId: "",
        addressId: "",
    });

    // ✅ để “chưa nhập gì” không đỏ
    const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
    const [submitted, setSubmitted] = useState(false);

    const allErrors = useMemo(() => getErrors(form), [form]);
    const showError = (field: keyof FormState) => submitted || !!touched[field];
    const fieldError = (field: keyof FormState) => (showError(field) ? allErrors[field] : undefined);

    // chặn paste ký tự lạ
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const name = (e.target as HTMLInputElement).name as keyof FormState;
        const text = e.clipboardData.getData("text");

        if (name === "bankAccountNumber" && /\D/.test(text)) e.preventDefault();
        if (name === "phone" && /\D/.test(text)) e.preventDefault();

        if (name === "firstName" || name === "lastName") {
            try {
                if (/[^\p{L}\s'-]/u.test(text)) e.preventDefault();
            } catch {
                if (/[^A-Za-zÀ-ỹ\s'-]/.test(text)) e.preventDefault();
            }
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const name = e.target.name as keyof FormState;
        setTouched((prev) => ({ ...prev, [name]: true }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name as keyof FormState;
        let value = e.target.value;

        setForm((prev) => {
            const next = { ...prev };

            if (name === "firstName") {
                value = sanitizePersonName(value);
                value = enforceFullNameLimit("firstName", value, prev.lastName);
                next.firstName = value;
            } else if (name === "lastName") {
                value = sanitizePersonName(value);
                value = enforceFullNameLimit("lastName", value, prev.firstName);
                next.lastName = value;
            } else if (name === "email") {
                value = sanitizeEmail(value);
                next.email = value;
            } else if (name === "phone") {
                value = value.replace(/\D/g, "");
                if (value.length > MAX_PHONE_DIGITS) value = value.slice(0, MAX_PHONE_DIGITS);
                next.phone = value;
            } else if (name === "companyName") {
                value = sanitizeCompany(value);
                next.companyName = value;
            } else if (name === "bankAccountNumber") {
                value = value.replace(/\D/g, "");
                if (value.length > MAX_BANK) value = value.slice(0, MAX_BANK);
                next.bankAccountNumber = value;
            } else {
                (next as any)[name] = value;
            }

            return next as FormState;
        });
    };

    const canSubmit = useMemo(() => Object.keys(allErrors).length === 0, [allErrors]);

    useEffect(() => {
        if (!open) return;

        setTouched({});
        setSubmitted(false);

        if (!isEdit) {
            setForm({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                companyName: "",
                bankAccountNumber: "",
                startDate: "",
                endDate: "",
                resellerId: "",
                addressId: "",
            });
            return;
        }

        if (isEdit && contractData) {
            const rawFirst = sanitizePersonName(contractData.firstName ?? "");
            const rawLast = sanitizePersonName(contractData.lastName ?? "");

            const fixedFirst = enforceFullNameLimit("firstName", rawFirst, rawLast);
            const fixedLast = enforceFullNameLimit("lastName", rawLast, fixedFirst);

            setForm({
                firstName: fixedFirst,
                lastName: fixedLast,
                email: sanitizeEmail(contractData.email ?? ""),
                phone: String(contractData.phone ?? "").replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS),
                companyName: sanitizeCompany(contractData.companyName ?? ""),
                bankAccountNumber: String(contractData.bankAccountNumber ?? "").replace(/\D/g, "").slice(0, MAX_BANK),

                // ✅ FIX: ISO -> LOCAL yyyy-mm-dd (không còn bị -1 ngày)
                startDate: isoToLocalDateInput(contractData.startDate),
                endDate: isoToLocalDateInput(contractData.endDate),

                resellerId: contractData.resellerId != null ? String(contractData.resellerId) : "",
                addressId: contractData.addressId != null ? String(contractData.addressId) : "",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, isEdit, contractData]);

    const loading = resellerLoading || addressLoading || (isEdit && contractLoading);

    const handleSubmit = () => {
        setSubmitted(true);
        if (Object.keys(allErrors).length > 0) return;

        const payload: any = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            companyName: form.companyName.trim(),
            bankAccountNumber: form.bankAccountNumber.trim(),
            resellerId: Number(form.resellerId) || 0,
            addressId: Number(form.addressId) || 0,

            // ✅ FIX: yyyy-mm-dd -> ISO UTC midnight (backend lưu không lệch)
            startDate: form.startDate ? dateInputToUtcIso(form.startDate) : null,
            endDate: form.endDate ? dateInputToUtcIso(form.endDate) : null,

            pdfLink: contractData?.pdfLink || "",
            contractNumber: contractData?.contractNumber || "AUTO-" + Date.now(),
        };

        const onDone = () => {
            toast.success(
                isEdit
                    ? t("contractEdit.toast.updated", { defaultValue: "Updated" })
                    : t("contractCreate.toast.created", { defaultValue: "Created" })
            );
            onSuccess?.();
            onClose();
        };

        const onFail = (err: any) => {
            console.error("SAVE ERROR:", err);
            toast.error(
                isEdit
                    ? t("contractEdit.toast.updateFailed", { defaultValue: "Update failed" })
                    : t("contractCreate.toast.createFailed", { defaultValue: "Create failed" })
            );
        };

        if (isEdit && id) {
            updateMutation.mutate({ id: Number(id), data: payload } as any, {
                onSuccess: onDone,
                onError: onFail,
            });
        } else {
            createMutation.mutate(payload, { onSuccess: onDone, onError: onFail });
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}
        >
            <Box sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={900}>
                    {isEdit
                        ? t("contractEdit.title", { defaultValue: "Edit Contract" })
                        : t("contractCreate.title", { defaultValue: "Create Contract" })}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t("contractCreate.subtitle", { defaultValue: "Fill in the details below." })}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {loading ? (
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                        <CircularProgress size={18} />
                        <Typography color="text.secondary">
                            {t("Loading...", { defaultValue: "Loading..." })}
                        </Typography>
                    </Stack>
                ) : (
                    <Stack spacing={1.5}>
                        <TextField
                            label={t("contractCreate.firstName", { defaultValue: "First name" })}
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onPaste={handlePaste}
                            error={!!fieldError("firstName")}
                            helperText={fieldError("firstName")}
                            inputProps={{ maxLength: MAX_FULLNAME }}
                            fullWidth
                        />

                        <TextField
                            label={t("contractCreate.lastName", { defaultValue: "Last name" })}
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onPaste={handlePaste}
                            error={!!fieldError("lastName")}
                            helperText={fieldError("lastName")}
                            inputProps={{ maxLength: MAX_FULLNAME }}
                            fullWidth
                        />

                        <TextField
                            label={t("contractCreate.email", { defaultValue: "Email" })}
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!fieldError("email")}
                            helperText={fieldError("email")}
                            inputProps={{ maxLength: MAX_EMAIL }}
                            fullWidth
                        />

                        <TextField
                            label={t("contractCreate.phone", { defaultValue: "Phone" })}
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onPaste={handlePaste}
                            error={!!fieldError("phone")}
                            helperText={fieldError("phone")}
                            inputProps={{ inputMode: "numeric", maxLength: MAX_PHONE_DIGITS }}
                            fullWidth
                        />

                        <Stack direction="row" spacing={1.5}>
                            <TextField
                                type="date"
                                label={t("contractCreate.startDate", { defaultValue: "Start date" })}
                                name="startDate"
                                value={form.startDate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={!!fieldError("startDate")}
                                helperText={fieldError("startDate")}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />

                            <TextField
                                type="date"
                                label={t("contractCreate.endDate", { defaultValue: "End date" })}
                                name="endDate"
                                value={form.endDate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={!!fieldError("endDate")}
                                helperText={fieldError("endDate")}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Stack>

                        <TextField
                            label={t("contractCreate.companyName", { defaultValue: "Company name" })}
                            name="companyName"
                            value={form.companyName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!fieldError("companyName")}
                            helperText={fieldError("companyName")}
                            inputProps={{ maxLength: MAX_COMPANY }}
                            fullWidth
                        />

                        <TextField
                            label={t("contractCreate.bankAccountNumber", { defaultValue: "Bank account number" })}
                            name="bankAccountNumber"
                            value={form.bankAccountNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onPaste={handlePaste}
                            error={!!fieldError("bankAccountNumber")}
                            helperText={fieldError("bankAccountNumber")}
                            inputProps={{ inputMode: "numeric", maxLength: MAX_BANK }}
                            fullWidth
                        />

                        <TextField
                            select
                            label={t("contractCreate.reseller", { defaultValue: "Reseller" })}
                            name="resellerId"
                            value={form.resellerId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!fieldError("resellerId")}
                            helperText={fieldError("resellerId")}
                            fullWidth
                        >
                            {resellers.map((r: any) => (
                                <MenuItem key={r.id} value={String(r.id)}>
                                    {r.name ?? r.resellerName ?? `#${r.id}`}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label={t("contractCreate.address", { defaultValue: "Address" })}
                            name="addressId"
                            value={form.addressId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!fieldError("addressId")}
                            helperText={fieldError("addressId")}
                            fullWidth
                        >
                            {addresses.map((a: any) => (
                                <MenuItem key={a.id} value={String(a.id)}>
                                    {a.zipCode} {a.houseNumber}
                                    {a.extension ? `-${a.extension}` : ""}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Tooltip title="Fix timezone: Edit không bị -1 ngày, Submit lưu UTC midnight">
                            <Typography variant="caption" color="text.secondary">
                                ✅ Date handling fixed (timezone-safe)
                            </Typography>
                        </Tooltip>
                    </Stack>
                )}

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                    <Button variant="text" onClick={onClose}>
                        {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!canSubmit || createMutation.isPending || updateMutation.isPending}
                        sx={{ fontWeight: 900 }}
                    >
                        {isEdit
                            ? updateMutation.isPending
                                ? t("Saving...", { defaultValue: "Saving..." })
                                : t("common.save", { defaultValue: "Save" })
                            : createMutation.isPending
                                ? t("Creating...", { defaultValue: "Creating..." })
                                : t("common.create", { defaultValue: "Create" })}
                    </Button>
                </Stack>
            </Box>
        </Drawer>
    );
}
