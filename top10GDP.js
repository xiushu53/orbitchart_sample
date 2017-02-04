var margin = {
	top: 60,
	right: 150,
	bottom: 70,
	left: 70
};


var height = 480 - margin.top - margin.bottom,
	width = 570 - margin.right - margin.left;


var x = d3.scaleLinear().range([0, width]),
	y = d3.scaleLinear().range([height, 0]),
	z = d3.scaleOrdinal(d3.schemeCategory10);


var orbitLine = d3.line()
	//.curve(d3.curveCardinal) // カーブ
	.x(function(d) { return x(d.top10);})
	.y(function(d) { return y(d.gdp);});


var div = d3.select("body").append("div")
					.attr('class', 'tooltip-path')
					.style('opacity', 0);

var div2 = d3.select("body").append("div")
					.attr('class', 'tooltip-circle')
					.style('opacity', 0);


var svg = d3.select('body').append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


function make_x_gridlines() {
	return d3.axisBottom(x).ticks()
};
function make_y_gridlines() {
	return d3.axisLeft(y).ticks()
};


d3.csv('top10_gdp.csv', function(error, data) {
	if (error) throw console.log(error);

	data.forEach(function(d) {
			d.year = +d.Year,
			d.top10 = +d.Top10,
			d.gdp = +d.GDP,
			d.pm = d.PM,
			d.party = d.Party
	});


	x.domain([d3.min(data, function(d) { return d.top10; }) * 0.99,
	d3.max(data, function(d) { return d.top10; }) * 1.01 ]);
	y.domain([d3.min(data, function(d) { return d.gdp; }) * 0.99,
	d3.max(data, function(d) { return d.gdp; }) * 1.01 ]);


	svg.append('g')
		.attr('class', 'grid')
		.attr('transform', 'translate(0,' + height + ')')
		.call(make_x_gridlines()
			.tickSize(-height)
			.tickFormat(''));

	svg.append('g')
		.attr('class', 'grid')
		.call(make_y_gridlines()
			.tickSize(-width)
			.tickFormat(''));


	PartialLine(data);


	svg.selectAll('dot')
		.data(data)
		.enter().append('circle')
			.attr('id', function(d) {
				return d.PM;
			})
			.attr('cx', function(d) {
				return x(d.top10);
			})
			.attr('cy', function(d) {
				return y(d.gdp);
			})
			.attr('r', 2.5)
			.style('fill', 'white')
			.style('stroke', function(d) {
				return z(d.PM);
			})
			.on("mouseover", function(d) {
				div2.transition()
					.duration(100)
					.style('opacity', .9);
				div2.html(d.year + "年<br/>"
				+ "GDP: " + Math.round(d.gdp/1000,2) + "兆円<br/>Top10%: " + Math.round(d.top10*100,1) + "%")
					.style('left', (d3.event.pageX) + "px")
					.style('top', (d3.event.pageY) + "px");
			})
			.on("mouseout", function(d) {
				div2.transition()
					.duration(300)
					.style('opacity', 0);
			});



	svg.append('g')
		.attr('transform', 'translate(0,' + (height) + ')')
		.call(d3.axisBottom(x).ticks().tickFormat(function(d) { return Math.round(d*100); }))
		.selectAll('text')
			.style('text-anchor', 'end')
			.attr('dx', '-.8em')
			.attr('dy', '.15em')
			.attr('transform', 'rotate(-65)');


	svg.append('g')
		.attr('transform', 'translate(0,0)')
		.call(d3.axisLeft(y).tickFormat(function(d) { return Math.round(d*0.001); }));


	svg.append('text')
		.attr('x', width / 2)
		.attr('y', height + margin.bottom * 0.7)
		.style('text-anchor', 'middle')
		.text('Rate of the Top10% (%)');


	svg.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('x', 0 - (height / 2))
		.attr('y', 0 - margin.left)
		.attr('dy', '1em')
		.style('text-anchor', 'middle')
		.text('GDP (兆円)');


	svg.append('text')
		.attr('x', width / 2)
		.attr('y', 0 - (margin.top / 2))
		.attr('text-anchor', 'middle')
		.style('text-decoration', 'underline')
		.style('font-size', '16px')
		.text('首相とGDPと所得格差の推移(1994-2010)');


	var PMs = [];
	for (var i = 0; i < data.length; i++) {

		PMs.push(data[i].PM)

	};

	PMs = PMs.filter(function (x, i, self) {
            return self.indexOf(x) === i;
        });


	var legendPM = svg.append('g')
			.attr('class', 'legendPM')
			.attr('transform', 'translate(360,180)');

	var legendCat = d3.legendColor()
		.shapeWidth(40)
		.labels(PMs)
		.scale(z);
   			
	legendPM.call(legendCat);

});


function PartialLine(data) {

	var distList = [];

	var x0 = x(data[0].top10),
		y0 = y(data[0].gdp);

	var startPoint = 0;


	for (var i = 0; i < data.length; i++) {

		x1 = x(data[i].top10);
		y1 = y(data[i].gdp);

		dist = Math.sqrt(Math.pow(x1-x0,2) + Math.pow(y1-y0,2));

		distList.push(dist);

		x0 = x1;
		y0 = y1;
		startPoint = dist;

	};


	var totalDist = d3.sum(distList);

	for (var i = 1; i < distList.length; i++) {

		var passed = d3.sum(distList.slice(0, i));

		var para = "0,"+passed+ "," +distList[i]+ "," +totalDist;

		svg.append('path')
			.data([data])
			.attr('id', 'v' + i)
			.attr('d', orbitLine)
			.style('stroke', function(d) {
				return z(data[i-1].PM);
			})
			.style('stroke-dasharray', para)
			.style('stroke-width', '5px')
			.style('fill', 'none')
			.on("mouseover", function(d) {
				var idN = +this.id.slice(1);
				div.transition()
					.duration(100)
					.style('opacity', .9);
				div.html(data[idN-1].year + "年<br/>"
				+ data[idN-1].PM)
					.style('left', (d3.event.pageX) + "px")
					.style('top', (d3.event.pageY) + "px");
			})
			.on("mouseout", function(d) {
				div.transition()
					.duration(300)
					.style('opacity', 0);
			});
	};

};