import * as yup from "yup";

export const contractSchema = yup.object().shape({
    firstName: yup.string().required("Required"),
    lastName: yup.string().required("Required"),
    email: yup.string().email().required("Required"),
    phone: yup.string().required("Required"),

    companyName: yup.string().required("Required"),
    bankAccountNumber: yup.string().required("Required"),

    startDate: yup.string().required("Required"),
    endDate: yup.string().required("Required"),

    resellerId: yup.number().required("Required"),
    addressId: yup.number().required("Required"),
});
