/* Javascript by Catherine McSorley, 2019 */
(function(){

    //pseudo-global variables
    var csvData;
    var yScale;
    var chart;
    var classes;
    
 //CountyName,BachHigher,PopDensity,MedianAge,MedianIncome,NonWhite
    var attrArray = ["PopDensity", "BachHigher", "MedianAge", "MedianIncome", "NonWhite"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute
    
    //chart frame dimensions
    var chartWidth = window.innerWidth*0.7,
        chartHeight = window.innerHeight*0.4,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")"; 
    
    var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];

    

   

    //set up choropleth map
    function setMap(){

        //map frame dimensions
        var width =  window.innerWidth*0.7,
            height = window.innerHeight*0.4;

        //create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        //create Albers equal area conic projection centered on North Carolina
        //HELP cannot figure out how to rotate properly
        var projection = d3.geoAlbers()
            .center([0,35.282169])
            .rotate([80.193457, 0])
            .parallels([35, 36.4])
            .scale(height*10)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(projection);
        
        //place graticule on the map
            setGraticule(map, path);


        //use Promise.all to parallelize asynchronous data loading
        var promises = [];
        promises.push(d3.csv("data/D3LabData.csv")); //load attributes from csv
        promises.push(d3.json("data/ncCountyFinal.topojson")); 
        promises.push(d3.json("data/cb_2017_us_state_20m.topojson")); 
        Promise.all(promises).then(callback);

        function callback(data){
           csvData = data[0];
           nc = data[1];
           usa = data[2];
            
            

            var ncCounties = topojson.feature(nc, nc.objects.counties).features;
            var usStates = topojson.feature(usa, usa.objects.usaTOPO).features;

            

            //add US states to map
            var states = map.selectAll(".states")
                .data(usStates)
                .enter()
                .append("path")
                .attr("class", function(d){
                    return "states " + d.properties.NAME;
                })
                .attr("d", path);
            
            

                 //join csv data to GeoJSON enumeration units
            counties = joinData(ncCounties, csvData);

                 //create the color scale
            var colorScale = makeColorScale(csvData);

            //add enumeration units to the map
            setEnumerationUnits(ncCounties, map, path, colorScale);

                //add coordinated visualization to the map
            setChart(csvData, colorScale);
            
            createDropdown(csvData);
            
            //Add event listener to change classification
            
            createLegend(csvData, expressed);
            d3.select("#classbutton").on("change", function () {
                changeAttribute(expressed, csvData)
            });

            };
        
        


    };
    
    //function to create a dropdown menu for attribute selection
    //Example 1.1 line 1...function to create a dropdown menu for attribute selection
    function createDropdown(csvData){
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, csvData)
            });
        
         //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){ return d });

            //OPTIONS BLOCKS FROM EXAMPLE 1.1 LINES 8-19
    };

    //dropdown change listener handler
    //Example 1.4 line 14...dropdown change listener handler
    function changeAttribute(attribute, csvData){
        //change the expressed attribute
        expressed = attribute;
        
        /**var max = d3.max(csvData, function(d) { 
                 return +d[expressed];
             });**/

        //recreate the color scale
        var colorScale = makeColorScale(csvData);

        //recolor enumeration units
        var counties = d3.selectAll(".counties")
            .transition()
            .duration(10)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale)
            });
        
        
        var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition()
            //Set delay function to delay the transition using anonymous function
            .delay(function (d, i) {
                return i * 50
            })
        .duration(10);
        
        updateChart(bars, csvData.length, colorScale, csvData);
        createLegend(csvData, expressed);
    };
    
    function setGraticule(map, path){
    //...GRATICULE BLOCKS FROM MODULE 8
        //Example 2.5 line 3...create graticule generator
            var graticule = d3.geoGraticule()
                .step([2, 2]); //place graticule lines every 5 degrees of longitude and latitude

            //create graticule background
            var gratBackground = map.append("path")
                .datum(graticule.outline()) //bind graticule background
                .attr("class", "gratBackground") //assign class for styling
                .attr("d", path) //project graticule

            //create graticule lines
            var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
                .data(graticule.lines()) //bind graticule lines to each element to be created
                .enter() //create an element for each datum
                .append("path") //append each element to the svg as a path element
                .attr("class", "gratLines") //assign class for styling
                .attr("d", path); //project graticule lines
    };

    function joinData(counties, csvData){
        //...DATA JOIN LOOPS FROM EXAMPLE 1.1
        
        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.GEOID; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a=0; a<counties.length; a++){

                var geojsonProps = counties[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.GEOID; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){

                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                         
                    });
                };
            };
        };
       
        return counties;
    };
    
    
        //function to create color scale generator
    function makeColorScale(data){
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];
        
        var domainArray = [];

        //create color scale generator
        var colorScale = d3.scaleThreshold()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        
        for (var i=0; i<data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //cluster data using ckmeans clustering algorithm to create natural breaks
        classes = ss.ckmeans(domainArray, 5);
        //reset domain array to cluster minimums
        domainArray = classes.map(function(d){
            return d3.min(d);
        });
        //remove first value from domain array to create class breakpoints
        domainArray.shift();

        //assign array of last 4 cluster minimums as domain
        colorScale.domain(domainArray);
        classes = domainArray;
        return colorScale;
        //no null values => no helper function
    };

    function setEnumerationUnits(ncCounties, map, path, colorScale){
        //...REGIONS BLOCK FROM MODULE 8
        //add NC counties to map 

            var counties = map.selectAll(".counties")
                .data(ncCounties)
                .enter()
                .append("path")
                .attr("class", function(d){
                    return "counties " + d.properties.NAME;
                })
                .attr("d", path)
                .style("fill", function(d){
                return choropleth(d.properties, colorScale);
                })
                .on('mouseover', function (d) {
                highlight(d.properties);
                })
                .on('mouseout', function (d) {
               dehighlight(d.properties);
                })
                .on("mousemove", moveLabel);
                    
                    var desc = counties.append("desc")
            .text('{"opacity": "1"}');
                    
        };
    
    //function to test for data value and return color
    function choropleth(props, colorScale){
        //make sure attribute value is a number
        var val = parseFloat(props[expressed]);
        //if attribute value exists, assign a color; otherwise assign gray
        if (typeof val == 'number' && !isNaN(val)){
            return colorScale(val);
        } else {
            return "#CCC";
        };
    };
    
     function moveLabel() {
        //Determine width of label
        var labelWidth = d3.select('.infolabel')
            //Use node() to get the first element in this selection
            .node()
            //Return an object containing the sie of the label
            .getBoundingClientRect()
            //Examine width to determine how much to shift the mouse over
            .width;

        //Use coordinates of mousemove event to set label coordinates with offsets from wherever event is
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth - 10,
            //Used to switch vertical sides
            y2 = d3.event.clientY + 25;
        //Test for overflow horizontally (If the event x coordinate is greater than the width of the window and label buffer)
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
        //Test for overflow vertically (Is the Y coordinate less than the distance between mouse and upper-left label)
        var y = d3.event.clientY < 75 ? y2 : y1;
        //Select the infolabel currently mousing over
        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };
    
    
    //function to create coordinated bar chart
    function setChart(csvData, colorScale){

        var max = d3.max(csvData, function(d) { 
                 return +d[expressed];
             }); 

        var yScale = d3.scaleLinear()
            .range([chartInnerHeight, 0])
            .domain([0, max]);
        
        //create a second svg element to hold the bar chart
        chart = d3.select("body")
                .append("svg")
                .attr("width", chartWidth)
                .attr("height", chartHeight)
                .attr("class", "chart");
        
        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
        
        
           //set bars for each province
         var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b[expressed]-a[expressed]
            })
            .attr("class", function(d){
                return "bar " + d.NAME;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .on("mouseover", highlight)
            .on("mouseout", dehighlight)
            .on("mousemove", moveLabel);
        
        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
        
        
        
        var chartTitle = chart.append("text")
            .attr("x", chartInnerWidth/2)
            .attr("y", 30)
            .attr("class", "chartTitle")

    
        
        //below Example 2.8...create a text element for the chart title
        
        
        
         updateChart(bars, csvData.length, colorScale, csvData);
        
        var desc = bars.append("desc")
            .text('{"opacity": "1"}');
       
    };
    
        //function to position, size, and color bars in chart
    function updateChart(bars, n, colorScale, csvData){
        
        d3.selectAll("g").remove();
        
        var max = d3.max(csvData, function(d) { 
                 return +d[expressed];
             }); 
        
        var yScale = d3.scaleLinear()
            .range([chartInnerHeight, 0])
            .domain([0, max]);
        
            //create vertical axis generator
        var yAxis = d3.axisLeft()
            .scale(yScale)
            .tickSize(0)
            .ticks(10, ',~f');
        
        //place axis
        var axis = chart.append('g')
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);       
        
            
        
        //position bars
        bars.attr("x", function(d, i){
                return i * (chartInnerWidth / n) + leftPadding;
            })
            //size/resize bars
            .attr("height", function(d, i){
               // console.log(Math.abs(chartInnerHeight - yScale(parseFloat(d[expressed]))));
                return Math.abs(chartInnerHeight - yScale(parseFloat(d[expressed])));
            })
            .attr("y", function(d, i){
                //console.log(yScale(parseFloat(d[expressed])) + topBottomPadding);
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            //color/recolor bars
            .style("fill", function(d){
                return choropleth(d, colorScale);
            });
        

        var chartTitle = d3.select(".chartTitle")
        .text(expressed);
    };
    
    function highlight(props) {
        //Change the opacity of the highlighted item by selecting the class
        var selected = d3.selectAll("." + props.NAME)
            .style("stroke", "blue")
            .style("stroke-width", "2");
        //Call setlabel to create dynamic label
        setLabel(props);
    };

    //Function: dehighlight regions//
    function dehighlight(props) {
        var selected = d3.selectAll("." + props.NAME)
            .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
        d3.select(".infolabel")
            .remove();
    };

    //Function: create dynamic labels//
    function setLabel(props) {
        //Create label content as HTML string
        var labelAttribute = '<h1>' + props[expressed] + '</h1><i><b>' + expressed + '</i></b>';
        //Create detailed label in html page 
        var infolabel = d3.select('body')
            .append('div')
            //Define class, ID, and add it to HTML
            .attr('class', 'infolabel')
            .attr('id', props.NAME + '_label')
            .html(labelAttribute);
        //Create div that contains the name of the region
        var countyName = infolabel.append('div')
            .attr('class', 'labelname')
            .html(props.NAME + " County");
    };

    //Function: move label where mouse moves//
    function moveLabel() {
        //Determine width of label
        var labelWidth = d3.select('.infolabel')
            //Use node() to get the first element in this selection
            .node()
            //Return an object containing the sie of the label
            .getBoundingClientRect()
            //Examine width to determine how much to shift the mouse over
            .width;

        //Use coordinates of mousemove event to set label coordinates with offsets from wherever event is
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth - 10,
            //Used to switch vertical sides
            y2 = d3.event.clientY + 25;
        //Test for overflow horizontally (If the event x coordinate is greater than the width of the window and label buffer)
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
        //Test for overflow vertically (Is the Y coordinate less than the distance between mouse and upper-left label)
        var y = d3.event.clientY < 75 ? y2 : y1;
        //Select the infolabel currently mousing over
        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };

    //Function: create legend//
    function createLegend(csvData, expressed) {
        //Create legend using scale for labels
        var scale = d3.scaleThreshold()
            .domain(classes)
            .range(colorClasses);
        //Add SVG element to body for legend
        d3.select('body').append('svg').attr('class', 'legendBox');
        //Assign legend variable to SVG
        var legend = d3.select("svg.legendBox");
        //Add group element to hold legend items
        legend.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(20,20)");
        //Stylize the legend using legendColor API
        var colorLegend = d3.legendColor()
            .shapeWidth(185)
            .orient('horizontal')
            .scale(scale)
            .title(expressed)
            .labels(d3.legendHelpers.thresholdLabels)
        //Add the legend to the map via the SVG
        legend.select(".legend")
            .call(colorLegend);
    };
    
     //begin script when window loads
    window.onload = setMap();
    
})(); //last line of main.js


