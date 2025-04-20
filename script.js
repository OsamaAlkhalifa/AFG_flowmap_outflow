require([
  'Canvas-Flowmap-Layer/CanvasFlowmapLayer',
  'esri/graphic',
  'esri/map',
  'dojo/on',
  'dojo/domReady!'
], function(
  CanvasFlowmapLayer,
  Graphic,
  Map,
  on
) {
  var map = new Map('map', {
    basemap: 'gray-vector',
    center: [66.9, 34.5],
    zoom: 5
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
            classMaxValue: 5000,
            symbol: {
              strokeStyle: 'rgba(255, 202, 85, 0.8)',
              lineWidth: 1,
              lineCap: 'round'
            }
          },
          {
            classMinValue: 5001,
            classMaxValue: 25000,
            symbol: {
              strokeStyle: 'rgba(255, 141, 87, 0.8)',
              lineWidth: 3,
              lineCap: 'round'
            }
          },
          {
            classMinValue: 25001,
            classMaxValue: 592169,
            symbol: {
              strokeStyle: 'rgba(210, 38, 48, 0.8)',
              lineWidth: 5,
              lineCap: 'round'
            }
          }
        ]
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

          let uniqueCities = [...new Set(results.data.map(d => d.e_locality).filter(c => c))].sort();
          let citySelector = document.getElementById('sCitySelect');

          citySelector.innerHTML = '';

          let allCheckbox = document.createElement('div');
          allCheckbox.innerHTML = `
            <label><input type="checkbox" value="__all__" checked> <strong>All FMPs</strong></label><br>
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
  });
});
