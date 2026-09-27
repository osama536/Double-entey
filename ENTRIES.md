# Double-Entry Cheat Sheet

All examples use **AED** and **5% VAT** (UAE rate).
Golden rule: **total Debits = total Credits** in every entry.

| Account type | Increase | Decrease |
|---|---|---|
| Asset (Bank, Prepaid, Advance to Supplier, VAT Input, Customer/AR) | Dr | Cr |
| Expense | Dr | Cr |
| Liability (Supplier/AP, Accrued Exp., Advance from Customer, VAT Output) | Cr | Dr |
| Income (Sales) | Cr | Dr |

---

## 1. Prepaid Expense — expensed out month on month

Paid 12 months' rent in advance, AED 12,000.

**Step 1 – Payment (it is an asset, not yet an expense)**

| Account | Dr | Cr |
|---|---|---|
| Prepaid Rent | 12,000 | |
| Bank | | 12,000 |

**Step 2 – Every month end (x 12 months)**: move one month into expense

| Account | Dr | Cr |
|---|---|---|
| Rent Expense | 1,000 | |
| Prepaid Rent | | 1,000 |

After 12 months the Prepaid Rent balance is zero.

---

## 2. Advance to Supplier — next step when goods are received

**Step 1 – Pay advance**, AED 4,000

| Account | Dr | Cr |
|---|---|---|
| Advance to Supplier | 4,000 | |
| Bank | | 4,000 |

**Step 2 – Goods received + tax invoice**, AED 10,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Purchases / Inventory | 10,000 | |
| VAT Input | 500 | |
| Supplier (Accounts Payable) | | 10,500 |

**Step 3 – Adjust the advance against the supplier**

| Account | Dr | Cr |
|---|---|---|
| Supplier (Accounts Payable) | 4,000 | |
| Advance to Supplier | | 4,000 |

**Step 4 – Pay the balance** 10,500 − 4,000 = 6,500

| Account | Dr | Cr |
|---|---|---|
| Supplier (Accounts Payable) | 6,500 | |
| Bank | | 6,500 |

---

## 3. Advance from Customer — next step when goods are delivered

**Step 1 – Receive advance**, AED 5,000 (it is a **liability** – we still owe the goods)

| Account | Dr | Cr |
|---|---|---|
| Bank | 5,000 | |
| Advance from Customer | | 5,000 |

**Step 2 – Goods delivered + invoice**, AED 20,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Customer (Accounts Receivable) | 21,000 | |
| Sales | | 20,000 |
| VAT Output | | 1,000 |

**Step 3 – Adjust the advance against the customer**

| Account | Dr | Cr |
|---|---|---|
| Advance from Customer | 5,000 | |
| Customer (Accounts Receivable) | | 5,000 |

Customer now owes 21,000 − 5,000 = 16,000.

> Real-life UAE note: VAT is due on the date an advance is received. This sheet
> keeps VAT at invoice time so the double entry is easier to learn.

---

## 4. Accrued Expense — next step when the invoice is received

**Step 1 – Month end, used electricity but no bill yet**, estimate AED 2,000

| Account | Dr | Cr |
|---|---|---|
| Electricity Expense | 2,000 | |
| Accrued Expenses | | 2,000 |

**Step 2 – Invoice received next month**, AED 2,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Accrued Expenses | 2,000 | |
| VAT Input | 100 | |
| Supplier (Accounts Payable) | | 2,100 |

(Expense is **not** booked again – it was already booked at Step 1.
If the invoice differs from the estimate, the difference goes to Electricity Expense.)

**Step 3 – Pay the supplier**

| Account | Dr | Cr |
|---|---|---|
| Supplier (Accounts Payable) | 2,100 | |
| Bank | | 2,100 |

---

## 5. Purchase with VAT Input

Bought goods on credit, AED 8,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Purchases / Inventory | 8,000 | |
| VAT Input (asset – we claim it back) | 400 | |
| Supplier (Accounts Payable) | | 8,400 |

Cash purchase: credit **Bank** instead of Supplier.

---

## 6. Sale with VAT Output

Sold goods on credit, AED 30,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Customer (Accounts Receivable) | 31,500 | |
| Sales | | 30,000 |
| VAT Output (liability – we pay it to FTA) | | 1,500 |

Cash sale: debit **Bank** instead of Customer.

---

## Memory tricks

- **Prepaid** = paid early → **asset** → slowly becomes expense.
- **Accrued** = used but not billed → **liability** → cleared when invoice arrives.
- **Advance *to* supplier** = our money sitting with them → **asset**.
- **Advance *from* customer** = their money sitting with us → **liability**.
- **VAT In**put = on what comes **in** (purchases) → Dr.
- **VAT Out**put = on what goes **out** (sales) → Cr.
