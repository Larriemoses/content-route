import { NextResponse } from 'next/server';
import { requestStructuredCompletion } from '@/lib/openrouter/client';

type Headline = { title: string; link: string; source: string };

function extractHeadlines(xml: string): Headline[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 12).map((match) => {
    const item = match[1];
    const read = (name: string) => item.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? '';
    return { title: read('title'), link: read('link'), source: read('source') };
  }).filter((item) => item.title && item.link);
}

export async function GET() {
  try {
    const news = await fetch('https://news.google.com/rss/search?q=artificial+intelligence+OR+AI&hl=en-US&gl=US&ceid=US:en', { cache: 'no-store' });
    if (!news.ok) return NextResponse.json({ ok: false, error: 'News source unavailable' }, { status: 502 });
    const headlines = extractHeadlines(await news.text());
    if (!headlines.length) return NextResponse.json({ ok: false, error: 'No AI news found' }, { status: 502 });
    const result = await requestStructuredCompletion({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      system: 'You are Writeet, an evidence-first LinkedIn thought-leadership editor. Return JSON only. Never invent facts. Select one timely story and explain why it matters to a builder focused on practical AI, AI security, responsible automation, and learning.',
      user: JSON.stringify({ profile: 'A practical AI builder and lifelong learner who writes about responsible automation, AI security, and making technical ideas useful.', headlines, output: { selectedHeadline: 'string', whyItMatters: 'string', angle: 'string', draft: 'string', claimsToVerify: ['string'], sourceUrls: ['string'] } }),
    });
    return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), result, sources: headlines });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Research failed' }, { status: 502 });
  }
}
