"use strict";

// import {VERSION, EM_SPACE, setPosition, hideElement, 
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
 * Array where word refs are stored -- used in list view
 */
var wRefs = [];
/**
 * Global array to hold the page numbers of Sajda.
 */
const sajdaP = [175, 250, 271, 292, 308, 333, 364, 
            378, 415, 453, 479, 527, 589, 597, 999]

const notes = new Notes('notesM')

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
 */
const letterToRoots = new Map();
/**
 * A map holds the roots and its words.
 */
const rootToWords = new Map();
/**
 * A map holds the roots and its counts.
 */
const rootToCounts = new Map();
/**
 * A map holds the words and its references.
 */
const wordToRefs = new Map();
/**
 * Buckwalter code of the current root(s)
 */
var currentRoots = []
// function currentRoot() {
//     if (!menu2.value) return null
//     let [v] = menu2.value.split(EM_SPACE)
//     return toBuckwalter(v)
// }
/**
 * display alert and throw error
 */
function notFound(root) {
    const ERR = 'Mucemde bulunamadı: '+root
    alert(ERR); throw ERR
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
    if (!cnt) notFound(root)
    let lst = rootToWords.get(cnt);
    if (!modifyHash) return
    //replace special chars
    let b = encodeURI(toBuckwalter(root))
    notes.display(b) //in common.js
    location.hash = "#r=" + b;
}
/**
 * Select given word
 * get the references from wordToRefs map.
 * 
 * @param {string} word to be selected.
 */
function selectWord(word) { //called by list items
    notes.edit(false)
    let set = wRefs.find(x => x.name == word)
    if (!set) return
    displayTable(set)
    for (let i of kelimeler.querySelectorAll('li'))
      i.style.backgroundColor =  //set colors
        i.firstElementChild.innerText == word? 'yellow' : ''
}
/**
 * calculate the index array for given root.
 * 
 * @param {string} root to be displayed
 * @returns {VerseRef[]} Array of VerseRef's
 */
function getReferences(root) {
    let cnt = rootToCounts.get(root);
    if (!cnt) notFound(root)
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
 * showS button is clicked
 */
function hideList(hide) {
    div0.hidden = !hide
    div1.hidden = hide
    kelimeler.hidden = hide
}
/**
 * Build and display the HTML list.
 * 
 * @param {RefSet[]} refs Array
 * @param {Element} liste to be modified
 */
function displayList(refs, liste) {
    // showS.hidden = refs.length == 1
    // kelimeler.hidden = refs.length > 1
    const MAX_REFS = 50  //hide larger lists
    const SPAN = '<span class=item>', _SPAN = '</span>'
    let s = ''
    for (let x of refs) { // x is {name, list}
        let but = refs.length == 1? '' :
            '<button>'+ x.name +'</button>&emsp;'
        s += '<li>'+but+'<span>'
        let lastCV =''
        for (let y of x.list) // y is VerseRef
            if (y.cv !== lastCV) {
                s += SPAN+ y.cv +_SPAN
                lastCV = y.cv
            }
        s += '\n' //'</span>\n'
    }
    function doClick3(evt) {
        let cv = evt.target.innerText
        bilgi.innerText = VerseRef.fromChapVerse(cv)
        doClick(evt)  //transfer event from x to bilgi
    }
    liste.innerHTML = s
    for (let x of liste.querySelectorAll('.item')) {
        x.onclick = doClick3  //doHover
        x.onmouseleave = hideBilgi
    }
    if (refs.length == 1) return //no buttons
    for (let x of liste.querySelectorAll('button')) {
        let li = x.parentElement
        let span = x.nextElementSibling
        if (span.children.length > MAX_REFS) {
            x.style.backgroundColor = 'yellow'
            span.hidden = true
        }
        x.onclick = () => {
            if (li.style.backgroundColor) {
                gotoHashRoot()  //redraw page
            } else {
                if (span.hidden) {
                    li.style.backgroundColor = ''
                    x.style.backgroundColor = ''
                    span.hidden = false
                } 
                selectWord(x.innerText)
            }
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
        if (n == 0) return "''"
        let L = 96 - 6 * Math.min(n, 16)
        return "'background-color: hsl("+HUE+", 100%, "+L+"%)'"
    }
    indexToArray(set.list)
    // m number of rows, 20 pages per row.
    const m = 30, n = 20
    let row = "<th>"+PAGE+"</th>"
    for (let j = 1; j <= n; j++) {
        row += "<th>" + (j % 10) + "</th>" //use last digit
    }
    let text = "<tr class=first>" + row + "</tr>"
    let pn = 0, numC = 0, numP = 0  //counters
    for (let i = 1; i <= m + 1; i++) {
        // let z = i > m ? m : i
        let s2 = '' // "<span class=t1>Cüz " + z + "</span>"
        row = "<th>" +threeDigits(pn)+ s2 + "</th>"
        let U = i > m ? 4 : n
        for (let j = 1; j <= U; j++) {
            pn++  // pn == 20*(i-1)+j  page number
            let c = 0, L = pRefs[pn]
            if (L) { //update counts
                c = L.length
                numC += c; numP++
            }
            let ch = sajdaP.includes(pn)? //"۩" : "&nbsp;"
                " class=sajda>" : ">"
            row += "<td style="+toColor(c)+ ch + "</td>"
        }
        if (i > m) { //use th for the last row
            row += "<th id=last></th>" 
            +"<th colspan=11>Iqra "+VERSION+" (C) 2019 MAE</th>"
            +"<th colspan=3><a href='"
            +"http://corpus.quran.com/qurandictionary.jsp"
            let [first] = currentRoots
            row += (first? "?q=" + first : '')
            +"' title='Kaynak site' target=Kuran>Corpus</a></th>"
            +"<th>&nbsp;</th>"       
        }
        text += "<tr>" + row + "</tr>"
    }
    // end of table
    notes.edit(false) //close noteBox
    let nb = document.querySelector('#noteBut')
    nb.remove() //we need a single instance in the last cell
    tablo.innerHTML = text
    let last = tablo.querySelector('#last')
    last.append(nb) //to the table again
    tablo.oncontextmenu = showMenuK
    document.title = TITLE + " -- " + set.name
    let str = numP +' '+(numP>1? PAGES : PAGE)
    out1.innerText = str
    out2.innerText = str
    out3.innerText = set.name
    console.log(str, set)
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
    //do not handle if menuK is on --or bilgi is off
    if (menuK.style.display /* || !bilgi.style.display */) return
    evt.preventDefault()
    let [nam, refs] = bilgi.innerText.split(EM_SPACE)
    let [xx, p] = nam.split(/\.| /)  //dot or space
    let h;
    if (pRefs[p]) { //use first reference & root
        let [cv] = refs.split(' ')
        h = "#v="+cv
        let d = currentRoots.join('&r=')
        if (d) h += '&r='+d
    } else { //use page number
        h = "#p="+p;
    }
    console.log(h); hideMenus()
    window.iqra = window.open("reader.html"+h, "iqra")
}
/**
 * Use the hash part of URL in the address bar
 *
 * @returns true if hash part of URL is not empty
 * 
 */
function gotoHashRoot() {
    let h = decodedHash()
    if (!h || !h.startsWith('r=')) 
      return false
    //else given roots
    h = h.substring(2)  //strip 'r='
    currentRoots = h.split('&r=')
    let roots = currentRoots.map(toArabic)
    let set = parseRoots(roots)
    selectRoot(roots[0], false)
    displayList(wRefs, kelimeler)
    displayTable(set)
    return true
}
/**
 * Initialize the globals
 */
function initMujam() {
    version.innerText = 'Iqra '+VERSION;
    let letters = [];
    for (let c=1575; c<1609; c++) letters.push(String.fromCharCode(c));
    makeMenu(menu1, letters); 
    try {
        out2.innerText = "Reading data"
        // const DATA_URL = "https://maeyler.github.io/Iqra3/data/" 
        fetch_text_then("data/refs.txt", report2)
    } catch(err) { 
        out2.innerText = ""+err;
    }
    window.name = "finder"
    window.onhashchange = gotoHashRoot
    showS.onclick  = () => {hideList(false)}
    menu1.onchange = () => {selectLetter()}
    menu2.onchange = () => {selectRoot()}
    noteBut.onclick= () => {notes.edit()} //in common.js
    combine.onclick= () => {hideList(true)}
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
        if (t=="A" || t=="TD" || t=="SPAN") return
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

function getPageOf(td) {
    let r = td.parentElement.rowIndex;
    let p = 20*(r-1) + td.cellIndex;
    return p
}
function doHover(evt) {  //listener for each td and span element
    if (menuK.style.display) return
    let cls, ref, cw
    { // TD
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
    bilgi.style.top = (y-3)+'px'
    bilgi.style.display = "block"
}

try {
    initMujam()
} catch (e) {
    console.error(e)
    alert(e)
}


// export {pRefs, wRefs, rootToWords, wordToRefs}