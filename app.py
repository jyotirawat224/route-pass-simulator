import streamlit as st
import streamlit.components.v1 as components

# ─── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Route Pass Simulator v2",
    page_icon="🎫",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─── Seamless Custom CSS ──────────────────────────────────────────────────────
st.markdown("""
<style>
    /* Hide Streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
    /* Remove padding and margins */
    .block-container {
        padding-top: 0rem;
        padding-bottom: 0rem;
        padding-left: 0rem;
        padding-right: 0rem;
    }
    
    .stApp > header {
        display: none;
    }

    [data-testid="stHeader"] {
        display: none;
    }

    /* Full-screen iframe */
    iframe {
        border: none;
        width: 100%;
        height: 100vh;
        overflow: hidden;
    }
</style>
""", unsafe_allow_html=True)

# ─── Embed v2 UI ─────────────────────────────────────────────────────────────
# We use the consolidated production server on port 8000
VITE_URL = "http://localhost:8000"

try:
    components.iframe(VITE_URL, height=1800, scrolling=True)
except Exception as e:
    st.error(f"Failed to load the Simulator v2 UI. Ensure the Vite server is running on {VITE_URL}.")
