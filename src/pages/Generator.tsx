import { useRef, useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { RefreshCw, Settings, Image, Zap, FileJson } from 'lucide-react';

interface GenParams {
  count: number;
  residueCount: number;
  helixRatio: number;
  sheetRatio: number;
  colorScheme: 'neon' | 'fire' | 'ocean' | 'purple';
  size: number;
}

const COLOR_SCHEMES = {
  neon: { helix: '#ff6b6b', sheet: '#4ecdc4', loop: '#ffe66d', ligand: '#b967ff', bg: '#0e1828', label: 'Neon' },
  fire: { helix: '#ff4500', sheet: '#ff8c00', loop: '#ffd700', ligand: '#ff1744', bg: '#1a0a00', label: 'Fire' },
  ocean: { helix: '#0066cc', sheet: '#00aaff', loop: '#88ddff', ligand: '#00ffcc', bg: '#001a2e', label: 'Ocean' },
  purple: { helix: '#e040fb', sheet: '#7c4dff', loop: '#b388ff', ligand: '#ff4081', bg: '#1a0033', label: 'Purple' },
};

const PROTEIN_NAMES = [
  'Helix', 'Fold', 'Strand', 'Binder', 'Loop', 'Domain', 'Motif', 'Cage',
  'Barrel', 'Sandwich', 'Jellyroll', 'Propeller', 'Tetra', 'Penta', 'Zinc',
  'Ring', 'Coil', 'Twist', 'Knot', 'Bridge',
];

const GREEK_SUFFIXES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];

function randomName(seed: number): string {
  const rng = (s: number) => {
    const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const prefix = PROTEIN_NAMES[Math.floor(rng(seed) * PROTEIN_NAMES.length)];
  const suffix = GREEK_SUFFIXES[Math.floor(rng(seed + 1) * GREEK_SUFFIXES.length)];
  return `${prefix}-${suffix}`;
}

function generateStructure(seed: number, residueCount: number, helixRatio: number, sheetRatio: number) {
  const structure: { x: number; y: number; z: number; type: string }[] = [];
  const rng = (s: number) => {
    const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const n = residueCount;
  const helixEnd = Math.floor(n * helixRatio);
  const sheetEnd = helixEnd + Math.floor(n * sheetRatio);

  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 6 + seed;
    const r = 60 + Math.sin(t * 3 + seed * 2) * 30 + rng(seed + i) * 20;
    const type = i < helixEnd ? 'helix' : i < sheetEnd ? 'sheet' : 'loop';
    structure.push({
      x: Math.cos(t) * r + (rng(seed + i * 2) - 0.5) * 30,
      y: Math.sin(t) * r * 0.6 + (i - n / 2) * 3 + Math.sin(seed) * 20,
      z: Math.sin(t * 2 + seed) * 40 + (rng(seed + i * 3) - 0.5) * 25,
      type,
    });
  }
  return structure;
}

function calculateRarity(helixRatio: number, sheetRatio: number, residueCount: number): string {
  const loopRatio = 1 - helixRatio - sheetRatio;
  const variance = Math.abs(helixRatio - sheetRatio) + Math.abs(helixRatio - loopRatio) + Math.abs(sheetRatio - loopRatio);
  const isLarge = residueCount > 200;
  const isBalanced = variance < 0.3;

  if (isLarge && isBalanced) return 'Legendary';
  if (isBalanced) return 'Epic';
  if (isLarge) return 'Rare';
  if (residueCount > 150) return 'Uncommon';
  return 'Common';
}

function structureClass(helixRatio: number, sheetRatio: number): string {
  const loopRatio = 1 - helixRatio - sheetRatio;
  if (helixRatio > 0.5) return 'Alpha-Helical';
  if (sheetRatio > 0.4) return 'Beta-Sheet';
  if (loopRatio > 0.5) return 'Loop-Rich';
  if (helixRatio > 0.3 && sheetRatio > 0.3) return 'Alpha/Beta';
  return 'Mixed';
}

function renderToCanvas(
  canvas: HTMLCanvasElement,
  structure: ReturnType<typeof generateStructure>,
  colors: typeof COLOR_SCHEMES['neon'],
  size: number,
  rotX: number,
  rotY: number
) {
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

  const projected = structure.map((p) => {
    let y = p.y * cosX - p.z * sinX;
    let z = p.y * sinX + p.z * cosX;
    let x = p.x * cosY - z * sinY;
    z = p.x * sinY + z * cosY;
    const scale = 400 / (400 + z);
    return { x: cx + x * scale * (size / 500), y: cy + y * scale * (size / 500), z, scale };
  });

  const sorted = projected.map((p, i) => ({ ...p, i })).sort((a, b) => b.z - a.z);

  ctx.beginPath();
  for (let i = 0; i < projected.length - 1; i++) {
    if (i === 0) ctx.moveTo(projected[i].x, projected[i].y);
    else ctx.lineTo(projected[i].x, projected[i].y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  sorted.forEach((p) => {
    const s = p.scale;
    const r = 3 * s * (size / 500);
    let color;
    const type = structure[p.i].type;
    if (type === 'helix') color = colors.helix;
    else if (type === 'sheet') color = colors.sheet;
    else color = colors.loop;

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7 + s * 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color + '18';
    ctx.fill();
  });

  const ligX = cx + Math.sin(rotY * 2) * size * 0.15;
  const ligY = cy + Math.cos(rotX * 2) * size * 0.1;
  ctx.beginPath();
  ctx.arc(ligX, ligY, 8 * (size / 500), 0, Math.PI * 2);
  ctx.fillStyle = colors.ligand + '60';
  ctx.fill();
  ctx.strokeStyle = colors.ligand;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

interface TokenMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string | number }[];
}

export default function Generator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [params, setParams] = useState<GenParams>({
    count: 1000,
    residueCount: 120,
    helixRatio: 0.35,
    sheetRatio: 0.25,
    colorScheme: 'neon',
    size: 1024,
  });
  const [previewSeed, setPreviewSeed] = useState(42);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(0);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const structure = generateStructure(previewSeed, params.residueCount, params.helixRatio, params.sheetRatio);
    const colors = COLOR_SCHEMES[params.colorScheme];
    renderToCanvas(canvas, structure, colors, 500, 0.3, 0.5 + previewSeed * 0.1);
  }, [previewSeed, params]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  async function generateAll() {
    setGenerating(true);
    setProgress(0);
    setGenerated(0);

    const zip = new JSZip();
    const imgFolder = zip.folder('images');
    const metaFolder = includeMetadata ? zip.folder('_metadata') : null;
    const colors = COLOR_SCHEMES[params.colorScheme];
    const offscreen = document.createElement('canvas');
    const allMetadata: Record<string, TokenMetadata> = {};

    const batchSize = 50;
    const total = params.count;

    for (let batch = 0; batch < total; batch += batchSize) {
      const batchPromises: Promise<void>[] = [];

      for (let i = batch; i < Math.min(batch + batchSize, total); i++) {
        const seed = i * 7919 + 12345;
        const structure = generateStructure(seed, params.residueCount, params.helixRatio, params.sheetRatio);
        const rotY = (seed % 360) * (Math.PI / 180);
        const rotX = ((seed * 7) % 180) * (Math.PI / 180);
        const tokenId = i + 1;

        const rarity = calculateRarity(params.helixRatio, params.sheetRatio, params.residueCount);
        const sClass = structureClass(params.helixRatio, params.sheetRatio);
        const name = randomName(seed);

        const metadata: TokenMetadata = {
          name: `Proteus Structure #${tokenId} — ${name}`,
          description: `A procedurally generated protein folding visualization. Part of the Proteus AI collection. Structure class: ${sClass}. Rarity: ${rarity}.`,
          image: `ipfs://YOUR_CID_HERE/${tokenId}.png`,
          attributes: [
            { trait_type: 'Helix Ratio', value: `${(params.helixRatio * 100).toFixed(0)}%` },
            { trait_type: 'Sheet Ratio', value: `${(params.sheetRatio * 100).toFixed(0)}%` },
            { trait_type: 'Loop Ratio', value: `${((1 - params.helixRatio - params.sheetRatio) * 100).toFixed(0)}%` },
            { trait_type: 'Residues', value: params.residueCount },
            { trait_type: 'Color Scheme', value: colors.label },
            { trait_type: 'Structure Class', value: sClass },
            { trait_type: 'Rarity', value: rarity },
            { trait_type: 'Resolution', value: `${params.size}x${params.size}` },
            { trait_type: 'Protein Name', value: name },
          ],
        };

        allMetadata[tokenId.toString()] = metadata;

        batchPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              renderToCanvas(offscreen, structure, colors, params.size, rotX, rotY);
              offscreen.toBlob((blob) => {
                if (blob && imgFolder) {
                  imgFolder.file(`${tokenId}.png`, blob);
                }
                if (metaFolder) {
                  metaFolder.file(`${tokenId}.json`, JSON.stringify(metadata, null, 2));
                }
                resolve();
              }, 'image/png');
            }, 0);
          })
        );
      }

      await Promise.all(batchPromises);
      setProgress(Math.min(100, ((batch + batchSize) / total) * 100));
      setGenerated(Math.min(batch + batchSize, total));
      await new Promise((r) => setTimeout(r, 10));
    }

    if (includeMetadata) {
      zip.file('_metadata.json', JSON.stringify(allMetadata, null, 2));

      const csvRows = [
        'token_id,name,helix_ratio,sheet_ratio,loop_ratio,residues,color_scheme,structure_class,rarity,protein_name,image_uri',
        ...Object.entries(allMetadata).map(([id, m]) => {
          const attrs = Object.fromEntries(m.attributes.map((a) => [a.trait_type, a.value]));
          return `${id},${m.name},${attrs['Helix Ratio']},${attrs['Sheet Ratio']},${attrs['Loop Ratio']},${attrs['Residues']},${attrs['Color Scheme']},${attrs['Structure Class']},${attrs['Rarity']},${attrs['Protein Name']},${m.image}`;
        }),
      ];
      zip.file('_metadata.csv', csvRows.join('\n'));
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proteus-nft-collection-${params.count}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    setGenerating(false);
    setProgress(100);
  }

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="font-[var(--font-mono)] text-xs text-[#00e5ff] uppercase tracking-[0.15em] mb-4">// NFT Generator</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Protein Structure NFT Generator</h1>
          <p className="text-[#7a8fa8] text-lg">
            Generate thousands of unique protein folding visualizations with full ERC-721 metadata. Ready for OpenSea, Blur, or custom contracts.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div>
            <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-4 mb-4">
              <canvas ref={canvasRef} className="w-full rounded-xl" style={{ maxHeight: 500 }} />
              <div className="flex justify-between items-center mt-3 text-xs text-[#4a6078]">
                <span>Preview #{previewSeed}</span>
                <button
                  onClick={() => setPreviewSeed((s) => s + 1)}
                  className="flex items-center gap-1 text-[#00e5ff] hover:text-[#00ff88] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Randomize
                </button>
              </div>
            </div>

            <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-4">
              <div className="text-xs text-[#4a6078] uppercase tracking-wider mb-2">Sample Metadata</div>
              <div className="font-[var(--font-mono)] text-xs bg-black/30 rounded-lg p-3 overflow-x-auto text-[#7a8fa8]">
                <pre>{JSON.stringify({
                  name: `Proteus Structure #1 — ${randomName(42)}`,
                  image: 'ipfs://YOUR_CID_HERE/1.png',
                  attributes: [
                    { trait_type: 'Helix Ratio', value: `${(params.helixRatio * 100).toFixed(0)}%` },
                    { trait_type: 'Sheet Ratio', value: `${(params.sheetRatio * 100).toFixed(0)}%` },
                    { trait_type: 'Residues', value: params.residueCount },
                    { trait_type: 'Color Scheme', value: COLOR_SCHEMES[params.colorScheme].label },
                    { trait_type: 'Structure Class', value: structureClass(params.helixRatio, params.sheetRatio) },
                    { trait_type: 'Rarity', value: calculateRarity(params.helixRatio, params.sheetRatio, params.residueCount) },
                  ]
                }, null, 2)}</pre>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5 text-[#00e5ff]">
                <Settings className="w-4 h-4" />
                <span className="font-semibold">Generation Settings</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#4a6078] uppercase tracking-wider mb-2 block">Count</label>
                  <input
                    type="range"
                    min="10"
                    max="5000"
                    step="10"
                    value={params.count}
                    onChange={(e) => setParams({ ...params, count: parseInt(e.target.value) })}
                    className="w-full accent-[#00e5ff]"
                  />
                  <div className="text-right font-[var(--font-mono)] text-sm text-[#00e5ff]">{params.count}</div>
                </div>

                <div>
                  <label className="text-xs text-[#4a6078] uppercase tracking-wider mb-2 block">Residues per Structure</label>
                  <input
                    type="range"
                    min="40"
                    max="300"
                    step="10"
                    value={params.residueCount}
                    onChange={(e) => setParams({ ...params, residueCount: parseInt(e.target.value) })}
                    className="w-full accent-[#00e5ff]"
                  />
                  <div className="text-right font-[var(--font-mono)] text-sm text-[#00e5ff]">{params.residueCount}</div>
                </div>

                <div>
                  <label className="text-xs text-[#4a6078] uppercase tracking-wider mb-2 block">Helix Ratio</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={params.helixRatio}
                    onChange={(e) => setParams({ ...params, helixRatio: parseFloat(e.target.value) })}
                    className="w-full accent-[#ff6b6b]"
                  />
                  <div className="text-right font-[var(--font-mono)] text-sm text-[#ff6b6b]">{(params.helixRatio * 100).toFixed(0)}%</div>
                </div>

                <div>
                  <label className="text-xs text-[#4a6078] uppercase tracking-wider mb-2 block">Sheet Ratio</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={params.sheetRatio}
                    onChange={(e) => setParams({ ...params, sheetRatio: parseFloat(e.target.value) })}
                    className="w-full accent-[#4ecdc4]"
                  />
                  <div className="text-right font-[var(--font-mono)] text-sm text-[#4ecdc4]">{(params.sheetRatio * 100).toFixed(0)}%</div>
                </div>

                <div>
                  <label className="text-xs text-[#4a6078] uppercase tracking-wider mb-2 block">Output Size</label>
                  <select
                    value={params.size}
                    onChange={(e) => setParams({ ...params, size: parseInt(e.target.value) })}
                    className="w-full bg-[#060a0f] border border-[rgba(0,229,255,0.1)] rounded-lg px-3 py-2 text-sm text-[#e8f0f8]"
                  >
                    <option value={512}>512×512 (Thumbnail)</option>
                    <option value={1024}>1024×1024 (Standard)</option>
                    <option value={2048}>2048×2048 (High Res)</option>
                    <option value={4096}>4096×4096 (4K)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#4a6078] uppercase tracking-wider mb-2 block">Color Scheme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['neon', 'fire', 'ocean', 'purple'] as const).map((scheme) => (
                      <button
                        key={scheme}
                        onClick={() => setParams({ ...params, colorScheme: scheme })}
                        className={`h-10 rounded-lg border-2 transition-all ${
                          params.colorScheme === scheme
                            ? 'border-[#00e5ff] scale-105'
                            : 'border-transparent hover:border-[rgba(0,229,255,0.3)]'
                        }`}
                        style={{ background: COLOR_SCHEMES[scheme].bg }}
                        title={scheme}
                      >
                        <div className="flex justify-center gap-0.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: COLOR_SCHEMES[scheme].helix }} />
                          <span className="w-2 h-2 rounded-full" style={{ background: COLOR_SCHEMES[scheme].sheet }} />
                          <span className="w-2 h-2 rounded-full" style={{ background: COLOR_SCHEMES[scheme].loop }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="metadata"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="w-4 h-4 accent-[#00e5ff]"
                  />
                  <label htmlFor="metadata" className="text-sm text-[#e8f0f8] flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-[#00e5ff]" />
                    Include ERC-721 metadata + CSV + _metadata.json
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={generateAll}
              disabled={generating}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
                generating
                  ? 'bg-[#0e1828] text-[#4a6078] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00e5ff] to-[#4488ff] text-[#060a0f] hover:shadow-[0_8px_32px_rgba(0,229,255,0.4)] hover:-translate-y-0.5'
              }`}
            >
              {generating ? (
                <>
                  <Zap className="w-5 h-5 animate-pulse" />
                  Generating {generated}/{params.count}...
                </>
              ) : (
                <>
                  <Image className="w-5 h-5" />
                  Generate & Download ZIP
                </>
              )}
            </button>

            {generating && (
              <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-xl p-4">
                <div className="flex justify-between text-xs text-[#4a6078] mb-2">
                  <span>Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00e5ff] to-[#00ff88] rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-[#4a6078] text-center space-y-1">
              <p>Each image is a procedurally generated protein structure visualization.</p>
              <p>Resolution: {params.size}×{params.size} PNG. Ready for OpenSea, Blur, or custom contracts.</p>
              {includeMetadata && (
                <p className="text-[#00e5ff]">Metadata includes: Helix %, Sheet %, Loop %, Residues, Color Scheme, Structure Class, Rarity, Protein Name</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
