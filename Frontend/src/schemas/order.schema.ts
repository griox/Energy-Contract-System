import * as yup from "yup";

export const orderSchema = yup.object().shape({
    orderNumber: yup.string().required("Required"),
    orderType: yup.number().required("Required"),
    status: yup.number().required("Required"),
    startDate: yup.string().required("Required"),
    endDate: yup.string().required("Required"),
    topupFee: yup.number().required("Required"),
});
