import * as maptalks from 'maptalks';
import { heatmapFactory as h337 } from './heatmap';

export class HeatmapOverlay extends maptalks.Layer {
    constructor(id, options) {
        super(id, options);
        this._el = maptalks.DomUtil.createEl('div', 'maptalks-heatmap-layer');
        this.cfg = options;
        this.cfg.container = this._el;
        this.cfg._max = 1;
        this.cfg._min = 0;
        this._data = [];
    }

    getData() {
        return this._data;
    }

    getCfg() {
        return this.cfg;
    }

    setData(data) {
        this.cfg._max = data.max || this.cfg._max;
        this.cfg._min = data.min || this.cfg._min;
        const latField = this.cfg.latField || 'lat';
        const lngField = this.cfg.lngField || 'lng';
        const valueField = this.cfg.valueField || 'value';

        // transform data to latlngs
        data = data.data;
        let len = data.length;
        const d = [];

        while (len--) {
            const entry = data[len];
            const latlng = new maptalks.Coordinate(
                entry[latField],
                entry[lngField]
            );
            const dataObj = { latlng: latlng };
            dataObj[valueField] = entry[valueField];
            if (entry.radius) {
                dataObj.radius = entry.radius;
            }
            d.push(dataObj);
        }
        this._data = d;
        return this.redraw();
    }

    addData(pointOrArray) {
        if (pointOrArray.length > 0) {
            let len = pointOrArray.length;
            while (len--) {
                this.addData(pointOrArray[len]);
            }
        } else {
            const latField = this.cfg.latField || 'lat';
            const lngField = this.cfg.lngField || 'lng';
            const valueField = this.cfg.valueField || 'value';
            const entry = pointOrArray;
            const latlng = new maptalks.Coordinate(
                entry[latField],
                entry[lngField]
            );
            const dataObj = { latlng: latlng };

            dataObj[valueField] = entry[valueField];
            this.cfg._max = Math.max(this.cfg._max, dataObj[valueField]);
            this.cfg._min = Math.min(this.cfg._min, dataObj[valueField]);

            if (entry.radius) {
                dataObj.radius = entry.radius;
            }
            this._data.push(dataObj);
        }
        return this.redraw();
    }

    onConfig(conf) {
        for (const p in conf) {
            if (this.options[p]) {
                return this.redraw();
            }
        }
        return this;
    }

    redraw() {
        const renderer = this._getRenderer();
        if (renderer) {
            renderer.clearHeatCache();
            renderer.setToRedraw();
        }
        return this;
    }

    isEmpty() {
        if (!this._data.length) {
            return true;
        }
        return false;
    }

    clear() {
        this._data = [];
        this.redraw();
        this.fire('clear');
        return this;
    }

    _getHeatRadius() {
        if (!this._getRenderer()) {
            return null;
        }
        return this._getRenderer()._heatRadius;
    }
}

HeatmapOverlay.registerJSONType('HeatLayer');

HeatmapOverlay.registerRenderer(
    'canvas',
    class extends maptalks.renderer.CanvasRenderer {
        draw() {
            const layer = this.layer;
            this._map = this.getMap();
            this.cfg = layer.getCfg();
            this._el = this.cfg.container;
            const size = this._map.getSize();
            this._width = size.width;
            this._height = size.height;
            this._el.style.width = size.width + 'px';
            this._el.style.height = size.height + 'px';
            this._el.style.position = 'absolute';
            this._origin = this._map._pointToContainerPoint(
                new maptalks.Point(0, 0)
            );
            this._map.getPanels().frontLayer.appendChild(this._el);
            this._data = layer.getData();
            if (!this._heatmap) {
                this._heatmap = h337.create(this.cfg);
            }
            this._draw();
            this.completeRender();
        }

        drawOnInteracting() {
            this._draw();
        }

        _draw() {
            if (!this._map) {
                return;
            }
            const point = this._map.offsetPlatform();

            // reposition the layer
            this._el.style[HeatmapOverlay.CSS_TRANSFORM] =
                'translate(' +
                -Math.round(point.x) +
                'px,' +
                -Math.round(point.y) +
                'px)';
            this._update();
        }

        _update() {
            const generatedData = {
                max: this.cfg._max,
                min: this.cfg._min,
                data: []
            };
            const bounds = this._map.getExtent();
            const zoom = this._map.getZoom();
            const scale = Math.pow(2, zoom);

            if (this._data.length === 0) {
                if (this._heatmap) {
                    this._heatmap.setData(generatedData);
                }
                return;
            }

            const latLngPoints = [];
            const radiusMultiplier = this.cfg.scaleRadius ? scale : 1;
            let localMax = 0;
            let localMin = 0;
            const valueField = this.cfg.valueField;
            let len = this._data.length;

            while (len--) {
                const entry = this._data[len];
                const value = entry[valueField];
                const latlng = new maptalks.Coordinate(entry.latlng);

                // we don't wanna render points that are not even on the map ;-)
                if (!bounds.contains(latlng)) {
                    continue;
                }
                // local max is the maximum within current bounds
                localMax = Math.max(value, localMax);
                localMin = Math.min(value, localMin);

                const point = this._map.coordinateToContainerPoint(latlng);
                const latlngPoint = {
                    x: Math.round(point.x),
                    y: Math.round(point.y)
                };
                latlngPoint[valueField] = value;

                let radius;

                if (entry.radius) {
                    radius = entry.radius * radiusMultiplier;
                } else {
                    radius = (this.cfg.radius || 2) * radiusMultiplier;
                }
                latlngPoint.radius = radius;
                latLngPoints.push(latlngPoint);
            }
            if (this.cfg.useLocalExtrema) {
                generatedData.max = localMax;
                generatedData.min = localMin;
            }

            generatedData.data = latLngPoints;

            this._heatmap.setData(generatedData);
        }

        onZoomEnd() {
            delete this._heatViews;
            super.onZoomEnd.apply(this, arguments);
        }

        onResize() {
            this._origin = this._map._pointToContainerPoint(
                new maptalks.Coordinate(0, 0)
            );
            const size = this._map.getSize();

            if (this._width !== size.width || this._height !== size.height) {
                this._width = size.width;
                this._height = size.height;
                this._el.style.width = this._width + 'px';
                this._el.style.height = this._height + 'px';
                this._heatmap._renderer.setDimensions(
                    this._width,
                    this._height
                );
            }
            this._draw();
        }

        onRemove() {
            this.clearHeatCache();
            this._map()
                .getPanels()
                .frontLayer.removeChild(this._el);
            delete this._heatmap;
        }

        clearHeatCache() {
            delete this._heatViews;
        }
    }
);

HeatmapOverlay.CSS_TRANSFORM = (function () {
    const div = document.createElement('div');
    const props = [
        'transform',
        'WebkitTransform',
        'MozTransform',
        'OTransform',
        'msTransform'
    ];

    for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        if (div.style[prop] !== undefined) {
            return prop;
        }
    }
    return props[0];
})();
