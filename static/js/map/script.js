/* eslint-disable no-undef */
/**
 * control layers outside the map
 */

// config map
let config = {
  minZoom: 7,
  maxZoom: 18,
  fullscreenControl: true
};
// magnification with which the map will start
const zoom = 18;
// co-ordinates
const lat = 10.8231;
const lng = 106.6297;

// calling map
const map = L.map("map", config).setView([lat, lng], zoom);

// Used to load and display tile layers on the map
// Most tile servers require attribution, which you can set under `Layer`
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Tạo biến để lưu trữ marker vị trí của người dùng
let userLocationMarker;
let userLocationCircle;

// Thêm nút hiển thị vị trí người dùng
const locationButton = L.control({ position: 'topleft' });
locationButton.onAdd = function () {
  const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
  div.innerHTML = '<a href="#" title="Hiển thị vị trí của tôi" style="font-size: 18px;">📍</a>';
  div.style.background = 'white';
  div.style.cursor = 'pointer';

  div.onclick = function () {
    getCurrentLocation();
    return false;
  };

  return div;
};
locationButton.addTo(map);

// Hàm lấy vị trí hiện tại của người dùng
function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      // Thành công
      function (position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        // Xóa marker và circle cũ nếu đã tồn tại
        if (userLocationMarker) {
          map.removeLayer(userLocationMarker);
        }
        if (userLocationCircle) {
          map.removeLayer(userLocationCircle);
        }

        // Tạo marker vị trí người dùng
        userLocationMarker = L.marker([userLat, userLng], {
          icon: L.divIcon({
            className: 'user-location',  // Thêm lớp CSS để tạo kiểu
            html: "<span class='emoji'>📍</span>",  // Biểu tượng vị trí người dùng
            iconSize: [40, 40],  // Điều chỉnh kích thước tổng thể của icon
            iconAnchor: [20, 20],  // Căn giữa icon (x,y vị trí giữa của icon)
            popupAnchor: [0, -25],  // Điều chỉnh vị trí popup
          })
        }).addTo(map)
          .bindPopup('Vị trí của bạn')
          .openPopup();

        // Tạo circle hiển thị độ chính xác
        userLocationCircle = L.circle([userLat, userLng], {
          radius: accuracy,
          color: '#4285F4',
          fillColor: '#4285F4',
          fillOpacity: 0.15
        }).addTo(map);

        // Di chuyển map đến vị trí người dùng
        map.setView([userLat, userLng], zoom);
      },
      // Lỗi
      function (error) {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Người dùng đã từ chối yêu cầu truy cập vị trí.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Thông tin vị trí không có sẵn.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Yêu cầu lấy vị trí người dùng đã hết thời gian.';
            break;
          case error.UNKNOWN_ERROR:
            errorMessage = 'Đã xảy ra lỗi không xác định.';
            break;
        }
        alert(errorMessage);
      },
      // Tùy chọn
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  } else {
    alert('Trình duyệt của bạn không hỗ trợ định vị.');
  }
}

// ------------------------------------------------------------

// async function to load geojson
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
  }
}

// fetching data from geojson
const poiLayers = L.layerGroup().addTo(map);

// center map on the clicked marker
function clickZoom(e) {
  map.setView(e.target.getLatLng(), zoom);
}

let geojsonOpts = {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.divIcon({
        className: "cinema-icon", // Sử dụng CSS để làm đẹp
        html: "<span class='emoji'>🎥</span>", // Chỉ hiển thị emoji
        iconSize: [40, 40], // Kích thước tổng thể
        iconAnchor: [20, 20], // Căn giữa icon
        popupAnchor: [0, -25], // Điều chỉnh vị trí popup
      }),
    })
      .bindPopup(
        "🎥 Rạp chiếu phim" +
        "<br><b>" +
        feature.properties.name +
        "</b>"
      )
      .on("click", clickZoom);
  }
};
const layersContainer = document.querySelector(".layers");

const layersButton = "all layers";

function generateButton(name) {
  const id = name === layersButton ? "all-layers" : name;

  const templateLayer = `
    <li class="layer-element">
      <label for="${id}">
        <input type="checkbox" id="${id}" name="item" class="item" value="${name}" checked>
        <span>${name}</span>
      </label>
    </li>
  `;

  layersContainer.insertAdjacentHTML("beforeend", templateLayer);

  // Đảm bảo sự kiện được thêm sau khi nút được tạo ra
  const checkbox = document.querySelector(`#${id}`);
  checkbox.addEventListener("change", (e) => {
    console.log(`${name} checkbox clicked. Checked: ${e.target.checked}`);
    showHideLayer(e.target);
  });
}

generateButton(layersButton);

// add data to geoJSON layer and add to LayerGroup
const arrayLayers = ["cinema"]; // Changed to include only "cinema"

arrayLayers.map((json) => {
  generateButton(json);
  fetchData(`/static/data/${json}.json`).then((data) => {
    window["layer_" + json] = L.geoJSON(data, geojsonOpts).addTo(map);
  });
});

document.addEventListener("click", (e) => {
  const target = e.target;

  const itemInput = target.closest(".item");

  if (!itemInput) return;

  console.log("Checkbox clicked:", target); // Kiểm tra khi checkbox được nhấn
  showHideLayer(target);
});

function showHideLayer(target) {
  console.log("showHideLayer called for:", target.id); // Kiểm tra hàm showHideLayer

  if (target.id === "all-layers") {
    console.log("All layers checkbox changed.");
    arrayLayers.map((json) => {
      checkedType(json, target.checked);
    });
  } else {
    checkedType(target.id, target.checked);
  }
  const checkedBoxes = document.querySelectorAll("input[name=item]:checked");
  document.querySelector("#all-layers").checked =
    checkedBoxes.length - (document.querySelector("#all-layers").checked === true ? 1 : 0) < 1 ? false : true;
}
function checkedType(id, type) {
  console.log("checkedType called for:", id, type); // Kiểm tra xem có thêm hoặc xóa layer không
  map[type ? "addLayer" : "removeLayer"](window["layer_" + id]);

  if (window["layer_" + id]) {
    map.fitBounds(window["layer_" + id].getBounds(), { padding: [50, 50] });
  }

  document.querySelector(`#${id}`).checked = type;
}
// Thêm thư viện Leaflet Routing Machine nếu chưa có
// < link rel = "stylesheet" href = "https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.css" />
//   <script src="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js"></script>
let routingControl; // Biến lưu tuyến đường
// Hàm chỉ đường từ vị trí hiện tại đến một điểm đích (rạp chiếu phim)
function routeToDestination(destination) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        // Xóa tuyến đường cũ nếu có
        if (routingControl) {
          map.removeControl(routingControl);
        }
        //Tạo tuyến đường mới
        routingControl = L.Routing.control({
          waypoints: [L.latLng(userLat, userLng), destination], // Từ vị trí người dùng đến rạp
          routeWhileDragging: true,
          createMarker: function () { return null; }, // Không hiển thị marker mặc định
        }).addTo(map);
      },
      function () {
        alert("Không thể lấy vị trí của bạn!");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  } else {
    alert("Trình duyệt của bạn không hỗ trợ định vị.");
  }
}
// Cập nhật sự kiện click trên rạp chiếu phim
geojsonOpts = {
  pointToLayer: function (feature, latlng) {
    let iconHtml = "🎥"; // Biểu tượng rạp chiếu phim
    return L.marker(latlng, {
      icon: L.divIcon({
        className: "cinema-icon", // Sử dụng CSS để làm đẹp
        html: "<span class='emoji'>🎥</span>", // Chỉ hiển thị emoji
        iconSize: [40, 40], // Kích thước tổng thể
        iconAnchor: [20, 20], // Căn giữa icon
        popupAnchor: [0, -25], // Điều chỉnh vị trí popup
      }),
    })
      .bindPopup(`<b>Rạp chiếu phim:</b> ${feature.properties.name} <br><button onclick="routeToDestination([${latlng.lat}, ${latlng.lng}])">Chỉ đường</button>`)
      .on("click", function () {
        map.setView(latlng, zoom);
      });
  },
};


