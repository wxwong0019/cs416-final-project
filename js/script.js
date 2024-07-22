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
            title: "Global Life Expectancy Trends (click next)",
            yearRange: [1900, 2000],
            countries: allCountries,
            annotation: {
                text: ["Throughout the 20th century, global life expectancy saw significant increases due", "to advancements in medicine, sanitation, and nutrition."],
                position: {x: 1910, y: 90}
            },
            description: "This scene provides an overview of life expectancy trends across the 20th century for multiple countries. It illustrates the overall upward trajectory of life expectancy worldwide. The visualization shows a general increase in life expectancy for most countries, with some variations in the rate of improvement. This scene sets the stage for the narrative, showing viewers the big picture of how human longevity has improved over a century. It highlights differences between developed and developing nations, and points out countries that made particularly rapid progress."
        },
        {
            title: "Impact of World War II (click next)",
            yearRange: [1935, 1950],
            countries: wwiiAffectedCountries,
            annotation: {
                text:["World War II caused a significant decline in life expectancy, ","reflecting the devastating impact of the conflict on health and survival."],
                position: {x: 1940, y: 10}
            },
            description: "This scene zooms in on a crucial period in history, focusing on the years surrounding World War II. It demonstrates the significant impact of the war on life expectancy in affected countries. Viewers can observe sharp declines in life expectancy for nations directly involved in the conflict, contrasted with more stable trends in countries less affected by the war. This scene underscores how major historical events can have profound and immediate effects on population health and longevity. It also highlights differences in the war's impact across various countries."
        },
        {
            title: "Post-War Recovery (click next)",
            yearRange: [1945, 1957],
            countries: wwiiAffectedCountries,
            annotation: {
                text: ["Following WWII, many countries experienced rapid improvements in life expectancy ","due to peace and reconstruction efforts."],
                position: {x: 1945.5, y: 75}
            },
            description: "This scene explores the recovery and progress made in the decades following World War II. It shows a rapid improvement in life expectancy for many countries as they rebuilt after the war. This scene illustrates the acceleration of medical and public health advancements during this period, as well as the effects of economic recovery and development on population health. It also highlights divergences in recovery rates between different nations or regions, touching on themes of global inequality in health outcomes. This scene concludes the guided narrative by showing how countries rebounded from the setbacks of war and made significant strides in improving life expectancy."
        },
        {
            title: "User Exploration (end)",
            yearRange: [1900, 2000],
            countries: allCountries,
            annotation: {
                text: ["Explore the data by adjusting the time range slider above", "to observe changes in life expectancy over different periods.","You may also select a country from the drop down menu"],
                position: {x: 1940, y: 95}
            },
            description: "Feel free to Explore the data! Use Slider to adjust time range, and use dropdown menu to drill down on individual country."
        }

    ];

    let currentScene = 0;
    function updateButtonStates() {
        const prevButton = d3.select("#prev");
        const nextButton = d3.select("#next");
    
        prevButton.property("disabled", currentScene === 0);
        nextButton.property("disabled", currentScene === scenes.length - 1);
    }
    function updateScene() {
        const scene = scenes[currentScene];
        
        // Update title
        d3.select("h1").text(scene.title);
        
        d3.select("#scene-description")
            .html(scene.description);

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
            .attr("height", scene.countries.length * 20); 
        
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
                    .html(`${d}<br/>Year: ${year}<br/>Life Expectancy: ${value.toFixed(2)} years`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke-width", 2);
                d3.select(".tooltip").style("opacity", 0);
            });


        // Update annotation
        svg.selectAll(".annotation").remove();
        const annotation =  svg.append("text")
            .attr("class", "annotation")
            .attr("x", xScale(scene.annotation.position.x))
            .attr("y", yScale(scene.annotation.position.y))
            .attr("text-anchor", "right");
        scene.annotation.text.forEach((line, i) => {
            annotation.append("tspan")
                .attr("x", xScale(scene.annotation.position.x))
                .attr("dy", i === 0 ? 0 : "1.2em")  // Add line spacing for all but the first line
                .text(line);
            });
        d3.select("#next").on("click", () => {
            
            if (currentScene < scenes.length - 1) {
                currentScene++;
                updateScene();
                console.log("current scene : " +currentScene)
                if (currentScene === 3 ) {
                    enterExplorationMode();
                }
                if (currentScene !== 3) {
                    d3.select("#controls").html("");
                }
            }  
            
        });
        updateButtonStates()
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
        if (currentScene !== 3) {
            d3.select("#controls").html("");
        }
    });
    
    function clearControls() {
        d3.select("#controls").html("");
    }
    // Initial render
    function enterExplorationMode() {
        // Clear existing controls and annotation
        clearControls();
        svg.select(".annotation").remove();
        
        const scene = scenes[currentScene];
        
        svg.selectAll(".annotation").remove();
        const annotation =  svg.append("text")
            .attr("class", "annotation")
            .attr("x", xScale(scene.annotation.position.x))
            .attr("y", yScale(scene.annotation.position.y))
            .attr("text-anchor", "right");
        scene.annotation.text.forEach((line, i) => {
            annotation.append("tspan")
                .attr("x", xScale(scene.annotation.position.x))
                .attr("dy", i === 0 ? 0 : "1.2em")  
                .text(line);
            });

        const controlsDiv = d3.select("#controls");
        
        let selectedCountries = allCountries;
    
        // Add country selection dropdown
        const dropdown = controlsDiv.append("select")
            .style("margin-right", "10px")
            .on("change", function() {
                const selected = d3.select(this).property("value");
                selectedCountries = selected === "All Countries" ? allCountries : [selected];
                updateChart(selectedCountries, currentYearRange);
            });
        
        dropdown.selectAll("option")
            .data(["All Countries", ...allCountries])
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);
        
        // Add year range slider
        const sliderWidth = 600;
        const sliderHeight = 30;
        const minYear = 1900; 
        const maxYear = 2024;
        let currentYearRange = [1930, 2000];
        
    
        const sliderScale = d3.scaleLinear()
            .domain([minYear, maxYear])
            .range([0, sliderWidth])
            .clamp(true);
    
        const slider = controlsDiv.append("svg")
            .attr("width", sliderWidth + 50)
            .attr("height", sliderHeight);
    
        slider.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(25, ${sliderHeight - 20})`)
            .call(d3.axisBottom(sliderScale).tickFormat(d3.format("d")));
    
        const brush = d3.brushX()
            .extent([[0, 0], [sliderWidth, sliderHeight - 20]])
            .on("brush end", brushed);
    
        const gBrush = slider.append("g")
            .attr("class", "brush")
            .attr("transform", "translate(25, 0)")
            .call(brush);
    
        gBrush.call(brush.move, [sliderScale(1930), sliderScale(2000)]);
    
        function brushed(event) {
            if (!event.sourceEvent) return; // ignore brush-by-zoom
            let s = event.selection;
            if (s === null) {
                s = [sliderScale(1930), sliderScale(2000)];
                gBrush.call(brush.move, s);
            }
            currentYearRange = s.map(sliderScale.invert).map(Math.round);
            updateChart(selectedCountries, currentYearRange);
        }
    
        // Update chart function for exploration mode
        function updateChart(countries, yearRange = [minYear, maxYear]) {
            xScale.domain(yearRange);
            svg.select(".x-axis").call(xAxis);
            
            svg.selectAll(".country-line")
                .data(countries, d => d)  // Use country name as the key
                .join(
                    enter => enter.append("path")
                        .attr("class", "country-line")
                        .attr("fill", "none"),
                    update => update,
                    exit => exit.remove()
                )
                .attr("d", country => {
                    return line(data
                        .filter(d => d.year >= yearRange[0] && d.year <= yearRange[1])
                        .map(d => ({year: d.year, value: d[country]}))
                        .filter(d => d.value && d.value > 0)
                    );
                })
                .attr("stroke", d => colorScale(d));
        }
    
        // Initial update
        updateChart(selectedCountries, currentYearRange);
    }
    updateScene();
}).catch(error => {
    console.error("Error loading or processing the CSV file:", error);
    d3.select("#visualization").append("p").text("Error loading or processing data. Please check the console for details.");
});