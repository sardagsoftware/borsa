"""Webhook validation example"""

import os
from flask import Flask, request, jsonify
from lydian.utils import verify_hmac_signature

app = Flask(__name__)

WEBHOOK_SECRET = os.environ.get("LYDIAN_WEBHOOK_SECRET")

@app.route("/webhooks/lydian", methods=["POST"])
def webhook():
    # Get signature from header
    signature = request.headers.get("X-Lydian-Signature")
    if not signature:
        return jsonify({"error": "Missing signature"}), 401

    # Get raw payload
    payload = request.get_data(as_text=True)

    # Verify signature
    is_valid = verify_hmac_signature(payload, signature, WEBHOOK_SECRET)

    if not is_valid:
        return jsonify({"error": "Invalid signature"}), 401

    # Parse event
    event = request.get_json()
    print(f"Webhook event: {event['type']}")

    # Handle different event types
    if event["type"] == "city.created":
        print(f"New city created: {event['data']}")
    elif event["type"] == "alert.created":
        print(f"New alert: {event['data']}")
    elif event["type"] == "signal.processed":
        print(f"Signal processed: {event['data']}")
    elif event["type"] == "insight.generated":
        print(f"New insight: {event['data']}")
    else:
        print(f"Unknown event type: {event['type']}")

    return jsonify({"received": True})

if __name__ == "__main__":
    app.run(port=3000)
