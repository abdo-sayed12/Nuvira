import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnimatedWaveTextProps {
  text: string;
  className?: string;
}

export function AnimatedWaveText({ text, className = '' }: AnimatedWaveTextProps) {
  const words = text.split(' ');
  const containerRef = useRef<HTMLDivElement>(null);
  const isArabic = /[\u0600-\u06FF]/.test(text);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mouseX = -1000;
    let mouseY = -1000;
    let isHovering = false;
    let lastHovering = false; // to optimize reset
    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onMouseEnter = () => { isHovering = true; };
    const onMouseLeave = () => { isHovering = false; };

    container.addEventListener('mousemove', onMouseMove, { passive: true });
    container.addEventListener('mouseenter', onMouseEnter, { passive: true });
    container.addEventListener('mouseleave', onMouseLeave, { passive: true });

    const render = () => {
      if (isHovering) {
        lastHovering = true;
        const chars = container.querySelectorAll('.wave-char-inner') as NodeListOf<HTMLElement>;
        const contRect = container.getBoundingClientRect();
        
        for (let i = 0; i < chars.length; i++) {
          const charEl = chars[i];
          const rect = charEl.getBoundingClientRect();
          const centerX = rect.left - contRect.left + rect.width / 2;
          const centerY = rect.top - contRect.top + rect.height / 2;

          const dx = mouseX - centerX;
          const dy = mouseY - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const intensity = dist < 80 ? Math.max(0, 1 - dist / 80) : 0;

          if (intensity > 0) {
            const hoverY = -10 * intensity;
            const hoverScale = 1 + (0.12 * intensity);
            const hoverRotate = -2 * intensity;
            
            charEl.style.transform = `translate3d(0, ${hoverY}px, 0) scale(${hoverScale}) rotateZ(${hoverRotate}deg)`;
            if (intensity > 0.5) {
               charEl.style.color = '#22d3ee';
            } else {
               charEl.style.color = '';
            }
          } else {
            charEl.style.transform = 'translate3d(0, 0px, 0) scale(1) rotateZ(0deg)';
            charEl.style.color = '';
          }
        }
      } else if (lastHovering) {
        // Reset all when leaving
        lastHovering = false;
        const chars = container.querySelectorAll('.wave-char-inner') as NodeListOf<HTMLElement>;
        for (let i = 0; i < chars.length; i++) {
          chars[i].style.transform = 'translate3d(0, 0px, 0) scale(1) rotateZ(0deg)';
          chars[i].style.color = '';
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    
    animationFrameId = requestAnimationFrame(render);

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  let globalIdx = 0;

  return (
    <div
      ref={containerRef}
      className={`inline-flex flex-wrap ${className}`}
      style={{ wordBreak: 'keep-all', overflowWrap: 'normal', hyphens: 'none' }}
    >
      {words.map((word, wIdx) => {
        if (isArabic) {
          const currentIdx = globalIdx++;
          return (
            <span key={wIdx} className="inline-flex mr-[0.25em] last:mr-0 whitespace-nowrap">
              <WaveChar char={word} idx={currentIdx} />
            </span>
          );
        } else {
          return (
            <span key={wIdx} className="inline-flex mr-[0.25em] last:mr-0 whitespace-nowrap">
              {word.split('').map((char, cIdx) => {
                const currentIdx = globalIdx++;
                return (
                  <WaveChar key={cIdx} char={char} idx={currentIdx} />
                );
              })}
            </span>
          );
        }
      })}
    </div>
  );
}

function WaveChar({ char, idx }: { char: string; idx: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: -28, x: -12, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 12,
        stiffness: 100,
        delay: idx * 0.04,
      }}
      className="inline-block relative"
    >
      <motion.span
        animate={{
          y: [-4, 4, -4],
          rotateZ: [0.8, -0.8, 0.8],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
          delay: idx * 0.1, // wave offset
        }}
        className="inline-block"
        style={{ willChange: 'transform' }}
      >
        <span
          className="inline-block wave-char-inner transition-colors duration-200"
          style={{ willChange: 'transform, color', transform: 'translate3d(0, 0px, 0) scale(1) rotateZ(0deg)' }}
        >
          {char}
        </span>
      </motion.span>
    </motion.span>
  );
}
