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
    ;
  } else if (t == 2) {
    yl.append('text')
      .html('(8(E+1/3)')
      .append('tspan')
      .attr('baseline-shift', 'super')
      .style("font", "12px times")
      .html('1/2')
      .append('tspan')
      .style("font", "16px times")
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
  // lineStates = bifurcationStatesAll.filter(wfilterState).
  //   filter(s => //s.phase == 0 &&
  //          s.ptheta_rocking == s.pphi_rocking);
  lineStates = bifurcationStatesAll.filter(wfilterState);
  line2States = bifurcationStatesAll.filter(wfilterState).
    filter(s => //s.phase == 0 &&
           s.ptheta_rocking == s.pphi_rocking);

  let minx = 20;
  let maxx = 720;
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

  let xScale = d3.scaleLinear()
    // .domain([minT, 50])
    .domain([getT(minT), Math.ceil(getT(Tmax))])
    .range([minx, maxx]);

  let sizeScale = d3.scaleLinear()
    .domain([-1/3, 0])
    .range([2, 5]);

  let x_axis = d3.axisBottom().scale(xScale);
  let y_axis = d3.axisLeft().scale(yScale);

  svg = d3.select("#spider_web_svg");
  svg.selectAll('*').remove();

  let xoffset = 60;

  // x axis
  let tickValues = [...Array(Math.ceil(getT(Tmax))+1).keys()].slice(1);
  svg.append("g")
    .attr('transform', `translate(${xoffset}, ${maxy+20})`)
    .call(x_axis.tickValues(tickValues))
  ;
  svg.append("g")
    .attr('transform', `translate(${xoffset + (minx+maxx)/2}, ${maxy+60})`)
    .append('text')
    .html('T/T2')
  ;

  // y axis
  svg.append("g")
    .attr('transform', `translate(${xoffset}, ${miny-20})`)
    .call(y_axis)
  ;
  let yl = svg.append("g")
    .attr('transform', `translate(20, ${(maxy-miny)/2}) rotate(${-90})`);
  setYLabel(yl);

  //---------------------
  // num bounces lines
  //---------------------
  lineStates.sort((a,b) => {
    if (a.numBounces == b.numBounces) {
      // return a.energy - b.energy;
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
      // .attr("stroke", '#dddddd')
      .attr("stroke", c)
      .attr("stroke-width", 0.5)
      // .style("stroke-dasharray", ("3, 8"))
      .attr('d', line(s));
  }

  //---------------------
  // rocking number lines
  //---------------------
  line2States.sort((a,b) => {
    if (a.phase == b.phase) {
      if (a.ptheta_rocking == b.ptheta_rocking) {
        return a.numBounces - b.numBounces;
      }
      return a.ptheta_rocking - b.ptheta_rocking;
    }
    return a.phase - b.phase;
  });

  for (let i = 0; i < line2States.length;) {
    let start = i;
    let r = line2States[i].ptheta_rocking;
    while (i < line2States.length && line2States[i].ptheta_rocking == r) {
      i++;
    }
    let s = line2States.slice(start, i);

    line = d3.line()
      .x(d => xValue(d, xoffset, xScale))
      .y(d => yValue(d, yScale))
      .curve(d3.curveCatmullRom.alpha(0.5))
    ;

    let path = svg.append('path')
      .attr("fill", "none")
      // .attr("stroke", '#aaaaaa')
      .attr("stroke", '#888888')
      .attr("stroke-width", 1.5)
      // .style("stroke-dasharray", ("3, 3"))
      .attr('d', line(s));
    if (s[0].phase == 1) {
      path.style("stroke-dasharray", ("3, 7"))
    }
  }

  //---------------------
  // circles
  //---------------------
  addCircle('spider_web_svg', states, -1/3, 1/3)
    .attr("cx", d => xValue(d, xoffset, xScale))
    .attr("cy", d => yValue(d, yScale))
    // .attr("r", d => sizeScale(d.energy))
  ;

}
