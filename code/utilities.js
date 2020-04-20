"use strict";
// import {EM_SPACE} from './common.js';
// import {sName} from './utilities.js';

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
    6213, 6216, 6221, 6225, 6230, 6236
];

/**
 * n stands for number.
 */
const nChap = last.length - 1,
    nVerse = last[nChap];
/**
 * index: verse index for each page
 * nPage: number of pages
 * labels: show the sura name, number, and first verse of this page.
 */
var index, nPage  //global
const labels = ['']
/**
 * initialize the utilities and set the attributes.
 *  
 * 
 */
function init() {
    console.log(nChap + " suras -> " + nVerse);
    // count of verses in a page.
    const count = [0, 12, 11, 8, 5, 8, 11, 9, 4, 8, 7, 7, 5, 5, 8, 4, 7, 7, 7, 8, 7, 4, 8, 10, 6, //7,5
        7, 5, 5, 4, 6, 6, 8, 5, 4, 5, 6, 3, 4, 8, 3, 4, 4, 3, 5, 5, 5, 7, 1, 4, 9, 6, 7, 7, 8, 8, 7, 9, 9,
        7, 6, 8, 9, 8, 7, 6, 11, 8, 8, 5, 4, 8, 8, 7, 6, 8, 6, 6, 5, 3, 5, 4, 3, 7, 4, 7, 7, 8, 6, 9, 5,
        7, 5, 3, 7, 4, 8, 8, 6, 7, 6, 7, 7, 8, 8, 5, 3, 3, 4, 4, 4, 6, 8, 5, 5, 4, 5, 7, 7, 6, 6, 6, 7, 6,
        8, 5, 5, 7, 8, 10, 9, 8, 9, 8, 7, 9, 5, 8, 9, 4, 7, 9, 8, 6, 7, 6, 5, 4, 5, 6, 8, 11, 11, 8, 7,
        6, 8, 6, 10, 6, 8, 6, 8, 9, 15, 11, 7, 6, 6, 6, 4, 4, 7, 8, 9, 8, 11, 8, 8, 9, 8, 7, 5, 7, 9, 8,
        6, 6, 7, 7, 6, 5, 5, 4, 7, 7, 7, 7, 4, 7, 7, 7, 6, 7, 5, 6, 5, 7, 6, 8, 6, 5, 8, 9, 11, 8, 9, 8,
        10, 9, 9, 8, 7, 7, 9, 9, 8, 8, 9, 9, 10, 7, 9, 11, 9, 10, 10, 8, 8, 7, 6, 9, 11, 6, 9, 8, 9, 8,
        8, 5, 8, 5, 10, 6, 8, 6, 5, 8, 5, 10, 9, 10, 15, 16, 20, 19, 19, 16, 8, 12, 8, 8, 11, 11, 8,
        7, 8, 6, 9, 8, 8, 10, 7, 10, 10, 11, 11, 9, 8, 9, 11, 10, 8, 11, 11, 5, 7, 7, 11, 8, 8, 13, 9,
        14, 13, 11, 14, 13, 13, 13, 12, 19, 15, 25, 14, 13, 12, 11, 11, 15, 12, 10, 10, 14,
        11, 9, 12, 16, 9, 9, 11, 11, 5, 10, 8, 7, 8, 8, 9, 9, 8, 6, 17, 10, 15, 19, 13, 15, 15,
        14, 10, 10, 7, 4, 5, 7, 10, 5, 3, 5, 9, 9, 12, 11, 12, 12, 10, 19, 20, 21, 23, 28, 25,
        23, 24, 21, 23, 13, 8, 14, 9, 11, 8, 13, 12, 9, 9, 8, 7, 7, 8, 7, 9, 11, 7, 7, 10, 8, 9, 7,
        8, 7, 7, 11, 11, 10, 9, 8, 9, 9, 10, 11, 8, 9, 6, 11, 9, 10, 6, 9, 7, 8, 5, 8, 7, 4, 8, 11, 6,
        8, 8, 9, 8, 9, 9, 8, 7, 12, 8, 6, 13, 15, 13, 14, 16, 13, 24, 26, 26, 26, 24, 27, 29, 16,
        10, 16, 19, 22, 10, 5, 11, 10, 9, 7, 9, 11, 7, 8, 9, 9, 8, 7, 9, 9, 8, 11, 8, 11, 9, 9, 9, 8,
        8, 10, 5, 7, 9, 13, 7, 12, 12, 10, 15, 13, 13, 16, 18, 20, 21, 13, 9, 10, 10, 9, 6, 8, 7,
        11, 8, 10, 9, 9, 6, 8, 5, 5, 7, 7, 15, 20, 16, 24, 21, 23, 17, 18, 26, 18, 24, 21, 22, 22,
        24, 27, 27, 34, 26, 23, 8, 7, 6, 5, 6, 5, 10, 4, 6, 7, 8, 5, 6, 7, 9, 8, 7, 7, 9, 9, 5, 7, 7,
        5, 12, 14, 19, 26, 19, 26, 28, 29, 16, 17, 13, 15, 19, 18, 30, 28, 26, 20, 25, 31,
        //juzz 30
        //30,24,32,42,29,19,36,25,22,36,26,30,20,36,19,27,13,19,19,17,14,14,15]; 
        30, 24, 32, 33, 29, 28, 26, 23, 23, 28, 30, 29, 23, 28, 24, 21, 22, 13, 19, 19, 17, 14, 14, 15
    ];

    // number of pages.
    nPage = count.length;
    index = [0, 0]  //new Array(nPage + 1);
    index.length = nPage + 1;
    for (let p = 1; p <= nPage; p++) {
        index[p + 1] = index[p] + count[p]
        let v = new VerseRef(index[p]+1)
        labels.push(v.toString())
    }
    console.log(nPage + " pages -> " + index[nPage]);
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

// export {VerseRef, RefSet, nPage, labels, encodeLine, indexOf, pageOf, toCV, timeString}