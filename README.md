# deck.gl WMTS/WMS Example

블루맵의 테스트 WMTS/WMS 서비스를 deck.gl에서 렌더링하는 예제입니다.

## 기능

- **OSM 기본 지도** - OpenStreetMap 타일을 배경으로 사용
- **WMTS 오버레이** - 블루맵 WMTS 테스트 서버 통합
- **WMS 오버레이** - 블루맵 WMS 테스트 서버 통합
- **투명도 조절** - WMTS/WMS 레이어의 투명도를 0~100% 범위에서 조정
- **좌표 표시** - 마우스 위치의 위도/경도 실시간 표시

## 제한사항

- 동적 방식의 WMTS를 사용하여 느린 이미지 제공 속도(WMS 권장, 향후 정적으로 개선 예정)
- 테스트 용도로 서비스 다운 발생 가능(다운 시 블루맵 담당자에게 문의)

## 빠른 시작

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm start
```

`http://localhost:8080` 에서 지도를 확인할 수 있습니다.

### 프로덕션 빌드

```bash
npm run build
```

`dist/` 폴더에 번들 파일이 생성됩니다.

## 구조

- `src/app.js` - 메인 로직 (deck.gl 초기화, 레이어 관리, UI 이벤트)
- `index.html` - HTML 템플릿
- `webpack.config.js` - 웹팩 설정

## 테스트 서버 정보

- **WMTS**: `http://theprost8004.iptime.org:33393/wmts/{z}/{x}/{y}.png`
- **WMS**: `http://theprost8004.iptime.org:33392/wms`

## 필수 환경

- Node.js 14+

## 사용법

1. 지도에서 드래그하여 이동, 스크롤하여 줌 조절
2. **WMTS: OFF** 버튼으로 WMTS 레이어 활성화/비활성화
3. **WMS: OFF** 버튼으로 WMS 레이어 활성화/비활성화
4. 슬라이더로 오버레이 투명도 조절
5. 마우스 위치의 좌표가 좌측 상단에 표시됨
