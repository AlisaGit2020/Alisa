# Implementation Plan: Portfolio Card Layout Customization by Property Type

## Overview

This plan defines a customized card layout for each of the three property categories (Own, Prospect, Sold) in the portfolio view. Currently, all property cards in `AssetCardList` display the same generic information regardless of property status. The goal is to show relevant, context-appropriate information for each category to provide immediate value at a glance.

### Proposed Field Customization by Category

#### OWN Properties - Focus on Operational Performance
| Field | Source | Rationale |
|-------|--------|-----------|
| **Name** | `property.name` | Primary identifier |
| **Address** | `property.address` | Location context |
| **Size** | `property.size` | Property dimension |
| **Monthly Rent** | `property.monthlyRent` | Key income metric |
| **Net Rent** | Calculated (rent - costs) | True cash flow |
| **Ownership %** | `ownerships[0].share` | Only if < 100% |

#### PROSPECT Properties - Focus on Investment Evaluation
| Field | Source | Rationale |
|-------|--------|-----------|
| **Name** | `property.name` | Primary identifier |
| **Address** | `property.address` | Location context |
| **Size** | `property.size` | Property dimension |
| **Asking Price** | `property.purchasePrice` | Key evaluation metric |
| **Price/m2** | Calculated | Value comparison |
| **Expected Rent** | `property.monthlyRent` | Return potential |
| **Gross Yield** | Calculated | Quick ROI indicator |
| **External Source** | `property.externalSource` | Listing origin badge |

#### SOLD Properties - Focus on Historical Summary
| Field | Source | Rationale |
|-------|--------|-----------|
| **Name** | `property.name` | Primary identifier |
| **Address** | `property.address` | Location context |
| **Size** | `property.size` | Property dimension |
| **Purchase Price** | `property.purchasePrice` | Historical cost |
| **Sale Price** | `property.salePrice` | Final value |
| **Profit/Loss** | Calculated | Return on investment |
| **Sale Date** | `property.saleDate` | When sold |

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/components/property/cards/PropertyCard.tsx` | **Create** | New reusable property card component with status-aware rendering |
| `frontend/src/components/property/cards/OwnPropertyCardContent.tsx` | **Create** | Specialized card content for owned properties |
| `frontend/src/components/property/cards/ProspectPropertyCardContent.tsx` | **Create** | Specialized card content for prospect properties |
| `frontend/src/components/property/cards/SoldPropertyCardContent.tsx` | **Create** | Specialized card content for sold properties |
| `frontend/src/components/property/cards/index.ts` | **Create** | Barrel export for card components |
| `frontend/src/components/asset/AssetCardList.tsx` | **Modify** | Add `renderCard` prop for custom card rendering |
| `frontend/src/components/property/Properties.tsx` | **Modify** | Pass custom card renderers for each tab |
| `frontend/src/components/property/ProspectsPanel.tsx` | **Modify** | Use custom prospect card renderer |
| `frontend/src/translations/property/en.ts` | **Modify** | Add new translation keys |
| `frontend/src/translations/property/fi.ts` | **Modify** | Add Finnish translations |
| `frontend/src/translations/property/sv.ts` | **Modify** | Add Swedish translations |

## Implementation Steps

1. Create base PropertyCard component with status-aware content rendering
2. Create OwnPropertyCardContent component
3. Create ProspectPropertyCardContent component
4. Create SoldPropertyCardContent component
5. Create barrel export index.ts
6. Modify AssetCardList to support custom renderCard prop
7. Update Properties.tsx to use custom card renderers
8. Update ProspectsPanel.tsx to use custom card renderer
9. Add translation keys to all 3 language files
10. Write unit tests for all card components

## Edge Cases

- Missing `monthlyRent`: Hide row
- Missing `purchasePrice`: Hide price-dependent rows
- Division by zero: Check `size > 0` and `purchasePrice > 0`
- Negative net rent: Display in red
- Null/undefined address: Hide address row
