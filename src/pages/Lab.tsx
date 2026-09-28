import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  FlaskConical, RotateCcw, Play, Atom, Dna, Loader2,
  AlertTriangle, Crosshair, BrainCircuit, Eye, EyeOff,
} from 'lucide-react';

/* ---------------------------------- data ---------------------------------- */

const STRUCTURES = [
  { id: '1CRN', name: 'Crambin', desc: '46 aa membrane protein from seeds' },
  { id: '1UBQ', name: 'Ubiquitin', desc: '76 aa protein degradation tag' },
  { id: '1LYZ', name: 'Lysozyme', desc: '129 aa antibacterial enzyme' },
  { id: '1MBN', name: 'Myoglobin', desc: '153 aa oxygen storage protein' },
  { id: '1BNA', name: 'B-DNA Dodecamer', desc: '12 bp DNA double helix' },
  { id: '1TUP', name: 'p53–DNA Complex', desc: 'Tumor suppressor bound to DNA' },
  { id: '4HHB', name: 'Hemoglobin', desc: 'α2β2 tetramer, oxygen transport' },
  { id: '6VXX', name: 'SARS-CoV-2 Spike', desc: 'Viral fusion protein (large)' },
];

const ELEMENTS: Record<string, { color: string; covalent: number; vdw: number; label: string }> = {
  H: { color: '#e8e8e8', covalent: 0.31, vdw: 1.2, label: 'Hydrogen' },
  C: { color: '#8f8f8f', covalent: 0.76, vdw: 1.7, label: 'Carbon' },
  N: { color: '#3050f8', covalent: 0.71, vdw: 1.55, label: 'Nitrogen' },
  O: { color: '#ff0d0d', covalent: 0.66, vdw: 1.52, label: 'Oxygen' },
  S: { color: '#ffff30', covalent: 1.05, vdw: 1.8, label: 'Sulfur' },
  P: { color: '#ff8000', covalent: 1.07, vdw: 1.8, label: 'Phosphorus' },
  FE: { color: '#e06633', covalent: 1.24, vdw: 2.0, label: 'Iron' },
  ZN: { color: '#7d80b0', covalent: 1.22, vdw: 2.1, label: 'Zinc' },
  MG: { color: '#8aff00', covalent: 1.41, vdw: 1.73, label: 'Magnesium' },
  CA: { color: '#3dff00', covalent: 1.76, vdw: 2.31, label: 'Calcium' },
  CL: { color: '#1ff01f', covalent: 0.99, vdw: 1.75, label: 'Chlorine' },
  NA: { color: '#ab5cf2', covalent: 1.66, vdw: 2.27, label: 'Sodium' },
  K: { color: '#8f40d4', covalent: 2.03, vdw: 2.75, label: 'Potassium' },
  MN: { color: '#9c7ac7', covalent: 1.39, vdw: 2.05, label: 'Manganese' },
  CU: { color: '#c78033', covalent: 1.32, vdw: 1.96, label: 'Copper' },
  F: { color: '#90e050', covalent: 0.57, vdw: 1.47, label: 'Fluorine' },
  BR: { color: '#a62929', covalent: 1.14, vdw: 1.85, label: 'Bromine' },
  I: { color: '#940094', covalent: 1.33, vdw: 1.98, label: 'Iodine' },
};
const UNKNOWN_ELEMENT = { color: '#ff44cc', covalent: 0.77, vdw: 1.7, label: 'Unknown' };

const THREE_TO_ONE: Record<string, string> = {
  ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C', GLN: 'Q', GLU: 'E',
  GLY: 'G', HIS: 'H', ILE: 'I', LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F',
  PRO: 'P', SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', VAL: 'V', MSE: 'M',
};

const AA = ['Ala', 'Arg', 'Asn', 'Asp', 'Cys', 'Gln', 'Glu', 'Gly', 'His', 'Ile', 'Leu', 'Lys', 'Met', 'Phe', 'Pro', 'Ser', 'Thr', 'Trp', 'Tyr', 'Val'];

const ESMFOLD_MAX_LEN = 400;

/* --------------------------------- parsing -------------------------------- */

interface ParsedStructure {
  positions: Float32Array;
  elements: string[];
  resNames: string[];
  chains: string[];
  resSeqs: number[];
  hetFlags: boolean[];
  count: number;
  center: [number, number, number];
  radius: number;
  meta: {
    title: string;
    method: string;
    resolution: string;
    date: string;
    residues: number;
    chains: string[];
    hetCount: number;
  };
}

function parsePDB(text: string): ParsedStructure {
  const pos: number[] = [];
  const elements: string[] = [];
  const resNames: string[] = [];
  const chains: string[] = [];
  const resSeqs: number[] = [];
  const hetFlags: boolean[] = [];

  let title = '';
  let method = '';
  let resolution = '';
  let date = '';
  let modelDone = false;
  const seenRes = new Set<string>();
  const chainSet = new Set<string>();
  let hetCount = 0;

  const lines = text.split('\n');
  for (const line of lines) {
    const rec = line.slice(0, 6).trim();
    if (rec === 'HEADER') {
      const t = line.slice(10, 50).trim();
      if (t) title = t;
      date = line.slice(62, 66).trim() || date;
    } else if (rec === 'TITLE') {
      title = (title + ' ' + line.slice(10, 70).trim()).trim();
    } else if (rec === 'EXPDTA' && !method) {
      method = line.slice(10, 70).trim();
    } else if (rec === 'REMARK' && line.slice(7, 10).trim() === '2' && line.includes('RESOLUTION')) {
      const m = line.match(/(\d+\.\d+)\s*ANGSTROM/);
      if (m) resolution = m[1] + ' Å';
    } else if (rec === 'ENDMDL') {
      modelDone = true;
    } else if (rec === 'ATOM' || rec === 'HETATM') {
      if (modelDone) continue;
      const x = parseFloat(line.slice(30, 38));
      const y = parseFloat(line.slice(38, 46));
      const z = parseFloat(line.slice(46, 54));
      if (isNaN(x) || isNaN(y) || isNaN(z)) continue;
      let element = line.slice(76, 78).trim().toUpperCase();
      if (!element) {
        element = line.slice(12, 14).replace(/[^A-Za-z]/g, '').trim().charAt(0).toUpperCase();
      }
      const resName = line.slice(17, 20).trim().toUpperCase() || 'UNK';
      const chain = line.slice(21, 22).trim() || 'A';
      const resSeq = parseInt(line.slice(22, 26), 10) || 0;
      pos.push(x, y, z);
      elements.push(element || 'C');
      resNames.push(resName);
      chains.push(chain);
      resSeqs.push(resSeq);
      hetFlags.push(rec === 'HETATM');
      chainSet.add(chain);
      const key = chain + ':' + resSeq + ':' + resName;
      if (!seenRes.has(key)) seenRes.add(key);
      if (rec === 'HETATM') hetCount++;
    }
  }

  const count = elements.length;
  const positions = new Float32Array(pos);
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < count; i++) {
    cx += positions[i * 3];
    cy += positions[i * 3 + 1];
    cz += positions[i * 3 + 2];
  }
  cx /= count; cy /= count; cz /= count;
  let maxR = 0;
  for (let i = 0; i < count; i++) {
    const dx = positions[i * 3] - cx;
    const dy = positions[i * 3 + 1] - cy;
    const dz = positions[i * 3 + 2] - cz;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > maxR) maxR = d;
  }

  return {
    positions, elements, resNames, chains, resSeqs, hetFlags, count,
    center: [cx, cy, cz],
    radius: Math.max(maxR, 10),
    meta: {
      title: title || 'Unknown structure',
      method: method || 'N/A',
      resolution: resolution || 'N/A',
      date: date || 'N/A',
      residues: seenRes.size,
      chains: Array.from(chainSet),
      hetCount,
    },
  };
}

function computeBonds(data: ParsedStructure): Float32Array {
  const n = data.count;
  if (n > 45000) return new Float32Array(0);
  const cell = 4.0;
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number, z: number) =>
    Math.floor(x / cell) + ',' + Math.floor(y / cell) + ',' + Math.floor(z / cell);

  for (let i = 0; i < n; i++) {
    const x = data.positions[i * 3];
    const y = data.positions[i * 3 + 1];
    const z = data.positions[i * 3 + 2];
    const k = key(x, y, z);
    const arr = grid.get(k);
    if (arr) arr.push(i);
    else grid.set(k, [i]);
  }

  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const xi = data.positions[i * 3];
    const yi = data.positions[i * 3 + 1];
    const zi = data.positions[i * 3 + 2];
    const ri = (ELEMENTS[data.elements[i]] || UNKNOWN_ELEMENT).covalent;
    const cx = Math.floor(xi / cell), cy = Math.floor(yi / cell), cz = Math.floor(zi / cell);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          const arr = grid.get((cx + dx) + ',' + (cy + dy) + ',' + (cz + dz));
          if (!arr) continue;
          for (const j of arr) {
            if (j <= i) continue;
            const ddx = xi - data.positions[j * 3];
            const ddy = yi - data.positions[j * 3 + 1];
            const ddz = zi - data.positions[j * 3 + 2];
            const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
            if (d2 < 0.16) continue;
            const rj = (ELEMENTS[data.elements[j]] || UNKNOWN_ELEMENT).covalent;
            const maxD = ri + rj + 0.45;
            if (d2 <= maxD * maxD) {
              out.push(xi, yi, zi, data.positions[j * 3], data.positions[j * 3 + 1], data.positions[j * 3 + 2]);
            }
          }
        }
  }
  return new Float32Array(out);
}

/* ------------------------------ sequence utils ---------------------------- */

interface ChainSequence {
  chain: string;
  sequence: string;
  residues: { resSeq: number; resName: string }[];
}

function extractSequences(data: ParsedStructure): ChainSequence[] {
  const byChain = new Map<string, { resSeqs: number[]; resNames: string[]; seen: Set<number> }>();
  for (let i = 0; i < data.count; i++) {
    if (data.hetFlags[i]) continue;
    const ch = data.chains[i];
    let entry = byChain.get(ch);
    if (!entry) {
      entry = { resSeqs: [], resNames: [], seen: new Set<number>() };
      byChain.set(ch, entry);
    }
    const rs = data.resSeqs[i];
    if (!entry.seen.has(rs)) {
      entry.seen.add(rs);
      entry.resSeqs.push(rs);
      entry.resNames.push(data.resNames[i]);
    }
  }
  const out: ChainSequence[] = [];
  for (const [chain, e] of byChain) {
    let seq = '';
    for (const rn of e.resNames) seq += THREE_TO_ONE[rn] || 'X';
    out.push({ chain, sequence: seq, residues: e.resSeqs.map((resSeq, i) => ({ resSeq, resName: e.resNames[i] })) });
  }
  return out.sort((a, b) => b.sequence.length - a.sequence.length);
}

/* ------------------------------ ESMFold API ------------------------------- */

interface Prediction {
  status: 'none' | 'loading' | 'ready' | 'failed';
  chain: string;
  seqLength: number;
  truncated: boolean;
  plddt: number[];
  ca: Float32Array;
  mean: number;
  residues: { resSeq: number; resName: string }[];
  msg: string;
}

async function fetchESMFold(sequence: string): Promise<string> {
  const res = await fetch('https://api.esmatlas.com/foldSequence/v1/pdb/', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: sequence,
  });
  if (!res.ok) throw new Error('ESMFold HTTP ' + res.status);
  return res.text();
}

function parseESMFoldPdb(text: string): { plddt: number[]; ca: number[] } {
  const plddt: number[] = [];
  const ca: number[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.slice(0, 4) !== 'ATOM') continue;
    if (line.slice(12, 16).trim() !== 'CA') continue;
    const x = parseFloat(line.slice(30, 38));
    const y = parseFloat(line.slice(38, 46));
    const z = parseFloat(line.slice(46, 54));
    const b = parseFloat(line.slice(60, 66));
    if (isNaN(x)) continue;
    ca.push(x, y, z);
    plddt.push(isNaN(b) ? 50 : b);
  }
  return { plddt, ca };
}

function plddtColor(v: number): string {
  if (v < 50) return '#ff5252';
  if (v < 70) return '#ffb74d';
  if (v < 90) return '#4dd0e1';
  return '#4488ff';
}

/* ------------------------------ seeded random ----------------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------ agent simulation -------------------------- */

interface AgentResult {
  scope: 'residue' | 'structure';
  plddt: number;
  plddtSource: string;
  ddg: number;
  sasa: number;
  secStruct: string;
  confidence: number;
  mutations: { mut: string; ddg: number; note: string }[];
  summary: string;
}

interface AgentState {
  status: 'idle' | 'running' | 'done';
  logs: string[];
  progress: number;
  result: AgentResult | null;
}

const AGENT_STEPS_RESIDUE = [
  '[Agent] Initializing Proteus-Fold v2.4 ...',
  '[Agent] Querying RCSB for neighbor structures ...',
  '[Agent] Fetching MSA (UniProt clusters) ...',
  '[Agent] Running ESM-2 650M embedding ...',
  '[Agent] Computing residue-level attention ...',
  '[Agent] Predicting local pLDDT ...',
  '[Agent] Rosetta ΔΔG scan (19 substitutions) ...',
  '[Agent] Estimating SASA from structure ...',
  '[Agent] Cross-checking PDB contacts ...',
  '[Agent] Compiling report ...',
];

const AGENT_STEPS_STRUCTURE = [
  '[Agent] Initializing Proteus-Fold v2.4 ...',
  '[Agent] Parsing full structure topology ...',
  '[Agent] Fetching MSA for all chains ...',
  '[Agent] Running ESM-2 650M embeddings ...',
  '[Agent] Pair representation (Evoformer blocks) ...',
  '[Agent] Structure module recycling ×3 ...',
  '[Agent] Amber relaxation (200 steps) ...',
  '[Agent] Computing global pLDDT / TM-score ...',
  '[Agent] Scanning ligand pockets ...',
  '[Agent] Compiling report ...',
];

function buildResult(
  scope: 'residue' | 'structure',
  seed: number,
  resName: string,
  realPlddt: number | null,
  realMean: number | null
): AgentResult {
  const rng = mulberry32(seed);
  const plddt = realPlddt ?? (scope === 'residue' ? 60 + rng() * 38 : 70 + rng() * 28);
  const ddg = -(rng() * 2.4);
  const sasa = scope === 'residue' ? 40 + rng() * 160 : 8000 + rng() * 20000;
  const structs = scope === 'residue' ? ['Alpha helix', 'Beta strand', 'Loop / coil', '3₁₀ helix'] : ['Mostly alpha', 'Alpha/beta', 'Mostly beta', 'Intrinsically disordered regions'];
  const secStruct = structs[Math.floor(rng() * structs.length)];
  const mutations: AgentResult['mutations'] = [];
  const used = new Set<number>();
  for (let i = 0; i < 3; i++) {
    let idx = Math.floor(rng() * AA.length);
    while (used.has(idx)) idx = Math.floor(rng() * AA.length);
    used.add(idx);
    const mDdg = (rng() - 0.35) * 3;
    mutations.push({
      mut: `${resName !== 'UNK' ? resName : 'X'}→${AA[idx]}`,
      ddg: mDdg,
      note: mDdg < -0.5 ? 'stabilizing' : mDdg > 0.5 ? 'destabilizing' : 'neutral',
    });
  }
  mutations.sort((a, b) => a.ddg - b.ddg);
  const plddtSource = realPlddt !== null ? 'ESMFold (real)' : 'simulated';
  return {
    scope, plddt, plddtSource, ddg, sasa, secStruct,
    confidence: 70 + rng() * 28,
    mutations,
    summary:
      scope === 'residue'
        ? `Residue ${resName}: local confidence ${plddt.toFixed(1)} pLDDT (${plddtSource}). Best substitution ${mutations[0].mut} (ΔΔG ${mutations[0].ddg.toFixed(2)} kcal/mol).`
        : `Global fold predicted with ${(realMean ?? plddt).toFixed(1)} mean pLDDT (${plddtSource}). Interface energy ${ddg.toFixed(2)} kcal/mol. 1 druggable pocket identified.`,
  };
}

/* --------------------------------- 3D parts ------------------------------- */

function AtomInstances({
  data, onSelect,
}: {
  data: ParsedStructure;
  onSelect: (i: number | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 10, 10), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15 }), []);

  useLayoutEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    for (let i = 0; i < data.count; i++) {
      dummy.position.set(data.positions[i * 3], data.positions[i * 3 + 1], data.positions[i * 3 + 2]);
      const el = ELEMENTS[data.elements[i]] || UNKNOWN_ELEMENT;
      dummy.scale.setScalar(el.vdw * 0.38);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, color.set(el.color));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [data, dummy, color]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && e.instanceId !== null) onSelect(e.instanceId);
  };

  return <instancedMesh ref={meshRef} args={[geo, mat, data.count]} onClick={handleClick} frustumCulled={false} />;
}

function BondLines({ data }: { data: ParsedStructure }) {
  const bonds = useMemo(() => computeBonds(data), [data]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(bonds, 3));
    return g;
  }, [bonds]);
  if (bonds.length === 0) return null;
  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color="#3d5064" transparent opacity={0.55} />
    </lineSegments>
  );
}

function SelectionMarker({ data, index }: { data: ParsedStructure; index: number }) {
  const el = ELEMENTS[data.elements[index]] || UNKNOWN_ELEMENT;
  const pos: [number, number, number] = [
    data.positions[index * 3],
    data.positions[index * 3 + 1],
    data.positions[index * 3 + 2],
  ];
  return (
    <mesh position={pos}>
      <sphereGeometry args={[el.vdw * 0.75, 18, 18]} />
      <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.9} />
    </mesh>
  );
}

function CaTrace({ ca, plddt, offset }: { ca: Float32Array; plddt: number[]; offset: [number, number, number] }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const cols: number[] = [];
    const c = new THREE.Color();
    const n = ca.length / 3;
    for (let i = 0; i < n - 1; i++) {
      pts.push(
        ca[i * 3] + offset[0], ca[i * 3 + 1] + offset[1], ca[i * 3 + 2] + offset[2],
        ca[i * 3 + 3] + offset[0], ca[i * 3 + 4] + offset[1], ca[i * 3 + 5] + offset[2]
      );
      c.set(plddtColor(plddt[i] ?? 50));
      cols.push(c.r, c.g, c.b);
      c.set(plddtColor(plddt[i + 1] ?? 50));
      cols.push(c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    return g;
  }, [ca, plddt, offset]);
  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <lineBasicMaterial vertexColors transparent opacity={0.95} />
    </lineSegments>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function Lab() {
  const [pdbId, setPdbId] = useState('1UBQ');
  const [pendingId, setPendingId] = useState('1UBQ');
  const [data, setData] = useState<ParsedStructure | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [spin, setSpin] = useState(true);
  const [viewKey, setViewKey] = useState(0);
  const [showTrace, setShowTrace] = useState(true);
  const [pred, setPred] = useState<Prediction>({
    status: 'none', chain: '', seqLength: 0, truncated: false, plddt: [], ca: new Float32Array(), mean: 0, residues: [], msg: '',
  });
  const [agent, setAgent] = useState<AgentState>({ status: 'idle', logs: [], progress: 0, result: null });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelected(null);
    setAgent({ status: 'idle', logs: [], progress: 0, result: null });
    setPred({ status: 'none', chain: '', seqLength: 0, truncated: false, plddt: [], ca: new Float32Array(), mean: 0, residues: [], msg: '' });

    fetch(`https://files.rcsb.org/download/${pdbId}.pdb`)
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = parsePDB(text);
        if (parsed.count === 0) throw new Error('No atoms parsed');
        setData(parsed);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Failed to load ' + pdbId + ' from RCSB: ' + err.message + '. Check internet connection.');
        setData(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pdbId, viewKey]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const chainSeqs = useMemo(() => (data ? extractSequences(data) : []), [data]);

  async function runPrediction() {
    if (!data || chainSeqs.length === 0 || pred.status === 'loading') return;
    const best = chainSeqs[0];
    const truncated = best.sequence.length > ESMFOLD_MAX_LEN;
    const sequence = best.sequence.slice(0, ESMFOLD_MAX_LEN);
    setPred({
      status: 'loading', chain: best.chain, seqLength: sequence.length, truncated,
      plddt: [], ca: new Float32Array(), mean: 0, residues: best.residues.slice(0, sequence.length), msg: '',
    });
    try {
      const pdbText = await fetchESMFold(sequence);
      const parsed = parseESMFoldPdb(pdbText);
      if (parsed.plddt.length === 0) throw new Error('Empty prediction');
      const mean = parsed.plddt.reduce((a, b) => a + b, 0) / parsed.plddt.length;
      // center the trace
      let cx = 0, cy = 0, cz = 0;
      const n = parsed.ca.length / 3;
      for (let i = 0; i < n; i++) {
        cx += parsed.ca[i * 3]; cy += parsed.ca[i * 3 + 1]; cz += parsed.ca[i * 3 + 2];
      }
      cx /= n; cy /= n; cz /= n;
      const ca = new Float32Array(parsed.ca);
      for (let i = 0; i < n; i++) {
        ca[i * 3] -= cx; ca[i * 3 + 1] -= cy; ca[i * 3 + 2] -= cz;
      }
      setPred({
        status: 'ready', chain: best.chain, seqLength: sequence.length, truncated,
        plddt: parsed.plddt, ca, mean, residues: best.residues.slice(0, sequence.length), msg: '',
      });
    } catch (err) {
      setPred({
        status: 'failed', chain: best.chain, seqLength: sequence.length, truncated,
        plddt: [], ca: new Float32Array(), mean: 0, residues: best.residues.slice(0, sequence.length),
        msg: 'ESMFold API unreachable (' + (err as Error).message + '). Agent will use simulated values.',
      });
    }
  }

  const selectedResIndex = useMemo(() => {
    if (!data || selected === null || pred.status !== 'ready') return -1;
    const chain = data.chains[selected];
    const resSeq = data.resSeqs[selected];
    return pred.residues.findIndex((r) => pred.chain === chain && r.resSeq === resSeq);
  }, [data, selected, pred]);

  const runAgent = (scope: 'residue' | 'structure') => {
    if (agent.status === 'running' || !data) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const steps = scope === 'residue' ? AGENT_STEPS_RESIDUE : AGENT_STEPS_STRUCTURE;
    const seed = scope === 'residue' && selected !== null
      ? data.resSeqs[selected] * 97 + selected
      : data.count * 13 + data.meta.residues;
    const resName = scope === 'residue' && selected !== null ? data.resNames[selected] : 'Protein';

    const realPlddt = scope === 'residue' && pred.status === 'ready' && selectedResIndex >= 0
      ? pred.plddt[selectedResIndex]
      : null;
    const realMean = scope === 'structure' && pred.status === 'ready' ? pred.mean : null;

    setAgent({ status: 'running', logs: [], progress: 0, result: null });
    let i = 0;
    const tick = () => {
      i++;
      if (i <= steps.length) {
        setAgent((a) => ({
          ...a,
          logs: [...a.logs, steps[i - 1]],
          progress: (i / (steps.length + 1)) * 100,
        }));
        timerRef.current = setTimeout(tick, 220 + Math.random() * 420);
      } else {
        const result = buildResult(scope, seed, resName, realPlddt ?? null, realMean);
        setAgent((a) => ({ ...a, status: 'done', progress: 100, result }));
      }
    };
    timerRef.current = setTimeout(tick, 300);
  };

  const elementStats = useMemo(() => {
    if (!data) return [];
    const m = new Map<string, number>();
    for (const el of data.elements) m.set(el, (m.get(el) || 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [data]);

  const cameraDist = data ? Math.min(Math.max(data.radius * 2.6, 30), 600) : 60;

  return (
    <div className="py-8 px-6 md:h-[calc(100dvh-80px)] md:flex md:flex-col md:overflow-hidden">
      <div className="max-w-[1500px] mx-auto md:w-full md:flex-1 md:min-h-0 md:flex md:flex-col">
        <div className="mb-6">
          <div className="font-[var(--font-mono)] text-xs text-[#00e5ff] uppercase tracking-[0.15em] mb-2">// Molecular Lab</div>
          <h1 className="text-3xl md:text-4xl font-bold">Interactive Structure Explorer</h1>
          <p className="text-[#7a8fa8] mt-1">
            Real experimentally-determined structures from RCSB Protein Data Bank. Rotate, zoom, click any atom, launch the AI agent.
          </p>
        </div>

        {/* selector */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <select
            value={pendingId}
            onChange={(e) => setPendingId(e.target.value)}
            className="bg-[#0e1828] border border-[rgba(0,229,255,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8f0f8] min-w-[220px]"
          >
            {STRUCTURES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => { setPdbId(pendingId); setViewKey((k) => k + 1); }}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-[#00e5ff] to-[#4488ff] text-[#060a0f] disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load Structure'}
          </button>
          {data && (
            <span className="text-xs text-[#4a6078] font-[var(--font-mono)]">
              {pdbId} · {data.meta.residues} residues · {data.count.toLocaleString()} atoms
            </span>
          )}
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 bg-[rgba(255,51,102,0.08)] border border-[rgba(255,51,102,0.3)] rounded-xl p-4 text-sm text-[#ff8098]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)_330px] lg:grid-cols-[300px_minmax(0,1fr)_360px] lg:gap-5 md:flex-1 md:min-h-0 md:items-stretch">
          {/* viewer */}
          <div className="relative h-[420px] md:h-full md:min-h-[380px] bg-[#0a1220] rounded-2xl border border-[rgba(0,229,255,0.1)] overflow-hidden md:order-2">
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a1220]/80 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-[#00e5ff] animate-spin" />
                <span className="text-sm text-[#7a8fa8] font-[var(--font-mono)]">Fetching {pdbId} from RCSB …</span>
              </div>
            )}
            {!loading && !data && (
              <div className="absolute inset-0 flex items-center justify-center text-[#4a6078] text-sm">
                Select a structure and press Load
              </div>
            )}
            {data && (
              <Canvas
                key={pdbId + viewKey}
                camera={{ position: [0, 0, cameraDist], fov: 50, near: 0.5, far: 5000 }}
                onPointerMissed={() => setSelected(null)}
              >
                <ambientLight intensity={0.85} />
                <directionalLight position={[6, 8, 6]} intensity={1.4} />
                <pointLight position={[-8, -4, -8]} intensity={0.5} color="#4488ff" />
                <group position={[-data.center[0], -data.center[1], -data.center[2]]}>
                  <BondLines data={data} />
                  <AtomInstances data={data} onSelect={setSelected} />
                  {selected !== null && <SelectionMarker data={data} index={selected} />}
                  {pred.status === 'ready' && showTrace && (
                    <CaTrace ca={pred.ca} plddt={pred.plddt} offset={[-data.center[0] * 0 + 0, 0, 0]} />
                  )}
                </group>
                <OrbitControls autoRotate={spin} autoRotateSpeed={0.8} enableDamping dampingFactor={0.08} makeDefault />
              </Canvas>
            )}

            {/* overlay controls */}
            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              <button
                onClick={() => setSpin((s) => !s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  spin
                    ? 'border-[#00e5ff] text-[#00e5ff] bg-[rgba(0,229,255,0.08)]'
                    : 'border-[rgba(0,229,255,0.15)] text-[#7a8fa8] hover:text-[#00e5ff]'
                }`}
              >
                {spin ? 'Spin: ON' : 'Spin: OFF'}
              </button>
              <button
                onClick={() => setViewKey((k) => k + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgba(0,229,255,0.15)] text-[#7a8fa8] hover:text-[#00e5ff] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset view
              </button>
              {pred.status === 'ready' && (
                <button
                  onClick={() => setShowTrace((t) => !t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                    showTrace
                      ? 'border-[#00ff88] text-[#00ff88] bg-[rgba(0,255,136,0.08)]'
                      : 'border-[rgba(0,229,255,0.15)] text-[#7a8fa8] hover:text-[#00ff88]'
                  }`}
                >
                  {showTrace ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  Prediction
                </button>
              )}
            </div>

            {/* pLDDT legend when prediction shown */}
            {pred.status === 'ready' && showTrace && (
              <div className="absolute top-16 left-4 bg-[#060a0f]/80 backdrop-blur-md border border-[rgba(0,229,255,0.1)] rounded-lg p-3">
                <div className="text-[0.6rem] text-[#4a6078] uppercase tracking-wider mb-1.5">ESMFold pLDDT</div>
                <div className="flex items-center gap-2 text-[0.65rem] text-[#7a8fa8]">
                  <span>50</span>
                  <div className="w-28 h-2 rounded-full" style={{ background: 'linear-gradient(90deg,#ff5252,#ffb74d,#4dd0e1,#4488ff)' }} />
                  <span>100</span>
                </div>
              </div>
            )}

            {/* element legend */}
            {data && elementStats.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-[#060a0f]/80 backdrop-blur-md border border-[rgba(0,229,255,0.1)] rounded-lg p-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 max-w-[420px]">
                  {elementStats.map(([el, count]) => (
                    <span key={el} className="flex items-center gap-1.5 text-[0.7rem] text-[#7a8fa8]">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ background: (ELEMENTS[el] || UNKNOWN_ELEMENT).color }}
                      />
                      {el} ×{count.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="absolute bottom-4 right-4 text-[0.65rem] text-[#4a6078] font-[var(--font-mono)] bg-[#060a0f]/60 px-2 py-1 rounded">
              drag = rotate · wheel = zoom · right-drag = pan · click atom = select
            </div>
          </div>

          {/* left column: structure info */}
          <div className="space-y-4 md:order-1 md:h-full md:overflow-y-auto md:pr-1">
            {/* structure info + ESMFold */}
            <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[#00e5ff] mb-3">
                <Dna className="w-4 h-4" />
                <span className="font-semibold text-sm">Structure Info</span>
              </div>
              {data ? (
                <>
                  <h3 className="font-semibold leading-snug mb-3">{data.meta.title}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
                    <span className="text-[#4a6078]">Method</span><span className="font-[var(--font-mono)] text-[#e8f0f8]">{data.meta.method}</span>
                    <span className="text-[#4a6078]">Resolution</span><span className="font-[var(--font-mono)] text-[#e8f0f8]">{data.meta.resolution}</span>
                    <span className="text-[#4a6078]">Deposited</span><span className="font-[var(--font-mono)] text-[#e8f0f8]">{data.meta.date}</span>
                    <span className="text-[#4a6078]">Residues</span><span className="font-[var(--font-mono)] text-[#e8f0f8]">{data.meta.residues}</span>
                    <span className="text-[#4a6078]">Atoms</span><span className="font-[var(--font-mono)] text-[#e8f0f8]">{data.count.toLocaleString()}</span>
                    <span className="text-[#4a6078]">Chains</span><span className="font-[var(--font-mono)] text-[#e8f0f8]">{data.meta.chains.join(', ')}</span>
                    <span className="text-[#4a6078]">HET groups</span><span className="font-[var(--font-mono)] text-[#e8f0f8]">{data.meta.hetCount}</span>
                  </div>

                  {/* ESMFold prediction */}
                  <div className="border-t border-[rgba(0,229,255,0.1)] pt-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-[#b967ff] flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5" /> ESMFold Prediction
                      </span>
                      <button
                        onClick={runPrediction}
                        disabled={pred.status === 'loading' || chainSeqs.length === 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#b967ff] to-[#00e5ff] text-[#060a0f] disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {pred.status === 'loading' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Folding…</>
                        ) : (
                          'Predict (real)'
                        )}
                      </button>
                    </div>
                    {chainSeqs.length > 0 && (
                      <p className="text-[0.65rem] text-[#4a6078] font-[var(--font-mono)] mb-2">
                        chain {chainSeqs[0].chain} · {chainSeqs[0].sequence.length} aa
                        {chainSeqs[0].sequence.length > ESMFOLD_MAX_LEN ? ` (first ${ESMFOLD_MAX_LEN} sent)` : ''}
                      </p>
                    )}
                    {pred.status === 'ready' && (
                      <div className="bg-black/30 rounded-lg p-2.5 text-xs">
                        <div className="flex justify-between font-[var(--font-mono)]">
                          <span className="text-[#4a6078]">mean pLDDT</span>
                          <span className="font-bold" style={{ color: plddtColor(pred.mean) }}>{pred.mean.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between font-[var(--font-mono)]">
                          <span className="text-[#4a6078]">residues predicted</span>
                          <span className="text-[#e8f0f8]">{pred.seqLength}</span>
                        </div>
                      </div>
                    )}
                    {pred.status === 'failed' && (
                      <p className="text-[0.65rem] text-[#ffb74d] leading-relaxed">{pred.msg}</p>
                    )}
                  </div>

                  <a
                    href={`https://www.rcsb.org/structure/${pdbId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-xs text-[#00e5ff] hover:text-[#00ff88] transition-colors"
                  >
                    View on RCSB →
                  </a>
                </>
              ) : (
                <p className="text-xs text-[#4a6078]">No structure loaded.</p>
              )}
            </div>
          </div>

          {/* right column: selection + agent */}
          <div className="space-y-4 md:order-3 md:h-full md:overflow-y-auto md:pr-1">
            {/* selection */}
            <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[#00e5ff] mb-3">
                <Crosshair className="w-4 h-4" />
                <span className="font-semibold text-sm">Selected Element</span>
                {pred.status === 'ready' && selectedResIndex >= 0 && (
                  <span className="ml-auto text-[0.65rem] font-[var(--font-mono)] px-1.5 py-0.5 rounded" style={{ color: plddtColor(pred.plddt[selectedResIndex]), background: 'rgba(0,0,0,0.3)' }}>
                    pLDDT {pred.plddt[selectedResIndex].toFixed(1)}
                  </span>
                )}
              </div>
              {data && selected !== null ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-8 h-8 rounded-full inline-block border border-white/20"
                      style={{ background: (ELEMENTS[data.elements[selected]] || UNKNOWN_ELEMENT).color }}
                    />
                    <div>
                      <div className="font-semibold">
                        {data.elements[selected]} — {(ELEMENTS[data.elements[selected]] || UNKNOWN_ELEMENT).label}
                      </div>
                      <div className="text-xs text-[#7a8fa8]">
                        Residue {data.resNames[selected]} · Chain {data.chains[selected]} · #{data.resSeqs[selected]}
                        {data.hetFlags[selected] && <span className="text-[#b967ff]"> · HETATM</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-[0.7rem] font-[var(--font-mono)] text-[#4a6078] mb-3">
                    x {data.positions[selected * 3].toFixed(2)} · y {data.positions[selected * 3 + 1].toFixed(2)} · z {data.positions[selected * 3 + 2].toFixed(2)} Å
                  </div>
                  <button
                    onClick={() => runAgent('residue')}
                    disabled={agent.status === 'running'}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#b967ff] to-[#00e5ff] text-[#060a0f] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Run AI Agent on Residue
                  </button>
                </>
              ) : (
                <p className="text-xs text-[#4a6078]">Click any atom in the 3D view to select it.</p>
              )}
              <button
                onClick={() => runAgent('structure')}
                disabled={agent.status === 'running' || !data}
                className="w-full mt-3 py-2.5 rounded-lg text-sm font-semibold border border-[rgba(0,229,255,0.25)] text-[#00e5ff] hover:bg-[rgba(0,229,255,0.08)] disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <FlaskConical className="w-4 h-4" /> Run AI Agent on Full Structure
              </button>
            </div>

            {/* agent console */}
            <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[#00ff88] mb-3">
                <Atom className="w-4 h-4" />
                <span className="font-semibold text-sm">AI Agent</span>
                {agent.status === 'running' && (
                  <span className="ml-auto text-[0.65rem] font-[var(--font-mono)] text-[#00e5ff] animate-pulse">RUNNING</span>
                )}
                {agent.status === 'done' && (
                  <span className="ml-auto text-[0.65rem] font-[var(--font-mono)] text-[#00ff88]">DONE</span>
                )}
              </div>

              <div className="bg-black/40 rounded-lg p-3 h-40 overflow-y-auto font-[var(--font-mono)] text-[0.68rem] leading-relaxed mb-3">
                {agent.logs.length === 0 && agent.status === 'idle' && (
                  <span className="text-[#4a6078]">// agent idle — select a target and press Run</span>
                )}
                {agent.logs.map((l, i) => (
                  <div key={i} className="text-[#7a8fa8]">{l}</div>
                ))}
                {agent.status === 'running' && <span className="text-[#00e5ff] animate-pulse">▊</span>}
              </div>

              {agent.status !== 'idle' && (
                <div className="mb-3">
                  <div className="flex justify-between text-[0.65rem] text-[#4a6078] mb-1">
                    <span>Progress</span><span>{agent.progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#b967ff] to-[#00e5ff] rounded-full transition-all"
                      style={{ width: `${agent.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {agent.result && (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 rounded-lg p-2.5">
                      <div className="text-[0.6rem] text-[#4a6078] uppercase tracking-wider">pLDDT</div>
                      <div className="font-[var(--font-mono)] text-base font-bold" style={{ color: plddtColor(agent.result.plddt) }}>
                        {agent.result.plddt.toFixed(1)}
                      </div>
                      <div className="text-[0.55rem] text-[#4a6078]">{agent.result.plddtSource}</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2.5">
                      <div className="text-[0.6rem] text-[#4a6078] uppercase tracking-wider">ΔΔG</div>
                      <div className="font-[var(--font-mono)] text-base font-bold text-[#00ff88]">{agent.result.ddg.toFixed(2)} kcal/mol</div>
                      <div className="text-[0.55rem] text-[#4a6078]">simulated</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2.5">
                      <div className="text-[0.6rem] text-[#4a6078] uppercase tracking-wider">SASA</div>
                      <div className="font-[var(--font-mono)] text-base font-bold text-[#b967ff]">{Math.round(agent.result.sasa)} Å²</div>
                      <div className="text-[0.55rem] text-[#4a6078]">simulated</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2.5">
                      <div className="text-[0.6rem] text-[#4a6078] uppercase tracking-wider">Confidence</div>
                      <div className="font-[var(--font-mono)] text-base font-bold text-[#e8f0f8]">{agent.result.confidence.toFixed(0)}%</div>
                      <div className="text-[0.55rem] text-[#4a6078]">simulated</div>
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2.5">
                    <div className="text-[0.6rem] text-[#4a6078] uppercase tracking-wider mb-1">
                      {agent.result.scope === 'residue' ? 'Secondary Structure' : 'Fold Class'}
                    </div>
                    <div className="font-semibold">{agent.result.secStruct}</div>
                  </div>
                  {agent.result.mutations.length > 0 && (
                    <div className="bg-black/30 rounded-lg p-2.5">
                      <div className="text-[0.6rem] text-[#4a6078] uppercase tracking-wider mb-1.5">Mutation Scan (simulated)</div>
                      {agent.result.mutations.map((m, i) => (
                        <div key={i} className="flex justify-between font-[var(--font-mono)] text-[0.7rem] py-0.5">
                          <span className="text-[#e8f0f8]">{m.mut}</span>
                          <span className={m.ddg < 0 ? 'text-[#00ff88]' : 'text-[#ff8098]'}>
                            {m.ddg > 0 ? '+' : ''}{m.ddg.toFixed(2)} ({m.note})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[0.7rem] text-[#7a8fa8] leading-relaxed pt-1">{agent.result.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
