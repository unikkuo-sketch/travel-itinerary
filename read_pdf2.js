const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('C:\\Users\\unikkuo\\Desktop\\Anti\\traveling\\.agent\\travel-itinerary-2026\\2026關東賞櫻6日遊.pdf');

console.log("pdf module is:", typeof pdf);
if (typeof pdf === 'object') {
    Object.keys(pdf).forEach(key => console.log(key));
}

let parseFunc = (typeof pdf === 'function') ? pdf : (pdf.default || pdf.pdf);
if (typeof parseFunc !== 'function') {
    console.error("Could not find parse function");
    process.exit(1);
}

parseFunc(dataBuffer).then(function(data) {
    console.log("--- START TEXT ---");
    console.log(data.text);
    console.log("--- END TEXT ---");
}).catch(console.error);
