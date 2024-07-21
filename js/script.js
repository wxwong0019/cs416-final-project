// Set up dimensions
const width = 800;
const height = 400;
const margin = {top: 20, right: 100, bottom: 50, left: 50};

// Create SVG
const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Create scales
const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Create axes
const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
const yAxis = d3.axisLeft(yScale);

svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`);

svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`);

// Add labels
svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .style("text-anchor", "middle")
    .text("Year");

svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .style("text-anchor", "middle")
    .text("Life Expectancy");

// Create line generator
const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .defined(d => d.value && d.value > 0)
    .curve(d3.curveMonotoneX);  // Monotone curve interpolation
// Load the data
d3.csv('data/lex.csv').then(rawData => {
    console.log("Raw data loaded:", rawData);

    // Process the data
    const data = [];
    const years = Object.keys(rawData[0]).filter(key => key !== 'country' && key !== 'year');
    
    years.forEach(year => {
        const yearData = {year: +year};
        let hasValidData = false;
        rawData.forEach(row => {
            if (row.country) {
                const value = +row[year];
                // yearData[row.country] = +row[year];
                if (value && !isNaN(value) && value > 0) {  // Check for valid, non-zero values
                    yearData[row.country] = value;
                    hasValidData = true;
                }
            }
        });
        data.push(yearData);
    });

    data.sort((a, b) => a.year - b.year);
    console.log("Processed data:", data);

    // Define allCountries
    // const allCountries = Array.from(new Set(rawData.map(d => d.country).filter(Boolean)));
    const allCountries = Array.from(new Set(
        data.flatMap(d => Object.keys(d).filter(key => key !== 'year' && d[key] > 0))
    ));
    console.log("All countries:", allCountries);

    // Define wwiiAffectedCountries (example selection, adjust as needed)
    const wwiiAffectedCountries = [
        "Germany", "UK", "France", "Italy", "Russia", 
        "Poland", "Japan", "USA", "China"
    ].filter(country => allCountries.includes(country));
    console.log("WWII affected countries:", wwiiAffectedCountries);

    // Update scales
    xScale.domain(d3.extent(data, d => d.year));
    yScale.domain([0, d3.max(data, d => d3.max(allCountries, country => d[country]))]);

    // Update axes
    svg.select(".x-axis").call(xAxis);
    svg.select(".y-axis").call(yAxis);

    // Define scenes
    const scenes = [
        {
            title: "Global Life Expectancy Trends",
            yearRange: [1900, 2000],
            countries: allCountries,
            annotation: {
                text: "Life expectancy has generally increased worldwide over the 20th century.",
                position: {x: 1950, y: 60}
            }
        },
        {
            title: "Impact of World War II",
            yearRange: [1935, 1950],
            countries: wwiiAffectedCountries,
            annotation: {
                text: "WWII caused a noticeable dip in life expectancy for many countries.",
                position: {x: 1942, y: 55}
            }
        },
        {
            title: "Post-War Recovery",
            yearRange: [1945, 1970],
            countries: allCountries,
            annotation: {
                text: "Most countries saw rapid improvements in life expectancy after WWII.",
                position: {x: 1960, y: 65}
            }
        }
    ];

    let currentScene = 0;

    function updateScene() {
        const scene = scenes[currentScene];
        
        // Update title
        d3.select("h1").text(scene.title);
        
        // Update x-axis range
        xScale.domain(scene.yearRange);
        svg.select(".x-axis").call(xAxis);
        
        // Update lines
        svg.selectAll(".country-line")
            .data(scene.countries)
            .join("path")
            .attr("class", "country-line")
            .transition()  // Add transition
            .duration(1000)  // Transition duration in milliseconds
            .attr("d", country => {
                return line(data
                    .filter(d => d.year >= scene.yearRange[0] && d.year <= scene.yearRange[1])
                    .map(d => ({year: d.year, value: d[country]}))
                    .filter(d => d.value && d.value > 0)
                );
            })
            .attr("stroke", d => colorScale(d))
            .attr("fill", "none");  // Ensure no fill
        
        svg.selectAll(".country-line")
            .on("mouseover", function() {
                d3.select(this).attr("stroke-width", 4);
                svg.selectAll(".country-line").filter(d => d !== this.__data__)
                    .attr("opacity", 0.2);
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke-width", 2);
                svg.selectAll(".country-line").attr("opacity", 1);
            });
        
        // svg.select(".legend").remove();
        //     // Add new legend
        //     const legend = svg.append("g")
        //         .attr("class", "legend")
        //         .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);
        
        // scene.countries.forEach((country, i) => {
        //         const legendRow = legend.append("g")
        //             .attr("transform", `translate(0, ${i * 20})`);
                
        //         legendRow.append("line")
        //             .attr("x1", 0)
        //             .attr("y1", 0)
        //             .attr("x2", 20)
        //             .attr("y2", 0)
        //             .attr("stroke", colorScale(country));
                
        //         legendRow.append("text")
        //             .attr("x", 30)
        //             .attr("y", 5)
        //             .text(country);
        //     });
   
   
   
        d3.select(".legend-container").remove();

        // Create a container for the legend
        const legendContainer = d3.selectAll("#visualization")
            .append("div")
            .attr("class", "legend-container");
        console.log("Legend container created:", document.querySelector('.legend-container'));
        // Add new legend
        const legend = legendContainer.append("svg")
            .attr("class", "legend")
            .attr("width", "100%")
            .attr("height", scene.countries.length * 20);  // Adjust height based on number of countries
        
        scene.countries.forEach((country, i) => {
            const legendRow = legend.append("g")
                .attr("class", "legend-item")
                .attr("transform", `translate(0, ${i * 20})`);
        
            legendRow.append("line")
                .attr("x1", 0)
                .attr("y1", 10)
                .attr("x2", 20)
                .attr("y2", 10)
                .attr("stroke", colorScale(country));
        
            legendRow.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .text(country);
        });

        svg.selectAll(".country-line")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke-width", 4);
            })
            .on("mousemove", function(event, d) {
                const [x, y] = d3.pointer(event);
                const year = Math.round(xScale.invert(x));
                const value = data.find(item => item.year === year)[d];
                
                d3.select(".tooltip")
                    .style("opacity", 1)
                    .html(`${d}<br/>Year: ${year}<br/>Value: ${value.toFixed(2)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke-width", 2);
                d3.select(".tooltip").style("opacity", 0);
            });


        // Update annotation
        svg.selectAll(".annotation").remove();
        svg.append("text")
            .attr("class", "annotation")
            .attr("x", xScale(scene.annotation.position.x))
            .attr("y", yScale(scene.annotation.position.y))
            .text(scene.annotation.text);

           
    }



    // Create button container
    const buttonContainer = d3.select("#visualization")
    .insert("div", "svg")
    .attr("id", "navigation-buttons")
    .style("text-align", "center")
    .style("margin-bottom", "20px");

    // Create buttons
    buttonContainer.append("button")
    .attr("id", "prev")
    .text("Previous")
    .style("margin-right", "10px");

    buttonContainer.append("button")
    .attr("id", "next")
    .text("Next");
    // Navigation buttons
    d3.select("#prev").on("click", () => {
        if (currentScene > 0) {
            currentScene--;
            updateScene();
        }
    });
    
    d3.select("#next").on("click", () => {
        if (currentScene < scenes.length - 1) {
            currentScene++;
            updateScene();
        } else if (currentScene === scenes.length - 1) {
            enterExplorationMode();
        }
    });

    function enterExplorationMode() {
        // Remove annotation
        svg.select(".annotation").remove();
        
        // Add country selection dropdown
        const dropdown = d3.select("#controls").append("select")
            .on("change", function() {
                const selected = d3.select(this).property("value");
                updateChart([selected]);
            });
        
        dropdown.selectAll("option")
            .data(allCountries)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);
        
        // Add year range slider
        const slider = d3.select("#controls").append("input")
            .attr("type", "range")
            .attr("min", d3.min(data, d => d.year))
            .attr("max", d3.max(data, d => d.year))
            .attr("value", d3.max(data, d => d.year))
            .on("input", function() {
                const year = this.value;
                updateChart(null, [d3.min(data, d => d.year), +year]);
            });
        
        // Update chart function for exploration mode
        function updateChart(countries = allCountries, yearRange = [d3.min(data, d => d.year), d3.max(data, d => d.year)]) {
            xScale.domain(yearRange);
            svg.select(".x-axis").call(xAxis);
            
            svg.selectAll(".country-line")
                .data(countries)
                .join("path")
                .attr("class", "country-line")
                .attr("d", country => {
                    return line(data
                        .filter(d => d.year >= yearRange[0] && d.year <= yearRange[1])
                        .map(d => ({year: d.year, value: d[country]}))
                    );
                })
                .attr("stroke", d => colorScale(d));
        }
    }

    // Initial render
    updateScene();
}).catch(error => {
    console.error("Error loading or processing the CSV file:", error);
    d3.select("#visualization").append("p").text("Error loading or processing data. Please check the console for details.");
});