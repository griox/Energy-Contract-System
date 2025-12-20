import * as yup from "yup";

export const addressSchema = yup.object({
    zipCode: yup
        .string()
        .required("Zipcode is required")
        .matches(/^[0-9]{4,10}$/, "Zipcode must be 4–10 digits")
        .trim(),

    houseNumber: yup
        .string()
        .required("House number is required")
        .trim(),

    extension: yup
        .string()
        .nullable()
        .trim(),
});