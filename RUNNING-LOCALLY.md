# Running the site on your own computer

The site is plain HTML, CSS and JavaScript, with no build step and nothing to install for the page itself. You only need:

1. a copy of the repository, and
2. a small local web server. Opening `index.html` by double-clicking it mostly works, but browsers refuse to load the 3D models from a `file://` page.

Everything below works on Windows (PowerShell or Command Prompt), macOS and Linux.

---

## 1. Get the code

### Why `git fetch` said the repository doesn't exist

`git fetch` only works **inside a folder that is already a clone** of the repository. Run anywhere else, it fails. Clone first; after that, `git fetch` and `git pull` work inside the folder.

If `git clone` itself says *"Repository not found"*, the repository is private and Git isn't signed in to your GitHub account. On Windows, Git for Windows opens a browser sign-in window the first time you clone. If it doesn't, sign in through VS Code (option B) or GitHub Desktop.

### Option A – command line

Install [Git](https://git-scm.com/downloads) if you don't have it. Then, in PowerShell, Command Prompt or a terminal:

```bash
git clone --branch claude/compassionate-meitner-p4jpbh https://github.com/yousefdahouk/Emlak-AG-Front-page-Demo.git
```

```bash
cd Emlak-AG-Front-page-Demo
```

To get later updates:

```bash
git pull
```

### Option B – VS Code, no terminal

1. Install [VS Code](https://code.visualstudio.com/) and [Git](https://git-scm.com/downloads).
2. In VS Code: **Ctrl+Shift+P** → **Git: Clone** → **Clone from GitHub**. Sign in when asked, then pick `yousefdahouk/Emlak-AG-Front-page-Demo`.
3. Choose a folder and click **Open** when asked.
4. Switch to the right branch: click the branch name in the bottom-left corner of the window and choose `origin/claude/compassionate-meitner-p4jpbh`.

### Option C – ZIP download

On GitHub, switch the branch dropdown to `claude/compassionate-meitner-p4jpbh`, then **Code → Download ZIP** and unzip it. This is fine for a quick look, but you won't get updates with `git pull`.

---

## 2. Run it

Pick **one** of these. Each serves the folder at a local address.

### VS Code + Live Server (easiest)

1. In VS Code, open the Extensions panel (**Ctrl+Shift+X**) and install **Live Server** (by Ritwick Dey).
2. Open the project folder, right-click `index.html` → **Open with Live Server**. You can also click **Go Live** in the status bar.
3. The browser opens at something like `http://127.0.0.1:5500`. The page reloads by itself whenever you save a file.

### Python (already on most Macs; on Windows install it from python.org or the Microsoft Store)

In the project folder:

```bash
python -m http.server 8000
```

On Windows, if `python` isn't found, try:

```bash
py -m http.server 8000
```

Then open <http://localhost:8000>. Stop the server with **Ctrl+C**.

### Node.js (if you have it)

```bash
npx serve .
```

Then open the address it prints.

---

## 3. Debugging tips

* **Use Chrome or Edge.** They support CSS scroll-driven animations natively. Firefox gets a polyfill, so some fine timing differs.
* **Scroll animations:** DevTools (**F12**) → **⋮ → More tools → Animations** shows every scroll-linked animation. You can scrub through them while you scroll.
* **Where things live:**
  * `index.html` – all content. Each section is commented (`HERO`, `WORD BAND`, `PARALLAX CAROUSEL`, …).
  * `assets/css/styles.css` – all styling and **all scroll animations**, one commented block per section. Everything scroll-driven sits under `.sda` (see below).
  * `assets/js/main.js` – language switch, carousel buttons and dragging, 3D-model rotation, services-track parallax, calculator, mobile menu.
* **See the page without animations:** in DevTools, select the `<html>` element and remove the `sda` class. You can also turn on *Emulate CSS prefers-reduced-motion: reduce* in the **Rendering** tab.
* **Phone layout:** DevTools → toggle the device toolbar (**Ctrl+Shift+M**).
* **Language:** the faint `DE / EN` next to the logo. The choice is remembered in the browser (`localStorage` key `emlak-lang`); delete that key to reset.
* **3D models:** they're in `models/`. To swap one, drop in a new `.glb` and change the `src` of the matching `<model-viewer>` in `index.html`.
* **Hard refresh** after changes, if something looks stale: **Ctrl+F5** (or **Cmd+Shift+R** on a Mac).
