# Itinerary Page Field Guide

This document maps every field displayed on the Itinerary page to its data source and the admin screen used to edit it.

---

## Quick Reference

| Data Type | Admin Screen | URL |
|-----------|--------------|-----|
| Route info (title, description, distance, time, map) | Admin Routes | `/admin/routes` |
| Accommodation details (hotel, camping) | Nightly Config | `/admin/nightly-config` |
| Highlights | Nightly Config | `/admin/nightly-config` |

---

## Data Sources

### Routes Collection
**Firestore Path:** `events/bajarun2026/routes/day{N}`
**Admin Screen:** Admin Routes (`/admin/routes`)

### Pricing/Nightly Config
**Firestore Path:** `eventConfig/pricing.nights[night-{N}]`
**Admin Screen:** Nightly Config (`/admin/nightly-config`)

---

## Field-by-Field Breakdown

### Day Header Card

| What You See | Field Name | Admin Screen | Notes |
|--------------|------------|--------------|-------|
| Day number (1, 2, 3...) | `day` | Admin Routes | Auto-assigned |
| Day title | `title` | Admin Routes | e.g., "Temecula to San Quintin" |
| Date | `date` | Admin Routes | e.g., "March 19, 2026" |
| Description text | `rideSummary` | Admin Routes | Supports **markdown** formatting. Falls back to `description` if empty |
| "Rest Day" badge | Automatic | - | Shows when `estimatedDistance` is 0 |

### Route Section

| What You See | Field Name | Admin Screen | Notes |
|--------------|------------|--------------|-------|
| "From" location | `startName` | Admin Routes | e.g., "Temecula, CA" |
| "To" location | `endName` | Admin Routes | e.g., "San Quintin" |
| Route line on map | `routeGeometry` | Admin Routes | Auto-generated via "Generate Route" button |
| Route shape | `waypoints` | Admin Routes | Intermediate points the route passes through |

### Stats Section

| What You See | Field Name | Admin Screen | Notes |
|--------------|------------|--------------|-------|
| Distance (miles) | `estimatedDistance` | Admin Routes | Auto-populated when route is generated, can be manually overridden |
| Riding Time | `estimatedTime` | Admin Routes | Auto-populated when route is generated, can be manually overridden |

### Accommodation Section

| What You See | Field Name | Admin Screen | Notes |
|--------------|------------|--------------|-------|
| Hotel name | `hotelName` | Nightly Config | Links to website if `hotelWebsite` is set |
| Hotel website link | `hotelWebsite` | Nightly Config | URL for hotel booking |
| Hotel address | `hotelAddress` | Nightly Config | Links to Google Maps if `hotelMapsLink` is set |
| Hotel maps link | `hotelMapsLink` | Nightly Config | Google Maps URL |
| Hotel phone | `hotelPhone` | Nightly Config | Clickable tel: link |
| Hotel description | `hotelDescription` | Nightly Config | Short description text |
| Camping name | `campingName` | Nightly Config | Links to maps if `campingMapsLink` is set |
| Camping maps link | `campingMapsLink` | Nightly Config | Google Maps URL |
| Camping description | `campingDescription` | Nightly Config | Short description text |

### Highlights Section

| What You See | Field Name | Admin Screen | Notes |
|--------------|------------|--------------|-------|
| Highlight items (numbered list) | `highlights` | Nightly Config | Array of text strings |

---

## Admin User Guide

### Updating Route Information

**Go to:** Admin Routes (`/admin/routes`)

1. Select the day tab at the top
2. Edit the following fields:
   - **Title** - The day's headline (e.g., "Temecula to San Quintin")
   - **Date** - The calendar date
   - **Ride Summary** - Detailed description (supports markdown: **bold**, *italic*, bullet lists, headers)
   - **Start/End Locations** - Where the ride begins and ends
   - **Start/End Coordinates** - Lat/lng for route generation
   - **Waypoints** - Add intermediate coordinates to shape the route (see below)
3. Click **"Generate Route"** to auto-calculate distance, time, and route geometry
4. Click **"Save"** to persist changes

**Using Waypoints:**
Waypoints are intermediate coordinates that shape the route between start and end. Use them to:
- Force the route through a specific road or town
- Avoid highways or toll roads
- Follow a scenic route instead of the fastest path

To add waypoints:
1. Click "Add Waypoint" in the Waypoints section
2. Enter the latitude and longitude coordinates
3. Add multiple waypoints in the order you want the route to pass through them
4. Click "Generate Route" to create a route that passes through all waypoints

**Markdown Tips for Ride Summary:**
```markdown
**Bold text** for emphasis
*Italic text* for softer emphasis

## Heading 2
### Heading 3

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2
```

### Updating Accommodation & Highlights

**Go to:** Nightly Config (`/admin/nightly-config`)

1. Select the night tab at the top (Night 1 = Day 1's accommodation)
2. **Day Information section:**
   - Add/edit **Highlights** - Key features of the day's ride
3. **Hotel section:**
   - Toggle "Available" to enable
   - Fill in name, address, phone, website, maps link, description
4. **Camping section:**
   - Toggle "Available" to enable
   - Fill in name, maps link, description
5. Click **"Save All"** to persist changes

---

## Common Tasks

### "I want to change the day's title or description"
**Go to:** Admin Routes > Select day > Edit Title or Ride Summary

### "I want to update hotel information"
**Go to:** Nightly Config > Select night > Hotel section

### "I want to add highlights for a day"
**Go to:** Nightly Config > Select night > Day Information > Add highlights

### "I want to change the route on the map"
**Go to:** Admin Routes > Select day > Update coordinates/waypoints > Generate Route

### "I want the route to go through a specific town or road"
**Go to:** Admin Routes > Select day > Add Waypoints with that location's coordinates > Generate Route

### "I want to add camping as an option"
**Go to:** Nightly Config > Select night > Camping section > Toggle Available

---

## Field Priority Rules

| Scenario | What Displays |
|----------|---------------|
| `rideSummary` has content | `rideSummary` is shown |
| `rideSummary` is empty | `description` is shown as fallback |
| Neither hotel nor camping configured | Shows `accommodation` field from Routes as fallback |

---

## Night-to-Day Mapping

| Night | Corresponds To | Accommodation For |
|-------|----------------|-------------------|
| Night 1 | Day 1 | Where you sleep after Day 1's ride |
| Night 2 | Day 2 | Where you sleep after Day 2's ride |
| ... | ... | ... |
| Night 9 | Day 9 | Final night before departure |
