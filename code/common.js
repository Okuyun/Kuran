"use strict";

/**
 * The code version.
 */
const VERSION = "V4.1a";

/**
 * &ensp; used in Mujam and VerseRef
 * use EN space, may be renamed later
 */
const EM_SPACE = String.fromCharCode(8194) //8195

/**
 * Link to finder -- could be modified in console
 */
var FINDER = '/Rehber/finder.html'

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
  let url, name; hideMenus()
  switch (s.toUpperCase()) {
    case 'B':  //Yer işaretleri -- Bookmarks
        url = 'bookmarks.html'; name = 'finder'; break
    case 'Y': case '?':  //Yardım
        url = 'guideQ.html'; name = 'Kuran'; break
    case 'K':
        url = "http://kuranmeali.com/Sayfalar.php?sayfa="+p
        name = "Kuran"; break
    default:
        let [c, v] = toCV(index[p]+1)
        openSiteVerse(s, c, v); return
  }
  window.open(url, name)
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
        name = "Kuran"; break
    case 'A':
        url = "https://acikkuran.com/"+c+"/"+v
        name = "Kuran"; break
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
    // fetch(url).then(r => r.text()).then(callback)
    let r = await fetch(url) //response
    let t = await r.text()   //text
    callback(t)
}

/**
 * get localStorage.q.k (k is optional)
 */
function getStorage(q, k) {
    if (!localStorage) return
    let e = localStorage[q]
    if (!e) return
    try {
        let x = JSON.parse(e)
        return k? x[k] : x
    } catch (err) {
        return e
    }
}
/**
 * set localStorage.q.k to v (k is optional)
 */
function setStorage(q, k, v) {
    if (!localStorage) return
    if (v) {
        let x = getStorage(q) || {}; x[k] = v
        localStorage[q] = JSON.stringify(x)
    } else { // v is omitted, use k
        localStorage[q] = typeof(k) == 'object'?
           JSON.stringify(k) : k
    }
}
/**
 * Code related to annotation
 */
class Notes {
    constructor(key='notes') {
        this.key = key
        this.data = getStorage(key) || {}
        this.but = document.querySelector('#noteBut')
        if (!this.but) throw('#noteBut is not found')
        this.box = document.querySelector('#noteBox')
        if (!this.box) throw('#noteBox is not found')
    }
    boxValue() {
        const MAX = 200
        return this.box.value.trim().substring(0, MAX)
    }
    saveCurrent() {
        let c = this.current
        let v = this.boxValue()
        if (c && v && this.data[c] !== v) {
            this.data[c] = v
            setStorage(this.key, this.data)
        }
    }
    setFocus() {
        this.box.selectionEnd = this.box.value.length
        this.box.selectionStart = 0; this.box.focus()
    }
    showBox(show) {
        if (show) {
            this.box.hidden = false
            this.but.style.backgroundColor = '#ff7'
        } else {
            this.box.hidden = true
            this.but.style.backgroundColor = ''
        }
    }
    display(c) { //called on new page/word
        this.saveCurrent()
        this.current = String(c)
        let v = this.data[c] || ''
        this.box.value = v
        this.but.style.backgroundImage = v?
            'url(./image/edit.png)' : '' //'add.png'
        if (this.box.hidden) return
        if (v) this.setFocus()
        else this.showBox(false)
    }
    edit(show = this.box.hidden) {
    //called when this.but is clicked
        this.showBox(show)
        if (show) this.setFocus()
        else this.saveCurrent()
    }
}

// export {VERSION, EM_SPACE, setPosition, hideElement, 
//   openSitePage, openSiteVerse, fetch_text_then, Notes}