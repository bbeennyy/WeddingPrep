# Wedding Prep

A private wedding planner you and your future wife can both use from your phones. It lives in this GitHub repo and can be opened as a website.

It covers:

- A **checklist** of what still needs doing
- **Organize**: vendors, budget, and notes
- A **guest list** with attending / pending / declined
- **Table formations** so you can seat people who are coming
- A **church program** you write yourselves, with tags for songs (and lyrics), the Word, procession, Presbyterian-style points, vows, rings, and the rest of the service

There is no database and no login. The app saves in the browser. You can also export a JSON file, or optionally sync that file into this repository so you both share one copy.

## How to open it together

After this is on GitHub and Pages is turned on, the site is:

**https://bbeennyy.github.io/WeddingPrep/**

Turn on Pages once:

1. Repo **Settings → Pages**
2. Source: **GitHub Actions**
3. Merge to `main` (or run the **Deploy GitHub Pages** workflow)

Until Pages is on, run it on a computer:

```bash
npm install
npm run dev
```

Then open the local URL Vite prints.

## Sharing your real data (not just the app)

The website is only the planner. Guest names and your notes stay in **this browser** unless you sync them.

**Live sync (recommended):** In Settings, paste a [fine-grained personal access token](https://github.com/settings/personal-access-tokens) with **Contents: Read and write** on **only this repo**, on each phone/computer, then wait a moment. You do not have to mash Save. Edits then update `data/wedding.json` on GitHub, and the other device loads that file when you open or return to the site. If two devices save at once, the app retries with the latest file SHA.

Other options:

1. **JSON file.** Settings → Download JSON, send it, then Import JSON on the other device.
2. If the repo is **public**, anyone can read `data/wedding.json`. Prefer a private repo when you can, or accept that guest lists in GitHub are visible.

## Church program

Open **Program**.

- **Edit** — reorder the service, change wording, paste hymn lyrics, add readers and walking order
- **Bulletin** — see it as a printable order of service
- **Print** — from the browser, for rehearsal or the congregation

Starter tags (you can add, rename, or delete any of them):

| Tag | What it is for |
| --- | --- |
| Prelude / Song / Hymn | Music, with lyrics in the program |
| Procession / Recession | Who walks, and to which music |
| Call to Worship | Opening in God’s name |
| Statement of Purpose | Why the church gathers for marriage |
| Word / Scripture | Reference plus the reading |
| Homily | Short meditation |
| Declaration of Intent, Affirmation, Vows, Rings | The covenant itself |
| Lord’s Prayer, Benediction | Spoken with the congregation |
| Custom | Anything else in *your* service |

The starter flow follows a common Presbyterian / Reformed marriage service. Replace every word with yours.

## Privacy

Guest lists, addresses, and budget numbers are personal. Prefer a **private** repository. GitHub Pages on a private repo needs GitHub Pro. On the free plan, keep the **code** public if you want the website, and keep **wedding data** in the browser or a private JSON file.

The site has a soft PIN gate (same PIN on both phones) so casual visitors see a lock screen first. That is not real security — anyone who can read the page source can bypass it. Strangers still cannot change your shared GitHub copy without your personal access token.

## Stack

Vite, React, TypeScript, Tailwind. Static files only, so GitHub Pages can host it.
