const Map = await $arcgis.import("@arcgis/core/Map.js");
const Basemap = await $arcgis.import("@arcgis/core/Basemap.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const WMTSLayer = await $arcgis.import("@arcgis/core/layers/WMTSLayer.js");
const UniqueValueRenderer = await $arcgis.import("@arcgis/core/renderers/UniqueValueRenderer.js");
const CIMSymbol = await $arcgis.import("@arcgis/core/symbols/CIMSymbol.js");

const TRAIL_SERVICE_URL = "https://services1.arcgis.com/46913CWHRFmfQUln/arcgis/rest/services/oa_routenauszug_fuer_tests/FeatureServer/0";
const TRAIL_FIELD = "kategorie";
const WANDERUNG_CATEGORY = "wanderung";
const THEMENWEG_CATEGORY = "themenweg";
const MOUNTAINBIKE_ROUTE_CATEGORY = "mountainbike_route";
const SCALES = {
	veryClose: 20000,
	close: 50000,
	medium: 100000,
};

const TRAIL_COLORS = {
	[WANDERUNG_CATEGORY]: {
		fade: [190, 226, 98, 255],
		main: [153, 188, 66, 255],
	},
	[THEMENWEG_CATEGORY]: {
		fade: [180, 209, 105, 255],
		main: [126, 155, 55, 255],
	},
	[MOUNTAINBIKE_ROUTE_CATEGORY]: {
		fade: [252, 222, 138, 255],
		main: [221, 188, 107, 255],
	},
};

function createTrailSymbol(scale, colors = TRAIL_COLORS[WANDERUNG_CATEGORY]) {
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
						capType: "ROUND",
						joinType: "ROUND",
						width: 1 * scaleFactor,
						color: [255, 255, 255, 255],
					},
					{
						type: "CIMSolidStroke",
						enable: true,
						capType: "ROUND",
						joinType: "ROUND",
						width: 2 * scaleFactor,
						color: colors.fade,
					},
					{
						type: "CIMSolidStroke",
						enable: true,
						capType: "ROUND",
						joinType: "ROUND",
						width: 4 * scaleFactor,
						color: colors.main,
					},
				],
			},
		},
	});
}

const createCategoryRenderer = (category) => {
	return new UniqueValueRenderer({
		field: TRAIL_FIELD,
		uniqueValueInfos: [
			{
				value: category,
				symbol: createTrailSymbol(50000, TRAIL_COLORS[category]),
			},
		],
	});
};

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

const mountainbikeTrails = new FeatureLayer({
	url: TRAIL_SERVICE_URL,
	outFields: ["*"],
	opacity: 1,
	title: "Mountainbike Trails",
	renderer: createCategoryRenderer(MOUNTAINBIKE_ROUTE_CATEGORY),
	visible: true,
	filter: {
		where: `${TRAIL_FIELD} = '${MOUNTAINBIKE_ROUTE_CATEGORY}'`,
	},
});

const wanderungTrails = new FeatureLayer({
	url: TRAIL_SERVICE_URL,
	outFields: ["*"],
	opacity: 1,
	title: "Wanderung Trails",
	renderer: createCategoryRenderer(WANDERUNG_CATEGORY),
	visible: true,
	filter: {
		where: `${TRAIL_FIELD} = '${WANDERUNG_CATEGORY}'`,
	},
});

const themenwegTrails = new FeatureLayer({
	url: TRAIL_SERVICE_URL,
	outFields: ["*"],
	opacity: 1,
	title: "Themenweg Trails",
	renderer: createCategoryRenderer(THEMENWEG_CATEGORY),
	visible: true,
	filter: {
		where: `${TRAIL_FIELD} = '${THEMENWEG_CATEGORY}'`,
	},
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
	layers: [mountainbikeTrails, wanderungTrails, themenwegTrails],
});
await viewElement.viewOnReady();

const basemapGallery = document.querySelector("arcgis-basemap-gallery");
basemapGallery.source = [basemapPixelkarte, basemapPixelkarteGrau, basemapSwissimage];
basemapGallery.activeBasemap = basemapPixelkarte;

const trailLayerToggle = document.getElementById("trail-layer-toggle");
trailLayerToggle?.addEventListener("change", () => {
	mountainbikeTrails.visible = trailLayerToggle.checked;
	wanderungTrails.visible = trailLayerToggle.checked;
	themenwegTrails.visible = trailLayerToggle.checked;
});

const scaleValueElement = document.getElementById("scale-value");
const updateScaleReadout = () => {
	const currentScale = Math.round(viewElement.view.scale);
	scaleValueElement.textContent = currentScale.toLocaleString("en-US");
};

const updateTrailsymbolForScale = () => {
	const currentScale = viewElement.view.scale;
	mountainbikeTrails.renderer = createCategoryRenderer(MOUNTAINBIKE_ROUTE_CATEGORY);
	mountainbikeTrails.renderer.uniqueValueInfos[0].symbol = createTrailSymbol(currentScale, TRAIL_COLORS[MOUNTAINBIKE_ROUTE_CATEGORY]);
	wanderungTrails.renderer = createCategoryRenderer(WANDERUNG_CATEGORY);
	wanderungTrails.renderer.uniqueValueInfos[0].symbol = createTrailSymbol(currentScale, TRAIL_COLORS[WANDERUNG_CATEGORY]);
	themenwegTrails.renderer = createCategoryRenderer(THEMENWEG_CATEGORY);
	themenwegTrails.renderer.uniqueValueInfos[0].symbol = createTrailSymbol(currentScale, TRAIL_COLORS[THEMENWEG_CATEGORY]);
	updateScaleReadout();
};

viewElement.view.watch("scale", updateTrailsymbolForScale);
updateTrailsymbolForScale();

function createSwisstopoWmts(layerId) {
	const wmts = new WMTSLayer();
	wmts.url = "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml";
	wmts.activeLayer = { id: layerId };
	wmts.copyright = "swisstopo";
	return wmts;
}
