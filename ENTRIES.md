# Double-Entry Cheat Sheet

All examples use **AED** and **5% VAT** (UAE rate).
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

Sold goods on credit, AED 30,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Customer (Accounts Receivable) | 31,500 | |
| Sales | | 30,000 |
| VAT Output | | 1,500 |

Cash sale: debit **Bank** instead of Customer.

## 2. Sales return

Customer returned goods worth AED 2,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Sales Returns | 2,000 | |
| VAT Output | 100 | |
| Customer (Accounts Receivable) | | 2,100 |

VAT Output is **reduced** (debited) because we no longer owe that VAT.

## 3. Customer pays

Customer pays the balance: 31,500 − 2,100 = 29,400

| Account | Dr | Cr |
|---|---|---|
| Bank | 29,400 | |
| Customer (Accounts Receivable) | | 29,400 |

---

# B. Purchase cycle

## 4. Credit purchase with VAT Input

Bought goods on credit, AED 8,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Purchases / Inventory | 8,000 | |
| VAT Input | 400 | |
| Supplier (Accounts Payable) | | 8,400 |

Cash purchase: credit **Bank** instead of Supplier.

## 5. Purchase return

Returned goods worth AED 1,000 + 5% VAT to the supplier

| Account | Dr | Cr |
|---|---|---|
| Supplier (Accounts Payable) | 1,050 | |
| Purchase Returns | | 1,000 |
| VAT Input | | 50 |

VAT Input is **reduced** (credited) because we can no longer claim it.

## 6. We pay the supplier

Balance: 8,400 − 1,050 = 7,350

| Account | Dr | Cr |
|---|---|---|
| Supplier (Accounts Payable) | 7,350 | |
| Bank | | 7,350 |

---

# C. Advances

## 7. Customer pays an advance

Received AED 10,500 before doing the work. We still owe the work, so it is a **liability**.

| Account | Dr | Cr |
|---|---|---|
| Bank | 10,500 | |
| Advance from Customer | | 10,500 |

## 8. Work done → reverse the customer advance into a sale

Work worth AED 10,000 + 5% VAT delivered.

| Account | Dr | Cr |
|---|---|---|
| Advance from Customer | 10,500 | |
| Sales | | 10,000 |
| VAT Output | | 500 |

If the sale is bigger than the advance, debit **Customer (AR)** for the extra amount.

## 9. We pay an advance to a supplier

Paid AED 5,250 before receiving the goods or service. Our money is with them, so it is an **asset**.

| Account | Dr | Cr |
|---|---|---|
| Advance to Supplier | 5,250 | |
| Bank | | 5,250 |

## 10. Goods or service received → reverse the supplier advance into a purchase

Goods worth AED 5,000 + 5% VAT received.

| Account | Dr | Cr |
|---|---|---|
| Purchases / Expense | 5,000 | |
| VAT Input | 250 | |
| Advance to Supplier | | 5,250 |

If the purchase is bigger than the advance, credit **Supplier (AP)** for the extra amount.

> Real-life UAE note: VAT is due on the date an advance is paid or received.
> This sheet books VAT when the work is done so the double entry is easier to learn.

---

# D. Accruals

## 11. Accrued expense (month end, used but not yet billed)

Electricity used in March, estimated at AED 2,000. No bill yet.

| Account | Dr | Cr |
|---|---|---|
| Electricity Expense | 2,000 | |
| Accrued Expenses | | 2,000 |

## 12. Reverse the accrued expense when the invoice arrives

Invoice received in April: AED 2,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Accrued Expenses | 2,000 | |
| VAT Input | 100 | |
| Supplier (Accounts Payable) | | 2,100 |

The expense is **not** booked again because it was already booked in March.
If the invoice differs from the estimate, the difference goes to Electricity Expense.

## 13. Accrued income (month end, earned but not yet invoiced)

Consulting work done in March worth AED 6,000. No invoice issued yet.

| Account | Dr | Cr |
|---|---|---|
| Accrued Income | 6,000 | |
| Service Income | | 6,000 |

## 14. Reverse the accrued income when we issue the invoice

Invoice issued in April: AED 6,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Customer (Accounts Receivable) | 6,300 | |
| Accrued Income | | 6,000 |
| VAT Output | | 300 |

The income is **not** booked again because it was already booked in March.

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

Bought office furniture: AED 36,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Furniture (Fixed Asset) | 36,000 | |
| VAT Input | 1,800 | |
| Bank | | 37,800 |

## 20. Depreciation (every month)

Straight line over 3 years: 36,000 ÷ 36 = 1,000

| Account | Dr | Cr |
|---|---|---|
| Depreciation Expense | 1,000 | |
| Accumulated Depreciation – Furniture | | 1,000 |

The asset account is **never** credited directly. Accumulated Depreciation reduces it on the balance sheet.

---

# G. Regular monthly expenses

## 21. Salary: accrue at month end, then pay (WPS)

| Account | Dr | Cr |
|---|---|---|
| Salary Expense | 25,000 | |
| Salary Payable | | 25,000 |

Paid through WPS:

| Account | Dr | Cr |
|---|---|---|
| Salary Payable | 25,000 | |
| Bank | | 25,000 |

Salary has **no VAT**.

## 22. Marketing expense

Paid for social media ads: AED 4,000 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Marketing Expense | 4,000 | |
| VAT Input | 200 | |
| Bank | | 4,200 |

## 23. Office supplies

Bought stationery with cash: AED 500 + 5% VAT

| Account | Dr | Cr |
|---|---|---|
| Office Supplies Expense | 500 | |
| VAT Input | 25 | |
| Cash | | 525 |

## 24. Utilities: internet or phone bill

Monthly bill: AED 800 + 5% VAT, paid from the bank

| Account | Dr | Cr |
|---|---|---|
| Telephone & Internet Expense | 800 | |
| VAT Input | 40 | |
| Bank | | 840 |

## 25. Bank charges

Bank deducted AED 150 in charges

| Account | Dr | Cr |
|---|---|---|
| Bank Charges Expense | 150 | |
| Bank | | 150 |

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
