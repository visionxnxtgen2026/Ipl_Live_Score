import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async (_ctx: any) => {
        const key = process.env.GNEWS_API_KEY;
        if (!key) {
          return Response.json({ news: [], error: "GNEWS_API_KEY not configured" });
        }
        try {
          const res = await fetch(
            `https://gnews.io/api/v4/search?q=IPL+OR+cricket+India&lang=en&country=in&max=12&apikey=${key}`,
          );
          if (!res.ok) throw new Error(`GNews ${res.status}`);
          const data = await res.json();
          const news = (data.articles ?? []).map((a: any, i: number) => ({
            id: `gn${i}`,
            title: a.title,
            category: "News",
            source: a.source?.name ?? "GNews",
            time: new Date(a.publishedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
            image: a.image || "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
            excerpt: a.description ?? "",
            url: a.url,
          }));
          return Response.json({ news }, { headers: { "Cache-Control": "public, max-age=300" } });
        } catch (e: any) {
          return Response.json({ news: [], error: e.message }, { status: 200 });
        }
      },
    },
  },
} as any);
