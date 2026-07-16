// Supabase Edge Function: instagram-stats
//
// Proxies Instagram Graph API calls so the access token never reaches the
// browser. The client calls this via supabase.functions.invoke("instagram-stats",
// { body: { pageId } }); pageId is one of the ids in src/lib/constants.js PAGES.
//
// Required setup before this does anything useful:
//   1. Run supabase/sql/instagram_accounts.sql once in the SQL editor.
//   2. supabase secrets set INSTAGRAM_ACCESS_TOKEN=<long-lived token>
//   3. supabase functions deploy instagram-stats
//   4. As admin, set each page's Instagram Business Account ID from the
//      Pages tab (writes into instagram_accounts).
//
// Until a page has a row in instagram_accounts, this returns
// { connected: false } and the UI shows a "not connected" placeholder.

import { createClient } from "jsr:@supabase/supabase-js@2";

const GRAPH_API_VERSION = "v21.0";
const RECENT_MEDIA_LIMIT = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchMediaInsightViews(mediaId: string, mediaType: string, token: string) {
  // Video/Reel posts report "plays"; image/carousel posts report
  // impressions/reach instead. Not every post has insights available
  // (very old posts, some carousel items) — treat failures as 0, not fatal.
  const metric = mediaType === "VIDEO" || mediaType === "REELS" ? "plays" : "impressions,reach";
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}/insights?metric=${metric}&access_token=${token}`
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const values = (data?.data || []).map((m: any) => m.values?.[0]?.value || 0);
    return values.reduce((a: number, b: number) => a + b, 0);
  } catch {
    return 0;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  try {
    const { pageId } = await req.json();
    if (!pageId) return json({ error: "pageId is required" }, 400);

    if (!token || !supabaseUrl || !serviceKey) {
      return json({ connected: false, reason: "Instagram integration not configured yet" });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: account } = await supabase
      .from("instagram_accounts")
      .select("ig_business_id")
      .eq("page_id", pageId)
      .maybeSingle();

    if (!account?.ig_business_id) {
      return json({ connected: false, reason: "This page isn't linked to an Instagram Business Account yet" });
    }

    const igId = account.ig_business_id;

    const profileRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igId}?fields=followers_count,media_count,name&access_token=${token}`
    );
    if (!profileRes.ok) {
      const errBody = await profileRes.text();
      console.error("instagram-stats profile fetch failed:", errBody);
      return json({ connected: false, reason: "Instagram API request failed — token may be expired" }, 200);
    }
    const profile = await profileRes.json();

    const mediaRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igId}/media?fields=id,like_count,comments_count,timestamp,media_type,permalink&limit=${RECENT_MEDIA_LIMIT}&access_token=${token}`
    );
    const mediaJson = mediaRes.ok ? await mediaRes.json() : { data: [] };
    const recentMedia = mediaJson.data || [];

    const viewsPerPost = await Promise.all(
      recentMedia.map((m: any) => fetchMediaInsightViews(m.id, m.media_type, token))
    );
    const totalViews = viewsPerPost.reduce((a, b) => a + b, 0);

    const totalLikes = recentMedia.reduce((s: number, m: any) => s + (m.like_count || 0), 0);
    const totalComments = recentMedia.reduce((s: number, m: any) => s + (m.comments_count || 0), 0);
    const sampleSize = recentMedia.length || 1;
    const avgLikes = totalLikes / sampleSize;
    const avgComments = totalComments / sampleSize;
    const followers = profile.followers_count || 0;
    const engagementRate = followers > 0 ? ((avgLikes + avgComments) / followers) * 100 : 0;

    return json({
      connected: true,
      igBusinessId: igId,
      name: profile.name,
      followers,
      mediaCount: profile.media_count || 0,
      avgLikes: Math.round(avgLikes),
      avgComments: Math.round(avgComments),
      engagementRate: Math.round(engagementRate * 100) / 100,
      recentViews: totalViews,
      sampledPosts: recentMedia.length,
    });
  } catch (e) {
    console.error("instagram-stats error:", e);
    return json({ connected: false, reason: "Unexpected error fetching Instagram stats" }, 200);
  }
});
