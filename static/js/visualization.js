let width = 730,
    height = 500,
    arc_width = 50,
    radius = Math.min(width, height) / 2 - 60,
    line_width = null,
    color = null,
    arc = null,
    arcOver = null,
    arcs = null,
    detail_box = null,
    group = null;


function visualize(data, wrapper) {
    if (data === null) {
        console.log("No Data to visualize");
        return null;
    }
    initialize(data, wrapper);
    drawTransitions(data);
}

function initialize(data, wrapper) {

    // box with information about selected segment
    detail_box = d3.select("body")
        .append("div")
        .attr("class", "detail")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden");

    // get maximum value of fixation time
    let max_fix_time = Math.max.apply(Math, data.stats.map(function (max) {
        return max.fix_time;
    }));

    // get maximum transition count value
    let max_transition_row = data.transitions.map(function (row) {
        return Math.max.apply(Math, row);
    });

    let max_transition = Math.max.apply(null, max_transition_row);

    // line width scale
    line_width = d3.scale.linear()
        .domain([1, max_transition])
        .range([1, 5]);

    // segment color scale
    color = d3.scale.linear()
        .domain([0, max_fix_time / 2, max_fix_time])
        .range(["#fecc5c", "#fd8d3c", "#bd0026"]);

    let canvas = d3.select(wrapper).append("svg")
        .attr("width", width)
        .attr("height", height);

    // arrowhead
    let markers = canvas.append("defs");

    markers.append("marker")
        .attr("id", "basic-arrow-end")
        .attr("viewBox", "0 0 20 20")
        .attr("refX", 20)
        .attr("refY", 6)
        .attr("markerWidth", 20)
        .attr("markerHeight", 20)
        .attr("orient", "auto")
        .attr("markerUnits", "userSpaceOnUse")
        .append("path")
        .attr("d", "M0,0L20,6L0,12")
        .attr("stroke", "white")
        .attr("stroke-width", "1px");

    markers.append("marker")
        .attr("id", "small-arrow-end")
        .attr("viewBox", "0 0 20 20")
        .attr("refX", 20)
        .attr("refY", 6)
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .attr("orient", "auto")
        .attr("markerUnits", "userSpaceOnUse")
        .append("path")
        .attr("d", "M0,0L20,6L0,12")
        .attr("stroke", "white")
        .attr("stroke-width", "1px");

    markers.append("marker")
        .attr("id", "basic-arrow-start")
        .attr("viewBox", "0 0 20 20")
        .attr("refX", 20)
        .attr("refY", 6)
        .attr("markerWidth", 20)
        .attr("markerHeight", 20)
        .attr("orient", "auto-start-reverse")
        .attr("markerUnits", "userSpaceOnUse")
        .append("path")
        .attr("d", "M0,0L20,6L0,12")
        .attr("stroke", "white")
        .attr("stroke-width", "1px");

    markers.append("marker")
        .attr("id", "small-arrow-start")
        .attr("viewBox", "0 0 20 20")
        .attr("refX", 20)
        .attr("refY", 6)
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .attr("orient", "auto-start-reverse")
        .attr("markerUnits", "userSpaceOnUse")
        .append("path")
        .attr("d", "M0,12L20,6L0,0")
        .attr("stroke", "white")
        .attr("stroke-width", "1px");

    group = canvas.append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(radius - arc_width);

    // arc generator for hover effect
    arcOver = d3.svg.arc()
        .outerRadius(radius - 3)
        .innerRadius(radius - arc_width);

    let pie = d3.layout.pie()
        .sort(null)
        .value(function (d) {
            return d.fix_count;
        });

    arcs = group.selectAll(".arc")
        .data(pie(data.stats))
        .enter().append("g")
        .attr("class", "arc");

    let paths = arcs.append("path")
        .attr("d", arc)
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .style("fill", function (d) {
            return color(d.data.fix_time);
        })
        .on("mouseover", handleMouseOver)
        .on("mousemove", handleMouseMove)
        .on("mouseout", handleMouseOut);

    arcs.append("text")
        .attr("transform", function (d) {
            let r = radius + 20;
            let c = arc.centroid(d);
            let x = c[0];
            let y = c[1];
            let v = Math.sqrt(x * x + y * y);
            return "translate(" + (x / v * r) + ', ' + (y / v * r) + ")";
        })
        .text(function (d) {
            return d.data.label;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("fill", "gray")
        .attr("text-anchor", function (d) {
            return (d.endAngle + d.startAngle) / 2 > Math.PI ? "end" : "start";
        });
}

// get center point of segment for line
function getCenterPoint(d) {
    let arc = d.data()[0];

    let point = {};
    point.y = Math.sin(arc.startAngle + (arc.endAngle - arc.startAngle) / 2 - Math.PI / 2) * (radius - arc_width);
    point.x = Math.cos(arc.startAngle - Math.PI / 2 + (arc.endAngle - arc.startAngle) / 2) * (radius - arc_width);
    return point;
}


function drawTransitions(data) {
    for (let i = 0; i < data.transitions.length; i++) {
        for (let j = i + 1; j < data.transitions[i].length; j++) {
            if (data.transitions[i][j] > 0 && data.transitions[j][i] > 0) {
                drawLine(d3.select(arcs[0][i]), d3.select(arcs[0][j]), [data.transitions[i][j], data.transitions[j][i]], true);
            }

            else if (data.transitions[i][j] > 0) {
                drawLine(d3.select(arcs[0][i]), d3.select(arcs[0][j]), [data.transitions[i][j], 0], false);
            }

            else if (data.transitions[j][i] > 0) {
                drawLine(d3.select(arcs[0][j]), d3.select(arcs[0][i]), [data.transitions[j][i], 0], false);
            }
        }
    }
}

// get point for line label
function getLabelPoint(point_from, point_to) {
    let offset = 10;
    let result = {};
    let dx = point_to.x - point_from.x;
    let dy = point_to.y - point_from.y;
    let sx = (point_from.x + point_to.x) / 2;
    let sy = (point_from.y + point_to.y) / 2;
    let dist = Math.sqrt(dx * dx + dy * dy);
    dx /= dist;
    dy /= dist;
    result.x = sx + offset * dy;
    result.y = sy - offset * dx;

    return result;
}

function drawLine(arc_from, arc_to, transition_counts, two_way) {
    let point_from = getCenterPoint(arc_from);
    let point_to = getCenterPoint(arc_to);
    let x = point_to.x - point_from.x;
    let y = point_to.y - point_from.y;
    let distance = Math.sqrt(x * x + y * y);

    let marker_end = "#basic-arrow-end";
    let marker_start = "#basic-arrow-start";
    if (distance < 100) {
        marker_end = "#small-arrow-end";
        marker_start = "#small-arrow-start";
    }

    let line_group = group.append("g");

    line_group.append("line")
        .attr("class", "link")
        .attr("x1", point_from.x)
        .attr("y1", point_from.y)
        .attr("x2", point_to.x)
        .attr("y2", point_to.y)
        .attr("stroke", "black")
        .attr("stroke-width", line_width(Math.max.apply(Math, transition_counts)))
        .attr("marker-end", "url(" + marker_end + ")")
        .attr("marker-start", function () {
            if (two_way) {
                return "url(" + marker_start + ")"
            }
        })
        .on("mouseover", mouseOverLine)
        .on("mouseout", mouseOutLine);

    let label = line_group.append("text");
    let label_point = getLabelPoint(point_from, point_to);

    label.attr("x", label_point.x)
        .attr("y", label_point.y)
        .text(transition_counts[0])
        .attr("font-family", "sans-serif")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "green")
        .attr("alignment-baseline", "middle")
        .attr("text-anchor", "middle")
        .attr("visibility", "hidden");

    if (two_way) {
        label = line_group.append("text");
        label_point = getLabelPoint(point_to, point_from);
        label.attr("x", label_point.x)
            .attr("y", label_point.y)
            .text(transition_counts[1])
            .attr("font-family", "sans-serif")
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .attr("fill", "green")
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("visibility", "hidden");
    }
}

function moveToFront() {
    this.parentNode.appendChild(this);
}

function mouseOverLine() {
    let main_wrapper = this.parentNode.parentNode;
    let group = this.parentNode;
    main_wrapper.appendChild(group);

    d3.select(this).attr("stroke", "green");
    d3.select(this.parentNode).selectAll("text")
        .style("visibility", "visible");
}

function mouseOutLine() {
        d3.select(this).attr("stroke", "black");
    d3.select(this.parentNode).selectAll("text")
        .style("visibility", "hidden");
}

function handleMouseOver(d, i) {
    d3.select(this.nextElementSibling)
        .transition()
        .duration(200)
        .attr("transform", function (d) {
            let r = radius + 30;
            let c = arcOver.centroid(d);
            let x = c[0];
            let y = c[1];
            let v = Math.sqrt(x * x + y * y);
            return "translate(" + (x / v * r) + ', ' + (y / v * r) + ")";
        })
        .attr("font-size", "14px")
        .attr("fill", "black");

    d3.select(this)
        .attr("stroke", "#000000")
        .attr("stroke-width", "2.3px")
        .transition()
        .duration(200)
        .attr("d", arcOver);

    detail_box.style("visibility", "visible")
        .html("<span>" + d.data.label + "</span><br>Fixation count: " + d.data.fix_count.toLocaleString('sk-SK') +
            "<br> Fixation duration: " + d.data.fix_time.toLocaleString('sk-SK') + " ms");
}

function handleMouseOut(d, i) {
    d3.select(this.nextElementSibling)
        .transition()
        .duration(500)
        .attr("transform", function (d) {
            let r = radius + 20;
            let c = arcOver.centroid(d);
            let x = c[0];
            let y = c[1];
            let v = Math.sqrt(x * x + y * y);
            return "translate(" + (x / v * r) + ', ' + (y / v * r) + ")";
        })
        .attr("font-size", "12px")
        .attr("fill", "gray");

    d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .transition()
        .duration(500)
        .attr("d", arc);

    detail_box.style("visibility", "hidden");
}

function handleMouseMove(d, i) {
    detail_box.style("top", (d3.event.pageY + 15) + "px").style("left", (d3.event.pageX + 15) + "px");
}