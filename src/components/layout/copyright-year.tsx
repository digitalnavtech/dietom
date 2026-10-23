import { cacheLife } from "next/cache";

// With Cache Components, reading the current time during prerender must be
// explicit. "use cache" + cacheLife("days") renders the year into the static
// shell and refreshes it at most once a day.
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
