"use strict";

// import {pageOf, timeString} from './utilities.js';
// import {VERSION, setPosition, hideElement, fetch_text_then, 
//         openSitePage, openSiteVerse} from './common.js
// import {toArabic, toBuckwalter} from "./buckwalter.js"
// import {readTabularData, submitData} from "./submitForm.js"

const M = 114; //suras
const P = 604; //pages
const SOURCE = ['', 'ar.jalalayn.txt', 'ar.muyassar.txt', 
 'tr.diyanet.txt',  'en.ahmedali.txt', 'tr.yazir.txt', 'en.yusufali.txt']
let TRANS //= localStorage.translation  disable during dev
let snum = 5  //JSON.parse(localStorage.settings).source || 5
var kur = new KuranText(TRANS || SOURCE[snum], initialPage)
const qur = new QuranText('quran-uthmani.txt', initialPage)
const MD  = new MujamData('data/words.txt')
const SD  = new SimData('data/simi.txt')
const swipe = { t:0, x:0, y:0 }
var curSura, curPage, bookmarks, lastSelection;
var initialized = false
window.mujam = undefined

const DEFAULT = {page:1, marks:[71,573,378]}
const MAX_MARKS = 12  // if more marks, delete the oldest

function getStorage() {
    if (!localStorage.iqra) return DEFAULT
    return JSON.parse(localStorage.iqra)
}
function arrayToSet(m) {
    if (!m) return
    console.log('Bookmarks set to '+m.join(' '))  
    bookmarks = new Set()
    for (let k of m) 
        bookmarks.add(Number(k))
}
function setBookmarks(text, data) { //not used -- initReader()
    if (!text || !data.length) return
    console.log(data)
    let b = data.reverse()  //b is the latest entry in data
      .find(x => x.user == localStorage.userName)
    if (!b) return
    arrayToSet(b.marks.split(' '))
    setStorage(false)
}
function setStorage(synch) {
    let page  = curPage
    let marks = [...bookmarks]
    let pref = {page, marks}
    localStorage.iqra = JSON.stringify(pref)
    let topic = navigator.platform  //PAGES
    if (synch && localStorage.userName) {
        submitData(localStorage.userName, topic, marks.join(' '))
        console.log(marks.length+" bookmarks sumbitted")
    }
}
function forceSelection() {
    //trim for Windows -- thank you Rajab
    let s = window.getSelection() // fixed for Safari
    s = s.toString().trim() || lastSelection
    if (s) return s
    else alert("Önce Arapça bir kelime seçin")
}
function markWord(w, root) {
    for (let x of html.querySelectorAll('span')) {
      let b = toBuckwalter(x.innerText.trim())
      if (root) b = MD.wordToRoot(b)
      if (b == w) x.classList.add('mavi')
    }
}
function markVerse(cv) {
  function mark(elt) {
    //apply 'sari' style to x within elt
    let x = elt.querySelector(cls)
    if (x) x.classList.add('sari')
    else console.log(cls+' not in '+elt.id)
  }
    // markPattern('[^﴾﴿]*﴿'+numberToArabic(n)+'﴾?', 'cls)
    // let e = new RegExp(n+'[\.-](.)+\n', 'g')
    let cls = '.c'+cv.replace(':', '_')
    mark(html); mark(text)
}
function displayWord(evt) {
    evt.preventDefault(); //hideMenus()
    let t = evt.target 
    t.classList.add('gri')  //mark target
    if (!t.tText ) return
    if (t.id) { // t is a verse separator
      bilgi.style.font = '14px sans'
    } else { // t is a word
      bilgi.style.font = ''
    }
    bilgi.innerText = t.tText 
    let y = t.offsetTop + t.offsetHeight
    setPosition(bilgi, t.offsetLeft+24, y-6, 105)
}
function selectWord(evt) {
    evt.preventDefault(); hideMenus()
    let t = evt.target
    if (t.id) { // t is a verse separator
      let y = Math.max(evt.clientY-150, 0)
      menuV.cv = t.id
      setPosition(menuV, evt.clientX, y)
    } else { // t is a word
      let s = window.getSelection()
      lastSelection = s.toString().trim()
      if (!lastSelection) { //select word
        let range = document.createRange();
        range.selectNodeContents(evt.target);
        s.removeAllRanges(); s.addRange(range);
      }
      setPosition(menuC, evt.clientX, evt.clientY-60, 220)
    }
}
function hideWord(evt) {
    // evt.target.style.backgroundColor = ''
    evt.target.classList.remove('gri') 
}
function adjustPage(adj) {
    infoS.style.display = adj? 'block' : ''
    gotoPage(slider.value, adj? 'slider' : '')
    if (adj) {
      let s = sureS.value+' -- Sayfa '+slider.value
      infoS.innerText = s
    }
}
function doClick() {
    let t = bilgi.innerText
    if (bilgi.style.font) { // verse separator
      console.log(location.hash+' to '+t)
      location.hash = '#v='+t.split(' ')[0]
    } else { // a word
      openMujam(toBuckwalter(t))
    }
} 
function gotoPage(k, adjusting) { // 1<=k<=P
//This is the only place where hash is set
  function doVerse(e) {
      for (let x of e.children) {
        x.onclick = displayWord
        x.onmouseleave = hideWord
        x.oncontextmenu = selectWord
        if (x.id) { // x is a verse separator
          // let i = cvToIndex(x.id.substring(2))
          x.tText = SD.similarTo(idx)
          if (x.tText) x.classList.add('kahve')
        } else { // x is a word
          let w = x.innerText.trim()
          let r = MD.wordToRoot(toBuckwalter(w))
          if (r) x.tText = toArabic(r)   
        }
      }
  }
    if (!k || k < 1) k = 1;
    if (k > P) k = P;
    k = Number(k);
    sayfa.innerText = k;
    if (curPage == k) return;
    setSura(suraFromPage(k));
    if (adjusting == 'slider') return;
    curPage = k; slider.value = k;
    text.innerHTML = kur.pageToHTML(k)
    html.innerHTML = qur.pageToHTML(k)
    starB.classList.toggle('checked', bookmarks.has(k))
    let wc = html.childElementCount
    let idx = index[curPage]  //better than cvToIndex
    console.log('Page '+k, wc+' verses', idx)
    for (let e of html.children) {
        if (e.tagName != 'SPAN') continue
        idx++; doVerse(e)
    }
    if (adjusting != 'hashInProgress') //cv are not set
      location.hash = '#p='+curPage
    setStorage(false)
    hideMenus();  //html.scrollTo(0)
}
function setSura(c) { // 1<=c<=M
    // c = Number(c);
    if (curSura == c) return;
    curSura = c;
    sureS.selectedIndex = c-1
}
function gotoSura(c) {
    if (!c || c < 1)  c = 1;
    if (c > M) c = M;
    setSura(c);
    gotoPage(pageOf(c, 1));
}
function dragStart(evt) {
    if (menuK.style.display || menuC.style.display 
     || menuS.style.display || bilgi.style.display)  {
        hideMenus(); evt.preventDefault(); return
    }
    if (swipe.t>0) return
    swipe.t = Date.now()
    swipe.x = Math.round(evt.touches[0].clientX)
    swipe.y = Math.round(evt.touches[0].clientY)
    //console.log("dragStart", swipe)
}
function drag(evt) {
    if (swipe.t==0) return
    let trg = evt.target
    while (trg && trg.tagName != 'DIV')
        trg = trg.parentElement
    let dx = Math.round(evt.touches[0].clientX) - swipe.x
    let dy = Math.round(evt.touches[0].clientY) - swipe.y
    if (Math.abs(dx) < 3*Math.abs(dy)) { //not horizontal
        // console.log("cancel", dx, dy)
        trg.style.transform = ""; swipe.t = 0; 
        return  //swipe cancelled
    }
    evt.preventDefault(); 
    let tr = "translate("+dx+"px, 0)"
    trg.style.transform = tr;
}
function dragEnd(evt) {
    if (swipe.t==0) return
    let trg = evt.target
    while (trg && trg.tagName != 'DIV')
        trg = trg.parentElement
    let dt = Date.now() - swipe.t
    let xx = evt.changedTouches[0].clientX
    let dx = Math.round(xx) - swipe.x
    let tr1 = trg.style.transform //initial
    console.log("dragEnd", tr1, trg.tagName)
    trg.style.transform = ""; swipe.t = 0
    let w2 = 0  //animation width
    let W = trg.clientWidth
    console.log(dt, dx, W)
    const K = 60  //too little movement
    if (-K<=dx && dx<=K) return
    evt.preventDefault()
    //max 300 msec delay or min W/3 drag
    if (dt>300 && 3*Math.abs(dx)<W) return
    if (dx>K  && curPage<P) { //swipe right
        gotoPage(curPage+1); w2 = W+"px"
    } 
    if (dx<-K && curPage>1) { //swipe left
        gotoPage(curPage-1); w2 = -W+"px"
    }
    if (!w2) return //page not modified
    if (!tr1) tr1 = "translate(0,0)"
    let tr2 = "translate("+w2+",0)" //final position
    console.log("animate", tr2)
    trg.animate({transform:[tr1, tr2]}, 300)
}
function gotoHashPage() {
//re-designed by Abdurrahman Rajab
//all text is in Buckwalter
  let h = decodedHash()
  if (!h) return false
  if (!h.startsWith('p=') && !h.startsWith('v=')) 
    return false
  for (let e of h.split('&')) {
    let s = e.substring(2)
    switch (e.charAt(0)) {
      case 'p': // p=245
        gotoPage(s)
        document.title = nameFromPage(s)
        break
      case 'r': // r=Sbr
        let L = MD.rootToList(s)
        if (L) markWord(s, true)
        break
      case 'w': // w=yuwsuf
      case 'b': // w and b behave the same
        for (let t of s.split(' '))
          markWord(t, false)
        break
      case 'v': // v=12:90
        let [c, v] = s.split(':') 
        c = Number(c); v = Number(v)
        gotoPage(pageOf(c, v), 'hashInProgress')
        document.title = sName[c]+' '+s
        markVerse(s); break
      default: 
        console.log("wrong hash" + e)
        return false
    }
  }
  return true
}
function initialPage() {
    initialized = kur.loaded && qur.loaded
    if (initialized && !gotoHashPage()) {
      console.log("initialPage")
      gotoPage(getStorage().page || 1)
    }
}
function initReader() {
    title.innerHTML = 'Iqra '+VERSION+'&emsp;';
    version.innerText = 'Iqra '+VERSION;
    text.addEventListener("touchstart", dragStart);
    html.addEventListener("touchstart", dragStart);
    text.addEventListener("touchmove", drag);
    html.addEventListener("touchmove", drag);
    text.addEventListener("touchend", dragEnd);
    html.addEventListener("touchend", dragEnd);
    sureS.onchange = () => {gotoSura(sureS.selectedIndex+1)}
    pgNum.onkeydown= keyToPage
    pageS.onclick  = handleStars
    trans.onclick  = toggleTrans
    starB.onclick  = toggleStar
    linkB.onclick  = toggleMenuK
    zoomB.onclick  = toggleZoom
    bilgi.onclick  = doClick
    leftB.onclick  = () => {gotoPage(curPage-1)}
    slider.oninput = () => {adjustPage(true)}
    slider.onchange= () => {adjustPage(false)} //committed
    rightB.onclick = () => {gotoPage(curPage+1)}
    let labels = []
    for (let i=1; i<=M; i++)
      labels.push(i+'. '+sName[i])
    sureS.innerHTML = '<option>'+labels.join('<option>')
    menuFn(); 
      menuFn(); 
    menuFn(); 
    var prevTime
    document.onvisibilitychange = () => {
      if (document.hidden) {
        prevTime = Date.now()/1000
      } else if (!prevTime) { //initial call
        console.log('Start', new Date())
      } else {
        let dt = Date.now()/1000 - prevTime
        if (dt > 1000) console.log("invisible "+timeString(dt))
        // if (dt > 9999 && localStorage.userName) //more than 3 hours
        //     readTabularData(setBookmarks, console.error)
      }
    }
  
    // window.onresize = resize
    window.onhashchange = gotoHashPage
    window.name = "iqra" //by A Rajab
    let {marks} = getStorage()
    //we cannot use page yet, files are not read -- see initialPage()
    arrayToSet(marks) //immediate action
    // if (localStorage.userName) //takes time to load
    //     readTabularData(setBookmarks, console.error)
}
/********************
 * Start of Menu functions -- added by Abdurrahman Rajab - FSMVU
 * Ref: https://dev.to/iamafro/how-to-create-a-custom-context-menu--5d7p
 *
 * Menu elements: menuC (context)  menuK (button)  menuV (verse)
 *
 */
var LINKF = FINDER+'#w=', LINKM = 'mujam.html#r='
function openMujam(...a) { //array of roots in Buckwalter
    let p = a.join('&r=')
    window.mujam = window.open(LINKM + p, "finder")
    for (let r of a) markWord(r, true); 
    console.log('mucem: r='+p)
}
function menuFn() {
  function menuItem(m) {
      let s = forceSelection() //s is not empty
      switch (m) {
          case 'K':
              navigator.clipboard.writeText(s)
              .then(() => { console.log('Panoya:', s) })
              .catch(e => { alert('Panoya yazamadım\n'+e) })
              break
          case 'F':
              window.open(LINKF + s, "finder")
              break
          case 'M':
              let a = []
              for (let w of s.split(' ')) {
                let r = MD.wordToRoot(toBuckwalter(w))
                if (r) a.push(r)
              }
              if (a.length > 0) openMujam(...a)
              else alert('Mucemde bulunamadı')
              break
          case 'B':
              alert('Similar pages -- not implemented yet')
          default:  return
      }
      hideMenus()
  }
  menuC.onclick = (evt) => { //context menu
      evt.preventDefault()
      menuItem(evt.target.innerText[0])
  }
  menuS.onclick = (evt) => { //page menu
      evt.preventDefault()
      let t = evt.target.innerText
      //console.log(curPage, t)
      let [x, k] = t.split(/s| /)
      if (Number(k)) gotoPage(Number(k))
  }
  menuK.onclick = (evt) => { //menu button
      evt.preventDefault()
      openSitePage(evt.target.innerText[0], curPage)
  }
  function openSite(s) {
      if (!menuV.cv) return
      let [c, v] = menuV.cv.substring(2).split(':')
      openSiteVerse(s, c, v)
  }
  menuV.onclick = (evt) => { //external source menu
      evt.preventDefault()
      openSite(evt.target.innerText[0])
  }
  document.onkeydown = (evt) => {
      let k = evt.key.toUpperCase()
      if (evt.key == 'Escape') 
          hideMenus()
      else if (evt.key == 'F1') 
          openSitePage('Y') //Yardım
      else if (menuC.style.display)
          menuItem(k)
      else if (menuK.style.display)
          openSitePage(k, curPage)
      else if (menuV.style.display)
          openSite(k)
      else switch (k) {
          case 'ARROWLEFT':
            if (!evt.altKey && !evt.ctrlKey && !evt.metaKey)
              {gotoPage(curPage-1); evt.preventDefault()}
            break
          case 'ARROWRIGHT':
            if (!evt.altKey && !evt.ctrlKey && !evt.metaKey)
              {gotoPage(curPage+1); evt.preventDefault()}
            break
          case 'T':
            toggleTrans(); break
          case '*':
            toggleStar(); break
          case 'M': case '.':
            // evt.clientX = linkB.offsetLeft
            // evt.clientY = linkB.offsetTop +10
            toggleMenuK(); break
          case 'Z': case '+':
            toggleZoom(evt);  break
          default: return
      }
  }
  window.hideMenus = () => { 
      hideElement(menuC); hideElement(menuK); 
      hideElement(menuS); hideElement(bilgi)
      hideElement(menuV); linkB.classList.remove('checked')
  }
  div1.onmouseenter = hideMenus
  div3.onmouseenter = hideMenus
  text.onmouseenter = hideMenus
}
/**
* End of menu functions 
***********************************************/
function keyToPage(evt) {
    if (evt.key == 'Escape') {
      hideElement(menuS)
    } else if (evt.key == 'Enter') {
      gotoPage(pgNum.value)
      hideElement(menuS)
    }
}
function toggleTrans() {
    if (trans.classList.toggle('checked')) {
      html.classList.add('hiddenNarrow')
      text.classList.remove('hiddenNarrow')
    } else { //hide text if narrow screen
      html.classList.remove('hiddenNarrow')
      text.classList.add('hiddenNarrow')
    }
}
function makeStarMenu() {
    const span = '<span class="menuK">'
    let t = ''
    let a = [...bookmarks].reverse()
    for (let k of a) if (k != curPage)
        t += span+nameFromPage(k)+'</span>\n'
    starred.innerHTML = t
}
function handleStars() {
    if (menuS.style.display) {
      hideElement(menuS)
    } else {
      hideMenus(); makeStarMenu()
      let x = pageS.offsetLeft+35, y = pageS.offsetTop+30
      setPosition(menuS, x, y, 110)
      pgNum.value = curPage
      pgNum.select(0,3); pgNum.focus()
    }
}
function toggleStar() {
    if (starB.classList.toggle('checked')) {
      bookmarks.add(curPage)
      let a = [...bookmarks]
      if (a.length > MAX_MARKS)
      bookmarks.delete(a[0]) //the oldest entry
    } else {
      bookmarks.delete(curPage)
    }
    setStorage(true) //may need to synch
}
function toggleMenuK() {
    if (linkB.classList.toggle('checked')) {
      let x = linkB.offsetLeft+10, y = linkB.offsetTop+33
      setPosition(menuK, x, y, 120)
    } else {
      hideElement(menuK)
    }
}
function toggleZoom(evt) {
    evt.stopPropagation()
    let e = document.body
    if (zoomB.classList.toggle('checked')) {
      e.style.transform ='scale(1.16) translate(0, 8%)'
      // if (document.fullscreenEnabled) 
      //     e.requestFullscreen()  black background!!
    } else {
      e.style.transform = ''
      // if (document.fullscreenElement) 
      //     document.exitFullscreen()
    }
    hideMenus()
}

initReader()
