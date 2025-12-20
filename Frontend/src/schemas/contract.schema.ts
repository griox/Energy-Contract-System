
import * as yup from "yup";

function parseLocalDate(dateStr?: string) {
    if (!dateStr) return new Date("invalid");
    return new Date(`${dateStr}T00:00:00`);
}

const trimStr = (v: any) => (typeof v === "string" ? v.trim() : v);

const toNumberFromSelect = (_value: any, originalValue: any) => {
    if (originalValue === "" || originalValue == null) return undefined;
    const n = Number(originalValue);
    return Number.isFinite(n) ? n : undefined;
};

// ===== Validators =====
const ONLY_DIGITS = /^[0-9]+$/;

// cho phép +, số, space, (), -, .
const PHONE_ALLOWED_CHARS = /^[0-9+\-().\s]+$/;

function countDigits(s: string) {
    return (s.match(/\d/g) || []).length;
}

/**
 * Tổng số ký tự FullName = firstName + (1 space nếu cả 2 có) + lastName
 */
function fullNameLength(firstName?: string, lastName?: string) {
    const f = (firstName ?? "").trim();
    const l = (lastName ?? "").trim();
    if (!f && !l) return 0;
    return f.length + (f && l ? 1 : 0) + l.length;
}

export const contractSchema = yup.object({
    firstName: yup
        .string()
        .transform(trimStr)
        .required("First Name is required")
        .min(1, "First Name is required")
        // ❗ bỏ max(50) riêng lẻ, vì bạn muốn tổng 2 ô <= 50
        .test("full-name-max-50", "Full name must be at most 50 characters", function (first) {
            const last = (this.parent as any)?.lastName;
            return fullNameLength(first, last) <= 50;
        }),

    lastName: yup
        .string()
        .transform(trimStr)
        .required("Last Name is required")
        .min(1, "Last Name is required")
        // ❗ test tổng 2 ô <= 50
        .test("full-name-max-50", "Full name must be at most 50 characters", function (last) {
            const first = (this.parent as any)?.firstName;
            return fullNameLength(first, last) <= 50;
        }),

    email: yup
        .string()
        .transform((v) => {
            const x = trimStr(v);
            return typeof x === "string" ? x.toLowerCase() : x;
        })
        .required("Email is required")
        .email("Invalid Email")
        .max(100, "Email max 100 characters"),

    /**
     * Phone:
     * - required
     * - chỉ cho phép 0-9 + - ( ) . space
     * - số chữ số phải nằm trong [9..10]
     * - max tổng độ dài string = 20 là ok, nhưng bạn muốn 10 số thì check digits quan trọng hơn
     */
    phone: yup
        .string()
        .transform(trimStr)
        .required("Phone is required")
        .matches(PHONE_ALLOWED_CHARS, "Phone only allows digits and + - ( ) spaces")
        .test("phone-digits-min", "Phone must contain at least 9 digits", (v) => {
            if (!v) return true;
            return countDigits(v) >= 9;
        })
        .test("phone-digits-max", "Phone must contain at most 10 digits", (v) => {
            if (!v) return true;
            return countDigits(v) <= 10;
        }),

    companyName: yup
        .string()
        .transform(trimStr)
        .required("Company Name is required")
        .min(1, "Company Name is required")
        .max(100, "Company Name max 100 characters"),

    bankAccountNumber: yup
        .string()
        .transform(trimStr)
        .required("Bank Account Number is required")
        .max(20, "Bank Account Number max 20 characters")
        .matches(ONLY_DIGITS, "Bank Account Number must contain digits only"),

    startDate: yup
        .string()
        .required("Start Date is required")
        .test("valid-start", "Invalid Start Date", (v) => {
            if (!v) return true;
            const d = parseLocalDate(v);
            return !Number.isNaN(d.getTime());
        }),

    endDate: yup
        .string()
        .required("End Date is required")
        .test("valid-end", "Invalid End Date", (v) => {
            if (!v) return true;
            const d = parseLocalDate(v);
            return !Number.isNaN(d.getTime());
        })
        .test("end-after-start", "End Date must be greater than or equal to Start Date", function (endDate) {
            const startDate = (this.parent as any)?.startDate;
            if (!startDate || !endDate) return true;

            const start = parseLocalDate(startDate);
            const end = parseLocalDate(endDate);

            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
            return end >= start;
        }),

    resellerId: yup
        .number()
        .transform(toNumberFromSelect)
        .typeError("Reseller is required")
        .required("Reseller is required"),

    addressId: yup
        .number()
        .transform(toNumberFromSelect)
        .typeError("Address is required")
        .required("Address is required"),
});

export type ContractFormValues = yup.InferType<typeof contractSchema>;