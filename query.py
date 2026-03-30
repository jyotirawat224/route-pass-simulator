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

def fetch_ota_asp(corridor: str) -> pd.DataFrame:
    """
    Fetch month-wise, seat-type-wise OTA ASP for a corridor from Redash JSON API.
    The Redash query (7590) is pre-filtered for OTA, non-loyalty, confirmed bookings.

    Returns DataFrame with columns:
        booking_month (datetime), seat_type, seats, revenue, ota_asp
    """
    try:
        # Fetch the dataset from Redash JSON API
        response = requests.get(REDASH_JSON_URL)
        response.raise_for_status()
        data = response.json()
        
        # Extract rows from Redash standard JSON structure
        rows = data['query_result']['data']['rows']
        df = pd.DataFrame(rows)
        
        if df.empty:
            return pd.DataFrame(columns=['booking_month', 'seat_type', 'seats', 'revenue', 'ota_asp'])

        # Filter for the specific corridor
        df = df[df['corridor'] == corridor].copy()
        
        if df.empty:
            return pd.DataFrame(columns=['booking_month', 'seat_type', 'seats', 'revenue', 'ota_asp'])

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
        
    except Exception as e:
        print(f"Error fetching from Redash JSON: {e}")
        return pd.DataFrame(columns=['booking_month', 'seat_type', 'seats', 'revenue', 'ota_asp'])
