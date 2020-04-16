// County geojson object thanks to: https://eric.clst.org/tech/usgeojson/
// From data compiled by https://www.census.gov/en.html

// Declare global variables and helper functions
let day_length = 24 * 60 * 60;
let cases = [];
let fipsMap = {};

function makeDate(my_str) {
    return new Date(my_str);
}


function timestamp(str) {
    return makeDate(str).getTime();
  }

function two_digit(entry) {
    my_char = entry.toString() 
        if(my_char.length === 1){
        return '0'+my_char;
    } else{
        return my_char;
    }
}

function formatDate(date) {
    month = two_digit(date.getMonth()+1);
    num_date = two_digit(date.getDate());
    return date.getFullYear() + "-" + month + "-" + num_date;
}

// Function to return object from array
function objectify(array) {
    var object = {};
    array.forEach(function(element) {
        object[element[0]] = element[1];
    });
    return object;
}

// Color function based on count of cases
function getColor(feature, date) {
    let datesMap = fipsMap[feature.properties.FIPS] || {};
    let casesCount = parseInt(datesMap[date], 10) || 0;

    return casesCount > 15000 ? "#000000" :
           casesCount > 10000 ? "#180901" :
           casesCount > 5000  ? "#481a04" :
           casesCount > 1000  ? "#662506" :
           casesCount > 500   ? "#993404" :
           casesCount > 100   ? "#cc4c02" :
           casesCount > 50    ? "#ec7014" :
           casesCount > 25    ? "#fe9929" :
           casesCount > 5     ? "#fec44f" :
           casesCount > 0     ? "#fee391" :
                                "#ffffff";
}

// Count function based on county and date
function getCount(feature, date) {
    let datesMap = fipsMap[feature.properties.FIPS] || {};
    let casesCount = parseInt(datesMap[date], 10) || 0;

    return casesCount;
}

// Function to make legend color
function getLegendColor(d) {
    return d > 15000 ? "#000000" :
           d > 10000 ? "#180901" :
           d > 5000  ? "#481a04" :
           d > 1000  ? "#662506" :
           d > 500   ? "#993404" :
           d > 100   ? "#cc4c02" :
           d > 50    ? "#ec7014" :
           d > 25    ? "#fe9929" :
           d > 5     ? "#fec44f" :
           d > 0     ? "#fee391" :
                       "#ffffff";

}

// Function to link counties object with cases object
function transformCasesToFipsMap(cases) {
    cases.forEach(function (county) {
        let dateKeys = county.cases.map(el => el.date);
        let values = county.cases.map(el => el.casesTotal);
        fipsMap[county.fips] = _.object(dateKeys, values);
    });
}

// Bring in counties geoJSON object
const countiesObject =  countiesData.features;
console.log(countiesObject);

// Add FIPS field to properties in geoJSON object
Object.entries(countiesObject).forEach(element => { 

    let properties = element[1].properties;
    let state = properties.STATE;
    let county = properties.COUNTY;
    let fips = state.concat(county);

    properties.FIPS = fips;
});


// Read in county cases csv data
d3.csv("static/data/counties_cases.csv").then(function(data) {
    let casesObject = data;

    casesObject.forEach(county => {
        var elements = Object.keys(county);
        var values = Object.values(county);
        
        var datesObject = [];
        for (var i = 2; i < elements.length; i++) {
            let obj = {};
            obj["date"] = elements[i];
            obj["casesTotal"] = values[i];
            datesObject.push(obj)  
            
            county["cases"] = datesObject    
        } 

        let info = Object.entries(county);
        
        for (var i = 2; i < (info.length-1); i++) {
            delete info[i]; 
        }

        let casesClean = objectify(info);
        cases.push(casesClean);
    });  
    
    transformCasesToFipsMap(cases);
    initMap();

}); 

// Load base map
function initMap() {
 
    let mapboxAccessToken = API_KEY;
    let map = L.map('map').setView([37.8, -96], 4);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
        id: 'mapbox/light-v9',
        attribution:  "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map);

    // Load first map layer on initialization
    fill_layer = L.geoJson(countiesObject, {
        style: (feature) => {
            return {
                weight: 0.2,
                fillColor: getColor(feature, "2020-01-20"),
                fillOpacity: 1,
                opacity: 1
            };
        }
    // }).bindTooltip(function (layer) {
    //     return layer.feature.properties.NAME;
    })
    .addTo(map);

    // Add legend
    let legend = L.control({position: "bottomright"});
    
    legend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend');
        grades = [0, 5, 25, 50, 100, 500, 1000, 5000, 10000, 15000];
        labels = [];
        
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getLegendColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        } 
        
        return div;
    };

    legend.addTo(map);

}

// Function to update map on new date in slider
function updateMap(chosenDate) {        

    fill_layer.eachLayer(function (layer) {  
        layer.setStyle({fillColor : getColor(layer.feature, chosenDate)});
        
        layer.bindTooltip(function(layer){
            return "County: " + layer.feature.properties.NAME + '<br>'
                    + "Cases: " + getCount(layer.feature, chosenDate);
        });
    });

}

// Function on slider movement
function updateSlider(chosenDate) {
    slider.property("value");
    d3.select(".day").text(chosenDate);
    
}

// Make Slider
let minDate = new Date('2020-01-21').getTime() / 1000;
let maxDate = new Date('2020-04-08').getTime() / 1000;


let slider = d3.select(".slider")
    .append("input")
    .attr("type", "range")
    .attr("min", minDate)
    .attr("max", maxDate)
    .attr("step", day_length)
    .on("input", function(){
        let date = this.value;
        let a = makeDate(date*1000);
        let chosenDate = formatDate(a);
        updateSlider(chosenDate);
        updateMap(chosenDate);
    })
  
updateSlider("2020-01-20");    

