from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

WAQI_KEY = os.getenv('WAQI_API_KEY')

# Đổi tên đường dẫn thành /api/aqi cho chuẩn xác
@app.route('/api/aqi', methods=['GET'])
def get_aqi():
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not lat or not lon:
        return jsonify({"error": "Thiếu tọa độ"}), 400

    aqi_value = "Đang cập nhật"
    try:
        if WAQI_KEY:
            waqi_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_KEY}"
            res = requests.get(waqi_url).json()
            if res.get('status') == 'ok':
                aqi_value = res['data']['aqi']
    except Exception as e:
        print("Lỗi lấy AQI:", e)

    return jsonify({"aqi": aqi_value})

if __name__ == '__main__':
    app.run(debug=True, port=5000)