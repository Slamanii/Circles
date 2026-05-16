use crate::program_accounts::state::GlobalState;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke_signed;

const SPL_ACCOUNT_COMPRESSION_ID: Pubkey = anchor_lang::solana_program::pubkey!("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK");


pub fn create_tree(ctx: Context<CreateTree>, max_depth: u32, max_buffer_size: u32) -> Result<()> {

    let state = &mut ctx.accounts.global_state;

    require!(
        ctx.accounts.payer.key() == state.authority,
        CustomError::Unauthorized
    ); 

    require!(
        state.current_tree == Pubkey::default(),
        CustomError::TreeAlreadyInitialized
    );

    require!(
        ctx.accounts.authority.key() == state.authority,
        CustomError::Unauthorized
    );

    let authority_seeds: &[&[u8]] = &[b"tree_authority", &[ctx.bumps.tree_authority]];
    let signer = &[authority_seeds];


    // Build the init_empty_merkle_tree instruction discriminator manually
    // spl-account-compression instruction discriminator for init_empty_merkle_tree
    let mut data = vec![191u8, 11, 119, 7, 177, 138, 216, 143]; // discriminator
    data.extend_from_slice(&max_depth.to_le_bytes());
    data.extend_from_slice(&max_buffer_size.to_le_bytes());

    let ix = Instruction {
        program_id: ctx.accounts.compression_program.key(),
        accounts: vec![
            anchor_lang::solana_program::instruction::AccountMeta::new(
                ctx.accounts.merkle_tree.key(), false
            ),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                ctx.accounts.tree_authority.key(), false
            ),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                ctx.accounts.log_wrapper.key(), false
            ),
        ],
        data,
    };

    invoke_signed(
        &ix,
        &[
            ctx.accounts.merkle_tree.to_account_info(),
            ctx.accounts.tree_authority.to_account_info(),
            ctx.accounts.log_wrapper.to_account_info(),
        ],
        signer,
    )?;

    state.current_tree = ctx.accounts.merkle_tree.key();
    state.max_depth = max_depth;
    state.max_buffer_size = max_buffer_size;
    state.minted_in_current_tree = 0;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateTree<'info> {
    #[account(mut)]
    pub payer: Signer<'info>, //Treasury
    pub authority: Signer<'info>,
    /// CHECK: This is a Merkle tree account created and initialized via SPL Account Compression CPI
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,
    /// CHECK: PDA used as tree authority signer for CPI
    #[account(
        seeds = [b"tree_authority"],
        bump
    )]
    pub tree_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    /// CHECK: explanation
    #[account(address = SPL_ACCOUNT_COMPRESSION_ID)]
    pub compression_program: UncheckedAccount<'info>,
    /// CHECK: explanation
    pub log_wrapper: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Tree already initialized")]
    TreeAlreadyInitialized,
}