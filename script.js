// 1. KẾT NỐI VỚI GIAO DIỆN (DOM Elements)
// Lấy các phần tử HTML để sau này thay đổi nội dung bên trong nó
const btnRefresh = document.getElementById('refresh-btn');
const cityNameEl = document.getElementById('city-name');
const dateTimeEl = document.getElementById('date-time');
const tempEl = document.getElementById('temperature');
const descEl = document.getElementById('weather-desc');
const humidityEl = document.getElementById('humidity');
const aqiEl = document.getElementById('aqi');
const waveHeightEl = document.getElementById('wave-height');

// 2. HÀM CẬP NHẬT NGÀY GIỜ HIỆN TẠI
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    dateTimeEl.innerText = now.toLocaleDateString('vi-VN', options);
}

// 3. BẮT SỰ KIỆN CLICK NÚT BẤM
btnRefresh.addEventListener('click', () => {
    // Đổi chữ trên nút để người dùng biết app đang hoạt động
    btnRefresh.innerText = "⏳ Đang lấy vị trí...";
    btnRefresh.disabled = true; // Khóa nút tạm thời tránh bấm nhiều lần

    // Kiểm tra xem trình duyệt có hỗ trợ định vị (Geolocation) không
    if (navigator.geolocation) {
        // Yêu cầu lấy tọa độ. Nếu thành công gọi hàm success, thất bại gọi hàm error
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    } else {
        alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
        resetButton();
    }
});

// 4. KHI LẤY GPS THÀNH CÔNG
async function onSuccess(position) {
    // Trích xuất Vĩ độ (lat) và Kinh độ (lon)
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Hiển thị tọa độ ra màn hình (Tạm thời thay cho tên thành phố)
    cityNameEl.innerText = `Vị trí: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    updateDateTime();

    btnRefresh.innerText = "☁️ Đang tải dữ liệu...";

    // Gọi hàm fetch dữ liệu từ API
    await fetchWeatherData(lat, lon);
}

// 5. KHI LẤY GPS THẤT BẠI (Người dùng từ chối cấp quyền)
function onError(error) {
    alert("Không thể lấy vị trí. Vui lòng cấp quyền định vị cho trình duyệt.");
    resetButton();
}

// 6. HÀM GỌI API BẰNG FETCH (Giải thích với giáo viên đây là Bất đồng bộ - Async/Await)
// Hàm phụ trợ: Chuyển đổi mã thời tiết thành Icon
function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code > 0 && code <= 3) return "⛅";
    if (code >= 50 && code <= 69) return "🌧️";
    if (code >= 70 && code <= 79) return "❄️";
    if (code >= 95) return "⛈️";
    return "☁️";
}

// Hàm phụ trợ: Chuyển đổi mã thời tiết thành chữ
function getWeatherDesc(code) {
    if (code === 0) return "Trời quang đãng";
    if (code > 0 && code <= 3) return "Có mây";
    if (code >= 50 && code <= 69) return "Có mưa";
    if (code >= 70 && code <= 79) return "Có tuyết";
    if (code >= 95) return "Có sấm sét";
    return "Hơi thất thường";
}

// HÀM CHÍNH ĐỂ LẤY VÀ HIỂN THỊ DỮ LIỆU
// Hàm phụ trợ: Chuyển đổi mã thời tiết thành Icon
function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code > 0 && code <= 3) return "⛅";
    if (code >= 50 && code <= 69) return "🌧️";
    if (code >= 70 && code <= 79) return "❄️";
    if (code >= 95) return "⛈️";
    return "☁️";
}

// Hàm phụ trợ: Chuyển đổi mã thời tiết thành chữ
function getWeatherDesc(code) {
    if (code === 0) return "Trời quang đãng";
    if (code > 0 && code <= 3) return "Có mây";
    if (code >= 50 && code <= 69) return "Có mưa";
    if (code >= 70 && code <= 79) return "Có tuyết";
    if (code >= 95) return "Có sấm sét";
    return "Hơi thất thường";
}

async function fetchWeatherData(lat, lon) {
    try {
        // 1. GỌI TRỰC TIẾP OPEN-METEO TỪ TRÌNH DUYỆT CỦA BẠN (Tránh lỗi IP của Render)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height`;
        
        // Gọi 2 API cùng lúc cho nhanh
        const [weatherRes, marineRes] = await Promise.all([
            fetch(weatherUrl),
            fetch(marineUrl)
        ]);
        
        const weatherData = await weatherRes.json();
        const marineData = await marineRes.json();

        // 2. GỌI RENDER CHỈ ĐỂ LẤY AQI (Vì cần giấu API Key WAQI)
        // !!! NHỚ SỬA LẠI ĐƯỜNG LINK RENDER CỦA BẠN VÀO ĐÂY VÀ ĐỔI ĐUÔI THÀNH /api/aqi !!!
        const aqiRes = await fetch(`https://app-d-b-o-th-i-ti-t.onrender.com/api/aqi?lat=${lat}&lon=${lon}`);
        const aqiData = await aqiRes.json();


        // 3. ĐỔ DỮ LIỆU LÊN MÀN HÌNH CHÍNH
        const current = weatherData.current;
        tempEl.innerText = `${Math.round(current.temperature_2m)}°C`;
        humidityEl.innerText = `${current.relative_humidity_2m}%`;
        descEl.innerText = getWeatherDesc(current.weather_code);
        
        // Hiện AQI từ Render
        aqiEl.innerText = aqiData.aqi || "--";

        // Hiện dữ liệu sóng
        const waveHeight = marineData.current?.wave_height;
        if (waveHeight !== undefined && waveHeight !== null) {
            waveHeightEl.innerText = `${waveHeight} m`;
        } else {
            waveHeightEl.innerText = "Không có dữ liệu biển";
        }

        // 4. VẼ BIỂU ĐỒ 24 GIỜ TỚI
        const hourlyEl = document.getElementById('hourly-forecast');
        hourlyEl.innerHTML = ''; 
        
        for(let i = 0; i < 24; i++) {
            const timeDate = new Date(weatherData.hourly.time[i]);
            const timeStr = timeDate.getHours() + "h";
            const temp = Math.round(weatherData.hourly.temperature_2m[i]);
            const icon = getWeatherIcon(weatherData.hourly.weather_code[i]);

            hourlyEl.innerHTML += `
                <div class="hourly-item">
                    <p style="color: #7f8c8d;">${timeStr}</p>
                    <p style="font-size: 24px; margin: 8px 0;">${icon}</p>
                    <p style="font-weight: bold; color: #2c3e50;">${temp}°C</p>
                </div>
            `;
        }

        // 5. VẼ DANH SÁCH 7 NGÀY
        const dailyEl = document.getElementById('daily-forecast');
        dailyEl.innerHTML = ''; 

        for(let i = 0; i < 7; i++) {
            const dateObj = new Date(weatherData.daily.time[i]);
            const dayStr = dateObj.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
            const icon = getWeatherIcon(weatherData.daily.weather_code[i]);
            const tempMax = Math.round(weatherData.daily.temperature_2m_max[i]);
            const tempMin = Math.round(weatherData.daily.temperature_2m_min[i]);
            const displayDay = (i === 0) ? "Hôm nay" : dayStr;

            dailyEl.innerHTML += `
                <div class="daily-item">
                    <span style="min-width: 90px; color: #7f8c8d;">${displayDay}</span>
                    <span class="icon">${icon}</span>
                    <span class="temps">${tempMin}°C / ${tempMax}°C</span>
                </div>
            `;
        }

        resetButton();

    } catch (error) {
        console.error("Lỗi:", error);
        alert("Có lỗi xảy ra khi tải dữ liệu thời tiết.");
        resetButton();
    }
}

// Hàm phụ để khôi phục trạng thái nút bấm
function resetButton() {
    btnRefresh.innerText = "📍 Lấy vị trí & Cập nhật dữ liệu";
    btnRefresh.disabled = false;
}

// Chạy hàm cập nhật ngày giờ ngay khi vừa mở web
updateDateTime();