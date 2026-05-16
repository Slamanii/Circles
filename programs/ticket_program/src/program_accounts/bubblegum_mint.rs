
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::invoke_signed;
use mpl_bubblegum::types::{MetadataArgs, TokenProgramVersion, TokenStandard};
use crate::program_accounts::state::GlobalState;


// Program IDs
const BUBBLEGUM_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");
const SPL_NOOP_ID: Pubkey = anchor_lang::solana_program::pubkey!("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV");
const SPL_COMPRESSION_ID: Pubkey = anchor_lang::solana_program::pubkey!("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK");

pub const EVENT_SIZE: usize = 8   // discriminator
    + 8                           // max_supply
    + 8                           // minted
    + 32                          // authority
    + 1                           // is_active
    + 4 + 64                      // name string (max 64 chars)
    + 4 + 16                      // symbol string (max 16 chars)
    + 4 + 200;                    // uri string (max 200 chars)

#[error_code]
pub enum CustomError {
    #[msg("Event is inactive")]
    EventInactive,
    #[msg("Event is sold out")]
    SoldOut,
    #[msg("Tree is full, create a new tree")]
    TreeFull,
    #[msg("Invalid compression program")]
    InvalidCompressionProgram,
    #[msg("Invalid log wrapper program")]
    InvalidLogWrapper,
    #[msg("Invalid bubblegum program")]
    InvalidBubblegumProgram,
}

#[event]
pub struct TicketMinted {
    pub owner: Pubkey,
    pub event_key: Pubkey,
    pub merkle_tree: Pubkey,
    pub leaf_index: u64,
}

#[account]
pub struct Event {
    pub authority: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub max_supply: u64,
    pub minted: u64,
    pub is_active: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MetadataArgsInput {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

pub fn create_event(
    ctx: Context<CreateEvent>,
    name: String,
    symbol: String,
    uri: String,
    max_supply: u64,
    event_id: String,
) -> Result<()> {
    let event = &mut ctx.accounts.event;
    event.authority = ctx.accounts.authority.key();
    event.name = name;
    event.symbol = symbol;
    event.uri = uri;
    event.max_supply = max_supply;
    event.minted = 0;
    event.is_active = true;
    Ok(())
}

pub fn mint_cnft(ctx: Context<MintCnft>, metadata: MetadataArgsInput) -> Result<()> {
    let state = &ctx.accounts.global_state;
    let event = &mut ctx.accounts.event;

    // --- Validate programs ---
    require!(
        ctx.accounts.bubblegum_program.key() == BUBBLEGUM_PROGRAM_ID,
        CustomError::InvalidBubblegumProgram
    );
    require!(
        ctx.accounts.compression_program.key() == SPL_COMPRESSION_ID,
        CustomError::InvalidCompressionProgram
    );
    require!(
        ctx.accounts.log_wrapper.key() == SPL_NOOP_ID,
        CustomError::InvalidLogWrapper
    );

    // --- Business logic checks ---
    require!(event.is_active, CustomError::EventInactive);
    require!(event.minted < event.max_supply, CustomError::SoldOut);

    // --- Tree capacity check ---
    let max_leaves = 1u64 << state.max_depth;
    require!(
        state.minted_in_current_tree < max_leaves,
        CustomError::TreeFull
    );

    // --- Build metadata ---
    let metadata_args = MetadataArgs {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        seller_fee_basis_points: 0,
        primary_sale_happened: true,
        is_mutable: false,
        edition_nonce: None,
        token_standard: Some(TokenStandard::NonFungible),
        collection: None,
        uses: None,
        token_program_version: TokenProgramVersion::Original,
        creators: vec![],
    };

    // --- Build signer seeds ---
    let authority_seeds: &[&[u8]] = &[b"tree_authority", &[ctx.bumps.tree_authority]];
    let signer = &[authority_seeds];

    // --- Build mint_v1 CPI instruction ---
    // Discriminator: sha256("global:mint_v1")[..8]
    let mut ix_data = vec![145u8, 98, 192, 118, 184, 147, 118, 104];
    ix_data.extend_from_slice(&metadata_args.try_to_vec()?);

    let ix = Instruction {
        program_id: ctx.accounts.bubblegum_program.key(),
        accounts: vec![
            // tree_authority (writable=false, signer=false)
            AccountMeta::new_readonly(ctx.accounts.tree_authority.key(), false),
            // leaf_owner (writable=false, signer=false)
            AccountMeta::new_readonly(ctx.accounts.owner.key(), false),
            // leaf_delegate (writable=false, signer=false)
            AccountMeta::new_readonly(ctx.accounts.delegate.key(), false),
            // merkle_tree (writable=true, signer=false)
            AccountMeta::new(ctx.accounts.merkle_tree.key(), false),
            // payer (writable=true, signer=true)
            AccountMeta::new(ctx.accounts.payer.key(), true),
            // tree_delegate = tree_authority PDA (writable=false, signer=true via PDA)
            AccountMeta::new_readonly(ctx.accounts.tree_authority.key(), true),
            // log_wrapper
            AccountMeta::new_readonly(ctx.accounts.log_wrapper.key(), false),
            // compression_program
            AccountMeta::new_readonly(ctx.accounts.compression_program.key(), false),
            // system_program
            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
        ],
        data: ix_data,
    };

    invoke_signed(
        &ix,
        &[
            ctx.accounts.tree_authority.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.merkle_tree.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.delegate.to_account_info(),
            ctx.accounts.log_wrapper.to_account_info(),
            ctx.accounts.compression_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.bubblegum_program.to_account_info(),
        ],
        signer,
    )?;

    // --- Update state only after successful CPI ---
    let state = &mut ctx.accounts.global_state;
    let leaf_index = state.minted_in_current_tree;
    event.minted += 1;
    state.minted_in_current_tree += 1;

    emit!(TicketMinted {
        owner: ctx.accounts.owner.key(),
        event_key: ctx.accounts.event.key(),
        merkle_tree: ctx.accounts.merkle_tree.key(),
        leaf_index,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(max_supply: u64, event_id: String)]
pub struct CreateEvent<'info> {
    #[account(
        init,
        payer = authority,
        space = EVENT_SIZE,
        seeds = [b"event", event_id.as_bytes()],
        bump
    )]
    pub event: Account<'info, Event>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintCnft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: leaf owner — no signing required for cNFT ownership
    pub owner: UncheckedAccount<'info>,
    pub delegate: Signer<'info>,
    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    /// CHECK: PDA — signs the bubblegum CPI as tree delegate
    #[account(seeds = [b"tree_authority"], bump)]
    pub tree_authority: UncheckedAccount<'info>,
    /// CHECK: validated by bubblegum CPI
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,
    #[account(
        mut,
        constraint = event.is_active @ CustomError::EventInactive,
    )]
    pub event: Account<'info, Event>,
    /// CHECK: verified against BUBBLEGUM_PROGRAM_ID in handler
    pub bubblegum_program: UncheckedAccount<'info>,
    /// CHECK: verified against SPL_COMPRESSION_ID in handler
    pub compression_program: UncheckedAccount<'info>,
    /// CHECK: verified against SPL_NOOP_ID in handler
    pub log_wrapper: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}