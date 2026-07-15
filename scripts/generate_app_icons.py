from PIL import Image
from pathlib import Path

# Logo SIRH / HR (version dégradé) — icône d'installation
src = Path(
    r"C:\Users\paule\.cursor\projects\c-Users-paule-Desktop-Projets-sirhCDL\assets"
    r"\c__Users_paule_AppData_Roaming_Cursor_User_workspaceStorage_bf8e27c8eb04158c3dd9553957752ac4_images_Design_sans_titre-2fe178f3-d615-4e82-877e-ad46a4d110df.png"
)
fallback = Path(r"c:\Users\paule\Desktop\Projets\sirhCDL\public\logo-cdl.png")
out = Path(r"c:\Users\paule\Desktop\Projets\sirhCDL\public")

logo_path = src if src.exists() else fallback
logo = Image.open(logo_path).convert("RGBA")
print(f"source: {logo_path.name} {logo.size}")


def make_icon(size, pad_ratio=0.08):
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
    return canvas


make_icon(192).convert("RGB").save(out / "logo192.png", "PNG", optimize=True)
make_icon(512).convert("RGB").save(out / "logo512.png", "PNG", optimize=True)
make_icon(180).convert("RGB").save(out / "apple-touch-icon.png", "PNG", optimize=True)
make_icon(32, pad_ratio=0.06).convert("RGB").save(out / "favicon-32.png", "PNG", optimize=True)

base = Image.new("RGBA", logo.size, (255, 255, 255, 255))
base.paste(logo, (0, 0), logo)
base.convert("RGB").save(out / "logo-cdl.png", "PNG", optimize=True)

favicon_sizes = [16, 32, 48]
favicon_imgs = [make_icon(s, pad_ratio=0.06) for s in favicon_sizes]
favicon_imgs[-1].save(
    out / "favicon.ico",
    format="ICO",
    sizes=[(s, s) for s in favicon_sizes],
)

for name in ["favicon.ico", "favicon-32.png", "logo192.png", "logo512.png", "apple-touch-icon.png", "logo-cdl.png"]:
    p = out / name
    print(f"{name}: {p.stat().st_size} bytes")

print("done")
