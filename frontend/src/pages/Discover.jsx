import { Link } from "react-router-dom";
import { Skiper19 } from "@/components/ui/svg-follow-scroll";
import medsyncLogo from "@/assets/20251216_131631.png";

export default function Discover() {
  return (
    <div className="w-full min-h-screen overflow-x-hidden relative bg-black">
      <Link to="/" className="fixed top-4 left-4 z-50">
        <img src={medsyncLogo} alt="MedSync Home" className="h-10 w-auto" />
      </Link>
      <Skiper19 />
    </div>
  );
}
