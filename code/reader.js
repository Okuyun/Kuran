"use strict";

// import {pageOf, timeString} from './utilities.js';
// import {VERSION, setPosition, hideElement, fetch_text_then, 
//         openSitePage, openSiteVerse} from './common.js
// import {toArabic, toBuckwalter} from "./buckwalter.js"

var Q = {} //keep globals here
Q.M = 114  //suras
Q.P = 604  //pages
let snum = getStorage('settings', 'source')
if (!snum || snum<=0 || snum>=SOURCE.length) snum = 5
Q.kur = new KuranText(snum, initialPage)
Q.qur = new QuranText(0, initialPage)
Q.simi  = new SimData('data/simi.txt')
Q.roots = new MujamData('data/words.txt')
// Q.dict = Dictionary.newInstance() moved to languageItems()
new TouchHandler({dragStart, dragEnd}, div2)
var curSura, curPage, bookmarks, lastSelection, recognition
Q.notes = new Notes('notesQ')
//https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList
Q.hasMouse = matchMedia('(pointer:fine)').matches
window.mujam = undefined
  
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
    let x = getStorage('iqra'), save = false;
    if (!x) {
      x = {page:1, marks:[]}; save = true
    }
    //we cannot use page yet, files are not read -- see initialPage()
    arrayToSet(x.marks) //immediate action
    if (x.trans) toggleTrans()
    if (x.zoom) toggleZoom()
    if (parent.name == 'iqraTop' && x.finderWidth)
      parent.finderWidth = x.finderWidth
    let s = getStorage('settings')
    if (s) setFontFamily(s.fontType) 
    if (save) saveSettings()
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
      if (root) b = Q.roots.wordToRoot(b)
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
    let cls = '.c'+cv.replace(':', '_')
    mark(html); mark(text)
}
function toggleVerse(evt, color='yesil') {
    let t = evt.target, cls = '.'+t.classList[0]
    // console.log('toggleVerse', cls)
    t.classList.toggle(color)
    let p = t.parentElement===text? html : text
    p.querySelector(cls).classList.toggle(color)
}
function displayWord(evt) {
    evt.preventDefault(); //hideMenus()
    let t = evt.target 
    t.classList.add('gri')  //mark target
    hideElement(bilgi)  //setPosition() displays bilgi
    let b = t.tText; if (!b) return
    if (t.id) { //verse number
      bilgi.innerHTML = b
    } else { //word just clicked
      let r = Q.roots.wordToRoot(b); if (!r) return
      bilgi.innerHTML = toArabic(r) 
      let m = Q.dict.meaning(removeDiacritical(b))
      if (m) bilgi.innerHTML += '<span>'+m+'</span>'
    }
    let y = //t.offsetTop + t.offsetHeight
      t.getBoundingClientRect().bottom + window.pageYOffset
    setPosition(bilgi, t.offsetLeft+24, y+4, 105)
}
function selectWord(evt) {
    evt.preventDefault(); hideMenus()
    let t = evt.target
    if (t.id) { // t is a verse separator
      let y = Math.max(evt.offsetY-150, 0)
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
      let y = 
        t.getBoundingClientRect().top + window.pageYOffset
      setPosition(menuC, evt.clientX, y-36, 220)
    }
}
function hideWord(evt) {
    // evt.target.style.backgroundColor = ''
    evt.target.classList.remove('gri') 
}
function adjustPage(adj) {
    if (!Q.kur.loaded || !Q.qur.loaded) return
    infoS.style.display = adj? 'block' : ''
    gotoPage(slider.value, adj? 'slider' : '')
    if (adj) {
      infoS.innerText = sureS.value+' -- '
        +langMgr.PAGE0+slider.value
    }
}
function doClick(evt) {
    if (evt.target.tagName == 'DIV') { // verse separator
      let t = evt.target.innerText
      if (t.length > 6) return
      console.log(location.hash+' to '+t)
      location.hash = '#v='+t
    } else if (evt.target === bilgi) { // a word
      let w = bilgi.firstChild.textContent
      if (w) openMujam(toBuckwalter(w))
    }
}
function prevPage() {
    gotoPage(curPage==1? Q.P : curPage-1)
}
function nextPage() {
    gotoPage(curPage==Q.P? 1 : curPage+1)
}
function refreshPage() {
    gotoPage(curPage)
}
function gotoPage(k=1, adjusting) { // 1<=k<=P
//This is the only place where hash is set
  function doVerse(e) {
      e.onmouseenter = toggleVerse
      e.onmouseleave = toggleVerse
      for (let x of e.children) {
        x.onclick = displayWord
        x.onmouseleave = hideWord
        x.oncontextmenu = selectWord
        if (x.id) { // x is a verse separator
          let s = Q.simi.similarTo(idx)
          if (!s) {
            x.classList.add('ayetno'); return
          }
          x.tText = s.split(' ')
            .map(x => '<div>'+x+'</div>').join('');
          x.classList.add('mavi')
        } else { // x is a word
          // content is filled in displayWord()
          x.tText = toBuckwalter(x.innerText.trim())
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
    if (k < 1) k = 1;
    if (k > Q.P) k = Q.P;
    k = Number(k);
    sayfa.innerText = k;
    let j = Math. trunc((k-1)/20)
    cuzS.selectedIndex = Math.min(j, cuzS.length-1)
    let [c] = cvFromPage(k, true)
    setSura(c) //might be previous sura
    if (adjusting == 'slider') return;
  try {
    hideMenus(); 
    if (curPage) { //await animate(curPage < k)
      let h = (curPage < k? '-' : '+')+div2.clientHeight
      setTrans("transform 0.5s", "translate(0, "+h+"px)")
      setTimeout(setTrans, 510)
    }
    curPage = k; slider.value = k;
    text.innerHTML = Q.kur.pageToHTML(k)
    html.innerHTML = Q.qur.pageToHTML(k)
    if (starIsChecked() !== bookmarks.has(k)) toggleStar()
    // starA.classList.toggle('checked', bookmarks.has(k))
    Q.notes.display(k) //in common.js
  } catch (e) {
    console.error(e)
    alert(e)
  }
    let wc = html.childElementCount
    let idx = index[curPage]  //better than cvToIndex
    // console.log('Page '+k, wc+' verses', idx)
    for (let e of html.children) {
        if (e.tagName != 'SPAN') continue
        idx++; doVerse(e)
    }
    for (let e of text.children) doVerse(e)
    if (hashToPage(location.hash) !== curPage) 
        location.hash = '#p='+curPage
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
    if (c > Q.M) c = Q.M;
    setSura(c);
    gotoPage(pageOf(c, 1));
}
function dragStart(evt) {
    if (menuK.style.display || menuC.style.display 
      || menuS.style.display || menuT.style.display
      || bkgd.style.display)  {
        hideMenus(); evt.preventDefault(); return false
    }
    return true
}
function dragEnd(a) {
    switch (a) {
      case 0: case 12: //swipe left
        toggleTrans() //Translate button
        return true
      case 6: //swipe right
        if (parent.toggleFinder) 
          parent.toggleFinder() //yellow button
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
        if (curPage != s) gotoPage(s)
        document.title = langMgr.PAGE0+nameFromPage(s)
        break
      case 'r': // r=Sbr
        let L = Q.roots.rootToList(s)
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
        let p = pageOf(c, v)
        if (curPage != p) gotoPage(p)
        document.title = sName[c]+' '+s
        markVerse(s); break
      default: 
        console.log("wrong hash" + e)
        return false
    }
  }
  return true
}
function fetchPushTime(callback, save) {
  function saveTime(t) {
    // let t1 = JSON.parse(t).pushed_at
    let t1 = JSON.parse(t)[0].commit.author.date
    let t0 = getStorage('pushed_at')
    if (t1 === t0) return
    if (save) setStorage('pushed_at', t1)
    callback(t1, t0)
  }
    let url = "https://api.github.com/repos/Okuyun/Kuran/commits"
    if (navigator.onLine) fetch_text_then(url, saveTime)
}
function initialPage() {
    if (Q.kur.loaded && Q.qur.loaded) {
//https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage    
      parent.postMessage("initialized", "*")
      let hash = gotoHashPage(), wide = parent.innerWidth>850;
      console.log("initialPage", {hash, wide})
      if (!hash && (parent===window || wide)) gotoPage(1) 
      checkTrans()
      fetchPushTime(t => console.log('Last Commit:', t), true) 
    }
}
function makeMenu(button, menu, callback) {
  function showMenu() {
    hideMenus();
    menu.style.display = 'block'
    let x = button.offsetLeft+10
    let y = button.offsetTop+33
    if (callback) callback()
    setPosition(menu, x, y, 110)
  }
  function hideMenu() {
    menu.style.display = '' 
  }
  function showOrHide(e) {
    if (e.target !== button) return
    if (menu.style.display) hideMenu()
    else showMenu()
  }
    button.append(menu)
    if (Q.hasMouse) { //similar to hover
      button.onmouseenter = showMenu
      button.onmouseleave = hideMenu
    } else { //touch converted to click
      button.onclick = showOrHide
    }
}
function openHash(evt) {
  // iqra.location.hash = '#'+h;
    if (evt.key !== 'Enter') return
    let str = ''
    switch (evt.target) {
      case rootD: 
        str = 'mujam.html#r='+rootD.value.replace(/\s+/g, '&r=')
        break;
      case textD: 
        str = FINDER+'#w='+textD.value; break
      case buckD: 
        str = FINDER+'#b='+buckD.value; break 
      default: return
    }
    window.open(str, 'finder'); hideElement(bkgd)
    if (!evt.type) return
    evt.stopPropagation(); evt.preventDefault()
}
function reportNewVersion(t1, t0) {
  if (!t1 || !t0 || t1===t0) return
    update.style.display = '' //menu item becomes visible
    linkA.classList.add('checked') //button is hilited
    console.log(`Modified: ${t0} => ${t1}`)
}
function initReader() {
    vers1.innerText = 'Iqra '+VERSION
    vers2.innerHTML = 'Iqra '+VERSION+'&emsp;'
    // console.log(swipe)  //TouchHandler
    languageItems()
    sureS.onchange = () => {gotoSura(sureS.selectedIndex+1)}
    cuzS.onchange = () => {gotoPage(cuzS.selectedIndex*20+1)}
    pgNum.onkeydown = keyToPage
    dialogOK.onclick = (e) => {e.key='Enter'; keyToPage(e)}
    rootD.onkeydown = openHash
    textD.onkeydown = openHash
    buckD.onkeydown = openHash
    pageA.onclick = handlePageNum
    bkgd.onclick = (e) => e.target===bkgd? hideElement(bkgd) : 0
    makeMenu(starA, menuS, makeStarMenu)
    makeMenu(tranA, menuT)
    makeMenu(linkA, menuK)
    yardim.onclick  = () => {openSitePage('Y')}
    update.onclick = () => parent.location.reload()
    starB.onclick = starH.onclick = toggleStar
    tranB.onclick = tranH.onclick = toggleTrans
    zoomA.onclick  = toggleZoom
    bilgi.onclick  = doClick
    leftB.onclick  = () => {prevPage()}
    slider.oninput = () => {adjustPage(true)}
    slider.onchange= () => {adjustPage(false)} //committed
    rightB.onclick = () => {nextPage()}
    noteBut.onclick = () => {Q.notes.edit()} //in common.js
    menuFn(); 
    var prevTime
    document.onvisibilitychange = () => {
      if (document.hidden) {
        prevTime = Date.now()/1000
      } else if (!prevTime) { //initial call
        console.log('Start', new Date())
      } else {
        let dt = Date.now()/1000 - prevTime
        if (dt < 1000) return //less than 16 minutes
        console.log("invisible "+timeString(dt))
        fetchPushTime(reportNewVersion)
      }
    }
    bookmarks = new Set()
    // window.onresize = resize
    window.onhashchange = gotoHashPage
    window.name = "iqra" //by A Rajab
    readSettings()
    if (!webkitSpeechRecognition) return
    recog0.hidden = false
    recog0.onclick = () => {
      textD.value = ''; recog1.hidden = false
      if (!recognition) initRecognition()
      recognition.start()
    }
}
function initRecognition() {
    recognition = new webkitSpeechRecognition()
    recognition.lang = 'ar-AR'
    recognition.onspeechend = () => {
      recognition.stop(); recog1.hidden = true
    }
    recog3.onclick = recognition.onspeechend
    recognition.onresult = (e) => {
      let a = e.results[0][0]; //use first result
      console.log(a.transcript, a.confidence.toFixed(2)) 
      textD.value = a.transcript; recog1.hidden = true
      // e.key = 'Enter'; e.target = textD
      openHash({key: 'Enter', target: textD})
    }
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
    // console.log('mucem: r='+p)
}
function menuFn() {
  function menuItem(m) {
      let s = forceSelection() //s is not empty
      switch (m) {
          case 'copy':
              navigator.clipboard.writeText(s)
              .then(() => { console.log('Panoya:', s) })
              .catch(e => { alert('Panoya yazamadım\n'+e) })
              break
          case 'mujm':
              let a = []
              for (let w of s.split(' ')) {
                let r = Q.roots.wordToRoot(toBuckwalter(w))
                if (r) a.push(r)
              }
              if (a.length > 0) openMujam(...a)
              else alert('Mucemde bulunamadı')
              break
          case 'fndr':
              window.open(LINKF + s, "finder")
              break
          case 'B':
              alert('Similar pages -- not implemented yet')
          default:  return
      }
      hideMenus()
  }
  menuC.onclick = (evt) => { //context menu
      evt.preventDefault()
      menuItem(evt.target.id)
  }
  menuS.onclick = (evt) => { //star menu
      evt.preventDefault()
      let t = evt.target.innerText
      // let [, k] = t.split(/s| /)
      let [k] = t.substring(1).split(' ')
      // console.log(curPage, p)
      // ignore Add/Remove -- NaN
      if (Number(k)) gotoPage(Number(k))
  }
  menuT.onclick = (evt) => { //translation menu
    function toggleText(simple) {
      let n = simple? 0 : 1
      // let s = simple? 'gizle' : 'göster'
      Q.qur = new QuranText(n, refreshPage)
      if (simple) {
        classFromTo('hidden', hareH, hareB)
      } else {
        classFromTo('hidden', hareB, hareH)
      }
    }
      hideElement(menuT); //evt.preventDefault()
      let t = evt.target, k = Number(t.id)
      if (k) {
        console.log(k, t.textContent)
        if (!transIsChecked()) toggleTrans()
        setStorage('settings', 'source', k)
        if (parent.applyTranslation) 
          parent.applyTranslation()
        else postMessage("translation", "*")
      } else if (t === hareB || t === hareH) {
        toggleText(Q.qur.url.includes('simple'))
      }
  }
  addEventListener("message", translationListener)
  function translationListener(evt) {
    function setTrans() {
      text.innerHTML = Q.kur.pageToHTML(curPage)
      checkTrans()
    }
    if (evt.data !== "translation") return
    let k = getStorage('settings', 'source')
    Q.kur = new KuranText(k, setTrans) //current
  }
  menuK.onclick = (evt) => { //menu button
    let t = parent.finder? evt.target : ''
    hideMenus()
    switch (t) {
      case topic: 
        parent.finder.location="konular.html"; break;
      case notes: 
        parent.finder.location="notlar.html"; break;
      case ders: 
        parent.finder.location="/Kitap/ders/"; break;
      default: openSitePage(t.innerText[0], curPage)
    }
    
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
      // else if (menuC.style.display)
      //     menuItem(k)
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
          // case 'T':
          //   toggleTrans(); break
          // case '*':
          //   toggleStar(); break
          // case 'M': //case '.':
          //   toggleMenuK(); break
          // case 'Z': case '+':
          //   toggleZoom(evt);  break
          default: return
      }
  }
  window.hideMenus = () => { 
      hideElement(menuC); hideElement(menuK); hideElement(menuS); 
      hideElement(menuT); hideElement(bilgi); hideElement(menuV); 
      hideElement(bkgd); //linkA.classList.remove('checked')
  }
  div1.onmouseenter = hideMenus
  div3.onmouseenter = hideMenus
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
    e.classList.toggle('checked', s === Q.kur.url)
  }
    menuT.querySelectorAll('[id]').forEach(handleCheck)
}
function classFromTo(cls, e1, e2) {
    e1.classList.remove(cls)  
    e2.classList.add(cls)
}
function toggleTrans() {
    if (tranA.classList.toggle('checked')) {
      classFromTo('hidden', tranH, tranB)
      classFromTo('hiddenNarrow', text, html)
    } else { //hide text if narrow screen
      classFromTo('hidden', tranB, tranH)
      classFromTo('hiddenNarrow', html, text)
    }
    hideMenus(); saveSettings()
}
function makeStarMenu() {
    const span = '<span class="menuK">'
    let t = '', p = langMgr.PAGE0
    let a = [...bookmarks].reverse()
    for (let k of a) if (k != curPage)
        t += span+p+nameFromPage(k)+'</span>\n'
    starred.innerHTML = t
}
function handlePageNum() {
    bkgd.style.display = "block"
    pgNum.value = curPage
    setFocus(pgNum)
}
function toggleStar() {
    if (starA.classList.toggle('checked')) {
      bookmarks.add(curPage)
      let a = [...bookmarks]
      if (a.length > 12) // if more marks,
      bookmarks.delete(a[0]) //the oldest entry
      classFromTo('hidden', starH, starB)
    } else {
      bookmarks.delete(curPage)
      classFromTo('hidden', starB, starH)
    }
    hideMenus(); saveSettings()
}
function toggleMenuK() {
    if (!menuK.style.display) {
      let x = linkA.offsetLeft+2, y = linkA.offsetTop+33
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
