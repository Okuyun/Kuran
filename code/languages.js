"use strict";
//Each panel uses a separate instance of this class
class LangManager {
    constructor() {
        this.lang = localStorage.language
         || navigator.language.substring(0,2);
        this.applyLanguage()
        addEventListener("message", languageListener)
    }
    applyLanguage() {
        let str = languageStrings(this.lang)
        for (let x of parseLanguage(str)) {
          if (!x.elt || !x.attr) continue
        // x.elt.setAttribute(x.attr, x.val)
          x.elt[x.attr] = x.val
        }
    }
    nextLanguage() {
        let n = this.lang === 'tr'? 'en' : 'tr'
        this.changeLanguage(n)
    }
    changeLanguage(str) {
        this.lang = str
        localStorage.language = str
        postMessage("language", "*")
    }
}
function languageListener(e) {
    console.log('* languageListener *', e.data)
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

function languageStrings(lang) {
    if (lang === 'tr') return start_TR
    else return start_EN //default
}
const start_TR =
`head	innerText	Kuran-ı Kerim
intro	innerText	Iqra yazılımı ile Kuran-ı Kerim'i farklı yollardan keşfedin: İstenen sayfayı gösterin, aradığınız kelimeleri bulun, ya da Arapça kelime kökleri ile arayın. Aşağıda istediğiniz yöntemle başlayabilirsiniz.
lab1	innerText	Mushafta göster (Sayfa veya Sure:Ayet)
page	placeholder	378 veya 27 30
page	title	1-604 arasında sayfa numarası ya da sure-ayet numaraları
star	title	En son işaretlenen sayfa
last	title	En son açılan sayfa
lastText	innerText	Sayfa
lab2	innerText	Rehberde bul (Arapça ya da meal) 
text	placeholder	Aranacak metin
text	title	Bu alana girilen metin Rehber yazılımı ile aranır
lab3	innerText	Mucemde bul
root	placeholder	ktb Elm
root	title	Birden fazla kök aranacaksa boşluk ile ayrılmalı
search	title	Link adresini kullan
search	innerText	Bul
clear	title	Girilen verileri sil
clear	innerText	Sil
topic	innerText	Konular
notes	innerText	Notlar
help	innerText	Yardım
mark	title	Yer işaretlerini yönetin
mark	innerText	Yıldızlar
days	innerText	30 gün
ders	innerText	Dersler
offline	innerText	Internet kapalı iken bazı özellikler çalışmaz
summ	title	Buckwalter kodunu göster/gizle
buck	title	Buckwalter kodu -- alfabetik sıra
omni	title	Linki ilk harf belirler: /Mushaf: p=… v=… /Mucem: r=… /Rehber: t=… b=…/`

const start_EN = 
`head	innerText	The Noble Quran
intro	innerText	Discover the Noble Quran using Iqra software: Display the desired page, search some text in the Book, or find derivatives of given roots. You may start with any method shown below.
lab1	innerText	Display in the Book
page	placeholder	378 or 27 30
page	title	Page number (1-604) or Chapter and verse numbers
star	title	Page with the latest bookmark
last	title	Page opened latest
lastText	innerText	Page
lab2	innerText	Search using Finder
text	placeholder	text to find
text	title	Text entered here will be searched verbatim using Finder
lab3	innerText	Search using Mujam
root	placeholder	ktb Elm
root	title	Use space to separate roots (in Buckwalter code)
search	title	Use the address shown in the Link below
search	innerText	Search
clear	title	Clear all data entered on this page
clear	innerText	Clear
topic	innerText	Topics
notes	innerText	Notes
help	innerText	Help
mark	title	Manage bookmarks
mark	innerText	Stars
days	innerText	30 gün
ders	innerText	Dersler
offline	innerText	Internet is required for some features
summ	title	Show/Hide Buckwalter code
buck	title	Buckwalter code -- dictionary order
omni	title	First letter determines the link: /Book: p=… v=… /Mujam: r=… /Finder: t=… b=…/`

const langMgr = new LangManager()
