import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

export type AuroraTone = "home" | "sources" | "services" | "safety";

interface AuroraBackgroundProps {
  tone?: AuroraTone;
}

const vertexShader = `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uTone;
  varying vec2 vUv;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
  }

  float ribbon(vec2 point, float offset, float amplitude, float width, float speed) {
    float wave = sin(point.x * 2.4 + uTime * speed + offset) * amplitude;
    wave += sin(point.x * 5.3 - uTime * speed * 0.52 + offset * 1.7) * amplitude * 0.28;
    float distanceToWave = abs(point.y - wave - sin(point.x * 0.9 + offset) * 0.05);
    return exp(-distanceToWave * distanceToWave / width);
  }

  void main() {
    vec2 point = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
    float time = uTime * 0.18;
    float tealRibbon = ribbon(point + vec2(-0.04, 0.10), 0.3, 0.24, 0.004, 0.75);
    float cyanRibbon = ribbon(point + vec2(0.02, -0.18), 2.2, 0.18, 0.003, -0.58);
    float violetRibbon = ribbon(point + vec2(0.12, 0.02), 4.6, 0.28, 0.005, 0.42);
    float thinRibbon = ribbon(point + vec2(-0.12, -0.05), 5.8, 0.34, 0.0015, 0.32);
    float tealBloom = ribbon(point + vec2(-0.04, 0.10), 0.3, 0.24, 0.022, 0.75);
    float cyanBloom = ribbon(point + vec2(0.02, -0.18), 2.2, 0.18, 0.018, -0.58);
    float violetBloom = ribbon(point + vec2(0.12, 0.02), 4.6, 0.28, 0.025, 0.42);

    vec3 color = vec3(0.002, 0.006, 0.018);
    color += vec3(0.01, 0.50, 0.34) * tealRibbon * uTone.x;
    color += vec3(0.01, 0.42, 0.82) * cyanRibbon * uTone.y;
    color += vec3(0.34, 0.12, 0.72) * violetRibbon * uTone.z;
    color += vec3(0.18, 0.95, 0.70) * thinRibbon * 0.8;
    color += vec3(0.01, 0.24, 0.24) * tealBloom;
    color += vec3(0.02, 0.18, 0.36) * cyanBloom;
    color += vec3(0.18, 0.08, 0.34) * violetBloom;

    float core = tealRibbon * 0.22 + cyanRibbon * 0.16 + violetRibbon * 0.12;
    color += vec3(0.50, 1.0, 0.92) * core;

    vec2 particleCell = floor((vUv + vec2(time * 0.004, 0.0)) * vec2(92.0, 58.0));
    vec2 particlePoint = fract((vUv + vec2(time * 0.004, 0.0)) * vec2(92.0, 58.0)) - 0.5;
    float particle = step(0.986, hash(particleCell));
    particle *= smoothstep(0.18, 0.0, length(particlePoint));
    color += vec3(0.45, 0.90, 1.0) * particle * 0.55;

    float vignette = smoothstep(0.92, 0.18, length(point * vec2(0.72, 0.92)));
    float glow = clamp(tealRibbon + cyanRibbon + violetRibbon, 0.0, 1.0);
    gl_FragColor = vec4(color * vignette, 0.92 + glow * 0.05);
  }
`;

const toneValues: Record<AuroraTone, [number, number, number]> = {
  home: [1.0, 1.0, 1.0],
  sources: [0.8, 1.25, 0.55],
  services: [1.15, 0.9, 0.9],
  safety: [0.62, 1.15, 1.3],
};

export function AuroraBackground({ tone = "home" }: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio, 1.5),
        powerPreference: "low-power",
      });
    } catch {
      return;
    }

    const canvas = renderer.gl.canvas;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const program = new Program(renderer.gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uTone: { value: toneValues[tone] },
      },
    });
    const mesh = new Mesh(renderer.gl, {
      geometry: new Triangle(renderer.gl),
      program,
    });

    let frameId = 0;
    let visible = !document.hidden;
    const startedAt = performance.now();

    const resize = () => {
      const bounds = container.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };

    const render = (now: number) => {
      if (!visible) return;
      program.uniforms.uTime.value = prefersReducedMotion.matches ? 0 : (now - startedAt) / 1000;
      renderer.render({ scene: mesh });
      frameId = requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      visible = !document.hidden;
      if (visible) frameId = requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    document.addEventListener("visibilitychange", handleVisibility);
    resize();
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      program.remove();
      canvas.remove();
    };
  }, [tone]);

  return <div ref={containerRef} className="aurora-background" aria-hidden="true" />;
}
