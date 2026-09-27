# Double-Entry Cheat Sheet

All examples use **AED** and **5% VAT** (UAE rate).
To keep it simple, every entry uses **100** for the amount, **5** for VAT and **105**
for the total receivable or payable. Only the prepayments use real figures.
Golden rule: **total Debits = total Credits** in every entry.

| Account type | Increase | Decrease |
|---|---|---|
| Asset (Bank, Customer/AR, Prepaid, Advance to Supplier, Accrued Income, VAT Input, Fixed Assets) | Dr | Cr |
| Expense (Rent, Salary, Depreciation, Purchases, Sales Returns) | Dr | Cr |
| Liability (Supplier/AP, Advance from Customer, Accrued Expenses, Salary Payable, VAT Output) | Cr | Dr |
| Income (Sales, Service Income, Purchase Returns) | Cr | Dr |
| Contra-asset (Accumulated Depreciation) | Cr | Dr |

---

# A. Sales cycle

## 1. Credit sale with VAT Output

Sold goods on credit: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Customer (Accounts Receivable) | 105 |  |
| Sales |  | 100 |
| VAT Output |  | 5 |

Cash sale: debit **Bank** instead of Customer.

## 2. Sales return

Customer returned goods: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Sales Returns | 100 |  |
| VAT Output | 5 |  |
| Customer (Accounts Receivable) |  | 105 |

VAT Output is **reduced** (debited) because we no longer owe that VAT.

## 3. Customer pays

Customer pays AED 105

| Account | Dr | Cr |
|---|---|---|
| Bank | 105 |  |
| Customer (Accounts Receivable) |  | 105 |

---

# B. Purchase cycle

## 4. Credit purchase with VAT Input

Bought goods on credit: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Purchases / Inventory | 100 |  |
| VAT Input | 5 |  |
| Supplier (Accounts Payable) |  | 105 |

Cash purchase: credit **Bank** instead of Supplier.

## 5. Purchase return

Returned goods to the supplier: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Supplier (Accounts Payable) | 105 |  |
| Purchase Returns |  | 100 |
| VAT Input |  | 5 |

VAT Input is **reduced** (credited) because we can no longer claim it.

## 6. We pay the supplier

We pay AED 105

| Account | Dr | Cr |
|---|---|---|
| Supplier (Accounts Payable) | 105 |  |
| Bank |  | 105 |

---

# C. Advances

## 7. Customer pays an advance

Received AED 105 before doing the work. We still owe the work, so it is a **liability**.

| Account | Dr | Cr |
|---|---|---|
| Bank | 105 |  |
| Advance from Customer |  | 105 |

## 8. Work done → reverse the customer advance into a sale

Work done: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Advance from Customer | 105 |  |
| Sales |  | 100 |
| VAT Output |  | 5 |

## 9. We pay an advance to a supplier

Paid AED 105 before receiving the goods. Our money is with them, so it is an **asset**.

| Account | Dr | Cr |
|---|---|---|
| Advance to Supplier | 105 |  |
| Bank |  | 105 |

## 10. Goods received → reverse the supplier advance into a purchase

Goods received: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Purchases / Expense | 100 |  |
| VAT Input | 5 |  |
| Advance to Supplier |  | 105 |

> Real-life UAE note: VAT is due on the date an advance is paid or received.
> This sheet books VAT when the work is done so the double entry is easier to learn.

---

# D. Accruals

## 11. Accrued expense (month end, used but not yet billed)

Electricity used this month: AED 100. No bill yet.

| Account | Dr | Cr |
|---|---|---|
| Electricity Expense | 100 |  |
| Accrued Expenses |  | 100 |

## 12. Reverse the accrued expense when the invoice arrives

Invoice received: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Accrued Expenses | 100 |  |
| VAT Input | 5 |  |
| Supplier (Accounts Payable) |  | 105 |

The expense is **not** booked again because it was already booked last month.

## 13. Accrued income (month end, earned but not yet invoiced)

Work done this month: AED 100. No invoice issued yet.

| Account | Dr | Cr |
|---|---|---|
| Accrued Income | 100 |  |
| Service Income |  | 100 |

## 14. Reverse the accrued income when we issue the invoice

Invoice issued: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Customer (Accounts Receivable) | 105 |  |
| Accrued Income |  | 100 |
| VAT Output |  | 5 |

The income is **not** booked again because it was already booked last month.

---

# E. Prepayments and amortisation

The pattern is always the same. **Pay** → Dr Prepaid (asset). **Each month** → Dr Expense / Cr Prepaid.

## 15. Prepaid office rent

Paid 1 year's office rent: AED 60,000 + 5% VAT (commercial rent carries VAT)

| Account | Dr | Cr |
|---|---|---|
| Prepaid Rent | 60,000 | |
| VAT Input | 3,000 | |
| Bank | | 63,000 |

## 16. Amortise prepaid rent (every month × 12)

60,000 ÷ 12 = 5,000

| Account | Dr | Cr |
|---|---|---|
| Rent Expense | 5,000 | |
| Prepaid Rent | | 5,000 |

## 17. Prepaid insurance, paid and then amortised

Paid a 1-year policy: AED 6,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Prepaid Insurance | 6,000 | |
| VAT Input | 300 | |
| Bank | | 6,300 |

Every month: 6,000 ÷ 12 = 500

| Account | Dr | Cr |
|---|---|---|
| Insurance Expense | 500 | |
| Prepaid Insurance | | 500 |

## 18. Prepaid employee visa, paid and then amortised

Paid a 2-year employee visa: AED 7,200. This is a government fee, so there is **no VAT**.

| Account | Dr | Cr |
|---|---|---|
| Prepaid Visa | 7,200 | |
| Bank | | 7,200 |

Every month: 7,200 ÷ 24 = 300

| Account | Dr | Cr |
|---|---|---|
| Visa Expense | 300 | |
| Prepaid Visa | | 300 |

---

# F. Fixed assets and depreciation

## 19. Buy a fixed asset

Bought office furniture: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Furniture (Fixed Asset) | 100 |  |
| VAT Input | 5 |  |
| Bank |  | 105 |

## 20. Depreciation (every month)

Monthly depreciation: AED 100

| Account | Dr | Cr |
|---|---|---|
| Depreciation Expense | 100 |  |
| Accumulated Depreciation – Furniture |  | 100 |

The asset account is **never** credited directly. Accumulated Depreciation reduces it on the balance sheet.

---

# G. Regular monthly expenses

## 21. Salary: accrue at month end, then pay (WPS)

| Account | Dr | Cr |
|---|---|---|
| Salary Expense | 100 |  |
| Salary Payable |  | 100 |

Paid through WPS:

| Account | Dr | Cr |
|---|---|---|
| Salary Payable | 100 |  |
| Bank |  | 100 |

Salary has **no VAT**.

## 22. Marketing expense

Paid for marketing: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Marketing Expense | 100 |  |
| VAT Input | 5 |  |
| Bank |  | 105 |

## 23. Office supplies

Bought office supplies in cash: AED 100 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Office Supplies Expense | 100 |  |
| VAT Input | 5 |  |
| Cash |  | 105 |

## 24. Utilities: internet or phone bill

Monthly bill: AED 100 + 5% VAT, paid from the bank

| Account | Dr | Cr |
|---|---|---|
| Telephone & Internet Expense | 100 |  |
| VAT Input | 5 |  |
| Bank |  | 105 |

## 25. Bank charges

Bank deducted AED 100 in charges

| Account | Dr | Cr |
|---|---|---|
| Bank Charges Expense | 100 |  |
| Bank |  | 100 |

---

## Memory tricks

- **Return** = undo the original entry (swap Dr and Cr, VAT included).
- **Advance *from* customer** = their money with us → **liability** → becomes Sales when the work is done.
- **Advance *to* supplier** = our money with them → **asset** → becomes Purchase when the goods arrive.
- **Accrued expense** = used, not billed → **liability** → cleared by the supplier invoice.
- **Accrued income** = earned, not invoiced → **asset** → cleared by our invoice to the customer.
- **Prepaid** = paid early → **asset** → amortised into expense every month.
- **Depreciation** → always Cr **Accumulated Depreciation**, never the asset itself.
- **VAT In**put = on what comes **in** (purchases and expenses) → Dr.
- **VAT Out**put = on what goes **out** (sales) → Cr.
- **No VAT**: salary, visa and government fees, bank charges in these examples.
