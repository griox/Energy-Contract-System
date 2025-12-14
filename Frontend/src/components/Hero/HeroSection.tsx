import React, { useState, useEffect } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import bgImage from "../../assets/images/bg-dashboard.jpg";
import slide1 from "../../assets/images/slide1.jpg";
import slide2 from "../../assets/images/slide2.jpg";
import slide3 from "../../assets/images/slide3.jpg";
import slide4 from "../../assets/images/slide4.jpg";
import slide5 from "../../assets/images/slide5.jpg";
import slide6 from "../../assets/images/slide6.jpg";
import slide7 from "../../assets/images/slide7.jpg";
import slide8 from "../../assets/images/slide8.jpg";

// Slider ảnh
const slides = [
  slide1,slide2,slide3,slide4,slide5,slide6,slide7,slide8];

export const signupFormRef = React.createRef<HTMLDivElement>();

const HeroSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollToForm = () => {
    signupFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // auto slide every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        py: 10,
        position: "relative",
        color: "white",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.45)",
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          gap: 6,
          zIndex: 1,
        }}
      >
        {/* LEFT TEXT */}
        <Box flex={1}>
          <Typography
            variant="h2"
            sx={{ fontWeight: 700, fontSize: { xs: "2.6rem", md: "3.6rem" }, lineHeight: 1.15 }}
          >
            Energy, Oil, &amp; Gas
            <br />
            Contract Management
            <br />
            Software
          </Typography>
          <Typography variant="h6" sx={{ mt: 3, opacity: 0.9 }}>
            Trusted by Energy Industry Leaders to Manage Contracts and Committals.
          </Typography>
          <Button
            variant="contained"
            onClick={scrollToForm}
            sx={{
              mt: 4,
              borderRadius: 999,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              bgcolor: "#2130d1ff",
              "&:hover": { bgcolor: "#3340e1", transform: "translateY(-2px)" },
              transition: "all 0.2s",
            }}
          >
            Register now
          </Button>
        </Box>

        {/* RIGHT: IMAGE SLIDER */}
        <Box flex={1} sx={{ display: "flex", justifyContent: "center" }}>
            <Box
                sx={{
                width: 620,          // chữ nhật
                height: 540,
                borderRadius: 4,
                boxShadow: "0 0 60px 20px rgba(49,33,120,0.8)",
                overflow: "hidden",
                position: "relative",
                }}
            >
                {slides.map((img, index) => (
                <Box
                    key={index}
                    component="img"
                    src={img}
                    alt={`slide-${index}`}
                    sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",        // cover toàn bộ khung
                    transition: "opacity 1s ease-in-out, transform 1s ease-in-out",
                    opacity: index === currentIndex ? 1 : 0,
                    transform: index === currentIndex ? "scale(1)" : "scale(1.05)",
                    }}
                />
                ))}
            </Box>
        </Box>

      </Container>
    </Box>
  );
};

export default HeroSection;

