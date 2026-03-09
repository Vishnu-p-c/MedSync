'use client';

import { useRef, useState, useEffect } from 'react';

export default function TextReveal({ word = "Cinematic Reveal", className = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`text-reveal-container ${className}`}>
      
      <div className="text-wrapper">
        <h1 className="title" aria-label={word}>
          {word.split(" ").map((w, wi) => {
            const charOffset = word.split(" ").slice(0, wi).reduce((acc, s) => acc + s.length + 1, 0);
            return (
              <span key={wi} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
                {w.split("").map((char, ci) => (
                  <span
                    key={ci}
                    className={isVisible ? "char animate" : "char"}
                    style={{ "--index": charOffset + ci }}
                  >
                    {char}
                  </span>
                ))}
                {wi < word.split(" ").length - 1 && (
                  <span
                    className={isVisible ? "char animate" : "char"}
                    style={{ "--index": charOffset + w.length }}
                  >
                    {"\u00A0"}
                  </span>
                )}
              </span>
            );
          })}
        </h1>
      </div>

      <style>{`
        .text-reveal-container {
          --bg-color: transparent;
          --text-color: #fafafa;
          --container-border: transparent;
        }

        .text-reveal-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background-color: var(--bg-color); 
          color: var(--text-color);
          border: 1px solid var(--container-border);
          border-radius: 12px;
          overflow: hidden;
          min-height: 300px;
          width: 100%;
        }

        .text-wrapper {
          position: relative;
          z-index: 10;
        }

        .title {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          color: var(--text-color);
          word-break: keep-all;
          overflow-wrap: normal;
        }

        .char {
          display: inline-block;
          opacity: 0;
          filter: blur(12px);
          transform: translateY(40%) scale(1.1) translateZ(0);
          will-change: transform, opacity, filter;
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      filter 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: calc(0.04s * var(--index));
        }

        .char.animate {
          opacity: 1;
          filter: blur(0);
          transform: translateY(0) scale(1) translateZ(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .char {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
