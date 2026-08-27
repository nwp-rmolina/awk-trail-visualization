require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/core/reactiveUtils"
], (
  Map,
  MapView,
  FeatureLayer,
  reactiveUtils
) => {

  const layer = new FeatureLayer({
    url: "YOUR_FEATURE_SERVICE_URL"
  });

  const map = new Map({
    basemap: "topo-vector",
    layers: [layer]
  });

  const view = new MapView({
    container: "viewDiv",
    map,
    center: [8.23, 46.8],
    zoom: 8
  });

  const smallScaleRenderer = {
    type: "simple",
    symbol: {
      type: "simple-line",
      color: "#d73027",
      width: 1
    }
  };

  const largeScaleRenderer = {
    type: "simple",
    symbol: {
      type: "simple-line",
      color: "#d73027",
      width: 4
    }
  };

  reactiveUtils.watch(
    () => view.scale,
    (scale) => {
      console.log("Scale:", scale);

      layer.renderer =
        scale <= 75000
          ? largeScaleRenderer
          : smallScaleRenderer;
    }
  );
});