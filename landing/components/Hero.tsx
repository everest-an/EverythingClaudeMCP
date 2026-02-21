"use client";

import { useEffect, useRef, useState } from "react";

export default function Hero() {
  return (
    <section aria-label="Hero" className="relative min-h-screen flex items-center justify-center px-6 pt-16">
      {/* Interactive constellation background */}
      <ConstellationBg />

      {/* Subtle background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent)] opacity-[0.05] blur-[120px] rounded-full" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-[var(--accent-secondary)] opacity-[0.02] blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Badge with animated gradient border */}
        <div className="inline-flex items-center gap-2 gradient-border rounded-full px-5 py-2 mb-8">
          <PulseDot />
          <span className="text-[12px] font-medium text-[var(--text-secondary)] tracking-wide uppercase">
            MCP Server for Claude Code
          </span>
        </div>

        {/* Title with animated gradient */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          <span className="gradient-text">AwesomeContext</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto mb-10">
          Compress engineering rules into latent space tensors.
          <br />
          Query them in milliseconds.
        </p>

        {/* Animated Metrics */}
        <div className="flex items-center justify-center gap-8 md:gap-12 mb-12">
          <AnimatedMetric target={122} label="Modules" />
          <div className="w-px h-8 bg-[var(--glass-border)]" />
          <Metric value="<5ms" label="Retrieval" />
          <div className="w-px h-8 bg-[var(--glass-border)]" />
          <AnimatedMetric target={96} suffix="%" label="Token Savings" />
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-4">
          <a
            href="#quickstart"
            className="btn-glow group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[var(--accent)] text-white text-[14px] font-medium"
          >
            Get Started
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
          <a
            href="#tools"
            className="inline-flex items-center px-7 py-3.5 rounded-xl glass text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            View Tools
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-5 h-5 text-[var(--text-tertiary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 14l-7 7m0 0l-7-7"
          />
        </svg>
      </div>
    </section>
  );
}

/** Animated live dot with ping */
function PulseDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
    </span>
  );
}

/** Animated counter metric */
function AnimatedMetric({
  target,
  suffix = "",
  label,
}: {
  target: number;
  suffix?: string;
  label: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const start = performance.now();

          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl md:text-3xl font-bold tracking-tight">
        {count}
        {suffix}
      </div>
      <div className="text-[12px] text-[var(--text-tertiary)] mt-1 tracking-wide uppercase">
        {label}
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold tracking-tight">
        {value}
      </div>
      <div className="text-[12px] text-[var(--text-tertiary)] mt-1 tracking-wide uppercase">
        {label}
      </div>
    </div>
  );
}

/** Interactive constellation — nodes attracted to mouse */
function ConstellationBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;
    let mouseX = -1000;
    let mouseY = -1000;

    interface Node {
      x: number;
      y: number;
      ox: number;
      oy: number;
      vx: number;
      vy: number;
      radius: number;
    }

    const nodes: Node[] = [];
    const NODE_COUNT = 60;
    const CONNECTION_DIST = 140;
    const MOUSE_RANGE = 200;

    function resize() {
      width = canvas!.offsetWidth;
      height = canvas!.offsetHeight;
      canvas!.width = width * window.devicePixelRatio;
      canvas!.height = height * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function init() {
      resize();
      nodes.length = 0;
      for (let i = 0; i < NODE_COUNT; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        nodes.push({
          x,
          y,
          ox: x,
          oy: y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 0.5,
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      for (const node of nodes) {
        // Drift
        node.ox += node.vx;
        node.oy += node.vy;
        if (node.ox < 0 || node.ox > width) node.vx *= -1;
        if (node.oy < 0 || node.oy > height) node.vy *= -1;

        // Mouse attraction
        const dx = mouseX - node.ox;
        const dy = mouseY - node.oy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RANGE && dist > 0) {
          const force = (1 - dist / MOUSE_RANGE) * 30;
          node.x = node.ox + (dx / dist) * force;
          node.y = node.oy + (dy / dist) * force;
        } else {
          node.x = node.ox;
          node.y = node.oy;
        }
      }

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.2;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.strokeStyle = `rgba(110, 86, 207, ${opacity})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // Nodes with glow
      for (const node of nodes) {
        const dxM = mouseX - node.x;
        const dyM = mouseY - node.y;
        const distM = Math.sqrt(dxM * dxM + dyM * dyM);
        const nearMouse = distM < MOUSE_RANGE;

        // Glow for near-mouse nodes
        if (nearMouse) {
          const glowOpacity = (1 - distM / MOUSE_RANGE) * 0.4;
          ctx!.beginPath();
          ctx!.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(110, 86, 207, ${glowOpacity * 0.3})`;
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx!.fillStyle = nearMouse
          ? `rgba(110, 86, 207, ${0.3 + (1 - distM / MOUSE_RANGE) * 0.5})`
          : "rgba(110, 86, 207, 0.25)";
        ctx!.fill();
      }

      animationId = requestAnimationFrame(draw);
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const onMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    init();
    draw();
    window.addEventListener("resize", init);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", init);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full constellation-canvas"
    />
  );
}
