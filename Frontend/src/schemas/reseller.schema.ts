import * as yup from "yup";

export const resellerSchema = yup.object({
    name: yup
        .string()
        .required("Reseller name is required")
        .trim(),

    type: yup
        .string()
        .oneOf(["Broker", "Agency"], "Invalid reseller type")
        .required("Reseller type is required"),
});
