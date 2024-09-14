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
import { transferUSDC } from "../create/fn";
import { createSlotObjects, validateActionData } from "./helper";

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
  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(today.getMonth() + 2);

  let slotdata = {
    json: {
      usernameList: [`${data!.username}`],
      eventTypeSlug: data?.slug,
      startTime: today.toISOString(),
      endTime: twoMonthsFromNow.toISOString(),
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
      title: `${data!.title}. (UTC Timezone)`,
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
            label: `Pay ${data!.price}$ and book slot`,
            href: `/meet?id=${encodeURIComponent(
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

    // @ts-ignore
    const slot = validateActionData(body);

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      throw "Invalid account provided";
    }

    const tx = await transferUSDC(
      account,
      parseInt(price),
      new PublicKey(address)
    );

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction: tx,
        message: `Transaction sent successfully enter the details now`,
        links: {
          // next: NextAction(id, slot, req),
          next: {
            href: `/meet/first-action?id=${id}&slot=${slot}&price=${price}`,
            type: "post",
          },
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

function NextAction(id: string, slot: string, req: Request): NextActionLink {
  return {
    type: "inline",
    action: {
      type: "action",
      title: "Enter your details",
      description:
        "Enter your name, email and other information to book the slot and receive confirmation",
      icon: `https://i.ibb.co/q97pdk9/Screenshot-2024-09-14-152912.png`,
      label: "",
      links: {
        actions: [
          {
            label: "Submit",
            href: `/meet/action?id=${id}&slot=${slot}`,
            parameters: [
              {
                type: "text",
                label: "Enter your name",
                name: "name",
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
