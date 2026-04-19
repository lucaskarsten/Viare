import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const locale = (await cookies()).get("NEXT_LOCALE")?.value ?? "pt";
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
