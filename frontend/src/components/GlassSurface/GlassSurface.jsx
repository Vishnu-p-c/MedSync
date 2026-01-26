import { useMemo, useRef } from 'react';
import './GlassSurface.css';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function GlassSurface({
  children,
  width,
  height,
  borderRadius = 24,
  borderWidth = 0.07,
  className = '',
  style = {},
  displace = 0.35,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  backgroundOpacity = 0.1,
  saturation = 1,
  mixBlendMode = 'difference'
}) {
  const ref = useRef(null);

  const computed = useMemo(() => {
    // brightness: 0..100 -> 1.0..1.35
    const bright = 1 + clamp(brightness, 0, 100) / 260;

    const absDistort = Math.abs(distortionScale);
    const blurPx = clamp(blur, 0, 40);
    const bw = clamp(borderWidth, 0, 0.5);

    return {
      '--gs-opacity': String(clamp(opacity, 0, 1)),
      '--gs-bg-opacity': String(clamp(backgroundOpacity, 0, 1)),
      '--gs-brightness': String(bright),
      '--gs-blur': `${blurPx}px`,
      '--gs-sat': String(clamp(saturation, 0, 3)),
      '--gs-border': String(bw),
      '--gs-distort': String(absDistort),
      '--gs-mix': mixBlendMode,
      '--gs-hover': '0',
      '--gs-red-off': `${redOffset}px`,
      '--gs-green-off': `${greenOffset}px`,
      '--gs-blue-off': `${blueOffset}px`,
      borderRadius: `${borderRadius}px`,
      width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
      height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      ...style
    };
  }, [
    borderRadius,
    borderWidth,
    width,
    height,
    style,
    opacity,
    backgroundOpacity,
    brightness,
    blur,
    saturation,
    distortionScale,
    mixBlendMode,
    redOffset,
    greenOffset,
    blueOffset
  ]);

  const onMove = e => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const mx = `${clamp(x * 100, 0, 100)}%`;
    const my = `${clamp(y * 100, 0, 100)}%`;

    // Tilt amount derived from displace + distortionScale.
    const tiltMax = clamp(Math.abs(distortionScale) / 90, 1.2, 6) * clamp(displace, 0, 1);
    const tiltX = (0.5 - y) * tiltMax;
    const tiltY = (x - 0.5) * tiltMax;

    el.style.setProperty('--gs-mx', mx);
    el.style.setProperty('--gs-my', my);
    el.style.setProperty('--gs-tilt-x', `${tiltX}deg`);
    el.style.setProperty('--gs-tilt-y', `${tiltY}deg`);
  };

  const onEnter = e => {
    const el = ref.current;
    if (!el) return;
    // Show glow only when hovering
    el.style.setProperty('--gs-hover', '1');
    // Seed glow position from cursor to avoid a center->cursor jump
    onMove(e);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--gs-hover', '0');
    el.style.setProperty('--gs-tilt-x', '0deg');
    el.style.setProperty('--gs-tilt-y', '0deg');
    el.style.setProperty('--gs-mx', '50%');
    el.style.setProperty('--gs-my', '40%');
  };

  return (
    <div
      ref={ref}
      className={`glass-surface ${className}`}
      style={computed}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="glass-surface__content">{children}</div>
    </div>
  );
}
