from PIL import Image
from pathlib import Path

src = Path(
    r"C:\Users\paule\.cursor\projects\c-Users-paule-Desktop-Projets-sirhCDL\assets"
    r"\c__Users_paule_AppData_Roaming_Cursor_User_workspaceStorage_bf8e27c8eb04158c3dd9553957752ac4_images_Couverture_pr1eug-536017cf-b89c-4d6a-967d-f3f9ef88db30.png"
)
out = Path(r"c:\Users\paule\Desktop\Projets\sirhCDL\public")

logo = Image.open(src).convert("RGBA")


def make_icon(size, pad_ratio=0.12):
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    pad = int(size * pad_ratio)
    target = size - 2 * pad
    lw, lh = logo.size
    scale = min(target / lw, target / lh)
    nw, nh = max(1, int(lw * scale)), max(1, int(lh * scale))
    resized = logo.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas.convert("RGB")


make_icon(192).save(out / "logo192.png", "PNG", optimize=True)
make_icon(512).save(out / "logo512.png", "PNG", optimize=True)
make_icon(180).save(out / "apple-touch-icon.png", "PNG", optimize=True)

base = Image.new("RGBA", logo.size, (255, 255, 255, 255))
base.paste(logo, (0, 0), logo)
base.convert("RGB").save(out / "logo-cdl.png", "PNG", optimize=True)

favicon_sizes = [16, 32, 48]
favicon_imgs = [make_icon(s, pad_ratio=0.08).convert("RGBA") for s in favicon_sizes]
favicon_imgs[-1].save(
    out / "favicon.ico",
    format="ICO",
    sizes=[(s, s) for s in favicon_sizes],
)
make_icon(32, pad_ratio=0.08).convert("RGB").save(out / "favicon-32.png", "PNG", optimize=True)

for name in ["favicon.ico", "favicon-32.png", "logo192.png", "logo512.png", "apple-touch-icon.png", "logo-cdl.png"]:
    p = out / name
    print(f"{name}: {p.stat().st_size} bytes")

print("done")
