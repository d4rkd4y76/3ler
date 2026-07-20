from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.varLib.instancer import instantiateVariableFont

def info(path):
    f = TTFont(path)
    print("===", path)
    print("upem", f["head"].unitsPerEm)
    print("has glyf", "glyf" in f, "has CFF", "CFF " in f or "CFF2" in f)
    cmap = f.getBestCmap() or {}
    for ch in "aAçÇşŞğĞ":
        print(f"  {ch!r} -> {cmap.get(ord(ch))}")
    f.close()

info("fonts/Comfortaa-Variable.ttf")
info("fonts/TemelYazi-Bold.otf")

f = TTFont("fonts/Comfortaa-Variable.ttf")
fb = instantiateVariableFont(f, {"wght": 700}, inplace=False)
gname = fb.getBestCmap()[ord("a")]
pen = RecordingPen()
fb.getGlyphSet()[gname].draw(pen)
print("Comfortaa a cmds", len(pen.value))
for cmd in pen.value[:12]:
    print(cmd)
fb.close()
f.close()

d = TTFont("fonts/TemelYazi-Bold.otf")
gname = d.getBestCmap()[ord("a")]
pen = RecordingPen()
d.getGlyphSet()[gname].draw(pen)
print("TemelYazi a cmds", len(pen.value))
for cmd in pen.value[:12]:
    print(cmd)
d.close()
