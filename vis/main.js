dataset = [10, 15, 12, 18, 8];
let FILTER_ALL = -1;
let FILTER_FIRSTS = -2;

function calculate_pr(r, theta, phi, ptheta, pphi, energy) {
  let pr2 = Math.abs(2*energy + (Math.cos(phi)+3*Math.cos(phi-2*theta))/
                         (6*r*r*r)-ptheta*ptheta/(r*r)-10*pphi*pphi);
  return Math.sqrt(pr2);
}

let color = d3.schemeCategory10;
let googleColors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];

let energyIndex = 0;
let data;
let filterValue = FILTER_ALL;

function energyChanged(i) {
  energyIndex = i;
  updateVis();

  document.getElementById('energyLabel').innerHTML = (-0.33 + i*0.01).toFixed(2);
}

function updateVis() {
  let minx = 20;
  let maxx = 680;

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
    .range([maxx, minx]);

  console.log("minE, maxE = " + minE + " " + maxE);

  let maxNumBounces = d3.max(minima, m => m.numBounces);

  svg = d3.select("#svg");
  svg.selectAll('*').remove();
  svg.append("g")
    .attr('transform', `translate(0, ${yScale(maxpphi)+20})`)
    .call(x_axis)
  ;

  svg.append("g")
    .attr('transform', `translate(${(minx+maxx)/2}, ${yScale(maxpphi)+60})`)
    .append('text')
    .html('energy')
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
    .attr("cx", function(d) { return eScale(d.energy); })
    .attr("cy", function(d) { return yScale(d.pphi); })
    // .attr("title", d => `(${d.ptheta}, ${d.pphi})`)
    .attr("fill", d => googleColors[d.numBounces])
    .attr("stroke", 'none')
    .attr("r", 3)
    .append("title")
    .text(d => `bounces = ${d.numBounces} energy = ${d.energy}\n` +
          `ptheta = ${d.ptheta} pphi = ${d.pphi} t = ${d.t}`)
  ;
}

function filterChanged() {
  let v = document.getElementById("numBounces").value;
  if (v == 'all') {
    filterValue = FILTER_ALL;
  } else if (v == 'firsts') {
    filterValue = FILTER_FIRSTS;
  } else {
    // console.log(v);
    filterValue = +v;
  }
  datasetChanged();
}

function updateDataset() {
  minima = [];
  if (data.newFormat == true) {
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
  } else {
    data.forEach(function(d) {
      let numBounces = d.numBounces;
      // console.log(numBounces);
      d.energies.forEach(function(e) {
        let energy = e.energy;
        e.minima.forEach(function(m) {
          let minimum = {
            numBounces : numBounces,
            energy : energy,
            pr : calculate_pr(1, 0, 0, m.ptheta, m.pphi, energy),
            ptheta : m.ptheta,
            pphi : m.pphi,
            t : m.t
          };
          minima.push(minimum);
        });
      });
    });
  }

  minima = minima.sort((a,b) => a.energy-b.energy);
  if (filterValue == FILTER_FIRSTS) {
    let maxBounces = d3.max(minima, d=>d.numBounces);
    let bounce = maxBounces;
    let filtered = [];
    for (let i = 0; bounce > 0 && i < minima.length; ++i) {
      // console.log(minima[i].energy);
      if (minima[i].numBounces == bounce) {
        filtered.push(minima[i]);
        bounce--;
        // console.log('changed bounce ' + bounce);
      }
    }
    minima = filtered;
  } 
  
  minima = minima.filter(d => {
    let ret = true;
    if (filterValue == FILTER_ALL) {
      // do nothing
    } else if (filterValue == FILTER_FIRSTS) {
      // already filtered
    } else {
      ret = d.numBounces == filterValue;
    }
    return ret;
  });

}

function datasetChanged() {
  // Load CSV file
  // console.log('loading');

  // let dataset = "output.json";
  // if (document.getElementById("dataset").value == "dataset2") {
  //   dataset = "output2.json";
  // }
  // if (document.getElementById("dataset").value == "bifurcations") {
  //   dataset = "bifurcation.json";
  // }
  dataset = "bifurcation.json";
  console.log(dataset);

  d3.json(dataset)
    .then(function(d) {
      // console.log(d);
      data = d;
      if (dataset == "bifurcation.json") {
        data.newFormat = true;
      }
      updateDataset();
      updateVis();
    });
}

function init() {
  var filter = document.getElementById("numBounces");
  // filter.innerHTML = '';
  for (let i = -1; i <= 20; ++i) {
    var option = document.createElement("option");
    if (i == -1) {
      option.text = 'all';
    } else if (i == 0) {
      // option.text = 'firsts';
      option.selected = 'selected';
    } else {
      option.text = i;
    }
    filter.add(option);
  }

  filter.value = 1;
  filterChanged();
  datasetChanged();
}
