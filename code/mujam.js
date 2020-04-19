"use strict";

// import {VERSION, DATA_URL, EM_SPACE, setPosition, hideElement, 
//     openSitePage, openSiteVerse, fetch_text_then} from './common.js'
// import {VerseRef, RefSet, nPage, encodeLine, labels} from './utilities.js'
// import {toArabic, toBuckwalter} from "./buckwalter.js"

/**
 * div element that shows page info
 */
var bilgi;
/**
 * Array where page refs are stored -- used in table view
 */
var pRefs = [];
/**
 * Map where topic refs are stored -- used in topic view
 */
var tRefs = new Map();
/**
 * Array where word refs are stored -- used in list view
 */
var wRefs = [];
/**
 * Global array to hold the places of Sajda.
 * used in marking sajdah verses
 */
var sajda;
/**
 * child window (or tab) to display Quran
 * the same window is used on each click
 * (this is much better than <a> tag)
 */
window.iqra = undefined
/**
 * base color in the table -- default is blue
 * hue indicates angle in color wheel
 */
var HUE = localStorage.mujamHue || 240

/**
 * Prefix to the title of the page
 */
window.TITLE = 'Mucem'
/**
 * A map holds the letters and its roots.
 * set at report2 @see report2
 */
const letterToRoots = new Map();
/**
 * A map holds the roots and its words.
 * set at report2 @see report2
 */
const rootToWords = new Map();
/**
 * A map holds the roots and its counts.
 * set at report2 @see report2
 */
const rootToCounts = new Map();
/**
 * A map holds the words and its references.
 * set at report2 @see report2
 */
const wordToRefs = new Map();
/**
 * returns Buckwalter code of the current item in menu2
 */
function currentRoot() {
    if (!menu2.value) return null
    let [v] = menu2.value.split(EM_SPACE)
    return toBuckwalter(v)
}

/**
 * Parsing and using remote data. 
 * @see makeMenu
 * 
 * @param {string} t text from remote data.
 */
function report2(t) {
    function convert(s) {
        let [w, n] = s.split(' ')
        let a = toArabic(w)
        //convert space to em-space " "
        return [a, a+EM_SPACE+n] 
    }
    let line = t.split('\n')
    let m = line.length - 1
    console.log(t.length + " chars " + m + " lines");
    let i = 0;
    while (i < m) { //for each line
        let [root, number] = convert(line[i])
        rootToCounts.set(root, number);
        let j = i + 1
        let list = []
        while (j < m) {
            let [xxx, s] = convert(line[j])
            let k = s.indexOf('\t')
            if (k <= 0) break;
            let word = s.substring(0, k)
            let refs = s.substring(k + 1)
            wordToRefs.set(word, refs)
            list.push(word); j++;
        }
        i = j;
        list.sort();
        let ch = root[0]; //first char
        let x = letterToRoots.get(ch);
        if (x) x.push(number);
        else letterToRoots.set(ch, [number]);
        rootToWords.set(number, list);
    }
    let keys = [...letterToRoots.keys()];
    // sort the root list for each letter
    for (let k of keys) letterToRoots.get(k).sort()
    // sort and set menu1 (letters)
    makeMenu(menu1, keys.sort());
    if (!gotoHashRoot()) selectRoot("سجد");
}

/**
 * Make the targeted menu the document has three.(letters, roots, words)
 * The first element  will be selected.
 * 
 * @param {object} m targeted menu object (html)
 * @param {array} a array elements of the menu.
 */
function makeMenu(m, a) { //first item is selected
    if (a) m.innerHTML = "<option selected>" + a.join("<option>");
}
/**
 * Select the letter from the menu, if no parameter entered the letter will 
 * be the menu1 value. Then Build menu2 based on the selected character.
 * @see makeMenu
 * 
 * @param {string} ch letter to be selected (Arabic)
 */
function selectLetter(ch) {
    if (!ch) ch = menu1.value;
    else if (ch == menu1.value) return;
    else menu1.value = ch;
    makeMenu(menu2, letterToRoots.get(ch));
    menu2.value = '';
}
/**
 * select specified root, if undefined the menu2 value will be the selected.
 * 
 * @param {string} root to be seleceted, example: سجد 23
 */
function selectRoot(root, modifyHash=true) { //root in Arabic 
    if (!root) [root] = menu2.value.split(EM_SPACE);
    else if (menu2.value.startsWith(root)) return;
    else {
      selectLetter(root.charAt(0))
      menu2.value = rootToCounts.get(root);
    }
    let cnt = rootToCounts.get(root);
    let lst = rootToWords.get(cnt);
    let nL = lst? lst.length : 0;
    if (lst) makeMenu(menu3, lst);
    if (nL > 1)
        menu3.selectedIndex = -1; //do not select Word
    menu3.disabled = (nL == 1);
    menu3.style.color = (nL == 1 ? "gray" : "");
    //combine refs in lst
    combine.hidden = true;
    if (!modifyHash) return
    //replace special chars
    let b = encodeURI(toBuckwalter(root))
    location.hash = "#r=" + b;
}
/**
 * Select word, if undefined menu3 values will be the selected one.
 * when its used combine will be shown.
 * 
 * get the references from wordToRefs map.
 * 
 * @param {string} word to be selected.
 */
function selectWord(word) { //called by menu3 and list items
    if (!word) word = menu3.value;
    else if (word == menu3.value) return;
    else menu3.value = word;
    combine.hidden = false;
    //let enc = wordToRefs.get(word)
    //parseRefs(word, enc)
    let set = wRefs.find(x => x.name == word)
    if (!set) return
    displayTable(set)
    for (let i of kelimeler.querySelectorAll('li'))
      i.style.backgroundColor =  //set colors
        i.firstElementChild.innerText == word? '#fec' : ''
}
/**
 * Select topic, from menu4
 * 
 * @param {string} topic to be selected.
 */
function selectTopic(topic) { //called by menu4 and list items
    if (!topic) topic = menu4.value;
    else if (topic == menu4.value) return;
    else menu4.value = topic;
    let s = tRefs.get(topic)
    location.hash = s.name +'='+ s.toEncoded()
    //if (s) displayTable(s)
}
/**
 * calculate the index array for given root.
 * 
 * @param {string} root to be displayed
 * @returns {VerseRef[]} Array of VerseRef's
 */
function getReferences(root) {
    let cnt = rootToCounts.get(root);
    let refA = []
    for (let word of rootToWords.get(cnt)) {
        let enc = wordToRefs.get(word)
        let set = RefSet.fromEncoded(word, enc)
        for (let v of set.list) refA.push(v)
        //refA.concat(set.list)  concat returns another Array
        wRefs.push(set)
    }
    return refA.sort((a,b) => (a.index - b.index))
}
/**
 * Make VerseRef array pRefs.
 * 
 * @param {Array} list number Array
 */
function indexToArray(list) {
    pRefs = new Array(nPage + 1)
    for (let v of list) {
        let p = v.page
        if (pRefs[p]) pRefs[p].push(v)
        else pRefs[p] = [v]
    }
}
/**
 * Make wRefs for specified roots
 * 
 * @param {Array} roots Array to be displayed
 */
function parseRoots(roots) { //root array in Arabic
    wRefs = []
    let [word, ...rest] = roots
    let i1 = getReferences(word) //combined
    if (rest) { //multiple roots, single RefSet
        for (let r of rest) {
            let i2 = getReferences(r)
            //find intersection
            i1 = i1.filter(v => //i2.includes(v)
                 i2.find(x => x.index == v.index))
        }
        word = roots.map(x => rootToCounts.get(x)).join(' + ')
    }
    let set = new RefSet(word, i1)
    if (rest.length > 0) wRefs = [set]
    return set
}

/**
 * Add given topic to tRefs, menu4, and localStorage
 * 
 * @param {string} topic
 * @param {string} enc Encoded indexes
 */
function addTopic(topic, enc) {
    let s = tRefs.get(topic)
    if (s) {
        menu4.value = topic
        return s
    }
    s = RefSet.fromEncoded(topic, enc)
    tRefs.set(topic, s)
    localStorage.topics 
        = topic+'='+enc+'\n'+ localStorage.topics
    menu4.innerHTML = menu4.innerHTML
        .replace('>','>'+topic+'</option><option>')
    console.log(topic, 'inserted to tRefs')
    return s
}
/**
 * Make tRefs & menu4 from localStorage.topics
 */
function readTopics() {
    tRefs.clear(); let a = []
    for (let s of localStorage.topics.split('\n')) {
        let [topic, enc] = s.split('=')
        tRefs.set(topic, RefSet.fromEncoded(topic, enc))
        a.push(topic)
    }
    makeMenu(menu4, a)
}
/**
 * Build and display the HTML list.
 * 
 * @param {RefSet[]} refs Array
 * @param {Element} liste to be modified
 */
function displayList(refs, liste) {
    const MAX_REFS = 8  //hide larger lists
    const SPAN = '<span class=item>', _SPAN = '</span>'
    let BUTTON = '', _BUTTON = ''
    if (refs.length > 1) {
        BUTTON = '<button>'; _BUTTON = '</button>'
    }
    let s = ''
    for (let x of refs) { // x is {name, list}
        s += '<li>'+BUTTON+ x.name +_BUTTON+'<div>'
        for (let y of x.list) // y is VerseRef
            s += SPAN+ y.cv +_SPAN
        s += '</div>\n'
    }
    liste.innerHTML = s
    for (let x of liste.querySelectorAll('.item')) {
        x.onmouseenter = doHover
        x.onmouseleave = hideBilgi
    }
    if (!BUTTON) return
    for (let x of liste.querySelectorAll('button')) {
        let div = x.nextElementSibling
        if (div.children.length > MAX_REFS) {
            x.style.backgroundColor = 'yellow'
            x.parentElement.style.backgroundColor = '#eee'
            div.hidden = true
        }
        x.onclick = () => {
            if (div.hidden) {
                x.style.backgroundColor = ''
                x.parentElement.style.backgroundColor = ''
                div.hidden = false
            } 
            selectWord(x.innerText)
        } 
    }
}
    /**
 * Build and display the HTML table. Uses global Array pRefs
 * 
 * @param {RefSet} set to be displayed
 */
function displayTable(set) {
    // put three zeros on the first of the number (K)
    function threeDigits(k) { //same as (""+k).padStart(3,"0")
        let s = "" + k
        while (s.length < 3) s = "0" + s
        return s
    }
    // get colour based on the number of verses in a page.
    function toColor(n) {
        if (n == 0) return ""
        let L = 96 - 6 * Math.min(n, 16)
        return "background: hsl("+HUE+", 100%, "+L+"%)"
    }
    indexToArray(set.list)
    // m number of rows, 20 pages per row.
    const m = 30, n = 20
    let row = "<th>Sayfa</th>"
    for (let j = 1; j <= n; j++) {
        row += "<th>" + (j % 10) + "</th>" //use last digit
    }
    let text = "<tr>" + row + "</tr>"
    let pn = 0, numC = 0, numP = 0  //counters
    for (let i = 1; i <= m + 1; i++) {
        let z = i > m ? m : i
        let s2 = '' //unused "<span class=t1>Cüz " + z + "</span>"
        row = "<th class=first>" +threeDigits(pn)+ s2 + "</th>"
        let U = i > m ? 4 : n
        for (let j = 1; j <= U; j++) {
            pn++  // pn == 20*(i-1)+j  page number
            let c = 0, L = pRefs[pn]
            if (L) { //update counts
                c = L.length
                numC += c; numP++
            }
            let ch = sajda.includes(pn)? "۩" : "&nbsp;"
            row += "<td style='" +toColor(c)+"'>"+ ch + "</td>"
        }
        if (i > m) { //use th for the last row
          row += "<th colspan=13>Iqra "+VERSION+" (C) 2019 MAE</th>"
           +"<th id=corpus colspan=3 onClick=doClick2()>Corpus</th>"
        }
        text += "<tr>" + row + "</tr>"
    }
    // end of table
    tablo.innerHTML = text
    tablo.oncontextmenu = showMenuK
    document.title = TITLE + " -- " + set.name
    let pages = numP + " sayfa"
    out1.innerText = pages
    out2.innerText = pages
    out3.innerText = set.name
    out4.innerText = pages
    console.log(pages, set)
    menu3.hidden = wRefs.length == 1
    for (let x of tablo.querySelectorAll('td')) {
        x.onmouseenter = doHover
        x.onmouseleave = hideBilgi
    }
    bilgi = document.createElement('div') //lost within table
    bilgi.id = 'bilgi'; tablo.append(bilgi)
    bilgi.onclick = doClick
}

function hideBilgi() {
    if (!menuK.style.display) hideElement(bilgi);
}

/**
 * Open the quran webPage after checking its event.
 * 
 * @param {*} evt get the event trigger. 
 */
function doClick(evt) {
    //do not handle if menuK is on or bilgi is off
    if (menuK.style.display || !bilgi.style.display) return
    evt.preventDefault()
    let [nam, refs] = bilgi.innerText.split(EM_SPACE)
    let [xx, p] = nam.split(/\.| /)  //dot or space
    let h;
    if (pRefs[p]) { //use first reference & root
        let [cv] = refs.split(' ')
        h = "#v="+cv
        let d = currentRoot() //decodedHash()
        //if (!d.startsWith('#')) 
        if (d && div4.hidden) h += "&r="+d
    } else { //use page number
        h = "#p="+p;
    }
    console.log(h); hideMenus()
    window.iqra = window.open("reader.html"+h, "iqra")
}
/**
 * Open Corpus quran link that related to the selected word specific word. 
 * 
 */
function doClick2() {
    const REF = "http://corpus.quran.com/qurandictionary.jsp";
    let p = "";
    if (menu2.value) p = "?q=" + currentRoot()
    console.log("Corpus" + p);
    window.open(REF + p, "Kuran")  //, "resizable,scrollbars");
}
/**
 * Use the hash part of URL in the address bar
 *
 * @returns true if hash part of URL is not empty
 * 
 */
function gotoHashRoot() {
  let h = decodedHash()
  if (!h) return false
  showSelections(false); let set
  if (!h.startsWith('r=')) { //given topic
    let [topic, enc] = h.split('=')
    //parseRefs(topic, enc)  use tRefs
    set = addTopic(topic, enc)
    showTopics(true)
    displayList([set], konular)
  } else { //given roots
    h = h.substring(2)  //strip 'r='
    let roots = h.split('&r=').map(toArabic)
    set = parseRoots(roots)
    selectRoot(roots[0], false)
  }
  displayTable(set)
  return true
}
/**
 * Initialize the globals
 */
function initMujam() {
    version.innerText = 'Iqra '+VERSION;
    //showSelections(false);
sajda = [175, 250, 271, 292, 308, 333, 364, 378, 415, 453, 479, 527, 589, 597, 999]
    let letters = [];
    for (let c=1575; c<1609; c++) letters.push(String.fromCharCode(c));
    makeMenu(menu1, letters); 
    try {
        out2.innerText = "Reading data"
        // const DATA_URL = "https://maeyler.github.io/Iqra3/data/" in common.js
        fetch_text_then(DATA_URL+"refs.txt", report2)
    } catch(err) { 
        out2.innerText = ""+err;
    }
    if (!localStorage.topics)
        localStorage.topics = 'Secde=1w82bu2i62ne2s430l38z3gg3pq42y4a74qm5k15q5'
    readTopics(); window.name = "finder"
    window.onhashchange = gotoHashRoot
    showS.onclick  = () => {showSelections(true)}
    showT.onclick  = () => {showTopics(true)}
    menu1.onchange = () => {selectLetter()}
    menu2.onchange = () => {selectRoot()}
    menu3.onchange = () => {selectWord()}
    combine.onclick= () => {gotoHashRoot()}
    menu4.onchange = () => {selectTopic()}
    back.onclick   = () => {history.back()}
    ekleD.onclick  = () => {showDialog('', 'Ekle', topicFromDialog)}
    editD.onclick  = () => {showDialog(menu4.value, 'Değiştir', replaceTopic)}
    deleD.onclick  = () => {deleteTopic(menu4.value, 'confirm')}
    menuFn()
}

  /**
  * Menu functions
  */
function menuFn() {
  function menuItem(m) {
      if (m == 'Y' || m == '?')
        openSitePage('Y')
      let s = bilgi.innerText
      if (!s) return
      let [nam, refs] = s.split(EM_SPACE)
      if (!refs) return
      let [cv] = refs.split(' ')
      let [c, v] = cv.split(':')
      openSiteVerse(m, c, v)
      hideMenus()
  }
  menuK.onclick = (evt) => {
      evt.preventDefault()
      menuItem(evt.target.innerText[0])
  }
  document.onclick = (evt) => {
      if (!menuK.style.display) {
        let t = evt.target.tagName
        if (t == "TD" || t == "SPAN") return
      }
      hideMenus(); evt.preventDefault()
  }
  document.onkeydown = (evt) => {
    if (evt.key == 'Escape') hideMenus()
    else if (evt.key == 'F1') 
      openSitePage('Y') //Yardım
    else if (menuK.style.display) 
      menuItem(evt.key.toUpperCase())
  }
  window.hideMenus = () => { 
      hideElement(menuK); hideElement(bilgi)
  }
  window.showMenuK = (evt) => { 
      evt.preventDefault(); //hideElement(bilgi)
      let y = Math.max(evt.clientY-200, 0)
      setPosition(menuK, evt.clientX, y)
  }
}

function showSelections(show) {
    div0.hidden = show
    div1.hidden = !show
    div4.hidden = true
    if (show) displayList(wRefs, kelimeler)
}
function showTopics(show) {
    div0.hidden = show
    div1.hidden = true
    div4.hidden = !show
    if (show) selectTopic()
}
function showDialog(topic, button, callback) {
  function checkInput() {
    dError.innerText = ''
    dAccept.disabled = true
    let s = tRefs.get(dTopic.value)
    if (s && s.name != topic)
        dError.innerText = 'Bu konu var zaten'
    else if (dTopic.value && dRefs.value)
        dAccept.disabled = false
  }
    dialog.innerHTML = 
    'Konu &emsp;<input id=dTopic type=text> '
    +'<span id=dError></span><BR><BR>'
    +'Ayetler <BR><input id=dRefs type=text><BR><BR>'
    +'<input type=button id=dAccept disabled>'
    +'<input type=button id=dClose>'
    dTopic.value = topic
    dTopic.oninput = checkInput
    let s1 = tRefs.get(topic)
    dRefs.value = s1? s1.cvList : ''
    dRefs.oninput = checkInput
    dAccept.value = button
    dAccept.onclick = callback
    dClose.value = 'x'
    dClose.onclick = () => {modal.hidden = true}
    modal.onkeydown = (evt) => {
        if (evt.key == 'Escape')
            dClose.onclick()
        if (evt.key == 'Enter' && !dAccept.disabled)
            dAccept.onclick()
    }
    modal.hidden = false
    dTopic.focus()
}
function topicFromDialog() {
    modal.hidden = true
    let topic = dTopic.value
    let enc = encodeLine(dRefs.value)
    addTopic(topic, enc)
    let h = '#'+topic +'='+ enc
    if (decodedHash().includes(topic))
        history.replaceState(null, '', h) 
    else location.hash = h
}
function replaceTopic() {
    deleteTopic(menu4.value); topicFromDialog()
}
function deleteTopic(t, conf) {
    let a = []
    if (conf && !confirm(t+' silinecek')) return
    for (let s of localStorage.topics.split('\n')) {
        let [topic] = s.split('=')
        if (topic != t) a.push(s)
    }
    localStorage.topics = a.join('\n')
    readTopics()
}
function getPageOf(td) {
    let r = td.parentElement.rowIndex;
    let p = 20*(r-1) + td.cellIndex;
    return p
}
function doHover(evt) {  //listener for each td and span element
    if (menuK.style.display) return
    let cls, ref, cw
    if (evt.target.tagName == 'SPAN') {
        let cv = evt.target.innerText
        ref = VerseRef.fromChapVerse(cv)
        cls = 't2>' //backgroundColor yellow
        cw = kelimeler.clientWidth
    } else { // TD
        let p = getPageOf(evt.target)
        if (pRefs[p]) {
            let [f, ...L] = pRefs[p]
            ref = f.toString()
            if (L.length)  //convert Array to string
              ref += ' '+L.map(x => x.cv).join(' ')
                  + EM_SPACE +'('+ (L.length+1) +')'
            cls = 't2>' //backgroundColor
        } else { //no ref on this page
            ref = labels[p]
            cls = 't1>' //no color
        }
        cw = tablo.clientWidth
    }
    bilgi.innerHTML = "<div class="+ cls + ref +"</div>"
    evt.target.append(bilgi); 
    //center over evt.target
    //setPosition(bilgi, evt.clientX, 20, 180)
    let mw = bilgi.clientWidth || 180
    let x0 = evt.target.offsetLeft + 10
    let dx = Math.max(-mw/2, -x0)  
    //if (x0-mw/2 < 0) dx = -x0
    cw = (cw || 460) + 16
    dx = Math.min(dx, cw-mw-x0)
    //if (x0+mw/2 > cw) dx = cw-mw-x0
    bilgi.style.left = (dx)+'px'
    let y = evt.target.clientTop + evt.target.clientHeight
    bilgi.style.top = (y-1)+'px'
    bilgi.style.display = "block"
}

function test(prop='index') {
    if (div1.hidden) showSelections(true)
    let testEval = (a) => {
      let e = eval(a); console.log(a, e); return e
    }
    //a and b contain the same objects
    let a = testEval('pRefs.flat() //already sorted')
    let b = testEval('wRefs.map(x => x.list).flat()')
    //convert a and b to string
    b.sort((x, y) => x.index - y.index)
    let testJoin = (a) => a.map(x => x[prop]).join(' ')
    console.log(a = testJoin(a))
    console.log(b = testJoin(b))
    console.log(a == b)
}

initMujam()

// export {pRefs, tRefs, wRefs, rootToWords, wordToRefs, test}