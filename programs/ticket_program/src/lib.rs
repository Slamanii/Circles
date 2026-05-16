mod program_accounts;

use anchor_lang::prelude::*;
use program_accounts::compression::*;
use program_accounts::bubblegum_mint::*;
use program_accounts::state::*;

declare_id!("8Ed9Jimrz4istGe3C9QViAUsvBxTUof7MiFyJsAmpVy1");

#[program]
pub mod ticket_program {
    use super::*;

    pub fn initialize_global_state(
        ctx: Context<InitializeGlobalState>
    ) -> Result<()> {
        program_accounts::state::initialize_global_state(ctx)
    }

    
    pub fn create_tree(
        ctx: Context<CreateTree>,
        max_depth: u32,
        max_buffer_size: u32,
    ) -> Result<()> {
        program_accounts::compression::create_tree(ctx, max_depth, max_buffer_size)
    }

   pub fn create_event(
         ctx: Context<CreateEvent>,
         name: String,
         symbol: String,
         uri: String,
         max_supply: u64,
         event_id: String,
    ) -> Result<()> {
        program_accounts::bubblegum_mint::create_event(ctx, name, symbol, uri, max_supply, event_id)
    }
    pub fn mint_cnft(
        ctx: Context<MintCnft>,
        metadata: MetadataArgsInput,
    ) -> Result<()> {
        program_accounts::bubblegum_mint::mint_cnft(ctx, metadata)
    }
}


