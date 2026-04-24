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

function ballSymbol(c: any): string {
  if (c.isBoundary && c.batsmanRuns === 6) return "6";
  if (c.isBoundary && c.batsmanRuns === 4) return "4";
  if (c.isWicket) return "W";
  if (c.event === "WIDE") return "Wd";
  if (c.event === "NO BALL") return "Nb";
  if (c.event === "LEG BYE") return "1b";
  if (c.batsmanRuns != null) return String(c.batsmanRuns);
  return ".";
}

export const Route = createFileRoute("/api/commentary/$id")({
  server: {
    handlers: {
      GET: async ({ params }: any) => {
        try {
          const data = await cb(`/mcenter/v1/${params.id}/comm`);
          const list: any[] = data.commentaryList ?? [];
          const commentary = list.slice(0, 30).map((c) => ({
            over: String(c.overNumber ?? ""),
            ball: ballSymbol(c),
            text: c.commText ?? "",
            scoreAfter: c.batTeamScore != null ? `${c.batTeamScore}/${c.batTeamWickets ?? 0}` : "",
          }));
          return Response.json({ commentary }, { headers: { "Cache-Control": "public, max-age=3" } });
        } catch (e: any) {
          return Response.json({ commentary: [], error: e.message }, { status: 200 });
        }
      },
    },
  },
} as any);
