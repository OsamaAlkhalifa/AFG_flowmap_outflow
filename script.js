require(['Canvas-Flowmap-Layer/CanvasFlowmapLayer',
  'esri/graphic',
  'esri/map',
  'esri/dijit/InfoWindowLite',
  'esri/domUtils',
  'esri/symbols/TextSymbol',
  'esri/symbols/Font',
  'esri/Color',
  'esri/layers/GraphicsLayer',
  'esri/geometry/Point',
  'dojo/dom-construct',
  'dojo/dom',
  'dojo/on',
  'dojo/domReady!'
], function(
  CanvasFlowmapLayer,
  Graphic,
  Map,
  InfoWindowLite,
  domUtils,
  TextSymbol,
  Font,
  Color,
  GraphicsLayer,
  Point,
  domConstruct,
  dom,
  on
) {
  var popup = new InfoWindowLite(null, domConstruct.create("div", null, document.body));
  popup.startup();

  var map = new Map('map', {
    basemap: 'gray-vector',
    center: [66.9, 34.5],
    zoom: 5,
    infoWindow: popup
  });



  map.on('load', function() {
    var oneToManyLayer = new CanvasFlowmapLayer({
      id: 'oneToManyLayer',
      visible: true,
      originAndDestinationFieldIds: {
        originUniqueIdField: 'e_locality',
        originGeometry: {
          x: 'e_lon',
          y: 'e_lat',
          spatialReference: { wkid: 4326 }
        },
        destinationUniqueIdField: 's_State',
        destinationGeometry: {
          x: 's_lon',
          y: 's_lat',
          spatialReference: { wkid: 4326 }
        }
      },
      pathDisplayMode: 'selection',
      wrapAroundCanvas: true,
      animationStarted: true,
      pathProperties: {
        type: 'classBreaks',
        field: 'e_Volume',
        classBreakInfos: [
          {
            classMinValue: 1,
            classMaxValue: 25000,
            symbol: {
              strokeStyle: 'rgba(128, 153, 208, 0.8)',
              lineWidth: 1,
              lineCap: 'round'
            }
          },
          {
            classMinValue: 25001,
            classMaxValue: 100000,
            symbol: {
              strokeStyle: 'rgba(64, 102, 184, 0.8)',
              lineWidth: 3,
              lineCap: 'round'
            }
          },
          {
            classMinValue: 100,001,
            classMaxValue: 465,351,
            symbol: {
              strokeStyle: 'rgba(0, 51, 160, 0.8)',
              lineWidth: 5,
              lineCap: 'round'
            }
          }
        ]
      },
      originCircleProperties: {
        type: 'simple',
        symbol: {
          globalCompositeOperation: 'destination-over',
          radius: 5,
          fillStyle: 'rgba(255, 184, 28, 0.9)',
          strokeStyle: 'white',
          lineWidth: 2,
          shadowBlur: 0
        }
      },
      destinationCircleProperties: {
        type: 'simple',
        symbol: {
          globalCompositeOperation: 'destination-over',
          radius: 7,
          fillStyle: 'rgba(255, 103, 31, 0.8)',
          strokeStyle: 'white',
          lineWidth: 1.5,
          shadowBlur: 0
        }
      },
      originHighlightCircleProperties: {
        type: 'simple',
        symbol: {
          globalCompositeOperation: 'destination-over',
          radius: 10,
          fillStyle: 'rgba(255, 255, 0, 0.9)',
          strokeStyle: '#FF0000',
          lineWidth: 3,
          shadowBlur: 10
        }
      },
      destinationHighlightCircleProperties: {
        type: 'simple',
        symbol: {
          globalCompositeOperation: 'destination-over',
          radius: 8,
          fillStyle: 'rgba(210, 38, 48, 0.8)',
          strokeStyle: '#000000',
          lineWidth: 3,
          shadowBlur: 10
        }
      }
    });

    map.addLayer(oneToManyLayer);
    createGraphicsFromCsv('csv-data/outflow origin.csv', oneToManyLayer);

    function createGraphicsFromCsv(csvFilePath, canvasLayer) {
      Papa.parse(csvFilePath, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
          var csvGraphics = results.data.map(function(datum) {
            return new Graphic({
              geometry: {
                x: datum.s_lon,
                y: datum.s_lat,
                spatialReference: { wkid: 4326 }
              },
              attributes: datum
            });
          });
          canvasLayer.addGraphics(csvGraphics);
          // Step 3: Add source & destination labels
var sourceLabelLayer = new GraphicsLayer();
var destinationLabelLayer = new GraphicsLayer();

results.data.forEach(function(datum) {
  // Source label
  if (datum.e_locality && datum.e_lat && datum.e_lon) {
    var sourcePoint = new Point(datum.e_lon, datum.e_lat, { wkid: 4326 });
    var sourceText = new TextSymbol(datum.e_locality)
      .setOffset(0, 10)
      .setFont(new Font("10pt").setWeight(Font.WEIGHT_BOLD))
      .setColor(new Color([0, 0, 0, 0.9]));
    var sourceGraphic = new Graphic(sourcePoint, sourceText);
    sourceLabelLayer.add(sourceGraphic);
  }

  // Destination label
  if (datum.s_State && datum.s_lat && datum.s_lon) {
    var destPoint = new Point(datum.s_lon, datum.s_lat, { wkid: 4326 });
    var destText = new TextSymbol(datum.s_State)
      .setOffset(0, 10)
      .setFont(new Font("10pt"))
      .setColor(new Color([60, 60, 60, 0.8]));
    var destGraphic = new Graphic(destPoint, destText);
    destinationLabelLayer.add(destGraphic);
  }
});

// Step 4: Add label layers to the map
map.addLayer(sourceLabelLayer);
map.addLayer(destinationLabelLayer);

          let uniqueCities = [...new Set(results.data.map(d => d.e_locality).filter(c => c))].sort();
          let citySelector = document.getElementById('sCitySelect');

          citySelector.innerHTML = '';

          let allCheckbox = document.createElement('div');
          allCheckbox.innerHTML = `
            <label><input type="checkbox" value="__all__" checked> <strong>All provinces</strong></label><br>
          `;
          citySelector.appendChild(allCheckbox);

          uniqueCities.forEach(city => {
            let checkbox = document.createElement('div');
            checkbox.innerHTML = `
              <label><input type="checkbox" value="${city}"> ${city}</label><br>
            `;
            citySelector.appendChild(checkbox);
          });

          citySelector.addEventListener('change', function(evt) {
            let checkboxes = citySelector.querySelectorAll('input[type="checkbox"]');
            let selectedValues = Array.from(checkboxes)
              .filter(cb => cb.checked)
              .map(cb => cb.value);

            if (selectedValues.includes('__all__')) {
              const allGraphics = canvasLayer.graphics;
              canvasLayer.selectGraphicsForPathDisplay(allGraphics, 'SELECTION_NEW');
              return;
            }

            let matchingGraphics = canvasLayer.graphics.filter(
              g => selectedValues.includes(g.attributes.e_locality)
            );
            canvasLayer.selectGraphicsForPathDisplay(matchingGraphics, 'SELECTION_NEW');
          });

          const allGraphics = canvasLayer.graphics;
          canvasLayer.selectGraphicsForPathDisplay(allGraphics, 'SELECTION_NEW');
        }
      });
    }

    // highlight points and show name on hover
    on(oneToManyLayer, 'mouse-over', function(evt) {
      var graphic = evt.graphic;
      graphic.attributes._isSelectedForHighlight = true;
      oneToManyLayer._redrawCanvas();
      map.infoWindow.setContent("<b>" + (graphic.attributes.e_locality || graphic.attributes.s_State || 'N/A') + "</b>");
      map.infoWindow.setTitle("Location");
      map.infoWindow.show(evt.mapPoint);
    });

    on(oneToManyLayer, 'mouse-out', function(evt) {
      var graphic = evt.graphic;
      graphic.attributes._isSelectedForHighlight = false;
      oneToManyLayer._redrawCanvas();
      map.infoWindow.hide();
    });
  });
});
