import Header from "../../components/Header/Header";
import HeroSection from "../../components/Hero/HeroSection";
import EnergyFeatureSection from "../../components/Energy/EnergyFeatureSection";
import LifecycleSection from "../../components/Lifecycle/LifecycleSection";
import SuccessStorySection from "../../components/SuccessStory/SuccessStorySection";
import Footer from "../../components/Footer/Footer";
import { Box } from "@mui/material";
import QuoteSection from "../../components/Quote/QuoteSection";

export default function Homepages() {
  return (
    <Box sx={{ bgcolor: "#020b26", color: "white" }}>
      <Header />
      <HeroSection />
      <EnergyFeatureSection />
      <LifecycleSection />
      <QuoteSection />
      <SuccessStorySection />
      <Footer />
    </Box>
  );
}
