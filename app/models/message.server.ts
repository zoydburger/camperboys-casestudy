import type { Message, User } from "@prisma/client";
import { prisma } from "~/db.server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import invariant from "tiny-invariant";

invariant(
  process.env.MESSAGE_ENCRYPTION_SECRET,
  "MESSAGE_ENCRYPTION_SECRET must be set"
);

export const MESSAGE_PASSWORD_KEY = "mpwd";

export function getMessage({ id }: Pick<Message, "id">) {
  return prisma.message.findUnique({
    select: { id: true, message: true, subject: true, password: true },
    where: { id },
  });
}

export async function getDecryptedMessage({
  id,
  password,
}: Pick<Message, "id"> & {
  password: string;
}) {
  const messageWithPassword = await prisma.message.findUnique({
    where: { id },
    include: { password: true },
  });
  if (!messageWithPassword || !messageWithPassword.password) return null;
  const isValid = await bcrypt.compare(
    password,
    messageWithPassword.password.hash
  );
  if (!isValid) return null;
  const decryptedMessage = decrypt(messageWithPassword.message);
  const { password: _password, ...messageWithoutPassword } =
    messageWithPassword;
  return { ...messageWithoutPassword, message: decryptedMessage };
}

export async function createMessage({
  subject,
  message: messageContent,
  userId,
}: Pick<Message, "subject" | "message"> & {
  userId: User["id"];
}) {
  const { message, password } = encrypt(messageContent);
  const hashedPassword = await bcrypt.hash(password, 10);
  const newMessage = await prisma.message.create({
    data: {
      subject,
      message,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
  return { ...newMessage, password };
}

export function getMessages({ userId }: { userId: User["id"] }) {
  return prisma.message.findMany({
    where: { userId },
    select: { id: true, subject: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function deleteMessage({
  id,
  userId,
}: Pick<Message, "id"> & { userId: User["id"] }) {
  return prisma.message.deleteMany({
    where: { id, userId },
  });
}

const algorithm = "aes-256-ctr";
const secret = process.env.MESSAGE_ENCRYPTION_SECRET;
const salt = "this is my very secret salt";
const ENCRYPTION_KEY = crypto.scryptSync(secret, salt, 32);
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    message: `${iv.toString("hex")}:${encrypted.toString("hex")}`,
    password: crypto.randomBytes(16).toString("base64"),
  };
}

function decrypt(text: string) {
  const [ivPart, encryptedPart] = text.split(":");
  if (!ivPart || !encryptedPart) {
    throw new Error("Invalid text.");
  }
  const iv = Buffer.from(ivPart, "hex");
  const encryptedText = Buffer.from(encryptedPart, "hex");
  const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);
  return decrypted.toString();
}
