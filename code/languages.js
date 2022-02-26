"use strict";
function currentLanguage() {
    return localStorage.language
        || navigator.language.substring(0,2);
}

//Each panel uses a separate instance of this class
class LangManager {
    constructor(callback) {
        this.callback = callback || (() => null)
        this.applyLanguage()
        let keys = Object.keys(localization)
        let next = {}, i=0;
        while (i < keys.length-1) {
           next[keys[i]] = keys[i+1]; i++
        }
        next[keys[i]] = keys[0]; this.next = next
        addEventListener("message", languageListener)
    }
    applyLanguage() {
        //localization is defined in each panel
        let str = localization[currentLanguage()] 
               || localization.en   //default
        for (let x of parseLanguage(str)) {
          if (!x.elt || !x.attr) continue
        // x.elt.setAttribute(x.attr, x.val)
          x.elt[x.attr] = x.val
        }
        this.callback()
    }
    nextLanguage() {
     // let n = currentLanguage() === 'tr'? 'en' : 'tr'
        this.changeLanguage(this.next[currentLanguage()])
    }
    changeLanguage(lan) {
        localStorage.language = lan
        if (parent.applyLanguage) 
            parent.applyLanguage()
        else this.applyLanguage()
    }
    static adjustDirection(elt) {
        elt.style.direction = currentLanguage()=='ar'? 'rtl' : 'ltr'
    }
}
function languageListener(e) {
    // console.log('* listener *', e.data, window.name)
    if (e.data !== "language") return
    langMgr.applyLanguage()
}
function parseLanguage(str) {
    let a = str.split('\n'), b = []
    for (let s of a) {
        let [id, attr, val] = s.split('\t')
        let elt = document.getElementById(id)
        if (elt) b.push({elt, attr, val})
        else console.error(id+' not found')
    }
    return b
}
