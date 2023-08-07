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
    let hash = '', text = main.data3 //verse
    if (v === '') {
        v = 1; text = main.data2 //chapter
    }
    if (c < 1) c = '1'
    if (v) { //c:v
      if (c>114) c = '114'
      hash = 'v='+c+':'+v
    } else { //page
      if (c>604) c = '604'
      hash = 'p='+c; text = langMgr.PAGE
    }
    return {hash, text}
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
        let n = s.length
        if (n<3 || n>4) return false
        let t = toBuck(s)
        if (!t) return false
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
        let {hash, text} = checkNumber(str)
        main.innerText = text
        omni.value = hash
    } else { //text
        let x = checkRoots(str) //roots or false
        main.innerText = x ? main.data4 :
          expert.open ? "Buck" : main.data5
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
