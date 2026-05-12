import * as anchor from '@coral-xyz/anchor'
import { Connection } from '@solana/web3.js'

async function deploy() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
  const wallet     = anchor.Wallet.local()  // reads ~/.config/solana/id.json
  const provider   = new anchor.AnchorProvider(connection, wallet, {})
  anchor.setProvider(provider)

  console.log('Deploying SoverMind contract to devnet...')
  console.log('Wallet:', wallet.publicKey.toString())

  // Airdrop 2 SOL for deployment gas (devnet only)
  const airdropSig = await connection.requestAirdrop(
    wallet.publicKey,
    2 * anchor.web3.LAMPORTS_PER_SOL,
  )
  await connection.confirmTransaction(airdropSig)
  console.log('Airdrop confirmed — 2 SOL received')

  // Build and deploy via Anchor CLI:
  //   cd contract && anchor build && anchor deploy --provider.cluster devnet
  //
  // After deploy, copy the printed program ID into:
  //   1. contract/Anchor.toml   → [programs.devnet] sovermind = "<ID>"
  //   2. contract/programs/sovermind/src/lib.rs → declare_id!("<ID>")
  //   3. apps/app/.env.local    → VITE_PROGRAM_ID=<ID>
  //   4. Vercel dashboard       → VITE_PROGRAM_ID=<ID>

  console.log(`
╔══════════════════════════════════════════════╗
║  SOVERMIND CONTRACT READY FOR DEPLOYMENT     ║
║  Network:  Solana Devnet                     ║
║  Wallet:   ${wallet.publicKey.toString().slice(0, 32)}...  ║
║                                              ║
║  Run: anchor build && anchor deploy          ║
║  Then update VITE_PROGRAM_ID in .env.local   ║
╚══════════════════════════════════════════════╝
  `)
}

deploy().catch(console.error)
