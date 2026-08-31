const Map = await $arcgis.import("@arcgis/core/Map.js");
const Basemap = await $arcgis.import("@arcgis/core/Basemap.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const WMTSLayer = await $arcgis.import("@arcgis/core/layers/WMTSLayer.js");
const UniqueValueRenderer = await $arcgis.import("@arcgis/core/renderers/UniqueValueRenderer.js");
const CIMSymbol = await $arcgis.import("@arcgis/core/symbols/CIMSymbol.js");

const ROUTE_SERVICE_URL = "https://services1.arcgis.com/46913CWHRFmfQUln/arcgis/rest/services/oa_routenauszug_fuer_tests/FeatureServer/0";
const ROUTE_FIELD = "kategorie";
const WANDERUNG_CATEGORY = "wanderung";
const THEMENWEG_CATEGORY = "themenweg";
const SCALES = {
	veryClose: 20000,
	close: 50000,
	medium: 100000,
};

const ROUTE_COLORS = {
	[WANDERUNG_CATEGORY]: {
		fade: [190, 226, 98, 255],
		main: [153, 188, 66, 255],
	},
	[THEMENWEG_CATEGORY]: {
		fade: [180, 209, 105, 255],
		main: [126, 155, 55, 255],
	},
};

function createTrailSymbol(scale, colors = ROUTE_COLORS[WANDERUNG_CATEGORY]) {
	let scaleFactor = 1;

	if (scale <= SCALES.veryClose) {
		scaleFactor = 1.75;
	} else if (scale <= SCALES.close) {
		scaleFactor = 1.5;
	} else if (scale <= SCALES.medium) {
		scaleFactor = 1.25;
	}

	return new CIMSymbol({
		data: {
			type: "CIMSymbolReference",
			symbol: {
				type: "CIMLineSymbol",
				symbolLayers: [
					{
						type: "CIMSolidStroke",
						enable: true,
						capStyle: "ROUND",
						joinStyle: "ROUND",
						width: 1 * scaleFactor,
						color: [255, 255, 255, 255],
					},
					{
						type: "CIMSolidStroke",
						enable: true,
						capStyle: "ROUND",
						joinStyle: "ROUND",
						width: 2 * scaleFactor,
						color: colors.fade,
					},
					{
						type: "CIMSolidStroke",
						enable: true,
						capStyle: "ROUND",
						joinStyle: "ROUND",
						width: 4 * scaleFactor,
						color: colors.main,
					},
				],
			},
		},
	});
}

const routeRenderer = new UniqueValueRenderer({
	field: ROUTE_FIELD,
	uniqueValueInfos: [
		{
			value: WANDERUNG_CATEGORY,
			symbol: createTrailSymbol(50000, ROUTE_COLORS[WANDERUNG_CATEGORY]),
		},
		{
			value: THEMENWEG_CATEGORY,
			symbol: createTrailSymbol(50000, ROUTE_COLORS[THEMENWEG_CATEGORY]),
		},
	],
});

const viewElement = document.querySelector("arcgis-map");
const mapView = viewElement.view;
viewElement.spatialReference = { wkid: 2056 };
viewElement.center = {
	type: "point",
	x: 2655870,
	y: 1135174,
	spatialReference: {
		wkid: 2056,
	},
};
viewElement.scale = 50000;

const outdooractiveRoutes = new FeatureLayer({
	url: ROUTE_SERVICE_URL,
	outFields: ["*"],
	opacity: 1,
	title: "Outdooractive test routes",
	renderer: routeRenderer,
	visible: true,
});

const swisstopoWmts = new WMTSLayer();
swisstopoWmts.url = "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml";
swisstopoWmts.activeLayer = { id: "ch.swisstopo.pixelkarte-farbe" };
swisstopoWmts.copyright = "swisstopo";
const basemapPixelkarte = new Basemap({
	baseLayers: [swisstopoWmts],
	title: "Pixelkarte farbig",
	id: "swisstopo-pixelkarte-farbe",
});

const basemapPixelkarteGrau = new Basemap({
	baseLayers: [createSwisstopoWmts("ch.swisstopo.pixelkarte-grau")],
	title: "Pixelkarte grau",
	id: "swisstopo-pixelkarte-grau",
});

const basemapSwissimage = new Basemap({
	baseLayers: [createSwisstopoWmts("ch.swisstopo.swissimage")],
	title: "Swissimage",
	id: "swisstopo-swissimage",
});

viewElement.map = new Map({
	basemap: basemapPixelkarte,
	layers: [outdooractiveRoutes],
});
await viewElement.viewOnReady();

const basemapGallery = document.querySelector("arcgis-basemap-gallery");
basemapGallery.source = [basemapPixelkarte, basemapPixelkarteGrau, basemapSwissimage];
basemapGallery.activeBasemap = basemapPixelkarte;

const routeLayerToggle = document.getElementById("route-layer-toggle");
routeLayerToggle?.addEventListener("change", () => {
	outdooractiveRoutes.visible = routeLayerToggle.checked;
});

const scaleValueElement = document.getElementById("scale-value");
const updateScaleReadout = () => {
	const currentScale = Math.round(viewElement.view.scale);
	scaleValueElement.textContent = currentScale.toLocaleString("en-US");
};

const updateRouteSymbolForScale = () => {
	const currentScale = viewElement.view.scale;
	routeRenderer.uniqueValueInfos = [
		{
			value: WANDERUNG_CATEGORY,
			symbol: createTrailSymbol(currentScale, ROUTE_COLORS[WANDERUNG_CATEGORY]),
		},
		{
			value: THEMENWEG_CATEGORY,
			symbol: createTrailSymbol(currentScale, ROUTE_COLORS[THEMENWEG_CATEGORY]),
		},
	];
	outdooractiveRoutes.renderer = routeRenderer;
	updateScaleReadout();
};

viewElement.view.watch("scale", updateRouteSymbolForScale);
updateRouteSymbolForScale();

function createSwisstopoWmts(layerId) {
	const wmts = new WMTSLayer();
	wmts.url = "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml";
	wmts.activeLayer = { id: layerId };
	wmts.copyright = "swisstopo";
	return wmts;
}
