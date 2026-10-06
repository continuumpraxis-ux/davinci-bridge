# 77 → 14 native MCP mapping

Tunnel `https://davinci.continuumpraxisapp.com/mcp` fronts native Resolve 21.1
(`davinci_resolve` 21.1.1) on `127.0.0.1:8795`. Guycochran on `:8794` is unused
by this package and must not be moved.

## Native tools (14)

`launch_resolve`, `get_resolve_status`, `get_whats_new`, `get_scripting_api`,
`search_scripting_api`, `run_script`, `run_script_unsafe`, `get_scripting_docs`,
`list_dctls`, `list_luts`, `update_dctl`, `delete_dctl`, `delete_lut`,
`generate_lut`.

`callTool` accepts these names unchanged.

## Direct aliases

| Legacy | Native |
| --- | --- |
| `resolve_get_status` | `get_resolve_status` |
| `resolve_reconnect` | `get_resolve_status` |
| `resolve_get_lut` | `list_luts` |
| `resolve_export_lut` | `generate_lut` |

## run_script (scripting equivalent)

Project / page / timeline / clip / marker / render / media / fusion helpers:
`resolve_open_page`, `resolve_get_current_page`, `resolve_list_projects`,
`resolve_load_project`, `resolve_save_project`, `resolve_create_project`,
`resolve_get_project_settings`, `resolve_set_project_setting`,
`resolve_list_timelines`, `resolve_get_current_timeline`,
`resolve_set_current_timeline`, `resolve_get_playhead`, `resolve_set_playhead`,
`resolve_get_track_items`, `resolve_create_timeline`,
`resolve_duplicate_timeline`, `resolve_list_media`, `resolve_import_media`,
`resolve_create_bin`, `resolve_append_to_timeline` (partial),
`resolve_get_clip_properties`, `resolve_set_clip_transform`,
`resolve_get_clip_transform`, `resolve_set_clip_speed`,
`resolve_set_clip_enabled`, `resolve_create_compound_clip` (needs item list),
`resolve_delete_clip`, `resolve_replace_clip` (needs media item),
`resolve_apply_lut`, `resolve_create_color_version`,
`resolve_load_color_version`, `resolve_list_color_versions`,
`resolve_add_marker`, `resolve_add_marker_at_playhead`, `resolve_get_markers`,
`resolve_delete_markers`, `resolve_insert_title` (partial),
`resolve_modify_title_text` (partial), `resolve_list_render_presets`,
`resolve_quick_export` (needs path/preset), `resolve_add_render_job`,
`resolve_start_render`, `resolve_get_render_status`, `resolve_wait_for_render`,
`resolve_export_timeline` (needs path/preset), `resolve_get_fusion_comps`,
`resolve_add_fusion_comp`, `resolve_get_fusion_tools` (partial),
`resolve_find_media_clip`, `resolve_find_timeline_clip`,
`resolve_disable_background_tasks` (no-op note), `resolve_render_for_youtube`
(preset list only).

## Gaps (still sent as run_script, returns `{ gap: true }`)

No native tool and no reliable scripting API for guycochran AI / edit helpers:

`resolve_describe_frame`, `resolve_detect_in_frame`, `resolve_ask_about_frame`,
`resolve_find_shots_by_visual_description`, `resolve_transcribe_audio`,
`resolve_clear_transcription`, `resolve_classify_audio`,
`resolve_clear_audio_classification`, `resolve_analyze_intellisearch`,
`resolve_reset_intellisearch`, `resolve_analyze_slate`,
`resolve_remove_motion_blur`, `resolve_generate_speech`, `resolve_insert_broll`,
`resolve_build_rough_cut`, `resolve_create_chapter_markers`,
`resolve_create_captions`, `resolve_get_transcript`, `resolve_detect_silence`,
`resolve_tighten_silence`, `resolve_build_cut_variant`.

Use `run_script` / `search_scripting_api` for custom work in those areas.
