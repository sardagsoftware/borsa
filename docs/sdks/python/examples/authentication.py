"""Authentication examples"""

import os
from lydian import Lydian, LydianError

# Example 1: API Key Authentication
def api_key_auth():
    lydian = Lydian(api_key=os.environ.get("LYDIAN_API_KEY"))
    cities = lydian.smart_cities.list_cities()
    print(f"Found {len(cities.data)} cities")

# Example 2: OAuth2 Authentication
def oauth2_auth():
    lydian = Lydian(base_url="https://api.lydian.ai/v1")

    # Authenticate with OAuth2
    lydian.authenticate_oauth2(
        client_id=os.environ.get("OAUTH_CLIENT_ID"),
        client_secret=os.environ.get("OAUTH_CLIENT_SECRET")
    )

    # Now make authenticated requests
    cities = lydian.smart_cities.list_cities()
    print(f"Found {len(cities.data)} cities")

# Example 3: Custom configuration
def custom_config():
    lydian = Lydian(
        api_key=os.environ.get("LYDIAN_API_KEY"),
        base_url="https://api.lydian.ai/v1",
        timeout=60,  # 60 seconds
        retry_attempts=5,
        retry_delay=2  # 2 seconds
    )

    cities = lydian.smart_cities.list_cities()
    print(f"Found {len(cities.data)} cities")

# Example 4: Error handling
def error_handling():
    lydian = Lydian(api_key=os.environ.get("LYDIAN_API_KEY"))

    try:
        city = lydian.smart_cities.get_city("non-existent-id")
        print(city)
    except LydianError as e:
        print(f"API Error: {e.message}")
        print(f"Status: {e.status_code}")
        print(f"Code: {e.code}")
        print(f"Details: {e.details}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    print("1. API Key Authentication")
    api_key_auth()

    print("\n2. OAuth2 Authentication")
    oauth2_auth()

    print("\n3. Custom Configuration")
    custom_config()

    print("\n4. Error Handling")
    error_handling()
