# PRF Portal — payment request tracker

This is a tracker, not an accounting system. It shows which invoice is where, who it is waiting on, how long each person took, and how much of each budget code is used. It runs as a Google Apps Script web app. The data lives in a Google Sheet, and every request gets its own Drive folder under **PRF Portal**.

## Who does what

| Login | Person | Role | Acts on |
|---|---|---|---|
| `minhas` | Mr. Minhas | Accounts Executive | To Collect, Returned, Pending Bank Initiation, Pending with Bank, Paid – Update NoBroker |
| `ihtisham` | Muhammad Ihtisham | Reviewer | Pending Review |
| `shabir`, `osama` | Shabir, Osama | Manager (either one can approve) | Pending Manager Approval, Pending Bank Approval; also uploads budgets, cancels requests |

## Workflow

```
To Collect ─► Pending Review ─► Pending Manager Approval ─► Pending Bank Initiation ─► Pending Bank Approval ─► Pending with Bank ─► Paid – Update NoBroker ─► Closed
   ▲  (schedule or      │ reject            │ reject                                       │ reject (back to Bank Initiation)
   │   + New request)   ▼                   ▼
   └──────────────── Returned (remark shown) ── resubmit goes back to whoever rejected it
```

* **Submitting** needs: project, vendor, budget code, invoice no., frequency, invoice month, amount, the invoice-pack PDF, and all 6 checks ticked:
  1. NoBroker voucher attached
  2. Invoice signed and stamped by both parties
  3. Service report signed and stamped by both parties
  4. Trade licence active on the portal
  5. Contract on the portal
  6. IBAN on the invoice matches the bank IBAN letter
* **Duplicates are blocked.** The same vendor and invoice number can't be entered twice.
* **Budget.** Each request shows the total budget, what is used so far, the balance now, and the balance after this invoice. An invoice over the balance can still be submitted, but only with a written reason, which the reviewer and manager see.
* **Budget used** means every request already submitted (from Pending Review onwards, including Returned). **Paid** means Paid – Update NoBroker or Closed.
* **Amounts.** Enter the amount before VAT and the VAT (filled in at 5%, can be edited). The budget is used by the **total including VAT**.
* **Combined lines.** Budget rows with the same **Group** (for example "Cleaning & Maintenance") become one budget line, so IMB / Kawthar / SPS Max invoices are a single payment.
* **Follow-ups.** On any open line, log "Reminder sent", "Documents missing", "Invoice received" or "Other", with a date, a note and an email screenshot. The table shows the reminder count and the last date.
* **Log.** Every step records who did it and when. Each request shows days per stage, and **Log & reports** shows average and longest days per person and per stage.
* **Bulk approval.** Managers can tick several requests and approve them together. The button shows the total AED, which helps match the bank portal.

### Collection schedule

* A schedule (project + budget code + vendor + frequency) adds a **To Collect** line at the start of each period. Lines appear in Minhas's "Pending on me" with no invoice and no documents yet.
* A daily trigger runs at 06:00 Dubai time. There is also a "Create due To Collect lines now" button.
* Which periods get a line:

  | Frequency | Line appears | Invoice month |
  |---|---|---|
  | Monthly | every month | that month |
  | Quarterly | Jan / Apr / Jul / Oct | Mar / Jun / Sep / Dec |
  | Half-yearly | Jan / Jul | Jun / Dec |
  | Annual | Jan | Dec |

* **Create schedules from budget** (managers) adds one schedule per budget line. It uses the Frequency column if the budget file has one. Otherwise it uses these defaults, and you can change any schedule afterwards:

  | Frequency | Items |
  |---|---|
  | Quarterly | Master community, and anything not listed below |
  | Annual | DCD / Civil Defence, RERA fee |
  | Monthly | Pest control, waste collection |
  | Half-yearly | Water tank cleaning, facade cleaning |

* A To Collect line still open after **15 days** is shown as overdue. You can change this with `overdueDays` in the Settings sheet.

### Budget upload

Managers go to **Budget → Upload budget Excel**, choose the project and year, then pick an `.xlsx` or `.csv` file. You see a preview before anything is saved. Uploading replaces that project's budget for that year. Headings needed:

| Column | Needed | Notes |
|---|---|---|
| Code | yes | Budget / Mollak code |
| Description | | e.g. Pest control |
| Amount | yes | Annual budget, AED |
| Vendor | | Adds the vendor to the vendor list |
| Group | | Rows with the same group become one line |
| Frequency | | Monthly / Quarterly / Half-yearly / Annual |

A blank template is at `budget-template.csv`, and the upload screen offers a download too. Rows whose code starts with "Total" are skipped.

### Drive folders

```
PRF Portal/
  PRF Portal - Database        (the Google Sheet)
  <Project>/
    PRF-2026-0001 - <Vendor> - <Invoice no>/
      01 Invoice pack - <invoice>.pdf
      02 Payment proof.pdf
      Correspondence/           (follow-up screenshots)
```

## Install (about 10 minutes, once)

1. Open <https://script.google.com> with the Google account that should own the data (Osama's), and click **New project**. Name it "PRF Portal".
2. Create the files and paste in the contents from `apps-script/`:
   * `Code.gs`: paste `Core.gs` (rename the default file, or delete it).
   * **+ → Script**, named `Server`: paste `Server.gs`.
   * **+ → HTML**, named `Index` (exactly): paste `Index.html`.
   * **Project Settings → Show "appsscript.json"**, then paste `appsscript.json` into it.
3. Choose the function **setup** in the toolbar and click **Run**. Allow the permissions it asks for (Sheets, Drive, triggers). Then open **Execution log**. It shows:
   * the link to the database sheet
   * the link to the **PRF Portal** Drive folder
   * a **temporary password for each of the 4 users**
4. Click **Deploy → New deployment → Web app**, with "Execute as: **Me**" and "Who has access: **Anyone**". Click **Deploy** and copy the web-app link.
5. Send each person the link, their username and their temporary password. They can change it from the **Password** button.
6. Log in as `osama` or `shabir`, open **Budget → Upload budget Excel**, and upload the 2026 budget for each of the 7 projects. Then go to **Collection schedule → Create schedules from budget**.

* **Forgotten password:** in the script editor, run `resetPassword('minhas')` (with that person's username) and read the new one from the log.
* **Updating the code later:** paste the new files, then go to **Deploy → Manage deployments → Edit → Version: New version**. The link stays the same.

## Try it without Google

Open `dev/preview.html` in a browser. It runs the real page and logic on sample data kept in the browser. Log in as `minhas`, `ihtisham`, `shabir` or `osama` with password `demo`. The sample budget figures are made up.

To rebuild it after changing the code, run `node prf-portal/dev/build-preview.js`.

## Files

| File | What it is |
|---|---|
| `apps-script/Core.gs` | All workflow rules: statuses, checks, budget maths, schedules, reports. Has no Google calls. |
| `apps-script/Server.gs` | Google Sheets/Drive storage, login sessions, `setup()`, daily trigger |
| `apps-script/Index.html` | The web page |
| `apps-script/appsscript.json` | Apps Script manifest (Dubai time zone, web-app settings) |
| `dev/mock-store.js`, `dev/build-preview.js`, `dev/preview.html` | Offline preview with sample data |
| `budget-template.csv` | Budget upload template |
