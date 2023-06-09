import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  Link,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { useRef } from "react";
import invariant from "tiny-invariant";
import { MessagePasswordModal } from "~/components/password-modal";
import {
  deleteMessage,
  getMessage,
  MESSAGE_PASSWORD_KEY,
} from "~/models/message.server";
import { getSession, requireUserId, sessionStorage } from "~/session.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  invariant(params.messageId, "messageId not found");
  const session = await getSession(request);
  const newMessagePassword: string = session.get(MESSAGE_PASSWORD_KEY);
  const message = await getMessage({ id: params.messageId });
  if (!message) {
    throw new Response("Not Found", { status: 404 });
  }
  const messageLink = new URL(request.url).origin + `/message/${message.id}`;
  return json(
    { message, password: newMessagePassword, messageLink },
    { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } }
  );
};

export const action = async ({ params, request }: ActionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.messageId, "messageId not found");
  await deleteMessage({ id: params.messageId, userId });
  return redirect("/messages");
};

export default function MessageDetailsPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <h3 className="text-2xl font-bold">{data.message.subject}</h3>
      <p className="py-6">
        This message was encrypted with a randomly generated password. The
        recipient of this message will need to enter the password to decrypt the
        message. Hopefully you noted the password after creating your message
        👀. The message can be found at the following link:
      </p>
      <Link to={data.messageLink} className="text-xl hover:cursor-pointer">
        {data.messageLink}
      </Link>
      <hr className="my-4" />
      <MessagePasswordModal
        id={data.message.id}
        subject={data.message.subject}
        password={data.password}
      ></MessagePasswordModal>
      <Form method="post">
        <div className="flex gap-x-2">
          <button
            type="submit"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Delete
          </button>
        </div>
      </Form>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof Error) {
    return <div>An unexpected error occurred: {error.message}</div>;
  }

  if (!isRouteErrorResponse(error)) {
    return <h1>Unknown Error</h1>;
  }

  if (error.status === 404) {
    return <div>Message not found</div>;
  }

  return <div>An unexpected error occurred: {error.statusText}</div>;
}
