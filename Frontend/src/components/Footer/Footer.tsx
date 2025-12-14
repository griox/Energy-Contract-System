import React from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/Close";
// import socLogo from "../../assets/images/soc.png";
const Footer: React.FC = () => {
    return (
        <Box sx={{ bgcolor: "#141466", color: "white", py: 6 }}>
            {/* giảm py từ 10 → 6 */}
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr auto" },
                        gap: 4,   // giảm gap từ 6 → 4
                    }}
                >
                    {/* CONTACT */}
                    <Box>
                        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700, fontSize: "1.1rem" }}>
                            LIÊN HỆ CHÚNG TÔI
                        </Typography>

                        <Typography sx={{ mb: 0.5, fontSize: "0.9rem" }}>
                            📞 +84913602519
                        </Typography>
                        <Typography sx={{ mb: 0.5, fontSize: "0.9rem" }}>
                            ✉ khai.md@infodation.vn
                        </Typography>
                        <Typography sx={{ mb: 2, fontSize: "0.9rem" }}>
                            📍 Tòa VCN, tầng 10,Tố Hữu
                        </Typography>

                        {/* ICONS */}
                        <Stack direction="row" spacing={2}>
                            <FacebookIcon sx={{ fontSize: 26 }} />
                            <LinkedInIcon sx={{ fontSize: 26 }} />
                            <XIcon sx={{ fontSize: 26 }} />
                            <YouTubeIcon sx={{ fontSize: 26 }} />
                            <InstagramIcon sx={{ fontSize: 26 }} />
                        </Stack>
                    </Box>

                    {/* FEATURE LIST */}
                    <Box>
                        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700, fontSize: "1.1rem" }}>
                            CÁC TÍNH NĂNG CONTRACT INSIGHT®
                        </Typography>

                        <FooterLink text="So sánh phần mềm hợp đồng" />
                        <FooterLink text="Phần mềm chữ ký số" />
                        <FooterLink text="Báo cáo quản lý hợp đồng" />
                        <FooterLink text="Quy trình hợp đồng thông minh" />
                        <FooterLink text="Tích hợp tìm kiếm OFAC" />
                        <FooterLink text="Quản lý yêu cầu hợp đồng" />
                        <FooterLink text="Yêu cầu mua hàng" />
                        <FooterLink text="Lắp ráp tài liệu" />
                    </Box>

                    {/* BUSINESS */}
                    <Box>
                        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700, fontSize: "1.1rem" }}>
                            CHUYỂN ĐỔI KINH DOANH
                        </Typography>

                        <FooterLink text="Ngành công nghiệp" />
                        <FooterLink text="Nghiên cứu điển hình" />
                        <FooterLink text="Lợi ích phần mềm" />
                        <FooterLink text="Quản lý nhà cung cấp" />
                        <FooterLink text="Mua sắm hợp lý" />
                        <FooterLink text="Quản lý đấu thầu" />
                        <FooterLink text="Demo phần mềm" />
                        <FooterLink text="Dùng thử 30 ngày" />
                    </Box>


                    {/* <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <img src={socLogo} alt="SOC" style={{ width: 160 }} />
                        {/* giảm width từ 200 → 160 */}
                    {/* </Box> */}
                </Box>


            </Container>
        </Box>
    );
};


/* helper link item */
const FooterLink = ({ text }: { text: string }) => (
    <Typography
        sx={{
            mb: 1,
            cursor: "pointer",
            "&:hover": { opacity: 0.7 },
            transition: "0.2s",
        }}
    >
        {text}
    </Typography>
);
export default Footer;