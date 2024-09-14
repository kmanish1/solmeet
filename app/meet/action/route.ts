import { transaction } from "@/app/create/fn";
import { PrismaClient } from "@prisma/client";
import {
  ActionError,
  ActionPostResponse,
  createActionHeaders,
  createPostResponse,
  NextActionPostRequest,
} from "@solana/actions";
import { PublicKey } from "@solana/web3.js";
import axios from "axios";
const headers = createActionHeaders();

export const GET = async (req: Request) => {
  return Response.json({ message: "Method not supported" } as ActionError, {
    status: 403,
    headers,
  });
};

export const OPTIONS = async () => Response.json(null, { headers });

const prisma = new PrismaClient();

interface MyActionData {
  name: string;
  email: string;
  notes: string;
  guest: string;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id")!;
    const slot = url.searchParams.get("slot");

    const data = await prisma.solMeet.findUnique({
      where: {
        id: id,
      },
    });

    const body: NextActionPostRequest = await req.json();
    console.log(body);

    const actionData = body.data as unknown as MyActionData;
    const guest = actionData.guest.split(",");
    const endTime = addSlotLength(slot!, data?.length!);

    const postBody = {
      responses: {
        name: actionData.name,
        email: actionData.email,
        guests: guest,
        notes: actionData.notes,
      },
      user: data!.username,
      start: slot,
      end: endTime,
      eventTypeId: data?.meetingId,
      eventTypeSlug: data?.slug,
      timeZone: "Asia/Calcutta",
      language: "en",
      metadata: {},
    };

    await axios.post("https://cal.com/api/book/event", postBody);

    const tx = await transaction(
      new PublicKey("DRgXaLJjRej9mQsae8iYpswHzRwdDFchFJns2WNPTwbs")
    );

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction: tx,
        message: "session booked",
      },
    });

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let actionError: ActionError = { message: "An unknown error occurred" };
    return Response.json(actionError, {
      status: 400,
      headers,
    });
  }
}

function addSlotLength(slot: string, slotLengthMinutes: number): string {
  const slotDate = new Date(slot);

  slotDate.setMinutes(slotDate.getMinutes() + slotLengthMinutes);

  return slotDate.toISOString().slice(0, -5) + "Z";
}
