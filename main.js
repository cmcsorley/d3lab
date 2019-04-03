/* Javascript by Catherine McSorley, 2019 */
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on North Carolina
    //HELP cannot figure out how to rotate properly
    var projection = d3.geoAlbers()
        .center([-80.793457,35.782169])
        .rotate([0, 0])
        .parallels([35, 36.4])
        .scale(2500)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection);
    
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/D3LabData.csv")); //load attributes from csv
    promises.push(d3.json("data/WGS84Counties.topojson")); 
    promises.push(d3.json("data/cb_2017_us_state_20m.topojson")); 
    Promise.all(promises).then(callback);
    
    function callback(data){
	   csvData = data[0];
	   nc = data[1];
	   usa = data[2];
        
        //HELP I struggled with finding a dataset that had the FIPS codes AND was not projected. I don't know how I'm going to connect my CSV file
        var ncCounties = topojson.feature(nc, nc.objects.WGS84Counties).features;
        var usStates = topojson.feature(usa, usa.objects.usaTOPO).features;
        
        //Example 2.5 line 3...create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
        
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
        
        //add US states to map
        var states = map.selectAll(".states")
            .data(usStates)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "states " + d.properties.name;
            })
            .attr("d", path);
        

        //add NC counties to map 
        //.name is a placeholder for when I find data that better represent county info
        var counties = map.selectAll(".counties")
            .data(ncCounties)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "counties " + d.properties.name;
            })
            .attr("d", path); 
    };
};