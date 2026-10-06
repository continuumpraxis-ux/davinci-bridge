/** Python snippets for native `run_script`. Values are JSON-literal embedded. */

function lit(value: unknown): string {
  return JSON.stringify(value);
}

const PREAMBLE = `import json
def _out(obj):
    print(json.dumps(obj, default=str))
def _err(msg, **extra):
    payload = {"ok": False, "error": str(msg)}
    payload.update(extra)
    _out(payload)
def _pm():
    return resolve.GetProjectManager()
def _proj():
    pm = _pm()
    return pm.GetCurrentProject() if pm else None
def _tl():
    proj = _proj()
    return proj.GetCurrentTimeline() if proj else None
def _clip(track_type, track_index, clip_index):
    tl = _tl()
    if tl is None:
        return None, None
    items = tl.GetItemListInTrack(track_type, int(track_index)) or []
    idx = int(clip_index) - 1
    if idx < 0 or idx >= len(items):
        return tl, None
    return tl, items[idx]
`;

function wrap(body: string): string {
  return `${PREAMBLE}\ntry:\n${body
    .split("\n")
    .map((line) => "    " + line)
    .join("\n")}\nexcept Exception as e:\n    _err(type(e).__name__ + ": " + str(e))\n`;
}

export function gapScript(legacyTool: string, reason: string): string {
  return wrap(
    `_out({"ok": False, "gap": True, "legacy_tool": ${lit(legacyTool)}, "native": "run_script", "reason": ${lit(reason)}})`,
  );
}

export function scriptForLegacy(tool: string, args: Record<string, unknown>): string | null {
  switch (tool) {
    case "resolve_open_page":
      return wrap(`ok = resolve.OpenPage(${lit(String(args.page ?? args.name ?? "edit"))})\n_out({"ok": bool(ok), "page": ${lit(String(args.page ?? args.name ?? "edit"))}})`);
    case "resolve_get_current_page":
      return wrap(`_out({"ok": True, "page": resolve.GetCurrentPage()})`);
    case "resolve_list_projects":
      return wrap(`pm = _pm()\nfolder = pm.GetCurrentFolder() if hasattr(pm, "GetCurrentFolder") else None\nnames = pm.GetProjectListInCurrentFolder() if hasattr(pm, "GetProjectListInCurrentFolder") else []\n_out({"ok": True, "projects": list(names or [])})`);
    case "resolve_load_project":
      return wrap(`pm = _pm()\nok = pm.LoadProject(${lit(String(args.name ?? args.projectName ?? ""))})\n_out({"ok": bool(ok), "name": ${lit(String(args.name ?? args.projectName ?? ""))}})`);
    case "resolve_save_project":
      return wrap(`proj = _proj()\n_out({"ok": bool(proj.SaveProject()) if proj else False})`);
    case "resolve_create_project":
      return wrap(`pm = _pm()\nok = pm.CreateProject(${lit(String(args.name ?? args.projectName ?? ""))})\n_out({"ok": bool(ok), "name": ${lit(String(args.name ?? args.projectName ?? ""))}})`);
    case "resolve_get_project_settings":
      return wrap(`proj = _proj()\nkeys = ${lit(args.keys ?? null)}\nif proj is None:\n    _err("no project"); raise SystemExit\nsettings = {}\nif keys:\n    for k in keys:\n        settings[k] = proj.GetSetting(k)\nelse:\n    settings["timelineFrameRate"] = proj.GetSetting("timelineFrameRate")\n    settings["timelineResolutionWidth"] = proj.GetSetting("timelineResolutionWidth")\n    settings["timelineResolutionHeight"] = proj.GetSetting("timelineResolutionHeight")\n_out({"ok": True, "settings": settings})`);
    case "resolve_set_project_setting":
      return wrap(`proj = _proj()\nok = proj.SetSetting(${lit(String(args.key ?? args.name ?? ""))}, str(${lit(args.value ?? "")})) if proj else False\n_out({"ok": bool(ok)})`);
    case "resolve_list_timelines":
      return wrap(`proj = _proj()\nif proj is None:\n    _err("no project"); raise SystemExit\nn = int(proj.GetTimelineCount() or 0)\nnames = []\nfor i in range(1, n + 1):\n    tl = proj.GetTimelineByIndex(i)\n    names.append(tl.GetName() if tl else None)\ncur = _tl()\n_out({"ok": True, "timelines": names, "current": cur.GetName() if cur else None})`);
    case "resolve_get_current_timeline":
      return wrap(`tl = _tl()\nif tl is None:\n    _err("no timeline"); raise SystemExit\n_out({"ok": True, "name": tl.GetName(), "start": tl.GetStartFrame(), "end": tl.GetEndFrame(), "fps": tl.GetSetting("timelineFrameRate") if hasattr(tl, "GetSetting") else None})`);
    case "resolve_set_current_timeline":
      return wrap(`proj = _proj()\nname = ${lit(String(args.name ?? ""))}\nn = int(proj.GetTimelineCount() or 0)\nfound = None\nfor i in range(1, n + 1):\n    tl = proj.GetTimelineByIndex(i)\n    if tl and tl.GetName() == name:\n        found = tl\n        break\nif found is None:\n    _err("timeline not found", name=name); raise SystemExit\n_out({"ok": bool(proj.SetCurrentTimeline(found)), "name": name})`);
    case "resolve_get_playhead":
      return wrap(`tl = _tl()\n_out({"ok": True, "timecode": tl.GetCurrentTimecode() if tl else None})`);
    case "resolve_set_playhead":
      return wrap(`tl = _tl()\nif tl is None:\n    _err("no timeline"); raise SystemExit\ntc = ${lit(args.timecode ?? null)}\nframe = ${lit(args.frame ?? null)}\nok = False\nif tc:\n    ok = tl.SetCurrentTimecode(str(tc))\nelif frame is not None:\n    ok = tl.SetCurrentTimecode(str(frame))\n_out({"ok": bool(ok), "timecode": tl.GetCurrentTimecode()})`);
    case "resolve_get_track_items":
      return wrap(`tl = _tl()\ntrack_type = ${lit(String(args.trackType ?? args.track_type ?? "video"))}\ntrack_index = int(${lit(args.trackIndex ?? args.track_index ?? 1)})\nitems = tl.GetItemListInTrack(track_type, track_index) if tl else []\nout = []\nfor i, item in enumerate(items or [], start=1):\n    out.append({"clipIndex": i, "name": item.GetName(), "start": item.GetStart(), "end": item.GetEnd()})\n_out({"ok": True, "items": out})`);
    case "resolve_create_timeline":
      return wrap(`proj = _proj()\ntl = proj.CreateEmptyTimeline(${lit(String(args.name ?? "Timeline"))}) if proj else None\n_out({"ok": tl is not None, "name": tl.GetName() if tl else None})`);
    case "resolve_duplicate_timeline":
      return wrap(`tl = _tl()\nname = ${lit(String(args.name ?? args.newName ?? "Duplicate"))}\nnew_tl = tl.DuplicateTimeline(name) if tl else None\n_out({"ok": new_tl is not None, "name": new_tl.GetName() if new_tl else None})`);
    case "resolve_list_media":
      return wrap(`proj = _proj()\npool = proj.GetMediaPool() if proj else None\nroot = pool.GetRootFolder() if pool else None\nclips = root.GetClipList() if root else []\n_out({"ok": True, "clips": [c.GetName() for c in (clips or [])]})`);
    case "resolve_import_media":
      return wrap(`proj = _proj()\npool = proj.GetMediaPool() if proj else None\npaths = ${lit(args.paths ?? args.files ?? args.path ?? [])}\nif isinstance(paths, str):\n    paths = [paths]\nimported = pool.ImportMedia(list(paths)) if pool else None\n_out({"ok": imported is not None, "count": len(imported or [])})`);
    case "resolve_create_bin":
      return wrap(`proj = _proj()\npool = proj.GetMediaPool() if proj else None\nfolder = pool.AddSubFolder(pool.GetRootFolder(), ${lit(String(args.name ?? "Bin"))}) if pool else None\n_out({"ok": folder is not None, "name": ${lit(String(args.name ?? "Bin"))}})`);
    case "resolve_append_to_timeline":
      return wrap(`proj = _proj()\npool = proj.GetMediaPool() if proj else None\n_out({"ok": False, "error": "pass mediaPoolItem via Resolve UI or import+append in a custom run_script", "hint": "use callTool run_script with MediaPool.AppendToTimeline"})`);
    case "resolve_get_clip_properties":
    case "resolve_get_clip_transform":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\nif clip is None:\n    _err("clip not found"); raise SystemExit\nprops = {}\nfor key in ("Pan", "Tilt", "ZoomX", "ZoomY", "Opacity", "Pitch", "Yaw", "AnchorPointX", "AnchorPointY"):\n    try:\n        props[key] = clip.GetProperty(key)\n    except Exception:\n        pass\n_out({"ok": True, "name": clip.GetName(), "properties": props})`);
    case "resolve_set_clip_transform":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\nif clip is None:\n    _err("clip not found"); raise SystemExit\nupdates = {}\nzoom = ${lit(args.zoom ?? null)}\npan_x = ${lit(args.panX ?? args.pan ?? null)}\npan_y = ${lit(args.panY ?? args.tilt ?? null)}\nopacity = ${lit(args.opacity ?? null)}\nif zoom is not None:\n    clip.SetProperty("ZoomX", float(zoom)); clip.SetProperty("ZoomY", float(zoom)); updates["ZoomX"]=zoom; updates["ZoomY"]=zoom\nif pan_x is not None:\n    clip.SetProperty("Pan", float(pan_x)); updates["Pan"]=pan_x\nif pan_y is not None:\n    clip.SetProperty("Tilt", float(pan_y)); updates["Tilt"]=pan_y\nif opacity is not None:\n    clip.SetProperty("Opacity", float(opacity)); updates["Opacity"]=opacity\n_out({"ok": True, "updated": updates})`);
    case "resolve_set_clip_speed":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\nok = clip.SetClipProperty("SpeedPercent", str(${lit(args.speed ?? args.speedPercent ?? 100)})) if clip else False\n_out({"ok": bool(ok)})`);
    case "resolve_set_clip_enabled":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\nok = clip.SetClipEnabled(bool(${lit(args.enabled ?? true)})) if clip else False\n_out({"ok": bool(ok)})`);
    case "resolve_create_compound_clip":
      return wrap(`tl = _tl()\n_out({"ok": False, "error": "compound clip needs explicit item list; call run_script with Timeline.CreateCompoundClip"})`);
    case "resolve_delete_clip":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\nok = tl.DeleteClips([clip], False) if tl and clip else False\n_out({"ok": bool(ok)})`);
    case "resolve_replace_clip":
      return wrap(`_out({"ok": False, "error": "replace clip needs a media pool item; use custom run_script"})`);
    case "resolve_apply_lut":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\npath = ${lit(String(args.path ?? args.lut ?? ""))}\nok = False\nif clip and path and hasattr(clip, "SetLUT"):\n    ok = clip.SetLUT(1, path)\n_out({"ok": bool(ok), "path": path})`);
    case "resolve_create_color_version":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\nok = clip.AddVersion(${lit(String(args.name ?? "Version"))}, 0) if clip else False\n_out({"ok": bool(ok)})`);
    case "resolve_load_color_version":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\nok = clip.LoadVersionByName(${lit(String(args.name ?? ""))}, 0) if clip else False\n_out({"ok": bool(ok)})`);
    case "resolve_list_color_versions":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\nvers = clip.GetVersionNameList(0) if clip else []\n_out({"ok": True, "versions": list(vers or [])})`);
    case "resolve_add_marker":
    case "resolve_add_marker_at_playhead":
      return wrap(`tl = _tl()\nframe = ${lit(args.frame ?? null)}\nnote = ${lit(String(args.note ?? args.name ?? ""))}\ncolor = ${lit(String(args.color ?? "Blue"))}\nif tl is None:\n    _err("no timeline"); raise SystemExit\nif frame is None:\n    tc = tl.GetCurrentTimecode()\n    ok = tl.AddMarker(tl.GetStartFrame(), color, note, note, 1)\nelse:\n    ok = tl.AddMarker(int(frame), color, note, note, 1)\n_out({"ok": bool(ok)})`);
    case "resolve_get_markers":
      return wrap(`tl = _tl()\n_out({"ok": True, "markers": tl.GetMarkers() if tl else {}})`);
    case "resolve_delete_markers":
      return wrap(`tl = _tl()\ncolor = ${lit(args.color ?? null)}\nok = tl.DeleteMarkersByColor(str(color)) if tl and color else (tl.DeleteMarkerAtFrame(int(${lit(args.frame ?? 0)})) if tl else False)\n_out({"ok": bool(ok)})`);
    case "resolve_insert_title":
      return wrap(`_out({"ok": False, "error": "title generator clip needs Fusion/title template; use custom run_script"})`);
    case "resolve_modify_title_text":
      return wrap(`_out({"ok": False, "error": "title text is Fusion-tool specific; use custom run_script"})`);
    case "resolve_list_render_presets":
      return wrap(`proj = _proj()\n_out({"ok": True, "presets": list(proj.GetRenderPresetList() or []) if proj else []})`);
    case "resolve_add_render_job":
      return wrap(`proj = _proj()\njob = proj.AddRenderJob() if proj else None\n_out({"ok": job is not None, "jobId": job})`);
    case "resolve_start_render":
      return wrap(`proj = _proj()\n_out({"ok": bool(proj.StartRendering()) if proj else False})`);
    case "resolve_get_render_status":
    case "resolve_wait_for_render":
      return wrap(`proj = _proj()\n_out({"ok": True, "rendering": proj.IsRenderingInProgress() if proj else False, "jobs": proj.GetRenderJobList() if proj else []})`);
    case "resolve_export_timeline":
    case "resolve_quick_export":
      return wrap(`proj = _proj()\n_out({"ok": False, "error": "export needs target path + preset; use AddRenderJob + StartRendering via run_script", "presets": list(proj.GetRenderPresetList() or []) if proj else []})`);
    case "resolve_get_fusion_comps":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\ncount = clip.GetFusionCompCount() if clip else 0\n_out({"ok": True, "count": count})`);
    case "resolve_add_fusion_comp":
      return wrap(`tl, clip = _clip(${lit(String(args.trackType ?? "video"))}, ${lit(args.trackIndex ?? 1)}, ${lit(args.clipIndex ?? 1)})\ncomp = clip.AddFusionComp() if clip else None\n_out({"ok": comp is not None})`);
    case "resolve_get_fusion_tools":
      return wrap(`_out({"ok": False, "error": "inspect Fusion tools via Fusion() in run_script / lua"})`);
    case "resolve_find_media_clip":
      return wrap(`proj = _proj()\npool = proj.GetMediaPool() if proj else None\nroot = pool.GetRootFolder() if pool else None\nwant = ${lit(String(args.name ?? args.query ?? ""))}.lower()\nhits = []\nfor c in (root.GetClipList() or []) if root else []:\n    if want in (c.GetName() or "").lower():\n        hits.append(c.GetName())\n_out({"ok": True, "hits": hits})`);
    case "resolve_find_timeline_clip":
      return wrap(`tl = _tl()\nwant = ${lit(String(args.name ?? args.query ?? ""))}.lower()\nhits = []\nif tl:\n    tracks = int(tl.GetTrackCount("video") or 0)\n    for t in range(1, tracks + 1):\n        for i, item in enumerate(tl.GetItemListInTrack("video", t) or [], start=1):\n            if want in (item.GetName() or "").lower():\n                hits.append({"trackIndex": t, "clipIndex": i, "name": item.GetName()})\n_out({"ok": True, "hits": hits})`);
    case "resolve_disable_background_tasks":
      return wrap(`_out({"ok": True, "note": "no scripting kill-switch; leave Resolve UI background tasks as-is"})`);
    case "resolve_render_for_youtube":
      return wrap(`proj = _proj()\npresets = list(proj.GetRenderPresetList() or []) if proj else []\n_out({"ok": False, "error": "pick a YouTube preset then AddRenderJob", "presets": presets})`);
    default:
      return null;
  }
}
