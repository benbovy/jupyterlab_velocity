import {
  IRenderMime
} from '@jupyterlab/rendermime-interfaces';

import {
  Widget
} from '@phosphor/widgets';

import {
  Message
} from '@phosphor/messaging';

import 'leaflet';
import 'leaflet-velocity-ts';

declare var L: any;

import 'leaflet/dist/leaflet.css';

import '../style/index.css';


/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/velocity+json';


/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'jp-OutputWidgetVelocityJSON';


/**
 * leaflet tile layers.
 */
const Esri_WorldImagery: L.TileLayer = L.tileLayer(
  'http://server.arcgisonline.com/ArcGIS/rest/services/' +
    'World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, ' +
      'AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
);

const Esri_WorldPhysical: L.TileLayer = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/' +
    'World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service',
    maxZoom: 8
  }
);

const Esri_OceanBasemap: L.TileLayer = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/' +
    'Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, ' +
      'OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
    maxZoom: 13
  }
);

const Esri_WorldShadedRelief: L.TileLayer = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/' +
    'World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
    maxZoom: 13
  }
);

const CartoDB_DarkMatter: L.TileLayer = L.tileLayer(
  'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
  {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> '+
      '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }
);

const CartoDB_Positron: L.TileLayer = L.tileLayer(
  'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
  {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }
);

const baseLayers: { [key:string]:L.TileLayer; } = {
  "Satellite": Esri_WorldImagery,
  "Physical": Esri_WorldPhysical,
  "Ocean": Esri_OceanBasemap,
  "Shaded Relief": Esri_WorldShadedRelief,
  "Dark": CartoDB_DarkMatter,
  "Positron": CartoDB_Positron
};


/**
 * A widget for rendering VelocityJSON.
 */
export
class OutputWidget extends Widget implements IRenderMime.IRenderer {
  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
    // Create leaflet map object
    // trackResize option set to false as it is not needed to track
    // window.resize events since we have individual phosphor resize
    // events.
    this._map = L.map(this.node, {
      trackResize: false
    });
  }

  /**
   * Dispose of the widget.
   */
  dispose(): void {
    // Dispose of leaflet map
    this._map.remove();
    this._map = null;
    super.dispose();
  }

  /**
   * Render VelocityJSON into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const data = model.data[this._mimeType] as any;
    const metadata = model.metadata[this._mimeType] as any || {};

    this._bounds = metadata['bounds'];

    return new Promise<void>((resolve, reject) => {
      //console.log(JSON.parse(data));
      //console.log(metadata);

      // Add base layer
      Esri_WorldImagery.addTo(this._map);

      // Add velocity layer
      this._velocityLayer = L.velocityLayer({
        displayValues: true,
        displayOptions: {
          velocityType: metadata['velocity_type'] || 'Field',
          displayPosition: metadata['display_position'] || 'bottomleft',
          angleConvention: metadata['angle_convention'] || 'bearingCW',
          displayEmptyString: metadata['display_empty_string'] || 'No water data'
        },
        data: JSON.parse(data),
        minVelocity: metadata['min_velocity'] || 0.,
        maxVelocity: metadata['max_velocity'] || 1.,
        velocityScale: metadata['velocity_scale'] || 0.005
      });

      this._velocityLayer.addTo(this._map);

      // Add control layers
      this._layerControl = L.control.layers(baseLayers);

      this._layerControl.addTo(this._map);
      this._layerControl.addOverlay(
        this._velocityLayer,
        metadata['field_name'] || "Velocity Field"
      );

      // Fit bounds
      //this._map.fitBounds(this._bounds);
      this._map.setView(metadata['latlon_center'] || [0., 0.],
                        metadata['zoom'] || 2);

      this.update();
      resolve();
    });
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    if (this.parent.hasClass('jp-OutputArea-child')) {
      // Disable scroll zoom by default to avoid conflicts with notebook scroll
      this._map.scrollWheelZoom.disable();
      // Enable scroll zoom on map focus
      this._map.on('blur', (event) => {
        this._map.scrollWheelZoom.disable();
      });
      // Disable scroll zoom on blur
      this._map.on('focus', (event) => {
        this._map.scrollWheelZoom.enable();
      });
    }
    this.update();
  }

  /**
   * A message handler invoked on an `'after-show'` message.
   */
  protected onAfterShow(msg: Message): void {
    this.update();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    this.update();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Update map size after update
    if (this.isVisible) this._map.invalidateSize();
    // Update map size after panel/window is resized
    //this._map.fitBounds(this._velocityLayer.getBounds());
    //this._map.fitBounds(this._bounds);
  }

  private _map: L.Map;
  private _bounds: any;
  private _layerControl: L.Control.Layers;
  private _velocityLayer: any;   // L.VelocityLayer not found?
  private _mimeType: string;
}


/**
 * A mime renderer factory for VelocityJSON data.
 */
export
const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: options => new OutputWidget(options)
};


const extension: IRenderMime.IExtension = {
  id: 'jupyterlab_velocity:plugin',
  rendererFactory,
  rank: 0,
  dataType: 'string'
};

export default extension;
