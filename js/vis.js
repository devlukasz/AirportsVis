d3.select(window).on("resize", throttle);
// declaring the zoom variable and assigning d3.behaviour.zoom onto it
var zoom = d3.behavior.zoom()
  .scaleExtent([1, 9])
  .on("zoom", move);

// declaring all of the needed variables 
var width = document.getElementById('container').offsetWidth;
var height = width / 2;
var topo, projection, path, svg, g;
var dataset;
var graticule = d3.geo.graticule();
var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

// setting up the width and height of the projection
setup(width, height);

function setup(width, height) {
  // assigning geo.mercator to the projection to have to correct projection in use
  projection = d3.geo.mercator()
    .translate([(width / 2), (height / 2)])
    .scale(width / 2 / Math.PI);

  path = d3.geo.path().projection(projection);
  // using the class container and adding attributes of width and height to it
  svg = d3.select("#container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom)
    .on("click", click)
    .append("g");
  g = svg.append("g");

}

// loading in the map JSON file 
d3.json("res/world-topo-min.json", function (error, world) {
  // declaring countries variable, and using the topojson to add countries onto the map
  var countries = topojson.feature(world, world.objects.countries).features;
  topo = countries;
  draw(topo);
});


// drawing the map
function draw(topo) {
  svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);
  g.append("path")
    .datum({
      type: "LineString",
      coordinates: [
        [-180, 0],
        [-90, 0],
        [0, 0],
        [90, 0],
        [180, 0]
      ]
    })
    .attr("class", "equator")
    .attr("d", path);

  var country = g.selectAll(".country").data(topo);
  country.enter().insert("path")
    .attr("class", "country")
    .attr("d", path);

  //offsets for tooltips
  var offsetL = document.getElementById('container').offsetLeft + 20;
  var offsetT = document.getElementById('container').offsetTop + 10;

  //using the country data from the topojson, and making a tooltip that will display the countries names when the mouse is over it
  country
    .on("mousemove", function (d, i) {
      var mouse = d3.mouse(svg.node()).map(function (d) {
        return parseInt(d);
      });

      tooltip.classed("hidden", false)
        .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
        .html(d.properties.name);
    })
    .on("mouseout", function (d, i) {
      tooltip.classed("hidden", true);
    });

  // loading the PHP connection file, to access the airports coordinates in order to draw them onto the map with correct coordinates
  d3.json("loadJson.php", function (err, d) {
    d.forEach(function (d) {
      addpoint(d.longitude, d.latitude, d.iata_code);

    });
  });
}

// this is the function that draws the points onto the map, the projection takes lon and lat, and draws cricles on the map depending on the coordinates.
function addpoint(lon, lat, text) {

  var gpoint = g.append("g").attr("class", "gpoint");
  var x = projection([lon, lat])[0];
  var y = projection([lon, lat])[1];

  gpoint.append("svg:circle")
    .attr("cx", x)
    .attr("cy", y)
    .attr("class", "point")
    .attr("r", 0.5)
    .style('fill', 'grey');

  goint.append("text")
    .attr("x", x - 0.5)
    .attr("y", y - 1)
    .attr("class", "text")
    .style('fill', 'orange')
    .text(text);
};

function redraw() {
  width = document.getElementById('container').offsetWidth;
  height = width / 2;
  d3.select('svg').remove();
  setup(width, height);
  draw(topo);
}

// allows for the naviation around the world map
function move() {
  var t = d3.event.translate;
  var s = d3.event.scale;
  zscale = s;
  var h = height / 4;

  t[0] = Math.min(
    (width / height) * (s - 1),
    Math.max(width * (1 - s), t[0])
  );

  t[1] = Math.min(
    h * (s - 1) + h * s,
    Math.max(height * (1 - s) - h * s, t[1])
  );

  zoom.translate(t);
  g.attr("transform", "translate(" + t + ")scale(" + s + ")");

  //the countries boundries change depending on the zoom level
  d3.selectAll(".country").style("stroke-width", 2.5 / s);

}

var throttleTimer;

function throttle() {
  window.clearTimeout(throttleTimer);
  throttleTimer = window.setTimeout(function () {
    redraw();
  }, 200);
}

// ----------------------
//geo translation on mouse click in map
function click() {
  var latlon = projection.invert(d3.mouse(this));

}