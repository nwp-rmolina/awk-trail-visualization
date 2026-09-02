const Map = await $arcgis.import("@arcgis/core/Map.js");
const Basemap = await $arcgis.import("@arcgis/core/Basemap.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const WMTSLayer = await $arcgis.import("@arcgis/core/layers/WMTSLayer.js");
const UniqueValueRenderer = await $arcgis.import("@arcgis/core/renderers/UniqueValueRenderer.js");
const CIMSymbol = await $arcgis.import("@arcgis/core/symbols/CIMSymbol.js");

const TRAIL_SERVICE_URL = "https://services1.arcgis.com/46913CWHRFmfQUln/arcgis/rest/services/oa_routenauszug_fuer_tests/FeatureServer/1";
const TRAIL_FIELD = "FolderPath";
const TRAIL_CATEGORIES = [
	"Wanderung",
	"Hindernisfreier Weg",
	"Themenweg",
	"Weitere Routen",
	"Veloroute",
	"E-Bike Route",
	"Mountainbiketour",
	"Winterwanderung",
	"Schneeschuhtour",
	"Langlaufstrecke",
	"Tourenskiroute",
	"Schlittelweg",
	"Skatingtour",
	"Reitroute",
];
const SCALES = {
	veryClose: 20000,
	close: 50000,
	medium: 100000,
};

const DEFAULT_TRAIL_COLORS = {
	fade: [190, 226, 98, 255],
	main: [153, 188, 66, 255],
};

// Add a custom pair for each category you want to style differently.
// Any category without an entry will keep the default green pair.
const TRAIL_COLOR_PAIRS = {
	"Wanderung": { fade: [190, 226, 98, 255], main: [153, 188, 66, 255] },
	"Hindernisfreier Weg": { fade: [215, 215, 182, 255], main: [172, 169, 138, 255] },
	"Themenweg": { fade: [180, 209, 105, 255], main: [126, 155, 55, 255] },
	"Weitere Routen": { fade: [215, 215, 182, 255], main: [172, 169, 138, 255] },
	"Veloroute": { fade: [178, 224, 255, 255], main: [144, 189, 233, 255] },
	"E-Bike Route": { fade: [140, 208, 255, 255], main: [88, 155, 222, 255] },
	"Mountainbiketour": { fade: [249, 220, 135, 255], main: [221, 188, 107, 255] },
	"Winterwanderung": { fade: [255, 191, 232, 255], main: [242, 155, 194, 255] },
	"Schneeschuhtour": { fade: [251, 178, 248, 255], main: [208, 131, 197, 255] },
	"Langlaufstrecke": { fade: [112, 231, 255, 255], main: [51, 204, 255, 255] },
	"Tourenskiroute": { fade: [130, 168, 205, 255], main: [46, 86, 118, 255] },
	"Schlittelweg": { fade: [243, 193, 171, 255], main: [191, 145, 124, 255] },
	"Skatingtour": { fade: [235, 210, 249, 255], main: [200, 175, 213, 255] },
	"Reitroute": { fade: [247, 143, 83, 255], main: [157, 67, 12, 255] },
};

const TRAIL_COLORS = Object.fromEntries(
	TRAIL_CATEGORIES.map((category) => {
		const customColors = TRAIL_COLOR_PAIRS[category] ?? {};
		return [
			category,
			{
				fade: customColors.fade ?? DEFAULT_TRAIL_COLORS.fade,
				main: customColors.main ?? DEFAULT_TRAIL_COLORS.main,
			},
		];
	})
);

function normalizeCategoryValue(value) {
	return String(value ?? "")
		.trim()
		.replace(/\\/g, "/")
		.split("/")
		.map((part) => part.trim())
		.filter(Boolean)
		.pop()
		?.toLowerCase();
}

function buildCategoryWhereClause(category) {
	const safeCategory = String(category).replace(/'/g, "''");
	const normalizedCategory = normalizeCategoryValue(category) || safeCategory.toLowerCase();

	return [
		`${TRAIL_FIELD} = '${safeCategory}'`,
		`${TRAIL_FIELD} LIKE '%${safeCategory}%'`,
		`${TRAIL_FIELD} LIKE '%/${normalizedCategory}'`,
		`${TRAIL_FIELD} LIKE '${normalizedCategory}'`,
	].join(" OR ");
}

function createTrailSymbol(scale, colors = DEFAULT_TRAIL_COLORS) {
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

const trailLayers = TRAIL_CATEGORIES.map((category) => {
	const layer = new FeatureLayer({
		url: TRAIL_SERVICE_URL,
		outFields: ["*"],
		opacity: 1,
		title: `${category} Trails`,
		renderer: createCategoryRenderer(category),
		visible: category === "Wanderung",
		filter: {
			where: buildCategoryWhereClause(category),
		},
	});

	return layer;
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
	layers: trailLayers,
});
await viewElement.viewOnReady();

const basemapGallery = document.querySelector("arcgis-basemap-gallery");
basemapGallery.source = [basemapPixelkarte, basemapPixelkarteGrau, basemapSwissimage];
basemapGallery.activeBasemap = basemapPixelkarte;

const trailTogglePanel = document.getElementById("trail-layer-toggle-panel");
const trailToggleMap = new Map();

TRAIL_CATEGORIES.forEach((category, index) => {
	const label = document.createElement("label");
	label.style.display = "flex";
	label.style.alignItems = "center";
	label.style.gap = "8px";
	label.style.cursor = "pointer";
	label.style.marginBottom = index === TRAIL_CATEGORIES.length - 1 ? "0" : "6px";

	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = category === "Wanderung";
	checkbox.id = `${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-toggle`;

	const text = document.createElement("span");
	text.textContent = category;

	label.appendChild(checkbox);
	label.appendChild(text);
	trailTogglePanel.appendChild(label);

	const trailLayer = trailLayers[index];
	trailToggleMap.set(checkbox, trailLayer);
	checkbox.addEventListener("change", () => {
		trailLayer.visible = checkbox.checked;
	});
});

const scaleValueElement = document.getElementById("scale-value");
const updateScaleReadout = () => {
	const currentScale = Math.round(viewElement.view.scale);
	scaleValueElement.textContent = currentScale.toLocaleString("en-US");
};

const updateTrailsymbolForScale = () => {
	const currentScale = viewElement.view.scale;

	trailLayers.forEach((trailLayer, index) => {
		const category = TRAIL_CATEGORIES[index];
		trailLayer.renderer = createCategoryRenderer(category);
		trailLayer.renderer.uniqueValueInfos[0].symbol = createTrailSymbol(currentScale, TRAIL_COLORS[category]);
	});

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
