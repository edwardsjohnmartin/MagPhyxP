dataset = [10, 15, 12, 18, 8];

svg = d3.select("body")
  .append("svg")
  .attr("width", 300)
  .attr("height", 220);

// let xScale = d3.scaleBand()
//   .domain(dataset)
//   .range([0, 300])
//   .padding(0.25);

// let height = 200;
// let yScale = d3.scaleLinear()
//   .domain([0, d3.max(dataset)])
//   .range([height, 0]);

// let yAxis = d3.axisLeft(yScale);
// let yaxisWidth = 20;
// svg.append('g')
//   .attr("transform", `translate(${yaxisWidth}, 10)`)
//   .call(yAxis)
//   .selectAll("text")
//   .attr('transform', 'rotate(90)')
//   .attr('dy', '1.6em')
//   .attr('dx', '1.2em')
// ;

// rectangles = svg.selectAll("rect")
//   .data(dataset)
//   .enter()
//   .append("rect")
//   .attr("transform", `translate(${yaxisWidth}, 10)`)
//   .attr("x", function(d, i) { return xScale(d); })
//   .attr("y", function(d) { return yScale(d); })
//   .attr("width", xScale.bandwidth())
//   .attr("height", function(d) { return height-yScale(d); })
//   .attr("class", "bar")
// ;


let energyIndex = 0;
let data;

function updateVis() {
  // console.log(data);
  console.log(data[6].energies[energyIndex]);
  let minima = data[6].energies[energyIndex].minima;

  let xaccess = d => d.ptheta;
  let yaccess = d => d.pphi;

  let xScale = d3.scaleLinear()
    // .domain([d3.min(minima, xaccess), d3.max(minima, xaccess)])
    .domain([-0.3, 0.3])
    .range([20, 180]);
  let yScale = d3.scaleLinear()
    // .domain([d3.min(minima, yaccess), d3.max(minima, yaccess)])
    .domain([-0.3, 0.3])
    .range([20, 180]);

  let update = function(s) {
    s
    .attr("cx", function(d) { return xScale(d.ptheta); })
    .attr("cy", function(d) { return yScale(d.pphi); })
    .attr("title", d => `(${d.ptheta}, ${d.pphi})`)
  };

  let all = svg.selectAll("circle")
    .data(minima);

  let enter = all.enter()
    .append("circle")
    .attr("r", 3)
  ;

  all.exit().remove();
  update(enter);
  update(all);

}

function energyChanged(i) {
  energyIndex = i;
  updateVis();

  document.getElementById('energyLabel').innerHTML = (-0.33 + i*0.01).toFixed(2);
}

function init() {
  // Load CSV file
  console.log('loading');
  d3.json("output.json")
    .then(function(d) {
      data = d;
      updateVis();
    });

  energyChanged(document.getElementById('energySlider').value);
}
