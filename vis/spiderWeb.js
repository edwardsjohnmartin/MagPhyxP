function getSpiderType() {
  return document.getElementById("spider_type").value;
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
  lineStates = bifurcationStatesAll.filter(wfilterState).filter(s => s.phase == 0 &&
                             s.ptheta_rocking == s.pphi_rocking);

  let minx = 20;
  let maxx = 680;
  let miny = 20;
  let maxy = 580;

  let minE = d3.min(bifurcationStates, d=>d.energy);
  let maxE = d3.max(bifurcationStates, d=>d.energy);
  let minpphi = d3.min(bifurcationStates, d=>d.pphi);
  let maxpphi = d3.max(bifurcationStates, d=>d.pphi);
  let minT = d3.min(bifurcationStates, d=>d.T);
  let maxT = d3.max(bifurcationStates, d=>d.T);


  let yScale = getYScale(miny, maxy);

  let xScale = d3.scaleLinear()
    .domain([minT, 50])
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
  svg.append("g")
    .attr('transform', `translate(${xoffset}, ${maxy+20})`)
    .call(x_axis)
  ;
  svg.append("g")
    .attr('transform', `translate(${xoffset + (minx+maxx)/2}, ${maxy+60})`)
    .append('text')
    .html('T')
  ;

  // y axis
  svg.append("g")
    .attr('transform', `translate(${xoffset}, ${miny-20})`)
    .call(y_axis)
  ;
  let yl = svg.append("g")
    .attr('transform', `translate(20, ${(maxy-miny)/2}) rotate(${-90})`);
  setYLabel(yl);

  // n lines
  let line = d3.line()
    .x(d => xoffset + xScale(d.T))
    .y(d => yValue(d, yScale))
    .defined((d,i) => {
      let valid = i < lineStates.length-1 &&
        lineStates[i].numBounces == lineStates[i+1].numBounces;
      if (valid) {
        if (i > 0 && 
            lineStates[i].ptheta_rocking-1 != lineStates[i-1].ptheta_rocking &&
            lineStates[i].ptheta_rocking+1 != lineStates[i+1].ptheta_rocking) {
          valid = false;
        }
      }
      return valid;
    })
  ;
  svg.append('path')
    .attr("fill", "none")
    .attr("stroke", '#dddddd')
    .attr("stroke-width", 0.5)
    .attr('d', line(lineStates));

  // states.forEach(s => console.log(s.numBounces));

  // rocking number lines
  let states2 = states.slice();
  states2.sort((a,b) => {
    let ai = a.ptheta_rocking;
    let bi = b.ptheta_rocking;
    let aj = a.pphi_rocking;
    let bj = b.pphi_rocking;
    if (a.numBounces == b.numBounces) {
      return a.energy - b.energy;
    }
    return a.numBounces - b.numBounces;
  });
  line = d3.line()
    .x(d => xoffset + xScale(d.T))
    .y(d => yValue(d, yScale))
    .defined((d,i) => i < states2.length-1 &&
             states2[i].ptheta_rocking == states2[i+1].ptheta_rocking &&
             states2[i].pphi_rocking == states2[i+1].pphi_rocking &&
             states2[i].phase == states2[i+1].phase)// &&
             // states2[i+1].T < 50)
  ;
  svg.append('path')
    .attr("fill", "none")
    .attr("stroke", '#aaaaaa')
    .attr("stroke-width", 0.5)
    .attr('d', line(states2));

  addCircle('spider_web_svg', states, -1/3, 1/3)
    .attr("cx", d => xoffset + xScale(d.T))
    .attr("cy", d => yValue(d, yScale))
    .attr("r", d => sizeScale(d.energy))
  ;

}
