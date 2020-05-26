"use strict";

/**
 * The code version.
 */
const VERSION = "V4.0B";

/**
 * &emsp; used in both Mujam
 * used at report2 @see report2
 */
const EM_SPACE = String.fromCharCode(8195)

/**
 * Link to finder -- could be modified in console
 */
var FINDER = 'https://maeyler.github.io/BahisQurani/finder.html'

/**
 * Use the hash part of URL in the address bar
 *
 * @returns null (no hash) or decoded hash (strip '#')
 * 
 */
function decodedHash() {
    let h = location.hash
    if (h.length < 2) return null
    //replace special chars: call decodeURI() by A Rajab
    return decodeURI(h.substring(1))  // '#'
  }
  
/**
 * Menu functions -- place menu over elt
 * 
 * @param {Element} elt 
 * @param {number} x 
 * @param {number} y 
 * @param {number} mw menu width
 */
function setPosition(elt, x, y, mw=200) {
    mw = elt.clientWidth || mw
    x = x - mw/2  //center over parent
    let cw = document.body.clientWidth
    x = Math.max(x, 0)     // x ≥ 0
    x = Math.min(x, cw-mw) // x < cw-mw
    elt.style.left = (x)+'px'
    elt.style.top  = (y)+'px'
    elt.style.display = 'block'
}

/**
 * Make elt invisible
 * 
 * @param {Element} elt 
 */
function hideElement(elt) {
    elt.style.display = '' 
}

/**
 * Open remote site -- goto page p
 * 
 * @param {string} s site -- uppercase char
 * @param {number} p page
 */
function openSitePage(s, p) {
  let url, name;
  switch (s.toUpperCase()) {
    case 'Y': case '?':  //Yardım
        url = 'guideQ.html'; name = 'Kuran'; break
    case 'K':
        url = "http://kuranmeali.com/Sayfalar.php?sayfa="+p
        name = "Kuran"; break
    default:
        let [c, v] = toCV(index[p]+1)
        openSiteVerse(s, c, v); return
  }
  window.open(url, name); hideMenus()
}

/**
 * Open remote site -- goto (c, v)
 * 
 * @param {string} s site -- uppercase char
 * @param {number} c chapter
 * @param {number} v verse
 */
function openSiteVerse(s, c, v) {
  let url, name;
  switch (s.toUpperCase()) {
    case 'K':
        url = "http://kuranmeali.com/AyetKarsilastirma.php?sure="+c+"&ayet="+v
        name = "Kuran"; break
    case 'C':
        url = "http://corpus.quran.com/wordbyword.jsp?chapter="+c+"&verse="+v
        name = "Kuran"; break
    case 'Q':
        url = "https://quran.com/"+c+"/"+v
        name = "finder"; break
    case 'A':
        url = "https://acikkuran.com/"+c+"/"+v
        name = "finder"; break
    case 'R':
        alert('Reader -- not implemented yet')
    default:  return
  }
  console.log(s, url)
  window.open(url, name); hideMenus()
}

/**
 * Read text file from link, then invoke callback
 * 
 * @param {string} url 
 * @param {function} callback 
 */
async function fetch_text_then(url, callback) {
    // fetch(url).then(r => r.text()).then(report2)
    let r = await fetch(url) //response
    let t = await r.text()   //text
    callback(t)
}

// export {VERSION, EM_SPACE, setPosition, hideElement, 
//     openSitePage, openSiteVerse, fetch_text_then}