const SLACK_API = 'https://slack.com/api';

async function slackGet(method: string, params: Record<string, string>) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error('SLACK_BOT_TOKEN not configured');
  const qs = new URLSearchParams(params);
  const res = await fetch(`${SLACK_API}/${method}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Slack API error: ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(`Slack error: ${json.error}`);
  return json;
}

export interface NpsSurveyEntry {
  email: string;
  score: number;
  ts: number; // unix timestamp
}

/**
 * Reads all NPS survey messages from the channel and returns parsed entries
 * within the given time range.
 */
export async function getNpsEntries(
  channelId: string,
  oldestTs: number
): Promise<NpsSurveyEntry[]> {
  const entries: NpsSurveyEntry[] = [];
  let cursor: string | undefined;

  // Regex to extract email and score from messages like:
  // "Survey Completed by User: foo@bar.com\n*Q[5]:* 8"
  const emailRe = /Survey Completed by User:\s*(\S+@\S+)/i;
  const scoreRe = /\*Q\[5\]:\*\s*(\d+)/;

  do {
    const params: Record<string, string> = {
      channel: channelId,
      oldest: String(oldestTs),
      limit: '200',
      include_all_metadata: '0',
    };
    if (cursor) params.cursor = cursor;

    const data = await slackGet('conversations.history', params);
    const messages: { text: string; ts: string; bot_id?: string }[] =
      data.messages ?? [];

    for (const msg of messages) {
      const emailMatch = emailRe.exec(msg.text);
      const scoreMatch = scoreRe.exec(msg.text);
      if (emailMatch && scoreMatch) {
        const score = parseInt(scoreMatch[1]);
        if (score >= 0 && score <= 10) {
          entries.push({
            email: emailMatch[1].toLowerCase(),
            score,
            ts: parseFloat(msg.ts),
          });
        }
      }
    }

    cursor = data.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return entries;
}
