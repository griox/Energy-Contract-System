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
    endDate: string; // yyyy-mm-dd
    resellerId: string; // select string
    addressId: string; // select string
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

// ====== LIMITS ======
const MAX_FULLNAME = 50;     // ✅ yêu cầu của bạn: first + space + last <= 50
const MAX_EMAIL = 100;
const MIN_PHONE_DIGITS = 9;
const MAX_PHONE_DIGITS = 10; // ✅ theo yêu cầu bạn
const MAX_COMPANY = 100;
const MAX_BANK = 20;         // ✅ theo yêu cầu bạn

// ====== VALIDATORS ======
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ✅ Tên: chỉ CHỮ (unicode) + space + ' + -
const PERSON_NAME_ALLOWED = /^[\p{L}\s'-]+$/u;

function toDateInputValue(iso?: string) {
    if (!iso) return "";
    return String(iso).split("T")[0] ?? "";
}

function parseLocalDate(dateStr: string) {
    return new Date(`${dateStr}T00:00:00`);
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

// sanitize tên: bỏ ký tự lạ, gom space
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
 * ✅ enforce tổng fullname <= 50
 * - Khi sửa firstName: cắt firstName theo lastName hiện tại
 * - Khi sửa lastName: cắt lastName theo firstName hiện tại
 */
function enforceFullNameLimit(
    _field: "firstName" | "lastName",
    incoming: string,
    otherFieldValue: string
) {
    const other = (otherFieldValue ?? "").trim();
    let current = (incoming ?? "").trim();

    // nếu field đang gõ có ký tự và other cũng có => có 1 dấu cách
    const space = current && other ? 1 : 0;

    const allowed = MAX_FULLNAME - other.length - space;
    if (allowed <= 0) return ""; // không còn chỗ

    if (current.length > allowed) current = current.slice(0, allowed);
    return current;
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

    const [errors, setErrors] = useState<FieldErrors>({});

    const validate = (next: FormState) => {
        const e: FieldErrors = {};

        // ===== FULL NAME (combined <= 50) =====
        const fn = next.firstName.trim();
        const ln = next.lastName.trim();

        if (!fn) e.firstName = "First Name is required";
        else if (!PERSON_NAME_ALLOWED.test(fn)) e.firstName = "First Name only allows letters, space, ' and -";

        if (!ln) e.lastName = "Last Name is required";
        else if (!PERSON_NAME_ALLOWED.test(ln)) e.lastName = "Last Name only allows letters, space, ' and -";

        if (fn && ln) {
            const len = fullNameLength(fn, ln);
            if (len > MAX_FULLNAME) {
                // gắn lỗi cho cả 2 để người dùng thấy rõ
                e.firstName = `Full name (First + Last) max ${MAX_FULLNAME} characters`;
                e.lastName = `Full name (First + Last) max ${MAX_FULLNAME} characters`;
            }
        }

        // ===== email =====
        const em = next.email.trim();
        if (!em) e.email = "Email is required";
        else if (em.length > MAX_EMAIL) e.email = `Email max ${MAX_EMAIL} characters`;
        else if (!EMAIL_REGEX.test(em)) e.email = "Invalid Email";

        // ===== phone (digits only, 9..10 digits) =====
        const phone = next.phone.trim();
        if (!phone) e.phone = "Phone is required";
        else {
            const digits = countDigits(phone);
            if (digits < MIN_PHONE_DIGITS) e.phone = `Phone must contain at least ${MIN_PHONE_DIGITS} digits`;
            else if (digits > MAX_PHONE_DIGITS) e.phone = `Phone must contain at most ${MAX_PHONE_DIGITS} digits`;
        }

        // ===== company =====
        const company = next.companyName.trim();
        if (!company) e.companyName = "Company Name is required";
        else if (company.length > MAX_COMPANY) e.companyName = `Company Name max ${MAX_COMPANY} characters`;

        // ===== bank (digits-only, max 20) =====
        const bank = next.bankAccountNumber.trim();
        if (!bank) e.bankAccountNumber = "Bank Account Number is required";
        else if (bank.length > MAX_BANK) e.bankAccountNumber = `Bank Account Number max ${MAX_BANK} characters`;
        else if (!/^\d+$/.test(bank)) e.bankAccountNumber = "Bank Account Number must contain digits only";

        // ===== reseller/address =====
        if (!next.resellerId || Number(next.resellerId) <= 0) e.resellerId = "Reseller is required";
        if (!next.addressId || Number(next.addressId) <= 0) e.addressId = "Address is required";

        // ===== dates =====
        if (!next.startDate) e.startDate = "Start Date is required";
        if (!next.endDate) e.endDate = "End Date is required";

        if (next.startDate) {
            const d = parseLocalDate(next.startDate);
            if (Number.isNaN(d.getTime())) e.startDate = "Invalid Start Date";
        }
        if (next.endDate) {
            const d = parseLocalDate(next.endDate);
            if (Number.isNaN(d.getTime())) e.endDate = "Invalid End Date";
        }

        if (next.startDate && next.endDate) {
            const start = parseLocalDate(next.startDate);
            const end = parseLocalDate(next.endDate);
            if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
                e.endDate = "End Date must be greater than or equal to Start Date";
            }
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ✅ chặn paste ký tự lạ
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const name = (e.target as HTMLInputElement).name as keyof FormState;
        const text = e.clipboardData.getData("text");

        if (name === "bankAccountNumber") {
            if (/\D/.test(text)) e.preventDefault();
        }

        if (name === "phone") {
            if (/\D/.test(text)) e.preventDefault(); // digits-only
        }

        if (name === "firstName" || name === "lastName") {
            try {
                if (/[^\p{L}\s'-]/u.test(text)) e.preventDefault();
            } catch {
                if (/[^A-Za-zÀ-ỹ\s'-]/.test(text)) e.preventDefault();
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name as keyof FormState;
        let value = e.target.value;

        setForm((prev) => {
            const next = { ...prev };

            // ===== first/last with combined max 50 =====
            if (name === "firstName") {
                value = sanitizePersonName(value);
                value = enforceFullNameLimit("firstName", value, prev.lastName);
                next.firstName = value;
            } else if (name === "lastName") {
                value = sanitizePersonName(value);
                value = enforceFullNameLimit("lastName", value, prev.firstName);
                next.lastName = value;
            }

            // ===== email =====
            else if (name === "email") {
                value = sanitizeEmail(value);
                next.email = value;
            }

            // ===== phone digits-only, max 10 digits =====
            else if (name === "phone") {
                value = value.replace(/\D/g, ""); // chỉ số
                if (value.length > MAX_PHONE_DIGITS) value = value.slice(0, MAX_PHONE_DIGITS);
                next.phone = value;
            }

            // ===== company =====
            else if (name === "companyName") {
                value = sanitizeCompany(value);
                next.companyName = value;
            }

            // ===== bank digits-only, max 20 =====
            else if (name === "bankAccountNumber") {
                value = value.replace(/\D/g, "");
                if (value.length > MAX_BANK) value = value.slice(0, MAX_BANK);
                next.bankAccountNumber = value;
            }

            // ===== other fields =====
            else {
                (next as any)[name] = value;
            }

            validate(next);
            return next as FormState;
        });
    };

    const canSubmit = useMemo(() => {
        if (!form.firstName.trim()) return false;
        if (!form.lastName.trim()) return false;

        // ✅ full name combined
        if (fullNameLength(form.firstName, form.lastName) > MAX_FULLNAME) return false;

        if (!form.email.trim()) return false;
        if (!form.phone.trim()) return false;
        if (!form.companyName.trim()) return false;
        if (!form.bankAccountNumber.trim()) return false;
        if (!form.startDate || !form.endDate) return false;
        if (!form.resellerId || Number(form.resellerId) <= 0) return false;
        if (!form.addressId || Number(form.addressId) <= 0) return false;

        if (
            errors.firstName ||
            errors.lastName ||
            errors.email ||
            errors.phone ||
            errors.companyName ||
            errors.bankAccountNumber ||
            errors.startDate ||
            errors.endDate ||
            errors.resellerId ||
            errors.addressId
        ) return false;

        return true;
    }, [form, errors]);

    useEffect(() => {
        if (!open) return;

        setErrors({});

        if (!isEdit) {
            const next: FormState = {
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
            };
            setForm(next);
         
            return;
        }

        if (isEdit && contractData) {
            const rawFirst = sanitizePersonName(contractData.firstName ?? "");
            const rawLast = sanitizePersonName(contractData.lastName ?? "");

            // ✅ enforce combined max 50 cho data edit luôn
            const fixedFirst = enforceFullNameLimit("firstName", rawFirst, rawLast);
            const fixedLast = enforceFullNameLimit("lastName", rawLast, fixedFirst);

            const next: FormState = {
                firstName: fixedFirst,
                lastName: fixedLast,
                email: sanitizeEmail(contractData.email ?? ""),
                phone: String(contractData.phone ?? "").replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS),
                companyName: sanitizeCompany(contractData.companyName ?? ""),
                bankAccountNumber: String(contractData.bankAccountNumber ?? "").replace(/\D/g, "").slice(0, MAX_BANK),
                startDate: toDateInputValue(contractData.startDate),
                endDate: toDateInputValue(contractData.endDate),
                resellerId: contractData.resellerId != null ? String(contractData.resellerId) : "",
                addressId: contractData.addressId != null ? String(contractData.addressId) : "",
            };

            setForm(next);
            validate(next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, isEdit, contractData]);

    const loading = resellerLoading || addressLoading || (isEdit && contractLoading);

    const handleSubmit = () => {
        const ok = validate(form);
        if (!ok) return;

        const payload: any = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            companyName: form.companyName.trim(),
            bankAccountNumber: form.bankAccountNumber.trim(),
            resellerId: Number(form.resellerId) || 0,
            addressId: Number(form.addressId) || 0,

            startDate: form.startDate ? parseLocalDate(form.startDate).toISOString() : new Date().toISOString(),
            endDate: form.endDate ? parseLocalDate(form.endDate).toISOString() : new Date().toISOString(),

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
            updateMutation.mutate({ id: Number(id), data: payload } as any, { onSuccess: onDone, onError: onFail });
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
                            onPaste={handlePaste}
                            error={!!errors.firstName}
                            helperText={errors.firstName}
                            // để user không paste 1 phát dài quá (nhưng chính vẫn là enforce combined)
                            inputProps={{ maxLength: MAX_FULLNAME }}
                            fullWidth
                        />

                        <TextField
                            label={t("contractCreate.lastName", { defaultValue: "Last name" })}
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            onPaste={handlePaste}
                            error={!!errors.lastName}
                            helperText={errors.lastName}
                            inputProps={{ maxLength: MAX_FULLNAME }}
                            fullWidth
                        />

                        <TextField
                            label={t("contractCreate.email", { defaultValue: "Email" })}
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            error={!!errors.email}
                            helperText={errors.email}
                            inputProps={{ maxLength: MAX_EMAIL }}
                            fullWidth
                        />

                        <TextField
                            label={t("contractCreate.phone", { defaultValue: "Phone" })}
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            onPaste={handlePaste}
                            error={!!errors.phone}
                            helperText={errors.phone}
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
                                error={!!errors.startDate}
                                helperText={errors.startDate}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />

                            <TextField
                                type="date"
                                label={t("contractCreate.endDate", { defaultValue: "End date" })}
                                name="endDate"
                                value={form.endDate}
                                onChange={handleChange}
                                error={!!errors.endDate}
                                helperText={errors.endDate}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Stack>

                        <TextField
                            label={t("contractCreate.companyName", { defaultValue: "Company name" })}
                            name="companyName"
                            value={form.companyName}
                            onChange={handleChange}
                            error={!!errors.companyName}
                            helperText={errors.companyName}
                            inputProps={{ maxLength: MAX_COMPANY }}
                            fullWidth
                        />

                        <TextField
                            label={t("contractCreate.bankAccountNumber", { defaultValue: "Bank account number" })}
                            name="bankAccountNumber"
                            value={form.bankAccountNumber}
                            onChange={handleChange}
                            onPaste={handlePaste}
                            error={!!errors.bankAccountNumber}
                            helperText={errors.bankAccountNumber}
                            inputProps={{ inputMode: "numeric", maxLength: MAX_BANK }}
                            fullWidth
                        />

                        <TextField
                            select
                            label={t("contractCreate.reseller", { defaultValue: "Reseller" })}
                            name="resellerId"
                            value={form.resellerId}
                            onChange={handleChange}
                            error={!!errors.resellerId}
                            helperText={errors.resellerId}
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
                            error={!!errors.addressId}
                            helperText={errors.addressId}
                            fullWidth
                        >
                            {addresses.map((a: any) => (
                                <MenuItem key={a.id} value={String(a.id)}>
                                    {a.zipCode} {a.houseNumber}
                                    {a.extension ? `-${a.extension}` : ""}
                                </MenuItem>
                            ))}
                        </TextField>
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