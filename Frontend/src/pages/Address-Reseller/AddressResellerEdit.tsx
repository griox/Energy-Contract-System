import {
    Box,
    Button,
    Card,
    TextField,
    Typography,
    FormControl,
    FormLabel,
    Select,
    MenuItem
} from "@mui/material";

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { AddressApi } from "../../api/address.api";
import { ResellerApi } from "../../api/reseller.api";
import NavMenu from "@/components/NavMenu/NavMenu";

export default function AddressResellerEdit() {
    const { type, id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState<any>(null);
    const isAddress = type === "address";
    const isReseller = type === "reseller";

    useEffect(() => {
        if (!id || !type) return;

        if (isAddress) {
            AddressApi.getById(Number(id))
                .then((d) =>
                    setData({
                        zipCode: d.zipCode || "",
                        houseNumber: d.houseNumber || "",
                        extension: d.extension || ""
                    })
                )
                .catch(() => setData({}));
        }

        if (isReseller) {
            ResellerApi.getById(Number(id))
                .then((d) =>
                    setData({
                        name: d.name || "",
                        partnerType: d.type || "Broker"
                    })
                )
                .catch(() => setData({}));
        }
    }, [id, type]);

    const handleSave = async () => {
        if (!data) return;

        try {
            if (isAddress) {
                await AddressApi.update(Number(id), {
                    zipCode: data.zipCode,
                    houseNumber: data.houseNumber,
                    extension: data.extension
                });
            }

            if (isReseller) {
                await ResellerApi.update(Number(id), {
                    name: data.name,
                    type: data.partnerType
                });
            }

            alert("Updated successfully!");
            navigate("/address-reseller/list");
        } catch (err) {
            alert("Update failed!");
            console.error(err);
        }
    };

    if (!data) return null;

    return (
        <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
            <NavMenu />

            <Card sx={{ p: 4, borderRadius: 4, boxShadow: "0 8px 30px rgba(0,0,0,0.05)" }}>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
                    Edit {isAddress ? "Address" : "Reseller"}
                </Typography>

                {/* ----- ADDRESS EDIT FORM ----- */}
                {isAddress && (
                    <>
                        <TextField
                            fullWidth
                            label="Zip Code"
                            sx={{ mb: 2 }}
                            value={data.zipCode}
                            onChange={(e) =>
                                setData({ ...data, zipCode: e.target.value })
                            }
                        />

                        <TextField
                            fullWidth
                            label="House Number"
                            sx={{ mb: 2 }}
                            value={data.houseNumber}
                            onChange={(e) =>
                                setData({ ...data, houseNumber: e.target.value })
                            }
                        />

                        <TextField
                            fullWidth
                            label="Extension"
                            sx={{ mb: 3 }}
                            value={data.extension}
                            onChange={(e) =>
                                setData({ ...data, extension: e.target.value })
                            }
                        />
                    </>
                )}

                {/* ----- RESELLER EDIT FORM ----- */}
                {isReseller && (
                    <>
                        <TextField
                            fullWidth
                            label="Reseller Name"
                            sx={{ mb: 2 }}
                            value={data.name}
                            onChange={(e) =>
                                setData({ ...data, name: e.target.value })
                            }
                        />

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <FormLabel>Partner Type</FormLabel>
                            <Select
                                value={data.partnerType}
                                onChange={(e) =>
                                    setData({ ...data, partnerType: e.target.value })
                                }
                            >
                                <MenuItem value="Broker">Broker</MenuItem>
                                <MenuItem value="Agency">Agency</MenuItem>
                            </Select>
                        </FormControl>
                    </>
                )}

                <Button variant="contained" fullWidth onClick={handleSave}>
                    Save
                </Button>

                <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => navigate("/address-reseller/list")}
                >
                    Cancel
                </Button>
            </Card>
        </Box>
    );
}
