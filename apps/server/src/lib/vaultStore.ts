import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto'
import { nanoid } from 'nanoid'
import { config } from '../config.js'
import type { VaultEntry, VaultType } from '../types/index.js'

// ── Encryption helpers ─────────────────────────────────────────────

const SALT = 'sovermind-vault-v1'
const IV_LEN  = 12   // GCM nonce
const TAG_LEN = 16   // GCM auth tag

async function deriveMachineKey(): Promise<Buffer> {
  let machineId: string
  try {
    // Use @node-rs/machine-id when available
    const mod = await import('@node-rs/machine-id' as string) as { machineId: () => string }
    machineId = mod.machineId()
  } catch {
    // Stable fallback from OS primitives — deterministic per user/machine
    machineId = `${os.hostname()}:${os.userInfo().username}:${process.platform}`
  }
  return scryptSync(machineId, SALT, 32)
}

function encrypt(plaintext: string, key: Buffer): Buffer {
  const iv     = randomBytes(IV_LEN)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const body   = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag    = cipher.getAuthTag()
  // Layout: [iv(12)] [tag(16)] [ciphertext]
  return Buffer.concat([iv, tag, body])
}

function decrypt(data: Buffer, key: Buffer): string {
  const iv  = data.subarray(0, IV_LEN)
  const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const body = data.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8')
}

// ── VaultStore ────────────────────────────────────────────────────

export class VaultStore {
  private entries: Map<string, VaultEntry> = new Map()
  private key:     Buffer | null = null
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private readonly vaultPath: string

  constructor() {
    this.vaultPath = config.VAULT_PATH
  }

  async init(): Promise<void> {
    this.key = await deriveMachineKey()

    // Ensure directory exists
    await fs.mkdir(path.dirname(this.vaultPath), { recursive: true })

    await this.load()
  }

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.vaultPath)
      const plaintext = decrypt(raw, this.requireKey())
      const parsed = JSON.parse(plaintext) as VaultEntry[]
      this.entries.clear()
      for (const entry of parsed) {
        this.entries.set(entry.id, entry)
      }
    } catch (err: unknown) {
      // File doesn't exist yet or is empty — start fresh
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        // Genuine decryption / parse error — log but don't crash
        console.warn('[VaultStore] Failed to load vault — starting empty:', String(err))
      }
      this.entries.clear()
    }
  }

  async save(): Promise<void> {
    const plaintext = JSON.stringify(Array.from(this.entries.values()), null, 2)
    const encrypted = encrypt(plaintext, this.requireKey())
    // Write atomically via temp file
    const tmp = `${this.vaultPath}.tmp.${Date.now()}`
    await fs.writeFile(tmp, encrypted)
    await fs.rename(tmp, this.vaultPath)
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      this.save().catch((err) => {
        console.error('[VaultStore] Scheduled save failed:', err)
      })
    }, 500)
  }

  async add(input: Omit<VaultEntry, 'id' | 'createdAt'>): Promise<VaultEntry> {
    const entry: VaultEntry = {
      ...input,
      id:        nanoid(),
      createdAt: new Date().toISOString(),
    }
    this.entries.set(entry.id, entry)
    this.scheduleSave()
    return entry
  }

  async getAll(filter?: { type?: VaultType; limit?: number; offset?: number }): Promise<VaultEntry[]> {
    let results = Array.from(this.entries.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (filter?.type) {
      results = results.filter((e) => e.type === filter.type)
    }

    const offset = filter?.offset ?? 0
    const limit  = filter?.limit  ?? 50
    return results.slice(offset, offset + limit)
  }

  async getById(id: string): Promise<VaultEntry | null> {
    return this.entries.get(id) ?? null
  }

  async delete(id: string): Promise<boolean> {
    const existed = this.entries.delete(id)
    if (existed) this.scheduleSave()
    return existed
  }

  async purge(): Promise<void> {
    this.entries.clear()
    // Immediate synchronous wipe — bypass debounce
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    const plaintext = '[]'
    const encrypted = encrypt(plaintext, this.requireKey())
    await fs.writeFile(this.vaultPath, encrypted)
  }

  count(): number {
    return this.entries.size
  }

  private requireKey(): Buffer {
    if (!this.key) throw new Error('[VaultStore] Not initialized — call init() first')
    return this.key
  }
}

// Singleton
export const vault = new VaultStore()
