let googleColors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];

let allStatesAll;
let allStatesUnique;
let bifurcationStatesAll;
let bifurcationStatesUnique;

let filter = {
  bounces : null,
  rocking : null,
  phase : null
};

function color(i) {
  const n = googleColors.length;
  return googleColors[i%n];
}

function power_of_2(n) {
 if (typeof n !== 'number') 
      return 'Not a number'; 

    return n && (n & (n - 1)) === 0;
}

function updateStatesVis() {
  let allStates = allStatesAll;
  let bifurcationStates = bifurcationStatesAll;
  if (document.getElementById("unique_states").checked) {
    allStates = allStatesUnique;
    bifurcationStates = bifurcationStatesUnique;
  }

  // Filter states
  states = allStates.filter(d => {
    let include = true;
    if (include && filter.bounces != null) {
      include = filter.bounces[d.numBounces];
    }
    // Filter everything out if bounces is empty
    if (filter.bounces == null) {
      include = false;
    }
    if (include && filter.rocking != null) {
      include = filter.rocking[d.rocking];
    }
    if (include && filter.phase != null) {
      include = (filter.phase == d.phase);
    }
    return include;
  });

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

  svg.selectAll("circle")
    .data(states)
    .enter()
    .append("a")
    .attr("xlink:href", d =>
          `http://edwardsjohnmartin.github.io/MagPhyx/` +
          `?initparams=1,0,0,${d.pr},${d.ptheta},${d.pphi}`)
    .attr("target", "_magphyx")
    .append("circle")
    .attr("cx", function(d) { return xoffset + eScale(d.energy); })
    .attr("cy", function(d) { return pphiScale(d.pphi); })
    // .attr("fill", d => d.phase == 0 ? color(d.numBounces) : 'none')
    .attr("fill", d => color(d.numBounces))
    .attr("fill-opacity", d => d.phase == 0 ? 1 : 0.2)
    // .attr("fill", 'none')
    .attr("stroke", d => color(d.numBounces))
    .attr("stroke-width", d => 1)
    // .attr("stroke", 'none')
    .attr("r", 3)
    .on("click", function() {
      // console.log(this);
      d3.select(this).attr("r", 6);
    })
    .append("title")
    .text(d => `bounces = ${d.numBounces} energy = ${d.energy}\n` +
          `ptheta = ${d.ptheta} pphi = ${d.pphi}\n` +
          `rocking = ${d.rocking} phase = ${d.phase} T = ${d.T}`)
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
    filter.rocking = numbers;
  } else {
    filter.rocking = null;
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

function init() {
  // Read the dataset file
  let dataset = "states_all.json";
  d3.json(dataset)
    .then(function(d) {
      allStatesAll = [];
      bifurcationStatesAll = [];
      let cur_m = -1;
      let cur_n = -1;
      d.forEach(function(s) {
        // Calculate the phase because sometimes the phase in the
        // data is incorrect. Not sure why.
        let calcPhase = (s.ptheta * s.pphi < 0) ? 0 : 1;
        let state = {
          numBounces : s.n,
          energy : s.E,
          pr : s.pr,
          ptheta : s.ptheta,
          pphi : s.pphi,
          rocking : s.rocking,
          // phase : s.phase,
          phase : calcPhase,
          T : s.period,
        };
        allStatesAll.push(state);

        if (s.rocking != cur_m || s.n != cur_n) {
          if (power_of_2(s.n)) {
            bifurcationStatesAll.push(state);
          }
          cur_m = s.rocking;
          cur_n = s.n;
        }
      });
      parseBouncesFilter();
      parseRockingFilter();
      updateStatesVis();
      updateSpiderWebVis();
    });

  dataset = "states_unique.json";
  d3.json(dataset)
    .then(function(d) {
      allStatesUnique = [];
      bifurcationStatesUnique = [];
      let cur_m = -1;
      let cur_n = -1;
      d.forEach(function(s) {
        // Calculate the phase because sometimes the phase in the
        // data is incorrect. Not sure why.
        let calcPhase = (s.ptheta * s.pphi < 0) ? 0 : 1;
        let state = {
          numBounces : s.n,
          energy : s.E,
          pr : s.pr,
          ptheta : s.ptheta,
          pphi : s.pphi,
          rocking : s.rocking,
          // phase : s.phase,
          phase : calcPhase,
          T : s.period,
        };
        allStatesUnique.push(state);

        if (s.rocking != cur_m || s.n != cur_n) {
          if (power_of_2(s.n)) {
            bifurcationStatesUnique.push(state);
          }
          cur_m = s.rocking;
          cur_n = s.n;
        }
      });

      parseBouncesFilter();
      parseRockingFilter();
      updateStatesVis();
      updateSpiderWebVis();
    });
}
