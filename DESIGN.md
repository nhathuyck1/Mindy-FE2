---
name: Mindy
description: Extracted Mindy tokens and scoped Admin resource table reference, 20 November 2026.
colors:
  mint: '#338a85'
  forest: '#1d5b57'
  coral: '#ff7f50'
  headsup: '#ff5400'
  sunshine: '#ffddae'
  canvas: '#ffffff'
  logo-soft: '#d8f0fa'
  soft: 'color-mix(in srgb, var(--color-mint) 7%, var(--color-canvas))'
  line: 'color-mix(in srgb, var(--color-mint) 19%, var(--color-canvas))'
  admin-ink: '#000000'
  admin-ink-soft: 'color-mix(in srgb, var(--color-ink) 82%, var(--color-canvas))'
  admin-ink-gray: 'color-mix(in srgb, var(--color-ink) 58%, var(--color-canvas))'
  status-green: '#15803d'
  status-yellow: '#a16207'
  status-red: '#b91c1c'
typography:
  body:
    fontFamily: 'Nunito Variable, Nunito, Arial, sans-serif'
  admin-body:
    fontFamily: 'Inter Variable, Inter, Arial, sans-serif'
    fontSize: '16px'
  admin-table-body:
    fontFamily: 'Inter Variable, Inter, Arial, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
  admin-table-label:
    fontFamily: 'Inter Variable, Inter, Arial, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 500
rounded:
  checkbox: '4px'
  compact: '6px'
  control: '8px'
  panel: '12px'
spacing:
  admin-table-cell-inline: '12px'
  admin-details-column-gap: '32px'
  admin-details-row-gap: '20px'
components:
  admin-button-primary:
    backgroundColor: '{colors.forest}'
    textColor: '{colors.canvas}'
    rounded: '{rounded.control}'
    padding: '0 16px'
  admin-button-secondary:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.admin-ink-soft}'
    rounded: '{rounded.control}'
    padding: '0 16px'
  admin-resource-row:
    height: '60px'
    typography: '{typography.admin-table-body}'
  admin-resource-header:
    backgroundColor: '{colors.canvas}'
    height: '48px'
    typography: '{typography.admin-table-label}'
  admin-resource-status:
    rounded: '{rounded.compact}'
    padding: '4px 10px'
    typography: '{typography.admin-table-label}'
---

# Design System: Mindy

## Overview

Extracted on 20 November 2026 from the existing implementation. The shared brand remains Nunito and the Mindy palette. Admin deliberately uses Inter and black/gray copy; its resource-table treatment follows the user-confirmed reference in Operate mode. No new identity is introduced.

**Key Characteristics:**

- Mindy mint/forest accents on white surfaces.
- Scoped Admin typography and restrained table actions.
- Separate selection and inline disclosure with contained scrolling.

## Colors

The frontmatter preserves canonical source values, including CSS color mixes. Mint supplies focus, selection and the expanded outline; forest supplies primary buttons. Canvas, soft and line provide surfaces and borders. Coral, headsup, sunshine and logo-soft remain incumbent brand colors. Admin copy uses admin-ink-soft/admin-ink-gray; status labels retain green/yellow/red meaning and visible text.

Sources: src/app/globals.css, src/app/admin/tokens.css and src/app/admin/admin.css. Global semantic aliases remain defined in CSS; Admin copy overrides do not apply to every role.

## Typography

Global typography uses the Nunito brand stack. Admin uses Inter through html:has([data-admin-root]), including its portals, with a 16px base scale. Resource-table body copy is regular, names are medium, and headers/detail labels use the smaller medium label role. This exception does not replace the global font.

## Layout

Admin sidebar is 248px on desktop, 76px collapsed; below 1024px navigation uses the mobile menu. Main horizontal padding is 16px, increasing to 32px from 640px. Resource tables keep a 1040px minimum width within a focusable horizontal scroll region; the page fits the viewport.

White headers and compact rows use the heights above. Inline details use one column, two from 640px and four from 1280px; description fields span two where available. Details stay within a viewport-relative width while the table scrolls, and long text wraps. Validate at 320/768/1024/1440px.

## Elevation & Depth

Resource panels use thin line borders and white surfaces. Row actions remove shadows. Soft mint conveys selection; a 1px mint outline with -1px offset encloses the expanded row group. Shared controls retain their own small shadows/focus rings; the resource-table treatment is scoped.

## Shapes

Panels use the panel radius, controls use the control radius, and compact actions/statuses use the compact radius. NameAvatar stays circular and is reduced to 32px inside resource rows. Shared checkboxes use the checkbox radius and a minus for mixed selection.

## Components

- **Resource tables:** Users/Courses/Classes share AdminDataTable. Checkbox and keyboard disclosure are separate controls; at most one row is expanded. Email/code is a separate column. Users use NameAvatar initials, courses/classes use resource icons.
- **Details:** AdminRecordDetails renders existing list fields, metric and date without redundant fields. Opening it performs no mutation or new detail request. Edit, schedule and confirmation dialogs remain. User state actions lock/unlock rather than delete.
- **Status:** Only these three tables opt into compact rectangular labels without pulse dots. Other AdminStatus consumers retain their incumbent style.
- **Actions:** Neutral 36px icon actions/disclosures use mint/forest hover and visible focus; coarse pointers enlarge them to 44px.
- **State:** Mixed select-all shows a minus. Resource/page/status/filter/search changes remount disclosure. Visible optional columns determine expanded colspan and skeleton count. Existing API/filter/pagination/CSV behavior remains.

## Do's and Don'ts

- **Trial discovery:** a mint invitation in public navigation opens `/trial`, using the existing catalog typography and cards without a filter sidebar. Trial labels come from supplied names/codes; a zero-price badge reflects the backend amount. No new palette, artwork or access promise is introduced.
- **Class workflow:** the status section has a calendar shortcut into the same class scheduling dialog. Preserve single-dialog focus, return focus and the existing schedule form.

- **Do** keep Nunito global and Inter scoped to Admin.
- **Do** preserve Mindy tokens and visible status text.
- **Do** separate selection/disclosure and contain table scrolling.
- **Don't** generalize the resource headers/status treatment to every table.
- **Don't** invent detail data, user deletion or decorative raster assets.
