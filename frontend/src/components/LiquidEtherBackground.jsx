import { useState, useEffect } from 'react';

// Lazy load LiquidEther to prevent SSR/build issues
let LiquidEther = null;

export default function LiquidEtherBackground({ children }) {
  const [canRender, setCanRender] = useState(false);
  const [LiquidEtherComponent, setLiquidEtherComponent] = useState(null);

  useEffect(() => {
    // Check for WebGL support and dynamically import
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        import('./LiquidEther/LiquidEther').then((module) => {
          setLiquidEtherComponent(() => module.default);
          setCanRender(true);
        }).catch(() => {
          setCanRender(false);
        });
      }
    } catch (e) {
      setCanRender(false);
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="fixed inset-0 -z-10">
        {/* Base backdrop (LiquidEther output is transparent where calm) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 600px at 70% 40%, rgba(61, 74, 255, 0.18), rgba(0,0,0,0) 60%), radial-gradient(900px 500px at 30% 70%, rgba(34, 54, 236, 0.12), rgba(0,0,0,0) 60%), linear-gradient(180deg, #010d16 0%, #010b13 60%, #010b13 100%)'
          }}
        />
        {canRender && LiquidEtherComponent && (
          <LiquidEtherComponent
            style={{ width: '100%', height: '100%' }}
            colors={['#005da8', '#2196f3', '#2196f3']}
            mouseForce={20}
            cursorSize={100}
            isViscous
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        )}
      </div>
      {children}
    </div>
  );
}
