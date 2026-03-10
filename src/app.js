import { Deck } from '@deck.gl/core';
import { MapView } from '@deck.gl/core';
import { BitmapLayer } from '@deck.gl/layers';
import { TileLayer, _WMSLayer as WMSLayer } from '@deck.gl/geo-layers';

const INITIAL_VIEW_STATE = {
  latitude: 37.5665,
  longitude: 126.978,
  zoom: 12,
  maxZoom: 20,
  maxPitch: 89,
  bearing: 0,
};

// Ensure map container exists and has proper styling
const mapContainer = document.getElementById('map');
if (!mapContainer) {
  throw new Error('#map container not found');
}

const osmLayer = new TileLayer({
  id: 'osm-layer',
  data: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
  minZoom: 0,
  maxZoom: 19,
  tileSize: 256,
  maxRequests: 20,

  renderSubLayers: (props) => {
    const [[west, south], [east, north]] = props.tile.boundingBox;
    const { data, ...otherProps } = props;

    if (!data) {
      return null;
    }
    return new BitmapLayer(otherProps, {
      image: data,
      bounds: [west, south, east, north],
    });
  },
});

// WMTS 레이어
let wmtsLayer = new TileLayer({
  id: 'wmts-layer',
  data: ['http://59.27.61.194:30020/wmts/{z}/{x}/{y}.png'],
  minZoom: 0,
  maxZoom: 19,
  tileSize: 256,
  maxRequests: 20,
  opacity: 0.7,

  renderSubLayers: (props) => {
    try {
      const [[west, south], [east, north]] = props.tile.boundingBox;
      const { data, ...otherProps } = props;

      if (!data) {
        return null;
      }

      return new BitmapLayer(otherProps, {
        image: data,
        bounds: [west, south, east, north],
      });
    } catch (e) {
      console.error('WMTS renderSubLayers error:', e);
      return null;
    }
  },
});

// WMS 레이어
let wmsLayer = new WMSLayer({
  id: 'wms-layer',
  data: 'http://59.27.61.194:30020/wms',
  serviceType: 'wms',
  layers: ['0'],
  opacity: 0.7,
});

// WMTS/WMS on/off 제어
let wmtsEnabled = false;
let wmsEnabled = false;
let overlayOpacity = 0.7;

const getVisibleLayers = () => {
  if (wmtsEnabled) {
    return [osmLayer, wmtsLayer];
  } else if (wmsEnabled) {
    return [osmLayer, wmsLayer];
  }
  return [osmLayer];
};

const deckConfig = {
  container: 'map',
  width: mapContainer.offsetWidth,
  height: mapContainer.offsetHeight,
  initialViewState: INITIAL_VIEW_STATE,
  controller: true,
  views: new MapView({ repeat: true }),
  layers: getVisibleLayers(),
};

const deck = new Deck(deckConfig);

// 마우스 좌표 표시
import { WebMercatorViewport } from '@deck.gl/core';

const coordElement = document.getElementById('coordinates');

// canvas에서 직접 mousemove 이벤트 리스닝
deck.canvas.addEventListener('mousemove', (e) => {
  const rect = deck.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 현재 뷰스테이트 가져오기
  const viewState = deck.viewState;
  if (!viewState) return;

  // WebMercatorViewport 생성
  const viewport = new WebMercatorViewport({
    width: deck.canvas.width,
    height: deck.canvas.height,
    latitude: viewState.latitude,
    longitude: viewState.longitude,
    zoom: viewState.zoom,
    pitch: viewState.pitch,
    bearing: viewState.bearing,
  });

  // 픽셀 좌표를 지리 좌표로 변환
  const [lon, lat] = viewport.unproject([x, y]);
  coordElement.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
});

// WMS/WMTS 토글 버튼
const wmtsToggle = document.getElementById('wmts-toggle');
const wmsToggle = document.getElementById('wms-toggle');
const opacityContainer = document.getElementById('opacity-container');
const opacitySlider = document.getElementById('opacity-slider');
const opacityValue = document.getElementById('opacity-value');

if (wmtsToggle) {
  wmtsToggle.addEventListener('click', () => {
    wmtsEnabled = !wmtsEnabled;
    if (wmtsEnabled) {
      wmsEnabled = false;
      if (wmsToggle) wmsToggle.textContent = 'WMS: OFF';
    }
    deck.setProps({
      layers: getVisibleLayers(),
    });
    wmtsToggle.textContent = wmtsEnabled ? 'WMTS: ON' : 'WMTS: OFF';
    opacityContainer.classList.toggle('active', wmtsEnabled || wmsEnabled);
  });
}

if (wmsToggle) {
  wmsToggle.addEventListener('click', () => {
    wmsEnabled = !wmsEnabled;
    if (wmsEnabled) {
      wmtsEnabled = false;
      if (wmtsToggle) wmtsToggle.textContent = 'WMTS: OFF';
    }
    deck.setProps({
      layers: getVisibleLayers(),
    });
    wmsToggle.textContent = wmsEnabled ? 'WMS: ON' : 'WMS: OFF';
    opacityContainer.classList.toggle('active', wmtsEnabled || wmsEnabled);
  });
}

// 투명도 슬라이더 (WMS/WMTS 공유)
if (opacitySlider) {
  opacitySlider.addEventListener('input', (e) => {
    const opacityPercent = e.target.value;
    overlayOpacity = opacityPercent / 100;

    opacityValue.textContent = opacityPercent;

    if (wmtsEnabled) {
      // Recreate wmtsLayer with new opacity
      wmtsLayer = new TileLayer({
        id: 'wmts-layer',
        data: ['http://59.27.61.194:30020/wmts/{z}/{x}/{y}.png'],
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        maxRequests: 20,
        opacity: overlayOpacity,

        renderSubLayers: (props) => {
          try {
            const [[west, south], [east, north]] = props.tile.boundingBox;
            const { data, ...otherProps } = props;

            if (!data) {
              return null;
            }

            return new BitmapLayer(otherProps, {
              image: data,
              bounds: [west, south, east, north],
            });
          } catch (e) {
            console.error('WMTS renderSubLayers error:', e);
            return null;
          }
        },
      });
    } else if (wmsEnabled) {
      // Recreate wmsLayer with new opacity
      wmsLayer = new WMSLayer({
        id: 'wms-layer',
        data: 'http://59.27.61.194:30020/wms',
        serviceType: 'wms',
        layers: ['0'],
        opacity: overlayOpacity,
      });
    }

    deck.setProps({
      layers: getVisibleLayers(),
    });
  });
}
