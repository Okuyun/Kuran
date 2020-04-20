"use strict";

// import {pageOf, timeString} from './utilities.js';
// import {VERSION, DATA_URL, setPosition, 
//     hideElement, openSitePage, fetch_text_then} from './common.js'
// import {toArabic, toBuckwalter} from "./buckwalter.js"
// import {readTabularData, submitData} from "./submitForm.js"

//const DATA_URL = "https://maeyler.github.io/Iqra3/data/"; in common.js
const M = 114; //suras
const names = new Array(M+1);
const first = new Array(M+1);
const P = 604; //pages
const LOCATION = 'https://maeyler.github.io/BahisQurani/data/'
const kur = new KuranText(LOCATION+'tr.yazir.txt', initialPage)
const qur = new QuranText(LOCATION+'quran-uthmani.txt', initialPage)
const LINK = "http://kuranmeali.com/Sayfalar.php?sayfa=";
const rootToList = new Map()
const wordToRoot = new Map()
const CHECKED = '#ff7' // color when the button is down
const swipe = { t:0, x:0, y:0 }
var curSura, curPage, bilgi, bookmarks;
var initialized = false
window.mujam = undefined

//const LS = location.protocol.startsWith('http') && localStorage;
const DEFAULT = {page:1, roots:true, marks:[71,573,378]}
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
function setBookmarks(text, data) { //called once in initReader()
    if (!text || !data.length) return
    console.log(data)
    let b = data.reverse()  //b is the latest entry in data
      .find(x => x.user == localStorage.userName)
    if (!b) return
    arrayToSet(b.marks.split(' '))
    setStorage(false)
}
function setStorage(synch) {
    //if (!LS) return
    let page  = curPage
    let roots = showR.style.backgroundColor? true : false
    let marks = [...bookmarks]
    let pref = {page, roots, marks}
    localStorage.iqra = JSON.stringify(pref)
    let topic = navigator.platform  //PAGES
    if (synch && localStorage.userName) {
        submitData(localStorage.userName, topic, marks.join(' '))
        console.log(marks.length+" bookmarks sumbitted")
    }
}
function forceSelection() {
    //trim for Windows -- thank you Rajab
    let s = getSelection().toString().trim()
    if (s) return s
    else alert("Önce Arapça bir kelime seçin")
}
function markWord(w, root, cls='mavi') {
    for (let x of html.querySelectorAll('span')) {
      let b = toBuckwalter(x.innerText.trim())
      if (root) b = wordToRoot.get(b)
      if (b != w) continue
      x.classList.add(cls)
    }
}
function markVerse(cv, cls='gri') {
  function mark(elt) {
    let x = elt.querySelector(id)
    if (x) x.classList.add(cls)
    else console.log(id+' not in '+elt.id)
  }
    // markPattern('[^﴾﴿]*﴿'+numberToArabic(n)+'﴾?', 'cls)
    // let e = new RegExp(n+'[\.-](.)+\n', 'g')
    let id = '#_'+cv.replace(':', '_')
    mark(html); mark(text)
}
function suraFromPage(k) {
    let i = 1;
    while (k > first[i]) i++;
    if (k < first[i]) i--;
    return i;
}
function suraContainsPage(k) {
    if (curSura == M) return (k == P);
    let i = first[curSura];
    let j = first[curSura+1];
    if (i == j) return (k == i);
    return (i<=k && k<j);
}
function displayWord(evt) {
    if (!showR.style.backgroundColor) return
    let t = evt.target
    let w = t.innerText.trim()
    let r = wordToRoot.get(toBuckwalter(w))
    if (!r) { hideElement(bilgi); return }
    // let n = rootToList.get(r).length
    bilgi.innerText = toArabic(r)  //+' => '+n
    t.style.backgroundColor = '#ddd'; t.append(bilgi)
    let y = t.offsetTop + t.offsetHeight
    setPosition(bilgi, t.offsetLeft+24, y-6, 105)
}
function selectWord(evt) {
    let s = window.getSelection()
    if (!s.toString()) { //select word
        let range = document.createRange();
        range.selectNodeContents(evt.target);
        s.removeAllRanges(); s.addRange(range);
    }
}
function hideWord(evt) {
    evt.target.style.backgroundColor = ''
    hideElement(bilgi)
}
function adjustPage(adj) {
    infoS.style.display = adj? 'block' : ''
    gotoPage(slider.value, adj? 'slider' : '')
    if (adj) {
      let s = sureS.value+' -- Sayfa '+slider.value
      infoS.innerText = s
    }
}
function gotoPage(k, adjusting) { // 1<=k<=P
//This is the only place where hash is set
    if (!k || k < 1) k = 1;
    if (k > P) k = P;
    k = Number(k);
    sayfa.innerText = k;
    if (curPage == k) return;
    setSura(suraFromPage(k));
    if (adjusting == 'slider') return;
    curPage = k;
    slider.value = k;
    text.innerHTML = kur.pageToHTML(k)
    html.innerHTML = qur.pageToHTML(k)
    starB.style.backgroundColor = 
        bookmarks.has(k)? CHECKED : ''
    let wc = html.childElementCount
    console.log('Page '+k, wc+' words');
    for (let x of html.querySelectorAll('span')) {
      x.onmouseenter = displayWord
      x.onmouseleave = hideWord
      x.oncontextmenu = selectWord
    }
    bilgi = document.createElement('span')
    bilgi.id = 'bilgi'; document.body.append(bilgi)
    bilgi.onclick = 
      () => {openMujam(toBuckwalter(bilgi.innerText))} 
    if (adjusting != 'hashInProgress') //cv are not set
      location.hash = '#p='+curPage
    setStorage(false)
    hideMenus();  //html.scrollTo(0)
}
function setSura(k) { // 1<=k<=M
    k = Number(k);
    if (curSura == k) return;
    curSura = k;
    sureS.selectedIndex = k-1
}
function gotoSura(k) {
    if (!k || k < 1)  k = 1;
    if (k > M) k = M;
    setSura(k);
    gotoPage(first[k]);
}
function dragStart(evt) {
    if (menuK.style.display || menuC.style.display || menuS.style.display) {
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
function readNames(name) {
    function toNames(t) {
      let i = 0, labels = []
      for (let s of t.split('\n')) {
        i++; //skip 0
        let [f, n] = s.split('\t'); //TAB
        names[i] = n; labels.push(i+'. '+n)
        first[i] = Number(f)
      }
      console.log(name, names.length); labels.pop()
      sureS.innerHTML = '<option>'+labels.join('<option>')
    }
  //fetch(DATA_URL+name).then(x => x.text()).then(toNames)
    fetch_text_then(DATA_URL+name, toNames)
}
function readWords(name) {
    function toWords(t) {
      for (let s of t.split('\n')) {
        let [root, ...L] = s.split(' ');
        //keep L in Buckwalter form
        //L = L.map(toArabic)
        rootToList.set(root, L);
        for (let w of L) wordToRoot.set(w, root)
      }
      console.log(name, rootToList.size, wordToRoot.size); 
    }
  //fetch(DATA_URL+name).then(x => x.text()).then(toWords)
    fetch_text_then(DATA_URL+name, toWords)
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
        document.title = 'Iqra Sayfa '+s
        break
      case 'r': // r=Sbr
        let L = rootToList.get(s)
        if (L) markWord(s, true)
        break
      case 'w': // w=yuwsuf
        for (let t of decodeURI(s).split(' '))
          markWord(t, false)
        break
      case 'v': // v=12:90
        let [c, v] = s.split(':') 
        c = Number(c); v = Number(v)
        gotoPage(pageOf(c, v), 'hashInProgress')
        document.title = 'Iqra Ayet '+s
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
      let k = getStorage().page || 1
      gotoPage(k)
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
    sayNo.onkeydown= keyToPage
    pageS.onclick  = handleStars
    trans.onclick  = toggleTrans
    starB.onclick  = toggleStar
    linkB.onclick  = toggleMenuK
    zoomB.onclick  = toggleZoom
    showR.onclick  = toggleWords
    //bilgi.onclick -- do on each page
    leftB.onclick  = () => {gotoPage(curPage-1)}
    slider.oninput = () => {adjustPage(true)}
    slider.onchange= () => {adjustPage(false)} //committed
    rightB.onclick = () => {gotoPage(curPage+1)}
    try {
        readNames("iqra.names"); readWords("words.txt");
        // readText("Kuran.txt", kur); readText("Quran.txt", qur); 
    } catch(err) { 
        console.log(err)
    }
    menuFn(); 
    var prevTime
    document.onvisibilitychange = () => {
      if (document.hidden) {
        prevTime = Date.now()/1000
      } else if (!prevTime) { //initial call
        console.log('Start', new Date())
      } else {
        let dt = Date.now()/1000 - prevTime
        console.log("invisible "+timeString(dt))
        if (dt > 9999 && localStorage.userName) //more than 3 hours
            readTabularData(setBookmarks, console.error)
      }
    }
  
    window.onhashchange = gotoHashPage
    window.name = "iqra" //by A Rajab
    let {roots, marks} = getStorage()
    //we cannot use page yet, files are not read -- see initialPage()
    showR.style.backgroundColor = roots? CHECKED : ''
    arrayToSet(marks) //immediate action
    if (localStorage.userName) //takes time to load
        readTabularData(setBookmarks, console.error)
}
/********************
 * Start of Menu functions -- added by Abdurrahman Rajab - FSMVU
 * Ref: https://dev.to/iamafro/how-to-create-a-custom-context-menu--5d7p
 *
 * We have two Menu elements: menuC (context)  menuK (open source)
 *
 */
var //LINKF = 'https://a0m0rajab.github.io/BahisQurani/finder.html#w='
    LINKF = '../BahisQurani/finder.html#w='
var LINKM = 'mujam.html#r='
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
                let r = wordToRoot.get(toBuckwalter(w))
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
  menuK.onclick = (evt) => { //external source menu
      evt.preventDefault()
      openSitePage(evt.target.innerText[0], curPage)
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
            evt.clientX = linkB.offsetLeft
            evt.clientY = linkB.offsetTop +10
            toggleMenuK(evt); break
          case 'Z': case '+':
            toggleZoom();  break
          case 'K':
            toggleWords(); break
          default: return
      }
  }
  window.hideMenus = () => { 
      hideElement(menuC); hideElement(menuK); 
      hideElement(menuS); hideElement(bilgi)
      linkB.style.backgroundColor = ''
  }
  html.oncontextmenu = (evt) => {
      evt.preventDefault(); 
      hideElement(menuK); linkB.style.backgroundColor = ''
      setPosition(menuC, evt.clientX, evt.clientY-60, 220)
  }
}
/**
* End of menu functions 
***********************************************/
function keyToPage(evt) {
    if (evt.key == 'Escape') {
      hideElement(menuS)
    } else if (evt.key == 'Enter') {
      gotoPage(sayNo.value)
      hideElement(menuS)
    }
}
function toggleTrans() {
    if (trans.style.backgroundColor) {
      html.style.display = ''
      text.style.display = ''
      trans.style.backgroundColor = ''
    } else { //hide html
      html.style.display = 'none'
      text.style.display = 'block'
      trans.style.backgroundColor = CHECKED
    }
}
function makeStarMenu() {
    const span = '<span class="menuK">'
    let t = ''
    let a = [...bookmarks].reverse()
    for (let k of a) if (k != curPage)
        t += span+'s'+k+' '+names[suraFromPage(k)]+'</span>\n'
    starred.innerHTML = t
}
function handleStars() {
    if (menuS.style.display) {
      hideElement(menuS)
    } else {
      hideMenus(); makeStarMenu()
      let e = pageS
      setPosition(menuS, e.offsetLeft+35, e.offsetTop+35, 110)
      sayNo.value = curPage
      sayNo.select(0,3); sayNo.focus()
    }
}
function toggleStar() {
    if (starB.style.backgroundColor) {
      starB.style.backgroundColor = ''
      bookmarks.delete(curPage)
    } else {
      starB.style.backgroundColor = CHECKED
      bookmarks.add(curPage)
      let a = [...bookmarks]
      if (a.length > MAX_MARKS)
      bookmarks.delete(a[0]) //the oldest entry
    }
    setStorage(true) //may need to synch
}
function toggleMenuK() {
    if (linkB.style.backgroundColor) {
      linkB.style.backgroundColor = ''
      hideElement(menuK)
    } else {
      hideMenus(); linkB.style.backgroundColor = CHECKED
      let e = linkB
      setPosition(menuK, e.offsetLeft+10, e.offsetTop+35, 120)
    }
}
function toggleZoom() {
    let e = document.body
    if (zoomB.style.backgroundColor) {
      e.style.transform = ''
      zoomB.style.backgroundColor = ''
    } else {
      e.style.transform ='scale(1.16) translate(0, 8%)'
      zoomB.style.backgroundColor = CHECKED
    }
}
function toggleWords() {
    if  (showR.style.backgroundColor)
         showR.style.backgroundColor = ''
    else showR.style.backgroundColor = CHECKED
    setStorage(false)
}

initReader()

// export {names, first, rootToList, wordToRoot}