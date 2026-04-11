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
function extractNames(text, dateTimeRegex, keywordRegex, buffer) {
    const results = []; 
    const matches = text.matchAll(dateTimeRegex);
     
    for (const match of matches) {
        const prefix = text.slice(Math.max(0, match.index - buffer), match.index);
        keywordRegex.lastIndex = 0;
        if (keywordRegex.test(prefix)) {
            // Grab match[1] to skip the label
            const raw = match[1] ? match[1] : match[0];
            const cleanStr = raw.replace(/[\t]/g, "").replace(/\s+/g, " ").trim();
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
                .replace(/[\t]/g, "") 
                .replace(/\s+/g, " ")
                .trim();

        
        results.push(cleanStr);
        }
    }); 

    return results;
}