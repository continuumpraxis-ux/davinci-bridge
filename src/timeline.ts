/**
 * Timeline operations for DaVinci Resolve via native run_script mappings.
 *
 * READ ops are free. WRITE ops require dryRun preview + confirm:true.
 */
import { callTool } from "./client";

export interface TimelineInput {
  /** Bearer token for the bridge. Use {{secret:davinciBridgeToken}}. */
  token: string;
  /** Preview only — show what would happen without doing it. */
  dryRun?: boolean;
  /** Required for any mutation. Must be true. */
  confirm?: boolean;
}

/**
 * Switch to a different timeline by name (mapped to run_script).
 *
 * @param params - Token, timeline name, dryRun/confirm for writes
 * @returns MCP/script result or dry-run preview
 *
 * @example
 * import { setTimeline } from 'kody:@continuumpraxis/davinci/timeline'
 * await setTimeline({ token: '{{secret:davinciBridgeToken}}', name: 'A-ROLL', dryRun: true })
 */
export async function setTimeline(params: TimelineInput & { name: string }) {
  if (params.dryRun) {
    return { ok: true, dry_run: true, action: "setTimeline", name: params.name };
  }
  if (!params.confirm) {
    return {
      ok: false,
      error: "Timeline switch needs confirm:true. This changes Resolve state.",
      preview: { action: "setTimeline", name: params.name },
    };
  }
  return callTool("resolve_set_current_timeline", { name: params.name }, params.token);
}

/**
 * Duplicate the current timeline (mapped to run_script).
 *
 * @param params - Token, optional new name, dryRun/confirm
 * @returns New timeline name or preview
 *
 * @example
 * import { duplicateTimeline } from 'kody:@continuumpraxis/davinci/timeline'
 * await duplicateTimeline({ token: '{{secret:davinciBridgeToken}}', dryRun: true })
 */
export async function duplicateTimeline(params: TimelineInput & { name?: string }) {
  const newName = params.name || `MONTAGE_${Date.now()}`;
  if (params.dryRun) {
    return { ok: true, dry_run: true, action: "duplicateTimeline", newName };
  }
  if (!params.confirm) {
    return {
      ok: false,
      error: "Duplication needs confirm:true.",
      preview: { action: "duplicateTimeline", newName },
    };
  }
  return callTool("resolve_duplicate_timeline", { name: newName }, params.token);
}

/**
 * Get playhead timecode (mapped to run_script).
 *
 * @param params - Bridge token
 * @returns Current timecode
 *
 * @example
 * import { getPlayhead } from 'kody:@continuumpraxis/davinci/timeline'
 * await getPlayhead({ token: '{{secret:davinciBridgeToken}}' })
 */
export async function getPlayhead(params: TimelineInput) {
  return callTool("resolve_get_playhead", {}, params.token);
}

/**
 * Set playhead position (mapped to run_script). MUTATION — confirm required.
 *
 * @param params - Token, timecode or frame, dryRun/confirm
 * @returns Script result or preview
 *
 * @example
 * import { setPlayhead } from 'kody:@continuumpraxis/davinci/timeline'
 * await setPlayhead({ token: '{{secret:davinciBridgeToken}}', timecode: '01:00:00:00', confirm: true })
 */
export async function setPlayhead(
  params: TimelineInput & { timecode?: string; frame?: number },
) {
  if (params.dryRun) {
    return {
      ok: true,
      dry_run: true,
      action: "setPlayhead",
      timecode: params.timecode,
      frame: params.frame,
    };
  }
  if (!params.confirm) {
    return {
      ok: false,
      error: "Playhead move needs confirm:true.",
      preview: { action: "setPlayhead", timecode: params.timecode, frame: params.frame },
    };
  }
  const args: Record<string, unknown> = {};
  if (params.timecode) args.timecode = params.timecode;
  if (params.frame !== undefined) args.frame = params.frame;
  return callTool("resolve_set_playhead", args, params.token);
}

/**
 * Read clip transform (mapped to run_script).
 *
 * @param params - Token plus optional track/clip indexes
 * @returns Clip property bag
 *
 * @example
 * import { getClipTransform } from 'kody:@continuumpraxis/davinci/timeline'
 * await getClipTransform({ token: '{{secret:davinciBridgeToken}}', trackType: 'video', trackIndex: 1, clipIndex: 1 })
 */
export async function getClipTransform(
  params: TimelineInput & { trackType?: string; trackIndex?: number; clipIndex?: number },
) {
  const args: Record<string, unknown> = {};
  if (params.trackType) args.trackType = params.trackType;
  if (params.trackIndex !== undefined) args.trackIndex = params.trackIndex;
  if (params.clipIndex !== undefined) args.clipIndex = params.clipIndex;
  return callTool("resolve_get_clip_transform", args, params.token);
}

/**
 * Set clip transform (mapped to run_script). MUTATION — confirm required.
 *
 * @param params - Token, track/clip, zoom/pan/opacity, dryRun/confirm
 * @returns Script result or preview
 *
 * @example
 * import { setClipTransform } from 'kody:@continuumpraxis/davinci/timeline'
 * await setClipTransform({ token: '{{secret:davinciBridgeToken}}', zoom: 1.3, dryRun: true, trackIndex: 1, clipIndex: 1 })
 */
export async function setClipTransform(
  params: TimelineInput & {
    trackType?: string;
    trackIndex?: number;
    clipIndex?: number;
    zoom?: number;
    panX?: number;
    panY?: number;
    cropLeft?: number;
    cropRight?: number;
    cropTop?: number;
    cropBottom?: number;
    opacity?: number;
  },
) {
  const args: Record<string, unknown> = {};
  if (params.trackType) args.trackType = params.trackType;
  if (params.trackIndex !== undefined) args.trackIndex = params.trackIndex;
  if (params.clipIndex !== undefined) args.clipIndex = params.clipIndex;
  if (params.zoom !== undefined) args.zoom = params.zoom;
  if (params.panX !== undefined) args.panX = params.panX;
  if (params.panY !== undefined) args.panY = params.panY;
  if (params.cropLeft !== undefined) args.cropLeft = params.cropLeft;
  if (params.cropRight !== undefined) args.cropRight = params.cropRight;
  if (params.cropTop !== undefined) args.cropTop = params.cropTop;
  if (params.cropBottom !== undefined) args.cropBottom = params.cropBottom;
  if (params.opacity !== undefined) args.opacity = params.opacity;

  if (params.dryRun) {
    return { ok: true, dry_run: true, action: "setClipTransform", args };
  }
  if (!params.confirm) {
    return {
      ok: false,
      error: "Transform change needs confirm:true. This modifies the timeline.",
      preview: { action: "setClipTransform", args },
    };
  }
  return callTool("resolve_set_clip_transform", args, params.token);
}

/**
 * Describe timeline helpers (does not call Resolve).
 *
 * @param params - Unused token bag for export symmetry
 * @returns Pointer to named functions
 *
 * @example
 * import davinciTimeline from 'kody:@continuumpraxis/davinci/timeline'
 * await davinciTimeline({ token: '{{secret:davinciBridgeToken}}' })
 */
export default async function davinciTimeline(
  params: TimelineInput = {} as TimelineInput,
) {
  return {
    ok: true,
    message:
      "Use specific functions: setTimeline, duplicateTimeline, getPlayhead, setPlayhead, getClipTransform, setClipTransform",
    tokenPresent: Boolean(params?.token),
  };
}
