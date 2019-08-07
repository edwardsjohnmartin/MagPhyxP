// T / T2
let T2 = 2*Math.PI/Math.sqrt((13+Math.sqrt(139))/6);

function getx(T) {
  return T/T2;
}

function xValue(d, xScale) {
  return xScale(getx(d.T));
}

// Returns the scaled y-coordinate direction of a data point.
function yValue(d, yScale) {
  return yScale(d.energy);
}

function spiderTypeChanged() {
  updateSpiderWebVis();
}

function maxTChanged() {
  updateSpiderWebVis();
  et.updateVis();
}

function updateSpiderWebVis() {
  let allStates = allStatesAll;
  let bifurcationStates = bifurcationStatesAll;
  if (document.getElementById("unique_states").checked) {
    allStates = allStates.filter(s => s.unique);
    bifurcationStates = bifurcationStates.filter(s => s.unique);
    // allStates = allStatesUnique;
    // bifurcationStates = bifurcationStatesUnique;
  }

  if (document.getElementById("equal_states").checked) {
    allStates = allStates.filter(s => s.pphi_rocking == s.ptheta_rocking);
    bifurcationStates = bifurcationStates.filter(s => s.pphi_rocking == s.ptheta_rocking);
  }

  states = bifurcationStates.filter(wfilterState);
  // lineStates = bifurcationStatesAll;
  lineStates = bifurcationStates;
  lineStates = lineStates.filter(wfilterState);
  line2States = lineStates.filter(wfilterState);
    // filter(s => //s.phase == 0 &&
    //        s.ptheta_rocking == s.pphi_rocking);

  let rect = document.getElementById('spider_web_svg').getBoundingClientRect();
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

  let miny = 20;
  let maxy = 580;

  let minE = d3.min(bifurcationStates, d=>d.energy);
  let maxE = d3.max(bifurcationStates, d=>d.energy);
  let minpphi = d3.min(bifurcationStates, d=>d.pphi);
  let maxpphi = d3.max(bifurcationStates, d=>d.pphi);
  let minT = d3.min(bifurcationStates, d=>d.T);
  let maxT = d3.max(bifurcationStates, d=>d.T);
  let Tmax = +document.getElementById('maxT').value;

  let yScale = d3.scaleLinear()
    .domain([-1/3, 0])
    .range([maxy, miny]);
  let yAxisScale = d3.scaleLinear()
    .domain([yScale.invert(600), 0])
    .range([maxy, 0]);

  let xScale = d3.scaleLinear()
    // .domain([minT, 50])
    // .domain([getx(minT), Math.ceil(getx(Tmax))])
    .domain([0, Math.ceil(getx(Tmax))])
    .range([0, dataWidth]);

  // console.log(xScale(16));

  let xAxisScale = d3.scaleLinear()
    .domain([xScale.invert(0), Math.ceil(getx(Tmax))])
    .range([0, dataWidth]);

  let sizeScale = d3.scaleLinear()
    .domain([-1/3, 0])
    .range([2, 5]);

  let x_axis = d3.axisBottom()
    .scale(xScale)
    .tickSizeOuter(0)
  ;
  let tickSize = x_axis.tickSizeInner();

  let x2_axis = d3.axisTop()
    .scale(xScale)
    .tickFormat('')
    .tickSizeOuter(0)
  ;

  let y_axis = d3.axisLeft().scale(yAxisScale);
  y_axis.tickSizeOuter(0);
  y_axis.tickValues([-0.35, -0.3, -0.25, -0.2, -0.15, -0.1, -0.05, 0]);

  let y2_axis = d3.axisRight().scale(yAxisScale).tickFormat('');
  y2_axis.tickSizeOuter(0);
  // y2_axis.tickValues([-0.35, -0.3, -0.25, -0.2, -0.15, -0.1, -0.05, 0]);

  svg = d3.select("#spider_web_svg");
  svg.selectAll('*').remove();

  // x axis
  let tickValues = [];
  for (let i = 0; i < Math.ceil(getx(Tmax))+1; i++) {
    tickValues.push(i);
  }
  x_axis.tickValues(tickValues);
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${leftAxisX}, ${svgHeight-bottomAxisY})`)
    .call(x_axis)
    .selectAll(".tick line")
    .attr("transform", `translate(0,-${tickSize})`)
  ;
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${leftAxisX + dataWidth/2}, ${svgHeight-bottomAxisY+50})`)
    .append('text')
    .html('T')
    .attr("class", "axis-label")
    .append('tspan')
    .attr('baseline-shift', 'sub')
    .html('mnp')
    .append('tspan')
    .html(' / T')
    .append('tspan')
    .attr('baseline-shift', 'sub')
    .html('2')
  ;

  // x2 axis
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${leftAxisX}, ${svgHeight-topAxisY})`)
    .call(x2_axis.tickValues(tickValues))
    .selectAll(".tick line")
    .attr("transform", `translate(0,${tickSize})`)
  ;

  // y axis
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${leftAxisX}, ${miny})`)
    .call(y_axis)
    .selectAll(".tick line")
    .attr("transform", `translate(${tickSize},0)`)
  ;
  let yl = svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(15, ${(maxy-miny)/2}) rotate(${-90})`)
    .append('text')
    .html('E')
    .attr("class", "axis-label")
    .append('tspan')
    .attr('baseline-shift', 'sub')
    .html('mnp')
  ;

  // y2 axis
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${rightAxisX}, ${miny})`)
    .call(y2_axis)
    .selectAll(".tick line")
    .attr("transform", `translate(${-tickSize},0)`)
  ;

  // Create data graphic
  let dataGroup = svg.append("svg")
    // .attr("transform", `translate(${leftAxisX},${0})`)
    .attr('id', 'spider_web_data_group')
    .attr('x', leftAxisX)
    // .attr('width', svgWidth-(leftAxisX+rightAxisX))
    .attr('width', rightAxisX - leftAxisX)
    // .attr('height', svgHeight-(bottomAxisY+topAxisY))
    .attr('height', topAxisY-bottomAxisY)
    // .attr('viewBox', '0 0 20 20')
  ;

  //---------------------
  // num bounces lines
  //---------------------
  if (document.getElementById('bouncesLines').checked ||
      document.getElementById('allLines').checked) {
    // addNumBouncesLinesFromData(dataGroup, xScale, yScale);
    addNumBouncesLinesFromAnalysis(dataGroup, xScale, yScale);
  }

  //---------------------
  // rocking number lines
  //---------------------
  if (document.getElementById('rockingLines').checked ||
      document.getElementById('allLines').checked) {
    line2States.sort((a,b) => {
      let ar = getRockingNumber(a);
      let br = getRockingNumber(b);
      if (a.phase == b.phase) {
        if (ar == br) {
          if (a.numBounces == b.numBounces) {
            return b.T - a.T;
          }
          return a.numBounces - b.numBounces;
        }
        return ar - br;
      }
      return a.phase - b.phase;
    });

    for (let i = 0; i < line2States.length;) {
      let start = i;
      let r = getRockingNumber(line2States[i]);
      while (i < line2States.length && getRockingNumber(line2States[i]) == r) {
        i++;
      }
      let s = line2States.slice(start, i);

      line = d3.line()
        .x(d => xValue(d, xScale))
        .y(d => yValue(d, yScale))
        .curve(d3.curveCatmullRom.alpha(1.1))
      ;

      let path = dataGroup.append('path')
        .attr("fill", "none")
        .attr("stroke", '#888888')
        .attr("stroke-width", 0.4)
        .attr('d', line(s));
      if (s[0].phase == 1) {
        path.attr("stroke-width", 0.4);
        path.style("stroke-dasharray", ("3, 4"))
      }
    }
  }

  //---------------------
  // circles
  //---------------------
  addCircle('spider_web_data_group', states, -1/3, 1/3)
    .attr("cx", d => xValue(d, xScale))
    .attr("cy", d => yValue(d, yScale))
    // .attr("r", d => sizeScale(d.energy))
  ;

  // //---------------------
  // // Debug
  // //---------------------
  // let debug = d3.select('#spider_web_svg');
  // debug.selectAll("#debugcircle")
  //   .data([1])
  //   .enter()
  //   .append("circle")
  //   .attr('class', 'debugcircle')
  //   .attr("fill", 'red')
  //   .attr("stroke", 'red')
  //   .attr("stroke-width", 1)
  //   .attr("r", 3)
  //   .attr("cx", rightAxisX)
  //   .attr("cy", svgHeight-topAxisY)
  // ;

}

function addNumBouncesLinesFromData(dataGroup, xScale, yScale) {
  lineStates.sort((a,b) => {
    if (a.numBounces == b.numBounces) {
      return a.T - b.T;
    }
    return a.numBounces - b.numBounces;
  });
  for (let i = 0; i < lineStates.length; ) {
    let start = i;
    let m = lineStates[i].numBounces;
    while (i < lineStates.length && lineStates[i].numBounces == m) {
      i++;
    }
    
    // Data fitted to points
    let s = lineStates.slice(start, i);
    let line = d3.line()
      .x(d => xValue(d, xScale))
      .y(d => yValue(d, yScale))
      .curve(d3.curveCatmullRom.alpha(0.5))
    ;

    let c = color(s[0].numBounces);
    c = d3.hsl(c).brighter(1);
    dataGroup.append('path')
      .attr("fill", "none")
      .attr("stroke", '#888888')
    // .attr("stroke", c)
      .attr("stroke-width", 0.4)
      .attr('d', line(s));
  }
}

function addNumBouncesLinesFromAnalysis(dataGroup, xScale, yScale) {
  for (let j = 0; j < spiderCurveX.length; j++) {
    // Data provided by Boyd's analytical calculations
    let line = d3.line()
      .x((d,i) => xScale(spiderCurveX[j][i]))
      .y((d,i) => yScale(spiderCurveY[i]))
      .curve(d3.curveCatmullRom.alpha(0.5))
    ;

    let s = spiderCurveY;
    dataGroup.append('path')
      .attr("fill", "none")
      .attr("stroke", '#888888')
      .attr("stroke-width", 0.4)
      .attr('d', line(s));
  }
}
