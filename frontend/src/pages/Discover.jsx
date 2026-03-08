import { Link } from "react-router-dom";
import ReactLenis from "lenis/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import medsyncLogo from "@/assets/20251216_131631.png";
import mobileAppMockup from "@/assets/WhatsApp Image 2026-03-07 at 7.02.45 PM.png";

function ScrollFadeText({ children, className }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start center", "end center", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [60, 0, 0, -60]);

  return (
    <motion.p ref={ref} style={{ opacity, y }} className={className}>
      {children}
    </motion.p>
  );
}

export default function Discover() {
  return (
    <ReactLenis root>
      <div className="w-full min-h-screen overflow-x-hidden relative bg-black">
        <Link to="/" className="fixed top-4 left-4 z-50">
          <img src={medsyncLogo} alt="MedSync Home" className="h-10 w-auto" />
        </Link>
        <div className="flex flex-col overflow-hidden pb-[500px] pt-[1000px]">
          <ContainerScroll
            titleComponent={
              <>
                <h1 className="text-4xl font-semibold text-white">
                  Discover the power of <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                    MedSync Mobile App
                  </span>
                </h1>
              </>
            }
          >
            <img
              src={mobileAppMockup}
              alt="MedSync Mobile App"
              className="w-full h-full rounded-2xl object-cover"
              draggable={false}
            />
          </ContainerScroll>
          <ScrollFadeText className="max-w-3xl mx-auto text-center text-lg md:text-xl text-white/70 leading-relaxed px-6 -mt-20 mb-40">
            The MedSync mobile app brings the entire healthcare ecosystem to your fingertips. From booking appointments with nearby doctors to requesting emergency ambulance services with a single tap, the app is designed to save precious time when it matters most. Patients can track ambulance locations in real time, communicate directly with doctors, and access their complete medical history anytime, anywhere.
          </ScrollFadeText>
          <ContainerScroll
            titleComponent={
              <>
                <h1 className="text-4xl font-semibold text-white">
                  Unleash the power of <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                    MedSync Web App
                  </span>
                </h1>
              </>
            }
          >
            <img
              src={mobileAppMockup}
              alt="MedSync Web App"
              className="w-full h-full rounded-2xl object-cover"
              draggable={false}
            />
          </ContainerScroll>
          <ScrollFadeText className="max-w-3xl mx-auto text-center text-lg md:text-xl text-white/70 leading-relaxed px-6 -mt-20 mb-40">
            The MedSync web app provides a powerful dashboard for hospital administrators and doctors to manage patient flow, monitor real-time bed availability, coordinate ambulance dispatch, and oversee doctor schedules — all from a single unified interface designed to streamline hospital operations and improve emergency response times.
          </ScrollFadeText>
        </div>
      </div>
    </ReactLenis>
  );
}
