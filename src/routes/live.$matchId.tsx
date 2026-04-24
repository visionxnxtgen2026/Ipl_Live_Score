import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getLiveMatch, getCommentary, getMatchById } from "@/services/api";
import { TeamLogo } from "@/components/TeamLogo";
import { Skeleton } from "@/components/Skeleton";
import { ArrowLeft, MapPin } from "lucide-react";

export const Route = createFileRoute("/live/$matchId")({
  head: ({ params }) => ({
    meta: [
      { title: `Live Score — Match ${params.matchId} — IPL 2025` },
      { name: "description", content: "Real-time IPL live score with ball-by-ball commentary." },
    ],
  }),
  errorComponent: ({ error }) => {
    const router = useRouter();
    return (
      <div className="p-12 text-center">
        <p className="text-destructive">{error.message}</p>
        <button onClick={() => router.invalidate()} className="mt-4 rounded-md gradient-primary px-4 py-2 text-sm">Retry</button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-12 text-center">Match not found. <Link to="/matches" className="text-primary">All matches</Link></div>,
  component: LivePage,
});

const TEAM_COLORS: Record<string, string> = { csk: "0.75 0.18 75", mi: "0.55 0.22 250", rcb: "0.55 0.24 25", kkr: "0.45 0.18 305", srh: "0.7 0.22 45", dc: "0.55 0.22 250", pbks: "0.6 0.24 20", rr: "0.65 0.24 340", gt: "0.4 0.12 240", lsg: "0.55 0.2 200" };

function ballColor(b: string) {
  if (b === "4") return "bg-blue-500";
  if (b === "6") return "bg-destructive";
  if (b === "Wd" || b === "Nb" || b === "1b") return "bg-amber-500";
  if (b === ".") return "bg-muted text-muted-foreground";
  if (b === "W") return "bg-red-700";
  return "bg-emerald-600";
}

// Compute win probability + momentum from recent over data.
// Heuristic: chasing-team prob = clamp(50 + (currentRR - requiredRR)*8 - wicketsLost*4 + momentumBonus)
function computeMatchPulse(live: any) {
  const overs = parseFloat(live.score.overs) || 0;
  const runs = live.score.runs || 0;
  const wkts = live.score.wickets || 0;
  const currentRR = overs > 0 ? runs / overs : 0;
  const recentOvs: { over: number; runs: number; wickets: number }[] = live.overSummary?.slice(-5) ?? [];
  const recentRuns = recentOvs.reduce((a, o) => a + o.runs, 0);
  const recentWkts = recentOvs.reduce((a, o) => a + o.wickets, 0);
  const recentRR = recentOvs.length ? recentRuns / recentOvs.length : currentRR;

  let battingProb = 50;
  let label = "Even contest";
  if (live.target) {
    const ballsLeft = Math.max(1, (20 - overs) * 6);
    const runsNeeded = Math.max(0, live.target - runs);
    const requiredRR = (runsNeeded / ballsLeft) * 6;
    battingProb = 50 + (recentRR - requiredRR) * 7 - wkts * 3 - recentWkts * 4;
    if (runsNeeded <= 0) battingProb = 99;
    label = battingProb > 65 ? `${live.battingTeam} favourites` : battingProb < 35 ? `${live.bowlingTeam} ahead` : "On a knife's edge";
  } else {
    // 1st innings — momentum proxy
    battingProb = 50 + (recentRR - currentRR) * 6 - recentWkts * 5;
    label = recentRR > currentRR + 1 ? "Batting team building" : recentWkts >= 2 ? "Bowlers fighting back" : "Steady phase";
  }
  battingProb = Math.max(2, Math.min(98, battingProb));

  // Momentum: net runs swing in last 5 overs vs match average
  const avgPerOver = overs > 0 ? runs / overs : 0;
  const momentumDelta = recentRR - avgPerOver - recentWkts * 1.5;
  const momentumPct = Math.max(-100, Math.min(100, momentumDelta * 25));

  return { battingProb, bowlingProb: 100 - battingProb, label, momentumPct, recentOvs };
}

function LivePage() {
  const { matchId } = Route.useParams();
  const { data: match } = useQuery({ queryKey: ["match", matchId], queryFn: () => getMatchById(matchId) });
  // Polling every 5 seconds — real-time updates
  const { data: live } = useQuery({
    queryKey: ["live", matchId],
    queryFn: () => getLiveMatch(matchId),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
  const { data: commentary } = useQuery({
    queryKey: ["commentary", matchId],
    queryFn: () => getCommentary(matchId),
    refetchInterval: 5000,
  });

  if (!match || !live) {
    return <div className="mx-auto max-w-7xl p-8 space-y-4"><Skeleton className="h-48" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-6">
      <Link to="/matches" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> All Matches
      </Link>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* Score header */}
          <div className="rounded-2xl border border-border/60 gradient-card p-5 sm:p-7 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded bg-live px-2 py-0.5 text-[10px] font-bold uppercase text-live-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-white live-pulse" /> LIVE
              </span>
              <span className="text-sm text-muted-foreground">Match {match.number}, TATA IPL 2025</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <TeamLogo shortName={match.team1.short} color={TEAM_COLORS[match.team1.id]} size="xl" />
                <div className="font-display text-3xl sm:text-4xl font-bold">{live.score.runs}/{live.score.wickets}</div>
                <div className="text-xs text-muted-foreground">{live.score.overs} Overs</div>
              </div>
              <div className="text-xs font-bold text-muted-foreground">VS</div>
              <div className="flex flex-col items-center gap-3 text-center">
                <TeamLogo shortName={match.team2.short} color={TEAM_COLORS[match.team2.id]} size="xl" />
                <div className="font-display text-3xl sm:text-4xl font-bold">{match.score2?.runs}/{match.score2?.wickets}</div>
                <div className="text-xs text-muted-foreground">{match.score2?.overs} Overs</div>
              </div>
            </div>
            {live.required && <div className="mt-5 text-center font-semibold text-destructive">{live.required}</div>}
            <div className="mt-4 pt-4 border-t border-border/60 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.venue}</div>
              {match.toss && <div>Toss: {match.toss}</div>}
            </div>
          </div>

          {/* Batters & Bowler */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/60 gradient-card p-5">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Batters</h3>
              <div className="space-y-3">
                {live.currentBatters.map((b) => (
                  <div key={b.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{b.name}</span>
                      {b.onStrike && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                    <div className="text-sm">
                      <span className="font-bold">{b.runs}</span>
                      <span className="text-muted-foreground"> ({b.balls})</span>
                      <span className="text-xs text-muted-foreground ml-2">SR {b.sr}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 gradient-card p-5">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Bowler</h3>
              <div className="flex justify-between items-center">
                <span className="font-semibold">{live.currentBowler.name}</span>
                <div className="text-sm">
                  <span className="font-bold">{live.currentBowler.wickets}-{live.currentBowler.runs}</span>
                  <span className="text-xs text-muted-foreground ml-2">({live.currentBowler.overs} ov)</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-2">This Over</div>
                <div className="flex gap-1.5 flex-wrap">
                  {live.thisOver.map((b, i) => (
                    <span key={i} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${ballColor(b)}`}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Commentary */}
          <div className="rounded-2xl border border-border/60 gradient-card p-5">
            <h3 className="font-semibold mb-4">Ball-by-Ball Commentary</h3>
            <div className="space-y-3">
              {commentary?.map((c, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-border/40 last:border-0">
                  <div className="shrink-0">
                    <span className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${ballColor(c.ball)}`}>{c.ball}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-0.5">Over {c.over} • {c.scoreAfter}</div>
                    <div className="text-sm">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Win probability + momentum */}
          {(() => {
            const pulse = computeMatchPulse(live);
            return (
              <div className="rounded-2xl border border-border/60 gradient-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Win Probability</h4>
                  <span className="text-[10px] text-muted-foreground">live model</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span>{live.battingTeam || "Bat"}</span>
                  <span>{live.bowlingTeam || "Bowl"}</span>
                </div>
                <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700" style={{ width: `${pulse.battingProb}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
                  <span>{pulse.battingProb.toFixed(0)}%</span>
                  <span>{pulse.bowlingProb.toFixed(0)}%</span>
                </div>
                <div className="mt-3 text-center text-xs font-semibold text-primary">{pulse.label}</div>

                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">Momentum</span>
                    <span className={`text-[10px] font-bold ${pulse.momentumPct > 10 ? "text-emerald-500" : pulse.momentumPct < -10 ? "text-destructive" : "text-muted-foreground"}`}>
                      {pulse.momentumPct > 10 ? "▲ Batting" : pulse.momentumPct < -10 ? "▼ Bowling" : "— Neutral"}
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
                    <div
                      className={`absolute inset-y-0 ${pulse.momentumPct >= 0 ? "left-1/2 bg-emerald-500" : "right-1/2 bg-destructive"} transition-all duration-700`}
                      style={{ width: `${Math.abs(pulse.momentumPct) / 2}%` }}
                    />
                  </div>
                  {pulse.recentOvs.length > 0 && (
                    <div className="mt-3 flex gap-1 items-end h-10">
                      {pulse.recentOvs.map((o, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-primary/60 rounded-sm transition-all" style={{ height: `${Math.min(100, (o.runs / 20) * 100)}%` }} title={`Over ${o.over}: ${o.runs} runs, ${o.wickets}w`} />
                          {o.wickets > 0 && <span className="text-[8px] text-destructive font-bold">{o.wickets}W</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 text-center text-[10px] text-muted-foreground">Last {pulse.recentOvs.length || 5} overs</div>
                </div>
              </div>
            );
          })()}

          <div className="rounded-2xl border border-border/60 gradient-card p-5">
            <h4 className="font-semibold mb-3 flex items-center justify-between">Recent Balls <span className="text-[10px] text-muted-foreground font-normal">auto-updating</span></h4>
            <div className="flex gap-1.5 flex-wrap">
              {live.recentBalls.map((b, i) => (
                <span key={i} className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${ballColor(b)}`}>{b}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 gradient-card p-5">
            <h4 className="font-semibold mb-3">Partnership</h4>
            <div className="font-display text-3xl font-bold">{live.partnership.runs}<span className="text-base text-muted-foreground"> ({live.partnership.balls})</span></div>
            <div className="text-xs text-muted-foreground mt-1">Runs scored together</div>
          </div>
          <div className="rounded-2xl border border-border/60 gradient-card p-5">
            <h4 className="font-semibold mb-3">Match Info</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Date</dt><dd>{match.date}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Time</dt><dd>{match.time}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground shrink-0">Venue</dt><dd className="text-right text-xs">{match.venue}</dd></div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
