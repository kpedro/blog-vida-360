import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseDurationMinutes(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  return h * 60 + m + Math.round(s / 60);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, maxResults = 6, category = null } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Campo 'query' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({ error: "YOUTUBE_API_KEY não configurada no Supabase Secrets" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const searchUrl =
      "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video" +
      `&q=${encodeURIComponent(query)}` +
      `&maxResults=${Math.max(1, Math.min(12, Number(maxResults) || 6))}` +
      `&key=${youtubeApiKey}&videoEmbeddable=true&videoSyndicated=true&order=relevance`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    if (!searchResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Falha na busca YouTube", details: searchData }),
        {
          status: searchResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const ids = (searchData.items || [])
      .map((item: any) => item?.id?.videoId)
      .filter(Boolean)
      .join(",");

    if (!ids) {
      return new Response(JSON.stringify({ videos: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const detailsUrl =
      "https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics" +
      `&id=${ids}&key=${youtubeApiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    const detailsMap = new Map<string, any>();
    (detailsData.items || []).forEach((v: any) => detailsMap.set(v.id, v));

    const videos = (searchData.items || []).map((item: any) => {
      const id = item?.id?.videoId;
      const detail = detailsMap.get(id) || {};
      return {
        videoId: id,
        title: item?.snippet?.title || "Vídeo",
        description: item?.snippet?.description || "",
        thumbnail:
          item?.snippet?.thumbnails?.high?.url ||
          item?.snippet?.thumbnails?.medium?.url ||
          item?.snippet?.thumbnails?.default?.url ||
          "",
        channelTitle: item?.snippet?.channelTitle || "",
        publishedAt: item?.snippet?.publishedAt || null,
        durationMinutes: parseDurationMinutes(detail?.contentDetails?.duration || "PT0S"),
        url: `https://www.youtube.com/embed/${id}`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
        viewCount: detail?.statistics?.viewCount || 0,
        category,
      };
    });

    return new Response(JSON.stringify({ videos }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

