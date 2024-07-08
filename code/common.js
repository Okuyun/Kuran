"use strict";

/**
 * The code version.
 */
const VERSION = "V4.8c";

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
 *  set title of the iframe and its parent 
 */
function setTitle(t) {
    t = '[Iqra] '+t
    document.title = t
    if (parent === window) return
    parent.document.title = t
}
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
    // let d = elt.closest('details')
    // if (d) d.open = false
    elt.style.display = '' 
}

/**
 * Open remote site -- goto page p
 * 
 * @param {string} s site -- uppercase char
 * @param {number} p page
 */
function openSitePage(s, p) {
    let url; hideMenus()
    let name = "Kuran"; 
    switch (s.toUpperCase()) {
    // case 'B':  //Yer işaretleri -- Bookmarks
    //     url = 'bookmarks.html'; name = 'finder'; break
    case 'Y': case '?':  //Yardım
        url = 'guideQ.html'; break
    case 'K':
        url = "https://kuranmeali.com/Sayfalar.php?sayfa="+p
        break
    case 'P':
        url = "https://okuyun.github.io/Kuran/#p="
        doShare(p+'. sayfa', url+p)
        return
    default:
        let [c, v] = toCV(index[p]+1)
        openSiteVerse(s, c, v); return
  }
  window.open(url, name)
}

function doShare(text, url) {
    if (!navigator.share) return
    let title = "Kuran-ı Kerim"
    navigator.share({title, text, url})
}

/**
 * Open remote site -- goto (c, v)
 * 
 * @param {string} s site -- uppercase char
 * @param {number} c chapter
 * @param {number} v verse
 */
function openSiteVerse(s, c, v) {
  let url; hideMenus()
  let name = "Kuran"; 
  switch (s.toUpperCase()) {
    case 'K':
        url = "https://kuranmeali.com/AyetKarsilastirma.php?sure="+c+"&ayet="+v
        break
    case 'C':
        url = "http://corpus.quran.com/wordbyword.jsp?chapter="+c+"&verse="+v
        break
    case 'D':
        url = "https://kuran.diyanet.gov.tr/mushaf/kuran-1/"
                +sName[c]+"-suresi-"+c+"/ayet-"+v+"/kuran-yolu-meali-5"
        break
    case 'T':
        url = "https://tanzil.net/#"+c+':'+v
        break
    case 'Q':
        url = "https://previous.quran.com/"+c+'/'+v
        break
    case 'A':
        url = "https://acikkuran.com/"+c+'/'+v
        break
    case 'P':
        url = "https://okuyun.github.io/Kuran/#v="
        doShare(sName[c]+' Suresi '+v+'. ayet', url+c+':'+v)
        return
    default:  return
  }
  console.log(s, url)
  window.open(url, name)
}

/**
 * Read text file from link, then invoke callback
 * 
 * @param {string} url 
 * @param {function} callback 
 */
async function fetch_text_then(url, callback) {
    // fetch(url).then(r => r.text()).then(callback)
    try {
        let r = await fetch(url) //response
        if (!r.ok) throw r.statusText
        let t = await r.text()   //text
        callback(t); return 'OK'
    } catch (err) {
        console.error('error', err)
        return err
    }
}

/**
 * get localStorage.q.k (k is optional)
 */
function getStorage(q='iqra', k) {
    if (!localStorage) return
    let e = localStorage[q]
    if (!e) return undefined
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
    if (v === undefined) { //v is omitted, use k
        localStorage[q] = typeof(k) == 'object'?
           JSON.stringify(k) : k
    } else {
        let x = getStorage(q) || {}; x[k] = v
        localStorage[q] = JSON.stringify(x)
    }
}
/**
 * Code related to annotation
 */
class Notes {
    constructor(key='notes') {
        this.key = key
        this.but = document.querySelector('#noteBut')
        if (!this.but) throw('#noteBut is not found')
        this.box = document.querySelector('#noteBox')
        if (!this.box) throw('#noteBox is not found')
        this.box.onkeydown = (evt) => {
            evt.stopPropagation()
            if (evt.key == 'Escape') //just close
                this.showBox(false)
            if (evt.key == 'Enter') //save & close
                this.edit(false)
        }
    }
    data(c) {
        return getStorage(this.key, c) || ''
    }
    boxValue() {
        const MAX = 200
        return this.box.value.trim().substring(0, MAX)
    }
    saveCurrent() {
        let c = this.current
        let v = this.boxValue()
        let d = this.data(c)
        if (c && d!==v) 
            setStorage(this.key, c, v)
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
        let v = this.data(c)
        this.box.value = v
        this.but.style.backgroundImage = v?
            'url(./image/edit.png)' : '' //'add.png'
        if (this.box.hidden) return
        if (v) setFocus(this.box)
        else this.showBox(false)
    }
    edit(show = this.box.hidden) {
    //called when this.but is clicked
        this.showBox(show)
        if (show) setFocus(this.box)
        else this.saveCurrent()
    }
}
function setFocus(elt) {
    if (!elt || elt.value == undefined) return
    elt.focus(); elt.select()
}

/**
 * Code related to Touch events
 * 
 * input: 
 * action contains three functions called on related events
 * swipe = new TouchHandler({dragStart, drag, dragEnd})
 * 
 * output: 
 * clock angle [0-12]  0, 3, 6, 9, 12 main directions
 */
class TouchHandler {
    constructor(action, elt = document.scrollingElement) {
        this.action = action
        elt.ontouchstart = (e) => this.start(e)
        elt.ontouchmove = (e) => this.move(e)
        elt.ontouchend = (e) => this.stop(e)
    }
    start(evt) {
        if (this.t || !this.action.dragStart) return
        if (!this.action.dragStart(evt)) return
        this.t = Date.now()
        this.x = Math.round(evt.touches[0].clientX)
        this.y = Math.round(evt.touches[0].clientY)
        let doc = window.findFrm?  //running at top level
          findFrm.contentDocument : document
        let se = doc.scrollingElement
        this.atTop = (se.scrollTop < 1)
        this.atBot = 
          (se.scrollHeight-se.clientHeight-se.scrollTop < 1) 
// console.log(window.name, evt.target.tagName, this.atTop, this.atBot)
    }
    angle(evt) {
        let ct = evt.changedTouches[0]
        let dx = Math.round(ct.clientX) - this.x
        let dy = Math.round(ct.clientY) - this.y
        let teta = Math.atan2(dy, dx)
        //convert teta to clock angle [0-12]
        let a = Math.round(6*(1 + teta/Math.PI))
        return { a, dx, dy }
    }
    move(evt) {
        if (!this.t || !this.action.drag) return
        let { a, dx, dy } = this.angle(evt)
        if (!this.action.drag(a, evt)) return
        evt.preventDefault()
    }
    stop(evt) {
        if (!this.t || !this.action.dragEnd) return
        let dt = Date.now() - this.t
        this.t = undefined
        if (dt > 400) return  //not swipe
        let { a, dx, dy } = this.angle(evt)
        // console.log(window.name, dt, a, this.action.dragEnd.name)
        if (a==3 && !this.atBot) return
        if (a==9 && !this.atTop) return
        const K = 60  //too little movement
        if (dx*dx + dy*dy < K*K) return  //not swipe
        if (!this.action.dragEnd(a, evt)) return
        evt.preventDefault()
    }
}

// export {VERSION, EM_SPACE, setPosition, hideElement, Notes, 
//   openSitePage, openSiteVerse, fetch_text_then, TouchHandler}