"use strict";

// import {pageOf, timeString} from './utilities.js';
// import {VERSION, setPosition, hideElement, fetch_text_then, 
//         openSitePage, openSiteVerse} from './common.js
// import {toArabic, toBuckwalter} from "./buckwalter.js"

const M = 114; //suras
const P = 604; //pages
let snum = getStorage('settings', 'source')
if (!snum || snum<=0 || snum>=SOURCE.length) snum = 5
//constants do not appear as properties from the parent
var kur = new KuranText(snum, initialPage)
var qur = new QuranText(0, initialPage)
const MD  = new MujamData('data/words.txt')
const SD  = new SimData('data/simi.txt')
var swipe = new TouchHandler({dragStart, dragEnd}, div2)
var curSura, curPage, bookmarks, lastSelection,
    initialized = false, //becomes true when loaded
    clickStart; //start time for click events
window.mujam = undefined

const DEFAULT = {page:1, marks:[]}
const MAX_MARKS = 12  // if more marks, delete the oldest
const notes = new Notes('notesQ')
  
function arrayToSet(m) {
    if (!m) return
    console.log('Bookmarks set to '+m.join(' '))  
    bookmarks = new Set()
    for (let k of m) 
        bookmarks.add(Number(k))
}
function starIsChecked() {
    return starA.classList.contains("checked")
}
function transIsChecked() {
    return tranA.classList.contains("checked")
}
function saveSettings() {
    let x = {
      page: curPage,
      marks: [...bookmarks],
      trans: transIsChecked(),
      zoom: zoomA.classList.contains("checked")
    }
    if (parent.finderWidth)
      x.finderWidth = parent.finderWidth
    setStorage('iqra', x)
}
function readSettings() {
    let x = getStorage('iqra') || DEFAULT
    //we cannot use page yet, files are not read -- see initialPage()
    arrayToSet(x.marks) //immediate action
    if (x.trans) toggleTrans()
    if (x.zoom) toggleZoom()
    if (parent.name == 'iqraTop' && x.finderWidth)
      parent.finderWidth = x.finderWidth
    let s = getStorage('settings')
    if (s) setFontFamily(s.fontType) 
    return x
}
function setFontFamily(f){
    html.style.fontFamily = bilgi.style.fontFamily = f
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
    if (x) {
      x.classList.add('sari')
      x.scrollIntoView(false)
    } else console.log(cls+' not in '+elt.id)
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
      bilgi.style.font = '14px/1.6 sans'
    } else { // t is a word
      bilgi.style.font = ''
    }
    bilgi.innerHTML = t.tText 
    let y = //t.offsetTop + t.offsetHeight
      t.getBoundingClientRect().bottom + window.pageYOffset
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
      // console.log(evt.offsetY, evt.clientY, evt.pageY)
      let y = t.getBoundingClientRect().top - 26
      setPosition(menuC, evt.clientX, y, 220)
    }
}
function hideWord(evt) {
    // evt.target.style.backgroundColor = ''
    evt.target.classList.remove('gri') 
}
function adjustPage(adj) {
    if (!kur.loaded || !qur.loaded) return
    infoS.style.display = adj? 'block' : ''
    gotoPage(slider.value, adj? 'slider' : '')
    if (adj) {
      let s = sureS.value+' -- Sayfa '+slider.value
      infoS.innerText = s
    }
}
function doClick(evt) {
  if (bilgi.style.font) { // verse separator
      let t = evt.target.innerText
      if (t.length > 6) return
      console.log(location.hash+' to '+t)
      location.hash = '#v='+t  //.split(' ')[0]
    } else { // a word
      openMujam(toBuckwalter(bilgi.innerText))
    }
}
function prevPage() {
    gotoPage(curPage-1)
}
function nextPage() {
    gotoPage(curPage+1)
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
          let s = SD.similarTo(idx)
          if (!s) {
            x.classList.add('ayetno'); return
          }
          x.tText = s.split(' ')
            .map(x => '<div>'+x+'</div>').join('');
          x.classList.add('mavi')
        } else { // x is a word
          let w = x.innerText.trim()
          let r = MD.wordToRoot(toBuckwalter(w))
          if (r) x.tText = toArabic(r)   
        }
      }
  }
  function animate(down, ms=400) {
  //not used -- fails in Safari
    let tr1 = "translate(0,0)" //initial position
    let h = (down? '-' : '+')+div2.clientHeight
    let tr2 = "translate(0, "+h+"px)"
    // console.log("animate", tr2)
    div2.animate({transform:[tr1, tr2]}, ms)
    //modify page close to the end
    return new Promise(res => setTimeout(res, ms*0.9))
  }
  function setTrans(t1='', t2='') {
      div2.style.transition = t1
      div2.style.transform = t2
  }
    if (!k || k < 1) k = 1;
    if (k > P) k = P;
    k = Number(k);
    sayfa.innerText = k;
    if (curPage == k) return;
    let [c] = cvFromPage(k); setSura(c);
    if (adjusting == 'slider') return;
  try {
    hideMenus(); 
    if (curPage) { //await animate(curPage < k)
      let h = (curPage < k? '-' : '+')+div2.clientHeight
      setTrans("transform 0.4s", "translate(0, "+h+"px)")
      setTimeout(setTrans, 410)
    }
    curPage = k; slider.value = k;
    text.innerHTML = kur.pageToHTML(k)
    html.innerHTML = qur.pageToHTML(k)
    if (starIsChecked() !== bookmarks.has(k)) toggleStar()
    // starA.classList.toggle('checked', bookmarks.has(k))
    notes.display(k) //in common.js
  } catch (e) {
    console.error(e)
    alert(e)
  }
    let wc = html.childElementCount
    let idx = index[curPage]  //better than cvToIndex
    console.log('Page '+k, wc+' verses', idx)
    for (let e of html.children) {
        if (e.tagName != 'SPAN') continue
        idx++; doVerse(e)
    }
    if (adjusting !== 'hashInProgress') {
      let h = '#p='+curPage
      if (location.hash !== h) location.hash = h
    }
    saveSettings(); scrollTo(0, 0)
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
      || menuS.style.display || menuT.style.display
      || bilgi.style.display || pageD.open)  {
        hideMenus(); evt.preventDefault(); return false
    }
    return true
}
function dragEnd(a) {
    switch (a) {
      case 0: case 12: //swipe left
        if (!parent.toogleFinder) return false
        if (!transIsChecked())
          parent.toogleFinder() //pink button
        else toggleTrans() //T button
        return true
      case 6: //swipe right
        if (!parent.toogleFinder) return false
        if (transIsChecked())
          parent.toogleFinder() //pink button
        else toggleTrans() //T button
        return true
      case 9: //swipe down
        prevPage(); return true
      case 3: //swipe up
        nextPage(); return true
      default: //angle not supported
        return false
    }
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
        document.title = 's'+nameFromPage(s)
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
    if (initialized) { //global
      if (!gotoHashPage()) gotoPage(1) 
      //getStorage('iqra', 'page') || 1)
      checkTrans()
    }
}
function initReader() {
    title.innerHTML = 'Iqra '+VERSION+'&emsp;';
    version.innerText = 'Iqra '+VERSION;
    // console.log(swipe)  //TouchHandler
    sureS.onchange = () => {gotoSura(sureS.selectedIndex+1)}
    pgNum.onkeydown= keyToPage
    pageD.ontoggle = handlePageNum
    let bkgd = pageD.querySelector('.bkgd')
    bkgd.onclick = (e) => e.target===bkgd? pageD.open=false : 0
    new ButtonMenu(starA, menuS, makeStarMenu)
    new ButtonMenu(tranA, menuT)
    new ButtonMenu(linkA, menuK)
    yardim.onclick  = () => {openSitePage('Y')}
    starB.onclick  = toggleStar
    tranB.onclick  = toggleTrans
    zoomA.onclick  = toggleZoom
    bilgi.onclick  = doClick
    leftB.onclick  = () => {prevPage()}
    slider.oninput = () => {adjustPage(true)}
    slider.onchange= () => {adjustPage(false)} //committed
    rightB.onclick = () => {nextPage()}
    noteBut.onclick = () => {notes.edit()} //in common.js
    let labels = []
    for (let i=1; i<=M; i++)
      labels.push(i+'. '+sName[i])
    sureS.innerHTML = '<option>'+labels.join('<option>')
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
      }
    }
    bookmarks = new Set()
    // window.onresize = resize
    window.onhashchange = gotoHashPage
    window.name = "iqra" //by A Rajab
    if (readSettings() === DEFAULT) saveSettings()
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
          case 'R':
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
  menuS.onclick = (evt) => { //star menu
      evt.preventDefault()
      let t = evt.target.innerText
      //console.log(curPage, t)
      let [x, k] = t.split(/s| /)
      if (Number(k)) gotoPage(Number(k))
  }
  menuT.onclick = (evt) => { //translation menu
    function setTrans() {
      text.innerHTML = kur.pageToHTML(curPage)
      setStorage('settings', 'source', k)
      checkTrans()
    }
      hideElement(menuT); //evt.preventDefault()
      let t = evt.target, k = Number(t.id)
      if (!k) return
      console.log(k, t.textContent)
      if (!transIsChecked()) toggleTrans()
      kur = new KuranText(k, setTrans)
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
document.onkeydown = handleKeyEvent
function handleKeyEvent(evt) {
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
          case 'ARROWUP': case 'ARROWLEFT': 
            if (!evt.altKey && !evt.ctrlKey && !evt.metaKey)
              {prevPage(); evt.preventDefault()}
            break
          case 'ARROWDOWN': case 'ARROWRIGHT':
            if (!evt.altKey && !evt.ctrlKey && !evt.metaKey)
              {nextPage(); evt.preventDefault()}
            break
          case 'T':
            toggleTrans(); break
          case '*':
            toggleStar(); break
          case 'M': //case '.':
            toggleMenuK(); break
          case 'Z': case '+':
            toggleZoom(evt);  break
          default: return
      }
  }
  window.hideMenus = () => { 
      hideElement(menuC); hideElement(menuK); hideElement(menuS); 
      hideElement(menuT); hideElement(bilgi); hideElement(menuV); 
      pageD.open = false; //linkA.classList.remove('checked')
  }
  div1.onmouseenter = hideMenus
  div3.onmouseenter = hideMenus
  text.onmouseenter = hideMenus
}
/**
* End of menu functions 
***********************************************/
function keyToPage(evt) {
    evt.stopPropagation()
    if (evt.key == 'Escape') {
      hideMenus()
    } else if (evt.key == 'Enter') {
      let [c, v] = pgNum.value.split(/\D+/)
      if (v === '') v = 1
      if (v) { //c:v
        let p = pageOf(Number(c), Number(v))
        gotoPage(p)
        markVerse(c+':'+v)
      } else { //page
        gotoPage(Number(c))
      }
      hideElement(menuS)
    }
}
function checkTrans() {
  function handleCheck(e) {
    let s = SOURCE[e.id]  //defined in model.js
    e.classList.toggle('checked', s === kur.url)
  }
    menuT.querySelectorAll('[id]').forEach(handleCheck)
}
function toggleTrans() {
    if (tranA.classList.toggle('checked')) {
      tranB.innerHTML = 'Meal Gizle &ndash; T'
      html.classList.add('hiddenNarrow')
      text.classList.remove('hiddenNarrow')
    } else { //hide text if narrow screen
      tranB.innerHTML = 'Meal Göster &ndash; T'
      html.classList.remove('hiddenNarrow')
      text.classList.add('hiddenNarrow')
    }
    hideMenus(); saveSettings()
}
function makeStarMenu() {
    const span = '<span class="menuK">'
    let t = ''
    let a = [...bookmarks].reverse()
    for (let k of a) if (k != curPage)
        t += span+'s'+nameFromPage(k)+'</span>\n'
    starred.innerHTML = t
}
function handlePageNum() {
    pgNum.value = curPage
    setFocus(pgNum)
}
function toggleStar() {
    let msg = ''
    // const YILDIZ = '<b class=large>☆</b> '
    if (starA.classList.toggle('checked')) {
      bookmarks.add(curPage)
      let a = [...bookmarks]
      if (a.length > MAX_MARKS)
      bookmarks.delete(a[0]) //the oldest entry
      starB.innerHTML = 'Yıldız Kaldır'
    } else {
      bookmarks.delete(curPage)
      starB.innerHTML = 'Yıldız Ekle'
      msg = '-'
    }
    saveSettings(); hideMenus()
}
function toggleMenuK() {
    if (!menuK.style.display) {
      let x = linkA.offsetLeft+10, y = linkA.offsetTop+33
      hideMenus(); setPosition(menuK, x, y, 120)
    } else {
      hideElement(menuK)
    }
}
function toggleZoom() {
    let e = div2 //document.body
    let checked = zoomA.classList.toggle('checked')
    if (checked) {
      e.classList.add('zoomWide')
    } else {
      e.classList.remove('zoomWide')
    }
    hideMenus(); saveSettings()
}

initReader()
