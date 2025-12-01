import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Points } from "../target/types/points";

// airdrop function
async function airdropSol(publickey, amount) {
  let airdropTx = await anchor
    .getProvider()
    .connection.requestAirdrop(publickey, amount);
  await confirmTransaction(airdropTx);
}

async function confirmTransaction(tx) {
  const latestBlockHash = await anchor
    .getProvider()
    .connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: tx,
  });
}

describe("points", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  // const provider = anchor.getProvider();

  const program = anchor.workspace.points as Program<Points>;

  it("Alice transfers points to Bob", async () => {
    const alice = anchor.web3.Keypair.generate();
    const bob = anchor.web3.Keypair.generate();

    // Airdrop SOL to Alice and Bob
    await airdropSol(alice.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);
    await airdropSol(bob.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);

    let seeds_alice = [alice.publicKey.toBytes()];
    const playerAlice = anchor.web3.PublicKey.findProgramAddressSync(
      seeds_alice,
      program.programId
    )[0];

    let seeds_bob = [bob.publicKey.toBytes()];
    const playerBob = anchor.web3.PublicKey.findProgramAddressSync(
      seeds_bob,
      program.programId
    )[0];

    // initialize alice and bob accounts
    await program.methods
      .initialize()
      .accounts({
        player: playerAlice,
        signer: alice.publicKey,
      })
      .signers([alice])
      .rpc();

    await program.methods
      .initialize()
      .accounts({
        player: playerBob,
        signer: bob.publicKey,
      })
      .signers([bob])
      .rpc();

    // transfer points from alice to bob
    await program.methods
      .transferPoints(5)
      .accounts({
        from: playerAlice,
        to: playerBob,
        authority: alice.publicKey, // added "provider.wallet.payer.publicKey" as authority to demonstrate anchor constraints
      } as any)
      .signers([alice]) // added "provider.wallet.payer" as authority to demonstrate anchor constraints
      .rpc();

    console.log(
      `Alice has ${
        (await program.account.player.fetch(playerAlice)).points
      } points`
    );

    console.log(
      `Bob has ${(await program.account.player.fetch(playerBob)).points} points`
    );
  });
});
