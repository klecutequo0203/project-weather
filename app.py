from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

# Tải file .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# Lấy API key của hệ thống Chất lượng không khí từ file .env
WAQI_KEY = os.getenv('WAQI_API_KEY')

@app.route('/api/weather', methods=['GET'])
def get_weather_data():
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not lat or not lon:
        return jsonify({"error": "Thiếu thông tin tọa độ"}), 400

    try:
        # 1. Gọi API Thời tiết & Độ ẩm (Open-Meteo)
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code"
        weather_res = requests.get(weather_url).json()

        # 2. Gọi API Hải văn (Open-Meteo Marine) - Miễn phí không cần Key
        marine_url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&current=wave_height"
        marine_res = requests.get(marine_url).json()
        
        # Bắt lỗi nếu vị trí ở trên đất liền không có dữ liệu sóng
        wave_height = marine_res.get('current', {}).get('wave_height')
        if wave_height is None:
            wave_height = "Không có dữ liệu biển"

        # 3. Gọi API Chất lượng không khí (WAQI) bằng Key của bạn
        waqi_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_KEY}"
        waqi_res = requests.get(waqi_url).json()

        aqi_value = "Đang cập nhật"
        if waqi_res.get('status') == 'ok':
            aqi_value = waqi_res['data']['aqi']

        # 4. Gom tất cả lại và gửi về cho Frontend
        final_data = {
            "temperature": weather_res['current']['temperature_2m'],
            "humidity": weather_res['current']['relative_humidity_2m'],
            "weather_code": weather_res['current']['weather_code'],
            "wave_height": wave_height,
            "aqi": aqi_value
        }

        return jsonify(final_data)

    except Exception as e:
        print("Lỗi Backend:", e)
        return jsonify({"error": "Không thể lấy dữ liệu từ các máy chủ ngoài"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)