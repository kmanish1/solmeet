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
import { getEventTypes, mockTx } from "./fn";

const headers = createActionHeaders();

export function GET() {
  try {
    const payload: ActionGetResponse = {
      title: "Create a blink for your cal.com event",
      description:
        "With this Blink, you can instantly generate a personalized blink url for your Cal.com event with customized pricing. Simply enter your Cal.com username, and within moments, a unique Blink url will be generated.",
      label: "Connect",
      icon: "https://cal.com/_next/image?url=https%3A%2F%2Fwww.datocms-assets.com%2F77432%2F1662742861-calendso-rebrands-to-cal-com.png&w=1200&q=75",
      type: "action",
      links: {
        actions: [
          {
            label: "Connect your wallet to receive payments",
            href: "/api/actions/solmeet/create",
            parameters: [
              {
                type: "text",
                label: "Enter your cal.com username",
                name: "username",
                required: true,
              },
            ],
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

export async function OPTIONS() {
  return new Response(null, { headers });
}

export async function POST(req: Request) {
  try {
    const body: ActionPostRequest = await req.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      throw "Invalid account provided";
    }

    const tx = await mockTx(account);

    // @ts-ignore
    const username = body.data.username;
    const arr = await getEventTypes(username);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction: tx,
        message: `Received the wallet address and in the next step set the price`,
        links: {
          next: NextAction(arr, username),
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

function NextAction(arr: any, username: string): NextActionLink {
  return {
    type: "inline",
    action: {
      type: "action",
      title: "Generate Blink",
      description:
        "Select the event type in the drop down below and set the pricing in USDC",
      icon: "https://cal.com/_next/image?url=https%3A%2F%2Fwww.datocms-assets.com%2F77432%2F1662742532-verified.png&w=1920&q=75",
      label: "",
      links: {
        actions: [
          {
            label: "Submit",
            href: `/api/actions/solmeet/create/action?username=${username}`,
            parameters: [
              {
                type: "select",
                options: arr,
                label: "Select an option",
                name: "meetid",
                required: true,
              },
              {
                type: "number",
                label: "Enter price for one slot (USDC)",
                name: "price",
              },
            ],
          },
        ],
      },
    },
  };
}
