# SoverMind — Demo Walkthrough
> **Hackathon judge script** · Follow this to see all features in ~5 minutes.

---

## 0 · Setup

| Mode | URL / Command |
|---|---|
| **Live Vercel demo** | `https://sovermind.vercel.app` *(QVAC simulated, Solana real)* |
| **Full local run** | See [README.md → Running Locally](./README.md#running-locally) |

> The demo banner at the bottom of every page confirms you are in **DEMO MODE** when on Vercel.  
> All "bytes sent to cloud" counters will read **0** — even in demo mode the frontend never exfiltrates data.

---

## 1 · Monitor Page — AI Health Query

1. Open the **Monitor** tab (stethoscope icon in sidebar).
2. Type a health question in the input — e.g. _"What are the side effects of Metformin?"_
3. Watch the response stream token-by-token (60 ms/word in demo mode, real GPU speed locally).
4. Change the **Language** dropdown to Tamil, Hindi, or Swahili — the response re-streams translated.
5. Observe the **BYTES SENT TO CLOUD: 0** stat in the header — it never increments.

**What judges see:**  
A responsive, streaming AI health assistant that runs entirely on-device (or simulates it faithfully in demo mode).

---

## 2 · Scan Page — OCR Prescription Analysis

1. Open the **Scan** tab (camera icon).
2. Drag and drop any image of a prescription label (or use the sample image in `/reference/`).
3. Wait ~2 s for QVAC OCR to process.
4. Three drug entities appear with staggered animation:
   - Name, dosage, instructions, category, confidence score
   - ⚠ Warning badge on Atorvastatin: *"Avoid grapefruit juice"*
5. Click **"Ask about [drug name]"** on any entity → jumps to Monitor with a pre-filled query.

**What judges see:**  
Privacy-first medical OCR — no image ever leaves the device.

---

## 3 · Vault Page — Encrypted Local Storage

1. Open the **Vault** tab (lock icon).
2. Run an AI query from Monitor; it auto-commits to the Vault.
3. In the Vault, entries are tagged `query`, `prescription`, or `report`.
4. Use the filter tabs and grid/list toggle.
5. Expand any entry to see the full raw JSON data stored in `localStorage`.

**What judges see:**  
A HIPAA-friendly local vault — all data stays in the browser, zero cloud.

---

## 4 · Solana Payment — Premium Report Unlock

> Requires a Solana wallet (Phantom recommended) with devnet USDT.  
> Get devnet USDT via [spl-token-faucet.com](https://www.spl-token-faucet.com/?token-name=USDT).

1. In the **Vault**, locate any entry and click the **⭐ Premium** button.
2. Tether WDK prompts your Phantom wallet to approve:
   - 0.50 USDT (devnet) → SoverMind treasury
3. Approve the transaction.
4. The session log at the bottom prints:
   ```
   ✓ Payment confirmed: <tx-sig>…
   ℹ Explorer: https://explorer.solana.com/tx/<sig>?cluster=devnet
   ```
5. Click the Explorer link to verify the on-chain `UnlockRecord` PDA.

**What judges see:**  
A live Tether USDT micro-payment on Solana devnet, with a privacy-preserving SHA-256 hash (no health data on-chain).

---

## 5 · Privacy Proof

| Claim | Evidence |
|---|---|
| Zero cloud data | `bytesSentToCloud = 0` constant in `src/lib/qvac.ts`; network tab shows no outbound health data |
| No health data on-chain | Only `SHA-256(reportContent)` stored in `UnlockRecord`; verify on explorer |
| Local vault | Open DevTools → Application → localStorage → `sovermind_vault` |
| Offline capable | Disconnect Wi-Fi in local mode; app continues to function |

---

## 6 · Architecture Glance

```
Browser (Vite/React)
  └─ Monitor / Scan / Vault pages
       ├─ QVAC WebSocket → localhost:3001 (Fastify + Whisper + LLaMA)
       │    └─ All inference runs on local GPU via Vulkan
       ├─ Solana devnet → Anchor program Gyk1UsWrmo2W3p4LGTyyFbsXCWwsocKVc8X3tdDaJXJ4
       │    └─ 0.50 USDT unlock via Tether WDK
       └─ localStorage vault (never synced to cloud)
```

---

## 7 · Running Locally (full offline mode)

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/sovermind
cd sovermind

# 2. Drop GGUF model into backend
cp ~/Downloads/llama-3-8b-q4.gguf apps/server/models/

# 3. Configure
cp apps/app/.env.example apps/app/.env.local
# Set VITE_DEMO_MODE=false in .env.local

# 4. Start backend (Fastify + QVAC)
cd apps/server && npm install && npm run dev

# 5. Start frontend
cd ../app && npm install && npm run dev

# 6. Open http://localhost:5173
```

> No internet required after model download.
