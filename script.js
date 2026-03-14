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
async function fetchWeatherData(lat, lon) {
    try {
        // LƯU Ý: Vẫn giữ nguyên đường link Render của bạn ở đây
        const response = await fetch(`https://app-d-b-o-th-i-ti-t.onrender.com/api/weather?lat=${lat}&lon=${lon}`);
        const data = await response.json();

        if (data.error) {
            alert("Lỗi từ máy chủ: " + data.error);
            resetButton();
            return;
        }

        // 1. CẬP NHẬT MÀN HÌNH CHÍNH (Xóa sổ lỗi undefined)
        const current = data.current;
        tempEl.innerText = `${current.temperature}°C`;
        humidityEl.innerText = `${current.humidity}%`;
        aqiEl.innerText = current.aqi;
        descEl.innerText = getWeatherDesc(current.weather_code);
        
        if (current.wave_height !== "Không có dữ liệu biển") {
            waveHeightEl.innerText = `${current.wave_height} m`;
        } else {
            waveHeightEl.innerText = "Không có dữ liệu biển";
        }

        // 2. VẼ BIỂU ĐỒ 24 GIỜ TỚI
        const hourlyEl = document.getElementById('hourly-forecast');
        hourlyEl.innerHTML = ''; // Xóa chữ "Đang tải..."
        
        for(let i = 0; i < 24; i++) {
            // Lấy giờ (ví dụ: 14h)
            const timeDate = new Date(data.hourly.time[i]);
            const timeStr = timeDate.getHours() + "h";
            const temp = Math.round(data.hourly.temperature[i]);
            const icon = getWeatherIcon(data.hourly.weather_code[i]);

            hourlyEl.innerHTML += `
                <div class="hourly-item">
                    <p style="color: #7f8c8d;">${timeStr}</p>
                    <p style="font-size: 24px; margin: 8px 0;">${icon}</p>
                    <p style="font-weight: bold; color: #2c3e50;">${temp}°C</p>
                </div>
            `;
        }

        // 3. VẼ DANH SÁCH DỰ BÁO 7 NGÀY
        const dailyEl = document.getElementById('daily-forecast');
        dailyEl.innerHTML = ''; // Xóa chữ "Đang tải..."

        for(let i = 0; i < 7; i++) {
            const dateObj = new Date(data.daily.time[i]);
            // Format ngày thành dạng "Thứ Bảy, 14/3"
            const dayStr = dateObj.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
            
            const icon = getWeatherIcon(data.daily.weather_code[i]);
            const tempMax = Math.round(data.daily.temp_max[i]);
            const tempMin = Math.round(data.daily.temp_min[i]);
            
            // Ngày đầu tiên hiển thị chữ "Hôm nay" cho thân thiện
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
        console.error("Lỗi khi kết nối Backend:", error);
        alert("Không thể kết nối với máy chủ Render.");
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