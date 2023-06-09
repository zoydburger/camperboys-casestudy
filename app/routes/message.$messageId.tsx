import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { useRef } from "react";
import invariant from "tiny-invariant";
import { getDecryptedMessage, getMessage } from "~/models/message.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  invariant(params.messageId, "messageId not found");

  const message = await getMessage({ id: params.messageId });
  if (!message) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ message });
};

export const action = async ({ params, request }: ActionArgs) => {
  invariant(params.messageId, "messageId not found");
  const formData = await request.formData();
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return json(
      {
        message: null,
        errors: { password: "Password is required" },
      },
      { status: 400 }
    );
  }

  const decryptedMessage = await getDecryptedMessage({
    id: params.messageId,
    password: password as string,
  });

  if (!decryptedMessage) {
    return json(
      { message: null, errors: { password: "Wrong password" } },
      { status: 401 }
    );
  }

  return json({ message: decryptedMessage?.message, errors: null });
};

export default function MessagePage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const passwordRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-6">
      <h3 className="mb-8 text-2xl font-bold">
        Subject: {data.message.subject}
      </h3>
      <p>{actionData?.message}</p>
      <hr className="my-4" />
      {!actionData?.message ? (
        <Form method="post">
          <p className="py-6">
            This message was encrypted with a password. Please enter the
            password to view the message.
          </p>
          <div className="flex gap-x-2">
            <input
              id="password"
              ref={passwordRef}
              name="password"
              autoComplete="none"
              type="password"
              className="rounded border border-gray-500 px-2 py-1 text-lg"
              placeholder="Enter password"
            />
            <button
              type="submit"
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
            >
              Show Message
            </button>{" "}
            {actionData?.errors?.password ? (
              <div className="pt-1 text-red-700" id="title-error">
                {actionData.errors.password}
              </div>
            ) : null}
          </div>
        </Form>
      ) : (
        <p>✅ Your message was successfully decrypted!</p>
      )}
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
