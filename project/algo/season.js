// season.js

/**
 * Returns the season for a given month number (1-12).
 * Winter: Dec, Jan, Feb
 * Spring: Mar, Apr, May
 * Summer: Jun, Jul, Aug
 * Autumn: Sep, Oct, Nov
 * @param {number} month - Month number (1-12)
 * @returns {string} Season name or "Invalid month"
 */
function getSeason(month) {
    switch (month) {
        case 12:
        case 1:
        case 2:
            console.log("Winter");
            break;
        case 3:
        case 4:
        case 5:
            console.log("Spring");
            break;
        case 6:
        case 7:
        case 8:
            console.log("Summer");
            break;
        case 9:
        case 10:
        case 11:
            console.log("Autumn");
            break;
        default:
            console.log("Invalid month");
    }
}

module.exports = { getSeason };