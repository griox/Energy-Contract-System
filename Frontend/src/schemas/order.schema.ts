// src/schemas/order.schema.ts
import * as yup from "yup";
import { OrderStatus, OrderType } from "@/types/order";

// yyyy-mm-dd (từ input type="date") -> Date tại 00:00 local (tránh lệch timezone)
const parseLocalDate = (dateStr: string) => new Date(`${dateStr}T00:00:00`);

const toNumberOrUndef = (_value: any, originalValue: any) => {
    if (originalValue === "" || originalValue === null || originalValue === undefined) return undefined;
    const n = Number(originalValue);
    return Number.isNaN(n) ? undefined : n;
};

export const orderSchema = yup
    .object({
        orderNumber: yup
            .string()
            .transform((v) => (typeof v === "string" ? v.trim() : v))
            .required("Order No. is required")
            .min(3, "Order No. must be at least 3 characters")
            .max(50, "Order No. must be at most 50 characters"),

        // MUI Select hay trả string => dùng number + transform
        contractId: yup
            .number()
            .transform(toNumberOrUndef)
            .typeError("Contract is required")
            .required("Contract is required")
            .integer("Contract is invalid")
            .positive("Contract is invalid"),

        orderType: yup
            .number()
            .transform(toNumberOrUndef)
            .typeError("Type is required")
            .required("Type is required")
            .oneOf([OrderType.Gas, OrderType.Electricity], "Type is invalid"),

        status: yup
            .number()
            .transform(toNumberOrUndef)
            .typeError("Status is required")
            .required("Status is required")
            .oneOf(
                [OrderStatus.Pending, OrderStatus.Active, OrderStatus.Completed, OrderStatus.Cancelled],
                "Status is invalid"
            ),

        startDate: yup
            .string()
            .required("Start Date is required")
            .test("valid-start", "Invalid Start Date", (v) => {
                if (!v) return false;
                return !Number.isNaN(parseLocalDate(v).getTime());
            }),

        endDate: yup
            .string()
            .required("End Date is required")
            .test("valid-end", "Invalid End Date", (v) => {
                if (!v) return false;
                return !Number.isNaN(parseLocalDate(v).getTime());
            })
            .test("end>=start", "End Date must be greater than or equal to Start Date", function (endDate) {
                const { startDate } = this.parent as any;
                if (!startDate || !endDate) return true;

                const s = parseLocalDate(startDate);
                const e = parseLocalDate(endDate);
                if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return true;

                return e >= s;
            }),

        topupFee: yup
            .number()
            .transform((_value, originalValue) => {
                // TextField number có thể trả "" khi xóa hết
                if (originalValue === "" || originalValue === null || originalValue === undefined) return 0;
                const n = Number(originalValue);
                return Number.isNaN(n) ? (undefined as any) : n;
            })
            .typeError("Top-up Fee must be a number")
            .min(0, "Top-up Fee must be >= 0")
            .required("Top-up Fee is required"),
    })
    .required();

export type OrderFormValues = yup.InferType<typeof orderSchema>;