import { Link } from "react-router-dom";
import IntroAnimation from "@/components/ui/scroll-morph-hero";
import medsyncLogo from "@/assets/20251216_131631.png";

export default function Discover() {
  return (
    <div className="w-full h-screen overflow-hidden relative">
      <Link to="/" className="absolute top-4 left-4 z-50">
        <img src={medsyncLogo} alt="MedSync Home" className="h-10 w-auto" />
      </Link>
      <IntroAnimation />
    </div>
  );
}
