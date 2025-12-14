import React from "react";
import NavMenu from "@/components/NavMenu/NavMenu";
import ContractFormBase from "./ContractFormBase";

export default function ContractCreate() {
    return (
        <div style={{ display: "flex" }}>
            <NavMenu />
            <ContractFormBase mode="create" />
        </div>
    );
}
