"""ComfortaaOkul v2
- a/A: TemelYazi gövde, n/H ile aynı boy+kalınlık
- ç/Ç/ş/Ş: Comfortaa c/C/s/S + ince cedilla (kalınlık = Comfortaa)
- ğ/Ğ: Comfortaa orijinal gbreve (kalınlık = e/g)
- g/ğ/y: TemelYazi (sola kuyruk), o/u boy+kalınlık
- Ğ: Comfortaa orijinal (üst breve; alt kuyruk yok)
"""
from __future__ import annotations

from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.misc.transform import Transform
from fontTools.varLib.instancer import instantiateVariableFont
from pathops import Path, PathVerb, LineCap, LineJoin

DONOR = "fonts/TemelYazi-Bold.otf"
BASE_VAR = "fonts/Comfortaa-Variable.ttf"
OUT_BOLD = "fonts/ComfortaaOkul-Bold.ttf"
OUT_REG = "fonts/ComfortaaOkul-Regular.ttf"


def glyph_bounds(font: TTFont, gname: str):
    pen = BoundsPen(font.getGlyphSet())
    font.getGlyphSet()[gname].draw(pen)
    return pen.bounds


def stem_width_at(font: TTFont, gname: str, y_frac: float = 0.42) -> float:
    rec = RecordingPen()
    font.getGlyphSet()[gname].draw(rec)
    b = glyph_bounds(font, gname)
    if not b:
        return 0
    y = b[1] + (b[3] - b[1]) * y_frac
    xs = []

    def add_seg(a, b_):
        (x0, y0), (x1, y1) = a, b_
        if (y0 <= y <= y1) or (y1 <= y <= y0):
            if abs(y1 - y0) < 1e-6:
                xs.extend([x0, x1])
            else:
                t = (y - y0) / (y1 - y0)
                xs.append(x0 + t * (x1 - x0))

    cur = start = None
    for op, args in rec.value:
        if op == "moveTo":
            cur = start = args[0]
        elif op == "lineTo":
            add_seg(cur, args[0])
            cur = args[0]
        elif op == "qCurveTo":
            pts = list(args)
            chain = [cur] + pts
            for i in range(len(chain) - 1):
                add_seg(chain[i], chain[i + 1])
            cur = pts[-1]
        elif op == "curveTo":
            c1, c2, p = args
            chain = [cur, c1, c2, p]
            for i in range(len(chain) - 1):
                add_seg(chain[i], chain[i + 1])
            cur = p
        elif op == "closePath" and cur and start:
            add_seg(cur, start)

    xs = sorted(set(round(x, 1) for x in xs))
    gaps = [xs[i + 1] - xs[i] for i in range(len(xs) - 1) if 8 < xs[i + 1] - xs[i] < (b[2] - b[0]) * 0.55]
    return min(gaps) if gaps else 0


def draw_glyph_to_pen(font: TTFont, gname: str, pen):
    font.getGlyphSet()[gname].draw(pen)


def copy_a_like(donor: TTFont, base: TTFont, ch: str, ref: str):
    """TemelYazi a/A → Comfortaa n/H boy+kalınlık."""
    cmap_d, cmap_b = donor.getBestCmap(), base.getBestCmap()
    dg, bg, rg = cmap_d[ord(ch)], cmap_b[ord(ch)], cmap_b[ord(ref)]
    db = glyph_bounds(donor, dg)
    rb = glyph_bounds(base, rg)
    target_h = max(rb[3], 1.0)
    src_h = max(db[3] - max(db[1], 0), 1.0) if db[1] < 0 else max(db[3] - db[1], 1.0)
    # a/A: use full above-baseline
    src_h = max(db[3] - (0.0 if db[1] < 0 else db[1]), 1.0)
    scale = target_h / src_h

    old_adv = int(base["hmtx"].metrics[bg][0])
    scaled_w = (db[2] - db[0]) * scale
    dx = (old_adv - scaled_w) / 2 - db[0] * scale

    ttpen = TTGlyphPen(None)
    cu = Cu2QuPen(ttpen, max_err=0.5, reverse_direction=False)
    tpen = TransformPen(cu, Transform(scale, 0, 0, scale, dx, 0))
    draw_glyph_to_pen(donor, dg, tpen)
    new_glyph = ttpen.glyph()
    base["glyf"][bg] = new_glyph
    base["hmtx"].metrics[bg] = (old_adv, int(round(dx + db[0] * scale)))

    our = stem_width_at(base, bg)
    ref_w = stem_width_at(base, rg)
    if our > ref_w * 1.02 and ref_w > 1:
        sx = ref_w / our
        bp = BoundsPen(None)
        new_glyph.draw(bp, None)
        cx = (bp.bounds[0] + bp.bounds[2]) / 2
        tt2 = TTGlyphPen(None)
        t2 = TransformPen(tt2, Transform(sx, 0, 0, 1, cx * (1 - sx), 0))
        new_glyph.draw(t2, None)
        new_glyph = tt2.glyph()
        base["glyf"][bg] = new_glyph

    bp = BoundsPen(None)
    new_glyph.draw(bp, None)
    lsb = int(round(bp.bounds[0])) if bp.bounds else 0
    base["hmtx"].metrics[bg] = (old_adv, lsb)
    print(f"  {ch}: h={bp.bounds[3]:.0f}/{target_h:.0f} stem={stem_width_at(base,bg):.0f}/{ref_w:.0f}")


def copy_from_temel(donor: TTFont, base: TTFont, ch: str, ref: str):
    """TemelYazi ch → Comfortaa ref ile aynı x-yükseklik + stem kalınlığı."""
    cmap_d, cmap_b = donor.getBestCmap(), base.getBestCmap()
    if ord(ch) not in cmap_d or ord(ch) not in cmap_b or ord(ref) not in cmap_b:
        print(f"  skip {ch}: missing glyph")
        return
    dg, bg, rg = cmap_d[ord(ch)], cmap_b[ord(ch)], cmap_b[ord(ref)]
    db = glyph_bounds(donor, dg)
    rb = glyph_bounds(base, rg)
    # x-yükseklik (ymax) ref ile aynı; kuyruk/breve oranla gelsin
    target_h = max(rb[3], 1.0)
    # ğ için gövde yüksekliği g ile aynı olsun diye donor g ymax kullan
    if ch == "ğ" and ord("g") in cmap_d:
        db_body = glyph_bounds(donor, cmap_d[ord("g")])
        src_h = max(db_body[3], 1.0)
    else:
        src_h = max(db[3], 1.0)
    scale = target_h / src_h

    old_adv = int(base["hmtx"].metrics[bg][0])
    scaled_w = (db[2] - db[0]) * scale
    dx = (old_adv - scaled_w) / 2 - db[0] * scale

    ttpen = TTGlyphPen(None)
    cu = Cu2QuPen(ttpen, max_err=0.5, reverse_direction=False)
    tpen = TransformPen(cu, Transform(scale, 0, 0, scale, dx, 0))
    draw_glyph_to_pen(donor, dg, tpen)
    new_glyph = ttpen.glyph()
    base["glyf"][bg] = new_glyph
    base["hmtx"].metrics[bg] = (old_adv, int(round(dx + db[0] * scale)))

    our = stem_width_at(base, bg, y_frac=0.55)
    ref_w = stem_width_at(base, rg, y_frac=0.55)
    if our > ref_w * 1.05 and ref_w > 1:
        sx = ref_w / our
        bp = BoundsPen(None)
        new_glyph.draw(bp, None)
        cx = (bp.bounds[0] + bp.bounds[2]) / 2
        tt2 = TTGlyphPen(None)
        t2 = TransformPen(tt2, Transform(sx, 0, 0, 1, cx * (1 - sx), 0))
        new_glyph.draw(t2, None)
        new_glyph = tt2.glyph()
        base["glyf"][bg] = new_glyph

    bp = BoundsPen(None)
    new_glyph.draw(bp, None)
    lsb = int(round(bp.bounds[0])) if bp.bounds else 0
    base["hmtx"].metrics[bg] = (old_adv, lsb)
    print(
        f"  {ch}: ymax={bp.bounds[3]:.0f} ymin={bp.bounds[1]:.0f} "
        f"stem={stem_width_at(base,bg):.0f}/{ref_w:.0f}"
    )


def copy_y_from_temel(donor: TTFont, base: TTFont):
    copy_from_temel(donor, base, "y", "u")


def thin_cedilla_path(cx: float, top_y: float, stroke: float, depth: float) -> Path:
    """Dikey cedilla — harften ayrı, kısa, belirgin."""
    w = max(stroke * 0.72, 18.0)
    hw = w / 2
    y0 = top_y
    y1 = top_y - depth
    path = Path()
    path.moveTo(cx - hw, y0)
    path.lineTo(cx + hw, y0)
    path.lineTo(cx + hw, y1 + hw * 0.85)
    path.cubicTo(cx + hw, y1, cx + hw * 0.3, y1 - hw * 0.1, cx, y1 - hw * 0.1)
    path.cubicTo(cx - hw * 0.3, y1 - hw * 0.1, cx - hw, y1, cx - hw, y1 + hw * 0.85)
    path.close()
    return path


def pathops_to_tt(path: Path):
    path.convertConicsToQuads(0.2)
    ttpen = TTGlyphPen(None)
    cu = Cu2QuPen(ttpen, max_err=0.55, reverse_direction=False)
    for verb, pts in path:
        if verb == PathVerb.MOVE:
            cu.moveTo(pts[0])
        elif verb == PathVerb.LINE:
            cu.lineTo(pts[0])
        elif verb == PathVerb.QUAD:
            cu.qCurveTo(pts[0], pts[1])
        elif verb == PathVerb.CUBIC:
            cu.curveTo(pts[0], pts[1], pts[2])
        elif verb == PathVerb.CLOSE:
            cu.closePath()
    return ttpen.glyph()


def recording_to_path(rec: RecordingPen) -> Path:
    path = Path()
    for op, args in rec.value:
        if op == "moveTo":
            path.moveTo(*args[0])
        elif op == "lineTo":
            path.lineTo(*args[0])
        elif op == "qCurveTo":
            pts = list(args)
            if len(pts) == 1:
                path.lineTo(*pts[0])
            elif len(pts) == 2:
                path.quadTo(pts[0][0], pts[0][1], pts[1][0], pts[1][1])
            else:
                for i, off in enumerate(pts[:-1]):
                    if i == len(pts) - 2:
                        on = pts[-1]
                        path.quadTo(off[0], off[1], on[0], on[1])
                    else:
                        nxt = pts[i + 1]
                        mid = ((off[0] + nxt[0]) / 2, (off[1] + nxt[1]) / 2)
                        path.quadTo(off[0], off[1], mid[0], mid[1])
        elif op == "curveTo":
            c1, c2, p = args
            path.cubicTo(c1[0], c1[1], c2[0], c2[1], p[0], p[1])
        elif op == "closePath":
            path.close()
    return path


def make_cedilla_letter(base: TTFont, ch: str, base_ch: str):
    """Comfortaa base_ch + cedilla → ch. Çizgi ş standardında (s stem) — ç de aynı kalınlık."""
    cmap = base.getBestCmap()
    src = cmap[ord(base_ch)]
    dst = cmap[ord(ch)]
    adv, _lsb = base["hmtx"].metrics[src]

    # Copy Comfortaa letter body exactly
    rec = RecordingPen()
    draw_glyph_to_pen(base, src, rec)
    body = recording_to_path(rec)
    bb = glyph_bounds(base, src)

    # Ş'nin eski (iyi) çizgi ölçüsü — s harfinin stem'i; ç de bunu kullansın
    ref_stem = stem_width_at(base, cmap[ord("s")]) or 145

    cx = (bb[0] + bb[2]) / 2
    gap = max(abs(ref_stem) * 0.22, 18.0)
    top = (bb[1] if bb[1] < -2 else 0.0) - gap
    depth = max(abs(ref_stem) * 0.85, 72)
    ced = thin_cedilla_path(cx, top, ref_stem, depth)

    body.addPath(ced)
    body.convertConicsToQuads(0.2)
    try:
        body.simplify(fix_winding=True)
        body.convertConicsToQuads(0.2)
    except Exception:
        pass

    new_glyph = pathops_to_tt(body)
    base["glyf"][dst] = new_glyph
    bp = BoundsPen(None)
    new_glyph.draw(bp, None)
    lsb = int(round(bp.bounds[0])) if bp.bounds else 0
    base["hmtx"].metrics[dst] = (adv, lsb)
    print(f"  {ch}: from {base_ch} + cedilla(ref_stem={ref_stem:.0f}), ymax={bb[3]:.0f}")


def rename_family(font: TTFont, family: str, style: str):
    name = font["name"]
    name.names = [
        n
        for n in name.names
        if not (n.nameID in (1, 2, 3, 4, 6, 16, 17) and n.langID in (0x409, 0x0))
    ]

    def add(nid, string):
        name.setName(string, nid, 3, 1, 0x409)
        name.setName(string, nid, 1, 0, 0)

    full = f"{family} {style}" if style != "Regular" else family
    ps = (family + style).replace(" ", "")
    for nid, s in ((1, family), (2, style), (4, full), (6, ps), (16, family), (17, style), (3, f"Duellox:{full}:2026")):
        add(nid, s)


def build(weight: int, out_path: str, style: str):
    print("==", style)
    base_var = TTFont(BASE_VAR)
    base = instantiateVariableFont(base_var, {"wght": weight}, inplace=False)
    base_var.close()
    donor = TTFont(DONOR)

    # 1) a / A only from TemelYazi
    copy_a_like(donor, base, "a", "n")
    copy_a_like(donor, base, "A", "H")

    # 2) ç ş from Comfortaa c/s + thin cedilla (same weight as neighbors)
    make_cedilla_letter(base, "ç", "c")
    make_cedilla_letter(base, "Ç", "C")
    make_cedilla_letter(base, "ş", "s")
    make_cedilla_letter(base, "Ş", "S")

    # 3) küçük g / ğ: TemelYazi (y ile aynı tip sola kuyruk), o boy/kalınlık
    copy_from_temel(donor, base, "g", "o")
    copy_from_temel(donor, base, "ğ", "o")

    # 4) küçük y: TemelYazi (yazılış y — kâse + sola kuyruk), Comfortaa u boy/kalınlık
    copy_y_from_temel(donor, base)

    rename_family(base, "ComfortaaOkul", style)
    for tag in ("fvar", "gvar", "avar", "HVAR", "MVAR", "STAT", "cvar"):
        if tag in base:
            del base[tag]

    base.save(out_path)
    donor.close()
    base.close()
    print("wrote", out_path)


if __name__ == "__main__":
    build(700, OUT_BOLD, "Bold")
    build(400, OUT_REG, "Regular")

    f = TTFont(OUT_BOLD)
    cmap = f.getBestCmap()
    print("-- verify --")
    for ch in "a n o c ç s ş e g ğ y u Y":
        ch = ch.strip()
        if not ch or ord(ch) not in cmap:
            continue
        g = cmap[ord(ch)]
        b = glyph_bounds(f, g)
        print(f"{ch}: ymax={b[3]:.0f} ymin={b[1]:.0f} stem={stem_width_at(f,g):.0f}")
    f.close()
