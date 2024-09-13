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

export async function transaction(
  account: PublicKey,
  amount?: number,
  address?: string
) {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));

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
