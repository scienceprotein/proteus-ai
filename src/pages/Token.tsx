import { Flame, Gift, FlaskConical, Lock } from 'lucide-react';

export default function Token() {
  const features = [
    {
      icon: <Flame className="w-8 h-8" />,
      title: 'Burn-to-Vote',
      desc: 'Every vote requires burning tokens. The more you burn — the higher your vote weight in the round.',
      stat: 'Burned: 42.7M PROTEUS',
      statColor: 'text-[#ff3366]',
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: 'Winning Rewards',
      desc: 'Voters for the winning hypothesis receive the predicted structure NFT + prize pool distribution.',
      stat: 'Distributed: 12.3M PROTEUS',
      statColor: 'text-[#00e5ff]',
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Lab Staking',
      desc: 'Stake tokens to unlock priority Arena viewing and increased vote weight.',
      stat: 'APY: 23.4%',
      statColor: 'text-[#00ff88]',
    },
    {
      icon: <FlaskConical className="w-8 h-8" />,
      title: 'Lab Grants',
      desc: 'Portion of fees goes to real biological labs for experimental validation of top predictions.',
      stat: 'Grants Given: $890K',
      statColor: 'text-[#b967ff]',
    },
  ];

  const tokenomics = [
    { label: 'Total Supply', value: '1,000,000,000 PROTEUS' },
    { label: 'Circulating', value: '420,000,000 PROTEUS' },
    { label: 'Burned to Date', value: '42,700,000 PROTEUS' },
    { label: 'Staked', value: '180,000,000 PROTEUS' },
    { label: 'Market Cap', value: '$42.7M' },
    { label: 'Price', value: '$0.1017' },
  ];

  return (
    <div className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="font-[var(--font-mono)] text-xs text-[#00e5ff] uppercase tracking-[0.15em] mb-4">// Tokenomics</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">$PROTEUS — Fuel of Discovery</h1>
          <p className="text-[#7a8fa8] text-lg">
            Deflationary token with mandatory burn mechanics for scientific participation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-8 text-center hover:-translate-y-1 hover:border-[#00ff88] transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[rgba(0,229,255,0.1)] flex items-center justify-center text-[#00e5ff] mx-auto mb-5 group-hover:bg-[rgba(0,255,136,0.1)] group-hover:text-[#00ff88] transition-colors">
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
              <p className="text-sm text-[#7a8fa8] leading-relaxed mb-5">{f.desc}</p>
              <div className={`pt-4 border-t border-[rgba(0,229,255,0.1)] font-[var(--font-mono)] text-sm ${f.statColor}`}>
                {f.stat}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#0e1828] border border-[rgba(0,229,255,0.1)] rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Token Distribution</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {tokenomics.map((t, i) => (
              <div key={i} className="text-center">
                <div className="text-xs text-[#4a6078] uppercase tracking-wider mb-2">{t.label}</div>
                <div className="font-[var(--font-mono)] text-lg font-bold text-[#00e5ff]">{t.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-[rgba(0,229,255,0.05)] to-[rgba(0,255,136,0.05)] border border-[rgba(0,229,255,0.1)] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Smart Contract — Voting</h2>
          <div className="font-[var(--font-mono)] text-sm bg-black/30 rounded-xl p-6 overflow-x-auto">
            <pre className="text-[#7a8fa8] leading-relaxed">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProteusVoting {
    IERC20 public proteus;
    
    struct Round {
        bytes32 targetProtein;
        uint256 deadline;
        uint256 totalBurned;
        bool settled;
    }
    
    struct Vote {
        uint8 hypothesis;      // 0, 1, 2
        uint256 amountBurned;
        address voter;
    }
    
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => Vote[]) public roundVotes;
    mapping(uint256 => mapping(uint8 => uint256)) public hypothesisBurned;
    
    event VoteCast(uint256 roundId, address voter, uint8 hypothesis, uint256 amount);
    event RoundSettled(uint256 roundId, uint8 winner, bytes32 resultHash);
    
    function vote(uint256 roundId, uint8 hypothesis, uint256 amount) external {
        require(block.timestamp < rounds[roundId].deadline, "Round closed");
        require(hypothesis < 3, "Invalid hypothesis");
        
        // Transfer and BURN tokens
        proteus.transferFrom(msg.sender, address(0), amount);
        
        roundVotes[roundId].push(Vote(hypothesis, amount, msg.sender));
        hypothesisBurned[roundId][hypothesis] += amount;
        rounds[roundId].totalBurned += amount;
        
        emit VoteCast(roundId, msg.sender, hypothesis, amount);
    }
    
    function settleRound(uint256 roundId, uint8 winner, bytes32 resultHash) external {
        require(!rounds[roundId].settled, "Already settled");
        rounds[roundId].settled = true;
        
        // Distribute rewards to winners
        // Mint structure NFTs
        // Record result hash on-chain
        
        emit RoundSettled(roundId, winner, resultHash);
    }
}`}
            </pre>
          </div>
          <p className="text-center text-sm text-[#4a6078] mt-4">
            Contract deployed on Ethereum + Arbitrum. Verified on Etherscan.
          </p>
        </div>
      </div>
    </div>
  );
}
