# US COVID-19 County Map Total Cases by Day

Deployed at: https://covidslidermap.herokuapp.com/

The map herein is a United States county map of cumulative confirmed COVID-19 cases by day from January 21 to April 19. Confirmed case counts are obtained from the NYC Covid-19 <a href ="https://github.com/nytimes/covid-19-data"> github</a> repository. Individual counts for the 5 boroughs that make up New York City do not exist in the dataset and are therefore not represented in the map. These case counts are combined under the New York City label. 

The map was built using <a href="https://leafletjs.com/">Leaflet.js</a> with the county geojson object for county shapes obtained from Eric Celeste <a href="https://eric.clst.org/tech/usgeojson/"> here</a> using data from the <a href="https://www.census.gov/en.html"> US Census Bureau</a>.

