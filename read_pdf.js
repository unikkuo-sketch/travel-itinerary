const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('C:\\Users\\unikkuo\\Desktop\\Anti\\traveling\\.agent\\travel-itinerary-2026\\2026關東賞櫻6日遊.pdf');

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
