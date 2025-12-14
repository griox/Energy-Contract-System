import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ===================== AUTH & HOME ===================== */
import Homepages from "@/pages/Introduce/Homepages";
import Home from "@/pages/Home";
import NotFoundPage from "@/pages/NotFoundPage";

/* ===================== CONTRACT MODULE ===================== */
import ContractList from "@/pages/Contract/ContractList";
import ContractDetail from "@/pages/Contract/ContractDetail";
import ContractPDF from "@/pages/Contract/ContractPDF";
import ContractCreate from "@/pages/Contract/ContractCreate";
import ContractEdit from "@/pages/Contract/ContractEdit";


/* ===================== ADDRESS - RESELLER MODULE ===================== */
import AddressResellerList from "@/pages/Address-Reseller/AddressResellerList";

/* ===================== ORDERS MODULE ===================== */
import OrderList from "@/pages/orders/OrderList";
import OrderCreate from "@/pages/orders/OrderCreate";
import OrderEdit from "@/pages/orders/OrderEdit";
import OrderDelete from "@/pages/orders/OrderDelete";

/* ===================== TEMPLATES ===================== */
import TemplateList from "@/pages/Template/TemplateList";
import TemplateCreate from "@/pages/Template/TemplateCreate";
import TemplateEdit from "@/pages/Template/TemplateEdit";
import { Toaster } from "react-hot-toast";


export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ===================== PUBLIC ROUTES ===================== */}
                <Route path="/" element={<Homepages />} />

                {/* ===================== PROTECTED ROUTES ===================== */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/home" element={<Home />} />

                    {/* --- CONTRACTS --- */}
                    <Route path="/contracts/list" element={<ContractList />} />
                    <Route path="/contracts/create" element={<ContractCreate />} />
                    <Route path="/contracts/:id/detail" element={<ContractDetail />} />
                    <Route path="/contracts/:id/edit" element={<ContractEdit />} />
                    <Route path="/contracts/:id/pdf" element={<ContractPDF />} />
                    {/* --- ADDRESS & RESELLER --- */}
                    <Route path="/address-reseller/list" element={<AddressResellerList />} />

                    {/* --- ORDERS --- */}
                    <Route path="/orders" element={<OrderList />} />
                    <Route path="/orders/create" element={<OrderCreate />} />
                    <Route path="/orders/edit/:id" element={<OrderEdit />} />
                    <Route path="/orders/delete/:id" element={<OrderDelete />} />

                    {/* --- TEMPLATES --- */}
                    <Route path="/templates" element={<TemplateList />} />
                    <Route path="/templates/create" element={<TemplateCreate />} />
                    <Route path="/templates/edit/:id" element={<TemplateEdit />} />
                </Route>

                {/* ===================== 404 ===================== */}
                <Route path="*" element={<NotFoundPage />} />
             
            </Routes>
               <Toaster position="top-right" reverseOrder={false} />
        </BrowserRouter>
    );
}
