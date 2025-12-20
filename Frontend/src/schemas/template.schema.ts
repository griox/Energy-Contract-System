import * as yup from "yup";

export const templateSchema = yup.object().shape({
    name: yup
        .string()
        .required("Template name is required")
        .min(3, "Name must be at least 3 characters")
        .max(100, "Name must be less than 100 characters"),
    description: yup
        .string()
        .max(500, "Description must be less than 500 characters")
        .default(""),
    htmlContent: yup
        .string()
        .required("HTML content is required")
        .min(10, "HTML content istoo short"),
isActive: yup
.boolean()
.default(true),
});