import {
  ActionError,
  createActionHeaders,
  NextAction,
  NextActionPostRequest,
} from "@solana/actions";
import { clusterApiUrl, Connection } from "@solana/web3.js";

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  return Response.json({ message: "Method not supported" } as ActionError, {
    status: 403,
    headers,
  });
};

export const OPTIONS = async () => Response.json(null, { headers });

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id")!;
    const slot = url.searchParams.get("slot")!;
    const price = url.searchParams.get("price")!;

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

      // const paid =
      //   transaction?.meta?.postTokenBalances?.[0].uiTokenAmount -
      //   transaction?.meta?.preTokenBalances?.[0].uiTokenAmount;
      // if (paid < data?.price!) {
      //   throw new Error("invalid amount paid");
      // }
    } catch (err) {
      console.log(err);
    }

    const payload: NextAction = {
      type: "action",
      title: "Enter the meet details",
      description:
        "Enter your name , email and other information to book the slot and receive the meet the link",
      icon: "https://cal.com/_next/image?url=https%3A%2F%2Fwww.datocms-assets.com%2F77432%2F1662742861-calendso-rebrands-to-cal-com.png&w=1200&q=75",
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
                required: true,
              },
              {
                type: "email",
                label: "Enter your email",
                name: "email",
                required: true,
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
    };
    return Response.json(payload, { headers });
  } catch (err) {
    return Response.json({ message: err } as ActionError, {
      status: 400,
      headers,
    });
  }
}
