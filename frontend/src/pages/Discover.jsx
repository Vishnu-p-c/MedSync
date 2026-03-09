import { Link } from "react-router-dom";
import ReactLenis from "lenis/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import TextReveal from "@/components/ui/text-reveal";
import medsyncLogo from "@/assets/20251216_131631.png";
import mobileAppImage from "@/assets/IMG_7237.JPEG";
import webAppImage from "@/assets/IMG_7248.JPEG";

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
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight text-center">
            Discover MedSync
          </h1>
          <p className="mt-4 text-lg text-white/50">Scroll down to explore</p>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="mt-8 text-white/40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </motion.div>
        </div>
        <div className="flex flex-col overflow-hidden pb-[500px]">
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
              src={mobileAppImage}
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
              src={webAppImage}
              alt="MedSync Web App"
              className="w-full h-full rounded-2xl object-cover"
              draggable={false}
            />
          </ContainerScroll>
          <ScrollFadeText className="max-w-3xl mx-auto text-center text-lg md:text-xl text-white/70 leading-relaxed px-6 -mt-20 mb-40">
            The MedSync web app provides a powerful dashboard for hospital administrators and doctors to manage patient flow, monitor real-time bed availability, coordinate ambulance dispatch, and oversee doctor schedules — all from a single unified interface designed to streamline hospital operations and improve emergency response times.
          </ScrollFadeText>
          <div className="w-full max-w-4xl mx-auto py-20">
            <TextReveal word="OUR SOFTWARE IS COMPLETELY FREE AND OPEN SOURCE" />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
              <a
                href="https://github.com/Vishnu-p-c/MedSync"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Web App — GitHub
              </a>
              <a
                href="https://github.com/thusharpradeep/medsync_android_studio"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Mobile App — GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </ReactLenis>
  );
}
