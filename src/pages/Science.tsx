import { BookOpen, ExternalLink, Microscope, Database, Brain, FlaskConical } from 'lucide-react';

export default function Science() {
  const formulas = [
    {
      title: 'Ramachandran Potential',
      math: `E(φ, ψ) = Σᵢ [Vₙ/2 · (1 + cos(n·φ - δ))] + E_vdw(rᵢⱼ) + E_elec(rᵢⱼ) + E_HB(θ, r)`,
      desc: 'Conformation energy depends on rotation angles around Cα-N (φ) and Cα-C (ψ) bonds, as well as van der Waals and electrostatic interactions.',
    },
    {
      title: 'Attention in AlphaFold',
      math: `Attention(Q, K, V) = softmax(QK^T / √dₖ) · V\nwhere Q = W_Q · MSA, K = W_K · MSA`,
      desc: 'Multiple Sequence Alignment (MSA) passes through Evoformer attention blocks, revealing co-evolutionary residue pairs.',
    },
    {
      title: 'KL-Divergence of Structure',
      math: `D_KL(P‖Q) = Σₓ P(x) · log(P(x)/Q(x))\nL = L_FAPE + L_aux + λ·D_KL`,
      desc: 'Loss function combines Frame Aligned Point Error (FAPE) for atomic accuracy and KL-divergence for angle distribution regularization.',
    },
    {
      title: 'Dissociation Constant',
      math: `K_d = [P][L] / [PL]\nΔG = ΔH - TΔS = RT·ln(K_d)`,
      desc: 'Free energy of ligand binding to protein determines drug efficacy. Target: K_d < 10 nM.',
    },
    {
      title: 'Hydrophobic Effect',
      math: `ΔG_hyd = γ · ΔASA\nΔASA = ASA_unfolded - ASA_folded`,
      desc: 'Nonpolar residues minimize contact with water, forming a hydrophobic core. This is the main driving force of protein folding.',
    },
    {
      title: 'MSA Information Entropy',
      math: `H(i) = - Σₐ pᵢ(a) · log₂(pᵢ(a))\nMI(i, j) = Σₐ,ᵦ pᵢⱼ(a,b) · log₂(pᵢⱼ/pᵢ·pⱼ)`,
      desc: 'Mutual Information (MI) between positions i and j reveals physical contact in 3D structure from evolutionary data.',
    },
  ];

  const research = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'AlphaFold (DeepMind)',
      desc: 'AI-powered 3D protein structure prediction. Opened a database of 200M+ structures.',
      link: 'https://alphafold.ebi.ac.uk',
    },
    {
      icon: <FlaskConical className="w-5 h-5" />,
      title: 'Foldit (UW)',
      desc: 'Crowdsourcing protein folding puzzle game. Users manipulate structures to minimize energy.',
      link: 'https://fold.it',
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: 'Protein Data Bank (PDB)',
      desc: 'Open database of 3D structures. Real experimental data from X-ray crystallography and cryo-EM.',
      link: 'https://rcsb.org',
    },
    {
      icon: <Microscope className="w-5 h-5" />,
      title: 'ColabFold / ESMFold',
      desc: 'Free access to protein prediction via Google Colab. Can be embedded into workflows.',
      link: 'https://github.com/sokrypton/ColabFold',
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Rosetta Commons',
      desc: 'Scientific platform for protein structure prediction, design, and docking.',
      link: 'https://www.rosettacommons.org',
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: '3Dmol.js / Mol*',
      desc: 'JavaScript libraries for molecular visualization in the browser.',
      link: 'https://3dmol.csb.pitt.edu',
    },
  ];

  return (
    <div className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="font-[var(--font-mono)] text-xs text-[#00e5ff] uppercase tracking-[0.15em] mb-4">// Mathematics</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Scientific Foundation</h1>
          <p className="text-[#7a8fa8] text-lg">
            Every prediction is grounded in physico-chemical principles and modern neural network architectures.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {formulas.map((f, i) => (
            <div
              key={i}
              className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-8 hover:border-[rgba(0,229,255,0.25)] transition-all"
            >
              <div className="text-xs text-[#4a6078] uppercase tracking-[0.08em] mb-4">{f.title}</div>
              <div className="font-[var(--font-mono)] text-sm md:text-base text-[#00e5ff] leading-relaxed p-4 bg-black/25 rounded-xl mb-4 whitespace-pre-wrap overflow-x-auto">
                {f.math}
              </div>
              <p className="text-sm text-[#7a8fa8] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="font-[var(--font-mono)] text-xs text-[#00e5ff] uppercase tracking-[0.15em] mb-4">// Research</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Build On</h2>
          <p className="text-[#7a8fa8] text-lg">
            AI PROTEUS integrates the best of computational biology, open science, and decentralized infrastructure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {research.map((r, i) => (
            <a
              key={i}
              href={r.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-6 hover:border-[rgba(0,229,255,0.25)] transition-all no-underline"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[rgba(0,229,255,0.1)] flex items-center justify-center text-[#00e5ff]">
                  {r.icon}
                </div>
                <ExternalLink className="w-4 h-4 text-[#4a6078] group-hover:text-[#00e5ff] transition-colors" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[#e8f0f8]">{r.title}</h3>
              <p className="text-sm text-[#7a8fa8] leading-relaxed">{r.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
