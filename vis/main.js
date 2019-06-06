let googleColors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];

let allStatesAll;
let allStatesUnique;
let bifurcationStatesAll;
let bifurcationStatesUnique;

let filter = {
  bounces : null,
  ptheta_rocking : null,
  phase : null
};

let radius = 3;

function color(i) {
  const n = googleColors.length;
  return googleColors[i%n];
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

function getToolTipText(d) {
  return `bounces = ${d.numBounces} energy = ${d.energy}\n` +
    `ptheta = ${d.ptheta} pphi = ${d.pphi}\n` +
    `ptheta_rocking = ${d.ptheta_rocking} pphi_rocking = ${d.pphi_rocking}\n` +
    `phase = ${d.phase} T = ${d.T}`
}

function getIdString(d) {
  return `(${d.ptheta_rocking},${d.pphi_rocking},${d.numBounces},${d.phase==0?'-':'+'})`;
}

function getDetailsHTML(d) {
  // return `<table>` +
  //   `<tr><td style="text-align:right">bounces:</td><td>${d.numBounces}</td></tr>` +
  //   `<tr><td style="text-align:right">energy:</td><td>${d.energy}</td></tr>` +
  //   `<tr><td style="text-align:right">ptheta:</td><td>${d.ptheta}</td></tr>` +
  //   `<tr><td style="text-align:right">pphi:</td><td>${d.pphi}</td></tr>` +
  //   `<tr><td style="text-align:right">ptheta_rocking:</td><td>${d.ptheta_rocking}</td></tr>` +
  //   `<tr><td style="text-align:right">pphi_rocking:</td><td>${d.pphi_rocking}</td></tr>` +
  //   `<tr><td style="text-align:right">phase:</td><td>${d.phase}</td></tr>` +
  //   `<tr><td style="text-align:right">T:</td><td>${d.T}</td></tr>` +
  //   `</table>`;

  return `<table>` +
    `<tr><td>bounces:</td><td>${d.numBounces}</td></tr>` +
    `<tr><td>energy:</td><td>${d.energy}</td></tr>` +
    `<tr><td>ptheta:</td><td>${d.ptheta}</td></tr>` +
    `<tr><td>pphi:</td><td>${d.pphi}</td></tr>` +
    `<tr><td>p&theta; rocking:</td><td>${d.ptheta_rocking}</td></tr>` +
    `<tr><td>p&phi; rocking:</td><td>${d.pphi_rocking}</td></tr>` +
    `<tr><td>phase:</td><td>${d.phase}</td></tr>` +
    `<tr><td>T:</td><td>${d.T}</td></tr>` +
    `</table>`;
  // return `<table>
  //   <tr><td>bounces:</td><td>${d.numBounces}</td></tr>` +
  //   `energy = ${d.energy}<br>` +
  //   `ptheta = ${d.ptheta}<br>pphi = ${d.pphi}<br>` +
  //   `ptheta_rocking = ${d.ptheta_rocking}<br>` +
  //   `pphi_rocking = ${d.pphi_rocking}<br>` +
  //   `phase = ${d.phase}<br>` +
  //   `T = ${d.T}` +
  //   `</table>`;
}

function addCircle(svg_id, states, minE, maxE) {
  let svg = d3.select('#' + svg_id);

  states = states.filter(s => s.energy >= minE && s.energy <= maxE);
  return svg.selectAll("circle")
    .data(states)
    .enter()
    .append("a")
    .attr("xlink:href", d =>
          `http://edwardsjohnmartin.github.io/MagPhyx/` +
          `?initparams=1,0,0,${d.pr},${d.ptheta},${d.pphi}`)
    .attr("target", "_magphyx")
    .append("circle")
    // .attr("cx", function(d) { return xoffset + eScale(d.energy); })
    // .attr("cy", function(d) { return pphiScale(d.pphi); })
    // .attr("fill", d => d.phase == 0 ? color(d.numBounces) : 'none')
    .attr("fill", d => color(d.numBounces))
    .attr("fill-opacity", d => {
      return d.phase == 0 ?
        ((d.ptheta_rocking == d.pphi_rocking) ? 1 : 0.6) :
        0.1})
    .attr("stroke", d => color(d.numBounces))
    .attr("stroke-width", d => 1)
    .attr("r", radius)
    .on("click", function() {
      // console.log(this);
      d3.select(this).attr("r", 6);
    })
    // .on("mouseover", handleMouseOver)
    // .on("mouseout", handleMouseOut)
    .on("mouseover", function(d,i) { handleMouseOver(d,i,svg_id,this); })
    .on("mouseout", handleMouseOut)
    // .append("title")
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
  bStates = bifurcationStates.filter(filterState);

  // if (states.length == 0) return;

  let minx = 20;
  let maxx = 680;
  let miny = 20;
  let maxy = 580;

  // let minE = d3.min(states, d=>d.energy);
  // let maxE = d3.max(states, d=>d.energy);
  // let minpphi = d3.min(states, d=>d.pphi);
  // let maxpphi = d3.max(states, d=>d.pphi);
  let minE = d3.min(allStates, d=>d.energy);
  let maxE = d3.max(allStates, d=>d.energy);
  if (minE_ != null) {
    minE = minE_;
    maxE = maxE_;
  }
  let minpphi = d3.min(allStates, d=>d.pphi);
  let maxpphi = d3.max(allStates, d=>d.pphi);

  // let tempScale = d3.scaleLinear()
  //   .domain([minE, maxE])
  //   .range([minx, maxx]);  
  // let x_axis = d3.axisBottom().scale(tempScale);

  let eScale = d3.scaleLinear()
    .domain([minE, maxE])
    .range([minx, maxx]);
  let pphiScale = d3.scaleLinear()
    .domain([minpphi, maxpphi])
    .range([maxy, miny]);

  let x_axis = d3.axisBottom().scale(eScale);
  let y_axis = d3.axisLeft().scale(pphiScale);

  // console.log("minE, maxE = " + minE + " " + maxE);

  // let maxNumBounces = d3.max(states, m => m.numBounces);

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
  // console.log(svgBounds);
  let barHeight = 30;
  let bary = pphiScale(minpphi)+10-barHeight/2;
  let brush = d3.brushX()
    // .extent([[0, bary-10], [this.svgWidth, bary+barHeight+10]])
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
  // svg.selectAll("circle")
  //   .data(states)
  //   .enter()
  //   .append("a")
  //   .attr("xlink:href", d =>
  //         `http://edwardsjohnmartin.github.io/MagPhyx/` +
  //         `?initparams=1,0,0,${d.pr},${d.ptheta},${d.pphi}`)
  //   .attr("target", "_magphyx")
  //   .append("circle")
    .attr("cx", function(d) { return xoffset + eScale(d.energy); })
    .attr("cy", function(d) { return pphiScale(d.pphi); })
  //   // .attr("fill", d => d.phase == 0 ? color(d.numBounces) : 'none')
  //   .attr("fill", d => color(d.numBounces))
  //   .attr("fill-opacity", d => {
  //     return d.phase == 0 ?
  //       ((d.ptheta_rocking == d.pphi_rocking) ? 1 : 0.6) :
  //       0.1})
  //   .attr("stroke", d => color(d.numBounces))
  //   .attr("stroke-width", d => 1)
  //   .attr("r", radius)
  //   .on("click", function() {
  //     // console.log(this);
  //     d3.select(this).attr("r", 6);
  //   })
  //   .on("mouseover", handleMouseOver)
  //   .on("mouseout", handleMouseOut)
  //   .append("title")
  ;

  // //----------------------------------------
  // // legend
  // //----------------------------------------
  // let legendVals = [];
  // states.forEach(d => legendVals.push(d.numBounces));
  // legendVals = Array.from(new Set(legendVals)).reverse();

  // d3.select('.legend').selectAll('*').remove();
  // let legend = d3.select('.legend')
  //   .selectAll("legend")
  //   .data(legendVals);
  // p = legend.enter()
  //   .append("div")
  //   .attr("class","legend-div")
  //   .append("p")
  //   .attr("class","legend-text");
  // p.append("span")
  //   .attr("class","key-dot")
  //   // .style("background", (d,i) => googleColors[i] );
  //   // .style("background", (d,i) => googleColors[d] );
  //   .style("background", (d,i) => color(d) );
  // p.insert("text").text(d => d);

  // //----------------------------------------
  // // rocking numbers
  // //----------------------------------------
  // svg.selectAll('.rocking-label')
  //   .data(bStates)
  //   .enter()
  //   .append('text')
  //   // .text(d => (d.phase == 0) ? '-'+d.rocking.toString() : '+'+d.rocking.toString())
  //   .text(d => d.ptheta_rocking.toString() + ',' + d.pphi_rocking.toString() + ',' + ((d.phase == 0) ? '-':'+'))
  //   .attr('font-size', '12px')
  //   .attr("x", function(d) { return xoffset + eScale(d.energy); })
  //   .attr("y", function(d) { return pphiScale(d.pphi)+15; })
  //   .attr('class', 'rocking-label')
  //   .style("text-anchor", "middle");
}

function handleMouseOver(d, i, svg_id, element) {  // Add interactivity
  let svg = d3.select('#' + svg_id);
  // console.log(this);

  // d3.select(this).attr("r", 6);
  var details = document.getElementById('details');
  details.innerHTML = getDetailsHTML(d);

  // let element = this;

  // Use D3 to select element, change color and size
  // d3.select(this).attr('r', radius*2);
  d3.select(element).attr('r', radius*2);
    // fill: "orange",
  //   r: radius * 2
  // });

  // svg = d3.select("#states_svg");

  // let cx = d3.select(this).attr('cx');
  // let cy = d3.select(this).attr('cy');
  let cx = d3.select(element).attr('cx');
  let cy = d3.select(element).attr('cy');
  // let t = getDetailsHTML(d);
  let t = getIdString(d);

  // Create an id for text so we can select it later for
  // removing on mouseout
  // let id = "t" + d.x + "-" + d.y + "-" + i;
  let id = 'id-' + d.ptheta_rocking + "-" + d.pphi_rocking + "-" +
    d.numBounces + "-" + d.phase + "-" + i;

  // Specify where to put label of text
  svg.append("text")
    .attr('id', id)
    .attr('class', id)
    // .attr('x', function() { return xScale(d.x) - 30; })
    // .attr('y', function() { return yScale(d.y) - 15; })
    .attr('x', function() { return cx - 30; })
    .attr('y', function() { return cy - 15; })
    .text(t)
    // .text(function() {
    //   return [d.x, d.y];  // Value of the text
    // });
    // .style("fill", "#FFE6F0")
  ;

  // var ctx = document.getElementById("states_svg");
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
  let id = 'id-' + d.ptheta_rocking + "-" + d.pphi_rocking + "-" +
    d.numBounces + "-" + d.phase + "-" + i;

  var details = document.getElementById('details');
  details.innerHTML = '';

  // Use D3 to select element, change color back to normal
  d3.select(this).attr('r', radius);
  // d3.select(this).attr({
  //   // fill: "black",
  //   r: radius
  // });

  // Select text by id and then remove
  // d3.select("#t" + d.x + "-" + d.y + "-" + i).remove();
  // d3.selectAll(".t" + d.x + "-" + d.y + "-" + i).remove();
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
function parseNumbers(s) {
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

function rockingFilterChanged() {
  parseRockingFilter();
  updateStatesVis();
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

  // let svg = d3.select("#states_svg");

  // svg.call(d3.zoom().on("zoom", function () {
  //   svg.attr("transform", d3.event.transform)
  // }));

  // Read the dataset file
  let dataset = "states_all.json";
  d3.json(dataset)
    .then(function(d) {
      allStatesAll = [];
      allStatesUnique = [];
      bifurcationStatesAll = [];
      bifurcationStatesUnique = [];
      let cur_i = -1;
      let cur_j = -1;
      let cur_k = -1;
      let cur_phase = -1;
      d.forEach(function(s) {
        // Calculate the phase because sometimes the phase in the
        // data is incorrect. Not sure why.
        let calcPhase = (s.ptheta * s.pphi < 0) ? 0 : 1;
        let unique = !haveSharedFactor(
          s.n, s.ptheta_rocking, s.pphi_rocking);
        let state = {
          numBounces : s.n,
          energy : s.E,
          pr : s.pr,
          ptheta : s.ptheta,
          pphi : s.pphi,
          ptheta_rocking : s.ptheta_rocking,
          pphi_rocking : s.pphi_rocking,
          // phase : s.phase,
          phase : calcPhase,
          T : s.period,
          unique : unique,
        };
        allStatesAll.push(state);
        if (unique) {
          allStatesUnique.push(state);
        }

        if (s.ptheta_rocking != cur_i || s.pphi_rocking != cur_j || s.n != cur_k || calcPhase != cur_phase) {
          bifurcationStatesAll.push(state);
          if (unique) {
            bifurcationStatesUnique.push(state);
          }
          cur_i = s.ptheta_rocking;
          cur_j = s.pphi_rocking;
          cur_k = s.n;
          cur_phase = calcPhase;
        }
      });
      parseBouncesFilter();
      parseRockingFilter();
      updateStatesVis();
      updateSpiderWebVis();
    });
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
    document.getElementById('bounces_filter').value = numbers[0]-1;
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
    document.getElementById('bounces_filter').value = numbers[0]+1;
    bouncesFilterChanged();
    break;
  }
}
