// T / T2
let T2 = 2*Math.PI/Math.sqrt((13+Math.sqrt(139))/6);

function getT(T) {
  return T/T2;
}

function xValue(d, xoffset, xScale) {
  return xoffset + xScale(getT(d.T));
}

// Returns the scaled y-coordinate direction of a data point.
function yValue(d, yScale) {
  return yScale(d.energy);
}

function getYScale(miny, maxy) {
}

function setYLabel(yl) {
}

function spiderTypeChanged() {
  updateSpiderWebVis();
}

function maxTChanged() {
  updateSpiderWebVis();
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
  // console.log(rect.width);
  // console.log(rect.height);

  let svgWidth = rect.width;
  let svgHeight = rect.height;

  // Compute the number of pixels the data portion of the plot will take up.
  let axisDataGap = 0;

  // Borders are the sizes of the borders
  let leftBorder = axisDataGap+80;
  let rightBorder = axisDataGap+80;
  let bottomBorder = axisDataGap+92;
  let topBorder = axisDataGap+20;
  let dataWidth = svgWidth-(leftBorder+rightBorder);
  let dataHeight = svgHeight-(bottomBorder+topBorder);

  let minx = 50;
  let maxx = 750;
  let miny = 20;
  let maxy = 580;

  let minE = d3.min(bifurcationStates, d=>d.energy);
  let maxE = d3.max(bifurcationStates, d=>d.energy);
  let minpphi = d3.min(bifurcationStates, d=>d.pphi);
  let maxpphi = d3.max(bifurcationStates, d=>d.pphi);
  let minT = d3.min(bifurcationStates, d=>d.T);
  let maxT = d3.max(bifurcationStates, d=>d.T);
  let Tmax = +document.getElementById('maxT').value;
  // console.log(getT(Tmax));

  let yScale = d3.scaleLinear()
    .domain([-1/3, 0])
    .range([maxy, miny]);
  let yAxisScale = d3.scaleLinear()
    .domain([yScale.invert(600), 0])
    .range([maxy, 0]);

  let xScale = d3.scaleLinear()
    // .domain([minT, 50])
    // .domain([getT(minT), Math.ceil(getT(Tmax))])
    .domain([0, Math.ceil(getT(Tmax))])
    // .range([minx, maxx]);
    .range([0, dataWidth]);
    // .range([20, maxx]);

  // console.log(xScale(16));

  let xAxisScale = d3.scaleLinear()
    .domain([xScale.invert(0), Math.ceil(getT(Tmax))])
    .range([-axisDataGap, dataWidth]);

  let sizeScale = d3.scaleLinear()
    .domain([-1/3, 0])
    .range([2, 5]);

  let x_axis = d3.axisBottom().scale(xScale);
  x_axis.tickSizeOuter(0);
  let tickSize = x_axis.tickSizeInner();

  let x2_axis = d3.axisTop().scale(xScale);
  x2_axis.tickSizeOuter(0);

  let y_axis = d3.axisLeft().scale(yAxisScale);
  y_axis.tickSizeOuter(0);
  y_axis.tickValues([-0.35, -0.3, -0.25, -0.2, -0.15, -0.1, -0.05, 0]);

  let y2_axis = d3.axisRight().scale(yAxisScale);
  y2_axis.tickSizeOuter(0);
  y2_axis.tickValues([-0.35, -0.3, -0.25, -0.2, -0.15, -0.1, -0.05, 0]);

  svg = d3.select("#spider_web_svg");
  svg.selectAll('*').remove();

  let xoffset = minx;

  // x axis
  let tickValues = [];
  for (let i = 0; i < Math.ceil(getT(Tmax))+1; i++) {
    tickValues.push(i);
  }
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${leftBorder}, ${svgHeight-bottomBorder})`)
    .call(x_axis.tickValues(tickValues))
    .selectAll(".tick line")
    .attr("transform", `translate(0,-${tickSize})`)
  ;
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${leftBorder + (minx+maxx)/2}, ${svgHeight-bottomBorder+50})`)
    .append('text')
    .html('T/T')
    .attr("class", "axis-label")
    .append('tspan')
    .attr('baseline-shift', 'sub')
    .html('2')
  ;

  // x2 axis
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${leftBorder}, ${topBorder})`)
    .call(x2_axis.tickValues(tickValues))
    .selectAll(".tick line")
    .attr("transform", `translate(0,${tickSize})`)
  ;

  // y axis
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${leftBorder}, ${miny})`)
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
  ;

  // y2 axis
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${svgWidth-rightBorder}, ${miny})`)
    .call(y2_axis)
    .selectAll(".tick line")
    .attr("transform", `translate(${-tickSize},0)`)
  ;

  // Create data graphic
  let dataGroup = svg.append("svg")
    // .attr("transform", `translate(${leftBorder},${0})`)
    .attr('id', 'spider_web_data_group')
    .attr('x', leftBorder)
    .attr('width', svgWidth-(leftBorder+rightBorder))
    .attr('height', svgHeight-(bottomBorder+topBorder))
    // .attr('viewBox', '0 0 20 20')
  ;

  //---------------------
  // num bounces lines
  //---------------------
  if (document.getElementById('bouncesLines').checked ||
      document.getElementById('allLines').checked) {
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
      let s = lineStates.slice(start, i);

      let line = d3.line()
        // .x(d => xValue(d, xoffset, xScale))
        // .x(d => xValue(d, leftBorder, xScale))
        .x(d => xValue(d, 0, xScale))
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
        // .x(d => xValue(d, xoffset, xScale))
        // .x(d => xValue(d, leftBorder, xScale))
        .x(d => xValue(d, 0, xScale))
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
  // addCircle('spider_web_svg', states, -1/3, 1/3)
  addCircle('spider_web_data_group', states, -1/3, 1/3)
    // .attr("cx", d => xValue(d, xoffset, xScale))
    // .attr("cx", d => xValue(d, leftBorder, xScale))
    .attr("cx", d => xValue(d, 0, xScale))
    .attr("cy", d => yValue(d, yScale))
    // .attr("r", d => sizeScale(d.energy))
    // .attr('transform', function(d) {
    //   return 'translate(' + xValue(d, xoffset, xScale) + ', ' +
    //     yValue(d, yScale) + ')';
    // })
  ;
}
