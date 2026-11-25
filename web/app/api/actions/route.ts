import { NextRequest, NextResponse } from 'next/server';
import { runDiscordCommand } from '@/lib/discord';

// POST /api/actions — the shared backend entry the Discord bot uses.
//   { "action": "runDiscordCommand", "args": { "input": "search zip:60487 radius:25" } }
// Auth: Authorization: Bearer <TRACKER_API_KEY>. Anything else is rejected.
// The bot never writes inventory directly; it only renders what this returns.
export async function POST(req: NextRequest) {
  const expected = process.env.TRACKER_API_KEY ?? '';
  const auth = req.headers.get('authorization') ?? '';
  if (!expected) {
    return NextResponse.json({ title: 'Tracker backend not configured', lines: ['TRACKER_API_KEY is not set on this host. The bot cannot call the backend until the site owner sets it in Vercel.'], footer: 'No inventory was checked.' }, { status: 503 });
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as { action?: string; args?: { input?: string } };
  if (body.action !== 'runDiscordCommand') {
    return NextResponse.json({ error: `Unknown action: ${body.action ?? ''}` }, { status: 400 });
  }
  const result = await runDiscordCommand(body.args?.input ?? 'help');
  return NextResponse.json(result);
}
