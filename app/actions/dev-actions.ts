"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Ustawia port lokalnego centrum logowania w ciasteczku (tylko w trybie dev)
 */
export async function setDevSSOPort(formData: FormData) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const port = formData.get("port")?.toString();
  const cookieStore = await cookies();

  if (!port || port === "") {
    cookieStore.delete("dev-sso-port");
  } else {
    const portNum = parseInt(port, 10);
    if (!isNaN(portNum) && portNum > 0 && portNum < 65536) {
      cookieStore.set("dev-sso-port", portNum.toString(), {
        httpOnly: false, // Musi być dostępne dla JS klienta!
        secure: false,
        sameSite: "lax",
        path: "/",
      });
    }
  }

  redirect("/login");
}
