import { createFileRoute } from "@tanstack/react-router";

const HOST = "cricbuzz-cricket.p.rapidapi.com";
async function cb(path: string) {
  const key = process.env.RAPIDAPI_CRICBUZZ_KEY;
  if (!key) throw new Error("RAPIDAPI_CRICBUZZ_KEY not configured");
  const res = await fetch(`https://${HOST}${path}`, {
    headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": key },
  });
  if (!res.ok) throw new Error(`Cricbuzz ${path} -> ${res.status}`);
  return res.json();
}

export const Route = createFileRoute("/api/match/$id")({
  server: {
    handlers: {
      GET: async ({ params }: any) => {
        try {
          // Fetch info + scorecard in parallel
          const [info, scard] = await Promise.all([
            cb(`/mcenter/v1/${params.id}`),
            cb(`/mcenter/v1/${params.id}/hscard`).catch(() => null),
          ]);

          const mi = info.matchInfo ?? {};
          const result = {
            id: String(params.id),
            number: mi.matchDescription ?? "",
            status: mi.state?.toLowerCase().includes("complete") ? "completed"
              : mi.state?.toLowerCase().includes("preview") ? "upcoming" : "live",
            team1: { id: String(mi.team1?.id ?? ""), short: mi.team1?.shortName ?? "", name: mi.team1?.name ?? "" },
            team2: { id: String(mi.team2?.id ?? ""), short: mi.team2?.shortName ?? "", name: mi.team2?.name ?? "" },
            date: mi.startDate ? new Date(Number(mi.startDate)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "",
            time: mi.startDate ? new Date(Number(mi.startDate)).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
            venue: mi.venue ? `${mi.venue.name}, ${mi.venue.city}` : "",
            toss: mi.tossResults ? `${mi.tossResults.tossWinnerName} won the toss & elected to ${mi.tossResults.decision}` : undefined,
            result: mi.status ?? "",
            scorecard: scard?.scoreCard ?? null,
          };
          return Response.json(result, { headers: { "Cache-Control": "public, max-age=5" } });
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 502 });
        }
      },
    },
  },
} as any);
