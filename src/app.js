import { Deck } from '@deck.gl/core';
import { MapView } from '@deck.gl/core';
import { BitmapLayer } from '@deck.gl/layers';
import { TileLayer, _WMSLayer as WMSLayer } from '@deck.gl/geo-layers';
import { WebMercatorViewport } from '@deck.gl/core';

const INITIAL_VIEW_STATE = {
  latitude: 37.5665,
  longitude: 126.978,
  zoom: 12,
  maxZoom: 20,
  maxPitch: 89,
  bearing: 0,
};

const API_URLS = {
  WMTS: 'http://theprost8004.iptime.org:33393/wmts/{z}/{x}/{y}.png',
  WMS: 'http://theprost8004.iptime.org:33392/wms',
};

const WMTS_RENDER_FUNC = (props) => {
  try {
    const [[west, south], [east, north]] = props.tile.boundingBox;
    const { data, ...otherProps } = props;
    if (!data) return null;
    return new BitmapLayer(otherProps, {
      image: data,
      bounds: [west, south, east, north],
    });
  } catch (e) {
    console.error('WMTS renderSubLayers error:', e);
    return null;
  }
};

const createWmtsLayer = (opacity = 0.7) =>
  new TileLayer({
    id: 'wmts-layer',
    data: [API_URLS.WMTS],
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    maxRequests: 20,
    opacity,
    renderSubLayers: WMTS_RENDER_FUNC,
  });

const createWmsLayer = (opacity = 0.7) =>
  new WMSLayer({
    id: 'wms-layer',
    data: API_URLS.WMS,
    serviceType: 'wms',
    layers: ['0'],
    opacity,
  });

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

let wmtsLayer = createWmtsLayer();
let wmsLayer = createWmsLayer();

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

if (opacitySlider) {
  opacitySlider.addEventListener('input', (e) => {
    overlayOpacity = e.target.value / 100;
    opacityValue.textContent = e.target.value;

    if (wmtsEnabled) {
      wmtsLayer.props.opacity = overlayOpacity;
    } else if (wmsEnabled) {
      wmsLayer.props.opacity = overlayOpacity;
    }

    deck.setProps({ layers: getVisibleLayers() });
  });
}
