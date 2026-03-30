from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import query
import pandas as pd
import json
import os

app = FastAPI()

# Get the path to the React build directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "v2_ui", "dist")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/historical-data")
def get_historical_data(corridor: str = Query(..., description="The corridor name")):
    try:
        df = query.fetch_ota_asp(corridor)
        
        if df.empty:
            return {"corridor": corridor, "months": [], "data": {}}

        # Ensure booking_month is datetime
        df['booking_month'] = pd.to_datetime(df['booking_month'])
        
        # Ensure we have the last 12 months regardless of data availability
        # Use the latest month in the dataset as the reference point
        latest_month = df['booking_month'].max()
        all_months_dt = pd.date_range(end=latest_month, periods=12, freq='MS')
        all_months_str = all_months_dt.strftime('%b %Y').tolist()
        
        # Sort the dataframe by booking_month to ensure correct mapping
        df = df.sort_values('booking_month')
        
        # Create a formatted column for mapping
        df['month_str'] = df['booking_month'].dt.strftime('%b %Y')
        
        result = {}
        seat_labels = ["Seater", "Shared Sleeper", "Single Sleeper"]
        
        for label in seat_labels:
            type_df = df[df['seat_type'] == label]
            
            # Map values to the fixed month list, padding with 0 if missing
            asp_map = dict(zip(type_df['month_str'], type_df['ota_asp']))
            seats_map = dict(zip(type_df['month_str'], type_df['seats']))
            rev_map = dict(zip(type_df['month_str'], type_df['revenue']))
            
            result[label] = {
                "asp": [int(asp_map.get(m, 0)) for m in all_months_str],
                "seats": [int(seats_map.get(m, 0)) for m in all_months_str],
                "revenue": [int(rev_map.get(m, 0)) for m in all_months_str]
            }
        
        return {
            "corridor": corridor,
            "months": all_months_str,
            "data": result
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}

# Serve static files from the React build directory
if os.path.exists(DIST_DIR):
    # Mount the 'assets' directory for JS/CSS
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    # Serve index.html for the root and any other routes (spa style)
    @app.get("/")
    def read_index():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
    
    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Only serve index if it's not a /api call
        if not full_path.startswith("api/"):
            return FileResponse(os.path.join(DIST_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
