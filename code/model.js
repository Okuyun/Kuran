"use strict";
class KuranData {
    constructor(url, callback) {
      //cannot use function because of "this"
      let process = (tt) => {
        // console.log(tt.length, url) // => 874956
        let a = ('\n'+tt).replace(/\|/g, '. ').split(/\n\d+\. /)
        //trim the credits at the end
        a[6236] = a[6236].split(/\n/)[0]
        this.data = a; this.loaded = true
        if (callback) callback(a)
      }
        this.url = url; this.data = []
        fetch_text_then(url, process)
    }
    chapName(c) { return '<br>('+c+') '+sName[c]+' Suresi' }
    get besmele() { return 'Bismillahirrahmanirrahim' }
    verseToHTML(id, s) {
      return '<span id='+id+'>'+s+'</span><BR>'
    }
    pageToHTML(p) {
      let newChapter = () => {
        let br = i==index[p]+1? '' : '<BR>'; //semicolon required
        [c, v] = toCV(i)
        out.push(br+'<div class=divider>'+this.chapName(c)+'</div>')
        if (c!=1 && c!=9)
          out.push('<div class=besmele>'+this.besmele+'</div>')
      }
        let i = index[p]+1 //first verse on page
        let k = index[p+1] //last verse on page
        let [c, v] = toCV(i), out = []
        while (i <= k) { //for each verse x
          let s = this.getVerse(i)
          if (s.startsWith('1.')) newChapter()
          let id = '_'+c+'_'+v
          out.push(this.verseToHTML(id, s))
          i++; v++
        }
        return out.join('\n')
    }
    getVerse(i) { return this.data[i] }
    toString() { return url }
}
class QuranData extends KuranData {
    constructor(url, callback) { super(url, callback) }
    chapName(c) { return ' سورة '+sName[c] }
    get besmele() { return 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' }
    verseToHTML(id, s) {
      let [n,...a] = s.split(/\.? /)  //divide into words
      // a.length-- //skip last char '\n'
      s = a.map(w => '<span>'+w+'</span>').join(' ')
        + ' ﴿'+numberToArabic(n)+'﴾ '
      return '<span id='+id+'>'+s+'</span>' //no <BR>
    }
}
