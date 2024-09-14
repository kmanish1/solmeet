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
  notes?: string;
  guest?: string;
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

    const actionData = body.data as unknown as MyActionData;
    const guest = actionData.guest ? validateEmails(actionData.guest) : [];
    const notes = actionData.notes ? actionData.notes : "";

    const endTime = addSlotLength(slot!, data?.length!);

    const postBody = {
      responses: {
        name: actionData.name,
        email: actionData.email,
        guests: guest,
        notes: notes,
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

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      throw "Invalid account provided";
    }

    const tx = await transaction(account);

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

function validateEmails(input: string): string[] {
  input = input.trim();
  if (input === "") {
    return [];
  }

  // More comprehensive email regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  // Split input by common separators
  const potentialEmails = input.split(/[\s,;]+/).filter(Boolean);

  const validEmails: string[] = [];
  const errors: string[] = [];

  potentialEmails.forEach((email, index) => {
    // Check for maximum length (RFC 5321)
    if (email.length > 254) {
      errors.push(
        `Email at position ${index + 1} exceeds maximum length: "${email}"`
      );
    }
    // Check for valid email format
    else if (!emailRegex.test(email)) {
      errors.push(`Invalid email format at position ${index + 1}: "${email}"`);
    }
    // Additional checks for common mistakes
    else if (
      email.includes("..") ||
      email.startsWith(".") ||
      email.endsWith(".")
    ) {
      errors.push(
        `Invalid email at position ${
          index + 1
        } (consecutive dots or starts/ends with dot): "${email}"`
      );
    } else {
      validEmails.push(email);
    }
  });

  if (errors.length > 0) {
    throw new Error("Make sure enter a valid email address");
  }

  return validEmails;
}
