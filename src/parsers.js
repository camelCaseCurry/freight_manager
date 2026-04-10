// Parsing functions for a few key companies  
// inputs : raw text from a pdf rate confirmation sheet
// outputs: 
//  pickup locations + times,
//  delivery locations + times,
//  commodity category and or name,
//  commodity quantity,
//  total payment, 
//  and other fields


// Date regexes
// Month numbers
const monthNum = "(0?[1-9]|1[0-2])";
const dayNum = "(0?[1-9]|[12][0-9]|3[01])";
const yearNum = "(\\d{2}|\\d{4})";
// numeric date: 2-digit month + optional separator + 2-digit day + optional separator + 2- or 4-digit year
const numericDate = `\\b${monthNum}([/\\s])${dayNum}([/\\s])${yearNum}\\b`;
// month names
const shortMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Sept","Oct","Nov","Dec"];
const longMonths = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const monthName = [...shortMonths, ...longMonths].join("|");
// suffix
const ordinal = "(?:st|nd|rd|th)?";
const monthNameDate = `(${monthName})\\s+${dayNum}${ordinal},?\\s+${yearNum}`;
// Single date regex (capture group)
const dateRegex = new RegExp(`(${numericDate}|${monthNameDate})`, "gi");

//State Regexes
const shortStates = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
const longStates = ['Alabama',
        'Alaska',
        'Arizona',
        'Arkansas',
        'California',
        'Colorado',
        'Connecticut',
        'Delaware',
        'Florida',
        'Georgia',
        'Hawaii',
        'Idaho',
        'Illinois',
        'Indiana',
        'Iowa',
        'Kansas',
        'Kentucky',
        'Louisiana',
        'Maine',
        'Maryland',
        'Massachusetts',
        'Michigan',
        'Minnesota',
        'Mississippi',
        'Missouri',
        'Montana',
        'Nebraska',
        'Nevada',
        'New Hampshire',
        'New Jersey',
        'New Mexico',
        'New York',
        'North Carolina',
        'North Dakota',
        'Ohio',
        'Oklahoma',
        'Oregon',
        'Pennsylvania',
        'Rhode Island',
        'South Carolina',
        'South Dakota',
        'Tennessee',
        'Texas',
        'Utah',
        'Vermont',
        'Virginia',
        'Washington',
        'West Virginia',
        'Wisconsin',
        'Wyoming'];
const stateName = [...shortStates, ...longStates].join("|");
const zipCode = "\\b\\d{5}(?:-\\d{4})?\\b";
const zipRegex =  new RegExp(`(${statePattern})\\s*,?\\s*${zipPattern}`, "gi");

function extractAddresses(text,keywordRegex,addressRegex,buffer){
    let results = []
    const allMatches = text.matchAll(addressRegex);

    allMatches.forEach(match => {
         const prefix = text.slice(Math.max(0, match.index - buffer), match.index);
        // Reset lastIndex for consistent testing
        keywordRegex.lastIndex = 0;
        if (keywordRegex.test(prefix)){
            results.push(match[0].replace(/\n/g, ' '));
        
        }
    });
    
return results;
}



function toYYYYMMDD(date) {
  return date.toISOString().slice(0, 19);
}
// pull dates that have the target keyword infront of them
function extractDates(text,dateTimeRegex,keywordRegex,buffer){
    const results = []; 
    const matches = text.matchAll(dateTimeRegex);
     
    matches.forEach( match => {
        const prefix = text.slice(Math.max(0, match.index - buffer), match.index);
        // Reset lastIndex for consistent testing
        
        keywordRegex.lastIndex = 0;
        if (keywordRegex.test(prefix)){
        const cleanStr = match[0]
                .replace(/[-\t]/g, "") 
                .replace(/\s+/g, " ")
                .trim();

        const date = toYYYYMMDD(new Date(cleanStr));
        results.push(date);
        }
    }); 

    return results;
}

// pull a cash amount 
function extractDollars(text,keywordRegex,buffer) {

    const MONEY_REGEX = /[$]?[\d,]+\.\d{2}/;
    
    let lastAmount = null;

    for (const kw of text.matchAll(keywordRegex)) {
        // look ahead 50 chars from a keyword
        const start = kw.index + kw[0].length;
        const window = text.slice(start, start + buffer);
        const amountMatch = window.match(MONEY_REGEX);
        if (!amountMatch) continue;
        //store most recent amount
        const numeric = parseFloat(amountMatch[0].replace(/[$,]/g, ""));
        lastAmount = numeric;
        return lastAmount == null
        ? null
        : lastAmount.toLocaleString("en-US", {
              style: "currency",
              currency: "USD"
          });
    }
    //reformat
}

//
function extractFirstGeneric(text, selectionRegex) {
    const match = text.match(selectionRegex);
    if (match){
        return match[0].trim();}
}

function extractAllGeneric(text, selectionRegex) {
    results=[];
    for (const match of text.matchAll(selectionRegex)){
        results.push(match[0]).trim();
    }; 
 
    return results;
}

function extractDataFromText(text,idRegex,dateTimeRegex,addressRegex, deliveryRegex,loadingRegex,totalRegex,milesRegex,buffers){

    // numerics '
    const id = extractFirstGeneric(text,idRegex);
    const totalPayment = extractDollars(text,totalRegex,buffers[0]);


    //strings
    const deliveryDates = extractDates(text,dateTimeRegex,deliveryRegex,buffers[2]);
    const loadDates = extractDates(text,dateTimeRegex,loadingRegex,buffers[3]);
    
    const deliveryAddresses = extractAddresses(text, deliveryRegex,addressRegex,buffers[4]);
    const loadAddresses = extractAddresses(text, loadingRegex,addressRegex,buffers[5]);

    const extractedData = {
        id,
 
      totalPayment,
      deliveryAddresses,
      deliveryDates,
      loadAddresses,
      loadDates
    };
    console.log(extractedData);
    return extractedData;
}

function parseLighthouse(text){
    const shipRegex = new RegExp("(?<=Shipment ID)\\s+\\d{5}-\\d{6}", "gi");
    
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const addressKeywords = ["Apt", "FCFS"];
    
    const datePart = `(?:${monthNames.join('|')})\\s+\\d{1,2},\\s+\\d{4}`;
    
    // 2. STRICT BRIDGE: Match everything UNLESS it's the start of a new date
    // This prevents the match from spanning across multiple date entries.
    const bridge = `(?:(?!${monthNames.join('|')})[\\s\\S])+?`;
    
    // 3. Time Part stays the same
    const firstTime = `\\d{1,2}:\\d{2}`;
    
    // 4. Tighten the Lookahead
    // Ensure the keyword (Apt/FCFS) is within a reasonable distance (e.g., 50 chars)
    const lookahead = `(?=[\\s\\S]{0,50}(?:${addressKeywords.join('|')}))`;
    
    const dateTimeRegex = new RegExp(`${datePart}${bridge}${firstTime}${lookahead}`, "gi");

    const deliveryRegex =  /Delivery[\s-]/gi;
    const loadingRegex =  /(Pickup)/gi;
    const totalRegex =
        /\b(?:total\s+(?:cost|due|payment\s+due|amount|price|charge)|total\b(?=\s*(?!miles|weight|distance|lb|kg)))/gi;
    const milesRegex =
        /(total miles|miles|distance)/gi;
    const addressRegex = new RegExp(`(?<=${addressKeywords.join("|")})\\s+[\\s\\S]+?\\d{5}`, "gi");
    const a=1;

    return extractDataFromText(text,shipRegex,dateTimeRegex,addressRegex, deliveryRegex,loadingRegex,totalRegex,milesRegex,[25,25,40,40,40,40]);
    
}