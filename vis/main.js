let dataset = [];
let googleColors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];

let data;

function color(i) {
  const n = googleColors.length;
  return googleColors[i%n];
}

function updateVis() {
  if (minima.length == 0) return;

  let minx = 20;
  let maxx = 680;
  let miny = 20;
  let maxy = 580;

  let minE = d3.min(minima, d=>d.energy);
  let maxE = d3.max(minima, d=>d.energy);
  let minpphi = d3.min(minima, d=>d.pphi);
  let maxpphi = d3.max(minima, d=>d.pphi);

  let scale = d3.scaleLinear()
    .domain([minE, maxE])
    .range([minx, maxx]);  
  let x_axis = d3.axisBottom().scale(scale);

  let eScale = d3.scaleLinear()
    .domain([minE, maxE])
    .range([minx, maxx]);
  let yScale = d3.scaleLinear()
    .domain([minpphi, maxpphi])
    .range([maxy, miny]);
  let y_axis = d3.axisLeft().scale(yScale);

  // console.log("minE, maxE = " + minE + " " + maxE);

  let maxNumBounces = d3.max(minima, m => m.numBounces);

  svg = d3.select("#svg");
  svg.selectAll('*').remove();

  let xoffset = 60;

  // x axis
  svg.append("g")
    .attr('transform', `translate(${xoffset}, ${yScale(minpphi)+20})`)
    .call(x_axis)
  ;
  svg.append("g")
    .attr('transform', `translate(${xoffset + (minx+maxx)/2}, ${yScale(minpphi)+60})`)
    .append('text')
    .html('energy')
  ;

  // y axis
  svg.append("g")
    .attr('transform', `translate(${xoffset}, ${yScale(maxpphi)-20})`)
    .call(y_axis)
  ;
  svg.append("g")
    .attr('transform', `translate(20, ${yScale((maxpphi-minpphi)/2)}) rotate(${-90})`)
    .append('text')
    .html('p&phi;')
  ;

  svg.selectAll("circle")
    .data(minima)
    .enter()
    .append("a")
    .attr("xlink:href", d =>
          `http://edwardsjohnmartin.github.io/MagPhyx/` +
          `?initparams=1,0,0,${d.pr},${d.ptheta},${d.pphi}`)
    .attr("target", "_magphyx")
    .append("circle")
    .attr("cx", function(d) { return xoffset + eScale(d.energy); })
    .attr("cy", function(d) { return yScale(d.pphi); })
    .attr("fill", d => color(d.numBounces))
    .attr("stroke", 'none')
    .attr("r", 3)
    .on("click", function() {
      console.log(this);
      d3.select(this).attr("r", 6);
    })
    .append("title")
    .text(d => `bounces = ${d.numBounces} energy = ${d.energy}\n` +
          `ptheta = ${d.ptheta} pphi = ${d.pphi} t = ${d.t}`)
  ;

  //----------------------------------------
  // legend
  //----------------------------------------
  let legendVals = [];
  minima.forEach(d => legendVals.push(d.numBounces));
  legendVals = Array.from(new Set(legendVals)).reverse();

  d3.select('.legend').selectAll('*').remove();
  let legend = d3.select('.legend')
    .selectAll("legend")
    .data(legendVals);
  p = legend.enter()
    .append("div")
    .attr("class","legend-div")
    .append("p")
    .attr("class","legend-text");
  p.append("span")
    .attr("class","key-dot")
    // .style("background", (d,i) => googleColors[i] );
    // .style("background", (d,i) => googleColors[d] );
    .style("background", (d,i) => color(d) );
  p.insert("text").text(d => d);
}

function filterChanged() {
  let numbers = [];
  try {
    // Parse the filter string
    let s = document.getElementById('filter').value;
    let tokens = s.split(',');
    tokens.forEach((y,i) => {
      y = y.trim();
      let startend = y.split('-');
      let start = +startend[0];
      let end = start;
      if (startend.length > 1) {
        end = +startend[1];
      }
      if (start != start || end != end) {
        throw "failed to parse filter";
      }
      for (let i = start; i <= end; ++i) {
        numbers.push(i);
      }
    });
  } catch(e) {
    console.log(e);
    return;
  }

  minima = [];
  data.forEach(function(d) {
    let minimum = {
      numBounces : d.n,
      energy : d.E,
      pr : d.pr,
      ptheta : d.ptheta,
      pphi : d.pphi,
      t : 0
    };
    minima.push(minimum);
  });

  minima = minima.sort((a,b) => a.energy-b.energy);
  
  minima = minima.filter(d => {
    return numbers.indexOf(d.numBounces) > -1;
  });

  updateVis();
}

function init() {
  // Read the dataset
  let dataset = "bifurcation.json";
  d3.json(dataset)
    .then(function(d) {
      data = d;
      if (dataset == "bifurcation.json") {
        data.newFormat = true;
      }
      filterChanged();
    });
}
