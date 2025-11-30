use anchor_lang::prelude::*;

declare_id!("BXQhGTiWA7eSdDfQTNQQSNaUvHPTYqimin9HbWGiFZUk");

const STARTING_POINTS: u32 = 10;

#[program]
pub mod points {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.player.points = STARTING_POINTS;
        ctx.accounts.player.authority = ctx.accounts.signer.key();

        Ok(())
    }

    pub fn transfer_points(ctx: Context<TransferPoints>, amount: u32) -> Result<()> {

         // could bypass this using anchor contsraints above
    //    require!(ctx.accounts.from.authority == ctx.accounts.authority.key(), Errors::SignerIsNotAuthority);
    //    require!(ctx.accounts.from.points >= amount, Errors::InsufficientPoints);

       ctx.accounts.from.points -= amount;
       ctx.accounts.to.points += amount;
       Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + Player::INIT_SPACE,
        seeds = [&(signer.as_ref().key().to_bytes())],
        bump
    )]
    player: Account<'info, Player>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u32)]
pub struct TransferPoints<'info> {
    #[account(mut, 
        has_one = authority @ Errors::SignerIsNotAuthority,
        constraint = from.points >= amount @ Errors::InsufficientPoints
    )] // added anchor constraints
    from: Account<'info, Player>,
    #[account(mut)]
    to: Account<'info, Player>,
    #[account(mut)]
    authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Player {
    pub authority: Pubkey,
    pub points: u32,
}

#[error_code]
pub enum Errors {
    #[msg("Signer is not authority")]
    SignerIsNotAuthority,
    #[msg("Insufficient points")]
    InsufficientPoints
}