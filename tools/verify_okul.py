from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen

def check(path, label):
    f = TTFont(path)
    cmap = f.getBestCmap()
    print("==", label)
    for ch in "açşğ":
        g = cmap[ord(ch)]
        bp = BoundsPen(f.getGlyphSet())
        f.getGlyphSet()[g].draw(bp)
        print(f"  {ch}: bounds={tuple(round(x,1) for x in bp.bounds)} adv={f['hmtx'].metrics[g][0]}")
    # a should have stem: recording includes lineTo vertical
    pen = RecordingPen()
    f.getGlyphSet()[cmap[ord("a")]].draw(pen)
    lines = [c for c in pen.value if c[0] == "lineTo"]
    print("  a lineTo count", len(lines), lines[:3])
    f.close()

check("fonts/ComfortaaOkul-Bold.ttf", "Okul Bold")
check("fonts/TemelYazi-Bold.otf", "TemelYazi donor")
