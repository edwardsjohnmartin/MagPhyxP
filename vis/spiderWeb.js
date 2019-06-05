// let googleColors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];

// let allStates;
// let filter = {
//   bounces : null,
//   rocking : null,
//   phase : null
// };

// function color(i) {
//   const n = googleColors.length;
//   return googleColors[i%n];
// }

function updateSpiderWebVis() {
  let allStates = allStatesAll;
  let bifurcationStates = bifurcationStatesAll;
  if (document.getElementById("unique_states").checked) {
    allStates = allStatesUnique;
    bifurcationStates = bifurcationStatesUnique;
  }

  // Filter states
  // states = allStates.filter(d => {
  //   let include = true;
  //   if (include && filter.bounces != null) {
  //     include = filter.bounces[d.numBounces];
  //   }
  //   // Filter everything out if bounces is empty
  //   if (filter.bounces == null) {
  //     include = false;
  //   }
  //   if (include && filter.rocking != null) {
  //     include = filter.rocking[d.rocking];
  //   }
  //   if (include && filter.phase != null) {
  //     include = (filter.phase == d.phase);
  //   }
  //   return include;
  // });
  states = bifurcationStates;

  // states.forEach(s => { console.log(s); });

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


  let eScale = d3.scaleLinear()
    .domain([minE, maxE])
    // .range([minx, maxx]);
    // .range([miny, maxy]);
    .range([maxy, miny]);
  let pphiScale = d3.scaleLinear()
    .domain([minpphi, maxpphi])
    .range([maxy, miny]);
  let TScale = d3.scaleLinear()
    // .domain([minT, maxT])
    .domain([minT, 50])
    .range([minx, maxx]);
  let yScale = d3.scaleLog()
    .domain([0.1, 2e2])
    .range([maxy, miny]);

  let xScale = TScale;
  // let yScale = eScale;

  // console.log(yScale(minE));
  // console.log(yScale(maxE));

  // console.log(yScale(100));


  // let x_axis = d3.axisBottom().scale(eScale);
  let x_axis = d3.axisBottom().scale(xScale);
  // let y_axis = d3.axisLeft().scale(pphiScale);
  let y_axis = d3.axisLeft().scale(yScale);

  // console.log("minE, maxE = " + minE + " " + maxE);

  // let maxNumBounces = d3.max(states, m => m.numBounces);

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
  svg.append("g")
    .attr('transform', `translate(20, ${(maxy-miny)/2}) rotate(${-90})`)
    .append('text')
    .html('(E+1/3)n*n')
  ;

  addCircle('spider_web_svg', states)
    .attr("cx", d => xoffset + xScale(d.T))
    .attr("cy", d => yScale((d.energy+1/3)*d.numBounces*d.numBounces))
  ;

  // n lines
  let line = d3.line()
    .x(d => xoffset + xScale(d.T))
    .y(d => yScale((d.energy+1/3)*d.numBounces*d.numBounces))
    .defined((d,i) => i < states.length-1 &&
             states[i].numBounces == states[i+1].numBounces)
  ;
  svg.append('path')
    .attr("fill", "none")
    .attr("stroke", '#aaaaaa')
    .attr("stroke-width", 0.5)
    .attr('d', line(states));

  // states.forEach(s => console.log(s.numBounces));

  // rocking number lines
  let states2 = states.slice();
  states2.sort((a,b) => {
    let ai = a.ptheta_rocking;
    let bi = b.ptheta_rocking;
    let aj = a.pphi_rocking;
    let bj = b.pphi_rocking;
    if (ai == bi) {
      if (aj == bj) {
        return a.numBounces - b.numBounces;
      } else {
        return aj - bj;
      }
    } else {
      return ai - bi;
    }
  });
  // console.log(states2);
  line = d3.line()
    .x(d => xoffset + xScale(d.T))
    .y(d => yScale((d.energy+1/3)*d.numBounces*d.numBounces))
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
}
