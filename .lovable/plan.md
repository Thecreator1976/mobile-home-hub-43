

# Revamp Value Estimator: 4 Decades + Retail & Wholesale

## Summary
Update the Value Estimator with the complete price tables from your attachments, support 4 decades (1980s-2010s), and show both Retail and Wholesale prices using the updated formulas.

## Price Tables (from attachments)

| Condition | 1980s | 1990s | 2000s | 2010s |
|-----------|-------|-------|-------|-------|
| 1 star (not livable, full remodel) | $1.5-$2 | $2-$2.5 | $4.5-$5 | $6.5-$7 |
| 2 stars (hardly livable, major repairs) | $2.5-$3 | $3-$3.5 | $5.5-$6 | $11.5-$12 |
| 3 stars (livable, minor updates + repairs) | $4-$4.5 | $4.5-$5 | $7.5-$8 | $14.5-$15 |
| 4 stars (livable, minor updates only) | $5.5-$6 | $6-$6.5 | $9.5-$10 | $20.5-$21 |
| 5 stars (livable, fully remodeled) | $6.5-$7 | $7.5-$8 | $11.5-$12 | $21.5-$22 |

## Updated Formulas

```text
Retail Price    = Sq Ft x Midpoint Price Per Sq Ft x 2
Wholesale Price = Retail Price x 0.45
```

Market adjustment applied before the wholesale step:
```text
Adjusted Retail    = Retail x (1 + Market% / 100)
Adjusted Wholesale = Adjusted Retail x 0.45
```

## Changes to `src/pages/ValueEstimator.tsx`

### 1. Expand decade type and price tables
- Change `decade` type from `"1980s" | "1990s"` to include `"2000s" | "2010s"`
- Update `PRICE_PER_SQFT` with the complete table above (1980s values also updated to match attachments)
- Update `getDecadeFromYear` to handle 2000-2009 and 2010-2019

### 2. Replace calculation function
- Remove old formula (`SqFt x 2 x Price x (1+Market%) x 0.92`)
- New function returns both `retailPrice` and `wholesalePrice`
- Remove the old `movingFactor` and `wholesaleDiscount` constants
- Add `wholesaleFactor = 0.45`

### 3. Update results display
- Show two price cards side by side: "Retail Listing Price" and "Wholesale Purchase Price"
- Both prominently displayed with clear labels

### 4. Update breakdown section
- Step 1: Sq Ft x Midpoint = base
- Step 2: Base x 2 = Retail
- Step 3: Market adjustment applied
- Step 4: Retail x 0.45 = Wholesale

### 5. Expand reference table
- Show all 4 decades in a 2x2 grid layout
- Highlight the currently selected decade/condition

### 6. Update condition descriptions
- Match the wording from your attachments:
  - 1: "Not livable, needs complete full remodel"
  - 2: "Hardly livable, needs major repairs and updates"
  - 3: "Livable/rentable, needs minor updates and repairs"
  - 4: "Livable/rentable, needs minor updates (paint/carpet), no repairs"
  - 5: "Livable/rentable, fully remodeled, no updates or repairs needed"

### 7. Update decade selector
- Add "2000s" and "2010s" options to the dropdown

### 8. Update formula reference card at bottom
- New formula text reflecting Retail and Wholesale calculations

## No other files need changes
No database, backend, or routing changes required.

