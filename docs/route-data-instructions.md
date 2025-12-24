# Route Data Template Instructions

## How to Use This Template

1. Open `route-data-template.csv` in Google Sheets or Excel
2. Fill in your route data following the format below
3. Export/save as CSV when done
4. Send the CSV to upload to Firebase

---

## Column Definitions

| Column | Required | Description |
|--------|----------|-------------|
| **Night** | Yes | Night number (1-8) |
| **Type** | Yes | One of: `START`, `END`, `WAYPOINT`, `POI` |
| **Name** | For START/END/POI | Location or point of interest name |
| **Lat** | Yes | Latitude (decimal degrees, e.g., 33.4936) |
| **Lng** | Yes | Longitude (decimal degrees, e.g., -117.1484) |
| **Category** | For POI only | See category list below |
| **Description** | Optional | Details about the location |
| **Phone** | Optional | Phone number (for POIs) |
| **Hours** | Optional | Operating hours (for POIs) |
| **Distance** | START only | Estimated distance in miles |
| **Time** | START only | Estimated ride time (e.g., "6 hours") |

---

## Row Types

### START (Required - one per night)
The starting point for each day's ride.
- Include Distance and Time estimates on this row
- Example: `1,START,Temecula CA,33.4936,-117.1484,,,,,250,6 hours`

### END (Required - one per night)
The ending point/destination for each day's ride.
- Example: `1,END,San Quintin,30.5568,-115.9464,,,,,,`

### WAYPOINT (Optional)
Intermediate points to shape the route on the map.
- Use when you want the route to follow a specific road
- Name is optional
- Waypoints are processed in order they appear
- Example: `1,WAYPOINT,,32.5000,-116.8000,,,,,,`

### POI (Optional)
Points of Interest shown as markers on the map.
- Requires Name, Lat, Lng, and Category
- Example: `1,POI,Pemex Gas,31.8667,-116.5833,gas,Reliable station,+52 646 123,24 hours,,`

---

## POI Categories

Use one of these exact values in the Category column:

| Category | Description | Map Color |
|----------|-------------|-----------|
| `gas` | Gas stations | Yellow |
| `restaurant` | Restaurants, food stops | Orange |
| `poi` | General points of interest | Blue |
| `viewpoint` | Scenic viewpoints | Green |
| `photo` | Photo opportunities | Purple |
| `border` | Border crossings | Red |
| `emergency` | Hospitals, mechanics, emergency services | Dark Red |

---

## Tips

1. **Get coordinates easily**:
   - Right-click any location in Google Maps
   - Click the coordinates to copy them
   - Format: Lat comes first, Lng second

2. **Keep nights grouped together**: All rows for Night 1, then Night 2, etc.

3. **Waypoints order matters**: They're processed top-to-bottom

4. **Don't forget negative longitude**: Mexico coordinates have negative longitude (e.g., -116.5833)

5. **Category must match exactly**: Use lowercase (gas, not Gas or GAS)

---

## Example Data Structure

```
Night 1:
  START → Temecula
  WAYPOINT → (optional routing point)
  WAYPOINT → (optional routing point)
  POI → Gas station
  POI → Restaurant
  POI → Viewpoint
  END → San Quintin

Night 2:
  START → San Quintin
  POI → Gas station
  END → Guerrero Negro

...etc
```

---

## Questions?

Contact Kevin for help with the upload process.
