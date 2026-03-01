import { API_URL, FALLBACK_DATA } from "./MagicWordsConstants";

export type DialogueLine = { name: string; text: string };
export type Emoji = { name: string; url: string };
export type Avatar = { name: string; url: string; position: "left" | "right" };

export interface MagicWordsData {
  dialogue: DialogueLine[];
  emojies: Emoji[];
  avatars: Avatar[];
}

export type Segment = { type: "text" | "emoji"; content: string };

export class MagicWordsLogic {
  data: MagicWordsData = { dialogue: [], emojies: [], avatars: [] };
  emojiNames = new Set<string>();
  avatarMap = new Map<string, Avatar>();
  currentIndex = 0;

  get hasNextLine(): boolean {
    return this.currentIndex < this.data.dialogue.length;
  }

  get currentLine(): DialogueLine | null {
    return this.data.dialogue[this.currentIndex] ?? null;
  }

  advance(): DialogueLine | null {
    if (!this.hasNextLine) return null;
    const line = this.data.dialogue[this.currentIndex];
    this.currentIndex++;
    return line;
  }

  reset(): void {
    this.currentIndex = 0;
    this.data = { dialogue: [], emojies: [], avatars: [] };
    this.emojiNames.clear();
    this.avatarMap.clear();
  }

  async fetchAndPrepare(): Promise<void> {
    this.data = await this.fetchData();
    this.emojiNames.clear();
    this.avatarMap.clear();
    this.data.emojies.forEach((e) => this.emojiNames.add(e.name));
    this.data.avatars.forEach((a) => this.avatarMap.set(a.name, a));
  }

  parseSegments(text: string): Segment[] {
    const segments: Segment[] = [];
    let cursor = 0;
    const re = /\{([^}]+)\}/g;
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
      if (m.index > cursor)
        segments.push({ type: "text", content: text.slice(cursor, m.index) });
      const token = m[1].trim();
      segments.push(
        this.emojiNames.has(token)
          ? { type: "emoji", content: token }
          : { type: "text", content: `{${token}}` },
      );
      cursor = m.index + m[0].length;
    }

    if (cursor < text.length)
      segments.push({ type: "text", content: text.slice(cursor) });

    return segments;
  }

  private async fetchData(): Promise<MagicWordsData> {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as MagicWordsData & { emojis?: Emoji[] };
      if (!json.emojies && json.emojis) json.emojies = json.emojis;
      return FALLBACK_DATA;
    } catch (err) {
      console.warn("Remote fetch failed, using fallback data:", err);
      return FALLBACK_DATA;
    }
  }
}
