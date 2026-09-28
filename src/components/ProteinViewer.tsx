import { useRef, useEffect } from 'react';

interface ProteinViewerProps {
  height?: string;
  showLegend?: boolean;
}

export default function ProteinViewer({ height = '450px', showLegend = true }: ProteinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;
    let rotX = 0.3, rotY = 0.5;
    const structure: { x: number; y: number; z: number; type: string }[] = [];

    function resize() {
      w = canvas!.width = canvas!.offsetWidth;
      h = canvas!.height = canvas!.offsetHeight;
    }

    function generateStructure() {
      structure.length = 0;
      const n = 120;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 6;
        const r = 60 + Math.sin(t * 3) * 30;
        structure.push({
          x: Math.cos(t) * r + (Math.random() - 0.5) * 20,
          y: Math.sin(t) * r * 0.6 + (i - n / 2) * 2.5,
          z: Math.sin(t * 2) * 40 + (Math.random() - 0.5) * 15,
          type: i % 8 < 3 ? 'helix' : i % 8 < 5 ? 'sheet' : 'loop',
        });
      }
    }

    resize();
    generateStructure();
    window.addEventListener('resize', resize);

    function project(p: typeof structure[0]) {
      const cx = w / 2, cy = h / 2;
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      let y = p.y * cosX - p.z * sinX;
      let z = p.y * sinX + p.z * cosX;
      let x = p.x * cosY - z * sinY;
      z = p.x * sinY + z * cosY;
      const scale = 400 / (400 + z);
      return { x: cx + x * scale, y: cy + y * scale, z, scale };
    }

    let animId: number;
    function draw() {
      ctx!.fillStyle = '#0e1828';
      ctx!.fillRect(0, 0, w, h);
      rotY += 0.003;

      const projected = structure.map(project);
      const sorted = projected.map((p, i) => ({ ...p, i })).sort((a, b) => b.z - a.z);

      ctx!.beginPath();
      for (let i = 0; i < projected.length - 1; i++) {
        const a = projected[i];

        if (i === 0) ctx!.moveTo(a.x, a.y);
        else ctx!.lineTo(a.x, a.y);
      }
      ctx!.strokeStyle = 'rgba(0, 229, 255, 0.15)';
      ctx!.lineWidth = 3;
      ctx!.stroke();

      sorted.forEach((p) => {
        const s = p.scale;
        const r = 4 * s;
        let color;
        if (structure[p.i].type === 'helix') color = '#ff6b6b';
        else if (structure[p.i].type === 'sheet') color = '#4ecdc4';
        else color = '#ffe66d';

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = 0.6 + s * 0.4;
        ctx!.fill();
        ctx!.globalAlpha = 1;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
        ctx!.fillStyle = color + '22';
        ctx!.fill();
      });

      animId = requestAnimationFrame(draw);
    }
    draw();

    const handleMouseDown = (e: MouseEvent) => {
      let lastX = e.clientX, lastY = e.clientY;
      const handleMove = (ev: MouseEvent) => {
        rotY += (ev.clientX - lastX) * 0.01;
        rotX += (ev.clientY - lastY) * 0.01;
        lastX = ev.clientX;
        lastY = ev.clientY;
      };
      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    };
    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-[rgba(0,229,255,0.1)]" style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      {showLegend && (
        <div className="absolute top-4 left-4 bg-[#060a0f]/80 backdrop-blur-md border border-[rgba(0,229,255,0.1)] rounded-lg p-3 text-xs">
          <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-sm bg-[#ff6b6b]" /><span>α-Helix</span></div>
          <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-sm bg-[#4ecdc4]" /><span>β-Sheet</span></div>
          <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-sm bg-[#ffe66d]" /><span>Loop</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#b967ff]" /><span>Ligand</span></div>
        </div>
      )}
    </div>
  );
}
