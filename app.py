from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

WAQI_KEY = os.getenv('WAQI_API_KEY')

@app.route('/api/weather', methods=['GET'])
def get_weather_data():
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not lat or not lon:
        return jsonify({"error": "Thiếu thông tin tọa độ"}), 400

    try:
        # 1. API Thời tiết: Lấy hiện tại + 24h tới + 7 ngày tới
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto"
        weather_res = requests.get(weather_url).json()

        # 2. API Hải văn: Lấy độ cao sóng hiện tại
        marine_url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&current=wave_height"
        marine_res = requests.get(marine_url).json()
        
        wave_height = marine_res.get('current', {}).get('wave_height')
        if wave_height is None:
            wave_height = "Không có dữ liệu biển"

        # 3. API AQI
        waqi_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_KEY}"
        waqi_res = requests.get(waqi_url).json()

        aqi_value = "N/A"
        if waqi_res.get('status') == 'ok':
            aqi_value = waqi_res['data']['aqi']

        # 4. GÓI TOÀN BỘ DỮ LIỆU ĐỂ GỬI VỀ CHO GIAO DIỆN
        final_data = {
            "current": {
                "temperature": weather_res['current']['temperature_2m'],
                "humidity": weather_res['current']['relative_humidity_2m'],
                "weather_code": weather_res['current']['weather_code'],
                "wave_height": wave_height,
                "aqi": aqi_value
            },
            # Lấy 24 giờ tiếp theo (cắt mảng 24 phần tử đầu)
            "hourly": {
                "time": weather_res['hourly']['time'][:24],
                "temperature": weather_res['hourly']['temperature_2m'][:24],
                "weather_code": weather_res['hourly']['weather_code'][:24]
            },
            # Lấy 7 ngày tới
            "daily": {
                "time": weather_res['daily']['time'],
                "temp_max": weather_res['daily']['temperature_2m_max'],
                "temp_min": weather_res['daily']['temperature_2m_min'],
                "weather_code": weather_res['daily']['weather_code']
            }
        }

        return jsonify(final_data)

    except Exception as e:
        print("Lỗi Backend:", e)
        return jsonify({"error": "Không thể lấy dữ liệu API"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)