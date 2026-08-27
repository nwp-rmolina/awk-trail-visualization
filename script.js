const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");

const viewElement = document.querySelector("arcgis-map");
await viewElement.viewOnReady();
viewElement.constraints.minScale = 1155582;

const layer = viewElement.map.layers.getItemAt(0);
const heatmapRenderer = layer.renderer.clone();
// This simple renderer render all points as simple markers
const simpleRenderer = {
	type: "simple",
	symbol: {
		type: "simple-marker",
		color: "#c80000",
		size: 5,
	},
};

// When the scale is larger than 1:72,224 (zoomed in past that scale),
// then switch from a heatmap renderer to a simple renderer. When zoomed
// out beyond that scale, switch back to the heatmap renderer
reactiveUtils.watch(
	() => viewElement.scale,
	(scale) => {
		layer.renderer = scale <= 72224 ? simpleRenderer : heatmapRenderer;
	},
);
// Hide the instructions when the user starts interacting with the sample
const expandElement = document.querySelector("arcgis-expand");
reactiveUtils
	.whenOnce(() => viewElement.interacting)
	.then(() => {
		expandElement.expanded = false;
	});
