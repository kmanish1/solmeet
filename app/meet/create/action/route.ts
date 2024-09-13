import { PrismaClient } from "@prisma/client";
import {
  ActionError,
  ActionPostRequest,
  ActionPostResponse,
  createActionHeaders,
  createPostResponse,
} from "@solana/actions";
import { PublicKey } from "@solana/web3.js";
import axios from "axios";
import * as cheerio from "cheerio";
import { mockTx } from "../fn";
import QRCode from "qrcode";
const headers = createActionHeaders();

export const GET = async (req: Request) => {
  return Response.json({ message: "Method not supported" } as ActionError, {
    status: 403,
    headers,
  });
};

export const OPTIONS = async () => Response.json(null, { headers });

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body: ActionPostRequest = await req.json();
  //@ts-ignore
  const arr = body.data.meetid.split(",");
  const ogImageUrl = await getImage();

  let account: PublicKey;
  try {
    account = new PublicKey(body.account);
  } catch (err) {
    throw new Error("Invalid account");
  }

  const username = new URL(req.url).searchParams.get("username")!;
  //@ts-ignore
  let price = body.data!.price;
  const id = await prisma.solMeet.create({
    data: {
      username,
      slug: arr[3],
      meetingId: parseInt(arr[0]),
      title: arr[1],
      description: arr[2],
      address: account.toBase58(),
      price: parseInt(price),
      image: ogImageUrl!,
    },
  });

  const tx = await mockTx(account);
  const url = `https://solmeet.click/meet/?${id.id}`;
  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    url
  )}`;

  const qrCodeDataUrl = await QRCode.toDataURL(twitterIntentUrl);
  const payload: ActionPostResponse = await createPostResponse({
    fields: {
      transaction: tx,
      message: `this is the last action`,
      links: {
        next: {
          type: "inline",
          action: {
            type: "completed",
            title: "completed the txn",
            description: `Scan the QR Code to directly post on X. Here is your url https://solmeet.click/meet/?${id.id} `,
            icon: qrCodeDataUrl,
            label: "completed",
          },
        },
      },
    },
  });

  return Response.json(payload, { headers });
}

async function getImage() {
  const res = await axios.get("https://cal.com/thrishank");
  const html = res.data;

  const $ = cheerio.load(html);
  const ogImage = $('meta[property="og:image"]').attr("content");

  return ogImage;
}
