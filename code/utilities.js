"use strict";
// import {EM_SPACE} from './common.js';
// import {sName} from './model.js';

/**
 * Immutable reference to a verse
 */
class VerseRef {
    /**
     * All properties are numbers
     * 
     * @param {number} index 
     * @param {number} chap 
     * @param {number} verse 
     * @param {number} page 
     */
    constructor(index, chap, verse, page) {
        this.index = index
        if (!chap) [chap, verse] = toCV(index)
        this.chap = chap
        this.verse = verse
        this.page = page || pageOf(chap, verse)
    }
    get cv() {
        return this.chap+':'+this.verse
    }
    toString() {
        return 'S.'+this.page+' '+sName[this.chap]+EM_SPACE+this.cv
    }
    /**
     * factory method to make VerseRef
     * 
     * @param {number} chap 
     * @param {number} verse 
     */
    static fromNumbers(chap, verse) {
        return new VerseRef(indexOf(chap, verse), chap, verse)
    }
    /**
     * factory method to make VerseRef
     * 
     * @param {string} cv 
     */
    static fromChapVerse(cv) {
        let [chap, verse] = cv.split(':')
        if (isNaN(verse)) return null
        return VerseRef.fromNumbers(Number(chap), Number(verse))
    }
}

/**
 * Collection of VerseRef's -- implemented in an Array
 */
class RefSet {
    /**
     * name of collection and list of verses in it
     * 
     * @param {string} name 
     * @param {VerseRef[]} list 
     */
    constructor(name, list) {
        this.name = name
        this.list = list
    }
    /**
     * 
     * @param {VerseRef} v 
     * @returns true if list contains a verse equals to v
     */
    contains(v) {
        for (let x of this.list)
            if (x.index == v.index) return true
        return false
    }
    /**
     * Add all verses to this.list
     * 
     * @param {RefSet} refSet 
     */
    addAll(refSet) { //modifies list
        for (let v of refSet.list)
            if (!this.contains(v)) this.list.push(v)
    }
    toEncoded() {
        return this.list.map(v => encode36(v.index)).join('')
    }
    toString() {
        return this.name+'='+this.cvList
    }
    get cvList() {
        return this.list.map(v => v.cv).join(' ')
    }
    /**
     * factory method to make RefSet
     * 
     * @param {string} cv  name = cv's
     */
    static fromString(str) {
        let [name, rest] = str.split('=')
        let list = rest.split(' ')
            .map(cv => VerseRef.fromChapVerse(cv))
        return new RefSet(name, list)
    }
    /**
     * factory method to make RefSet
     * 
     * @param {string} name
     * @param {string} enc encoded string
     */
    static fromEncoded(name, enc) {
        return RefSet.fromIndexes(name, decodeIndexes(enc))
    }
    /**
     * factory method to make RefSet
     * 
     * @param {string} name
     * @param {number[]} indA Array  of indexes 
     */
    static fromIndexes(name, indA) {
        let list = indA.map(i => new VerseRef(i))
        return new RefSet(name, list)
    }
}

/** Convert n to Arabic alphabet */
function numberToArabic(n) { //n is integer
    let t = ''
    for (let c of String(n)) 
      t += String.fromCodePoint(Number(c)+1632)
    return t
}

/**
 * Encode a number to base 36.
 * started from 100 for optimisation.
 * 
 * @param {number} n The string to be encoded
 * @returns {string} encoded string.
 */
function encode36(n) {
    n += 36 * 36;
    return n.toString(36);
}

/**
 * decode 36 based string to number.
 * 
 * @param {string} s The string to be decoded
 * @returns {number} decoded number 
 */
function decode36(s) {
    return Number.parseInt(s, 36) - 36 * 36;
}

/**
 * Used to parse indexes from a string encoded by encode36 
 * and add it to index array (indA)
 * 
 * @param {string} encoded indexes.
 * @param {Array} of indexes. 
 */
function decodeIndexes(str) {
    let a = []
    for (let j = 0; j < str.length; j += 3) {
        let code = str.substring(j, j + 3);
        a.push(decode36(code));
    }
    return a
}

/**
 * Encode one line to string of base36.
 * 
 * @param {string} s The line string to be encoded.
 * @returns {string} encoded number 
 * 
 *  @example
 *     encodeLine('25:60 27:1 36:83')
 */
function encodeLine(s) {
    const sa = s.split(" ");
    let v = "";
    for (let j = 0; j < sa.length; j++) {
        const cv = sa[j].split(":");
        const i = indexOf(Number(cv[0]), Number(cv[1]));
        v += encode36(i);
    }
    return v;
}

/**
 * Decode one line to string of base36.
 * 
 * @param {string} s The line string to be decoded.
 * @returns {string} decoded cv's 
 * 
 *  @example
 *     decodeLine('38z3fs3x8') returns 3 cv's
 */
function decodeLine(s) {
    let cv = "";
    for (let j = 0; j < s.length; j += 3) {
        let t = s.substring(j, j + 3);
        let [c, v] = toCV(decode36(t));
        cv += c + ":" + v + " ";
    }
    return cv;
}
/**
* @param {string} s The line string to be decoded.
* @returns {Array} decoded VerseRef's 
* 
*  @example
*     decodeToArray('38z3fs3x8') returns 3 VerseRef's
*/
function decodeToArray(s) {
   let v = []
   for (let j = 0; j < s.length; j += 3) {
       const c = s.substring(j, j + 3)
       v.push(new VerseRef(decode36(c)))
   }
   return v
}
/**
 * Get the verses index in the Quran based on chapter and its number in it.
 * 
 * @param {number} c The chapter number.
 * @param {number} v The verses number.
 * @returns {number} The index. 
 */
function indexOf(c, v) {
    // check last holds the summed number of verses till that chapter..
    return last[c - 1] + v;
}
/**
 * Get the page number based on chapter and verses numbers.
 * used index which initialized at init();
 * 
 * @param {number} c The chapter number.
 * @param {number} v The verses number.
 * @returns {number} The Page number. 
 */
function pageOf(c, v) {
    const i = indexOf(c, v);
    let p = Math.trunc(i * nPage / nVerse);
    if (i == index[p]) return p;
    while (i < index[p]) p--;
    while (i > index[p + 1]) p++;
    return p;
}
/**
 * Get the chapter number based on the index of the verse.
 * 
 * @param {number} i index number.
 * @returns {number} chapter number.
 */
function toChapter(i) {
    if (i<1 || i>nVerse) return 0
    // loop all chapters and check if the index is in it, 
    // last holds the cumulative number of indexes till that chapter.
    for (let c = 1; c <= nChap; c++)
        if (i <= last[c]) return c;
}

/**
 * Get array of chapter,verses number based on the index itself.
 * uses: toChapter method and last array (contains the number of last summed verses)
 * @param {number} index
 * @returns {Array} [c,v]]
 * 
 */
function toCV(i) {
    const c = toChapter(i);
    return [c, i - last[c - 1]];
}
/**
 * Convert cv such as '21:30' to the index 
 * @param {string} cv
 * @returns {number} index
 */
function cvToIndex(cv) {
    let [c, v] = cv.split(':')
    return indexOf(Number(c), Number(v))
}
/**
 * Array holds the cumulative number of verses based on chapter location.
 */
const last = [0, 7, 293, 493, 669, 789, 954, 1160, 1235, 1364,
    1473, 1596, 1707, 1750, 1802, 1901, 2029, 2140, 2250, 2348, 2483,
    2595, 2673, 2791, 2855, 2932, 3159, 3252, 3340, 3409, 3469, 3503,
    3533, 3606, 3660, 3705, 3788, 3970, 4058, 4133, 4218, 4272, 4325,
    4414, 4473, 4510, 4545, 4583, 4612, 4630, 4675, 4735, 4784, 4846,
    4901, 4979, 5075, 5104, 5126, 5150, 5163, 5177, 5188, 5199, 5217,
    5229, 5241, 5271, 5323, 5375, 5419, 5447, 5475, 5495, 5551, 5591,
    5622, 5672, 5712, 5758, 5800, 5829, 5848, 5884, 5909, 5931, 5948,
    5967, 5993, 6023, 6043, 6058, 6079, 6090, 6098, 6106, 6125, 6130,
    6138, 6146, 6157, 6168, 6176, 6179, 6188, 6193, 6197, 6204, 6207,
    6213, 6216, 6221, 6225, 6230, 6236]

function suraFromPage(k) {
    return toChapter(index[k+1]-1)
}
function suraContainsPage(c, k) {
    if (c == M) return (k == P)
    let c1 = index[k-1]+1
    let c2 = index[k]
    return (c1<=c && c<=c2);
}
/**
 * nChap: number of chapters -- 114
 * nVerse: number of verses -- 6236
 * labels: sura name, number, and first verse of each page
 * index: verse index for each page
 * nPage: number of pages -- 604
 */
const 
    nChap = last.length - 1,
    nVerse = last[nChap],
    labels = [''], 
    index =
[0,0,12,23,31,36,44,55,64,68,76,83,90,95,100,108,112,119,126,133,
141,148,152,160,170,176,183,188,193,197,203,209,217,222,226,231,237,240,244,252,
255,259,263,266,271,276,281,288,289,293,302,308,315,322,330,338,345,354,363,370,
376,384,393,401,408,414,425,433,441,446,450,458,466,473,479,487,493,499,504,507,
512,516,519,526,530,537,544,552,558,567,572,579,584,587,594,598,606,614,620,627,
633,640,647,655,663,668,671,674,678,682,686,692,700,705,710,714,719,726,733,739,
745,751,758,764,772,777,782,789,797,807,816,824,833,841,848,857,862,870,879,883,
890,899,907,913,920,926,931,935,940,946,954,965,976,984,991,997,1005,1011,1021,1027,
1035,1041,1049,1058,1074,1084,1091,1097,1103,1109,1113,1117,1124,1132,1141,1149,1160,1168,1176,1185,
1193,1200,1205,1212,1221,1229,1235,1241,1248,1255,1261,1266,1271,1275,1282,1289,1296,1303,1307,1314,
1321,1328,1334,1341,1346,1352,1357,1364,1370,1378,1384,1389,1397,1406,1417,1425,1434,1442,1452,1461,
1470,1478,1485,1492,1501,1510,1518,1526,1535,1544,1554,1561,1570,1581,1590,1600,1610,1618,1626,1633,
1639,1648,1659,1665,1674,1682,1691,1699,1707,1712,1720,1725,1735,1741,1749,1755,1760,1768,1774,1783,
1792,1802,1817,1833,1853,1872,1892,1907,1915,1927,1935,1943,1955,1965,1973,1980,1988,1994,2003,2011,
2019,2029,2036,2046,2056,2067,2078,2087,2095,2104,2115,2125,2133,2144,2155,2160,2167,2174,2185,2193,
2201,2214,2223,2237,2250,2261,2275,2288,2301,2314,2326,2345,2360,2385,2399,2412,2424,2435,2446,2461,
2473,2483,2493,2507,2518,2527,2540,2555,2564,2573,2584,2595,2600,2610,2618,2625,2633,2641,2650,2659,
2667,2673,2690,2700,2715,2732,2747,2762,2777,2791,2801,2811,2818,2822,2827,2834,2844,2849,2852,2857,
2866,2875,2887,2898,2910,2922,2932,2951,2971,2992,3015,3043,3068,3091,3115,3138,3159,3172,3181,3194,
3203,3214,3222,3235,3247,3257,3265,3273,3280,3287,3295,3302,3311,3322,3329,3336,3346,3354,3363,3370,
3378,3385,3392,3403,3414,3424,3433,3441,3450,3459,3469,3480,3488,3497,3503,3514,3523,3533,3539,3548,
3555,3563,3568,3576,3583,3587,3595,3606,3613,3620,3628,3637,3645,3654,3663,3671,3678,3690,3698,3704,
3717,3732,3745,3759,3775,3788,3812,3839,3864,3890,3914,3941,3970,3986,3996,4012,4031,4053,4063,4068,
4079,4089,4098,4105,4114,4125,4132,4140,4149,4158,4166,4173,4182,4191,4199,4210,4218,4229,4238,4247,
4256,4264,4272,4282,4287,4294,4303,4316,4323,4335,4347,4358,4372,4385,4398,4414,4432,4453,4473,4486,
4495,4505,4515,4524,4530,4538,4545,4556,4564,4574,4583,4592,4598,4606,4611,4616,4623,4630,4645,4665,
4681,4705,4726,4749,4766,4784,4810,4828,4852,4873,4895,4917,4941,4968,4995,5029,5055,5078,5086,5093,
5099,5104,5110,5115,5125,5129,5135,5142,5150,5155,5161,5168,5177,5185,5192,5199,5208,5217,5222,5229,
5236,5241,5253,5267,5286,5313,5331,5357,5385,5414,5429,5447,5460,5475,5494,5512,5542,5570,5596,5616,
5641,5672,5702,5726,5758,5791,5820,5848,5874,5897,5920,5948,5978,6007,6030,6058,6082,6103,6125,6138,
6157,6176,6193,6207,6221,6236], 
    nPage = index.length - 2;

/**
 * make labels, one for each page.
 *  
 */
function init() {
    console.log('init', nChap + " suras -> " + nVerse);
    for (let p = 1; p <= nPage; p++) {
        let v = new VerseRef(index[p]+1)
        labels.push(v.toString())
    }
    // console.log(nPage + " pages -> " + index[nPage]);
}

 init()

 /**
 * Convert seconds to usual units
 * 
 * @param {number} t 
 */
function timeString(t) {
    let t2u = (ratio, unit) => ratio<1? '' : ratio.toPrecision(2)+' '+unit
    return t2u(t/86400, 'days')
        || t2u(t/3600, 'hours')
        || t2u(t/60, 'minutes')
        || t2u(t, 'seconds')
        || (1000*t).toFixed()+' msec'
 }
 //window.ts = timeString  for testing

// export {VerseRef, RefSet, nPage, labels, encodeLine, 
//         indexOf, pageOf, toCV, cvToIndex, timeString}