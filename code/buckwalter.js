"use strict";
// https://github.com/stts-se/buckwalter-converter
// buckwalter-converter/blob/master/arabic/js/buckwalter-converter.js
// http://corpus.quran.com/java/buckwalter.jsp

let BWC = {}

class BWChar {
    constructor(ar, bw) { this.ar = ar; this.bw = bw; }
}

class BWMaptable {

    constructor(from, to, table) {
	this.from = from;
	this.to = to;
	this.table = table;
  }
    
    name() { return this.from + "2" + this.to; }
}


BWC.defaultChar = "?";

BWC.chartable = [
    new BWChar("ا", "A"), // bare alif
    new BWChar("ب", "b"),
    new BWChar("ت", "t"),
    new BWChar("ث", "v"),
    new BWChar("ج", "j"),
    new BWChar("ح", "H"),
    new BWChar("خ", "x"),
    new BWChar("د", "d"), // dal
    new BWChar("ذ", "*"),
    new BWChar("ر", "r"),
    new BWChar("ز", "z"),
    new BWChar("س", "s"),
    new BWChar("ش", "$"),
    new BWChar("ص", "S"),
    new BWChar("ض", "D"),
    new BWChar("ط", "T"),
    new BWChar("ظ", "Z"),
    new BWChar("ع", "E"),
    new BWChar("غ", "g"),
    new BWChar("ف", "f"),
    new BWChar("ق", "q"),
    new BWChar("ك", "k"),
    new BWChar("ل", "l"),
    new BWChar("م", "m"),
    new BWChar("ن", "n"),
    new BWChar("ه", "h"),
    new BWChar("و", "w"),
    new BWChar("ي", "y"),
    new BWChar("ة", "p"), //teh marbuta

    new BWChar("\u064E", "a"), // fatha
    new BWChar("\u064f", "u"), // damma
    new BWChar("\u0650", "i"), // kasra
    new BWChar("\u064B", "F"), // fathatayn
    new BWChar("\u064C", "N"), // dammatayn
    new BWChar("\u064D", "K"), // kasratayn
    new BWChar("\u0651", "~"), // shadda
    new BWChar("\u0652", "o"), // sukun

    new BWChar("\u0621", "'"), // lone hamza
    new BWChar("\u0623", ">"), // hamza on alif
    new BWChar("\u0625", "<"), // hamza below alif
    new BWChar("\u0624", "&"), // hamza on wa
    new BWChar("\u0626", "}"), // hamza on ya

    new BWChar("\u0622", "|"), // madda on alif
    new BWChar("\u0671", "{"), // alif al-wasla
    new BWChar("\u0670", "`"), // dagger alif
    new BWChar("\u0649", "Y"), // alif maqsura

    // http://corpus.quran.com/java/buckwalter.jsp
    new BWChar("\u0653", '^'), // Maddah
    new BWChar("\u0654", '#'), // HamzaAbove
    new BWChar("\u06DC", ':'), // SmallHighSeen
    new BWChar("\u06DF", '@'), // SmallHighRoundedZero
    new BWChar("\u06E0", '"'), // SmallHighUprightRectangularZero
    new BWChar("\u06E2", '['), // SmallHighMeemIsolatedForm
    new BWChar("\u06E3", ';'), // SmallLowSeen
    new BWChar("\u06E5", ','), // SmallWaw
    new BWChar("\u06E6", '.'), // SmallYa
    new BWChar("\u06E8", '!'), // SmallHighNoon
    new BWChar("\u06EA", '-'), // EmptyCentreLowStop
    new BWChar("\u06EB", '+'), // EmptyCentreHighStop
    new BWChar("\u06EC", '%'), // RoundedHighStopWithFilledCentre
    new BWChar("\u06ED", ']'), // SmallLowMeem

    /* punctuation -- conflitcs with the above
    new BWChar("\u060C", ","),
    new BWChar("\u061B", ";"),
    new BWChar("\u061F", "?"),
    ****************************/

    // http://www.qamus.org/transliteration.htm
    new BWChar("\u067e", "P"), // peh
    new BWChar("\u0686", "J"), // tcheh
    new BWChar("\u06a4", "V"), // veh
    new BWChar("\u06af", "G"), // gaf
    new BWChar("\u0640", "_"), // tatweel
];

BWC.post_normalise_bw = function(s) {
    return s.replace(/([aiuoFKN])(~)/g, "$2$1", s);
}

BWC.post_normalise_ar = function(s) {
    let res = s.normalize('NFC');
    return res;
}

BWC.pre_normalise_ar = function(s) {
    let res = s;
    res = res.replace('\uFEAA','\u062F');   // DAL FINAL FORM => DAL
    res = res.replace("\u06BE", "\u0647")   // HEH DOACHASHMEE => HEH
    res = res.replace('\u200F', '')         // RTL MARK
    return res;
}

BWC.pre_normalise_bw = function(s) {
    return s;
}

BWC.post_normalise = function(outputName, orth) {
    if (outputName === "bw")
        return BWC.post_normalise_bw(orth);
    else
        return BWC.post_normalise_ar(orth);
}

BWC.pre_normalise = function(inputName, orth) {
    if (inputName === "bw")
        return BWC.pre_normalise_bw(orth);
    else
        return BWC.pre_normalise_ar(orth);
}

BWC.commonChars = {
    '\u00A0': "", // non-breaking space
    " ": "",
    ".": "",
    ",": "",
    "(": "",
    ")": "",
};

BWC.alwaysAcceptASCII = false;

BWC.addCommonChar = function(sym) {
    BWC.commonChars[sym] = "";
}

BWC.removeCommonChar = function(sym) {
  delete BWC.commonChars[sym];
}

BWC.isCommonChar = function(sym) {
    if (BWC.commonChars[sym] !== null && BWC.commonChars[sym] !== undefined)
	return true;
    // ALL ASCII CHARS? CHAR NUM <128; WITH THIS, REVERSE TEST WON'T WORK
    if (BWC.alwaysAcceptASCII && sym.charCodeAt(0) < 128) {
    	return true;
    }
    return false;
}

BWC.makeA2BMap = function() {
    let map = {};
    for (let i = 0; i < BWC.chartable.length; i++) {
	  let ch = BWC.chartable[i];
	  map[ch.ar] = ch.bw;
    };    
    return new BWMaptable("ar", "bw", map);
}

BWC.makeB2AMap = function() {
    let map = {};
    for (let i = 0; i < BWC.chartable.length; i++) {
	let ch = BWC.chartable[i];
	map[ch.bw] = ch.ar;
    };    
    return new BWMaptable("bw", "ar", map);
}

BWC.a2bMap = BWC.makeA2BMap();
BWC.b2aMap = BWC.makeB2AMap();

class BWResult {
    constructor(output, errors, ok) { this.output = output; this.errors = errors; this.ok = ok; }    
}

BWC.reverseTest = function(mapTo, input, result) {
    let remaptable = {};
    if (mapTo === BWC.a2bMap.to)
        remaptable = BWC.a2bMap;
    else if (mapTo === BWC.b2aMap.to)
        remaptable = BWC.b2aMap;
    else
	return "Couldn't find maptable for " + mapTo;

    let rev = BWC.convert(remaptable, result, false);
    if (rev.output !== input) {
        let err = "Reverse test failed: input " + input + " != reverse " + rev.output;
	return err;
    }
    else
	return null;
}

BWC.convert = function(maptable, input, doReverseTest) {
    //console.log("convert called with '" + input + "'");
    input = BWC.pre_normalise(maptable.from, input);
    let res = [];
    let errs = [];    
    for (let i = 0; i < input.length; i++) {
	let sym = input[i];
	let sym2 = maptable.table[sym];
	// console.log("sym", sym);
	// console.log("sym2", sym2);
	if (sym.length > 0 && (sym2 === undefined || sym2 === null)) {
	    if (BWC.isCommonChar(sym)) {
		// console.log("/" + sym + "/ is a common char");
		res.push(sym);
	    } else {
		res.push(BWC.defaultChar);
		let msg = "Invalid " + maptable.from + " input symbol '" + sym + "'";
		errs.push(msg);
	    }
	}
	else {
	    res.push(sym2);
	}
    }

    let ok = (errs.length > 0); 
    let mapped = res.join("");
    //mapped = BWC.post_normalise(maptable.to, mapped) correction by A Rajab
    
    if (errs.length == 0 && doReverseTest) {
	let err = BWC.reverseTest(maptable.from, input, mapped)
	if (err !== null) {
	    errs.push(err)
	}
    }
    let r = new BWResult(mapped, errs, ok);
    return r;
}

BWC.b2a = function(s) {
    return BWC.convert(BWC.b2aMap, s, true);
};

BWC.a2b = function(s) {
    return BWC.convert(BWC.a2bMap, s, true);
};

/**
 * Translating Arabic letters to Buckwalter.
 * 
 * uses bw.BWC object in src="buckwalter.js"
 * code from https://github.com/stts-se/buckwalter-converter
 *
 * @param {string} s  Arabic string 
 * @returns {string}  Buckwalter transliteration 
 */
function toBuckwalter(s) {
    return BWC.convert(BWC.a2bMap, s).output
}

/**
 * Translating to Arabic letters back from Buckwalter.
 * 
 * @param {string} s  Buckwalter transliteration
 * @returns {string}  Arabic string
 */
 function toArabic(s) {
    return BWC.convert(BWC.b2aMap, s).output
}

// export {toArabic, toBuckwalter}
