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
// Hàm gọi dữ liệu từ Backend Python
async function fetchWeatherData(lat, lon) {
    try {
       const response = await fetch(`http://127.0.0.1:5000/api/weather?lat=${lat}&lon=${lon}`);
        const data = await response.json();

        if (data.error) {
            alert("Lỗi từ máy chủ: " + data.error);
            resetButton();
            return;
        }

        // Cập nhật giao diện với toàn bộ dữ liệu thật
        tempEl.innerText = `${data.temperature}°C`;
        humidityEl.innerText = `${data.humidity}%`;
        aqiEl.innerText = data.aqi; // Hiển thị chỉ số AQI lấy bằng API Key của bạn
        
        // Cập nhật thông tin biển
        if (data.wave_height !== "Không có dữ liệu biển") {
            waveHeightEl.innerText = `${data.wave_height} m`;
        } else {
            waveHeightEl.innerText = "Không có dữ liệu biển";
        }

        // Diễn giải mã thời tiết
        const code = data.weather_code;
        if (code === 0) descEl.innerText = "☀️ Trời quang đãng";
        else if (code > 0 && code <= 3) descEl.innerText = "⛅ Có mây";
        else if (code >= 50 && code <= 69) descEl.innerText = "🌧️ Có mưa";
        else descEl.innerText = "Hơi thất thường";

        resetButton();

    } catch (error) {
        console.error("Lỗi khi kết nối Backend:", error);
        alert("Không thể kết nối với máy chủ Python. Hãy chắc chắn bạn đã gõ lệnh 'python app.py' trong Terminal.");
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