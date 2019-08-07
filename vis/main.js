let googleColors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];

let allStatesAll;
let allStatesUnique;
let bifurcationStatesAll;
let bifurcationStatesUnique;

let savingSvg = false;

let et = new ET();

let filter = {
  bounces : null,
  ptheta_rocking : null,
  phase : null
};

let radius = 3;

let cmap = {}; 

function color(i) {
  if (i in cmap) {
    i = cmap[i];
  }
  const n = googleColors.length;
  return googleColors[i%n];
}

function getColor(d) {
  // return color(d.numBounces);
  return color(getRockingNumber(d));
}

function power_of_2(n) {
 if (typeof n !== 'number') 
      return 'Not a number'; 

    return n && (n & (n - 1)) === 0;
}

function filterState(d) {
    let include = true;
    if (include && filter.bounces != null) {
      include = filter.bounces[d.numBounces];
    }
    // Filter everything out if bounces is empty
    if (filter.bounces == null) {
      include = false;
    }
    if (include && filter.ptheta_rocking != null) {
      include = filter.ptheta_rocking[d.ptheta_rocking];
    }
    if (include && filter.phase != null) {
      include = (filter.phase == d.phase);
    }
    return include;
}

function wfilterState(d) {
    let include = true;
    if (include && filter.wbounces != null) {
      include = filter.wbounces[d.numBounces];
    }
    // Filter everything out if bounces is empty
    if (filter.wbounces == null) {
      include = false;
    }
    // if (include && filter.ptheta_rocking != null) {
    //   include = filter.ptheta_rocking[d.ptheta_rocking];
    // }
    // if (include && filter.phase != null) {
    //   include = (filter.phase == d.phase);
    // }
    return include;
}

function getToolTipText(d) {
  return `bounces = ${d.numBounces} energy = ${d.energy}\n` +
    `ptheta = ${d.ptheta} pphi = ${d.pphi}\n` +
    `ptheta_rocking = ${d.ptheta_rocking} pphi_rocking = ${d.pphi_rocking}\n` +
    `phase = ${d.phase} T = ${d.T}`
}

function getRockingNumber(d) {
  if (d.phase == 1) {
    // In-phase
    return d.theta_crossings;
  } else {
    // Out-of-phase
    // return d.pphi_rocking;
    return d.beta_crossings;
  }
}

function getIdString(d) {
  // return `(${d.ptheta_rocking},${d.pphi_rocking},${d.numBounces},${d.phase==0?'-':'+'})`;
  // return `(${d.numBounces},${d.ptheta_rocking},${d.pphi_rocking},${d.phase==0?'-':'+'})`;
  // return `(${d.numBounces},${d.theta_crossings},${d.beta_crossings},${d.phase==0?'-':'+'})`;
  let r = getRockingNumber(d);
  if (d.phase == 1) {
    // In-phase
    return `(${d.numBounces},${r},1)`;
  } else {
    // Out-of-phase
    return `(${d.numBounces},${r},2)`;
  }
}

function getDetailsHTML(d) {
  if (d == null) {
    return `<table>` +
      `<tr><td>bounces:</td><td></td></tr>` +
      `<tr><td>energy:</td><td></td></tr>` +
      `<tr><td>ptheta:</td><td></td></tr>` +
      `<tr><td>pphi:</td><td></td></tr>` +
      `<tr><td>p&theta; rocking:</td><td></td></tr>` +
      `<tr><td>p&phi; rocking:</td><td></td></tr>` +
      `<tr><td>phase:</td><td></td></tr>` +
      `<tr><td>&theta; crossings:</td><td></td></tr>` +
      `<tr><td>&phi; crossings:</td><td></td></tr>` +
      `<tr><td>&beta; crossings:</td><td></td></tr>` +
      `<tr><td>T:</td><td></td></tr>` +
      `</table>`;
  }

  return `<table>` +
    `<tr><td>bounces:</td><td>${d.numBounces}</td></tr>` +
    `<tr><td>energy:</td><td>${d.energy}</td></tr>` +
    `<tr><td>ptheta:</td><td>${d.ptheta}</td></tr>` +
    `<tr><td>pphi:</td><td>${d.pphi}</td></tr>` +
    `<tr><td>p&theta; rocking:</td><td>${d.ptheta_rocking}</td></tr>` +
    `<tr><td>p&phi; rocking:</td><td>${d.pphi_rocking}</td></tr>` +
    `<tr><td>phase:</td><td>${d.phase}</td></tr>` +
    `<tr><td>&theta; crossings:</td><td>${d.theta_crossings}</td></tr>` +
    `<tr><td>&phi; crossings:</td><td>${d.phi_crossings}</td></tr>` +
    `<tr><td>&beta; crossings:</td><td>${d.beta_crossings}</td></tr>` +
    `<tr><td>T:</td><td>${d.T}</td></tr>` +
    `</table>`;
}

function getRadius(d) {
  return radius;
  // return d.unique ? radius : 3*radius/4;
}

let symbolSize = 30;
let symbols = [
  d3.symbol().type(d3.symbolCircle).size(symbolSize)(),
  d3.symbol().type(d3.symbolCross).size(symbolSize)(),
  d3.symbol().type(d3.symbolDiamond).size(symbolSize)(),
  d3.symbol().type(d3.symbolSquare).size(symbolSize)(),
  d3.symbol().type(d3.symbolStar).size(symbolSize)(),
  d3.symbol().type(d3.symbolTriangle).size(symbolSize)(),
  d3.symbol().type(d3.symbolWye).size(symbolSize)(),
];

function getSymbol(d) {
  // return symbols[d.numBounces % symbols.length];
  return symbols[getRockingNumber(d) % symbols.length];
}

function addCircle(svg_id, states, minE, maxE) {
  let svg = d3.select('#' + svg_id);

  states = states.filter(s => s.energy >= minE && s.energy <= maxE);

  return svg.selectAll("circle")
  // return svg.selectAll("#state")
    .data(states)
    .enter()
    .append("a")
    .attr("xlink:href", d =>
          savingSvg ? null :
          `http://edwardsjohnmartin.github.io/MagPhyx/` +
          `?initparams=1,0,0,${d.pr},${d.ptheta},${d.pphi}`)
    .attr("target", "_magphyx")
    .append("circle")
    // .append('path')
    // .attr('d', d => getSymbol(d))
    // .attr("id", "state")
    .attr("fill", d => getColor(d))
    .attr("fill-opacity", d => {
      return d.phase == 0 ? 1 : 0.1})
    .attr("stroke", d => getColor(d))
    .attr("stroke-width", d => 1)
    .attr("r", d => getRadius(d))
    .on("click", function() {
      d3.select(this).attr("r", 6);
    })
    .on("mouseover", function(d,i) { handleMouseOver(d,i,svg_id,this); })
    .on("mouseout", handleMouseOut)
  ;
}

// let minE_ = -0.35;
// let maxE_ = 0.02;
let defaultMinE = -0.35;
let defaultMaxE = 0.02;
let minE = defaultMinE;
let maxE = defaultMaxE;

let setETick = 0.05;

function updateStatesVis() {
  let allStates = allStatesAll;
  let bifurcationStates = bifurcationStatesAll;
  if (document.getElementById("unique_states").checked) {
    allStates = allStates.filter(s => s.unique);
    // allStates = allStatesUnique;
    bifurcationStates = bifurcationStates.filter(s => s.unique);
    // bifurcationStates = bifurcationStatesUnique;
  }

  if (document.getElementById("equal_states").checked) {
    allStates = allStates.filter(s => s.pphi_rocking == s.ptheta_rocking);
    // allStates = allStatesUnique;
    bifurcationStates = bifurcationStates.filter(s => s.pphi_rocking == s.ptheta_rocking);
    // bifurcationStates = bifurcationStatesUnique;
  }

  // Filter states
  states = allStates.filter(filterState);
  bStates = bifurcationStates.filter(wfilterState);

  let rect = document.getElementById('states_svg').getBoundingClientRect();
  let svgWidth = rect.width;
  let svgHeight = rect.height;

  // Axis coordinates are for the actual vertical or horizontal line in svg coordinates
  // (with y=0 at the bottom).

  // Location of the y axis on the left
  let leftAxisX = 80;
  // Location of the y axis on the right
  let rightAxisX = svgWidth-80;
  // Location of the x axis on the bottom
  let bottomAxisY = 92;
  // Location of the x axis on the top
  let topAxisY = svgHeight-20;
  // Dimensions of the actual plot svg
  let dataWidth = rightAxisX - leftAxisX;
  let dataHeight = topAxisY-bottomAxisY;

  // let minx = 60;
  let maxx = 680;
  let miny = 20;
  let maxy = 580;

  // let minE = d3.min(allStates, d=>d.energy);
  // let maxE = d3.max(allStates, d=>d.energy);

  // console.log('minE = ' + minE);
  // console.log('maxE = ' + maxE);
  // if (minE_ != null) {
  //   minE = minE_;
  //   maxE = maxE_;
  // }
  let minpphi = -0.01;//d3.min(allStates, d=>d.pphi);
  // let maxpphi = 0.21;//d3.max(allStates, d=>d.pphi);
  let maxpphi = 0.19;

  let eScale = d3.scaleLinear()
    .domain([minE, maxE])
    // .range([minx, maxx]);
    // .range([leftAxisX, maxx]);
    // .range([0, maxx]);
    .range([0, dataWidth]);
  let pphiScale = d3.scaleLinear()
    .domain([minpphi, maxpphi])
    // .range([maxy, miny]);
    .range([svgHeight-bottomAxisY, svgHeight-topAxisY]);
  let yAxisScale = pphiScale;
  // let yAxisScale = d3.scaleLinear()
  //   // .domain([minpphi, maxpphi])
  //   .domain([minpphi, maxpphi])
  //   // .range([maxy, 0]);
  //   .range([svgHeight-bottomAxisY, 0]);
    // .domain([yScale.invert(600), 0])
    // .range([maxy, 0]);

  // let xtickValues = [-0.35, -0.3, -0.25, -0.2, -0.15, -0.1, -0.05, 0];
  xtickValues = [];
  let etick = (maxE - minE)/7;
  if (setETick) {
    etick = setETick;
  }
  // console.log(etick);
  for (let e = minE; e <= maxE; e += etick) {
    xtickValues.push(e);
  }
  // console.log(xtickValues);
  let ytickValues = [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16,
                     0.18, 0.2];

  let x_axis = d3.axisBottom()
    .scale(eScale)
    .tickSizeOuter(0) 
    .tickValues(xtickValues)
 ;
  let tickSize = x_axis.tickSizeInner();

  let x2_axis = d3.axisTop()
    .scale(eScale)
    .tickSizeOuter(0)
    .tickValues(xtickValues)
    .tickFormat('')
  ;

  let y_axis = d3.axisLeft()
    // .scale(pphiScale)
    .scale(yAxisScale)
    .tickSizeOuter(0)
    .tickValues(ytickValues)
  ;

  let y2_axis = d3.axisRight()
    .scale(yAxisScale)
    .tickSizeOuter(0)
    .tickValues(ytickValues)
    .tickFormat('')
  ;

  svg = d3.select("#states_svg");
  svg.selectAll('*').remove();

  svg.on("mousemove", function () {
    let p = d3.mouse(this);
    // let E = eScale.invert(p[0]-xoffset);
    let E = eScale.invert(p[0]-leftAxisX);
    var details = document.getElementById('epos');
    details.innerHTML = "E = " + E;
  });

  // x axis
  svg.append("g")
    .attr("class", "axis")
    // .attr('transform', `translate(${leftAxisX}, ${pphiScale(minpphi)+20})`)
    .attr('transform', `translate(${leftAxisX}, ${svgHeight-bottomAxisY})`)
    .call(x_axis)
    .selectAll(".tick line")
    .attr("transform", `translate(0,-${tickSize})`)
  ;
  svg.append("g")
    .attr("class", "axis")
    // .attr('transform', `translate(${leftAxisX + dataWidth/2}, ${pphiScale(minpphi)+70})`)
    .attr('transform', `translate(${leftAxisX + dataWidth/2}, ${svgHeight-bottomAxisY+50})`)
    .append('text')
    .html('E')
    .attr("class", "axis-label")
    // .append('tspan')
    // .attr('baseline-shift', 'sub')
    // .html('mnp')
  ;

  // x2 axis
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${leftAxisX}, ${svgHeight-topAxisY})`)
    .call(x2_axis)
    .selectAll(".tick line")
    .attr("transform", `translate(0,${tickSize})`)
  ;

  // y axis
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${leftAxisX}, ${0})`)
    .call(y_axis)
    .selectAll(".tick line")
    .attr("transform", `translate(${tickSize},0)`)
  ;
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(15, ${svgHeight-(topAxisY+bottomAxisY)/2}) rotate(${-90})`)
    .append('text')
    .attr("class", "axis-label")
    .html('p')
    .append('tspan')
    .attr('baseline-shift', 'sub')
    .html('&phi;')
    .append('tspan')
    .html('(0)')
  ;

  // y2 axis
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${rightAxisX}, ${0})`)
    .call(y2_axis)
    .selectAll(".tick line")
    .attr("transform", `translate(${-tickSize},0)`)
  ;

  let barHeight = 30;
  // let bary = pphiScale(minpphi)+10-barHeight/2;
  let bary = svgHeight-(bottomAxisY + barHeight/2);
  let brush = d3.brushX()
    .extent([[leftAxisX, bary], [rightAxisX, bary+barHeight]])
    .on("end", () => {
      let x0 = d3.event.selection[0];
      let x1 = d3.event.selection[1];
      // minE_ = eScale.invert(x0-xoffset);
      // minE_ = eScale.invert(x0-leftAxisX);
      minE = eScale.invert(x0-leftAxisX);
      // maxE_ = eScale.invert(x1-xoffset);
      // maxE_ = eScale.invert(x1-leftAxisX);
      maxE = eScale.invert(x1-leftAxisX);
      document.getElementById('minE').value = minE;
      document.getElementById('maxE').value = maxE;
      setETick = null;
      updateStatesVis();
    })
  ;
  svg.append("g").attr("class", "brush").call(brush);

  addCircle('states_svg', states, minE, maxE)
    // .attr("cx", function(d) { return xoffset + eScale(d.energy); })
    .attr("cx", function(d) { return leftAxisX + eScale(d.energy); })
    .attr("cy", function(d) { return pphiScale(d.pphi); })
  ;

  // //---------------------
  // // Debug
  // //---------------------
  // let debug = d3.select('#states_svg');
  // debug.selectAll("#debugcircle")
  //   .data([1])
  //   .enter()
  //   .append("circle")
  //   .attr('class', 'debugcircle')
  //   .attr("fill", 'red')
  //   .attr("stroke", 'red')
  //   .attr("stroke-width", 1)
  //   .attr("r", 3)
  //   // .attr("cx", leftAxisX)
  //   .attr("cx", leftAxisX + eScale(-0.25))
  //   // .attr("cy", svgHeight-topAxisY)
  //   .attr("cy", svgHeight-bottomAxisY)
  // ;
}

function handleMouseOver(d, i, svg_id, element) {  // Add interactivity
  let svg = d3.select('#' + svg_id);

  var details = document.getElementById('details');
  details.innerHTML = getDetailsHTML(d);

  // Use D3 to select element, change color and size
  d3.select(element).attr('r', radius*2);

  let cx = d3.select(element).attr('cx');
  let cy = d3.select(element).attr('cy');
  let t = getIdString(d);

  // Create an id for text so we can select it later for
  // removing on mouseout
  let id = 'id-' + d.numBounces + "-" + 
    d.ptheta_rocking + "-" + d.pphi_rocking + "-" +
    d.phase + "-" + i;

  // Specify where to put label of text
  svg.append("text")
    .attr('id', id)
    .attr('class', id)
    .attr('x', function() { return cx - 30; })
    .attr('y', function() { return cy - 15; })
    .text(t)
  ;

  let ctx = document.getElementById(svg_id);
  let textElm = document.getElementById(id);
  let SVGRect = textElm.getBBox();

  var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", SVGRect.x);
  rect.setAttribute("y", SVGRect.y);
  rect.setAttribute("width", SVGRect.width);
  rect.setAttribute("height", SVGRect.height);
  rect.setAttribute("fill", "#ffffff");
  rect.setAttribute('class', id);
  ctx.insertBefore(rect, textElm);
}

function handleMouseOut(d, i) {
  let id = 'id-' + d.numBounces + "-" + d.ptheta_rocking + "-" + d.pphi_rocking + "-" +
    d.phase + "-" + i;

  var details = document.getElementById('details');
  details.innerHTML = getDetailsHTML(null);

  // Use D3 to select element, change color back to normal
  // d3.select(this).attr('r', radius);
  d3.select(this).attr('r', d => getRadius(d));

  // Select text by id and then remove
  d3.selectAll("." + id).remove();
}

// Returns an array of booleans. If the number i is included in s and the
// return value is numbers, then numbers[i] == true.
function parseNumbersRaw(s) {
  // Parse the filter string
  let numbers = [];
  let tokens = s.split(',');
  tokens.forEach((y,i) => {
    y = y.trim();
    if (y.length > 0) {
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
    }
  });

  if (numbers.length == 0) {
    return new Array(0);
  }

  return numbers;
}

// Returns an array of booleans. If the number i is included in s and the
// return value is numbers, then numbers[i] == true.
function parseNumbers(s, numberArray = false) {
  // Parse the filter string
  let numbers = [];
  let tokens = s.split(',');
  tokens.forEach((y,i) => {
    y = y.trim();
    if (y.length > 0) {
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
    }
  });

  if (numberArray) {
    return numbers;
  }

  if (numbers.length == 0) {
    return new Array(0);
  }

  let max = Math.max(...numbers);
  let arr = new Array(max+1).fill(false);
  numbers.forEach(i => { arr[i] = true; });
  return arr;
}

function parseBouncesFilter() {
  let numbers;
  try {
    let s = document.getElementById('bounces_filter').value;
    numbers = parseNumbers(s);
  } catch(e) {
    console.log(e);
    return;
  }

  if (numbers.length > 0) {
    filter.bounces = numbers;
  } else {
    filter.bounces = null;
  }
}

function parseWBouncesFilter() {
  let numbers;
  try {
    let s = document.getElementById('wbounces_filter').value;
    numbers = parseNumbers(s);
  } catch(e) {
    console.log(e);
    return;
  }

  if (numbers.length > 0) {
    filter.wbounces = numbers;
  } else {
    filter.wbounces = null;
  }
}

function parseRockingFilter() {
  let numbers;
  try {
    let s = document.getElementById('rocking_filter').value;
    numbers = parseNumbers(s);
  } catch(e) {
    console.log(e);
    return;
  }

  if (numbers.length > 0) {
    filter.ptheta_rocking = numbers;
  } else {
    filter.ptheta_rocking = null;
  }
}

function parsePhaseFilter() {
  let radios = document.getElementsByName('phaseFilter');
  radios.forEach(r => {
    if (r.checked) {
      filter.phase = +r.value;
    }
  });
  if (filter.phase == -1) {
    filter.phase = null;
  }
}

function bouncesFilterChanged() {
  parseBouncesFilter();
  updateStatesVis();
  et.updateVis();
}

function wbouncesFilterChanged() {
  parseWBouncesFilter();
  updateSpiderWebVis();
  et.updateVis();
}

function rockingFilterChanged() {
  parseRockingFilter();
  updateStatesVis();
}

function minEChanged() {
  let f = parseFloat(document.getElementById('minE').value);
  if (f == f) {
    minE = f;
    updateStatesVis();
  }
}

function maxEChanged() {
  let f = parseFloat(document.getElementById('maxE').value);
  if (f == f) {
    maxE = f;
    updateStatesVis();
  }
}

function deltaEChanged() {
  let f = parseFloat(document.getElementById('deltaE').value);
  if (f == f) {
    setETick = f;
    updateStatesVis();
  }
}

function radiusChanged() {
  let f = parseFloat(document.getElementById('radius').value);
  if (f == f) {
    radius = f;
    updateStatesVis();
  }
}

function spiderLinesChanged() {
  updateSpiderWebVis();
}

function phaseFilterChanged() {
  parsePhaseFilter();
  updateStatesVis();
}

function uniqueStatesChanged() {
  updateStatesVis();
  updateSpiderWebVis();
  et.updateVis();
}

function equalStatesChanged() {
  updateStatesVis();
  updateSpiderWebVis();
  et.updateVis();
}

function primeFactors(n) {
  if (n == 0)
    return new Set([])
  let factors = [];

  // Get the number of twos that divide n 
  while (n % 2 == 0) {
    factors.push(2);
    n = n / 2;
  }
  
  // n must be odd at this point 
  // so a skip of 2 (i = i + 2) can be used 
  for (let i = 3; i < Math.floor((Math.sqrt(n))+1); i+=2) {
    // while i divides n, print i and divide n
    while (n % i == 0) {
      factors.push(i);
      n = n / i;
    }
  }
  
  // Condition if n is a prime
  // number greater than 2
  if (n > 2) {
    factors.push(n);
  }
  
  return new Set(factors);
}

function intersection(setA, setB) {
  var _intersection = new Set();
  for (var elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem);
    }
  }
  return _intersection;
}

// Returns true if three numbers share a prime factor.
function haveSharedFactor(a, b, c) {
  let ap = primeFactors(a);
  let bp = primeFactors(b);
  let cp = primeFactors(c);

  let inter = intersection(ap, intersection(bp, cp));

  return inter.size > 0;
}

function readStatesData(d) {
  allStatesAll = [];
  allStatesUnique = [];
  bifurcationStatesAll = [];
  bifurcationStatesUnique = [];
  let cur_ptc = -1;
  let cur_ppc = -1;
  let cur_tc = -1;
  let cur_pc = -1;
  let cur_bc = -1;
  let cur_n = -1;
  let cur_phase = -1;
  d.forEach(function(s) {
    // Calculate the phase because sometimes the phase in the
    // data is incorrect. Not sure why.
    let calcPhase = (s.ptheta * s.pphi < 0) ? 0 : 1;
    let unique = !haveSharedFactor(
      s.n, s.ptheta_rocking, s.pphi_rocking);
    let state = {
      bifurcation : s.bifurcation,
      numBounces : s.n,
      energy : s.E,
      pr : s.pr,
      ptheta : s.ptheta,
      pphi : s.pphi,
      ptheta_rocking : s.ptheta_rocking,
      pphi_rocking : s.pphi_rocking,
      phase : calcPhase,
      theta_crossings : s.theta_crossings,
      phi_crossings : s.phi_crossings,
      beta_crossings : s.beta_crossings,
      T : s.period,
      unique : unique,
    };
    allStatesAll.push(state);
    if (unique) {
      allStatesUnique.push(state);
    }

    if (s.bifurcation) {
      bifurcationStatesAll.push(state);
    }
    cur_ptc = s.ptheta_rocking;
    cur_ppc = s.pphi_rocking;
    cur_tc = s.theta_crossing;
    cur_pc = s.phi_crossing;
    cur_bc = s.beta_crossing;
    cur_n = s.n;
    cur_phase = calcPhase;
    // }
  });
  parseBouncesFilter();
  parseWBouncesFilter();
  parseRockingFilter();
  updateStatesVis();
  updateSpiderWebVis();
  et.updateVis();
}

let spiderCurveX;
let spiderCurveY;

function readSpiderCurveData(d) {
  spiderCurveY = [];
  d.forEach(function(s) {
    spiderCurveY.push(+s['E = -1/3a^3']);
  });

  spiderCurveX = [];
  let cols = [
    'T1np/T2','T2np/T2','T3np/T2','T4np/T2','T5np/T2','T6np/T2','T7np/T2',
    'T9np/T2','T11np/T2','T13np/T2','T15np/T2','T19np/T2','T27np/T2',
    'T31np/T2','T39np/T2','T47np/T2','T55np/T2','T63np/T2','T79np/T2',
    'T111np/T2','T157np/T2','T997np/T2'
  ];
  for (let i = 0; i < cols.length; ++i) {
    spiderCurveX.push([]);
  }

  d.forEach(function(s, i) {
    cols.forEach((c,i) => {
      spiderCurveX[i].push(+s[c]);
    });
  });
}

function init() {
  document.onkeydown = keyDown;

  var details = document.getElementById('details');
  details.innerHTML = getDetailsHTML(null);

  // Read the dataset file
  d3.csv('integralspider.csv')
    .then(readSpiderCurveData)
    .then(() => {
      d3.json('states_all.json')
        .then(readStatesData);
    });
}

function saveStatesSvg() {
  try {
    var isFileSaverSupported = !!new Blob();
  } catch (e) {
    alert("blob not supported");
  }

  // Remove xlink attributes
  savingSvg = true;
  updateStatesVis();

  var html = d3.select("#states_svg")
    .attr("title", "test2")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .node().outerHTML;

  var blob = new Blob([html], {type: "image/svg+xml"});
  saveAs(blob, "states.svg");

  // Put xlink attributes back
  savingSvg = false;
  updateStatesVis();
}

function saveSpiderSvg() {
  try {
    var isFileSaverSupported = !!new Blob();
  } catch (e) {
    alert("blob not supported");
  }

  // Remove xlink attributes
  savingSvg = true;
  updateSpiderWebVis();

  var html = d3.select("#spider_web_svg")
    .attr("title", "test2")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .node().outerHTML;

  var blob = new Blob([html], {type: "image/svg+xml"});
  saveAs(blob, "spider.svg");

  // Put xlink attributes back
  savingSvg = false;
  updateSpiderWebVis();
}

function saveETSvg() {
  try {
    var isFileSaverSupported = !!new Blob();
  } catch (e) {
    alert("blob not supported");
  }

  // Remove xlink attributes
  savingSvg = true;
  et.updateVis();

  var html = d3.select("#et_svg")
    .attr("title", "test2")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .node().outerHTML;

  var blob = new Blob([html], {type: "image/svg+xml"});
  saveAs(blob, "et.svg");

  // Put xlink attributes back
  savingSvg = false;
  et.updateVis();
}

function keyDown(e) {
  // if (e.target != document.body) {
  //   if (e.target.type != "button") {
  //     return;
  //   }
  // }
  let numbers;

  switch (e.keyCode) {
  case "R".charCodeAt(0):
    // minE_ = null;
    // maxE_ = null;
    minE = defaultMinE;
    maxE = defaultMaxE;
    setETick = 0.05;
    document.getElementById('minE').value = minE;
    document.getElementById('maxE').value = maxE;
    document.getElementById('deltaE').value = setETick;
    updateStatesVis();
    break;
  case "S".charCodeAt(0):
    saveStatesSvg();
    break;
  case "W".charCodeAt(0):
    saveSpiderSvg();
    break;
  case "E".charCodeAt(0):
    saveETSvg();
    break;
  case "J".charCodeAt(0):
  case 37:
    // Down
    try {
      let s = document.getElementById('bounces_filter').value;
      numbers = parseNumbersRaw(s);
    } catch(e) {
      numbers = [2];
      // return;
    }
    if (numbers.length == 0) numbers = [2];
    if (numbers[0] < 2) numbers = [2];
    let dn = numbers[0]-1;
    while (dn > 1 &&
           allStatesAll.filter(s => s.numBounces == dn).length == 0) {
      dn--;
    } 
    // document.getElementById('bounces_filter').value = numbers[0]-1;
    document.getElementById('bounces_filter').value = dn;
    bouncesFilterChanged();
    break;
  case "K".charCodeAt(0):
  case 39:
    // Up
    try {
      let s = document.getElementById('bounces_filter').value;
      numbers = parseNumbersRaw(s);
    } catch(e) {
      numbers = [0];
    }
    if (numbers.length == 0) numbers = [0];
    let un = numbers[0]+1;
    while (un < 1000 &&
           allStatesAll.filter(s => s.numBounces == un).length == 0) {
      un++;
    } 
    // document.getElementById('bounces_filter').value = numbers[0]+1;
    document.getElementById('bounces_filter').value = un;
    bouncesFilterChanged();
    break;
  }
}
