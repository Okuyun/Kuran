function doRoot(h) {
    if (!h) return
    h = h.replace(/\s+/g, '&r=')
    window.open('mujam.html#'+h, 'finder')
}
function doText(h) {
    if (!h) return
    window.open(FINDER+'#'+h, 'finder')
}
function doOpen(h) {
    if (!h) return
    window.open('reader.html#'+h, 'iqra')
}
function doOmni() {
    let t = omni.value
    if (/^[vp]=/.test(t))
      doOpen(t) //t starts with v or p
    else if (/^r=/.test(t))
      doRoot(t) //t starts with r
    else if (/^[bt]=/.test(t))
      doText(t) //t starts with b or t
    else window.open(t, 'finder') //t contains URL
    if (window.bkgd) hideElement(bkgd)
}
function checkNumber(str) {
    //find numbers, \D means not digit
    let [c, v] = str.split(/\D/)
    if (c < 1) c = '1'
    let hash, text, info
    if (v === '') {
      hash = 'p='+pageOf(c, 1)
      text = main.data2 //chapter
      info = sName[c]
    } else if (v) { //c:v
      if (c>114) c = '114'
      hash = 'v='+c+':'+v
      text = main.data3 //verse
      info = sName[c] +' '+v
    } else { //page
      if (c>604) c = '604'
      hash = 'p='+c
      text = langMgr.PAGE
      info = c
    }
    return {hash, text, info}
}
function checkRoots(str) {
  function toBuck(s) {
    const BUCK = 'AbtvjHxd*rzs$SDTZEgfqklmnhwy'
    let b = toBuckwalter(s) //s is Arabic
    if (!b.includes('?')) return b
    for (let c of s) //s is Buckwalter
        if (!BUCK.includes(c)) return false
    return s
  }
    let a = []
    for (let s of str.split(/\s/)) {
        let t = toBuck(s)
        if (!t || !Q.roots.contains(t)) return false
        a.push('r='+t)
    }
    return a.join('&')
}
function inputKey(evt) {
    let str = input.value
    if (str.length == 0) {
        main.disabled = true
        omni.value = ''; return
    }
    main.disabled = false
    // \W stands for "negated word character"
    // \s stands for "whitespace character"
    // \D is the same as [^\d] "negated digit"
    if (/^\d+(\D\d*)?$/.test(str)) { //number
        let {hash, text, info} = checkNumber(str)
        info2.innerText = info
        main.innerText = text
        omni.value = hash
    } else { //text
        let x = checkRoots(str) //roots or false
        main.innerText = x ? main.data4 :
          expert.open ? "Buck" : main.data5
        info2.innerText = x || expert.open ?
          toArabic(str) : ' ' //&nbsp;
        omni.value = x ? x :
          expert.open ? 'b='+str : 't='+str
    }
}
function enterKey(evt) {
    evt.stopPropagation()
    if (evt.key == 'Enter') 
      switch (evt.target) {
        case input: case omni:
          doOmni(); break;
      }
}

expert.ontoggle = inputKey;
question.onclick= () => {explain.hidden = !explain.hidden}
