import { useEffect, useRef, useState } from 'react';
import ProteinViewer from '../components/ProteinViewer';

export default function Arena() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iteration, setIteration] = useState(0);
  const [energy, setEnergy] = useState(-245.7);
  const [progress, setProgress] = useState(50);
  const [rmsd, setRmsd] = useState(2.34);
  const [plddt, setPlddt] = useState(87.3);
  const [tmScore] = useState(0.912);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;
    const residues: {
      baseX: number; baseY: number; phase: number; amp: number;
      type: string; speed: number;
    }[] = [];
    const RES_COUNT = 80;
    let time = 0;
    let iter = 0;

    function resize() {
      w = canvas!.width = canvas!.offsetWidth;
      h = canvas!.height = canvas!.offsetHeight;
      residues.length = 0;
      for (let i = 0; i < RES_COUNT; i++) {
        residues.push({
          baseX: w * 0.3 + (i / RES_COUNT) * w * 0.4,
          baseY: h * 0.5,
          phase: i * 0.3,
          amp: 15 + Math.random() * 25,
          type: i % 7 < 2 ? 'helix' : i % 7 < 4 ? 'sheet' : 'loop',
          speed: 0.02 + Math.random() * 0.02,
        });
      }
    }

    resize();
    window.addEventListener('resize', resize);

    function drawHelix(x: number, y: number, t: number, r: typeof residues[0]) {
      ctx!.beginPath();
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 4 + t + r.phase;
        const hx = x + Math.cos(angle) * 12;
        const hy = y + (i - 10) * 3 + Math.sin(angle) * 8;
        if (i === 0) ctx!.moveTo(hx, hy);
        else ctx!.lineTo(hx, hy);
      }
      ctx!.strokeStyle = 'rgba(255, 107, 107, 0.8)';
      ctx!.lineWidth = 2.5;
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.arc(x, y, 4, 0, Math.PI * 2);
      ctx!.fillStyle = '#ff6b6b';
      ctx!.fill();
    }

    function drawSheet(x: number, y: number, t: number, r: typeof residues[0]) {
      ctx!.beginPath();
      ctx!.moveTo(x - 15, y - 8 + Math.sin(t + r.phase) * 3);
      ctx!.lineTo(x + 15, y - 8 + Math.sin(t + r.phase + 1) * 3);
      ctx!.lineTo(x + 15, y + 8 + Math.sin(t + r.phase + 1) * 3);
      ctx!.lineTo(x - 15, y + 8 + Math.sin(t + r.phase) * 3);
      ctx!.closePath();
      ctx!.fillStyle = 'rgba(78, 205, 196, 0.25)';
      ctx!.fill();
      ctx!.strokeStyle = 'rgba(78, 205, 196, 0.8)';
      ctx!.lineWidth = 1.5;
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.arc(x, y, 4, 0, Math.PI * 2);
      ctx!.fillStyle = '#4ecdc4';
      ctx!.fill();
    }

    function drawLoop(x: number, y: number, t: number, r: typeof residues[0]) {
      ctx!.beginPath();
      ctx!.arc(x + Math.sin(t * 2 + r.phase) * 5, y, 5, 0, Math.PI * 2);
      ctx!.fillStyle = 'rgba(255, 230, 109, 0.7)';
      ctx!.fill();
    }

    function drawConnection(x1: number, y1: number, x2: number, y2: number, strength: number) {
      ctx!.beginPath();
      ctx!.moveTo(x1, y1);
      ctx!.lineTo(x2, y2);
      ctx!.strokeStyle = `rgba(0, 229, 255, ${strength * 0.4})`;
      ctx!.lineWidth = strength * 1.5;
      ctx!.stroke();
    }

    let animId: number;
    function animate() {
      ctx!.fillStyle = 'rgba(14, 24, 40, 0.15)';
      ctx!.fillRect(0, 0, w, h);
      time += 0.015;
      iter++;

      const positions: { x: number; y: number }[] = [];
      residues.forEach((r) => {
        const foldProgress = Math.min(1, iter / 2000);
        const targetY = r.baseY + Math.sin(r.phase + time * r.speed * 5) * r.amp * (0.3 + foldProgress * 0.7);
        const targetX = r.baseX + Math.cos(r.phase * 2 + time * r.speed * 3) * r.amp * 0.3 * foldProgress;
        const x = targetX;
        const y = targetY;
        positions.push({ x, y });

        if (r.type === 'helix') drawHelix(x, y, time, r);
        else if (r.type === 'sheet') drawSheet(x, y, time, r);
        else drawLoop(x, y, time, r);
      });

      for (let i = 0; i < positions.length - 1; i++) {
        const dist = Math.abs(positions[i].y - positions[i + 1].y);
        const strength = Math.max(0, 1 - dist / 60);
        drawConnection(positions[i].x, positions[i].y, positions[i + 1].x, positions[i + 1].y, 0.3 + strength * 0.7);
      }

      const ligX = w * 0.55 + Math.sin(time * 0.5) * 20;
      const ligY = h * 0.45 + Math.cos(time * 0.7) * 15;
      ctx!.beginPath();
      ctx!.arc(ligX, ligY, 12, 0, Math.PI * 2);
      ctx!.fillStyle = 'rgba(185, 103, 255, 0.4)';
      ctx!.fill();
      ctx!.strokeStyle = '#b967ff';
      ctx!.lineWidth = 2;
      ctx!.stroke();

      if (iter % 5 === 0) {
        setIteration(iter);
        const newEnergy = -245.7 - Math.sin(time * 0.3) * 12 - iter * 0.002;
        setEnergy(newEnergy);
        const prog = Math.min(100, 50 + Math.sin(time * 0.2) * 20 + iter * 0.01);
        setProgress(prog);
        setRmsd(Math.max(0.5, 3.5 - iter * 0.001));
        setPlddt(Math.min(98, 75 + Math.sin(time * 0.4) * 8 + iter * 0.003));
      }

      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="font-[var(--font-mono)] text-xs text-[#00e5ff] uppercase tracking-[0.15em] mb-4">// Live</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Folding Arena</h1>
          <p className="text-[#7a8fa8] text-lg">
            AI is "battling" the protein right now. Each iteration is a step closer to native conformation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="relative h-[500px] bg-[#0e1828] rounded-2xl border border-[rgba(0,229,255,0.1)] overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#060a0f]/95 to-transparent">
              <div className="flex justify-between items-center font-[var(--font-mono)] text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                  <span className="text-[#00ff88]">FOLDING ACTIVE</span>
                </div>
                <div className="text-[#4a6078]">
                  Iteration: <span className="text-[#00e5ff]">{iteration.toLocaleString()}</span>
                </div>
                <div className="text-[#4a6078]">
                  Energy: <span className="text-[#00e5ff]">{energy.toFixed(3)}</span> kcal/mol
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">
              Current Battle: <span className="text-[#00e5ff]">P53_vs_MDMB</span>
            </h3>
            <p className="text-[#7a8fa8] mb-6 leading-relaxed">
              Protein p53 — the "guardian of the genome". When mutated, it loses the ability to bind DNA, leading to cancer. 
              The task: find a small molecular "wedge" that stabilizes the native conformation of mutant p53.
            </p>

            <div className="flex gap-4 mb-6 flex-wrap">
              <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-xl p-4 min-w-[120px]">
                <div className="text-[0.65rem] text-[#4a6078] uppercase tracking-wider mb-1">RMSD</div>
                <div className="font-[var(--font-mono)] text-xl font-bold text-[#00e5ff]">{rmsd.toFixed(2)} Å</div>
              </div>
              <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-xl p-4 min-w-[120px]">
                <div className="text-[0.65rem] text-[#4a6078] uppercase tracking-wider mb-1">pLDDT</div>
                <div className="font-[var(--font-mono)] text-xl font-bold text-[#00e5ff]">{plddt.toFixed(1)}</div>
              </div>
              <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-xl p-4 min-w-[120px]">
                <div className="text-[0.65rem] text-[#4a6078] uppercase tracking-wider mb-1">TM-score</div>
                <div className="font-[var(--font-mono)] text-xl font-bold text-[#00e5ff]">{tmScore}</div>
              </div>
            </div>

            <div className="mb-2 flex justify-between text-xs text-[#4a6078]">
              <span>Minimization Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-[#00e5ff] to-[#00ff88] rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-sm text-[#7a8fa8]">
              <strong className="text-[#00ff88]">Hypothesis #2</strong> leads with 58% of votes. 
              Users burned <strong>2.4M $AIPROTEUS</strong> for this variant.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Interactive Structure Viewer</h2>
          <ProteinViewer height="450px" />
        </div>
      </div>
    </div>
  );
}
