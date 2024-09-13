import { PrismaClient } from "@prisma/client/extension";
import {
  ActionError,
  ActionPostRequest,
  ActionPostResponse,
  CompletedAction,
  createActionHeaders,
  createPostResponse,
  NextActionPostRequest,
} from "@solana/actions";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
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
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id")!;

    const data = await prisma.solMeet.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    const body: NextActionPostRequest = await req.json();

    let signature: string;
    try {
      signature = body.signature;
      if (!signature) throw "Invalid signature";
    } catch (err) {
      throw 'Invalid "signature" provided';
    }

    const connection = new Connection(clusterApiUrl("devnet"));

    try {
      let status = await connection.getSignatureStatus(signature);

      console.log("signature status:", status);

      if (!status) throw "Unknown signature status";

      if (status.value?.confirmationStatus) {
        if (status.value.confirmationStatus != "confirmed") {
          throw "Unable to confirm the transaction";
        }
      }
    } catch (err) {
      if (typeof err == "string") throw err;
      throw "Unable to confirm the provided signature";
    }

    try {
      const transaction = await connection.getParsedTransaction(
        signature,
        "confirmed"
      );
      if (transaction!.meta?.err) {
        throw "Transaction failed";
      }

      const paid =
        // @ts-ignore
        transaction?.meta?.postTokenBalances?.[0].uiTokenAmount -
        // @ts-ignore
        transaction?.meta?.preTokenBalances?.[0].uiTokenAmount;

      if (paid != parseInt(data.price)) throw "Invalid amount paid";
    } catch (err) {
      console.log(err);
    }

    console.log(body);
    const payload: CompletedAction = {
        type: "completed",
        title: "Chaining was successful!",
        icon: "https://solmeet.click/favicon.ico",
        label: "Complete!",
        description:
          `You have now completed an action chain! ` +
          `Here was the signature from the last action's transaction: ${signature} `,
      };
  
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
