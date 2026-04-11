// Parsing functions for a few key companies  
// inputs : raw text from a pdf rate confirmation sheet
// outputs: 
//  pickup locations + times,
//  delivery locations + times,
//  commodity category and or name,
//  commodity quantity,
//  total payment, 
//  and other fields

function extractAddresses(text, keywordRegex, addressRegex, buffer) {
    let results = [];
    const allMatches = text.matchAll(addressRegex);

    for (const match of allMatches) {
        const prefix = text.slice(Math.max(0, match.index - buffer), match.index);
        keywordRegex.lastIndex = 0;
        
        if (keywordRegex.test(prefix)) {
            // match[1] is the captured part. match[0] is the whole thing.
            const data = match[1] ? match[1] : match[0];
            results.push(data.replace(/\n/g, ' ').trim());
        }
    }
    return results;
}

// Do the same for extractDates (used for names)
function extractDates(text, dateTimeRegex, keywordRegex, buffer) {
    const results = []; 
    const matches = text.matchAll(dateTimeRegex);
     
    for (const match of matches) {
        const prefix = text.slice(Math.max(0, match.index - buffer), match.index);
        keywordRegex.lastIndex = 0;
        if (keywordRegex.test(prefix)) {
            // Grab match[1] to skip the label
            const raw = match[1] ? match[1] : match[0];
            const cleanStr = raw.replace(/[-\t]/g, "").replace(/\s+/g, " ").trim();
            results.push(cleanStr);
        }
    } 
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
function extractNames(text, nameRegex, typeRegex) {
    const results = [];
    const matches = text.matchAll(nameRegex);
    
    for (const match of matches) {
        // match[0] is the whole string (e.g. "PICKUP: RLS Distribution")
        // Check if this specific match contains our target type (PICKUP or DELIVERY)
        typeRegex.lastIndex = 0;
        if (typeRegex.test(match[0])) {
            // If the regex has a capture group (index 1), use it to get JUST the name
            results.push(match[1] ? match[1].trim() : match[0].trim());
        }
    }
    return results;
}

function extractDataFromText(text,idRegex,dateTimeRegex,nameRegex,addressRegex, deliveryRegex,loadingRegex,totalRegex,milesRegex,buffers){

    // numerics '
    const shipment_id = extractFirstGeneric(text,idRegex);
    const total_payment = extractDollars(text,totalRegex,buffers[0]);
    
    
    //strings
    const deliveryNames  = extractDates(text,nameRegex, deliveryRegex,buffers[4]);
    const loadNames  = extractDates(text,nameRegex,loadingRegex,buffers[5]);
    
    const deliveryDates = extractDates(text,dateTimeRegex,deliveryRegex,buffers[2]);
    const loadDates = extractDates(text,dateTimeRegex,loadingRegex,buffers[3]);
    
    const deliveryAddresses = extractAddresses(text, deliveryRegex,addressRegex,buffers[4]);
    const loadAddresses = extractAddresses(text, loadingRegex,addressRegex,buffers[5]);

    const extractedData = {
      
      shipment_id,
      total_payment,
      deliveryNames,
      deliveryAddresses,
      deliveryDates,
      loadNames,
      loadAddresses,
      loadDates
    };
    console.log(extractedData);
    return extractedData;
}

export function parseLighthouse(text){
    const shipRegex = new RegExp("(?<=Shipment ID)\\s+\\d{5}-\\d{6}", "gi");
      // Capture the name immediately following the label

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
        
    const nameRegex = /(?:FCFS|Apt)\s*\n\s*([^\n\d]+)/gi;

    // 2. Address Regex: Looks for the first line starting with a number AFTER FCFS/Apt
    const addressRegex = /(?:FCFS|Apt)[\s\S]+?(\d+[\s\S]+?\d{5})/gi;
   


    return extractDataFromText(text,shipRegex,dateTimeRegex,nameRegex,addressRegex, deliveryRegex,loadingRegex,totalRegex,milesRegex,[25,25,40,40,40,40]);
    
}


export function parseRLS(text){
    const shipRegex = /Manifest\s*#\s*(\d{7})/gi;
    
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const addressKeywords = ["ORDER"];

    const dateTimePattern = `(\\d{1,2}\/\\d{1,2}\/\\d{2,4})\\s+(\\d{1,2}:\\d{2}[APM]{2})\\s*-\\s*(\\d{1,2}:\\d{2}[APM]{2})`;
    const dateTimeRegex = new RegExp(dateTimePattern, "gi");

    const deliveryRegex = /DELIVERY:.*$/gim;
const loadingRegex  = /PICKUP:.*$/gim;
    const totalRegex =
        /\b(?:total\s+(?:cost|due|payment\s+due|amount|price|charge)|total\b(?=\s*(?!miles|weight|distance|lb|kg)))/gi;
    const milesRegex =
        /(total miles|miles|distance)/gi;
    
   const nameRegex = /(?<=(?:PICKUP|DELIVERY):\s+)[^\n\r]+/gi;
    const addressRegex = /\d+\s+[A-Z\d\s,.]+?\s+[A-Z]{2}\s+\d{5}/gi;
    
    return extractDataFromText(text,shipRegex,dateTimeRegex,nameRegex,addressRegex, deliveryRegex,loadingRegex,totalRegex,milesRegex,[25,25,40,40,150,150]);
    
}