import { PrismaClient } from "@prisma/client";
import {
  ActionError,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createActionHeaders,
  createPostResponse,
  NextActionLink,
} from "@solana/actions";
import { PublicKey } from "@solana/web3.js";
import axios from "axios";
import { transaction } from "../create/fn";
import { createSlotObjects } from "./helper";

const headers = createActionHeaders();

const prisma = new PrismaClient();

export const OPTIONS = async () => Response.json(null, { headers });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const data = await prisma.solMeet.findUnique({
    where: {
      id: id!,
    },
  });

  const today = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);

  let slotdata = {
    json: {
      usernameList: [`${data!.username}`],
      eventTypeSlug: data?.slug,
      startTime: today.toISOString(),
      endTime: oneYearFromNow.toISOString(),
      timeZone: "Asia/Calcutta",
    },
  };

  const cal_url =
    "https://cal.com/api/trpc/public/slots.getSchedule?input=" +
    encodeURIComponent(JSON.stringify(slotdata));

  const res = await axios.get(cal_url);
  let slotData = res.data.result.data.json.slots;

  let slotObjects = createSlotObjects(slotData);
  console.log(slotObjects.length);

  try {
    const payload: ActionGetResponse = {
      title: `${data!.title}`,
      description: `${data!.description}`,
      label: "Pay and Enter the details",
      icon: `${data!.image}`,
      type: "action",
      links: {
        actions: [
          {
            label: "labe 2 your wallet",
            href: "/api/actions/solmeet/create",
          },
          {
            label: "Connect your wallet",
            href: `/meet?meetingId=${encodeURIComponent(
              data!.id
            )}&wallet=${encodeURIComponent(
              data!.address
            )}&price=${encodeURIComponent(data!.price)}`,
            parameters: slotObjects,
          },
        ],
      },
    };
    return Response.json(payload, { headers });
  } catch (err) {
    console.log(err);
    let actionError: ActionError = { message: "An unknown error occurred" };
    return Response.json(actionError, {
      status: 400,
      headers,
    });
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);

    const id = decodeURIComponent(url.searchParams.get("id")!);
    const address = decodeURIComponent(url.searchParams.get("wallet")!);
    const price = decodeURIComponent(url.searchParams.get("price")!);

    const body: ActionPostRequest = await req.json();
    console.log(body);
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      throw "Invalid account provided";
    }

    const tx = await transaction(account, parseInt(price), address);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction: tx,
        message: `Received the wallet address and in the next step set the price`,
        links: {
          next: NextAction(id),
        },
      },
    });

    return Response.json(payload, { headers });
  } catch (err) {
    console.log(err);
    let actionError: ActionError = { message: "An unknown error occurred" };

    if (err instanceof Error) {
      actionError.message = err.message;
    } else if (typeof err === "string") {
      actionError.message = err;
    }

    return Response.json(actionError, {
      status: 400,
      headers,
    });
  }
}

function NextAction(id: string): NextActionLink {
  return {
    type: "inline",
    action: {
      type: "action",
      title: "Enter the meet details",
      description:
        "Enter your name , email and other information to book the slot and receive the meet the link",
      icon: "https://cal.com/_next/image?url=https%3A%2F%2Fwww.datocms-assets.com%2F77432%2F1662742532-verified.png&w=1920&q=75",
      label: "",
      links: {
        actions: [
          {
            label: "Submit",
            href: `/api/actions/action?id`,
            parameters: [
              {
                type: "text",
                label: "Enter your name",
                name: "number",
              },
              {
                type: "email",
                label: "Enter your email",
                name: "email",
              },
              {
                type: "textarea",
                label:
                  "Enter any additional information that will help you to prepare for the meet",
                name: "notes",
              },
              {
                type: "textarea",
                label: "Add guests email each followed by a comma",
                name: "guest",
              },
            ],
          },
        ],
      },
    },
  };
}
