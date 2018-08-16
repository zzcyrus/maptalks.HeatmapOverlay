# maptalks.HeatmapOverlay

A plugin of [maptalks.js](https://github.com/maptalks/maptalks.js) to draw heatmapOverlay on maps, based on [heatmap](https://github.com/pa7/heatmap.js).

## Demos

-   A heatmap of [tempurate](https://zzcyrus.github.io/maptalks.HeatmapOverlay/demo/).

## Install

-   Download from [dist directory](https://github.com/zzcyrus/maptalks.HeatmapOverlay/tree/gh-pages/dist).

## Usage

As a plugin, `maptalks.HeatmapOverlay` must be loaded after `maptalks.js` in browsers.

### Vanilla Javascript

```javascript
var heatmapOverlay = new maptalks.HeatmapOverlay("heatmap", cfg);
heatmapOverlay.setData(datacfg);
this.map.addLayer(heatmapOverlay);
```

## API Reference

### `Constructor`

`HeatmapOverlay` is a subclass of [maptalks.Layer](https://maptalks.github.io/maptalks.js/api/0.x/Layer.html) and inherits all the methods of its parent.

```javascript
new maptalks.HeatmapOverlay(id, options);
```

-   id **String** layer id
-   options **Object** options
    -   radius **Number** if scaleRadius is false it will be the constant radius used in pixels
    -   scaleRadius **Boolean** scales the radius based on map zoom
    -   useLocalExtrema **Boolean** there will always be a red spot with useLocalExtremas true
    -   maxOpacity **Number** maxmium point opacity
    -   latField **String** which field name in your data represents the latitude - default "lat"
    -   lngField **String** which field name in your data represents the longitude - default "lng"
    -   valueField **String** which field name in your data represents the value - default "value"

### `config(key, value)`

## Todo

-   [ ] add Test
-   [ ] add Api doc
