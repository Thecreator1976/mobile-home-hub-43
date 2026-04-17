

Let me check the current ValueEstimator implementation to plan accurately.
<lov-tool-use id="toolu_vrtx_01ReHbgEhD6xscji4JgGp71z" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/ValueEstimator.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_017J4L8W48JRqgf3o3DWMqXZ" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/ValueEstimator.tsx\"}">
</lov-tool-use>
I have what I need. Build errors mentioned are pre-existing/unrelated. The user wants to switch to direct wholesale-only pricing.

<lov-plan>
# Switch Value Estimator to Wholesale-Only Pricing

## Goal
Replace the two-step retail→wholesale model with a direct **Wholesale = Sq Ft × Base Rate** lookup using new aggressive Carolinas rates.

## New Price Table (final wholesale $/sq ft)

| Decade | L5 Turnkey | L4 Good | L3 Average | L2 Rough | L1 Scrap |
|--------|-----------|---------|-----------|----------|----------|
| 1980s | 3.60 | 3.06 | 2.52 | 1.80 | 0.90 |
| 1990s | 8.10 | 6.88 | 5.67 | 4.05 | 0.90 |
| 2000s | 12.60 | 10.71 | 8.82 | 6.30 | 0.90 |
| 2010s | 18.90 | 16.06 | 13.23 | 9.45 | 0.90 |

## Changes to `src/pages/ValueEstimator.tsx`

1. **Replace `PRICE_PER_SQFT`** with the new flat-rate `WHOLESALE_RATE` table above (single number per cell, not a range).
2. **Remove**: `WHOLESALE_FACTOR (0.45)`, the `× 2` retail multiplier, and the `marketAdjustment` field from `PropertyData`, the input UI, and the calculation.
3. **New formula** in `calculatePrices`:
   ```ts
   wholesalePrice = sqft * WHOLESALE_RATE[decade][condition]
   ```
4. **Result UI**: Remove the "Retail Listing Price" card. Show a single large prominent card titled **"Target Wholesale Purchase Price"** with the value in bold high-visibility green text (e.g. `text-5xl font-bold text-green-600`).
5. **Breakdown panel**: Simplify to two lines — `Sq Ft × Rate = Wholesale` (e.g. `1,680 × $5.67 = $9,525`).
6. **Page header**: Update subtitle from "Calculate retail listing and wholesale purchase prices" to "Calculate target wholesale purchase price".
7. **Keep**: decade picker, condition picker (1–5), length/width, sq-ft display, park-owned + lot rent toggle (display only, doesn't affect price), `leadId` deep-link behavior, big mobile-friendly buttons.

## Access model (already in place via existing role system)
- Super Admin: full access (rate-table editing UI is **out of scope** for this change — rates remain hardcoded for now).
- Agent / Viewer: can run calculations only. No change needed.

## Files touched
- `src/pages/ValueEstimator.tsx` (only file)

## Out of scope
- Admin UI to edit base rates (can be a follow-up; would require a `value_estimator_rates` table + RLS).
- The unrelated TypeScript build errors listed in the build log (AuthGuard/Integrations/Unauthorized) — those will be addressed separately if you want.
