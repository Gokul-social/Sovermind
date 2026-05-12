use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Gyk1UsWrmo2W3p4LGTyyFbsXCWwsocKVc8X3tdDaJXJ4");

#[program]
pub mod sovermind {
    use super::*;

    /// Called when user pays 0.50 USDT to unlock a premium health report.
    /// Transfers the fee on-chain and stores a privacy-preserving record
    /// (only a SHA-256 hash of report content — no actual health data).
    pub fn unlock_premium_report(
        ctx: Context<UnlockReport>,
        session_id: String,
        report_hash: String,
    ) -> Result<()> {
        let fee_amount: u64 = 500_000; // 0.50 USDT (6-decimal mint)

        let cpi_accounts = Transfer {
            from:      ctx.accounts.user_token_account.to_account_info(),
            to:        ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, fee_amount)?;

        let record          = &mut ctx.accounts.unlock_record;
        record.user         = ctx.accounts.user.key();
        record.session_id   = session_id.clone();
        record.report_hash  = report_hash;
        record.timestamp    = Clock::get()?.unix_timestamp;
        record.is_valid     = true;

        emit!(ReportUnlocked {
            user:       ctx.accounts.user.key(),
            session_id: record.session_id.clone(),
            timestamp:  record.timestamp,
        });

        Ok(())
    }

    /// Returns true if the caller has a valid unlock record for this session.
    pub fn verify_unlock(
        ctx: Context<VerifyUnlock>,
        session_id: String,
    ) -> Result<bool> {
        let record = &ctx.accounts.unlock_record;
        Ok(record.is_valid && record.session_id == session_id)
    }
}

// ── Accounts ──────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(session_id: String)]
pub struct UnlockReport<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 4 + 64 + 4 + 64 + 8 + 1,
        seeds = [b"unlock", user.key().as_ref(), session_id.as_bytes()],
        bump
    )]
    pub unlock_record: Account<'info, UnlockRecord>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(session_id: String)]
pub struct VerifyUnlock<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"unlock", user.key().as_ref(), session_id.as_bytes()],
        bump
    )]
    pub unlock_record: Account<'info, UnlockRecord>,
}

// ── State ─────────────────────────────────────────────────────────────────────

#[account]
pub struct UnlockRecord {
    pub user:        Pubkey,  // 32
    pub session_id:  String,  // 4 + 64
    pub report_hash: String,  // 4 + 64  (SHA-256 hex, 64 chars)
    pub timestamp:   i64,     // 8
    pub is_valid:    bool,    // 1
}

// ── Events ────────────────────────────────────────────────────────────────────

#[event]
pub struct ReportUnlocked {
    pub user:       Pubkey,
    pub session_id: String,
    pub timestamp:  i64,
}
