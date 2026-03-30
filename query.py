import pandas as pd
import requests
from datetime import datetime

# Redash API Configuration (JSON endpoint)
REDASH_JSON_URL = "http://reporter.zingmobility.com/api/queries/7590/results.json?api_key=K4CxhybRtBP5khDFpZE1VkHyfk9QRQKuWZ9yhRjP"

# All corridors supported by the simulator (as defined in the Redash query results)
CORRIDORS = [
    'Delhi<>Dehradun',
    'Delhi<>Lucknow',
    'Bangalore<>Hyderabad',
    'Hyderabad<>Visakhapatnam',
    'Delhi<>Dharamshala',
    'Pune<>Nagpur',
    'Chennai<>Madurai',
    'Chennai<>Coimbatore',
    'Gurugram<>Dehradun',
    'Delhi<>Amritsar',
    'Chennai<>Bangalore',
    'Delhi<>Jaipur'
]

# Global in-memory cache to avoid re-fetching data from Redash on every click
_cache = {
    "data": None,
    "timestamp": None
}
CACHE_EXPIRY_SECONDS = 3600 # 1 hour

def fetch_ota_asp(corridor: str) -> pd.DataFrame:
    global _cache
    now = datetime.now()
    
    try:
        # Check if we have valid cached data (less than 1 hour old)
        if _cache["data"] is not None and _cache["timestamp"] is not None:
            if (now - _cache["timestamp"]).total_seconds() < CACHE_EXPIRY_SECONDS:
                df = _cache["data"].copy()
                # Filter for the specific corridor from cache
                df = df[df['corridor'] == corridor].copy()
                if df.empty:
                    return pd.DataFrame(columns=['booking_month', 'seat_type', 'seats', 'revenue', 'ota_asp'])
                return process_dataframe(df)

        # Cache miss or expired: Fetch from Redash
        response = requests.get(REDASH_JSON_URL)
        response.raise_for_status()
        data = response.json()
        
        rows = data['query_result']['data']['rows']
        df_full = pd.DataFrame(rows)
        
        # Update global cache with the full dataset
        _cache["data"] = df_full
        _cache["timestamp"] = now
        
        # Filter for the specific corridor
        df = df_full[df_full['corridor'] == corridor].copy()
        if df.empty:
            return pd.DataFrame(columns=['booking_month', 'seat_type', 'seats', 'revenue', 'ota_asp'])

        return process_dataframe(df)
        
    except Exception as e:
        print(f"Error fetching from Redash JSON: {e}")
        return pd.DataFrame(columns=['booking_month', 'seat_type', 'seats', 'revenue', 'ota_asp'])

def process_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Helper to process the filtered corridor data."""
    # Convert booking_month (YYYY-MM string) to datetime object
    df['booking_month'] = pd.to_datetime(df['booking_month'] + '-01')
    
    # Inject placeholder values for compatibility
    if 'seats' not in df.columns:
        df['seats'] = 1
    if 'revenue' not in df.columns:
        df['revenue'] = df['ota_asp']
        
    # Ensure numeric types
    for col in ['seats', 'revenue', 'ota_asp']:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
    return df[['booking_month', 'seat_type', 'seats', 'revenue', 'ota_asp']]
