/* Javascript by Catherine McSorley, 2019 */
window.onload = function() {
    
    //create the container to place elements
    var w = 900, h = 500;
    
    var container = d3.select("body")
        .append("svg")
        .attr("width",w)
        .attr("height",h)
        .attr("class","container")
        .style("background-color","rgba(0,0,0,0.2)");
    
    //create the white and grey rectangle
    var innerRect = container.append("rect")
        .datum(400)
        .attr("width", function(d){
            return d*2;
        })
        .attr("height", function(d){
            return d;
        })
        .attr("class","innerRect")
        .attr("x",50)
        .attr("y",50)
        .style("fill", "#FFFFFF");
    
    //format populations into the array
    var cityPop = [
        { 
            city: 'Glasgow',
            population: 599650
        },
        {
            city: 'Edinburgh',
            population: 464990
        },
        {
            city: 'Aberdeen',
            population: 196670
        },
        {
            city: 'Inverness',
            population: 61235
        }
    ];
    
    //create the scale linear x variable
    var x = d3.scaleLinear() 
        //altered to spread acrosss rectangle
        .range([100, 750])
        .domain([0,3]);
    
    //calculate min and max pop
    var minPop = d3.min(cityPop, function(d){
        return d.population;
    });

    var maxPop = d3.max(cityPop, function(d){
        return d.population;
    });
    
    //create the scale linear y variable
    var y = d3.scaleLinear()
        .range([450, 50])
        .domain([0,700000]);
    
    //create scaled colors for the bubbles
    var color = d3.scaleLinear()
        .range([
            "#FDBE85",
            "#D94701"
        ])
        .domain([
            minPop, 
            maxPop
        ]);
    
    //create the circles including population circle and placement, as well as spread out across the "x" range
    var circles = container.selectAll(".circles")
        .data(cityPop)
        .enter()
        .append("circle")
        .attr("class", "circles")
        .attr("id", function(d){
            return d.city;
        })
        .attr("r", function(d){
            var area = d.population*0.01;
            return Math.sqrt(area/Math.PI);
        })
        .attr("cx", function(d,i){
            return x(i);
        })
        .attr("cy", function(d){
              return y(d.population);
        })
        .attr("cy", function(d){
            return y(d.population);
        })
        .style("fill", function(d, i){ //add a fill based on the color scale generator
            return color(d.population);
        })
        .style("stroke", "#000"); //black circle stroke
    
    //create and labe a y axis label
    var yAxis = d3.axisLeft(y);
    var axis = container.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(50,0)")
        .call(yAxis);
    
    var title = container.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 30)
        .text("Scottish City Populations");
    
    //create labels for each bubble
    var labels = container.selectAll(".labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("text-anchor", "left")
        .attr("y", function(d){
            return y(d.population) + 5;
        })
    
    var nameLine = labels.append("tspan")
        .attr("class", "nameLine")
        .attr("x", function(d,i){
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .text(function(d){
            return d.city;
        });

    var format = d3.format(",");
    
    var popLine = labels.append("tspan")
        .attr("class", "popLine")
        .attr("x", function(d,i){
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .attr("dy", "15")
        .text(function(d){
            return "Pop. " + format(d.population);
        });
};