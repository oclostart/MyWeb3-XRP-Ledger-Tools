import type { ReactNode } from 'react'
import { AtIcon, GlobeIcon, PaperIcon, ScaleIcon, TagIcon } from '@/components/icons'
import type { PATHS } from '@/app/routes'

export interface Tool {
  key: 'sourceTag' | 'toml' | 'domain' | 'emailHash' | 'trustLines'
  icon: ReactNode
  /**
   * The route it lives at, by name. Looked up at render rather than here:
   * the route table imports this feature, so while this module loads `PATHS`
   * is still initialising, and reading it now throws. Absent until the tool
   * is built — the tile shows "Coming soon" instead.
   */
  route?: keyof typeof PATHS
  /** Tools that write to the ledger say Connect until a wallet is connected (T2). */
  signs: boolean
}

export interface ToolGroup {
  key: 'merchants' | 'developers'
  tools: Tool[]
}

/**
 * In the client's Canva order (C2, 2026-10-12): what a merchant sets on their
 * own account, then what a developer or operator generates. The hub sets each
 * group as a row under its own heading; the header's Tools menu lists them the
 * same way (R13), so the two never disagree on what the tools are.
 */
export const TOOL_GROUPS: ToolGroup[] = [
  {
    key: 'merchants',
    tools: [
      { key: 'trustLines', icon: <ScaleIcon />, route: 'trustLines', signs: true },
      { key: 'domain', icon: <GlobeIcon />, route: 'domain', signs: true },
      { key: 'emailHash', icon: <AtIcon />, route: 'emailHash', signs: true },
    ],
  },
  {
    key: 'developers',
    tools: [
      { key: 'sourceTag', icon: <TagIcon />, route: 'sourceTag', signs: false },
      { key: 'toml', icon: <PaperIcon />, route: 'toml', signs: false },
    ],
  },
]
