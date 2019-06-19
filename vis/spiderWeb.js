// T / T2
let T2 = 2*Math.PI/Math.sqrt((13+Math.sqrt(139))/6);

function getT(T) {
  return T/T2;
}

function getSpiderType() {
  return document.getElementById("spider_type").value;
}

function xValue(d, xoffset, xScale) {
  return xoffset + xScale(getT(d.T));
}

// Returns the scaled y-coordinate direction of a data point.
function yValue(d, yScale) {
  let t = getSpiderType();
  if (t == 0)
    return yScale((d.energy+1/3)*d.numBounces*d.numBounces);
  if (t == 1)
    return yScale(d.energy);
  if (t == 2)
    return yScale(Math.sqrt(8)*Math.sqrt(d.energy+1/3)*d.numBounces/d.T);
}

function getYScale(miny, maxy) {
  let t = getSpiderType();
  if (t == 0)
    return d3.scaleLog()
    .domain([0.1, 4e2])
    .range([maxy, miny]);
  if (t == 1)
    return d3.scaleLinear()
    .domain([-1/3, 0])
    .range([maxy, miny]);
  if (t == 2)
    return d3.scaleLinear()
    .domain([0.0, 1.0])
    .range([maxy, miny]);
}

function setYLabel(yl) {
  let t = getSpiderType();
  if (t == 0) {
    yl.append('text')
      .html('(E+1/3)n')
      .append('tspan')
      .attr('baseline-shift', 'super')
      .style("font", "12px times")
      .html('2')
    ;
  } else if (t == 1) {
    yl.append('text')
      .html('E')
      .attr("class", "axis-label")
    ;
  } else if (t == 2) {
    yl.append('text')
      .html('(8(E+1/3)')
      .attr("class", "axis-label")
      .append('tspan')
      .attr('baseline-shift', 'super')
      // .style("font", "12px times")
      .html('1/2')
      .append('tspan')
      // .style("font", "16px times")
      .html('m/T')
    ;
  }
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

  let minx = 50;
  let maxx = 730;
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

  let yScale = getYScale(miny, maxy);
  // let yAxisScale = getYScale(0, maxy);

  let yAxisScale = d3.scaleLinear()
    .domain([yScale.invert(600), 0])
    .range([maxy, 0]);

  let xScale = d3.scaleLinear()
    // .domain([minT, 50])
    .domain([getT(minT), Math.ceil(getT(Tmax))])
    .range([minx, maxx]);
    // .range([20, maxx]);

  let xAxisScale = d3.scaleLinear()
    .domain([xScale.invert(0), Math.ceil(getT(Tmax))])
    .range([0, maxx]);

  let sizeScale = d3.scaleLinear()
    .domain([-1/3, 0])
    .range([2, 5]);

  // let x_axis = d3.axisBottom().scale(xScale);
  let x_axis = d3.axisBottom().scale(xAxisScale);
  x_axis.tickSizeOuter(0);
  let tickSize = x_axis.tickSizeInner();

  // let y_axis = d3.axisLeft().scale(yScale);
  let y_axis = d3.axisLeft().scale(yAxisScale);
  y_axis.tickSizeOuter(0);
  y_axis.tickValues([-8/24, -7/24, -6/24, -5/24, -4/24, -3/24, -2/24, -1/24, 0]);
  let y2_axis = d3.axisRight().scale(yScale);

  svg = d3.select("#spider_web_svg");
  svg.selectAll('*').remove();

  let xoffset = minx;

  // x axis
  let tickValues = [...Array(Math.ceil(getT(Tmax))+1).keys()].slice(1);
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${xoffset}, ${maxy+20})`)
    .call(x_axis.tickValues(tickValues))
    .selectAll(".tick line")
    .attr("transform", `translate(0,-${tickSize})`)
  ;
  svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(${xoffset + (minx+maxx)/2}, ${maxy+70})`)
    .append('text')
    // .html('T/T2')
    .html('T/T')
    .attr("class", "axis-label")
    .append('tspan')
    .attr('baseline-shift', 'sub')
    // .attr("class", "axis-label")
    // .style("font", "16px times")
    .html('2')
  ;

  // y axis
  svg.append("g")
    .attr("class", "axis")
    // .attr('transform', `translate(${xoffset+20}, ${miny-20})`)
    .attr('transform', `translate(${xoffset+20}, ${miny})`)
    .call(y_axis)
    .selectAll(".tick line")
    .attr("transform", `translate(${tickSize},0)`)
  ;
  let yl = svg.append("g")
    .attr("class", "axis")
    .attr('transform', `translate(15, ${(maxy-miny)/2}) rotate(${-90})`);
  setYLabel(yl);

  // // y2 axis
  // svg.append("g")
  //   .attr('transform', `translate(${xoffset+700}, ${miny-20})`)
  //   .call(y2_axis)
  // ;
  // let y2l = svg.append("g")
  //   .attr('transform', `translate(20, ${(maxy-miny)/2}) rotate(${-90})`);
  // setYLabel(y2l);

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
        .x(d => xValue(d, xoffset, xScale))
        .y(d => yValue(d, yScale))
        .curve(d3.curveCatmullRom.alpha(0.5))
      ;
      let c = color(s[0].numBounces);
      c = d3.hsl(c).brighter(1);
      svg.append('path')
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
        .x(d => xValue(d, xoffset, xScale))
        .y(d => yValue(d, yScale))
        .curve(d3.curveCatmullRom.alpha(1.1))
      ;

      let path = svg.append('path')
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
  addCircle('spider_web_svg', states, -1/3, 1/3)
    .attr("cx", d => xValue(d, xoffset, xScale))
    .attr("cy", d => yValue(d, yScale))
    // .attr("r", d => sizeScale(d.energy))
    // .attr('transform', function(d) {
    //   return 'translate(' + xValue(d, xoffset, xScale) + ', ' +
    //     yValue(d, yScale) + ')';
    // })
  ;

}
