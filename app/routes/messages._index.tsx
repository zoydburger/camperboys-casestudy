import { Link } from "@remix-run/react";

export default function MessageIndexPage() {
  return (
    <p>
      No message selected. Select a message on the left, or{" "}
      <Link to="new" className="text-blue-500 underline">
        create a new secret message.
      </Link>
    </p>
  );
}
