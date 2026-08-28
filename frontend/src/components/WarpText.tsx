import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

interface WarpTextProps {
  text: string;
  className?: string;
  strength?: number;
  radius?: number;
  stiffness?: number;
  damping?: number;
  maxDisplacement?: number;
  delay?: number;
}

interface LetterState {
  element: HTMLSpanElement;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  targetX: number;
  targetY: number;
  targetRotation: number;
  targetScaleX: number;
  targetScaleY: number;
}

const premiumEase = [0.22, 1, 0.36, 1] as const;

export function WarpText({
  text,
  className = "",
  strength = 0.35,
  radius = 140,
  stiffness = 0.16,
  damping = 0.78,
  maxDisplacement = 12,
  delay = 0,
}: WarpTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLSpanElement>(null);
  const lettersRef = useRef<LetterState[]>([]);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const frameRef = useRef<number | null>(null);
  const rectsRef = useRef<DOMRect[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldReduceMotion) return;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const letterElements = Array.from(
      container.querySelectorAll<HTMLSpanElement>("[data-warp-letter]")
    );

    const measure = () => {
      rectsRef.current = letterElements.map((letter) => letter.getBoundingClientRect());
    };

    const setTargets = () => {
      const containerRect = container.getBoundingClientRect();
      const pointer = pointerRef.current;

      lettersRef.current.forEach((letter, index) => {
        const rect = rectsRef.current[index];
        if (!rect || !pointer.active) {
          letter.targetX = 0;
          letter.targetY = 0;
          letter.targetRotation = 0;
          letter.targetScaleX = 1;
          letter.targetScaleY = 1;
          return;
        }

        const centerX = rect.left - containerRect.left + rect.width / 2;
        const centerY = rect.top - containerRect.top + rect.height / 2;
        const distanceX = pointer.x - centerX;
        const distanceY = pointer.y - centerY;
        const distance = Math.hypot(distanceX, distanceY);
        const influence = Math.max(0, 1 - distance / radius);
        const falloff = influence * influence;
        const safeDistance = Math.max(distance, 1);
        const pull = Math.min(maxDisplacement, strength * falloff * maxDisplacement);

        letter.targetX = (distanceX / safeDistance) * pull;
        letter.targetY = (distanceY / safeDistance) * pull * 0.72;
        letter.targetRotation = Math.max(-2.2, Math.min(2.2, distanceX * 0.018 * falloff));
        letter.targetScaleX = 1 + 0.045 * falloff;
        letter.targetScaleY = 1 - 0.012 * falloff;
      });
    };

    const render = () => {
      let settling = false;
      const response = Math.min(0.28, Math.max(0.06, stiffness * (1 + damping * 0.12)));

      lettersRef.current.forEach((letter) => {
        letter.x += (letter.targetX - letter.x) * response;
        letter.y += (letter.targetY - letter.y) * response;
        letter.rotation += (letter.targetRotation - letter.rotation) * response;
        letter.scaleX += (letter.targetScaleX - letter.scaleX) * response;
        letter.scaleY += (letter.targetScaleY - letter.scaleY) * response;

        if (
          Math.abs(letter.x - letter.targetX) > 0.02 ||
          Math.abs(letter.y - letter.targetY) > 0.02 ||
          Math.abs(letter.rotation - letter.targetRotation) > 0.02
        ) {
          settling = true;
        }

        letter.element.style.transform = `translate3d(${letter.x}px, ${letter.y}px, 0) rotate(${letter.rotation}deg) scale(${letter.scaleX}, ${letter.scaleY})`;
        const glow = Math.min(12, Math.abs(letter.x) + Math.abs(letter.y));
        letter.element.style.textShadow = glow > 0.2 ? `0 0 ${glow}px rgba(94, 234, 212, ${glow / 90})` : "none";
      });

      frameRef.current = pointerRef.current.active || settling ? requestAnimationFrame(render) : null;
    };

    const startRender = () => {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      };
      setTargets();
      startRender();
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
      setTargets();
      startRender();
    };

    lettersRef.current = letterElements.map((element) => ({
      element,
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      targetX: 0,
      targetY: 0,
      targetRotation: 0,
      targetScaleX: 1,
      targetScaleY: 1,
    }));

    const observer = new ResizeObserver(() => {
      measure();
      setTargets();
      startRender();
    });

    measure();
    observer.observe(container);
    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      lettersRef.current.forEach((letter) => {
        letter.element.style.transform = "";
        letter.element.style.textShadow = "";
      });
    };
  }, [damping, maxDisplacement, radius, shouldReduceMotion, stiffness, strength]);

  return (
    <span ref={containerRef} aria-label={text} className={`inline-block ${className}`}>
      {Array.from(text).map((character, index) => (
        <motion.span
          key={`${character}-${index}`}
          aria-hidden="true"
          className="inline-block"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: shouldReduceMotion ? 0.15 : 0.82, delay: shouldReduceMotion ? 0 : delay + index * 0.075, ease: premiumEase }}
        >
          <span data-warp-letter className="inline-block will-change-transform">
            {character === " " ? "\u00a0" : character}
          </span>
        </motion.span>
      ))}
    </span>
  );
}
