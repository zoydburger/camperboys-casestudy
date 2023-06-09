import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { ConfirmationModal } from "~/components/confirmation-modal";
import { createMessage, MESSAGE_PASSWORD_KEY } from "~/models/message.server";
import { getSession, requireUserId, sessionStorage } from "~/session.server";

export const action = async ({ params, request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const searchParams = new URL(request.url);
  const subject = formData.get("subject");
  const message = formData.get("message");
  const confirm = formData.get("confirm");
  const session = await getSession(request);

  if (typeof subject !== "string" || subject.length === 0) {
    return json(
      {
        subject,
        message,
        confirm: false,
        errors: { message: null, subject: "Subject is required" },
      },
      { status: 400 }
    );
  }

  if (typeof message !== "string" || message.length === 0) {
    return json(
      {
        subject,
        message,
        confirm: false,
        errors: { message: "Message is required", subject: null },
      },
      { status: 400 }
    );
  }

  if (confirm) {
    const newMessage = await createMessage({
      message: message,
      subject: subject,
      userId,
    });
    session.flash(MESSAGE_PASSWORD_KEY, newMessage.password);
    return redirect(`/messages/${newMessage.id}`, {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  }

  return json(
    { subject, message, confirm: true, errors: null },
    { status: 200 }
  );
};

export default function NewMessagePage() {
  const actionData = useActionData<typeof action>();
  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (actionData?.errors?.subject) {
      subjectRef.current?.focus();
    } else if (actionData?.errors?.message) {
      messageRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Subject: </span>
          <input
            ref={subjectRef}
            defaultValue={actionData?.subject ?? ""}
            name="subject"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            aria-invalid={actionData?.errors?.subject ? true : undefined}
            aria-errormessage={
              actionData?.errors?.subject ? "subject-error" : undefined
            }
          />
        </label>
        {actionData?.errors?.subject ? (
          <div className="pt-1 text-red-700" id="subject-error">
            {actionData.errors.subject}
          </div>
        ) : null}
      </div>

      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Your secret message: </span>
          <textarea
            ref={messageRef}
            defaultValue={actionData?.message ?? ""}
            name="message"
            rows={8}
            className="w-full flex-1 rounded-md border-2 border-blue-500 px-3 py-2 text-lg leading-6"
            aria-invalid={actionData?.errors?.message ? true : undefined}
            aria-errormessage={
              actionData?.errors?.message ? "message-error" : undefined
            }
          />
        </label>
        {actionData?.errors?.message ? (
          <div className="pt-1 text-red-700" id="message-error">
            {actionData.errors.message}
          </div>
        ) : null}
        <input
          className="hidden"
          type="checkbox"
          name="confirm"
          defaultChecked={!!actionData?.confirm}
        />
      </div>
      <ConfirmationModal show={!!actionData?.confirm} />
      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Save
        </button>
      </div>
    </Form>
  );
}
