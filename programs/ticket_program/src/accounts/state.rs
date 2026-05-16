use anchor_lang::prelude::*;

pub const GLOBAL_STATE_SIZE: usize = 8 + 32 + 32 + 4 + 4 + 8 + 1;

pub fn initialize_global_state(ctx: Context<InitializeGlobalState>) -> Result<()> {

    let state = &mut ctx.accounts.global_state;

    state.authority = ctx.accounts.authority.key();
    state.current_tree = Pubkey::default();
    state.max_depth = 14;
    state.max_buffer_size = 64;
    state.minted_in_current_tree = 0;
    state.bump = ctx.bumps.global_state;

    Ok(())
}

pub struct GlobalState {
    pub authority: Pubkey,
    pub current_tree: Pubkey,
    pub max_depth: u32,
    pub max_buffer_size: u32,
    pub minted_in_current_tree: u64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct InitializeGlobalState<'info> {
    #[account(
        init,
        payer = payer,
        space = GLOBAL_STATE_SIZE,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}