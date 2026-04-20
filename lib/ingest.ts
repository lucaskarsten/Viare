import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";

export const IngestSourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("url"), url: z.string().url() }),
  z.object({ type: z.literal("youtube"), url: z.string().url() }),
  z.object({ type: z.literal("text"), content: z.string().min(1).max(50000) }),
]);

export type IngestSource = z.infer<typeof IngestSourceSchema>;

export async function extractSourceContent(
  source: IngestSource
): Promise<{ text: string; title?: string }> {
  switch (source.type) {
    case "url":
      return fetchUrl(source.url);
    case "youtube":
      return fetchYouTubeTranscript(source.url);
    case "text":
      return { text: source.content };
  }
}

async function fetchUrl(url: string): Promise<{ text: string; title?: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Viare/1.0)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw new Error(`Cannot extract text from content type: ${contentType}`);
  }
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  const text = stripHtml(html).slice(0, 30000);
  return { text, title: titleMatch?.[1]?.trim() };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

async function fetchYouTubeTranscript(url: string): Promise<{ text: string }> {
  if (/youtube\.com\/playlist\?/.test(url)) {
    throw new Error(
      "Playlist URLs are not supported — paste individual video URLs instead. " +
        "Open the playlist, click each video, and copy that URL."
    );
  }
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error(`Could not extract video ID from: ${url}`);
  const items = await YoutubeTranscript.fetchTranscript(videoId);
  const text = items
    .map((item) => item.text)
    .join(" ")
    .slice(0, 30000);
  return { text };
}
