// County geojson object thanks to: https://eric.clst.org/tech/usgeojson/
// From data compiled by https://www.census.gov/en.html

// Helper functions
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
        return '0'+my_char
    } else{
        return my_char
    }
}

function getColor(feature, date) {
    let datesMap = fipsMap[feature.properties.FIPS] || {};
    let casesCount = parseInt(datesMap[date], 10) || 0;

    return casesCount > 1000 ? "#662506" :
           casesCount > 400 ? "#993404" :
           casesCount > 80  ? "#cc4c02" :
           casesCount > 40  ? "#ec7014" :
           casesCount > 10  ? "#fe9929" :
           casesCount > 5  ? "#fec44f" :
           casesCount > 0     ? "#fee391" :
                                "#fff7bc";
}

function formatDate(date) {
    month = two_digit(date.getMonth()+1);
    num_date = two_digit(date.getDate()+1);
    return date.getFullYear() + "-" + month + "-" + num_date;
}

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

// Function to return object from array
function objectify(array) {
    var object = {};
    array.forEach(function(element) {
        object[element[0]] = element[1];
    });
    return object;
}

// Initialize new cases object
cases = [];

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

        // console.log(info);

        let casesClean = objectify(info);
        cases.push(casesClean);
    });  
    
    console.log(cases);
    transformCasesToFipsMap(cases);
    initMap();

}); 


function initMap() {
    // Load base map
    let mapboxAccessToken = API_KEY;
    let map = L.map('map').setView([37.8, -96], 4);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
        id: 'mapbox/light-v9',
        attribution:  "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map);


    fill_layer = L.geoJson(countiesObject, {
        style: (feature) => {
            return {
                weight: 0.2,
                fillColor: getColor(feature, "2020-01-21"),
                fillOpacity: 1,
                opacity: 1
            };
        }
    }).addTo(map);
}

function updateMap(chosenDate) {        
    function style(feature) {
      return {
        fillColor: getColor(feature, chosenDate),
        opacity: 1,
        weight: 0.1,
        color: 'black'
      };
    }

    fill_layer.eachLayer(function (layer) {  
        layer.setStyle({fillColor : getColor(layer.feature, chosenDate)});
    });

}

// Create function on slider movement
function updateSlider(chosenDate) {
    slider.property("value");
    d3.select(".day").text(chosenDate);
    
}

// Make Slider
let minDate = new Date('2020-01-21').getTime() / 1000;
let maxDate = new Date('2020-04-07').getTime() / 1000;

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

updateSlider('2020-01-21');    
    

