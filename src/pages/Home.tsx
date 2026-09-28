import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Zap, Dna, Trophy, Clock } from 'lucide-react';
import MolecularBackground from '../components/MolecularBackground';

function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = Math.ceil(end / 60);
    const timer = setInterval(() => {
      current += step;
      if (current >= end) {
        current = end;
        clearInterval(timer);
      }
      setCount(current);
    }, 30);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const [burned, setBurned] = useState(42.7);
  const [structures, setStructures] = useState(1247);

  useEffect(() => {
    const timer = setInterval(() => {
      setBurned((b) => b + Math.random() * 0.01);
      setStructures((s) => s + Math.floor(Math.random() * 2));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    {
      icon: <Target className="w-6 h-6" />,
      color: 'text-[#00e5ff] bg-[rgba(0,229,255,0.1)]',
      title: 'Vote Hypotheses',
      desc: 'Each round offers 3 amino acid sequence variants or conformational states. Burn $AIPROTEUS to cast your vote.',
      formula: 'votes_i = Σ(burned_tokens) · weight(addr)',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      color: 'text-[#00ff88] bg-[rgba(0,255,136,0.1)]',
      title: 'Launch Arena',
      desc: 'When time expires, the winning hypothesis enters the Arena — a GPU cluster runs ESMFold + Rosetta refinement.',
      formula: 'E = E_bond + E_angle + E_vdw + E_elec + E_solv',
    },
    {
      icon: <Dna className="w-6 h-6" />,
      color: 'text-[#b967ff] bg-[rgba(185,103,255,0.1)]',
      title: 'Real-Time Folding',
      desc: 'Watch the 3D structure being born: alpha helices, beta sheets, loops. Every minimization step visible in your browser.',
      formula: 'pLDDT = confidence(residue_i) ∈ [0, 100]',
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      color: 'text-[#ffaa00] bg-[rgba(255,170,0,0.1)]',
      title: 'On-Chain Result',
      desc: 'Final structure, pLDDT score and stability parameters are written to IPFS + hash in smart contract. Winners get NFT.',
      formula: 'hash = keccak256(structure_CIF + metadata_JSON)',
    },
  ];

  const rounds = [
    {
      status: 'live',
      title: 'Round #42 — p53 Stabilizer Hunt',
      desc: 'Search for stabilizing molecule for mutant p53-R175H',
      options: ['Phikita-1', 'MDM2-inh-7', 'APR-246'],
      prize: '500K AIPROTEUS',
      time: '4h 23m left',
    },
    {
      status: 'open',
      title: 'Round #43 — KRAS G12C Binder',
      desc: 'Design protein binder for previously inaccessible KRAS pocket',
      options: ['Helix-3v', 'Loop-X9', 'Sheet-Z2'],
      prize: '750K AIPROTEUS',
      time: 'Starts in 4h',
    },
    {
      status: 'open',
      title: 'Round #44 — Amyloid-β Cleavage',
      desc: 'Optimize substrate for BACE1 inhibition',
      options: ['Seq-Aβ-19', 'Seq-Aβ-42', 'Hybrid-H7'],
      prize: '1.2M AIPROTEUS',
      time: 'Starts in 28h',
    },
    {
      status: 'closed',
      title: 'Round #41 — SARS-CoV-2 Spike RBD (Completed)',
      desc: 'Nanobody design for neutralizing Omicron variant',
      options: ['Winner: VHH-72'],
      prize: 'pLDDT: 91.4',
      time: 'Completed',
    },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        <MolecularBackground />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060a0f_85%)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[rgba(0,229,255,0.25)] rounded-full text-xs font-medium tracking-widest uppercase text-[#00e5ff] bg-[rgba(0,229,255,0.05)] font-[var(--font-mono)] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            AlphaFold-grade Model • On-Chain Voting
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            AI Decodes<br />
            <span className="bg-gradient-to-r from-[#00e5ff] to-[#4488ff] bg-clip-text text-transparent">The Structure</span><br />
            <span className="bg-gradient-to-r from-[#00ff88] to-[#00e5ff] bg-clip-text text-transparent">You Vote — It Builds</span>
          </h1>

          <p className="text-lg md:text-xl text-[#7a8fa8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Decentralized protein folding prediction platform. Burn{' '}
            <span className="font-[var(--font-mono)] text-[#00e5ff] bg-[rgba(0,229,255,0.08)] px-2 py-0.5 rounded">$AIPROTEUS</span>{' '}
            to vote on hypotheses. AI runs computations in the Arena — you watch medicine being born.
          </p>

          <div className="flex justify-center gap-8 md:gap-12 mb-10 flex-wrap">
            <div className="text-center">
              <div className="font-[var(--font-mono)] text-2xl md:text-3xl font-bold text-[#00e5ff]">
                <AnimatedCounter end={structures} />
              </div>
              <div className="text-xs text-[#4a6078] uppercase tracking-wider mt-1">Structures Predicted</div>
            </div>
            <div className="text-center">
              <div className="font-[var(--font-mono)] text-2xl md:text-3xl font-bold text-[#00e5ff]">
                {burned.toFixed(1)}M
              </div>
              <div className="text-xs text-[#4a6078] uppercase tracking-wider mt-1">Tokens Burned</div>
            </div>
            <div className="text-center">
              <div className="font-[var(--font-mono)] text-2xl md:text-3xl font-bold text-[#00e5ff]">94.2</div>
              <div className="text-xs text-[#4a6078] uppercase tracking-wider mt-1">Avg pLDDT</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/lab"
              className="px-8 py-3.5 rounded-lg font-semibold bg-gradient-to-r from-[#00e5ff] to-[#4488ff] text-[#060a0f] no-underline shadow-[0_4px_24px_rgba(0,229,255,0.3)] hover:shadow-[0_8px_32px_rgba(0,229,255,0.4)] hover:-translate-y-0.5 transition-all"
            >
              Enter the Lab
            </Link>
            <Link
              to="/arena"
              className="px-8 py-3.5 rounded-lg font-semibold border border-[rgba(0,229,255,0.25)] text-[#00e5ff] no-underline hover:bg-[rgba(0,229,255,0.08)] transition-all"
            >
              Enter the Arena
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="font-[var(--font-mono)] text-xs text-[#00e5ff] uppercase tracking-[0.15em] mb-4">// Mechanics</div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">From Hypothesis to Molecule</h2>
            <p className="text-[#7a8fa8] text-lg">
              Each round is a scientific puzzle. Community chooses the direction, AI computes the structure, blockchain records the result.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-8 overflow-hidden hover:border-[rgba(0,229,255,0.25)] hover:-translate-y-1 transition-all group"
              >
                <div className="absolute -top-2 right-4 font-[var(--font-mono)] text-7xl font-bold text-[rgba(0,229,255,0.06)] leading-none">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${step.color}`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-[#7a8fa8] text-sm leading-relaxed mb-4">{step.desc}</p>
                <div className="p-3 bg-black/30 rounded-lg font-[var(--font-mono)] text-sm text-[#00e5ff] border-l-[3px] border-[#00e5ff] overflow-x-auto">
                  {step.formula}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VOTING ROUNDS */}
      <section className="py-24 px-6 bg-[#0b1220]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="font-[var(--font-mono)] text-xs text-[#00e5ff] uppercase tracking-[0.15em] mb-4">// Rounds</div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Active Voting</h2>
            <p className="text-[#7a8fa8] text-lg">
              Burn tokens to support a hypothesis. The more you burn — the higher your vote weight.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {rounds.map((round, i) => (
              <div
                key={i}
                className={`bg-[#0e1828] border rounded-2xl p-6 md:p-8 flex flex-col md:grid md:grid-cols-[auto_1fr_auto_auto] gap-6 items-center transition-all ${
                  round.status === 'live'
                    ? 'border-[#00e5ff] shadow-[0_0_30px_rgba(0,229,255,0.1)]'
                    : 'border-[rgba(0,229,255,0.1)] hover:border-[rgba(0,229,255,0.25)]'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    round.status === 'live'
                      ? 'bg-[#00e5ff] animate-pulse shadow-[0_0_10px_#00e5ff]'
                      : round.status === 'open'
                      ? 'bg-[#00ff88] shadow-[0_0_10px_#00ff88]'
                      : 'bg-[#4a6078]'
                  }`}
                />

                <div>
                  <h4 className="text-lg font-semibold mb-1">{round.title}</h4>
                  <p className="text-sm text-[#7a8fa8]">{round.desc}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {round.options.map((opt, j) => (
                    <button
                      key={j}
                      disabled={round.status === 'closed'}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        round.status === 'closed'
                          ? 'border-[rgba(0,229,255,0.1)] text-[#4a6078] cursor-not-allowed'
                          : 'border-[rgba(0,229,255,0.1)] text-[#7a8fa8] hover:border-[#00e5ff] hover:text-[#00e5ff] hover:bg-[rgba(0,229,255,0.05)] cursor-pointer'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="text-right min-w-[140px]">
                  <div className="font-[var(--font-mono)] text-lg font-bold text-[#00ff88]">{round.prize}</div>
                  <div className="text-xs text-[#4a6078] mt-1 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" /> {round.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-[rgba(0,229,255,0.1)] text-center">
        <div className="flex justify-center gap-8 mb-6 flex-wrap">
          <a href="#" className="text-[#7a8fa8] hover:text-[#00e5ff] transition-colors text-sm">GitHub</a>
          <a href="#" className="text-[#7a8fa8] hover:text-[#00e5ff] transition-colors text-sm">Documentation</a>
          <a href="#" className="text-[#7a8fa8] hover:text-[#00e5ff] transition-colors text-sm">Whitepaper</a>
          <a href="#" className="text-[#7a8fa8] hover:text-[#00e5ff] transition-colors text-sm">Discord</a>
          <a href="#" className="text-[#7a8fa8] hover:text-[#00e5ff] transition-colors text-sm">Twitter / X</a>
        </div>
        <p className="text-[#4a6078] text-sm">AI PROTEUS © 2025 — Decoding Life Through Decentralized Intelligence</p>
        <p className="text-[#4a6078] text-xs mt-2">
          All predictions are computational hypotheses. Not medical advice.
        </p>
      </footer>
    </div>
  );
}
