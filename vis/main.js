dataset = [10, 15, 12, 18, 8];

// svg = d3.select("body")
//   .append("svg")
//   .attr("width", 300)
//   .attr("height", 300);
svg = d3.select("#svg");

// svg2 = d3.select("body")
//   .append("svg")
//   .attr("width", 300)
//   .attr("height", 300);
svg2 = d3.select("#svg2");

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
  // console.log(data[6].energies[energyIndex]);
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

function updateVis2() {
  console.log(data);

  minima = [];
  data.forEach(function(d) {
    let numBounces = d.numBounces;
    // console.log(numBounces);
    d.energies.forEach(function(e) {
      let energy = e.energy;
      e.minima.forEach(function(m) {
        let minimum = {
          numBounces : numBounces,
          energy : energy,
          ptheta : m.ptheta,
          pphi : m.pphi
        };
        minima.push(minimum);
      });
    });
  });

  // Render in reverse order

  // console.log(minima);

  // let xaccess = d => d.ptheta;
  // let yaccess = d => d.pphi;

  let eScale = d3.scaleLinear()
    .domain([-0.33, -0.11])
    .range([20, 680]);
  // let xScale = d3.scaleLinear()
  //   // .domain([d3.min(minima, xaccess), d3.max(minima, xaccess)])
  //   .domain([-0.3, 0.3])
  //   .range([20, 180]);
  let yScale = d3.scaleLinear()
    // .domain([d3.min(minima, yaccess), d3.max(minima, yaccess)])
    .domain([-0.3, 0.3])
    .range([20, 680]);

  let color = d3.schemeCategory10;
  let googleColors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    svg2.selectAll("circle")
    .data(minima)
    .enter()
    .append("circle")
    .attr("cx", function(d) { return eScale(d.energy); })
    .attr("cy", function(d) { return yScale(d.pphi); })
    .attr("title", d => `(${d.ptheta}, ${d.pphi})`)
    .attr("fill", d => googleColors[d.numBounces])
    .attr("stroke", 'none')
    .attr("r", d => (16-d.numBounces))
    .append("title")
    .text(d => `bounces = ${d.numBounces}`)
  ;

}

function init() {
  // Load CSV file
  // console.log('loading');
  d3.json("output.json")
    .then(function(d) {
      data = d;
      updateVis();
      energyChanged(Number(document.getElementById('energySlider').value));
      updateVis2();
    });


}
