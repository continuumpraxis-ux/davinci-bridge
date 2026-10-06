/** Native Resolve 21.1 MCP tools exposed on 127.0.0.1:8795 / the tunnel. */
export const NATIVE_TOOLS = [
  "launch_resolve",
  "get_resolve_status",
  "get_whats_new",
  "get_scripting_api",
  "search_scripting_api",
  "run_script",
  "run_script_unsafe",
  "get_scripting_docs",
  "list_dctls",
  "list_luts",
  "update_dctl",
  "delete_dctl",
  "delete_lut",
  "generate_lut",
] as const;

export type NativeTool = (typeof NATIVE_TOOLS)[number];

/** Direct rename onto a native tool (no run_script). */
export const DIRECT_ALIAS: Record<string, NativeTool> = {
  resolve_get_status: "get_resolve_status",
  resolve_reconnect: "get_resolve_status",
  resolve_get_lut: "list_luts",
  resolve_export_lut: "generate_lut",
};

/**
 * Legacy guycochran tools with no Resolve scripting / native equivalent.
 * Still routed through `run_script`, which returns `{ gap: true }`.
 */
export const GAP_TOOLS: Record<string, string> = {
  resolve_describe_frame:
    "Native MCP has no vision tools; scripting API cannot describe a frame.",
  resolve_detect_in_frame:
    "Native MCP has no object-detection tool; no scripting equivalent.",
  resolve_ask_about_frame:
    "Native MCP has no VLM Q&A tool; no scripting equivalent.",
  resolve_find_shots_by_visual_description:
    "Native MCP has no visual search; no scripting equivalent.",
  resolve_transcribe_audio:
    "Studio transcription is not exposed as a stable scripting call on this native surface.",
  resolve_clear_transcription:
    "No native/scripting clear-transcription tool.",
  resolve_classify_audio:
    "No native/scripting audio-classification tool.",
  resolve_clear_audio_classification:
    "No native/scripting clear-classification tool.",
  resolve_analyze_intellisearch:
    "IntelliSearch is not on the native 14-tool MCP surface.",
  resolve_reset_intellisearch:
    "IntelliSearch reset is not on the native 14-tool MCP surface.",
  resolve_analyze_slate:
    "Slate analysis is not on the native 14-tool MCP surface.",
  resolve_remove_motion_blur:
    "Motion deblur is not on the native 14-tool MCP surface.",
  resolve_generate_speech:
    "Speech generation is not on the native 14-tool MCP surface.",
  resolve_insert_broll:
    "No high-level b-roll insert; write a custom run_script if you have clip ids.",
  resolve_build_rough_cut:
    "No high-level rough-cut builder on native MCP.",
  resolve_create_chapter_markers:
    "No chapter-marker helper; use resolve_add_marker via run_script per chapter.",
  resolve_create_captions:
    "Caption generation is not on the native 14-tool MCP surface.",
  resolve_get_transcript:
    "No transcript reader on native MCP.",
  resolve_detect_silence:
    "No silence-detection tool on native MCP.",
  resolve_tighten_silence:
    "No silence-tighten tool on native MCP.",
  resolve_build_cut_variant:
    "No cut-variant builder on native MCP.",
};

export const LEGACY_TOOLS = [
  "resolve_get_status",
  "resolve_open_page",
  "resolve_get_current_page",
  "resolve_reconnect",
  "resolve_list_projects",
  "resolve_load_project",
  "resolve_save_project",
  "resolve_create_project",
  "resolve_get_project_settings",
  "resolve_set_project_setting",
  "resolve_list_timelines",
  "resolve_get_current_timeline",
  "resolve_set_current_timeline",
  "resolve_get_playhead",
  "resolve_set_playhead",
  "resolve_get_track_items",
  "resolve_create_timeline",
  "resolve_duplicate_timeline",
  "resolve_list_media",
  "resolve_import_media",
  "resolve_create_bin",
  "resolve_append_to_timeline",
  "resolve_get_clip_properties",
  "resolve_set_clip_transform",
  "resolve_get_clip_transform",
  "resolve_set_clip_speed",
  "resolve_set_clip_enabled",
  "resolve_create_compound_clip",
  "resolve_delete_clip",
  "resolve_replace_clip",
  "resolve_apply_lut",
  "resolve_get_lut",
  "resolve_create_color_version",
  "resolve_load_color_version",
  "resolve_list_color_versions",
  "resolve_export_lut",
  "resolve_add_marker",
  "resolve_get_markers",
  "resolve_delete_markers",
  "resolve_insert_title",
  "resolve_modify_title_text",
  "resolve_list_render_presets",
  "resolve_quick_export",
  "resolve_add_render_job",
  "resolve_start_render",
  "resolve_get_render_status",
  "resolve_export_timeline",
  "resolve_get_fusion_comps",
  "resolve_add_fusion_comp",
  "resolve_get_fusion_tools",
  "resolve_describe_frame",
  "resolve_detect_in_frame",
  "resolve_ask_about_frame",
  "resolve_find_shots_by_visual_description",
  "resolve_transcribe_audio",
  "resolve_clear_transcription",
  "resolve_classify_audio",
  "resolve_clear_audio_classification",
  "resolve_analyze_intellisearch",
  "resolve_reset_intellisearch",
  "resolve_analyze_slate",
  "resolve_remove_motion_blur",
  "resolve_generate_speech",
  "resolve_disable_background_tasks",
  "resolve_find_media_clip",
  "resolve_find_timeline_clip",
  "resolve_insert_broll",
  "resolve_build_rough_cut",
  "resolve_add_marker_at_playhead",
  "resolve_create_chapter_markers",
  "resolve_render_for_youtube",
  "resolve_create_captions",
  "resolve_get_transcript",
  "resolve_detect_silence",
  "resolve_tighten_silence",
  "resolve_build_cut_variant",
  "resolve_wait_for_render",
] as const;

export function isNativeTool(name: string): name is NativeTool {
  return (NATIVE_TOOLS as readonly string[]).includes(name);
}
