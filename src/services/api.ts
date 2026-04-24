// API service layer.
// Live data (matches/live/commentary/news) -> backend proxy -> RapidAPI Cricbuzz + GNews.
// Static data (teams/players details) stays mocked since Cricbuzz IDs differ from our slugs.
import axios from "axios";

const USE_LIVE_API = true; // backend proxy on /api/* (server-side key)
export const api = axios.create({ baseURL: "/api" });

// ---------- Types ----------
export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  founded: number;
  titles: number;
  titleYears: string;
  captain: string;
  coach: string;
  homeGround: string;
  owner: string;
  stats: { matches: number; won: number; lost: number; nr: number; winPct: number };
  recentForm: ("W" | "L")[];
  squad: Player[];
}

export interface Player {
  id: string;
  name: string;
  shortName: string;
  role: "Batter" | "Bowler" | "All Rounder" | "Wicket Keeper";
  teamId: string;
  age: number;
  batting: string;
  bowling?: string;
  country: string;
  isCaptain?: boolean;
  isWk?: boolean;
  stats: { matches: number; runs: number; wickets: number; sr?: number; econ?: number };
}

export interface Match {
  id: string;
  number: number;
  status: "live" | "upcoming" | "completed";
  team1: { id: string; short: string; name: string };
  team2: { id: string; short: string; name: string };
  date: string;
  time: string;
  venue: string;
  result?: string;
  score1?: { runs: number; wickets: number; overs: string };
  score2?: { runs: number; wickets: number; overs: string };
  toss?: string;
}

export interface LiveData {
  matchId: string;
  battingTeam: string;
  bowlingTeam: string;
  score: { runs: number; wickets: number; overs: string };
  target?: number;
  required?: string;
  currentBatters: { name: string; runs: number; balls: number; sr: number; onStrike: boolean }[];
  currentBowler: { name: string; overs: string; maidens: number; runs: number; wickets: number };
  recentBalls: string[];
  thisOver: string[];
  partnership: { runs: number; balls: number };
}

export interface Commentary {
  over: string;
  ball: string;
  text: string;
  scoreAfter: string;
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  source: string;
  time: string;
  image: string;
  excerpt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  youtubeId: string;
  views: string;
}

// ---------- Mock data ----------
const TEAM_COLORS: Record<string, string> = {
  csk: "0.75 0.18 75",
  mi: "0.55 0.22 250",
  rcb: "0.55 0.24 25",
  kkr: "0.45 0.18 305",
  srh: "0.7 0.22 45",
  dc: "0.55 0.22 250",
  pbks: "0.6 0.24 20",
  rr: "0.65 0.24 340",
  gt: "0.4 0.12 240",
  lsg: "0.55 0.2 200",
};

const TEAMS_RAW: Omit<Team, "squad">[] = [
  { id: "csk", name: "Chennai Super Kings", shortName: "CSK", primaryColor: TEAM_COLORS.csk, founded: 2008, titles: 5, titleYears: "2010, 2011, 2018, 2021, 2023", captain: "R. Jadeja", coach: "S. Fleming", homeGround: "M. A. Chidambaram Stadium", owner: "Chennai Super Kings Cricket Ltd.", stats: { matches: 212, won: 127, lost: 81, nr: 4, winPct: 59.91 }, recentForm: ["W","L","W","W","L"] },
  { id: "mi", name: "Mumbai Indians", shortName: "MI", primaryColor: TEAM_COLORS.mi, founded: 2008, titles: 5, titleYears: "2013, 2015, 2017, 2019, 2020", captain: "H. Pandya", coach: "M. Jayawardene", homeGround: "Wankhede Stadium", owner: "Reliance Industries", stats: { matches: 247, won: 138, lost: 105, nr: 4, winPct: 56.6 }, recentForm: ["W","W","L","W","L"] },
  { id: "rcb", name: "Royal Challengers Bengaluru", shortName: "RCB", primaryColor: TEAM_COLORS.rcb, founded: 2008, titles: 0, titleYears: "—", captain: "F. du Plessis", coach: "A. Flower", homeGround: "M. Chinnaswamy Stadium", owner: "United Spirits", stats: { matches: 240, won: 116, lost: 119, nr: 5, winPct: 49.36 }, recentForm: ["W","L","W","W","L"] },
  { id: "kkr", name: "Kolkata Knight Riders", shortName: "KKR", primaryColor: TEAM_COLORS.kkr, founded: 2008, titles: 3, titleYears: "2012, 2014, 2024", captain: "A. Iyer", coach: "C. Mott", homeGround: "Eden Gardens", owner: "Red Chillies Entertainment", stats: { matches: 237, won: 121, lost: 113, nr: 3, winPct: 51.69 }, recentForm: ["L","W","W","L","W"] },
  { id: "srh", name: "Sunrisers Hyderabad", shortName: "SRH", primaryColor: TEAM_COLORS.srh, founded: 2013, titles: 1, titleYears: "2016", captain: "P. Cummins", coach: "D. Vettori", homeGround: "Rajiv Gandhi Stadium", owner: "Sun TV Network", stats: { matches: 184, won: 89, lost: 92, nr: 3, winPct: 49.18 }, recentForm: ["L","W","L","L","W"] },
  { id: "dc", name: "Delhi Capitals", shortName: "DC", primaryColor: TEAM_COLORS.dc, founded: 2008, titles: 0, titleYears: "—", captain: "R. Pant", coach: "R. Ponting", homeGround: "Arun Jaitley Stadium", owner: "GMR + JSW", stats: { matches: 240, won: 109, lost: 128, nr: 3, winPct: 46.05 }, recentForm: ["L","W","W","L","W"] },
  { id: "pbks", name: "Punjab Kings", shortName: "PBKS", primaryColor: TEAM_COLORS.pbks, founded: 2008, titles: 0, titleYears: "—", captain: "S. Dhawan", coach: "T. Ponting", homeGround: "PCA Stadium", owner: "Mohit Burman & others", stats: { matches: 240, won: 105, lost: 132, nr: 3, winPct: 44.30 }, recentForm: ["L","W","W","L","W"] },
  { id: "rr", name: "Rajasthan Royals", shortName: "RR", primaryColor: TEAM_COLORS.rr, founded: 2008, titles: 1, titleYears: "2008", captain: "S. Samson", coach: "K. Rahul Dravid", homeGround: "Sawai Mansingh Stadium", owner: "Emerging Media", stats: { matches: 220, won: 109, lost: 108, nr: 3, winPct: 50.23 }, recentForm: ["L","L","W","L","L"] },
  { id: "gt", name: "Gujarat Titans", shortName: "GT", primaryColor: TEAM_COLORS.gt, founded: 2021, titles: 1, titleYears: "2022", captain: "S. Gill", coach: "A. Nehra", homeGround: "Narendra Modi Stadium", owner: "CVC Capital Partners", stats: { matches: 50, won: 32, lost: 17, nr: 1, winPct: 65.30 }, recentForm: ["W","W","L","W","W"] },
  { id: "lsg", name: "Lucknow Super Giants", shortName: "LSG", primaryColor: TEAM_COLORS.lsg, founded: 2021, titles: 0, titleYears: "—", captain: "K. Rahul", coach: "J. Langer", homeGround: "Ekana Cricket Stadium", owner: "RPSG Group", stats: { matches: 50, won: 26, lost: 23, nr: 1, winPct: 53.06 }, recentForm: ["W","L","L","W","L"] },
];

const PLAYERS: Player[] = [
  // CSK
  { id: "jadeja", name: "Ravindra Jadeja", shortName: "R. Jadeja", role: "All Rounder", teamId: "csk", age: 36, batting: "Left Handed", bowling: "Left Arm Spin", country: "IND", isCaptain: true, stats: { matches: 11, runs: 214, wickets: 12, sr: 135.44, econ: 7.62 } },
  { id: "gaikwad", name: "Ruturaj Gaikwad", shortName: "R. Gaikwad", role: "Wicket Keeper", teamId: "csk", age: 27, batting: "Right Handed", country: "IND", isWk: true, stats: { matches: 11, runs: 468, wickets: 0, sr: 148.10 } },
  { id: "dhoni", name: "MS Dhoni", shortName: "MS Dhoni", role: "Wicket Keeper", teamId: "csk", age: 43, batting: "Right Handed", country: "IND", stats: { matches: 11, runs: 161, wickets: 0, sr: 187.20 } },
  { id: "dube", name: "Shivam Dube", shortName: "S. Dube", role: "Batter", teamId: "csk", age: 31, batting: "Left Handed", country: "IND", stats: { matches: 11, runs: 350, wickets: 2, sr: 162.0 } },
  { id: "pathirana", name: "Matheesha Pathirana", shortName: "M. Pathirana", role: "Bowler", teamId: "csk", age: 22, batting: "Right Handed", bowling: "Right Arm Fast", country: "SL", stats: { matches: 11, runs: 24, wickets: 18, econ: 8.28 } },
  { id: "ravindra", name: "Rachin Ravindra", shortName: "R. Ravindra", role: "Batter", teamId: "csk", age: 25, batting: "Left Handed", country: "NZ", stats: { matches: 8, runs: 222, wickets: 1, sr: 130.5 } },
  // MI
  { id: "hpandya", name: "Hardik Pandya", shortName: "H. Pandya", role: "All Rounder", teamId: "mi", age: 31, batting: "Right Handed", bowling: "Right Arm Fast", country: "IND", isCaptain: true, stats: { matches: 11, runs: 220, wickets: 8, sr: 140.0, econ: 9.1 } },
  { id: "rohit", name: "Rohit Sharma", shortName: "R. Sharma", role: "Batter", teamId: "mi", age: 37, batting: "Right Handed", country: "IND", stats: { matches: 11, runs: 380, wickets: 0, sr: 145.0 } },
  { id: "ssa", name: "Suryakumar Yadav", shortName: "S. Yadav", role: "Batter", teamId: "mi", age: 34, batting: "Right Handed", country: "IND", stats: { matches: 11, runs: 410, wickets: 0, sr: 168.0 } },
  { id: "bumrah", name: "Jasprit Bumrah", shortName: "J. Bumrah", role: "Bowler", teamId: "mi", age: 31, batting: "Right Handed", bowling: "Right Arm Fast", country: "IND", stats: { matches: 11, runs: 12, wickets: 19, econ: 6.48 } },
  { id: "ishan", name: "Ishan Kishan", shortName: "I. Kishan", role: "Wicket Keeper", teamId: "mi", age: 26, batting: "Left Handed", country: "IND", isWk: true, stats: { matches: 11, runs: 320, wickets: 0, sr: 152.0 } },
  // RCB
  { id: "kohli", name: "Virat Kohli", shortName: "V. Kohli", role: "Batter", teamId: "rcb", age: 36, batting: "Right Handed", country: "IND", stats: { matches: 11, runs: 505, wickets: 0, sr: 142.45 } },
  { id: "duplessis", name: "Faf du Plessis", shortName: "F. du Plessis", role: "Batter", teamId: "rcb", age: 40, batting: "Right Handed", country: "RSA", isCaptain: true, stats: { matches: 11, runs: 380, wickets: 0, sr: 158.3 } },
  { id: "hazlewood", name: "Josh Hazlewood", shortName: "J. Hazlewood", role: "Bowler", teamId: "rcb", age: 33, batting: "Right Handed", bowling: "Right Arm Fast", country: "AUS", stats: { matches: 11, runs: 48, wickets: 20, econ: 8.18 } },
  { id: "patidar", name: "Rajat Patidar", shortName: "R. Patidar", role: "Batter", teamId: "rcb", age: 31, batting: "Right Handed", country: "IND", stats: { matches: 11, runs: 280, wickets: 0, sr: 155.0 } },
  { id: "maxwell", name: "Glenn Maxwell", shortName: "G. Maxwell", role: "All Rounder", teamId: "rcb", age: 36, batting: "Right Handed", bowling: "Off Spin", country: "AUS", stats: { matches: 11, runs: 165, wickets: 5, sr: 142.0, econ: 8.5 } },
  // GT
  { id: "gill", name: "Shubman Gill", shortName: "S. Gill", role: "Batter", teamId: "gt", age: 25, batting: "Right Handed", country: "IND", isCaptain: true, stats: { matches: 11, runs: 607, wickets: 0, sr: 156.32 } },
  { id: "siraj", name: "Mohammed Siraj", shortName: "M. Siraj", role: "Bowler", teamId: "gt", age: 31, batting: "Right Handed", bowling: "Right Arm Fast", country: "IND", stats: { matches: 11, runs: 18, wickets: 14, econ: 8.65 } },
  { id: "rashid", name: "Rashid Khan", shortName: "R. Khan", role: "Bowler", teamId: "gt", age: 26, batting: "Right Handed", bowling: "Leg Spin", country: "AFG", stats: { matches: 11, runs: 80, wickets: 16, econ: 7.2 } },
  // RR
  { id: "jaiswal", name: "Yashasvi Jaiswal", shortName: "Y. Jaiswal", role: "Batter", teamId: "rr", age: 23, batting: "Left Handed", country: "IND", stats: { matches: 11, runs: 559, wickets: 0, sr: 159.0 } },
  { id: "samson", name: "Sanju Samson", shortName: "S. Samson", role: "Wicket Keeper", teamId: "rr", age: 30, batting: "Right Handed", country: "IND", isCaptain: true, isWk: true, stats: { matches: 11, runs: 420, wickets: 0, sr: 155.0 } },
  { id: "chahal", name: "Yuzvendra Chahal", shortName: "Y. Chahal", role: "Bowler", teamId: "rr", age: 34, batting: "Right Handed", bowling: "Leg Spin", country: "IND", stats: { matches: 11, runs: 28, wickets: 18, econ: 7.89 } },
  // LSG
  { id: "krahul", name: "KL Rahul", shortName: "K. Rahul", role: "Wicket Keeper", teamId: "lsg", age: 32, batting: "Right Handed", country: "IND", isCaptain: true, isWk: true, stats: { matches: 11, runs: 448, wickets: 0, sr: 144.0 } },
  { id: "pooran", name: "Nicholas Pooran", shortName: "N. Pooran", role: "Wicket Keeper", teamId: "lsg", age: 29, batting: "Left Handed", country: "WI", stats: { matches: 11, runs: 406, wickets: 0, sr: 162.40 } },
  // SRH
  { id: "cummins", name: "Pat Cummins", shortName: "P. Cummins", role: "All Rounder", teamId: "srh", age: 31, batting: "Right Handed", bowling: "Right Arm Fast", country: "AUS", isCaptain: true, stats: { matches: 11, runs: 95, wickets: 13, sr: 175.0, econ: 9.15 } },
  { id: "abhishek", name: "Abhishek Sharma", shortName: "A. Sharma", role: "All Rounder", teamId: "srh", age: 24, batting: "Left Handed", bowling: "Off Spin", country: "IND", stats: { matches: 11, runs: 484, wickets: 2, sr: 204.0, econ: 9.0 } },
  // KKR
  { id: "iyer", name: "Ajinkya Iyer", shortName: "A. Iyer", role: "Batter", teamId: "kkr", age: 30, batting: "Right Handed", country: "IND", isCaptain: true, stats: { matches: 11, runs: 305, wickets: 0, sr: 145.0 } },
  { id: "narine", name: "Sunil Narine", shortName: "S. Narine", role: "All Rounder", teamId: "kkr", age: 36, batting: "Left Handed", bowling: "Off Spin", country: "WI", stats: { matches: 11, runs: 380, wickets: 13, sr: 175.0, econ: 6.8 } },
  // DC
  { id: "pant", name: "Rishabh Pant", shortName: "R. Pant", role: "Wicket Keeper", teamId: "dc", age: 27, batting: "Left Handed", country: "IND", isCaptain: true, isWk: true, stats: { matches: 11, runs: 398, wickets: 0, sr: 156.0 } },
  // PBKS
  { id: "dhawan", name: "Shikhar Dhawan", shortName: "S. Dhawan", role: "Batter", teamId: "pbks", age: 39, batting: "Left Handed", country: "IND", isCaptain: true, stats: { matches: 11, runs: 290, wickets: 0, sr: 132.0 } },
  { id: "asingh", name: "Arshdeep Singh", shortName: "A. Singh", role: "Bowler", teamId: "pbks", age: 26, batting: "Left Handed", bowling: "Left Arm Fast", country: "IND", stats: { matches: 11, runs: 26, wickets: 16, econ: 8.24 } },
];

const TEAMS: Team[] = TEAMS_RAW.map((t) => ({
  ...t,
  squad: PLAYERS.filter((p) => p.teamId === t.id),
}));

const MATCHES: Match[] = [
  {
    id: "m56", number: 56, status: "live",
    team1: { id: "rcb", short: "RCB", name: "Royal Challengers Bengaluru" },
    team2: { id: "csk", short: "CSK", name: "Chennai Super Kings" },
    date: "May 18, 2025", time: "07:30 PM IST", venue: "M. Chinnaswamy Stadium, Bengaluru",
    score1: { runs: 162, wickets: 4, overs: "18.3" },
    score2: { runs: 158, wickets: 7, overs: "20.0" },
    toss: "RCB won the toss & elected to bowl",
    result: "RCB need 17 runs in 9 balls",
  },
  { id: "m57", number: 57, status: "upcoming", team1: { id: "mi", short: "MI", name: "Mumbai Indians" }, team2: { id: "kkr", short: "KKR", name: "Kolkata Knight Riders" }, date: "May 19, 2025", time: "07:30 PM IST", venue: "Wankhede Stadium, Mumbai" },
  { id: "m58", number: 58, status: "upcoming", team1: { id: "rr", short: "RR", name: "Rajasthan Royals" }, team2: { id: "pbks", short: "PBKS", name: "Punjab Kings" }, date: "May 20, 2025", time: "07:30 PM IST", venue: "Sawai Mansingh Stadium, Jaipur" },
  { id: "m59", number: 59, status: "upcoming", team1: { id: "lsg", short: "LSG", name: "Lucknow Super Giants" }, team2: { id: "gt", short: "GT", name: "Gujarat Titans" }, date: "May 21, 2025", time: "07:30 PM IST", venue: "Ekana Stadium, Lucknow" },
  { id: "m60", number: 60, status: "upcoming", team1: { id: "srh", short: "SRH", name: "Sunrisers Hyderabad" }, team2: { id: "dc", short: "DC", name: "Delhi Capitals" }, date: "May 22, 2025", time: "07:30 PM IST", venue: "Rajiv Gandhi Stadium, Hyderabad" },
  { id: "m61", number: 61, status: "upcoming", team1: { id: "csk", short: "CSK", name: "Chennai Super Kings" }, team2: { id: "rcb", short: "RCB", name: "Royal Challengers Bengaluru" }, date: "May 23, 2025", time: "07:30 PM IST", venue: "MA Chidambaram Stadium, Chennai" },
];

const NEWS: NewsItem[] = [
  { id: "n1", title: "Kohli's Brilliant 67* Powers RCB to Thrilling Win Over CSK", category: "Match Report", source: "Cricbuzz", time: "2h ago", image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80", excerpt: "RCB held their nerve in a last-over thriller to secure a memorable win at home." },
  { id: "n2", title: "GT Clinch Top Spot with Dominant Win Against MI", category: "News", source: "ESPN", time: "4h ago", image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80", excerpt: "Gujarat Titans continue their dream run with a comprehensive victory." },
  { id: "n3", title: "Injury Update: Star Bowler Ruled Out of IPL 2025", category: "Injury", source: "Sportstar", time: "6h ago", image: "https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&q=80", excerpt: "Big blow for the franchise as their key bowler is sidelined for the season." },
  { id: "n4", title: "LSG Keep Playoff Hopes Alive with Crucial Victory", category: "Match Report", source: "Cricbuzz", time: "8h ago", image: "https://images.unsplash.com/photo-1607734834519-d8576ae60ea7?w=800&q=80", excerpt: "Lucknow Super Giants stay in the hunt with a much-needed win." },
  { id: "n5", title: "PBKS Storm into Top 4 After Thrilling Last-Ball Win", category: "News", source: "ESPN", time: "10h ago", image: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80", excerpt: "Punjab Kings pull off an incredible last-ball heist." },
  { id: "n6", title: "KKR's New Strategy Paying Off in IPL 2025", category: "Feature", source: "The Hindu", time: "12h ago", image: "https://images.unsplash.com/photo-1583772928712-d9156dc01d8e?w=800&q=80", excerpt: "Kolkata's tactical evolution under their new leadership group." },
  { id: "n7", title: "Why RR's Top Order Needs a Reset", category: "Analysis", source: "Cricinfo", time: "14h ago", image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80", excerpt: "A deep dive into Rajasthan Royals' struggles." },
  { id: "n8", title: "IPL 2025: Key Stats and Records You Should Know", category: "Stats", source: "Sportstar", time: "1d ago", image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80", excerpt: "Numbers that define this season so far." },
];

const VIDEOS: VideoItem[] = [
  { id: "v1", title: "Top 10 Sixes of IPL 2025 So Far!", duration: "04:35", thumbnail: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80", youtubeId: "dQw4w9WgXcQ", views: "2.1M" },
  { id: "v2", title: "RCB vs CSK: Match Highlights", duration: "08:42", thumbnail: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80", youtubeId: "dQw4w9WgXcQ", views: "5.3M" },
  { id: "v3", title: "Best Wickets of IPL 2025 Week 2", duration: "05:18", thumbnail: "https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&q=80", youtubeId: "dQw4w9WgXcQ", views: "1.8M" },
  { id: "v4", title: "MI vs KKR Highlights — Match 57", duration: "11:24", thumbnail: "https://images.unsplash.com/photo-1607734834519-d8576ae60ea7?w=800&q=80", youtubeId: "dQw4w9WgXcQ", views: "3.4M" },
  { id: "v5", title: "Player of the Match: Shubman Gill", duration: "06:05", thumbnail: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80", youtubeId: "dQw4w9WgXcQ", views: "980K" },
  { id: "v6", title: "All Centuries of IPL 2025", duration: "12:50", thumbnail: "https://images.unsplash.com/photo-1583772928712-d9156dc01d8e?w=800&q=80", youtubeId: "dQw4w9WgXcQ", views: "4.2M" },
];

// ---------- Helpers ----------
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- API Functions ----------
export async function getTeams(): Promise<Team[]> {
  if (MOCK_MODE) { await delay(150); return TEAMS; }
  return (await api.get("/teams")).data;
}

export async function getTeamById(teamId: string): Promise<Team | undefined> {
  if (MOCK_MODE) { await delay(150); return TEAMS.find((t) => t.id === teamId); }
  return (await api.get(`/teams/${teamId}`)).data;
}

export async function getMatches(): Promise<Match[]> {
  if (MOCK_MODE) { await delay(150); return MATCHES; }
  return (await api.get("/matches")).data;
}

export async function getMatchById(matchId: string): Promise<Match | undefined> {
  if (MOCK_MODE) { await delay(100); return MATCHES.find((m) => m.id === matchId); }
  return (await api.get(`/matches/${matchId}`)).data;
}

// Live data with simulated tick — runs/balls increment slightly each call.
let _tick = 0;
export async function getLiveMatch(matchId: string): Promise<LiveData> {
  if (MOCK_MODE) {
    await delay(200);
    _tick = (_tick + 1) % 6;
    const baseRuns = 162 + Math.floor(_tick / 2);
    const ballsExtra = _tick;
    const recentBallPool = ["1", "Wd", "1", "4", ".", "1", "1b", "2", ".", "4", "6", "0"];
    return {
      matchId,
      battingTeam: "RCB",
      bowlingTeam: "CSK",
      score: { runs: baseRuns, wickets: 4, overs: `18.${3 + ballsExtra > 5 ? 5 : 3 + ballsExtra}` },
      target: 159,
      required: `RCB need ${Math.max(0, 17 - _tick)} runs in ${Math.max(1, 9 - ballsExtra)} balls`,
      currentBatters: [
        { name: "V. Kohli", runs: 67 + _tick, balls: 43 + ballsExtra, sr: 155.81, onStrike: true },
        { name: "F. du Plessis", runs: 45, balls: 28, sr: 160.71, onStrike: false },
      ],
      currentBowler: { name: "M. Pathirana", overs: `3.${3 + ballsExtra > 5 ? 5 : 3 + ballsExtra}`, maidens: 0, runs: 28 + _tick, wickets: 1 },
      recentBalls: recentBallPool.slice(_tick, _tick + 9).concat(recentBallPool).slice(0, 9),
      thisOver: ["1", "Wd", "1", "4", ".", "1"].slice(0, 3 + ballsExtra > 6 ? 6 : 3 + ballsExtra),
      partnership: { runs: 89 + _tick, balls: 56 + ballsExtra },
    };
  }
  return (await api.get(`/matches/${matchId}/live`)).data;
}

export async function getCommentary(matchId: string): Promise<Commentary[]> {
  if (MOCK_MODE) {
    await delay(150);
    return [
      { over: "18.3", ball: "1", text: "M. Pathirana to F. du Plessis, 1 run, pushed to mid-on for a quick single.", scoreAfter: "162/4" },
      { over: "18.2", ball: ".", text: "M. Pathirana to F. du Plessis, no run, beaten outside off!", scoreAfter: "161/4" },
      { over: "18.1", ball: "4", text: "M. Pathirana to F. du Plessis, FOUR! Beautifully driven through covers.", scoreAfter: "161/4" },
      { over: "17.6", ball: "1", text: "T. Deshpande to V. Kohli, 1 run to long-on.", scoreAfter: "157/4" },
      { over: "17.5", ball: "6", text: "T. Deshpande to V. Kohli, SIX! Massive hit over deep mid-wicket!", scoreAfter: "156/4" },
      { over: "17.4", ball: ".", text: "T. Deshpande to V. Kohli, dot ball, defended.", scoreAfter: "150/4" },
      { over: "17.3", ball: "2", text: "T. Deshpande to F. du Plessis, 2 runs, cleverly placed.", scoreAfter: "150/4" },
    ];
    void matchId;
  }
  return (await api.get(`/matches/${matchId}/commentary`)).data;
}

export async function getNews(): Promise<NewsItem[]> {
  if (MOCK_MODE) { await delay(150); return NEWS; }
  return (await api.get("/news")).data;
}

export async function getVideos(): Promise<VideoItem[]> {
  if (MOCK_MODE) { await delay(100); return VIDEOS; }
  return (await api.get("/videos")).data;
}

export async function getAllPlayers(): Promise<Player[]> {
  if (MOCK_MODE) { await delay(150); return PLAYERS; }
  return (await api.get("/players")).data;
}
