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

export const Route = createFileRoute("/api/live/$id")({
  server: {
    handlers: {
      GET: async ({ params }: any) => {
        try {
          const data = await cb(`/mcenter/v1/${params.id}/leanback`);
          const mh = data.miniscore ?? {};
          const recentBalls = (mh.recentOvsStats ?? "")
            .toString()
            .split(/\s+/)
            .filter(Boolean)
            .slice(-9);

          const live = {
            matchId: String(params.id),
            battingTeam: mh.batTeam?.teamName ?? mh.batTeamName ?? "",
            bowlingTeam: mh.bowlTeam?.teamName ?? "",
            score: {
              runs: mh.batTeam?.teamScore ?? 0,
              wickets: mh.batTeam?.teamWkts ?? 0,
              overs: String(mh.overs ?? "0"),
            },
            target: mh.target,
            required: mh.remRunsToWin
              ? `${mh.remRunsToWin} runs needed in ${mh.remBalls ?? ""} balls`
              : undefined,
            currentBatters: [mh.batsmanStriker, mh.batsmanNonStriker]
              .filter((b: any) => b && b.batName)
              .map((b: any) => ({
                name: b.batName,
                runs: b.batRuns ?? 0,
                balls: b.batBalls ?? 0,
                sr: Number(b.batStrikeRate ?? 0),
                onStrike: b === mh.batsmanStriker,
              })),
            currentBowler: mh.bowlerStriker
              ? {
                  name: mh.bowlerStriker.bowlName,
                  overs: String(mh.bowlerStriker.bowlOvs ?? "0"),
                  maidens: mh.bowlerStriker.bowlMaidens ?? 0,
                  runs: mh.bowlerStriker.bowlRuns ?? 0,
                  wickets: mh.bowlerStriker.bowlWkts ?? 0,
                }
              : { name: "—", overs: "0", maidens: 0, runs: 0, wickets: 0 },
            recentBalls,
            thisOver: recentBalls.slice(-6),
            partnership: {
              runs: mh.partnerShip?.runs ?? 0,
              balls: mh.partnerShip?.balls ?? 0,
            },
            // Over-by-over data for win probability/momentum
            overSummary: (mh.overSummaryList ?? []).slice(-10).map((o: any) => ({
              over: o.overNum,
              runs: o.runs,
              wickets: o.wickets,
            })),
          };
          return Response.json(live, { headers: { "Cache-Control": "public, max-age=3" } });
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 502 });
        }
      },
    },
  },
} as any);
