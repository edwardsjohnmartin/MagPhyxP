let googleColors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];

let allStatesAll;
let allStatesUnique;
let bifurcationStatesAll;
let bifurcationStatesUnique;

let savingSvg = false;

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
    return d.pphi_rocking;
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
  return d.unique ? radius : 3*radius/4;
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

let minE_ = null;
let maxE_ = null;

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

  let minx = 20;
  let maxx = 680;
  let miny = 20;
  let maxy = 580;

  let minE = d3.min(allStates, d=>d.energy);
  let maxE = d3.max(allStates, d=>d.energy);
  if (minE_ != null) {
    minE = minE_;
    maxE = maxE_;
  }
  let minpphi = d3.min(allStates, d=>d.pphi);
  let maxpphi = d3.max(allStates, d=>d.pphi);

  let eScale = d3.scaleLinear()
    .domain([minE, maxE])
    .range([minx, maxx]);
  let pphiScale = d3.scaleLinear()
    .domain([minpphi, maxpphi])
    .range([maxy, miny]);

  let x_axis = d3.axisBottom().scale(eScale);
  let y_axis = d3.axisLeft().scale(pphiScale);

  svg = d3.select("#states_svg");
  svg.selectAll('*').remove();

  svg.on("mousemove", function () {
    let p = d3.mouse(this);
    let E = eScale.invert(p[0]-xoffset);
    var details = document.getElementById('epos');
    details.innerHTML = "E = " + E;
  });

  let xoffset = 60;

  // x axis
  svg.append("g")
    .attr('transform', `translate(${xoffset}, ${pphiScale(minpphi)+20})`)
    .call(x_axis)
  ;
  svg.append("g")
    .attr('transform', `translate(${xoffset + (minx+maxx)/2}, ${pphiScale(minpphi)+60})`)
    .append('text')
    .html('energy')
  ;

  // y axis
  svg.append("g")
    .attr('transform', `translate(${xoffset}, ${pphiScale(maxpphi)-20})`)
    .call(y_axis)
  ;
  svg.append("g")
    .attr('transform', `translate(20, ${pphiScale((maxpphi-minpphi)/2)}) rotate(${-90})`)
    .append('text')
    .html('p&phi;')
  ;

  let svgBounds = svg.node().getBoundingClientRect();
  let svgWidth = svgBounds.width;// - svg.margin.left - svg.margin.right;
  let svgHeight = 800;

  let barHeight = 30;
  let bary = pphiScale(minpphi)+10-barHeight/2;
  let brush = d3.brushX()
    .extent([[xoffset+minx, bary], [xoffset+maxx, bary+barHeight+10]])
    .on("end", () => {
      let x0 = d3.event.selection[0];
      let x1 = d3.event.selection[1];
      minE_ = eScale.invert(x0-xoffset);
      maxE_ = eScale.invert(x1-xoffset);
      updateStatesVis();
    })
  ;
  svg.append("g").attr("class", "brush").call(brush);

  addCircle('states_svg', states, minE, maxE)
    .attr("cx", function(d) { return xoffset + eScale(d.energy); })
    .attr("cy", function(d) { return pphiScale(d.pphi); })
    // .attr('transform', function(d) {
    //   return 'translate(' + (xoffset + eScale(d.energy)) + ', ' +
    //     pphiScale(d.pphi) + ')';
    // })
  ;
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
}

function wbouncesFilterChanged() {
  parseWBouncesFilter();
  updateSpiderWebVis();
}

function rockingFilterChanged() {
  parseRockingFilter();
  updateStatesVis();
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
}

function equalStatesChanged() {
  updateStatesVis();
  updateSpiderWebVis();
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

function init() {
  document.onkeydown = keyDown;

  let modes = parseNumbers(
    document.getElementById('wbounces_filter').value, true);
  for (let i = 0; i < modes.length; i++) {
    cmap[modes[i]] = i;
  }

  var details = document.getElementById('details');
  details.innerHTML = getDetailsHTML(null);

  // Read the dataset file
  let dataset = "states_all.json";
  d3.json(dataset)
    .then(function(d) {
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
          // phase : s.phase,
          phase : calcPhase,
          theta_crossings : s.theta_crossings,
          phi_crossings : s.phi_crossings,
          beta_crossings : s.beta_crossings,
          T : s.period,
          unique : unique,
        };
        // if (s.n == 999) {
        //   console.log(s);
        // }
        allStatesAll.push(state);
        if (unique) {
          allStatesUnique.push(state);
        }

        // if (s.ptheta_rocking != cur_ptc || s.pphi_rocking != cur_ppc || s.n != cur_n || calcPhase != cur_phase) {
        // if (s.ptheta_rocking != cur_ptc &&
        //     s.pphi_rocking != cur_ppc &&
        //     s.n != cur_n &&
        //     calcPhase != cur_phase) {
        // if (s.ptheta_rocking != cur_ptc ||
        //     s.pphi_rocking != cur_ppc ||
        //     // s.theta_crossings != cur_tc ||
        //     // s.phi_crossings != cur_pc ||
        //     // s.beta_crossings != cur_bc ||
        //     s.n != cur_n ||
        //     calcPhase != cur_phase) {
        // let bstate = calcPhase != cur_phase || s.n != cur_n;
        // if (!bstate) {
        //   if (calcPhase == 1) {
        //     bstate = s.theta_crossings != cur_tc;
        //   } else {
        //     bstate = s.pphi_rocking != cur_ppc;
        //   }
        // }
        // if (s.ptheta_rocking != cur_ptc ||
        //     s.pphi_rocking != cur_ppc ||
        //     s.n != cur_n ||
        //     calcPhase != cur_phase) {
        // if (bstate) {
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

function keyDown(e) {
  // if (e.target != document.body) {
  //   if (e.target.type != "button") {
  //     return;
  //   }
  // }
  let numbers;

  switch (e.keyCode) {
  case "R".charCodeAt(0):
    minE_ = null;
    maxE_ = null;
    updateStatesVis();
    break;
  case "S".charCodeAt(0):
    saveStatesSvg();
    break;
  case "W".charCodeAt(0):
    saveSpiderSvg();
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
