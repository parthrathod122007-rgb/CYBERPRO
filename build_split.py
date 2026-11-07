"""One-off migration: splits original-source/website-original.html (landing + fake login + embedded LMS)
into public/index.html (landing + login) and private/lms.html (LMS, served only to authenticated sessions).
Kept in the repo so the transformation is auditable. Not needed at runtime."""
import re, pathlib
R = pathlib.Path(__file__).parent
src = (R/"original-source/website-original.html").read_text(encoding="utf8")

head_end = src.index("</head>")
head = src[:head_end]
body_open = src[head_end:src.index("<body"):]            # "</head>\n"
body_tag = re.search(r"<body[^>]*>", src).group(0)
i_splash = src.index('<div id="m-splash"')
i_land   = src.index('<div id="landing-page"')
i_login  = src.index('<div id="login-view"')
i_lms    = src.index('<div id="lms-app"')
scripts  = [m for m in re.finditer(r"<script[^>]*>.*?</script>", src[i_lms:], re.S)]
# the last two <script> blocks are the app JS and the motion layer
app_js_m, motion_m = scripts[-2], scripts[-1]
a0 = i_lms + app_js_m.start(); a1 = i_lms + app_js_m.end()
m0 = i_lms + motion_m.start(); m1 = i_lms + motion_m.end()
splash_html = src[i_splash:i_land]
landing_html = src[i_land:i_login]
login_html = src[i_login:i_lms]
lms_html = src[i_lms:a0]
app_js = src[a0:a1]
motion_js = src[m0:m1]

# ---- official logo instead of the shield icon --------------------------------------------
shield = re.compile(r'<svg[^>]*>\s*<path[^>]*d="M9 12l2 2 4-4m5\.618[^"]*"[^>]*>(?:</path>)?\s*</svg>', re.S)
def logo(match_cls): return '<img src="/assets/logo-mark.png" alt="CyberPro" class="%s" style="object-fit:contain;border-radius:inherit">' % match_cls
def swap_logo(html): return shield.sub(logo("w-full h-full"), html)
splash_html, landing_html, login_html, lms_html = map(swap_logo, (splash_html, landing_html, login_html, lms_html))
# logo boxes: drop the solid green fill / icon colour so the real logo shows
for h in ("landing_html", "login_html", "lms_html"):
    pass
landing_html = landing_html.replace('w-8 h-8 rounded-lg bg-parth-accent flex items-center justify-center shadow-[0_0_12px_rgba(57,255,20,0.6)]',
                                    'w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shadow-[0_0_12px_rgba(57,255,20,0.6)]')


# ---- login form: no pre-filled demo identity, no fake "Cloudflare verified" widget ----------
login_html = re.sub(r'\s*value="parthrathod122007@gmail\.com"\s*readonly', '', login_html)
login_html = re.sub(r'\s*value="•+"\s*readonly', '', login_html)
login_html = re.sub(r'\s*<!-- Fake Cloudflare Turnstile -->.*?(?=\s*<button type="submit")', '', login_html, flags=re.S)

# ---- app JS: remove the fake client-side login block, boot into the dashboard -------------
s = app_js.index("// --- Login Logic ---"); e = app_js.index("// Get navigation buttons")
app_js = app_js[:s] + app_js[e:]
tail = "        });\n    </script>"
assert app_js.rstrip().endswith(tail.strip()) or tail in app_js
app_js = app_js[:app_js.rindex("        });\n    </script>")] + "            window.__lmsBoot = () => switchView('dashboard');\n" + "        });\n    </script>"

# ---- motion layer: page-aware boot + real logout ------------------------------------------
init_old = motion_js[motion_js.index("  function init() {"):motion_js.index("  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)")]
init_new = """  function init() {
    var page = document.body.getAttribute('data-page') || 'site';
    landing = $('#landing-page');
    safe(splash);
    if (page === 'site') safe(function () { if (landing) { landingReveals(); landingNav(); landingFX(); } });
    safe(globalFX);
    if (page === 'site') safe(loginUI);
    if (page === 'lms') safe(lmsUI);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeAll(); if (window.__closeLogin) window.__closeLogin();
    });
    if (!revealStarted && !$('#m-splash')) startReveal();
  }
"""
motion_js = motion_js.replace(init_old, init_new)
dl_s = motion_js.index("  function doLogout() {"); dl_e = motion_js.index("  function closeDrawer()")
motion_js = motion_js[:dl_s] + """  function doLogout() {
    closeAll();
    toast('Signing out…');
    var done = function () { location.replace('/?signedout=1'); };
    try {
      fetch('/api/logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(done, done);
    } catch (e) { done(); }
  }
""" + motion_js[dl_e:]
# the loading animation must not wipe the password field (breaks quick retries / password managers)
assert "btn.innerHTML = html; pass.value = ''; pass.type = 'password'; if (eye) eye.innerHTML = ICON.eye;" in motion_js
motion_js = motion_js.replace("btn.innerHTML = html; pass.value = ''; pass.type = 'password'; if (eye) eye.innerHTML = ICON.eye;", "btn.innerHTML = html;")
# drop client-side-only email/password gate: the server is the authority now
motion_js = motion_js.replace("var AUTH = { minPassword: 6, accounts: [ /* { email: 'you@example.com', password: 'your-password' } */ ] };",
                              "var AUTH = { minPassword: 1, accounts: [] };  // validation of credentials happens on the server (/api/login)")
motion_js = re.sub(r"^<script id=\"motion-layer-js\">", "", motion_js).rsplit("</script>", 1)[0]
motion_js = motion_js.replace('<script id="motion-layer-js">', "")
(R/"public/assets/motion.js").write_text(motion_js.strip()+"\n", encoding="utf8")

font_css = head  # shared <head> (tailwind config + all CSS), titles patched per page
def page_head(title):
    h = re.sub(r"<title>.*?</title>", "<title>%s</title>" % title, font_css)
    return h + '    <link rel="icon" type="image/png" href="/assets/favicon.png">\n'

site = (page_head("CyberPro – Cybersecurity Learning Platform") + body_open +
        body_tag.replace("<body ", '<body data-page="site" ') + "\n    " + splash_html + landing_html + login_html +
        '\n    <script src="/assets/motion.js"></script>\n    <script src="/assets/site-auth.js"></script>\n</body>\n</html>\n')
lms = (page_head("CyberPro LMS") + body_open +
       body_tag.replace("<body ", '<body data-page="lms" ') + "\n    " + lms_html + app_js +
       '\n    <script src="/assets/motion.js"></script>\n    <script src="/assets/lms-session.js"></script>\n</body>\n</html>\n')
(R/"public/index.html").write_text(site, encoding="utf8")
(R/"private/lms.html").write_text(lms, encoding="utf8")
print("site bytes", len(site), "lms bytes", len(lms), "motion bytes", len(motion_js))
