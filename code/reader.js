"use strict";

// import {pageOf, timeString} from './utilities.js';
// import {VERSION, setPosition, hideElement, fetch_text_then, 
//         openSitePage, openSiteVerse} from './common.js
// import {toArabic, toBuckwalter} from "./buckwalter.js"

var Q = {} //keep globals here
Q.M = 114  //suras
Q.P = 604  //pages
let readSourceData = (tn, cb) => {
  setFontFamily(tn==1? 'Kufi' : 'Zekr')
  //tashkeel #1 and #2 use the same data
  switch (tn) {
    case 1: return new KufiText(QTEXT[1], cb)
    case 2: return new QuranText(QTEXT[1], cb)
    case 3: 
    default:return new QuranText(QTEXT[3], cb)
  }
}
let {snum, tnum} = getSourceSettings()
Q.kur = new KuranText(SOURCE[snum], initialPage)
Q.qur = readSourceData(tnum, initialPage)
Q.simi  = new SimData('data/simi.txt')
Q.roots = new MujamData('data/words.txt')
Q.vary  = new VariantData('data/variants.txt')
// Q.dict = Dictionary.newInstance() moved to languageItems()
new TouchHandler({dragStart, dragEnd}, div2)
var curSura, curPage, bookmarks, lastCV, lastSelection, recognition
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
      parent.finderWidth = Math.max(x.finderWidth, 350)
    let s = getStorage('settings') || {}
    // Arabic font is set in readSourceData()
    // if (s.fontType) setFontFamily(s.fontType) 
    if (s["dark-mode"]) toggleDarkMode(true)
    if (save) saveSettings()
    return x
}
function getSourceSettings() {
    let x = getStorage('settings')
    if (!x) x = {}
    let snum = x.source || '8' //pickthall.txt
    let tnum = x.tashkeel || '3'
    return {snum, tnum}
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
    hideElement(wordInfo)  //setPosition() displays wordInfo
    let b = t.tText; if (!b) return
    if (t.id) { //verse number
      bilgi.innerText = ''
      anlam.innerHTML = b
      variant.style.display = 'none'
    } else { //word just clicked
      let r = Q.roots.wordToRoot(b)
      let i = t.dataset.indx
      if (!r && !i) return
      bilgi.innerText = r? toArabic(r) : ''
      anlam.innerText = Q.dict.meaning(removeDiacritical(b))
      variant.style.display = i? '' : 'none'
      let [rdr, word, rgn, rasm] = Q.vary.getData(i) || []
      rdrV.innerText = rdr || ''
      wordV.innerText = word || ''
      rgnV.innerText = rgn || ''
      rasmV.innerText = rasm || ''
      if (i) t.classList.remove('gri')
    }
    let y = //t.offsetTop + t.offsetHeight
      t.getBoundingClientRect().bottom + window.pageYOffset
    setPosition(wordInfo, t.offsetLeft+24, y+6, 190)
}
function selectWord(evt) {
    evt.preventDefault(); hideMenus()
    let t = evt.target
    if (t.id) { // t is a verse separator
      let y = Math.max(evt.offsetY-150, 0)
      menuV.idx = Number(t.id) //index
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
      let x = evt.pageX  //t.getBoundingClientRect().left
      let y = evt.pageY  //t.getBoundingClientRect().top
   // setPosition(menuC, evt.clientX, y-36, 220)
      setPosition(menuC, x, y+40, 80)
      lastCV = t.parentElement.className   //global
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
    if (evt.target.tagName == 'DIV') { // similarity
      let t = evt.target.innerText
      if (t.length > 6) return
      console.log(location.hash+' to '+t)
      location.hash = '#v='+t
    } else if (evt.target === bilgi) { // Mujam
      let w = bilgi.firstChild.textContent
      if (w) openMujam(toBuckwalter(w))
    } else if (evt.target === variant) { // variants
      //do what??
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
function handleVariants(p) {
  let i = index[p]+1 //first verse on page
  let k = index[p+1] //last verse on page
  while (i <= k) { //for each verse x
    let v = Q.vary.variants(i++)
    if (!v) continue
    console.log('Variant', v.cv, v.num+1, v.word)
    let a = html.querySelector('.c'+v.cv.replace(':','_'))
    if (a.childElementCount <= v.num) continue
    let elt = a.children[v.num]
    elt.dataset.indx = i-1 //i is incremented above
    elt.classList.add('besmele')
    // elt.dataset.word = v.word
  }
}
function gotoPage(k=1, adjusting) { // 1<=k<=P
//This is the only place where hash is set
function processVerse(elt) {
    function doVerse(e) {
        e.onmouseenter = toggleVerse
        e.onmouseleave = toggleVerse
        for (let x of e.children) {
          x.onclick = displayWord
          x.onmouseleave = hideWord
          x.oncontextmenu = selectWord
          if (x.id) { // x is a verse separator
            let s = Q.simi.similarTo(x.id)
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
    for (let e of elt.children) {
        if (e.tagName != 'SPAN') continue
        doVerse(e)
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
    handleVariants(k)
    if (starIsChecked() !== bookmarks.has(k)) toggleStar()
    // starA.classList.toggle('checked', bookmarks.has(k))
    Q.notes.display(k) //in common.js
  } catch (e) {
    console.error(e)
    alert(e)
  }
    // let wc = html.childElementCount
    processVerse(html); processVerse(text)
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
        setTitle(langMgr.PAGE0+nameFromPage(s))
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
        setTitle(sName[c]+' '+s)
        markVerse(s); break
      default: 
        console.log("wrong hash: " + e)
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
    let x = button.offsetLeft+13
    let y = button.offsetTop+34
    if (callback) callback()
    setPosition(menu, x, y, 110)
  }
  function hideMenu() {
    menu.style.display = '' 
  }
  function showOrHide(e) {
    let t = e.target  //starA contains a SPAN
    if (t.tagName == 'SPAN') t = t.parentElement
    if (t !== button) return
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
    pageA.onclick = handlePageNum
    //functions defined in search.js
    main.onclick = doOmni
    input.onkeydown = enterKey
    input.onkeyup = inputKey
    input.onchange = inputKey
    bkgd.onclick = (e) => e.target===bkgd? hideElement(bkgd) : 0
    makeMenu(starA, menuS, makeStarMenu)
    makeMenu(tranA, menuT)
    makeMenu(linkA, menuK)
    yardim.onclick  = () => {openSitePage('help')}
    update.onclick = () => parent.location.reload()
    starB.onclick = starH.onclick = toggleStar
    tranB.onclick = tranH.onclick = toggleTrans
    zoomA.onclick  = toggleZoom
    wordInfo.onclick  = doClick
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
    recog0.style.display = ''
    recog0.onclick = () => {
      input.value = ''; recog1.hidden = false
      // if (!recognition) initRecognition()
      recognition.start(); expert.open = false
    }
    initRecognition()
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
      input.value = a.transcript; recog1.hidden = true
      inputKey(); setFocus(input)
      // e.key = 'Enter'; e.target = input
      // enterKeyOn(input)
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
          case 'mufr':
              if (!lastCV) break
              let [, c, v] = lastCV.split(/[c_ ]/)
              let url = `https://kuranmeali.com/Elfaz.php?sure=${c}&ayet=${v}`
              console.log(url)
              window.open(url, "Kuran")
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
      hideElement(menuT); //evt.preventDefault()
      let t = evt.target, k = Number(t.id)
      if (k) { //modify translation source
        console.log(k, t.textContent)
        if (!transIsChecked()) toggleTrans()
        setStorage('settings', 'source', k)
        if (parent.applyTranslation) 
          parent.applyTranslation()
        else postMessage("translation", "*")
      } else if (t.classList.contains('hareke')) {
        let h = Number(t.id[4])
        if (h<0 || h>QTEXT.length) return
        Q.qur = readSourceData(h, refreshPage)
        setStorage('settings', 'tashkeel', h)
        if (transIsChecked()) toggleTrans()
        checkTrans()
      }
  }
  addEventListener("message", translationListener)
  function translationListener(evt) {
    function setTrans() {
      text.innerHTML = Q.kur.pageToHTML(curPage)
      checkTrans()
    }
    if (evt.data !== "translation") return
    let {snum} = getSourceSettings()
    Q.kur = new KuranText(SOURCE[snum], setTrans)
  }
  menuK.onclick = (evt) => { //menu button
    let t = evt.target
    if (!parent.finder) { //no finder
      openSitePage(t.id, curPage); return
    }
    hideMenus()
    switch (t) {
      case topic: 
        parent.finder.location="konular.html"; break;
      case notes: 
        parent.finder.location="start.html"; break;
      case ders: 
        parent.finder.location="/Kitap/"; break;
      default: openSitePage(t.id, curPage)
    }
  }
  menuV.onclick = (evt) => { //external source menu
      evt.preventDefault()
      if (!menuV.idx) return
      let [c, v] = toCV(menuV.idx)
      openSiteVerse(evt.target.id, c, v)
  }
document.onkeydown = evt => {
      if (!evt.key) return
      else switch (evt.key.toUpperCase()) {
          case 'F1': openSitePage('help'); break
          case 'ESCAPE': hideMenus(); break
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
      hideElement(menuT); hideElement(wordInfo); hideElement(menuV); 
      hideElement(bkgd); //linkA.classList.remove('checked')
  }
  div1.onmouseenter = hideMenus
  div3.onmouseenter = hideMenus
  div2.onclick = e => 
    { if (e.target.tagName !== 'SPAN') hideMenus() }
}
/**
* End of menu functions 
***********************************************/
function checkTrans() {
  function handleCheck(e) {
    let check = e.classList.contains('hareke')? 
        e.id[4] == tnum : e.id == snum
    e.classList.toggle('checked', check)
  }
    let {snum, tnum} = getSourceSettings()
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
  //invoked whenever star menu is shown
  let t = ''
  for (let k of [...bookmarks].reverse()) {
    let c = (k==curPage? ' checked' : '')
    let p = langMgr.PAGE0+nameFromPage(k)
      t += `<span class="menuK${c}">${p}</span>\n`
    }
    starred.innerHTML = t
}
function handlePageNum() {
    bkgd.style.display = "block"
    //input defined in search.js
    input.value = curSura+' '
    inputKey(); setFocus(input)
    recog0.style.display 
      = (recognition && navigator.onLine)? '' : 'none'
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
function toggleDarkMode(mode) {
  function setBackground(elt, col) {
    elt.style.background = col
  }
  function toggleNight(elt, mode) {
    elt.classList.toggle('night', mode)
  }
    toggleNight(sureS, mode)
    toggleNight(cuzS, mode)
    toggleNight(pageA, mode)
    toggleNight(text, mode)
    toggleNight(html, mode)
    toggleNight(dialog, mode)
    let c = mode? "#333" : ""
    setBackground(div0, c)
    setBackground(div1, c)
    setBackground(div2, c)
}

initReader()
