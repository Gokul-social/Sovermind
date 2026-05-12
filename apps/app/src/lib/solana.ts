import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor'
// @tether.io/wdk is a private Tether package — install from Tether's registry.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error optional private package
import { WDK } from '@tether.io/wdk'

// ── Constants ─────────────────────────────────────────────────────────────────

const DEVNET_RPC = 'https://api.devnet.solana.com'

const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID ?? 'Gyk1UsWrmo2W3p4LGTyyFbsXCWwsocKVc8X3tdDaJXJ4',
)
const TREASURY = new PublicKey(
  import.meta.env.VITE_TREASURY_PUBKEY ?? '11111111111111111111111111111111',
)

// Tether USDT devnet mint (official Tether devnet deployment)
export const USDT_MINT = new PublicKey(
  import.meta.env.VITE_USDT_MINT_DEVNET ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
)

// Placeholder IDL — replaced by `contract/target/idl/sovermind.json` after `anchor build`
// Copy the generated file to apps/app/src/lib/sovermind_idl.json
let _idl: Idl | null = null
async function getIdl(): Promise<Idl> {
  if (!_idl) {
    _idl = (await import('./sovermind_idl.json')) as unknown as Idl
  }
  return _idl
}

const wdk = new WDK({ network: 'devnet' })

// ── Hash helper ───────────────────────────────────────────────────────────────

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface UnlockResult {
  signature:   string
  explorerUrl: string
}

/**
 * Connects the user's wallet via Tether WDK, transfers 0.50 USDT on devnet,
 * and stores a privacy-preserving unlock record on-chain (SHA-256 hash only —
 * no health data ever leaves the device).
 */
export async function unlockPremiumReport(
  sessionId:     string,
  reportContent: string,
): Promise<UnlockResult> {
  const wallet     = await wdk.connectWallet()
  const connection = new Connection(DEVNET_RPC, 'confirmed')
  const provider   = new AnchorProvider(connection, wallet, {})

  const idl     = await getIdl()
  // Anchor 0.30+: address is read from idl.address — no programId arg
  const program = new Program(idl, provider)

  const reportHash       = await sha256Hex(reportContent)
  const userTokenAccount = await wdk.getUSDTAccount(wallet.publicKey)

  const tx = await program.methods
    .unlockPremiumReport(sessionId, reportHash)
    .accounts({
      user:                  wallet.publicKey,
      userTokenAccount,
      treasuryTokenAccount:  TREASURY,
    })
    .rpc()

  return {
    signature:   tx,
    explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
  }
}

/**
 * Checks whether the connected wallet holds a valid on-chain unlock record
 * for the given session. Returns false if no wallet is connected or no record exists.
 */
export async function verifyReportUnlock(sessionId: string): Promise<boolean> {
  try {
    const wallet     = await wdk.getConnectedWallet()
    const connection = new Connection(DEVNET_RPC, 'confirmed')
    const provider   = new AnchorProvider(connection, wallet, {})

    const idl     = await getIdl()
    // Anchor 0.30+: address is read from idl.address — no programId arg
    const program = new Program(idl, provider)

    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('unlock'),
        wallet.publicKey.toBuffer(),
        Buffer.from(sessionId),
      ],
      PROGRAM_ID,
    )

    // Fetch the PDA account directly — avoids relying on a `view()` call
    type AccountNS = { unlockRecord: { fetchNullable: (pda: PublicKey) => Promise<{ isValid: boolean } | null> } }
    const account = await (program.account as unknown as AccountNS).unlockRecord.fetchNullable(pda)
    return account !== null && account.isValid
  } catch {
    return false
  }
}
