const Map = await $arcgis.import("@arcgis/core/Map.js");
const Basemap = await $arcgis.import("@arcgis/core/Basemap.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const WMTSLayer = await $arcgis.import("@arcgis/core/layers/WMTSLayer.js");
const UniqueValueRenderer = await $arcgis.import("@arcgis/core/renderers/UniqueValueRenderer.js");
const CIMSymbol = await $arcgis.import("@arcgis/core/symbols/CIMSymbol.js");

function createWalkSymbol(scale) {
	let scaleFactor = 1;

	if (scale <= 20000) {
		scaleFactor = 1.75;
	} else if (scale <= 50000) {
		scaleFactor = 1.5;
	} else if (scale <= 100000) {
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
						width: 2.5 * scaleFactor,
						color: [190, 226, 98, 255],
					},
					{
						type: "CIMSolidStroke",
						enable: true,
						capStyle: "ROUND",
						joinStyle: "ROUND",
						width: 4 * scaleFactor,
						color: [153, 188, 66, 255],
					},
				],
			},
		},
	});
}

const routeRenderer = new UniqueValueRenderer({
	field: "kategorie",
	uniqueValueInfos: [
		{
			value: "wanderung",
			symbol: createWalkSymbol(50000),
		},
	],
});

const viewElement = document.querySelector("arcgis-map");
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
	url: "https://services1.arcgis.com/46913CWHRFmfQUln/arcgis/rest/services/oa_routenauszug_fuer_tests/FeatureServer/0",
	outFields: ["*"],
	opacity: 0.9,
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
routeLayerToggle.addEventListener("change", () => {
	outdooractiveRoutes.visible = routeLayerToggle.checked;
});

const updateRouteSymbolForScale = () => {
	const currentScale = viewElement.view.scale;
	routeRenderer.uniqueValueInfos = [
		{
			value: "wanderung",
			symbol: createWalkSymbol(currentScale),
		},
	];
	outdooractiveRoutes.renderer = routeRenderer;
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
