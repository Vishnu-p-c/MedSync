"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";
import mobileAppMockup from "@/assets/WhatsApp Image 2026-03-07 at 7.02.45 PM.png";

const Skiper19 = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
  });

  // Animated text — appears when stroke reaches ~15% scroll
  const text = "Around 5,00,00,000 people die every year due to issues like delayed medical care, difficulty reaching hospitals on time, lack of ambulance coordination, and overcrowded hospitals where patients often struggle to find available doctors or facilities quickly. In many cases, we hear the heartbreaking line from doctors: \"If they had arrived a little earlier, we could have saved them.\" That thought made us reflect on how many of these situations happen not because treatment is impossible, but because systems are not well connected. MedSync was built with the idea of improving coordination between patients, doctors, hospitals, and ambulance services while also helping manage hospital rush and resource availability.";
  const words = text.split(" ");
  // Flatten all chars across all words for center index calculation
  let totalChars = 0;
  const wordMeta = words.map((word) => {
    const start = totalChars;
    totalChars += word.length;
    return { word, start };
  });
  const centerIndex = Math.floor(totalChars / 2);

  // Paragraph fade-in after the text assembles
  const paragraphOpacity = useTransform(scrollYProgress, [0.18, 0.28], [0, 1]);
  const paragraphY = useTransform(scrollYProgress, [0.18, 0.28], [40, 0]);

  // Container for the text section — fades in early, fades out before mobile app
  const textSectionOpacity = useTransform(scrollYProgress, [0.08, 0.12, 0.24, 0.30], [0, 1, 1, 0]);

  // "MOBILE APP" title animation — appears after paragraph fades out
  const mobileAppText = "mobile app";
  const mobileAppChars = mobileAppText.split("");
  const mobileAppWords = mobileAppText.split(" ");
  let maTotalChars = 0;
  const maWordMeta = mobileAppWords.map((word) => {
    const start = maTotalChars;
    maTotalChars += word.length;
    return { word, start };
  });
  const maCenterIndex = Math.floor(maTotalChars / 2);
  const mobileAppOpacity = useTransform(scrollYProgress, [0.30, 0.36, 0.8, 0.85], [0, 1, 1, 0]);

  // New text section below the mobile app image
  const mobileDescText = "The MedSync mobile app brings the entire healthcare ecosystem to your fingertips. From booking appointments with nearby doctors to requesting emergency ambulance services with a single tap, the app is designed to save precious time when it matters most. Patients can track ambulance locations in real time, communicate directly with doctors, receive medication reminders, and access their complete medical history anytime, anywhere. The app also features an SOS button for emergencies that instantly alerts nearby hospitals and dispatches the closest available ambulance to your location.";
  const mobileDescWords = mobileDescText.split(" ");
  let mdTotalChars = 0;
  const mdWordMeta = mobileDescWords.map((word) => {
    const start = mdTotalChars;
    mdTotalChars += word.length;
    return { word, start };
  });
  const mdCenterIndex = Math.floor(mdTotalChars / 2);

  return (
    <section
      ref={ref}
      className="mx-auto relative flex h-[600vh] w-screen flex-col items-center bg-black px-4 text-white"
      style={{ overflowX: 'clip' }}
    >
      {/* Section 1 Label */}
      <div className="fixed top-4 right-4 z-[99999] bg-black/70 px-3 py-1 rounded text-white text-sm font-mono pointer-events-none">Section Labels Active</div>

      <div className="mt-42 relative z-[15] flex w-fit flex-col items-center justify-center gap-5 text-center overflow-visible">
        <span className="absolute -left-4 top-0 z-[99999] bg-black/80 border border-white/30 px-3 py-1 rounded text-white text-base font-bold pointer-events-none">Section 1</span>
        <h1 className="relative z-10 text-7xl font-medium tracking-[-0.08em] lg:text-9xl">
          The Thought <br /> That sparked the <br />
          Idea for MedSync        </h1>
        <p className="relative z-10 max-w-2xl text-xl font-medium text-white/70">
          Scroll down to see the effect
        </p>

        <LinePath
          className="absolute -right-[40%] top-0 z-[9999]"
          scrollYProgress={scrollYProgress}
        />
      </div>

      {/* Sticky text scroll section — appears when stroke reaches early scroll point */}
      <motion.div
        className="sticky top-[25vh] z-20 flex flex-col items-center gap-10 mt-[60vh]"
        style={{ opacity: textSectionOpacity }}
      >
        <span className="absolute -left-4 top-0 z-[99999] bg-black/80 border border-white/30 px-3 py-1 rounded text-white text-base font-bold pointer-events-none">Section 2</span>
        <div
          className="w-full text-center text-xl leading-relaxed md:text-2xl lg:text-3xl px-8 md:px-16 lg:px-24"
          style={{ perspective: "500px" }}
        >
          {wordMeta.map(({ word, start }, wi) => (
            <span key={wi} className="inline-flex whitespace-nowrap">
              {word.split("").map((char, ci) => (
                <Character
                  key={ci}
                  char={char}
                  index={start + ci}
                  centerIndex={centerIndex}
                  scrollYProgress={scrollYProgress}
                  startAt={0.08}
                  endAt={0.2}
                />
              ))}
              {wi < wordMeta.length - 1 && <span className="w-[0.3em]" />}
            </span>
          ))}
        </div>
      </motion.div>

      {/* MOBILE APP title — appears after the paragraph section fades out */}
      <motion.div
        className="sticky top-[18vh] z-30 flex flex-col items-center gap-10 mt-[50vh]"
        style={{ opacity: mobileAppOpacity }}
      >
        <span className="absolute -left-4 top-0 z-[99999] bg-black/80 border border-white/30 px-3 py-1 rounded text-white text-base font-bold pointer-events-none">Section 3</span>
        <div
          className="w-full max-w-4xl text-center text-7xl font-medium tracking-[-0.08em] uppercase lg:text-9xl"
          style={{ perspective: "500px" }}
        >
          {maWordMeta.map(({ word, start }, wi) => (
            <span key={wi} className="inline-flex whitespace-nowrap">
              {word.split("").map((char, ci) => (
                <Character
                  key={ci}
                  char={char}
                  index={start + ci}
                  centerIndex={maCenterIndex}
                  scrollYProgress={scrollYProgress}
                  startAt={0.30}
                  endAt={0.40}
                  color="text-white"
                />
              ))}
              {wi < maWordMeta.length - 1 && <span className="w-[0.4em]" />}
            </span>
          ))}
        </div>

        {/* Mobile app mockup image — positioned below the MOBILE APP title / ✕ area */}
        <div className="mt-10 flex justify-center">
          <img
            src={mobileAppMockup}
            alt="MedSync Mobile App"
            className="max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl rounded-2xl shadow-2xl border border-white/10"
          />
        </div>

        {/* Animated description text below the mobile app image */}
        <div
          className="w-full text-center text-xl leading-relaxed md:text-2xl lg:text-3xl px-8 md:px-16 lg:px-24 mt-10"
          style={{ perspective: "500px" }}
        >
          {mdWordMeta.map(({ word, start }, wi) => (
            <span key={wi} className="inline-flex whitespace-nowrap">
              {word.split("").map((char, ci) => (
                <Character
                  key={ci}
                  char={char}
                  index={start + ci}
                  centerIndex={mdCenterIndex}
                  scrollYProgress={scrollYProgress}
                  startAt={0.42}
                  endAt={0.55}
                />
              ))}
              {wi < mdWordMeta.length - 1 && <span className="w-[0.3em]" />}
            </span>
          ))}
        </div>
      </motion.div>

      <div className="rounded-[2rem] w-full translate-y-[120vh] bg-white/10 backdrop-blur-sm pb-10 text-white">
        <span className="relative z-[99999] bg-black/80 border border-white/30 px-3 py-1 rounded text-white text-base font-bold pointer-events-none inline-block ml-4 mt-4">Section 4</span>
        <h1 className="mt-10 text-center text-[15.5vw] font-bold leading-[0.9] tracking-tighter lg:text-[16.6vw]">
          MedSync
        </h1>
        <div className="mt-80 flex w-full flex-col items-start gap-5 px-4 font-medium lg:mt-0 lg:flex-row lg:justify-between">
          <div className="flex w-full items-center justify-between gap-12 uppercase lg:w-fit lg:justify-center">
            <p className="w-fit text-sm text-white/70">
              Healthcare <br />
              Management System
            </p>
            <p className="w-fit text-right text-sm lg:text-left text-white/70">
              Built for <br /> Hospitals & Clinics
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center justify-between gap-12 uppercase lg:w-fit lg:justify-center">
            <p className="w-fit text-sm text-white/70">
              Real-time <br /> Monitoring
            </p>
            <p className="w-fit text-right text-sm lg:text-left text-white/70">
              Emergency SOS <br /> Ambulance Dispatch
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const Character = ({ char, index, centerIndex, scrollYProgress, startAt = 0, endAt = 0.5, color = "text-white/70" }) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(scrollYProgress, [startAt, endAt], [distanceFromCenter * 50, 0]);
  const rotateX = useTransform(
    scrollYProgress,
    [startAt, endAt],
    [distanceFromCenter * 50, 0]
  );

  return (
    <motion.span
      className={`inline-block ${color}`}
      style={{ x, rotateX }}
    >
      {char}
    </motion.span>
  );
};

export { Skiper19 };

const LinePath = ({ className, scrollYProgress }) => {
  const pathLength = useTransform(scrollYProgress, [0, 0.35, 0.55, 0.9], [0.38, 0.68, 0.85, 1]);

  return (
    <svg
      width="1278"
      height="4700"
      viewBox="0 0 1278 4700"
      fill="none"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <motion.path
        d="M876.605 394.131C788.982 335.917 696.198 358.139 691.836 416.303C685.453 501.424 853.722 498.43 941.95 409.714C1016.1 335.156 1008.64 186.907 906.167 142.846C807.014 100.212 712.699 198.494 789.049 245.127C889.053 306.207 986.062 116.979 840.548 43.3233C743.932 -5.58141 678.027 57.1682 672.279 112.188C666.53 167.208 712.538 172.943 736.353 163.088C760.167 153.234 764.14 120.924 746.651 93.3868C717.461 47.4252 638.894 77.8642 601.018 116.979C568.164 150.908 557 201.079 576.467 246.924C593.342 286.664 630.24 310.55 671.68 302.614C756.114 286.446 729.747 206.546 681.86 186.442C630.54 164.898 492 209.318 495.026 287.644C496.837 334.494 518.402 366.466 582.455 367.287C680.013 368.538 771.538 299.456 898.634 292.434C1007.02 286.446 1192.67 309.384 1242.36 382.258C1266.99 418.39 1273.65 443.108 1247.75 474.477C1217.32 511.33 1149.4 511.259 1096.84 466.093C1044.29 420.928 1029.14 380.576 1033.97 324.172C1038.31 273.428 1069.55 228.986 1117.2 216.384C1152.2 207.128 1188.29 213.629 1194.45 245.127C1201.49 281.062 1132.22 280.104 1100.44 272.673C1065.32 264.464 1044.22 234.837 1032.77 201.413C1019.29 162.061 1029.71 131.126 1056.44 100.965C1086.19 67.4032 1143.96 54.5526 1175.78 86.1513C1207.02 117.17 1186.81 143.379 1156.22 166.691C1112.57 199.959 1052.57 186.238 999.784 155.164C957.312 130.164 899.171 63.7054 931.284 26.3214C952.068 2.12513 996.288 3.87363 1007.22 43.58C1018.15 83.2749 1003.56 122.644 975.969 163.376C948.377 204.107 907.272 255.122 913.558 321.045C919.727 385.734 990.968 497.068 1063.84 503.35C1111.46 507.456 1166.79 511.984 1175.68 464.527C1191.52 379.956 1101.26 334.985 1030.29 377.017C971.109 412.064 956.297 483.647 953.797 561.655C947.587 755.413 1197.56 941.828 936.039 1140.66C745.771 1285.32 321.926 950.737 134.536 1202.19C-6.68295 1391.68 -53.4837 1655.38 131.935 1760.5C478.381 1956.91 1124.19 1515 1201.28 1997.83C1273.66 2451.23 100.805 1864.7 303.794 2668.89C360 2805 445 2925 540 3040C620 3138 700 3240 722 3362C739 3456 714 3561 655 3636C607 3697 539 3745 485 3788C430 3832 373 3890 354 3976C337 4052 354 4138 402 4194C455 4255 534 4274 594 4325C650 4373 672 4453 646 4537C624 4611 570 4664 514 4705"
        stroke="#152759"
        strokeWidth="20"
        style={{
          pathLength,
          strokeDashoffset: useTransform(pathLength, (value) => 1 - value),
        }}
      />
    </svg>
  );
};
