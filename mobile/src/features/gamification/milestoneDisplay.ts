/**
 * Presentation mapping for a {@link Milestone} — the shared shape behind the
 * Profile **trophy case** badges (screens.md §14) and the full-screen
 * **Celebration** + **Milestone Card** (§12).
 *
 * Copy is Vietnamese and verbatim from the design handoff (`#profile`: "1000
 * từ" · "streak 7" · "lên B1"; `#core` Celebration: "Streak 7 ngày liên tục!").
 * The `tone` selects the token family — `warm` (amber) for the Streak / North
 * Star (the Absorbed family), `flow` (teal) for a Level up — so nothing is
 * hardcoded per-screen.
 */

import type {Milestone} from './milestones';

/** Which token family a milestone badge / card paints in. */
export type MilestoneTone = 'warm' | 'flow';

export interface MilestoneDisplay {
  /** Emoji shown on the trophy-case tile and the Celebration hero. */
  emoji: string;
  /** Short label for the trophy-case tile (e.g. "streak 7", "lên B1"). */
  badgeLabel: string;
  /** Headline for the full-screen Celebration (e.g. "Streak 7 ngày liên tục!"). */
  title: string;
  /** The big hero value on the Celebration / Milestone Card. */
  heroValue: string;
  /** Token family — `warm` for Streak/North Star, `flow` for Level up. */
  tone: MilestoneTone;
}

/** Map a milestone to its Vietnamese display (trophy badge + Celebration copy). */
export function milestoneDisplay(milestone: Milestone): MilestoneDisplay {
  switch (milestone.kind) {
    case 'streak':
      return {
        emoji: '🔥',
        badgeLabel: `streak ${milestone.days}`,
        title: `Streak ${milestone.days} ngày liên tục!`,
        heroValue: String(milestone.days),
        tone: 'warm',
      };
    case 'levelUp':
      return {
        emoji: '⬆️',
        badgeLabel: `lên ${milestone.toBand}`,
        title: `Kỹ năng ${milestone.skill === 'reading' ? 'Đọc' : 'Nghe'} đã lên ${milestone.toBand}!`,
        heroValue: milestone.toBand,
        tone: 'flow',
      };
    case 'northStar':
      return {
        emoji: '📘',
        badgeLabel: `${milestone.total.toLocaleString('en-US')} từ`,
        title: `${milestone.total.toLocaleString('en-US')} Item đã nạp!`,
        heroValue: milestone.total.toLocaleString('en-US'),
        tone: 'warm',
      };
  }
}
