import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import axios from "axios";
import * as cheerio from "cheerio";

const connection = new Connection(clusterApiUrl("mainnet-beta"));

export async function transaction(
  account: PublicKey,
  amount?: number,
  address?: string
) {
  try {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    let to = address
      ? new PublicKey(address)
      : new PublicKey("EXBdeRCdiNChKyD7akt64n9HgSXEpUtpPEhmbnm4L6iH");

    const instruction = SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: to,
      lamports: amount ? amount * LAMPORTS_PER_SOL : 0,
    });

    const tx = new Transaction({
      feePayer: account,
      blockhash,
      lastValidBlockHeight,
    });

    tx.add(instruction);
    return tx;
  } catch (err) {
    console.log("Error in mockTx", err);
    throw "Error in mockTx";
  }
}

export async function transferUSDC(
  fromAddress: PublicKey,
  amount: number,
  toAddress: PublicKey
) {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  const mint_address = new PublicKey(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    // "9jyEAn15hMY7f5iKdUTPE5ZGaxD4BfsbHggwHFYvgF61"
  );

  try {
    const from = await getAssociatedTokenAddress(mint_address, fromAddress);

    const to = await getAssociatedTokenAddress(mint_address, toAddress);

    const instruction = createTransferInstruction(
      from,
      to,
      fromAddress,
      amount * 1_000_000
    );

    const tx = new Transaction({
      feePayer: fromAddress,
      blockhash,
      lastValidBlockHeight,
    }).add(instruction);

    return tx;
  } catch (Err) {
    throw new Error(
      "Error in transfering USDC make sure you have enough balance"
    );
  }
}
export async function getEventTypes(username: string) {
  try {
    const res = await axios.get(`https://cal.com/${username}`);

    const $ = cheerio.load(res.data);
    const nextDataScript = $("#__NEXT_DATA__").html();

    if (!nextDataScript) {
      throw new Error("Unable to find event data");
    }

    const jsonData = JSON.parse(nextDataScript!);
    const eventTypes = jsonData.props.pageProps.eventTypes;

    if (!eventTypes) {
      throw new Error("No event types found");
    }

    //@ts-ignore
    const arr = eventTypes!.map((d) => ({
      label: d.title,
      value: `${d.id},${d.title},${d.description},${d.slug},${d.length}`,
    }));
    return arr;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error("User not found, please check the spelling");
    }
    throw error;
  }
}
